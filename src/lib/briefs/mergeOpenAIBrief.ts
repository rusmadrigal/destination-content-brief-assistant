import type { DestinationBrief, DestinationBriefInput, SchemaType, SearchIntentType } from "./types";
import type { DestinationBriefBody } from "./briefSchema";

const SEARCH_INTENTS: SearchIntentType[] = [
  "Inspiration",
  "Trip planning",
  "Transactional / booking support",
  "Local discovery",
  "Event planning",
  "Meeting planning",
  "Comparison / research",
];

const SCHEMA_TYPES: SchemaType[] = [
  "Article",
  "FAQPage",
  "BreadcrumbList",
  "Event",
  "TouristDestination",
  "LocalBusiness",
  "ItemList",
  "HowTo",
  "CollectionPage",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Strips optional markdown code fences from model output. */
export function parseOpenAIJsonContent(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText);
}

function pickString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function pickStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return items.length > 0 ? items : fallback;
}

function pickSearchIntent(value: unknown, fallback: DestinationBrief["searchIntent"]): DestinationBrief["searchIntent"] {
  if (!isRecord(value)) return fallback;
  const primaryRaw = value.primaryIntent;
  const primaryIntent = SEARCH_INTENTS.includes(primaryRaw as SearchIntentType)
    ? (primaryRaw as SearchIntentType)
    : fallback.primaryIntent;
  const supportingIntents = pickStringArray(value.supportingIntents, fallback.supportingIntents).filter(
    (intent): intent is SearchIntentType => SEARCH_INTENTS.includes(intent as SearchIntentType),
  );
  return {
    primaryIntent,
    supportingIntents,
    explanation: pickString(value.explanation, fallback.explanation),
  };
}

