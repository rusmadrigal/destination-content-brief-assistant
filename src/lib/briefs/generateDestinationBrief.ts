/**
 * Deterministic brief generator.
 *
 * This module is the seam where a real AI provider (OpenAI / Azure OpenAI /
 * internal API) can later be introduced. Today it assembles a fully structured
 * brief from templates + user input with zero network calls. To swap in an AI
 * backend, replace `generateDestinationBrief` with an async function that calls
 * the provider and maps the response onto the same `DestinationBrief` shape, or
 * keep this as the deterministic fallback.
 *
 * Hard rule honored throughout: the generator NEVER invents specific local
 * places, businesses, events, dates, prices, hours, or distances. Anything
 * local either comes from `localDetailsProvided` or is surfaced as a
 * validation prompt for a human/local stakeholder.
 */
import {
  BASE_SCHEMA_TYPES,
  CONTENT_TYPE_PRIMARY_INTENT,
  CONTENT_TYPE_SCHEMA,
  DEFAULT_INTERNAL_LINK_CATEGORIES,
  QUERY_SECTION_KEYWORDS,
  SCHEMA_REASONS,
  STRUCTURE_TEMPLATES,
} from "./briefTemplates";
import {
  inferInternalLinksFromContext,
  resolveInternalLink,
  suggestPlacementForCategory,
  suggestPlacementForLink,
} from "./internalLinkSuggestions";
import type {
  BusinessGoal,
  ContentType,
  DestinationBrief,
  DestinationBriefInput,
  InternalLinkRecommendation,
  PageStructureSection,
  SchemaRecommendation,
  SearchIntentAnalysis,
  SearchIntentType,
  Seasonality,
  TargetAudience,
} from "./types";

/* ------------------------------------------------------------------ helpers */

/** Splits a textarea value into trimmed, non-empty lines. */
function toLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Replaces {destination} and {season} tokens with provided values. */
function fillTokens(text: string, destination: string, season: string): string {
  return text
    .replace(/\{destination\}/g, destination)
    .replace(/\{season\}/g, season);
}

/**
 * Returns a human-friendly season word for prose. Falls back to a neutral
 * phrase so we never assert a season the user didn't choose.
 */
function seasonWord(seasonality: Seasonality | ""): string {
  switch (seasonality) {
    case "Spring":
    case "Summer":
    case "Fall":
    case "Winter":
      return seasonality.toLowerCase();
    case "Holiday season":
      return "the holiday season";
    case "Shoulder season":
      return "the shoulder season";
    case "Weekend travel":
    case "Long weekend":
      return "a weekend visit";
    case "Event-based":
      return "the event window";
    case "Evergreen":
    case "":
    default:
      return "any season";
  }
}

/** Token used inside structure templates ("{season}"). */
function seasonToken(seasonality: Seasonality | ""): string {
  switch (seasonality) {
    case "Spring":
    case "Summer":
    case "Fall":
    case "Winter":
      return seasonality;
    case "Holiday season":
      return "Holiday";
    case "Shoulder season":
      return "Shoulder Season";
    default:
      return "Seasonal";
  }
}

/* ------------------------------------------------------- section generators */

function buildStrategicObjective(
  destination: string,
  contentType: ContentType,
  audience: TargetAudience,
  goal: BusinessGoal,
  season: string,
): string {
  const goalClauses: Record<BusinessGoal, string> = {
    "Increase organic traffic":
      "capture additional non-brand organic search demand and expand topical coverage",
    "Improve CTR":
      "earn more clicks from existing impressions through sharper titles, meta descriptions, and result presentation",
    "Refresh outdated content":
      "modernize stale information, restore topical authority, and re-establish freshness signals",
    "Support partner referrals":
      "drive qualified referrals to partner businesses and listings",
    "Promote events":
      "increase awareness and attendance for relevant events",
    "Improve itinerary engagement":
      "increase engagement with trip-planning content and time on page",
    "Support hotel referrals":
      "route planning-intent visitors toward lodging and booking partners",
    "Increase newsletter signups":
      "convert engaged visitors into newsletter subscribers",
    "Support meetings and conventions leads":
      "generate qualified RFP and meeting-planner inquiries",
    "Improve AI search readiness":
      "make the page a citable, answer-ready source for AI search and answer engines",
  };

  return (
    `This ${contentType} for ${destination} should help ${audience.toLowerCase()} during ${season}. ` +
    `From an SEO and destination-marketing perspective, the primary objective is to ${goalClauses[goal]}. ` +
    `It should establish ${destination} as a credible, locally informed source for this topic, satisfy the searcher's intent quickly, ` +
    `and guide readers toward the defined call to action without resorting to generic, promotional, or AI-sounding copy.`
  );
}

