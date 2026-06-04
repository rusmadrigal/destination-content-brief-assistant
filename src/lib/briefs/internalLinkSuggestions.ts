import type { ContentType, InternalLinkRecommendation } from "./types";

export const MIN_STRATEGIC_INTERNAL_LINKS = 3;

const SECTION_RELATED_PATHS: Record<string, string[]> = {
  weddings: ["request-info/", "group-lodging-link/", "venues/"],
  meet: ["venues/", "request-proposal/", "planning-tools/"],
  stay: ["hotels/", "groups/", "bed-breakfast/"],
  "food-drink": ["restaurants/", "local-flavor/", "breweries/"],
  plan: ["communities/", "maps/", "visitor-guide/"],
  "things-to-do": ["top-attraction-picks/", "outdoor/", "historical/"],
};

const CONTENT_TYPE_HUB_PATHS: Partial<Record<ContentType, string[]>> = {
  "Blog Article": ["/blog/", "/things-to-do/", "/plan/"],
  "Things To Do Page": ["/things-to-do/", "/events/", "/plan/"],
  "Seasonal Guide": ["/things-to-do/", "/events/", "/plan/"],
  "Event Guide": ["/events/", "/things-to-do/", "/plan/"],
  Itinerary: ["/things-to-do/", "/plan/", "/stay/"],
  "Restaurant Guide": ["/food-drink/", "/food-drink/restaurants/", "/plan/"],
  "Outdoor Activities Guide": ["/things-to-do/outdoor/", "/things-to-do/", "/plan/"],
  "Family Travel Guide": ["/things-to-do/", "/events/", "/plan/"],
  "Meetings / Conventions Page": ["/meet/", "/meet/venues/", "/stay/groups/"],
  "Neighborhood Guide": ["/plan/communities/", "/things-to-do/", "/food-drink/"],
  "Landing Page": ["/plan/", "/things-to-do/", "/events/"],
};

const CONTENT_TYPE_KEYWORDS: Partial<Record<ContentType, string[]>> = {
  "Blog Article": ["blog"],
  "Things To Do Page": ["things-to-do", "attraction", "activities"],
  "Seasonal Guide": ["things-to-do", "events", "season"],
  "Event Guide": ["events", "festival"],
  Itinerary: ["plan", "itinerary", "things-to-do"],
  "Restaurant Guide": ["food", "restaurant", "dining", "flavor"],
  "Outdoor Activities Guide": ["outdoor", "things-to-do", "trail"],
  "Family Travel Guide": ["family", "things-to-do"],
  "Meetings / Conventions Page": ["meet", "convention", "venue"],
  "Neighborhood Guide": ["communities", "plan", "neighborhood"],
  "Landing Page": ["plan", "visit"],
};

const SKIP_PATH_PATTERN =
  /\/(privacy|terms|login|signin|signup|admin|cart|checkout|search|tag|feed|wp-|\.pdf|\.jpg|\.png)(\/?|$|\?)/i;

const DEFAULT_FALLBACK_CATEGORIES = [
  "Things to Do hub",
  "Events calendar",
  "Places to Stay",
  "Restaurants",
  "Itineraries",
  "Transportation / Getting Here",
  "Partner listings",
];

export interface LinkDiscoverySignals {
  /** Links already referenced in main page content. */
  inPageLinks: string[];
  /** Links from nav, header menu, and primary site navigation. */
  navigationLinks: string[];
}

export interface StrategicLinkContext {
  currentUrl: string;
  contentType: ContentType;
  primaryKeyword: string;
  providedLinks: string[];
  discoveredLinks: string[];
  linkSignals?: LinkDiscoverySignals;
}

function normalizePathname(pathname: string): string {
  const withLeading = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

export function normalizeInternalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    return `${parsed.origin}${normalizePathname(parsed.pathname)}`;
  } catch {
    return url.trim();
  }
}

