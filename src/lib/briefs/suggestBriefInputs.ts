import type {
  BriefInputSuggestions,
  SuggestionSource,
} from "./suggestTypes";
import type { BusinessGoal, ContentType, Seasonality, TargetAudience } from "./types";

type DestinationProfile = "beach" | "mountain" | "metro" | "wine" | "meetings" | "generic";

function inferProfile(destination: string): DestinationProfile {
  const n = destination.toLowerCase();
  if (/beach|coast|shore|gulf|ocean|island|pcb|panama city/i.test(n)) return "beach";
  if (/mountain|ski|aspen|parkway|trail|hiking/i.test(n)) return "mountain";
  if (/wine|vineyard|valley|napa|sonoma/i.test(n)) return "wine";
  if (/convention|meetings|metro|city(?! beach)/i.test(n)) return "meetings";
  if (/\b(city|county|region|area)\b/i.test(n)) return "metro";
  return "generic";
}

function shortName(destination: string): string {
  return destination.trim();
}

function buildByProfile(destination: string, profile: DestinationProfile): Omit<BriefInputSuggestions, "destinationName" | "source"> {
  const d = shortName(destination);

  const profiles: Record<
    DestinationProfile,
    {
      contentType: ContentType;
      primaryKeyword: string;
      secondaryQueries: string[];
      targetAudience: TargetAudience;
      seasonality: Seasonality;
      businessGoal: BusinessGoal;
      ctaGoal: string;
      brandVoiceNotes: string;
      contextHints: string[];
    }
  > = {
    beach: {
      contentType: "Things To Do Page",
      primaryKeyword: `things to do in ${d}`,
      secondaryQueries: [
        `best beaches in ${d}`,
        `${d} family activities`,
        `${d} restaurants and dining`,
        `weekend trip to ${d}`,
        `${d} events calendar`,
      ],
      targetAudience: "Families",
      seasonality: "Summer",
      businessGoal: "Increase organic traffic",
      ctaGoal: `Start planning your ${d} getaway`,
      brandVoiceNotes: "Friendly, sun-and-sand practical tone. Helpful for families and weekend travelers. Not overly salesy.",
      contextHints: ["Coastal/beach destination pattern detected.", "Prioritize seasonal and family trip-planning queries."],
    },
    mountain: {
      contentType: "Outdoor Activities Guide",
      primaryKeyword: `outdoor things to do in ${d}`,
      secondaryQueries: [
        `hiking near ${d}`,
        `${d} fall foliage`,
        `best trails in ${d}`,
        `weekend in ${d}`,
      ],
      targetAudience: "Outdoor travelers",
      seasonality: "Fall",
      businessGoal: "Increase organic traffic",
      ctaGoal: `Explore outdoor adventures in ${d}`,
      brandVoiceNotes: "Active, practical, safety-aware. Emphasize seasons and trail/access context without inventing specifics.",
      contextHints: ["Outdoor/mountain destination pattern detected."],
    },
    wine: {
      contentType: "Restaurant Guide",
      primaryKeyword: `where to eat and drink in ${d}`,
      secondaryQueries: [
        `${d} wineries`,
        `${d} restaurants`,
        `weekend in ${d}`,
        `${d} tasting rooms`,
      ],
      targetAudience: "Food and drink travelers",
      seasonality: "Evergreen",
      businessGoal: "Support partner referrals",
      ctaGoal: `Discover dining and tastings in ${d}`,
      brandVoiceNotes: "Curated, local, experience-led. Partner-friendly without sounding like an ad.",
      contextHints: ["Food and drink / wine country pattern detected."],
    },
    meetings: {
      contentType: "Meetings / Conventions Page",
      primaryKeyword: `meetings and conventions in ${d}`,
      secondaryQueries: [
        `${d} meeting venues`,
        `${d} group hotels`,
        `plan a conference in ${d}`,
      ],
      targetAudience: "Meeting planners",
      seasonality: "Evergreen",
      businessGoal: "Support meetings and conventions leads",
      ctaGoal: `Request meeting planning support in ${d}`,
      brandVoiceNotes: "Professional, clear, RFP-friendly. Focus on logistics and planner needs.",
      contextHints: ["Meetings/conventions content pattern detected."],
    },
    metro: {
      contentType: "Things To Do Page",
      primaryKeyword: `things to do in ${d}`,
      secondaryQueries: [
        `${d} attractions`,
        `${d} neighborhoods`,
        `${d} events`,
        `weekend in ${d}`,
        `${d} restaurants`,
      ],
      targetAudience: "Leisure travelers",
      seasonality: "Evergreen",
      businessGoal: "Increase organic traffic",
      ctaGoal: `Plan your visit to ${d}`,
      brandVoiceNotes: "Welcoming, local, practical. Answer trip-planning questions early.",
      contextHints: ["City/region destination pattern detected."],
    },
    generic: {
      contentType: "Things To Do Page",
      primaryKeyword: `things to do in ${d}`,
      secondaryQueries: [
        `best activities in ${d}`,
        `${d} events`,
        `where to stay in ${d}`,
        `weekend in ${d}`,
      ],
      targetAudience: "Leisure travelers",
      seasonality: "Evergreen",
      businessGoal: "Increase organic traffic",
      ctaGoal: `Explore what to do in ${d}`,
      brandVoiceNotes: "Friendly, local, practical. Helpful before promotional.",
      contextHints: ["General DMO destination pattern applied."],
    },
  };

  const p = profiles[profile];
  return {
    contentType: p.contentType,
    primaryKeyword: p.primaryKeyword,
    secondaryQueries: p.secondaryQueries.join("\n"),
    targetAudience: p.targetAudience,
    seasonality: p.seasonality,
    businessGoal: p.businessGoal,
    ctaGoal: p.ctaGoal,
    internalLinks: ["/things-to-do/", "/events/", "/restaurants/", "/places-to-stay/", "/itineraries/"].join("\n"),
    brandVoiceNotes: p.brandVoiceNotes,
    contextHints: p.contextHints,
  };
}

/**
 * Deterministic SEO planning suggestions from destination name patterns.
 * Never invents specific businesses, events, or attractions.
 */
export function suggestBriefInputsDeterministic(destinationName: string): BriefInputSuggestions {
  const destination = destinationName.trim();
  const profile = inferProfile(destination);
  const body = buildByProfile(destination, profile);

  return {
    destinationName: destination,
    ...body,
    source: "deterministic" satisfies SuggestionSource,
  };
}
