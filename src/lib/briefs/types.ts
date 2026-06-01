/**
 * Core type definitions for the Destination Content Brief Assistant.
 *
 * These types describe the shape of user-provided form data, the structured
 * brief that the deterministic generator produces, and the dropdown option
 * sets used throughout the UI. Keeping them centralized makes it easy to wire
 * the generator up to a real AI API later without touching the UI layer.
 */

export type ContentType =
  | "Blog Article"
  | "Things To Do Page"
  | "Seasonal Guide"
  | "Event Guide"
  | "Itinerary"
  | "Restaurant Guide"
  | "Outdoor Activities Guide"
  | "Family Travel Guide"
  | "Meetings / Conventions Page"
  | "Neighborhood Guide"
  | "Landing Page";

export type TargetAudience =
  | "Leisure travelers"
  | "Families"
  | "Couples"
  | "Outdoor travelers"
  | "Food and drink travelers"
  | "Arts and culture travelers"
  | "Event attendees"
  | "Meeting planners"
  | "Group travel planners"
  | "Local residents"
  | "General audience";

export type Seasonality =
  | "Evergreen"
  | "Spring"
  | "Summer"
  | "Fall"
  | "Winter"
  | "Holiday season"
  | "Event-based"
  | "Weekend travel"
  | "Long weekend"
  | "Shoulder season";

export type BusinessGoal =
  | "Increase organic traffic"
  | "Improve CTR"
  | "Refresh outdated content"
  | "Support partner referrals"
  | "Promote events"
  | "Improve itinerary engagement"
  | "Support hotel referrals"
  | "Increase newsletter signups"
  | "Support meetings and conventions leads"
  | "Improve AI search readiness";

export type SearchIntentType =
  | "Inspiration"
  | "Trip planning"
  | "Transactional / booking support"
  | "Local discovery"
  | "Event planning"
  | "Meeting planning"
  | "Comparison / research";

export type SchemaType =
  | "Article"
  | "FAQPage"
  | "BreadcrumbList"
  | "Event"
  | "TouristDestination"
  | "LocalBusiness"
  | "ItemList"
  | "HowTo"
  | "CollectionPage";

/**
 * Raw form input. Free-text multi-line fields are stored as single strings and
 * normalized into string arrays inside the generator so the UI stays simple.
 */
export interface DestinationBriefInput {
  destinationName: string;
  contentType: ContentType | "";
  primaryKeyword: string;
  secondaryQueries: string;
  targetAudience: TargetAudience | "";
  seasonality: Seasonality | "";
  currentUrl: string;
  competitorUrls: string;
  businessGoal: BusinessGoal | "";
  internalLinks: string;
  ctaGoal: string;
  brandVoiceNotes: string;
  localDetailsProvided: string;
}

export interface BriefOverview {
  destination: string;
  contentType: string;
  primaryKeyword: string;
  audience: string;
  seasonality: string;
  businessGoal: string;
  ctaGoal: string;
}

export interface SearchIntentAnalysis {
  primaryIntent: SearchIntentType;
  supportingIntents: SearchIntentType[];
  explanation: string;
}

export interface PageStructureSection {
  heading: string;
  level: "H1" | "H2" | "H3";
  notes?: string;
}

export interface SecondaryQueryMap {
  query: string;
  suggestedSection: string;
}

export interface LocalKnowledgeNeeded {
  detailsProvided: string[];
  additionalToConfirm: string[];
}

export interface InternalLinkRecommendation {
  /** The provided URL, or the recommended link category when none supplied. */
  link: string;
  /** Whether this came from user input or is a generated category suggestion. */
  source: "provided" | "suggested-category";
  placement: string;
}

export interface SchemaRecommendation {
  type: SchemaType;
  reason: string;
}

/**
 * Fully structured, deterministic brief. `markdownOutput` is a rendered version
 * of all sections used for copy-to-clipboard and Markdown download.
 */
export interface DestinationBrief {
  overview: BriefOverview;
  strategicObjective: string;
  /** Competitive differentiation and refresh guidance when URLs are provided. */
  competitiveAndRefreshNotes: string[];
  /** Simpleview CMS, partner listings, and platform workflow notes for DMO clients. */
  simpleviewPlatformNotes: string[];
  searchIntent: SearchIntentAnalysis;
  h1Options: string[];
  titleTagOptions: string[];
  metaDescriptionOptions: string[];
  recommendedStructure: PageStructureSection[];
  secondaryQueryMapping: SecondaryQueryMap[];
  localKnowledgeNeeded: LocalKnowledgeNeeded;
  internalLinkRecommendations: InternalLinkRecommendation[];
  schemaRecommendations: SchemaRecommendation[];
  faqSuggestions: string[];
  aiSearchReadinessNotes: string[];
  editorialGuidelines: string[];
  risksAndWatchouts: string[];
  finalWriterChecklist: string[];
  markdownOutput: string;
}

/** Generic dropdown option used by the form select components. */
export interface SelectOption<T extends string> {
  value: T;
  label: string;
}