/** Resolves a relative path against the current page URL when possible. */
export function resolveInternalLink(link: string, currentUrl: string): string {
  const trimmed = link.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return normalizeInternalUrl(trimmed);

  if (currentUrl) {
    try {
      return normalizeInternalUrl(new URL(trimmed, currentUrl).href);
    } catch {
      return trimmed;
    }
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function joinOriginPath(origin: string, path: string): string {
  return normalizeInternalUrl(`${origin}${normalizePathname(path)}`);
}

function isStrategicUrl(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    const { pathname } = new URL(url);
    if (SKIP_PATH_PATTERN.test(pathname)) return false;
    return pathname.split("/").filter(Boolean).length > 0;
  } catch {
    return false;
  }
}

/** Suggests on-site internal link URLs from the current page URL and content type. */
export function inferInternalLinksFromContext(
  currentUrl: string,
  contentType: ContentType,
): string[] {
  const trimmed = currentUrl.trim();
  if (!trimmed) return [];

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return [];
  }

  const origin = parsed.origin;
  const current = normalizeInternalUrl(trimmed);
  const segments = parsed.pathname.split("/").filter(Boolean);
  const candidates = new Set<string>();

  for (let depth = 1; depth < segments.length; depth += 1) {
    candidates.add(joinOriginPath(origin, `/${segments.slice(0, depth).join("/")}/`));
  }

  const section = segments[0];
  if (section && SECTION_RELATED_PATHS[section]) {
    for (const related of SECTION_RELATED_PATHS[section]) {
      candidates.add(joinOriginPath(origin, `/${section}/${related}`));
    }
  }

  const typePaths = CONTENT_TYPE_HUB_PATHS[contentType] ?? CONTENT_TYPE_HUB_PATHS["Landing Page"] ?? [];
  for (const path of typePaths) {
    candidates.add(joinOriginPath(origin, path));
  }

  return [...candidates].filter((link) => link !== current && isStrategicUrl(link));
}

function keywordTokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 3);
}

/** Scores a candidate URL for strategic internal linking value. Higher is better. */
export function scoreStrategicInternalLink(
  url: string,
  ctx: Pick<StrategicLinkContext, "currentUrl" | "contentType" | "primaryKeyword" | "linkSignals">,
): number {
  if (!isStrategicUrl(url)) return -100;

  let score = 0;
  let pathname = "";
  let currentPathname = "";
  const normalized = normalizeInternalUrl(url);

  try {
    pathname = new URL(url).pathname.toLowerCase();
    if (ctx.currentUrl) {
      currentPathname = new URL(ctx.currentUrl).pathname.toLowerCase();
    }
  } catch {
    return -100;
  }

  const inPage = ctx.linkSignals?.inPageLinks.some((link) => normalizeInternalUrl(link) === normalized);
  const inNav = ctx.linkSignals?.navigationLinks.some((link) => normalizeInternalUrl(link) === normalized);
  if (inPage) score += 50;
  if (inNav) score += 32;

  const segments = pathname.split("/").filter(Boolean);
  const currentSegments = currentPathname.split("/").filter(Boolean);

  if (currentSegments[0] && segments[0] === currentSegments[0]) score += 35;
  if (segments.length <= 2) score += 18;
  if (segments.length >= 5) score -= 12;

  if (/request-info|rfp|proposal|contact|book|plan-your|visitor-guide/.test(pathname)) score += 28;
  if (/venues|restaurants|hotels|events|things-to-do|food-drink|meet|weddings|plan/.test(pathname)) {
    score += 12;
  }

  const keywordSet = new Set([
    ...keywordTokens(ctx.primaryKeyword),
    ...(CONTENT_TYPE_KEYWORDS[ctx.contentType] ?? []),
  ]);
  for (const token of keywordSet) {
    if (pathname.includes(token)) score += 14;
  }

  if (currentSegments.length > 1) {
    const parentPath = `/${currentSegments.slice(0, -1).join("/")}/`;
    if (pathname === parentPath || pathname === parentPath.slice(0, -1)) score += 22;
  }

  if (SKIP_PATH_PATTERN.test(pathname)) score -= 80;

  return score;
}

