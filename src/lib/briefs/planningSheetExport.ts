import type { ContentType, DestinationBrief, DestinationBriefInput } from "./types";

/** One row of the Battle Creek Premium Content Planning spreadsheet (columns B–G). */
export interface PlanningSheetRow {
  topic: string;
  contentType: string;
  url: string;
  targetKeywords: string;
  headersTopics: string;
  internalLinks: string;
}

export type PlanningSheetColumnKey = keyof PlanningSheetRow;

const EXCEL_COLUMN_LABELS: Record<PlanningSheetColumnKey, string> = {
  topic: "B · Topic",
  contentType: "C · Content Type",
  url: "D · URL",
  targetKeywords: "E · Target Keywords",
  headersTopics: "F · Recommended Headers/Topics",
  internalLinks: "G · Internal Links",
};

export function getPlanningSheetColumnLabel(key: PlanningSheetColumnKey): string {
  return EXCEL_COLUMN_LABELS[key];
}

function titleCaseFromSlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function resolveAbsoluteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://example.com${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

function singularizeSegment(segment: string): string {
  const lower = segment.toLowerCase();
  if (lower.endsWith("ies")) return `${segment.slice(0, -3)}y`;
  if (lower.endsWith("s") && !lower.endsWith("ss")) return segment.slice(0, -1);
  return segment;
}

function extractTopicName(input: DestinationBriefInput, brief: DestinationBrief): string {
  const url = input.currentUrl.trim();
  if (url) {
    try {
      const pathname = new URL(resolveAbsoluteUrl(url)).pathname;
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length > 0) {
        const slug = segments[segments.length - 1];
        if (slug && slug !== "post") {
          if (segments.includes("post") && slug.length > 20) {
            return brief.h1Options[0] ?? titleCaseFromSlug(slug);
          }
          if (segments.length >= 2 && segments[segments.length - 2] !== "post") {
            const parent = titleCaseFromSlug(singularizeSegment(segments[segments.length - 2]));
            const child = titleCaseFromSlug(slug);
            if (parent !== child) {
              return `${parent} ${child}`;
            }
          }
          return titleCaseFromSlug(slug);
        }
      }
    } catch {
      // fall through
    }
  }

  if (brief.h1Options[0]) {
    return brief.h1Options[0].replace(/^#+\s*/, "");
  }

  return input.contentType.replace(/ Page$/, "").replace(/ Guide$/, "") || brief.overview.destination;
}

function inferFormLabel(contentType: ContentType | ""): string {
  if (contentType === "Blog Article" || contentType === "Itinerary") {
    return "Long Form";
  }
  return "short form";
}

export function mapExcelContentType(input: DestinationBriefInput): string {
  const hasUrl = input.currentUrl.trim().length > 0;
  const isBlog = input.contentType === "Blog Article";

  if (isBlog && !hasUrl) {
    return "New Blog";
  }

  if (
    hasUrl &&
    input.businessGoal === "Increase organic traffic" &&
    input.contentType === "Landing Page"
  ) {
    return "Expand Copy";
  }

  if (hasUrl) {
    return "Page Refresh";
  }

  return isBlog ? "New Blog" : "Page Refresh";
}

function buildTopicCell(input: DestinationBriefInput, brief: DestinationBrief, excelContentType: string): string {
  const name = extractTopicName(input, brief);
  const formLabel = inferFormLabel(input.contentType);

  if (excelContentType === "Expand Copy") {
    return `Expand Copy: ${name} - ${formLabel}`;
  }

  return `[${name}] - ${formLabel}`;
}

function parseSecondaryKeywords(input: DestinationBriefInput, brief: DestinationBrief): string[] {
  const fromInput = input.secondaryQueries
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (fromInput.length > 0) {
    return fromInput.slice(0, 4);
  }

  return brief.secondaryQueryMapping.slice(0, 4).map((entry) => entry.query);
}

function parseQueryKeywords(input: DestinationBriefInput, brief: DestinationBrief): string[] {
  const questionLike = (value: string) => /\?$/.test(value.trim()) || /^(how|what|where|when|why|are|is|can|do)\b/i.test(value);

  const fromInput = input.secondaryQueries
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => questionLike(line));

  if (fromInput.length > 0) {
    return fromInput.slice(0, 4);
  }

  return brief.faqSuggestions.slice(0, 4);
}

function formatTargetKeywords(input: DestinationBriefInput, brief: DestinationBrief): string {
  const primary = brief.overview.primaryKeyword.trim();
  const secondary = parseSecondaryKeywords(input, brief);
  const queries = parseQueryKeywords(input, brief);

  const lines: string[] = [`Primary:\n- ${primary}`];

  if (secondary.length > 0) {
    lines.push("", "Secondary:", ...secondary.map((keyword) => `- ${keyword}`));
  }

  if (queries.length > 0) {
    lines.push("", "Queries:", ...queries.map((query) => `- ${query}`));
  }

  return lines.join("\n");
}

