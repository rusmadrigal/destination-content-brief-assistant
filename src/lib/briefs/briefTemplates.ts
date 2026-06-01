/**
 * Deterministic templates that drive how a brief adapts to the chosen content
 * type. These are intentionally data-only so the generator can stay focused on
 * assembling sections, and so the templates are easy to audit and extend.
 *
 * IMPORTANT: Templates never reference specific local places, businesses, or
 * dates. They use the `{destination}` and `{season}` tokens, which the
 * generator replaces with user-provided values only.
 */
import type { ContentType, SchemaType, SearchIntentType } from "./types";

export interface StructureTemplateSection {
  heading: string;
  /** Optional child H3s rendered beneath the H2. */
  subsections?: string[];
  notes?: string;
}

/**
 * H2 outline per content type. `{destination}` and `{season}` tokens are
 * replaced at generation time. Every outline ends with an FAQs section.
 */
export const STRUCTURE_TEMPLATES: Record<ContentType, StructureTemplateSection[]> = {
  "Blog Article": [
    { heading: "Introduction", notes: "Set context and answer the core question early." },
    { heading: "Key Takeaways", notes: "Concise summary block for skimmers and AI answer engines." },
    { heading: "Main Topic Sections", subsections: ["Subtopic 1", "Subtopic 2", "Subtopic 3"] },
    { heading: "Practical Tips for Visitors" },
    { heading: "Related Experiences in {destination}" },
    { heading: "FAQs" },
  ],
  "Things To Do Page": [
    { heading: "Top Things To Do in {destination}" },
    { heading: "Outdoor Activities" },
    { heading: "Arts and Culture" },
    { heading: "Food and Drink" },
    { heading: "Family-Friendly Experiences" },
    { heading: "Events" },
    { heading: "Nearby Experiences" },
    { heading: "Planning Tips", subsections: ["Getting Around", "Best Time to Visit"] },
    { heading: "FAQs" },
  ],
  "Seasonal Guide": [
    { heading: "Why Visit {destination} in {season}" },
    { heading: "Best {season} Activities" },
    { heading: "Events and Festivals" },
    { heading: "Outdoor Experiences" },
    { heading: "Food and Drink" },
    { heading: "Family-Friendly Ideas" },
    { heading: "Suggested {season} Itinerary", subsections: ["Day 1", "Day 2"] },
    { heading: "Where to Stay" },
    { heading: "FAQs" },
  ],
  "Event Guide": [
    { heading: "About the Event", notes: "Confirm event ownership, dates, and official details with stakeholders." },
    { heading: "Event Schedule and Highlights" },
    { heading: "Getting There and Parking" },
    { heading: "Where to Stay Nearby" },
    { heading: "Things To Do Around the Event" },
    { heading: "Food and Drink Options" },
    { heading: "Tips for Attendees", subsections: ["What to Bring", "Accessibility"] },
    { heading: "FAQs" },
  ],
  Itinerary: [
    { heading: "Itinerary Overview" },
    { heading: "Before You Go", subsections: ["Getting Here", "Getting Around"] },
    { heading: "Day-by-Day Plan", subsections: ["Day 1", "Day 2", "Day 3"] },
    { heading: "Where to Eat Along the Way" },
    { heading: "Where to Stay" },
    { heading: "Suggested Add-Ons and Detours" },
    { heading: "FAQs" },
  ],
  "Restaurant Guide": [
    { heading: "Dining Scene Overview in {destination}" },
    { heading: "Restaurants by Cuisine" },
    { heading: "Restaurants by Neighborhood" },
    { heading: "Budget and Casual Options" },
    { heading: "Special Occasion Dining" },
    { heading: "Local Food Experiences", notes: "Validate signature dishes and local specialties with stakeholders." },
    { heading: "Planning Tips", subsections: ["Reservations", "Hours and Seasons"] },
    { heading: "FAQs" },
  ],
  "Outdoor Activities Guide": [
    { heading: "Outdoor Overview in {destination}" },
    { heading: "Hiking and Trails" },
    { heading: "Water Activities" },
    { heading: "Scenic Drives and Views" },
    { heading: "Seasonal Outdoor Experiences" },
    { heading: "Family-Friendly Outdoor Options" },
    { heading: "Safety and Preparation", subsections: ["What to Pack", "Accessibility"] },
    { heading: "FAQs" },
  ],
  "Family Travel Guide": [
    { heading: "Why {destination} Is Great for Families" },
    { heading: "Top Family Attractions" },
    { heading: "Outdoor and Active Fun" },
    { heading: "Indoor and Rainy-Day Options" },
    { heading: "Family-Friendly Dining" },
    { heading: "Where to Stay With Kids" },
    { heading: "Practical Family Tips", subsections: ["Getting Around", "Accessibility"] },
    { heading: "FAQs" },
  ],
  "Meetings / Conventions Page": [
    { heading: "Why Host Your Meeting in {destination}" },
    { heading: "Venues and Facilities" },
    { heading: "Hotels and Room Blocks" },
    { heading: "Transportation and Accessibility" },
    { heading: "Group Activities" },
    { heading: "Planning Support" },
    { heading: "Request for Proposal CTA", notes: "Make the RFP/contact path prominent." },
    { heading: "FAQs" },
  ],
  "Neighborhood Guide": [
    { heading: "Neighborhood Overview" },
    { heading: "What This Neighborhood Is Known For", notes: "Confirm character and identity with locals." },
    { heading: "Things To Do" },
    { heading: "Where to Eat and Drink" },
    { heading: "Shopping and Local Businesses" },
    { heading: "Getting There and Parking" },
    { heading: "Where to Stay Nearby" },
    { heading: "FAQs" },
  ],
  "Landing Page": [
    { heading: "Hero Value Proposition" },
    { heading: "Key Reasons to Visit {destination}" },
    { heading: "Featured Experiences", subsections: ["Category 1", "Category 2", "Category 3"] },
    { heading: "Plan Your Trip", subsections: ["Getting Here", "Where to Stay"] },
    { heading: "Primary Call to Action" },
    { heading: "FAQs" },
  ],
};

