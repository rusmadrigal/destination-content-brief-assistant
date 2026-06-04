import type { ContentType } from "./types";

const SECTION_RELATED_PATHS: Record<string, string[]> = {
  weddings: ["request-info/", "group-lodging-link/", "venues/"],
  meet: ["venues/", "request-proposal/", "planning-tools/"],
  stay: ["hotels/", "groups/", "bed-breakfast/"],
  "food-drink": ["restaurants/", "local-flavor/", "breweries/"],
  plan: ["communities/", "maps/", "visitor-guide/"],
  "things-to-do": ["top-attraction-picks/", "outdoor/", "historical/"],
};

const CONTENT_TYPE_HUB_PATHS: Partial<Record<ContentType, string[]>> = {
  "Blog Article": ["/blog/", "/things-to-do/", "/plan/"],
  "Things To Do Page": ["/things-to-do/", "/events/", "/plan/"],
  "Seasonal Guide": ["/things-to-do/", "/events/", "/plan/"],
  "Event Guide": ["/events/", "/things-to-do/", "/plan/"],
  Itinerary: ["/things-to-do/", "/plan/", "/stay/"],
  "Restaurant Guide": ["/food-drink/", "/food-drink/restaurants/", "/plan/"],
  "Outdoor Activities Guide": ["/things-to-do/outdoor/", "/things-to-do/", "/plan/"],
  "Family Travel Guide": ["/things-to-do/", "/events/", "/plan/"],
  "Meetings / Conventions Page": ["/meet/", "/meet/venues/", "/stay/groups/"],
  "Neighborhood Guide": ["/plan/communities/", "/things-to-do/", "/food-drink/"],
  "Landing Page": ["/plan/", "/things-to-do/", "/events/"],
};

function normalizePathname(pathname: string): string {
  const withLeading = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    return `${parsed.origin}${normalizePathname(parsed.pathname)}`;
  } catch {
    return url.trim();
  }
}

/** Resolves a relative path against the current page URL when possible. */
export function resolveInternalLink(link: string, currentUrl: string): string {
  const trimmed = link.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return normalizeUrl(trimmed);

  if (currentUrl) {
    try {
      return normalizeUrl(new URL(trimmed, currentUrl).href);
    } catch {
      return trimmed;
    }
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function joinOriginPath(origin: string, path: string): string {
  return normalizeUrl(`${origin}${normalizePathname(path)}`);
}

/**
 * Suggests on-site internal link URLs from the current page URL and content type.
 * Uses common DMO hub patterns; does not invent listing-level pages.
 */
export function inferInternalLinksFromContext(
  currentUrl: string,
  contentType: ContentType,
): string[] {
  const trimmed = currentUrl.trim();
  if (!trimmed) return [];

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return [];
  }

  const origin = parsed.origin;
  const current = normalizeUrl(trimmed);
  const segments = parsed.pathname.split("/").filter(Boolean);
  const candidates = new Set<string>();

  for (let depth = 1; depth < segments.length; depth += 1) {
    candidates.add(joinOriginPath(origin, `/${segments.slice(0, depth).join("/")}/`));
  }

  const section = segments[0];
  if (section && SECTION_RELATED_PATHS[section]) {
    for (const related of SECTION_RELATED_PATHS[section]) {
      candidates.add(joinOriginPath(origin, `/${section}/${related}`));
    }
  }

  const typePaths = CONTENT_TYPE_HUB_PATHS[contentType] ?? CONTENT_TYPE_HUB_PATHS["Landing Page"] ?? [];
  for (const path of typePaths) {
    candidates.add(joinOriginPath(origin, path));
  }

  return [...candidates]
    .filter((link) => link !== current)
    .slice(0, 8);
}

export function suggestPlacementForLink(link: string): string {
  const value = link.toLowerCase();
  if (/request-info|rfp|proposal|contact/.test(value)) {
    return "Use as a primary CTA link near the end of the copy.";
  }
  if (/event/.test(value)) return "Within the Events / Events and Festivals section.";
  if (/stay|hotel|lodg|group-lodging|bed-breakfast/.test(value)) {
    return "Within the Where to Stay or group lodging section.";
  }
  if (/restaurant|food|dining|flavor|brewer/.test(value)) {
    return "Within the Food and Drink section.";
  }
  if (/itinerar/.test(value)) return "Within the Suggested Itinerary or Plan Your Trip section.";
  if (/thing|do|activit|attraction|outdoor/.test(value)) {
    return "Within the Top Things To Do or related experiences section.";
  }
  if (/meet|convention|conference|venue/.test(value)) {
    return "Within meeting planner or venue discovery sections.";
  }
  if (/wedding/.test(value)) return "Within wedding planning or venue discovery sections.";
  if (/plan|visit|communities|map/.test(value)) {
    return "Within trip planning, intro, or hub navigation sections.";
  }
  if (/blog/.test(value)) return "Within related blog or editorial cross-link sections.";
  return "Within the most topically relevant section; verify anchor text matches the target page.";
}

export function suggestPlacementForCategory(category: string): string {
  const map: Record<string, string> = {
    "Things to Do hub": "Link from the introduction and any activity-focused section.",
    "Events calendar": "Link from the Events section and near time-sensitive content.",
    "Places to Stay": "Link from the Where to Stay section.",
    Restaurants: "Link from the Food and Drink section.",
    Itineraries: "Link from the Suggested Itinerary or planning sections.",
    "Transportation / Getting Here": "Link from the Planning Tips / Getting Here section.",
    "Partner listings": "Link contextually where partner businesses are referenced.",
  };
  return map[category] ?? "Place contextually within the most relevant section.";
}