function buildSearchIntent(
  contentType: ContentType,
  audience: TargetAudience,
  goal: BusinessGoal,
): SearchIntentAnalysis {
  const primaryIntent = CONTENT_TYPE_PRIMARY_INTENT[contentType];

  const supporting = new Set<SearchIntentType>();
  // Audience-driven supporting intents.
  if (audience === "Meeting planners" || audience === "Group travel planners") {
    supporting.add("Meeting planning");
    supporting.add("Comparison / research");
  }
  if (audience === "Event attendees") supporting.add("Event planning");
  if (audience === "Families" || audience === "Couples") supporting.add("Trip planning");
  if (audience === "Outdoor travelers" || audience === "Food and drink travelers" || audience === "Arts and culture travelers") {
    supporting.add("Local discovery");
  }
  if (audience === "Local residents") supporting.add("Local discovery");
  // Goal-driven supporting intents.
  if (goal === "Promote events") supporting.add("Event planning");
  if (goal === "Support hotel referrals" || goal === "Support partner referrals") {
    supporting.add("Transactional / booking support");
  }
  if (goal === "Improve AI search readiness") supporting.add("Comparison / research");
  supporting.delete(primaryIntent);

  const intentDescriptions: Record<SearchIntentType, string> = {
    Inspiration: "browsing for ideas and reasons to visit, not yet committed to a plan",
    "Trip planning": "actively planning a visit and looking for practical, organized guidance",
    "Transactional / booking support": "close to booking and seeking the final details to act",
    "Local discovery": "looking to discover specific places, activities, and local options",
    "Event planning": "researching event details, timing, logistics, and what surrounds it",
    "Meeting planning": "evaluating the destination for a meeting, convention, or group program",
    "Comparison / research": "comparing options and gathering evidence before deciding",
  };

  const supportingList = Array.from(supporting);
  const supportingText =
    supportingList.length > 0
      ? ` Secondary intents likely include ${supportingList
          .map((i) => `${i.toLowerCase()} (${intentDescriptions[i]})`)
          .join(", ")}.`
      : "";

  const explanation =
    `The dominant intent is ${primaryIntent.toLowerCase()}: the searcher is ${intentDescriptions[primaryIntent]}. ` +
    `Given the ${audience.toLowerCase()} audience and the goal to ${goal.toLowerCase()}, the content should lead with a direct, ` +
    `useful answer and then support deeper exploration.${supportingText}`;

  return { primaryIntent, supportingIntents: supportingList, explanation };
}

function buildH1Options(destination: string, primaryKeyword: string, contentType: ContentType, season: string): string[] {
  const kw = primaryKeyword.trim();
  const titleCaseKw = kw.charAt(0).toUpperCase() + kw.slice(1);
  const options = [
    titleCaseKw,
    `${titleCaseKw}: A Local Guide`,
  ];
  if (contentType === "Meetings / Conventions Page") {
    options.push(`Meetings & Conventions in ${destination}`);
  } else if (contentType === "Itinerary") {
    options.push(`How to Plan Your ${destination} Trip`);
  } else if (season !== "any season") {
    options.push(`${titleCaseKw} (${season.charAt(0).toUpperCase() + season.slice(1)} Edition)`);
  } else {
    options.push(`The Local's Guide to ${destination}`);
  }
  return Array.from(new Set(options)).slice(0, 3);
}