/** Schema type recommendations layered on top of a shared base set. */
export const BASE_SCHEMA_TYPES: SchemaType[] = ["FAQPage", "BreadcrumbList"];

export const CONTENT_TYPE_SCHEMA: Record<ContentType, SchemaType[]> = {
  "Blog Article": ["Article"],
  "Things To Do Page": ["ItemList", "TouristDestination", "CollectionPage"],
  "Seasonal Guide": ["Article", "ItemList", "TouristDestination"],
  "Event Guide": ["Event", "ItemList"],
  Itinerary: ["HowTo", "ItemList", "TouristDestination"],
  "Restaurant Guide": ["ItemList", "LocalBusiness", "CollectionPage"],
  "Outdoor Activities Guide": ["ItemList", "TouristDestination"],
  "Family Travel Guide": ["ItemList", "TouristDestination"],
  "Meetings / Conventions Page": ["LocalBusiness", "TouristDestination"],
  "Neighborhood Guide": ["TouristDestination", "ItemList", "LocalBusiness"],
  "Landing Page": ["TouristDestination", "CollectionPage"],
};

export const SCHEMA_REASONS: Record<SchemaType, string> = {
  Article: "Marks up editorial content with headline, author, and date for richer SERP eligibility.",
  FAQPage: "Structures the FAQ section so answer engines and rich results can surface direct answers.",
  BreadcrumbList: "Communicates the page's place in the site hierarchy and improves SERP breadcrumb display.",
  Event: "Describes event name, dates, and location so events can appear in event-specific results.",
  TouristDestination: "Reinforces the destination entity and its relationship to attractions and regions.",
  LocalBusiness: "Identifies specific businesses (venues, restaurants) with location and contact details.",
  ItemList: "Represents ranked or curated lists (top things to do, restaurants) as structured items.",
  HowTo: "Frames step-by-step itineraries or planning sequences for AI assistants and rich results.",
  CollectionPage: "Signals that the page is a curated hub linking to related sub-pages.",
};

/** Primary search intent inferred from content type. */
export const CONTENT_TYPE_PRIMARY_INTENT: Record<ContentType, SearchIntentType> = {
  "Blog Article": "Inspiration",
  "Things To Do Page": "Local discovery",
  "Seasonal Guide": "Trip planning",
  "Event Guide": "Event planning",
  Itinerary: "Trip planning",
  "Restaurant Guide": "Local discovery",
  "Outdoor Activities Guide": "Local discovery",
  "Family Travel Guide": "Trip planning",
  "Meetings / Conventions Page": "Meeting planning",
  "Neighborhood Guide": "Local discovery",
  "Landing Page": "Inspiration",
};

/** Internal link categories suggested when the user provides none. */
export const DEFAULT_INTERNAL_LINK_CATEGORIES: string[] = [
  "Things to Do hub",
  "Events calendar",
  "Places to Stay",
  "Restaurants",
  "Itineraries",
  "Transportation / Getting Here",
  "Partner listings",
];

/**
 * Keyword fragments mapped to the canonical section they most likely belong to.
 * Used for deterministic secondary-query mapping. Order matters: earlier, more
 * specific matches win.
 */
export const QUERY_SECTION_KEYWORDS: { keywords: string[]; section: string }[] = [
  { keywords: ["event", "festival", "concert", "show"], section: "Events and Festivals" },
  { keywords: ["foliage", "leaves", "fall color"], section: "Best Seasonal / Foliage Spots" },
  { keywords: ["restaurant", "food", "eat", "dining", "brewery", "wine", "coffee"], section: "Food and Drink" },
  { keywords: ["hike", "trail", "outdoor", "park", "kayak", "bike", "waterfall"], section: "Outdoor Experiences" },
  { keywords: ["kid", "family", "child", "toddler"], section: "Family-Friendly Ideas" },
  { keywords: ["itinerary", "weekend", "day trip", "days in", "long weekend"], section: "Suggested Itinerary" },
  { keywords: ["hotel", "stay", "lodging", "resort", "cabin", "airbnb"], section: "Where to Stay" },
  { keywords: ["museum", "art", "gallery", "history", "culture", "theater"], section: "Arts and Culture" },
  { keywords: ["meeting", "convention", "conference", "venue", "rfp"], section: "Venues and Facilities" },
  { keywords: ["parking", "transport", "getting", "airport", "drive"], section: "Planning Tips / Getting Here" },
  { keywords: ["things to do", "attractions", "activities"], section: "Top Things To Do" },
];
