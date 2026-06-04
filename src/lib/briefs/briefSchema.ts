import { z } from "zod";

const searchIntentType = z.enum([
  "Inspiration",
  "Trip planning",
  "Transactional / booking support",
  "Local discovery",
  "Event planning",
  "Meeting planning",
  "Comparison / research",
]);

const schemaType = z.enum([
  "Article",
  "FAQPage",
  "BreadcrumbList",
  "Event",
  "TouristDestination",
  "LocalBusiness",
  "ItemList",
  "HowTo",
  "CollectionPage",
]);

/** Zod schema for validating OpenAI JSON output against `DestinationBrief` (without markdown). */
export const destinationBriefBodySchema = z.object({
  overview: z.object({
    destination: z.string(),
    contentType: z.string(),
    primaryKeyword: z.string(),
    audience: z.string(),
    seasonality: z.string(),
    businessGoal: z.string(),
    ctaGoal: z.string(),
  }),
  strategicObjective: z.string(),
  competitiveAndRefreshNotes: z.array(z.string()).min(1),
  simpleviewPlatformNotes: z.array(z.string()).min(1),
  searchIntent: z.object({
    primaryIntent: searchIntentType,
    supportingIntents: z.array(searchIntentType),
    explanation: z.string(),
  }),
  h1Options: z.array(z.string()).min(1),
  titleTagOptions: z.array(z.string()).min(1),
  metaDescriptionOptions: z.array(z.string()).min(1),
  recommendedStructure: z.array(
    z.object({
      heading: z.string(),
      level: z.enum(["H1", "H2", "H3"]),
      notes: z.string().optional(),
    }),
  ),
  secondaryQueryMapping: z.array(
    z.object({
      query: z.string(),
      suggestedSection: z.string(),
    }),
  ),
  localKnowledgeNeeded: z.object({
    detailsProvided: z.array(z.string()),
    additionalToConfirm: z.array(z.string()),
  }),
  internalLinkRecommendations: z.array(
    z.object({
      link: z.string(),
      source: z.enum(["provided", "suggested-url", "suggested-category"]),
      placement: z.string(),
    }),
  ),
  schemaRecommendations: z.array(
    z.object({
      type: schemaType,
      reason: z.string(),
    }),
  ),
  faqSuggestions: z.array(z.string()).min(1),
  aiSearchReadinessNotes: z.array(z.string()).min(1),
  editorialGuidelines: z.array(z.string()).min(1),
  risksAndWatchouts: z.array(z.string()).min(1),
  finalWriterChecklist: z.array(z.string()).min(1),
});

export type DestinationBriefBody = z.infer<typeof destinationBriefBodySchema>;