function buildTitleTags(destination: string, primaryKeyword: string, contentType: ContentType): string[] {
  const kw = primaryKeyword.trim();
  const titleKw = kw.charAt(0).toUpperCase() + kw.slice(1);
  const base = [
    `${titleKw} | ${destination}`,
    `${titleKw} | Local Guide & Tips`,
  ];
  if (contentType === "Meetings / Conventions Page") {
    base.push(`Plan a Meeting in ${destination} | Venues & Planning`);
  } else if (contentType === "Event Guide") {
    base.push(`${titleKw}: Schedule, Tips & What to Know`);
  } else {
    base.push(`${titleKw}: What to Know Before You Go`);
  }
  return base.slice(0, 3);
}

function buildMetaDescriptions(
  destination: string,
  primaryKeyword: string,
  audience: TargetAudience,
  cta: string,
): string[] {
  const kw = primaryKeyword.trim().toLowerCase();
  const ctaClause = cta.trim() ? ` ${cta.trim()}.` : "";
  const audienceClause = audience === "General audience" ? "visitors" : audience.toLowerCase();
  return [
    `Planning ${kw}? Get a locally informed guide for ${audienceClause} visiting ${destination}, with practical details to help you decide what to do.${ctaClause}`,
    `A practical ${destination} guide to ${kw}: what to expect, how to plan, and the local context ${audienceClause} actually need.${ctaClause}`,
    `Explore ${kw} in ${destination}. Curated, up-to-date guidance written with local insight to help you plan with confidence.${ctaClause}`,
  ].slice(0, 3);
}

function buildStructure(
  contentType: ContentType,
  destination: string,
  seasonTok: string,
): PageStructureSection[] {
  const template = STRUCTURE_TEMPLATES[contentType];
  const sections: PageStructureSection[] = [
    { heading: "[Selected H1 (see options above)]", level: "H1" },
  ];
  template.forEach((section) => {
    sections.push({
      heading: fillTokens(section.heading, destination, seasonTok),
      level: "H2",
      notes: section.notes ? fillTokens(section.notes, destination, seasonTok) : undefined,
    });
    section.subsections?.forEach((sub) => {
      sections.push({ heading: fillTokens(sub, destination, seasonTok), level: "H3" });
    });
  });
  return sections;
}

function mapSecondaryQueries(queries: string[], structure: PageStructureSection[]): { query: string; suggestedSection: string }[] {
  const sectionHeadings = structure.filter((s) => s.level === "H2").map((s) => s.heading);

  return queries.map((query) => {
    const lower = query.toLowerCase();
    // First, try keyword-rule mapping.
    for (const rule of QUERY_SECTION_KEYWORDS) {
      if (rule.keywords.some((k) => lower.includes(k))) {
        // Prefer an actual section heading that loosely matches the rule target.
        const match = sectionHeadings.find((h) =>
          rule.section.toLowerCase().split(" / ")[0].split(" ").some((word) => word.length > 3 && h.toLowerCase().includes(word)),
        );
        return { query, suggestedSection: match ?? rule.section };
      }
    }
    // Fallback: route to the introduction / overview section.
    const overview = sectionHeadings.find((h) => /overview|introduction|top|why|hero|reasons/i.test(h));
    return { query, suggestedSection: overview ?? sectionHeadings[0] ?? "Introduction" };
  });
}

