/**
 * Centralized dropdown option definitions. Sourcing these from a single module
 * keeps the form, validation, and generator logic in sync.
 */
import type {
  BusinessGoal,
  ContentType,
  Seasonality,
  SelectOption,
  TargetAudience,
} from "./types";

function toOptions<T extends string>(values: readonly T[]): SelectOption<T>[] {
  return values.map((value) => ({ value, label: value }));
}

export const CONTENT_TYPES: readonly ContentType[] = [
  "Blog Article",
  "Things To Do Page",
  "Seasonal Guide",
  "Event Guide",
  "Itinerary",
  "Restaurant Guide",
  "Outdoor Activities Guide",
  "Family Travel Guide",
  "Meetings / Conventions Page",
  "Neighborhood Guide",
  "Landing Page",
] as const;

export const TARGET_AUDIENCES: readonly TargetAudience[] = [
  "Leisure travelers",
  "Families",
  "Couples",
  "Outdoor travelers",
  "Food and drink travelers",
  "Arts and culture travelers",
  "Event attendees",
  "Meeting planners",
  "Group travel planners",
  "Local residents",
  "General audience",
] as const;

export const SEASONALITIES: readonly Seasonality[] = [
  "Evergreen",
  "Spring",
  "Summer",
  "Fall",
  "Winter",
  "Holiday season",
  "Event-based",
  "Weekend travel",
  "Long weekend",
  "Shoulder season",
] as const;

export const BUSINESS_GOALS: readonly BusinessGoal[] = [
  "Increase organic traffic",
  "Improve CTR",
  "Refresh outdated content",
  "Support partner referrals",
  "Promote events",
  "Improve itinerary engagement",
  "Support hotel referrals",
  "Increase newsletter signups",
  "Support meetings and conventions leads",
  "Improve AI search readiness",
] as const;

export const CONTENT_TYPE_OPTIONS = toOptions(CONTENT_TYPES);
export const TARGET_AUDIENCE_OPTIONS = toOptions(TARGET_AUDIENCES);
export const SEASONALITY_OPTIONS = toOptions(SEASONALITIES);
export const BUSINESS_GOAL_OPTIONS = toOptions(BUSINESS_GOALS);

export const EMPTY_BRIEF_INPUT = {
  destinationName: "",
  contentType: "",
  primaryKeyword: "",
  secondaryQueries: "",
  targetAudience: "",
  seasonality: "",
  currentUrl: "",
  competitorUrls: "",
  businessGoal: "",
  internalLinks: "",
  ctaGoal: "",
  brandVoiceNotes: "",
  localDetailsProvided: "",
} as const;
