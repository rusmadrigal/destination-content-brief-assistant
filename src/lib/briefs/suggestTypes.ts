import type {
  BusinessGoal,
  ContentType,
  DestinationBriefInput,
  Seasonality,
  TargetAudience,
} from "./types";

export type SuggestionSource = "openai" | "deterministic";

/** AI/template suggestions for form fields (planning-only, no invented venues). */
export interface BriefInputSuggestions {
  destinationName: string;
  contentType: ContentType | "";
  primaryKeyword: string;
  secondaryQueries: string;
  targetAudience: TargetAudience | "";
  seasonality: Seasonality | "";
  businessGoal: BusinessGoal | "";
  ctaGoal: string;
  internalLinks: string;
  brandVoiceNotes: string;
  /** Short bullets explaining why these patterns fit (e.g. coastal DMO). */
  contextHints: string[];
  source: SuggestionSource;
}

export type SuggestionFieldKey = keyof Omit<BriefInputSuggestions, "destinationName" | "contextHints" | "source">;

export const SUGGESTION_FIELD_LABELS: Record<SuggestionFieldKey, string> = {
  contentType: "Content Type",
  primaryKeyword: "Primary Keyword",
  secondaryQueries: "Secondary Queries",
  targetAudience: "Target Audience",
  seasonality: "Seasonality",
  businessGoal: "Business Goal",
  ctaGoal: "CTA Goal",
  internalLinks: "Internal Links",
  brandVoiceNotes: "Brand Voice",
};

/** Applies suggestions only to fields that are still empty in the current form. */
export function applySuggestionsToInput(
  current: DestinationBriefInput,
  suggestions: BriefInputSuggestions,
  fields?: SuggestionFieldKey[],
): DestinationBriefInput {
  const keys = fields ?? (Object.keys(SUGGESTION_FIELD_LABELS) as SuggestionFieldKey[]);
  const next = { ...current };

  for (const key of keys) {
    const suggested = suggestions[key];
    const existing = current[key];
    const isEmpty = typeof existing === "string" && existing.trim() === "";
    if (isEmpty && typeof suggested === "string" && suggested.trim() !== "") {
      (next as Record<string, string>)[key] = suggested;
    }
  }

  return next;
}