function buildLocalKnowledge(
  destination: string,
  contentType: ContentType,
  providedDetails: string[],
): { detailsProvided: string[]; additionalToConfirm: string[] } {
  const baseConfirm = [
    "Confirm current event dates and which events are still active.",
    "Validate seasonal timing (peak periods, weather, what is open when).",
    "Confirm whether named attractions, venues, and businesses are currently open.",
    "Add local quotes or insider recommendations from staff or partners.",
    "Add partner businesses where appropriate and permitted.",
    `Confirm neighborhoods, transportation, parking, accessibility, and hours for ${destination}.`,
    "Add specific local details that communicate the true local feel of the destination.",
  ];

  const contentSpecific: Partial<Record<ContentType, string[]>> = {
    "Meetings / Conventions Page": [
      "Confirm venue capacities, square footage, and available meeting space.",
      "Verify hotel room-block availability and group rates.",
      "Confirm RFP/contact process and the right point of contact.",
    ],
    "Event Guide": [
      "Confirm official event name, dates, times, and ticketing details.",
      "Verify the event organizer and any partnership/attribution requirements.",
    ],
    "Restaurant Guide": [
      "Confirm restaurants are open and verify cuisine/category accuracy.",
      "Validate reservation policies and seasonal hours.",
    ],
    "Outdoor Activities Guide": [
      "Confirm trail/area access, closures, permits, and difficulty levels.",
      "Verify safety guidance and seasonal accessibility.",
    ],
    Itinerary: [
      "Validate travel times and the realism of the day-by-day pacing.",
      "Confirm that recommended stops are currently operating.",
    ],
  };

  const additional = [...baseConfirm, ...(contentSpecific[contentType] ?? [])];

  // If nothing was provided, lead with a clear callout (handled by UI), but the
  // additional-to-confirm list still applies. We never invent provided details.
  return { detailsProvided: providedDetails, additionalToConfirm: additional };
}

function buildInternalLinks(
  normalized: NormalizedBriefInput,
  contentType: ContentType,
): InternalLinkRecommendation[] {
  if (normalized.internalLinks.length > 0) {
    return normalized.internalLinks.map((link) => {
      const resolved = resolveInternalLink(link, normalized.currentUrl);
      return {
        link: resolved,
        source: "provided" as const,
        placement: suggestPlacementForLink(resolved),
      };
    });
  }

  const inferred = inferInternalLinksFromContext(normalized.currentUrl, contentType);
  if (inferred.length > 0) {
    return inferred.map((link) => ({
      link,
      source: "suggested-url" as const,
      placement: suggestPlacementForLink(link),
    }));
  }

  return DEFAULT_INTERNAL_LINK_CATEGORIES.map((category) => ({
    link: category,
    source: "suggested-category" as const,
    placement: suggestPlacementForCategory(category),
  }));
}

function buildSchemaRecommendations(contentType: ContentType): SchemaRecommendation[] {
  const types = [...BASE_SCHEMA_TYPES, ...CONTENT_TYPE_SCHEMA[contentType]];
  const unique = Array.from(new Set(types));
  return unique.map((type) => ({ type, reason: SCHEMA_REASONS[type] }));
}

function buildFaqSuggestions(
  destination: string,
  contentType: ContentType,
  season: string,
  audience: TargetAudience,
): string[] {
  const seasonClause = season === "any season" ? "" : ` in ${season}`;
  const general = [
    `What is the best time to visit ${destination}${seasonClause}?`,
    `What are the top things to do in ${destination}?`,
    `Are there free things to do in ${destination}?`,
    `How many days should I spend in ${destination}?`,
    `How do I get around ${destination}?`,
    `What should I know before visiting ${destination}?`,
  ];

  const byType: Partial<Record<ContentType, string[]>> = {
    "Family Travel Guide": [
      `What are the best family-friendly things to do in ${destination}?`,
      `Is ${destination} a good destination for young kids?`,
    ],
    "Meetings / Conventions Page": [
      `What meeting and convention venues are available in ${destination}?`,
      `How do I request a proposal for a meeting in ${destination}?`,
    ],
    "Restaurant Guide": [
      `Where should I eat in ${destination}?`,
      `Does ${destination} have good options for dietary restrictions?`,
    ],
    "Outdoor Activities Guide": [
      `What outdoor activities are available in ${destination}?`,
      `Are the trails near ${destination} suitable for beginners?`,
    ],
    "Event Guide": [
      `When is the event held in ${destination}?`,
      `Where should I park or stay for the event?`,
    ],
    Itinerary: [
      `What is a good ${destination} itinerary for a first visit?`,
      `Can I see the highlights of ${destination} in a weekend?`,
    ],
  };

  if (audience === "Couples") general.push(`What are romantic things to do in ${destination}?`);

  return Array.from(new Set([...general, ...(byType[contentType] ?? [])])).slice(0, 8);
}

