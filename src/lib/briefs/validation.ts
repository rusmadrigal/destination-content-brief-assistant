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

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
