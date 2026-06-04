/**
 * Server-only site discovery for strategic internal links.
 * Fetches the current page (and sitemap when needed) to extract real on-site URLs.
 */
import {
  MIN_STRATEGIC_INTERNAL_LINKS,
  normalizeInternalUrl,
  rankStrategicInternalLinks,
  type LinkDiscoverySignals,
  type StrategicLinkContext,
} from "./internalLinkSuggestions";
import type { DestinationBriefInput } from "./types";

const FETCH_TIMEOUT_MS = 8_000;
const MAX_RESPONSE_BYTES = 600_000;
const USER_AGENT = "ContentBriefAssistant/1.0";

export interface SiteLinkDiscoveryResult {
  rankedLinks: string[];
  linkSignals: LinkDiscoverySignals;
}

function isSameOrigin(candidate: URL, origin: URL): boolean {
  return candidate.origin === origin.origin;
}

function shouldSkipPath(pathname: string): boolean {
  return /\/(privacy|terms|login|signin|signup|admin|cart|checkout|search|tag|feed|wp-|\.pdf|\.jpg|\.png)(\/?|$|\?)/i.test(
    pathname,
  );
}

function resolveHref(rawHref: string, base: URL): string | null {
  const trimmed = rawHref.trim();
  if (!trimmed || trimmed.startsWith("#") || /^mailto:|^tel:|^javascript:/i.test(trimmed)) return null;

  try {
    const resolved = new URL(trimmed, base);
    if (!isSameOrigin(resolved, base)) return null;
    if (shouldSkipPath(resolved.pathname)) return null;
    return normalizeInternalUrl(resolved.href);
  } catch {
    return null;
  }
}

function extractHrefLinks(htmlFragment: string, base: URL): string[] {
  const links = new Set<string>();
  const hrefPattern = /href\s*=\s*["']([^"']+)["']/gi;

  for (const match of htmlFragment.matchAll(hrefPattern)) {
    const href = match[1];
    if (!href) continue;
    const resolved = resolveHref(href, base);
    if (resolved) links.add(resolved);
  }

  return [...links];
}

function extractTaggedBlocks(html: string, tagNames: string[]): string[] {
  const blocks: string[] = [];
  for (const tag of tagNames) {
    const pattern = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
    for (const match of html.matchAll(pattern)) {
      if (match[0]) blocks.push(match[0]);
    }
  }
  return blocks;
}

function extractPatternBlocks(html: string, pattern: RegExp): string[] {
  return [...html.matchAll(pattern)]
    .map((match) => match[0])
    .filter((block): block is string => Boolean(block));
}