function buildCompetitiveAndRefreshNotes(
  normalized: NormalizedBriefInput,
  goal: BusinessGoal,
  contentType: ContentType,
  destination: string,
  primaryKeyword: string,
): string[] {
  const { currentUrl, competitorUrls } = normalized;
  if (!currentUrl && competitorUrls.length === 0) {
    return [
      "Add a current page URL and/or competitor URLs in the form to unlock competitive and refresh analysis prompts.",
    ];
  }

  const notes: string[] = [];
  if (currentUrl) {
    notes.push(`Audit the existing page (${currentUrl}): identify outdated sections, thin blocks, and missing internal links before rewriting.`);
    if (goal === "Refresh outdated content") {
      notes.push("Document what changed since the last publish date (events, hours, seasonal claims) and what can be cut or merged.");
      notes.push("Compare current rankings and impressions for the primary keyword before and after the refresh plan.");
    }
    notes.push(`Ensure the refreshed page still satisfies intent for "${primaryKeyword}" within the first screen.`);
  }
  if (competitorUrls.length > 0) {
    notes.push(`Review ${competitorUrls.length} competitor URL(s) for content depth, section structure, FAQ coverage, and schema usage.`);
    notes.push("List topics competitors cover that this page should address better with local expertise, not generic filler.");
    notes.push("Note differentiation angles: official DMO voice, verified local details, partner listings, and up-to-date events.");
  }
  if (contentType === "Things To Do Page" || contentType === "Seasonal Guide") {
    notes.push(`Avoid duplicating other ${destination} hub pages; link laterally instead of repeating the same attraction lists.`);
  }
  return notes;
}

function buildSimpleviewPlatformNotes(
  goal: BusinessGoal,
  contentType: ContentType,
  normalized: NormalizedBriefInput,
): string[] {
  const notes: string[] = [
    "Align the page outline with Simpleview CMS modules and destination taxonomy (listings, categories, and hub pages).",
    "Use consistent listing fields (name, category, image, description, link) so partner and attraction data stays structured.",
    "Plan hero and gallery assets for DAM: alt text, credit, and aspect ratios before publish.",
  ];

  if (
    goal === "Support partner referrals" ||
    goal === "Support hotel referrals" ||
    /partner|listing|restaurant|stay|hotel/i.test(normalized.internalLinks.join(" "))
  ) {
    notes.push("Route booking intent to Book Direct / partner referral flows where appropriate; do not invent partner URLs or rates.");
    notes.push("Confirm partner listings are active, categorized correctly, and attributed per DMO policy.");
  }
  if (goal === "Promote events" || contentType === "Event Guide") {
    notes.push("Cross-check event names and dates against the DMO events calendar or feed before publishing.");
  }
  if (goal === "Support meetings and conventions leads" || contentType === "Meetings / Conventions Page") {
    notes.push("Surface venue and room-block listings from CRM/CMS; make the RFP or contact path obvious above the fold.");
  }
  if (contentType === "Restaurant Guide" || contentType === "Neighborhood Guide") {
    notes.push("Tie recommendations to verified listing pages rather than one-off mentions without a partner record.");
  }
  return notes;
}

const ACCESSIBILITY_GUIDELINES = [
  "Meet WCAG-oriented basics: logical heading order, descriptive link text, and sufficient color contrast.",
  "Require meaningful alt text for listing and hero images; avoid text baked into images without a transcript.",
  "Flag event and venue details that need accessibility fields (mobility, hearing, vision, sensory-friendly).",
];

function buildAiReadinessNotes(): string[] {
  return [
    "Include concise answer blocks near the top that directly answer the primary question in 1 to 3 sentences.",
    "Use clear entity references (destination name, neighborhoods, official venue names) consistently.",
    "Add direct answers to common traveler questions, mirroring real query phrasing.",
    "Use updated, factual local details. Answer engines reward freshness and specificity.",
    "Structure content with descriptive, self-explanatory headings rather than clever wordplay.",
    "Include unique local expertise and first-hand specifics that generic sources cannot replicate.",
    "Avoid vague, generic language; favor precise, verifiable statements.",
    ...ACCESSIBILITY_GUIDELINES.slice(0, 2),
  ];
}

