import type { DestinationBriefInput } from "./types";

export type RequiredField =
  | "destinationName"
  | "contentType"
  | "primaryKeyword"
  | "targetAudience"
  | "businessGoal";

export const REQUIRED_FIELD_LABELS: Record<RequiredField, string> = {
  destinationName: "Destination Name",
  contentType: "Content Type",
  primaryKeyword: "Primary Keyword",
  targetAudience: "Target Audience",
  businessGoal: "Business Goal",
};

export type ValidationErrors = Partial<Record<RequiredField, string>>;
export type ValidationWarnings = Partial<Record<"currentUrl" | "competitorUrls", string>>;

const URL_PATTERN = /^https?:\/\/.+/i;

function isValidUrl(value: string): boolean {
  if (!value.trim()) return true;
  if (!URL_PATTERN.test(value.trim())) return false;
  try {
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns a map of required-field errors. An empty object means the input is
 * valid. Pure and synchronous so the form can call it on submit and on change.
 */
export function validateBriefInput(input: DestinationBriefInput): ValidationErrors {
  const errors: ValidationErrors = {};
  (Object.keys(REQUIRED_FIELD_LABELS) as RequiredField[]).forEach((field) => {
    if (!input[field] || input[field].trim() === "") {
      errors[field] = `${REQUIRED_FIELD_LABELS[field]} is required.`;
    }
  });
  return errors;
}

/** Non-blocking URL format warnings for optional fields. */
export function validateBriefWarnings(input: DestinationBriefInput): ValidationWarnings {
  const warnings: ValidationWarnings = {};
  if (input.currentUrl.trim() && !isValidUrl(input.currentUrl)) {
    warnings.currentUrl = "Enter a full URL starting with http:// or https://";
  }
  const invalidCompetitors = input.competitorUrls
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !isValidUrl(l));
  if (invalidCompetitors.length > 0) {
    warnings.competitorUrls = `${invalidCompetitors.length} competitor URL(s) look invalid. Use full http(s) links, one per line.`;
  }
  return warnings;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function hasWarnings(warnings: ValidationWarnings): boolean {
  return Object.keys(warnings).length > 0;
}