export function rankStrategicInternalLinks(
  candidates: string[],
  ctx: Pick<StrategicLinkContext, "currentUrl" | "contentType" | "primaryKeyword" | "linkSignals">,
  exclude: string[] = [],
): string[] {
  const excluded = new Set(exclude.map(normalizeInternalUrl));
  const current = ctx.currentUrl ? normalizeInternalUrl(ctx.currentUrl) : "";

  return [...new Set(candidates.map((link) => normalizeInternalUrl(link)))]
    .filter((link) => link !== current && !excluded.has(link) && isStrategicUrl(link))
    .map((link) => ({ link, score: scoreStrategicInternalLink(link, ctx) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.link);
}

export function buildStrategicInternalLinkRecommendations(
  ctx: StrategicLinkContext,
): InternalLinkRecommendation[] {
  const resolvedProvided = ctx.providedLinks.map((link) => resolveInternalLink(link, ctx.currentUrl));
  const excluded = [...resolvedProvided];
  const recommendations: InternalLinkRecommendation[] = resolvedProvided.map((link) => ({
    link,
    source: "provided",
    placement: suggestPlacementForLink(link),
  }));

  const discoveredRanked = rankStrategicInternalLinks(ctx.discoveredLinks, ctx, excluded);
  for (const link of discoveredRanked) {
    if (recommendations.some((entry) => entry.link === link)) continue;
    recommendations.push({
      link,
      source: "discovered-url",
      placement: placementForDiscoveredLink(link, ctx),
    });
    excluded.push(link);
  }

  if (recommendations.filter(isUrlRecommendation).length < MIN_STRATEGIC_INTERNAL_LINKS) {
    const inferredRanked = rankStrategicInternalLinks(
      inferInternalLinksFromContext(ctx.currentUrl, ctx.contentType),
      ctx,
      excluded,
    );
    for (const link of inferredRanked) {
      if (recommendations.some((entry) => entry.link === link)) continue;
      recommendations.push({
        link,
        source: "suggested-url",
        placement: suggestPlacementForLink(link),
      });
      excluded.push(link);
      if (recommendations.filter(isUrlRecommendation).length >= MIN_STRATEGIC_INTERNAL_LINKS) break;
    }
  }

  const urlRecommendations = recommendations.filter(isUrlRecommendation);
  if (urlRecommendations.length >= MIN_STRATEGIC_INTERNAL_LINKS) {
    return urlRecommendations.slice(0, 8);
  }

  if (ctx.currentUrl.trim()) {
    return urlRecommendations;
  }

  return DEFAULT_FALLBACK_CATEGORIES.map((category) => ({
    link: category,
    source: "suggested-category" as const,
    placement: suggestPlacementForCategory(category),
  }));
}

function isUrlRecommendation(entry: InternalLinkRecommendation): boolean {
  return entry.source !== "suggested-category";
}

function placementForDiscoveredLink(link: string, ctx: StrategicLinkContext): string {
  const normalized = normalizeInternalUrl(link);
  const inPage = ctx.linkSignals?.inPageLinks.some((entry) => normalizeInternalUrl(entry) === normalized);
  const inNav = ctx.linkSignals?.navigationLinks.some((entry) => normalizeInternalUrl(entry) === normalized);
  const base = suggestPlacementForLink(link);

  if (inPage && inNav) {
    return `${base} Already on this page and in site navigation; prioritize as a core cluster link.`;
  }
  if (inPage) {
    return `${base} Already referenced on the current page; strengthen with descriptive anchor text.`;
  }
  if (inNav) {
    return `${base} Found in site navigation; strong hub candidate for topical clusters.`;
  }
  return base;
}

export function suggestPlacementForLink(link: string): string {
  const value = link.toLowerCase();
  if (/request-info|rfp|proposal|contact/.test(value)) {
    return "Use as a primary CTA link near the end of the copy.";
  }
  if (/event/.test(value)) return "Within the Events / Events and Festivals section.";
  if (/stay|hotel|lodg|group-lodging|bed-breakfast/.test(value)) {
    return "Within the Where to Stay or group lodging section.";
  }
  if (/restaurant|food|dining|flavor|brewer/.test(value)) {
    return "Within the Food and Drink section.";
  }
  if (/itinerar/.test(value)) return "Within the Suggested Itinerary or Plan Your Trip section.";
  if (/thing|do|activit|attraction|outdoor/.test(value)) {
    return "Within the Top Things To Do or related experiences section.";
  }
  if (/meet|convention|conference|venue/.test(value)) {
    return "Within meeting planner or venue discovery sections.";
  }
  if (/wedding/.test(value)) return "Within wedding planning or venue discovery sections.";
  if (/plan|visit|communities|map/.test(value)) {
    return "Within trip planning, intro, or hub navigation sections.";
  }
  if (/blog/.test(value)) return "Within related blog or editorial cross-link sections.";
  return "Within the most topically relevant section; verify anchor text matches the target page.";
}

export function suggestPlacementForCategory(category: string): string {
  const map: Record<string, string> = {
    "Things to Do hub": "Link from the introduction and any activity-focused section.",
    "Events calendar": "Link from the Events section and near time-sensitive content.",
    "Places to Stay": "Link from the Where to Stay section.",
    Restaurants: "Link from the Food and Drink section.",
    Itineraries: "Link from the Suggested Itinerary or planning sections.",
    "Transportation / Getting Here": "Link from the Planning Tips / Getting Here section.",
    "Partner listings": "Link contextually where partner businesses are referenced.",
  };
  return map[category] ?? "Place contextually within the most relevant section.";
}