function buildEditorialGuidelines(brandVoice: string[]): string[] {
  const guidelines = [
    "Keep content human and local; write as a knowledgeable resident would, not a brochure.",
    "Avoid generic travel clichés and filler.",
    'Avoid phrases like "hidden gem", "something for everyone", and "unforgettable experience" unless backed by specific details.',
    "Do not invent businesses, events, distances, prices, hours, or seasonal claims.",
    "Use specific examples provided by local stakeholders.",
    "Prioritize clarity, usefulness, and authenticity.",
    "Make the content helpful before promotional.",
    ...ACCESSIBILITY_GUIDELINES,
  ];
  if (brandVoice.length > 0) {
    guidelines.push(`Honor the provided brand voice: ${brandVoice.join(" ")}`);
  }
  return guidelines;
}

function buildRisks(
  internalLinks: string[],
  cta: string,
  localDetails: string[],
): string[] {
  const risks = [
    "Thin content: ensure each section delivers substantive, specific value.",
    "Duplicate destination content: differentiate from competitor and existing internal pages.",
    "Outdated event information: flag time-sensitive details for periodic review.",
    "Generic AI-sounding copy: enforce local specificity and a human voice.",
    "Over-optimized headings: keep headings natural and reader-first.",
    "Unsupported factual claims: verify every local fact before publishing.",
    "Accessibility gaps: missing alt text, poor heading hierarchy, or event details without inclusion notes.",
  ];
  if (internalLinks.length === 0) {
    risks.push("Missing internal links: no internal links were provided. Add contextual links before publishing.");
  }
  if (!cta.trim()) {
    risks.push("Lack of a clear CTA: no CTA goal was provided. Define a primary action for the page.");
  }
  if (localDetails.length === 0) {
    risks.push("Weak local expertise: no local details were provided. The page may read as generic until validated by local stakeholders.");
  }
  return risks;
}

function buildWriterChecklist(): string[] {
  return [
    "Confirm local facts with a local stakeholder or primary source.",
    "Confirm event dates and time-sensitive details.",
    "Add concrete local examples and insider specifics.",
    "Add and verify internal links with descriptive anchor text.",
    "Add the primary call to action in a prominent location.",
    "Add an FAQ section answering real traveler questions.",
    "Implement the recommended schema types.",
    "Review and finalize the title tag and meta description.",
    "Check that the content answers the primary search intent quickly.",
    "Review the draft for generic language and remove clichés.",
    "Run an accessibility pass: headings, alt text, link text, and keyboard-friendly CTAs.",
    "Validate ADA-relevant event and venue details with local stakeholders where applicable.",
  ];
}

/* ------------------------------------------------------------ markdown render */