function formatH2Sections(brief: DestinationBrief): string[] {
  const lines: string[] = [];
  let currentH2: string | null = null;

  for (const section of brief.recommendedStructure) {
    if (section.level === "H1") continue;

    if (section.level === "H2") {
      if (section.heading.toLowerCase() === "faqs") continue;
      currentH2 = section.heading;
      lines.push(`H2: ${section.heading}`);
      if (section.notes) {
        lines.push(`- ${section.notes}`);
      }
      continue;
    }

    if (section.level === "H3" && currentH2) {
      lines.push(`- ${section.heading}${section.notes ? `: ${section.notes}` : ""}`);
    }
  }

  if (lines.length === 0) {
    for (const section of brief.recommendedStructure) {
      if (section.level !== "H2" || section.heading.toLowerCase() === "faqs") continue;
      lines.push(`H2: ${section.heading}`);
      if (section.notes) lines.push(`- ${section.notes}`);
    }
  }

  return lines;
}

function pickCtaLink(input: DestinationBriefInput, brief: DestinationBrief): string | null {
  const provided = input.internalLinks
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^https?:\/\//i.test(line));

  if (provided.length > 0) return provided[0];

  const recommended = brief.internalLinkRecommendations.find((entry) => /^https?:\/\//i.test(entry.link));
  return recommended?.link ?? null;
}

function formatHeadersTopics(input: DestinationBriefInput, brief: DestinationBrief): string {
  const h1 = brief.h1Options[0] ?? "Suggested page title";
  const h2Lines = formatH2Sections(brief);
  const faqLines = brief.faqSuggestions.map((faq) => `- ${faq.replace(/\?$/, "")}?`);

  const parts: string[] = [
    "1. Objective",
    brief.strategicObjective,
    "",
    "2. Suggested H1",
    h1,
    "",
    "3. Recommended H2 Section Topics",
    ...h2Lines,
    "",
    "FAQs",
    ...faqLines,
  ];

  const ctaGoal = input.ctaGoal.trim() || brief.overview.ctaGoal.trim();
  const ctaLink = pickCtaLink(input, brief);
  if (ctaGoal || ctaLink) {
    parts.push("", "CTA Tip:");
    if (ctaGoal && ctaLink) {
      parts.push(`"${ctaGoal}" Link to: ${ctaLink}.`);
    } else if (ctaGoal) {
      parts.push(`"${ctaGoal}"`);
    } else if (ctaLink) {
      parts.push(`Link to: ${ctaLink}.`);
    }
  }

  return parts.join("\n");
}

function collectInternalLinkUrls(input: DestinationBriefInput, brief: DestinationBrief): string[] {
  const urls = new Set<string>();

  for (const line of input.internalLinks.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (/^https?:\/\//i.test(trimmed)) urls.add(trimmed);
  }

  for (const entry of brief.internalLinkRecommendations) {
    if (/^https?:\/\//i.test(entry.link)) urls.add(entry.link);
  }

  return [...urls];
}

function formatInternalLinks(input: DestinationBriefInput, brief: DestinationBrief): string {
  const urls = collectInternalLinkUrls(input, brief);

  if (urls.length === 0) {
    const categories = brief.internalLinkRecommendations
      .filter((entry) => entry.source === "suggested-category")
      .map((entry) => entry.link);

    if (categories.length === 0) {
      return "Interlinking to build a structured content cluster:\n\n(Add internal links before export if available.)";
    }

    return [
      "Interlinking to build a structured content cluster:",
      "",
      ...categories.map((category) => `- ${category} (confirm URL with stakeholder)`),
    ].join("\n");
  }

  return ["Interlinking to build a structured content cluster:", "", ...urls].join("\n\n");
}

/** Maps a generated brief + form input onto spreadsheet columns B–G. */
export function buildPlanningSheetRow(
  brief: DestinationBrief,
  input: DestinationBriefInput,
): PlanningSheetRow {
  const excelContentType = mapExcelContentType(input);

  return {
    topic: buildTopicCell(input, brief, excelContentType),
    contentType: excelContentType,
    url: input.currentUrl.trim(),
    targetKeywords: formatTargetKeywords(input, brief),
    headersTopics: formatHeadersTopics(input, brief),
    internalLinks: formatInternalLinks(input, brief),
  };
}

/** Tab-separated values for pasting into Excel starting at column B. */
export function formatPlanningSheetRowTsv(row: PlanningSheetRow): string {
  return [
    row.topic,
    row.contentType,
    row.url,
    row.targetKeywords,
    row.headersTopics,
    row.internalLinks,
  ].join("\t");
}

export function getPlanningSheetColumnValue(row: PlanningSheetRow, key: PlanningSheetColumnKey): string {
  return row[key];
}