/** Parses HTML into navigation, in-page, and all same-origin link signals. */
export function parseHtmlLinkSignals(html: string, pageUrl: string): LinkDiscoverySignals & { allPageLinks: string[] } {
  let base: URL;
  try {
    base = new URL(pageUrl);
  } catch {
    return { navigationLinks: [], inPageLinks: [], allPageLinks: [] };
  }

  const allPageLinks = extractHrefLinks(html, base);

  const navigationBlocks = [
    ...extractTaggedBlocks(html, ["nav", "header"]),
    ...extractPatternBlocks(
      html,
      /<(?:nav|div|ul)[^>]*class=["'][^"']*(?:nav|menu|navbar|main-menu|site-menu)[^"']*["'][^>]*>[\s\S]*?<\/(?:nav|div|ul)>/gi,
    ),
    ...extractPatternBlocks(html, /<[^>]+role=["']navigation["'][^>]*>[\s\S]*?<\/[^>]+>/gi),
  ];

  const contentBlocks = [
    ...extractTaggedBlocks(html, ["main", "article"]),
    ...extractPatternBlocks(html, /<div[^>]*(?:id|class)=["'][^"']*(?:content|page-body|main-content)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi),
    ...extractPatternBlocks(html, /<[^>]+role=["']main["'][^>]*>[\s\S]*?<\/[^>]+>/gi),
  ];

  const navigationSet = new Set<string>();
  for (const block of navigationBlocks) {
    for (const link of extractHrefLinks(block, base)) {
      navigationSet.add(link);
    }
  }

  const inPageSet = new Set<string>();
  for (const block of contentBlocks) {
    for (const link of extractHrefLinks(block, base)) {
      inPageSet.add(link);
    }
  }

  // If no semantic content blocks were found, treat non-nav page links as in-page references.
  if (inPageSet.size === 0) {
    for (const link of allPageLinks) {
      if (!navigationSet.has(link)) inPageSet.add(link);
    }
  }

  const current = normalizeInternalUrl(pageUrl);
  navigationSet.delete(current);
  inPageSet.delete(current);

  return {
    navigationLinks: [...navigationSet],
    inPageLinks: [...inPageSet],
    allPageLinks,
  };
}

export function extractLinksFromHtml(html: string, pageUrl: string): string[] {
  return parseHtmlLinkSignals(html, pageUrl).allPageLinks;
}

export function extractLinksFromSitemapXml(xml: string, origin: string): string[] {
  const links = new Set<string>();
  const locPattern = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;

  for (const match of xml.matchAll(locPattern)) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      const resolved = new URL(raw);
      if (resolved.origin !== origin) continue;
      if (shouldSkipPath(resolved.pathname)) continue;
      links.add(normalizeInternalUrl(resolved.href));
    } catch {
      continue;
    }
  }

  return [...links];
}

async function fetchText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xml,text/xml;q=0.9,*/*;q=0.8",
        "User-Agent": USER_AGENT,
      },
      redirect: "follow",
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xml|text\/xml/i.test(contentType) && !url.endsWith(".xml")) {
      return null;
    }

    const text = await response.text();
    if (text.length > MAX_RESPONSE_BYTES) {
      return text.slice(0, MAX_RESPONSE_BYTES);
    }
    return text;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchSitemapLinks(origin: string): Promise<string[]> {
  const candidates = [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`, `${origin}/sitemap-index.xml`];
  const discovered = new Set<string>();

  for (const sitemapUrl of candidates) {
    const xml = await fetchText(sitemapUrl);
    if (!xml) continue;
    for (const link of extractLinksFromSitemapXml(xml, origin)) {
      discovered.add(link);
    }
    if (discovered.size >= 20) break;
  }

  return [...discovered];
}

/** Crawls the destination site and returns strategically ranked internal link URLs. */
export async function discoverSiteInternalLinks(input: DestinationBriefInput): Promise<SiteLinkDiscoveryResult> {
  const currentUrl = input.currentUrl.trim();
  if (!currentUrl) {
    return { rankedLinks: [], linkSignals: { navigationLinks: [], inPageLinks: [] } };
  }

  let parsed: URL;
  try {
    parsed = new URL(currentUrl);
  } catch {
    return { rankedLinks: [], linkSignals: { navigationLinks: [], inPageLinks: [] } };
  }

  const html = await fetchText(currentUrl);
  const parsedSignals = html
    ? parseHtmlLinkSignals(html, currentUrl)
    : { navigationLinks: [], inPageLinks: [], allPageLinks: [] as string[] };

  const sitemapLinks =
    parsedSignals.allPageLinks.length < 12 ? await fetchSitemapLinks(parsed.origin) : [];

  const ctx: StrategicLinkContext = {
    currentUrl,
    contentType: (input.contentType || "Landing Page") as StrategicLinkContext["contentType"],
    primaryKeyword: input.primaryKeyword.trim(),
    providedLinks: [],
    discoveredLinks: [],
    linkSignals: {
      navigationLinks: parsedSignals.navigationLinks,
      inPageLinks: parsedSignals.inPageLinks,
    },
  };

  const rankedLinks = rankStrategicInternalLinks(
    [...parsedSignals.allPageLinks, ...sitemapLinks],
    ctx,
  ).slice(0, 8);

  return {
    rankedLinks,
    linkSignals: ctx.linkSignals ?? { navigationLinks: [], inPageLinks: [] },
  };
}

export function hasEnoughDiscoveredLinks(links: string[]): boolean {
  return links.length >= MIN_STRATEGIC_INTERNAL_LINKS;
}