function renderMarkdown(brief: DestinationBrief, input: NormalizedBriefInput): string {
  const o = brief.overview;
  const lines: string[] = [];
  const push = (s = "") => lines.push(s);

  push(`# Content Brief: ${o.destination}`);
  push();
  push("> Briefs are AI-assisted planning outputs. Final content should be written or reviewed by local experts.");
  push();

  push("## 1. Brief Overview");
  push(`- **Destination:** ${o.destination}`);
  push(`- **Content type:** ${o.contentType}`);
  push(`- **Primary keyword:** ${o.primaryKeyword}`);
  push(`- **Audience:** ${o.audience}`);
  push(`- **Seasonality:** ${o.seasonality}`);
  push(`- **Business goal:** ${o.businessGoal}`);
  push(`- **CTA goal:** ${o.ctaGoal || "Not provided"}`);
  push();

  push("## 2. Strategic Objective");
  push(brief.strategicObjective);
  push();

  push("## 3. Competitive & Content Refresh Notes");
  brief.competitiveAndRefreshNotes.forEach((n) => push(`- ${n}`));
  push();

  push("## 4. Simpleview Platform & Partner Notes");
  brief.simpleviewPlatformNotes.forEach((n) => push(`- ${n}`));
  push();

  push("## 5. Search Intent Analysis");
  push(`- **Primary intent:** ${brief.searchIntent.primaryIntent}`);
  if (brief.searchIntent.supportingIntents.length > 0) {
    push(`- **Supporting intents:** ${brief.searchIntent.supportingIntents.join(", ")}`);
  }
  push();
  push(brief.searchIntent.explanation);
  push();

  push("## 6. Recommended H1");
  brief.h1Options.forEach((h) => push(`- ${h}`));
  push();

  push("## 7. Recommended Title Tags");
  brief.titleTagOptions.forEach((t) => push(`- ${t}`));
  push();

  push("## 8. Recommended Meta Descriptions");
  brief.metaDescriptionOptions.forEach((m) => push(`- ${m}`));
  push();

  push("## 9. Recommended Page Structure");
  brief.recommendedStructure.forEach((s) => {
    const prefix = s.level === "H1" ? "#" : s.level === "H2" ? "##" : "###";
    const indent = s.level === "H3" ? "  " : "";
    push(`${indent}${prefix} ${s.heading}${s.notes ? ` (${s.notes})` : ""}`);
  });
  push();

  push("## 10. Secondary Query Mapping");
  if (brief.secondaryQueryMapping.length === 0) {
    push("_No secondary queries provided._");
  } else {
    brief.secondaryQueryMapping.forEach((m) => push(`- "${m.query}" → ${m.suggestedSection}`));
  }
  push();

  push("## 11. Local Knowledge Needed");
  if (brief.localKnowledgeNeeded.detailsProvided.length > 0) {
    push("### Local Details Provided");
    brief.localKnowledgeNeeded.detailsProvided.forEach((d) => push(`- ${d}`));
    push();
    push("### Additional Local Details to Confirm");
  } else {
    push("> No local details were provided. Do not invent local specifics. Complete the checklist below with a local stakeholder.");
    push();
    push("### Local Details to Confirm");
  }
  brief.localKnowledgeNeeded.additionalToConfirm.forEach((d) => push(`- [ ] ${d}`));
  push();

  push("## 12. Internal Linking Recommendations");
  const hasSuggestedCategories = brief.internalLinkRecommendations.some(
    (entry) => entry.source === "suggested-category",
  );
  const hasSuggestedUrls = brief.internalLinkRecommendations.some(
    (entry) => entry.source === "suggested-url",
  );
  if (input.internalLinks.length === 0 && hasSuggestedUrls) {
    push(
      `_No internal links were provided. Recommended on-site URLs were inferred from the current page URL and content type. Verify each link before publishing._`,
    );
  } else if (input.internalLinks.length === 0 && hasSuggestedCategories) {
    push("_No internal links provided. Recommended link categories (do not invent URLs):_");
  }
  brief.internalLinkRecommendations.forEach((r) => push(`- **${r.link}**: ${r.placement}`));
  push();

  push("## 13. Schema Recommendations");
  brief.schemaRecommendations.forEach((s) => push(`- **${s.type}**: ${s.reason}`));
  push();

  push("## 14. FAQ Suggestions");
  brief.faqSuggestions.forEach((f) => push(`- ${f}`));
  push();

  push("## 15. AI Search Readiness Notes");
  brief.aiSearchReadinessNotes.forEach((n) => push(`- ${n}`));
  push();

  push("## 16. Editorial Guidelines");
  brief.editorialGuidelines.forEach((g) => push(`- ${g}`));
  push();

  push("## 17. Risks and Watchouts");
  brief.risksAndWatchouts.forEach((r) => push(`- ${r}`));
  push();

  push("## 18. Final Writer Checklist");
  brief.finalWriterChecklist.forEach((c) => push(`- [ ] ${c}`));
  push();

  if (input.competitorUrls.length > 0 || input.currentUrl) {
    push("## Reference URLs");
    if (input.currentUrl) push(`- **Current URL:** ${input.currentUrl}`);
    input.competitorUrls.forEach((u) => push(`- **Competitor:** ${u}`));
    push();
  }

  return lines.join("\n").trimEnd() + "\n";
}

/* ------------------------------------------------------------- orchestration */

export interface NormalizedBriefInput {
  secondaryQueries: string[];
  competitorUrls: string[];
  internalLinks: string[];
  localDetails: string[];
  brandVoice: string[];
  currentUrl: string;
}

