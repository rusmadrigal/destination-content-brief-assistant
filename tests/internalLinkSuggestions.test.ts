import { describe, expect, it } from "vitest";
import { generateDestinationBrief } from "@/lib/briefs/generateDestinationBrief";
import {
  inferInternalLinksFromContext,
  resolveInternalLink,
} from "@/lib/briefs/internalLinkSuggestions";
import type { DestinationBriefInput } from "@/lib/briefs/types";

describe("internalLinkSuggestions", () => {
  it("infers wedding cluster URLs from the current page", () => {
    const links = inferInternalLinksFromContext(
      "https://www.battlecreekvisitors.org/weddings/venues/",
      "Landing Page",
    );

    expect(links).toContain("https://www.battlecreekvisitors.org/weddings/");
    expect(links).toContain("https://www.battlecreekvisitors.org/weddings/request-info/");
    expect(links).not.toContain("https://www.battlecreekvisitors.org/weddings/venues/");
  });

  it("resolves relative paths against the current URL", () => {
    expect(resolveInternalLink("/events/", "https://www.example.com/things-to-do/")).toBe(
      "https://www.example.com/events/",
    );
  });
});

describe("generateDestinationBrief internal links", () => {
  it("returns suggested URLs when current URL is provided and internal links are blank", () => {
    const input: DestinationBriefInput = {
      destinationName: "Battle Creek, MI",
      contentType: "Landing Page",
      primaryKeyword: "wedding venues battle creek",
      secondaryQueries: "",
      targetAudience: "Couples",
      seasonality: "Evergreen",
      currentUrl: "https://www.battlecreekvisitors.org/weddings/venues/",
      competitorUrls: "",
      businessGoal: "Refresh outdated content",
      internalLinks: "",
      ctaGoal: "",
      brandVoiceNotes: "",
      localDetailsProvided: "",
    };

    const brief = generateDestinationBrief(input);
    expect(brief.internalLinkRecommendations.length).toBeGreaterThan(0);
    expect(brief.internalLinkRecommendations.some((entry) => entry.source === "suggested-url")).toBe(true);
    expect(
      brief.internalLinkRecommendations.some((entry) =>
        entry.link.includes("battlecreekvisitors.org/weddings/request-info"),
      ),
    ).toBe(true);
  });

  it("falls back to categories when no current URL is provided", () => {
    const input: DestinationBriefInput = {
      destinationName: "Asheville, NC",
      contentType: "Seasonal Guide",
      primaryKeyword: "fall in Asheville",
      secondaryQueries: "",
      targetAudience: "Leisure travelers",
      seasonality: "Fall",
      currentUrl: "",
      competitorUrls: "",
      businessGoal: "Increase organic traffic",
      internalLinks: "",
      ctaGoal: "",
      brandVoiceNotes: "",
      localDetailsProvided: "",
    };

    const brief = generateDestinationBrief(input);
    expect(brief.internalLinkRecommendations[0]?.source).toBe("suggested-category");
  });
});