function pickStructure(
  value: unknown,
  fallback: DestinationBrief["recommendedStructure"],
): DestinationBrief["recommendedStructure"] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const levels = new Set(["H1", "H2", "H3"]);
  const mapped = value
    .filter(isRecord)
    .map((item) => {
      const levelRaw = String(item.level ?? "H2").toUpperCase();
      const level = levels.has(levelRaw) ? (levelRaw as "H1" | "H2" | "H3") : "H2";
      const heading = pickString(item.heading, "");
      if (!heading) return null;
      const notes = typeof item.notes === "string" && item.notes.trim() ? item.notes.trim() : undefined;
      return { heading, level, notes };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  return mapped.length > 0 ? mapped : fallback;
}

function pickSchemaRecommendations(
  value: unknown,
  fallback: DestinationBrief["schemaRecommendations"],
): DestinationBrief["schemaRecommendations"] {
  if (!Array.isArray(value)) return fallback;
  const mapped = value
    .filter(isRecord)
    .map((item) => {
      const typeRaw = item.type;
      if (!SCHEMA_TYPES.includes(typeRaw as SchemaType)) return null;
      return {
        type: typeRaw as SchemaType,
        reason: pickString(item.reason, ""),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null && item.reason.length > 0);
  return mapped.length > 0 ? mapped : fallback;
}

function pickInternalLinks(
  value: unknown,
  fallback: DestinationBrief["internalLinkRecommendations"],
): DestinationBrief["internalLinkRecommendations"] {
  if (!Array.isArray(value)) return fallback;
  const mapped = value
    .filter(isRecord)
    .map((item) => {
      const link = pickString(item.link, "");
      const placement = pickString(item.placement, "");
      if (!link || !placement) return null;
      const sourceRaw = item.source;
      const source =
        sourceRaw === "provided" || sourceRaw === "suggested-category" ? sourceRaw : fallback[0]?.source ?? "provided";
      return { link, placement, source };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  return mapped.length > 0 ? mapped : fallback;
}

function pickSecondaryMapping(
  value: unknown,
  fallback: DestinationBrief["secondaryQueryMapping"],
): DestinationBrief["secondaryQueryMapping"] {
  if (!Array.isArray(value)) return fallback;
  const mapped = value
    .filter(isRecord)
    .map((item) => {
      const query = pickString(item.query, "");
      const suggestedSection = pickString(item.suggestedSection, "");
      if (!query || !suggestedSection) return null;
      return { query, suggestedSection };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  return mapped.length > 0 ? mapped : fallback;
}

function pickLocalKnowledge(
  value: unknown,
  fallback: DestinationBrief["localKnowledgeNeeded"],
  userLocalDetails: string[],
): DestinationBrief["localKnowledgeNeeded"] {
  if (!isRecord(value)) {
    return { detailsProvided: userLocalDetails, additionalToConfirm: fallback.additionalToConfirm };
  }
  return {
    detailsProvided: userLocalDetails,
    additionalToConfirm: pickStringArray(value.additionalToConfirm, fallback.additionalToConfirm),
  };
}

function pickOverview(
  value: unknown,
  fallback: DestinationBrief["overview"],
): DestinationBrief["overview"] {
  if (!isRecord(value)) return fallback;
  return {
    destination: fallback.destination,
    contentType: fallback.contentType,
    primaryKeyword: fallback.primaryKeyword,
    audience: fallback.audience,
    seasonality: fallback.seasonality,
    businessGoal: fallback.businessGoal,
    ctaGoal: pickString(value.ctaGoal, fallback.ctaGoal),
  };
}

/**
 * Merges a loose OpenAI JSON object onto the deterministic baseline.
 * Used when strict Zod validation fails but the response is still usable.
 */
export function mergeOpenAIResponseWithBaseline(
  parsed: unknown,
  baseline: DestinationBrief,
  input: DestinationBriefInput,
): DestinationBriefBody {
  const ai = isRecord(parsed) ? parsed : {};
  const userLocalDetails = input.localDetailsProvided
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return {
    overview: pickOverview(ai.overview, baseline.overview),
    strategicObjective: pickString(ai.strategicObjective, baseline.strategicObjective),
    competitiveAndRefreshNotes: pickStringArray(ai.competitiveAndRefreshNotes, baseline.competitiveAndRefreshNotes),
    simpleviewPlatformNotes: pickStringArray(ai.simpleviewPlatformNotes, baseline.simpleviewPlatformNotes),
    searchIntent: pickSearchIntent(ai.searchIntent, baseline.searchIntent),
    h1Options: pickStringArray(ai.h1Options, baseline.h1Options),
    titleTagOptions: pickStringArray(ai.titleTagOptions, baseline.titleTagOptions),
    metaDescriptionOptions: pickStringArray(ai.metaDescriptionOptions, baseline.metaDescriptionOptions),
    recommendedStructure: pickStructure(ai.recommendedStructure, baseline.recommendedStructure),
    secondaryQueryMapping: pickSecondaryMapping(ai.secondaryQueryMapping, baseline.secondaryQueryMapping),
    localKnowledgeNeeded: pickLocalKnowledge(ai.localKnowledgeNeeded, baseline.localKnowledgeNeeded, userLocalDetails),
    internalLinkRecommendations: pickInternalLinks(
      ai.internalLinkRecommendations,
      baseline.internalLinkRecommendations,
    ),
    schemaRecommendations: pickSchemaRecommendations(ai.schemaRecommendations, baseline.schemaRecommendations),
    faqSuggestions: pickStringArray(ai.faqSuggestions, baseline.faqSuggestions),
    aiSearchReadinessNotes: pickStringArray(ai.aiSearchReadinessNotes, baseline.aiSearchReadinessNotes),
    editorialGuidelines: pickStringArray(ai.editorialGuidelines, baseline.editorialGuidelines),
    risksAndWatchouts: pickStringArray(ai.risksAndWatchouts, baseline.risksAndWatchouts),
    finalWriterChecklist: pickStringArray(ai.finalWriterChecklist, baseline.finalWriterChecklist),
  };
}