/** Normalizes textarea fields from raw form input (used for Markdown export). */
export function normalizeBriefInput(input: DestinationBriefInput): NormalizedBriefInput {
  return {
    secondaryQueries: toLines(input.secondaryQueries),
    competitorUrls: toLines(input.competitorUrls),
    internalLinks: toLines(input.internalLinks),
    localDetails: toLines(input.localDetailsProvided),
    brandVoice: toLines(input.brandVoiceNotes),
    currentUrl: input.currentUrl.trim(),
  };
}

/** Rebuilds `markdownOutput` after OpenAI or manual edits to brief sections. */
export function attachMarkdownOutput(
  brief: Omit<DestinationBrief, "markdownOutput">,
  input: DestinationBriefInput,
): DestinationBrief {
  const normalized = normalizeBriefInput(input);
  return {
    ...brief,
    markdownOutput: renderMarkdown({ ...brief, markdownOutput: "" }, normalized),
  };
}

/**
 * Generate a fully structured, deterministic destination content brief.
 *
 * Assumes required fields are present (validate with `validateBriefInput`
 * first). Optional fields are handled gracefully when empty.
 */
export function generateDestinationBrief(input: DestinationBriefInput): DestinationBrief {
  const destination = input.destinationName.trim();
  const contentType = input.contentType as ContentType;
  const audience = input.targetAudience as TargetAudience;
  const goal = input.businessGoal as BusinessGoal;
  const primaryKeyword = input.primaryKeyword.trim();
  const cta = input.ctaGoal.trim();

  const normalized = normalizeBriefInput(input);

  const season = seasonWord(input.seasonality);
  const seasonTok = seasonToken(input.seasonality);

  const recommendedStructure = buildStructure(contentType, destination, seasonTok);

  const brief: DestinationBrief = {
    overview: {
      destination,
      contentType,
      primaryKeyword,
      audience,
      seasonality: input.seasonality || "Evergreen",
      businessGoal: goal,
      ctaGoal: cta,
    },
    strategicObjective: buildStrategicObjective(destination, contentType, audience, goal, season),
    competitiveAndRefreshNotes: buildCompetitiveAndRefreshNotes(
      normalized,
      goal,
      contentType,
      destination,
      primaryKeyword,
    ),
    simpleviewPlatformNotes: buildSimpleviewPlatformNotes(goal, contentType, normalized),
    searchIntent: buildSearchIntent(contentType, audience, goal),
    h1Options: buildH1Options(destination, primaryKeyword, contentType, season),
    titleTagOptions: buildTitleTags(destination, primaryKeyword, contentType),
    metaDescriptionOptions: buildMetaDescriptions(destination, primaryKeyword, audience, cta),
    recommendedStructure,
    secondaryQueryMapping: mapSecondaryQueries(normalized.secondaryQueries, recommendedStructure),
    localKnowledgeNeeded: buildLocalKnowledge(destination, contentType, normalized.localDetails),
    internalLinkRecommendations: buildInternalLinks(normalized, contentType),
    schemaRecommendations: buildSchemaRecommendations(contentType),
    faqSuggestions: buildFaqSuggestions(destination, contentType, season, audience),
    aiSearchReadinessNotes: buildAiReadinessNotes(),
    editorialGuidelines: buildEditorialGuidelines(normalized.brandVoice),
    risksAndWatchouts: buildRisks(normalized.internalLinks, cta, normalized.localDetails),
    finalWriterChecklist: buildWriterChecklist(),
    markdownOutput: "",
  };

  brief.markdownOutput = renderMarkdown(brief, normalized);
  return brief;
}

/**
 * Builds a filesystem-friendly Markdown filename from the destination + keyword,
 * e.g. "asheville-nc-things-to-do-in-asheville-in-fall-content-brief.md".
 */
export function buildBriefFilename(destination: string, primaryKeyword: string): string {
  const slug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  const parts = [slug(destination), slug(primaryKeyword), "content-brief"].filter(Boolean);
  return `${parts.join("-")}.md`;
}
