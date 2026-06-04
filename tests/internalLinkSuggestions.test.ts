import { describe, expect, it } from "vitest";
import {
  extractLinksFromHtml,
  extractLinksFromSitemapXml,
  parseHtmlLinkSignals,
} from "@/lib/briefs/discoverSiteInternalLinks";
import { generateDestinationBrief } from "@/lib/briefs/generateDestinationBrief";
import {
  buildStrategicInternalLinkRecommendations,
  inferInternalLinksFromContext,
  MIN_STRATEGIC_INTERNAL_LINKS,
  rankStrategicInternalLinks,
  resolveInternalLink,
} from "@/lib/briefs/internalLinkSuggestions";
import type { DestinationBriefInput } from "@/lib/briefs/types";

describe("internalLinkSuggestions", () => {
  it("infers wedding cluster URLs from the current page", () => {
    const links = inferInternalLinksFromContext(
      "https://www.battlecreekvisitors.org/weddings/venues/",
      "Landing Page",
    );

    expect(links.length).toBeGreaterThanOrEqual(MIN_STRATEGIC_INTERNAL_LINKS);
    expect(links).toContain("https://www.battlecreekvisitors.org/weddings/");
    expect(links).toContain("https://www.battlecreekvisitors.org/weddings/request-info/");
    expect(links).not.toContain("https://www.battlecreekvisitors.org/weddings/venues/");
  });

  it("resolves relative paths against the current URL", () => {
    expect(resolveInternalLink("/events/", "https://www.example.com/things-to-do/")).toBe(
      "https://www.example.com/events/",
    );
  });

  it("returns at least three strategic URL recommendations", () => {
    const recommendations = buildStrategicInternalLinkRecommendations({
      currentUrl: "https://www.battlecreekvisitors.org/weddings/venues/",
      contentType: "Landing Page",
      primaryKeyword: "wedding venues battle creek",
      providedLinks: [],
      discoveredLinks: [
        "https://www.battlecreekvisitors.org/weddings/request-info/",
        "https://www.battlecreekvisitors.org/weddings/group-lodging-link/",
        "https://www.battlecreekvisitors.org/plan/",
      ],
    });

    expect(recommendations.filter((entry) => entry.source !== "suggested-category").length).toBeGreaterThanOrEqual(
      MIN_STRATEGIC_INTERNAL_LINKS,
    );
    expect(recommendations.some((entry) => entry.source === "discovered-url")).toBe(true);
  });

  it("ranks same-section and keyword-aligned links higher", () => {
    const ranked = rankStrategicInternalLinks(
      [
        "https://www.battlecreekvisitors.org/privacy/",
        "https://www.battlecreekvisitors.org/weddings/request-info/",
        "https://www.battlecreekvisitors.org/blog/",
      ],
      {
        currentUrl: "https://www.battlecreekvisitors.org/weddings/venues/",
        contentType: "Landing Page",
        primaryKeyword: "wedding venues battle creek",
      },
    );

    expect(ranked[0]).toContain("/weddings/request-info/");
  });
});

describe("discoverSiteInternalLinks parsing", () => {
  it("extracts same-origin links from HTML", () => {
    const html = `
      <a href="/weddings/request-info/">Request Info</a>
      <a href="https://www.battlecreekvisitors.org/weddings/">Weddings</a>
      <a href="https://google.com/">External</a>
    `;

    const links = extractLinksFromHtml(html, "https://www.battlecreekvisitors.org/weddings/venues/");
    expect(links).toContain("https://www.battlecreekvisitors.org/weddings/request-info/");
    expect(links).toContain("https://www.battlecreekvisitors.org/weddings/");
    expect(links.some((link) => link.includes("google.com"))).toBe(false);
  });

  it("separates navigation and in-page link signals", () => {
    const html = `
      <header>
        <nav>
          <a href="/plan/">Plan Your Visit</a>
          <a href="/events/">Events</a>
        </nav>
      </header>
      <main>
        <p>See our <a href="/weddings/request-info/">wedding info form</a>.</p>
        <a href="/weddings/group-lodging-link/">Group lodging</a>
      </main>
    `;

    const signals = parseHtmlLinkSignals(html, "https://www.battlecreekvisitors.org/weddings/venues/");
    expect(signals.navigationLinks).toContain("https://www.battlecreekvisitors.org/plan/");
    expect(signals.navigationLinks).toContain("https://www.battlecreekvisitors.org/events/");
    expect(signals.inPageLinks).toContain("https://www.battlecreekvisitors.org/weddings/request-info/");
    expect(signals.inPageLinks).toContain("https://www.battlecreekvisitors.org/weddings/group-lodging-link/");
  });

  it("prioritizes in-page links over sitemap-only links when ranking", () => {
    const ranked = rankStrategicInternalLinks(
      [
        "https://www.battlecreekvisitors.org/privacy/",
        "https://www.battlecreekvisitors.org/weddings/group-lodging-link/",
        "https://www.battlecreekvisitors.org/blog/",
      ],
      {
        currentUrl: "https://www.battlecreekvisitors.org/weddings/venues/",
        contentType: "Landing Page",
        primaryKeyword: "wedding venues battle creek",
        linkSignals: {
          navigationLinks: ["https://www.battlecreekvisitors.org/plan/"],
          inPageLinks: ["https://www.battlecreekvisitors.org/weddings/group-lodging-link/"],
        },
      },
    );

    expect(ranked[0]).toContain("/weddings/group-lodging-link/");
  });

  it("extracts links from sitemap XML", () => {
    const xml = `
      <urlset>
        <url><loc>https://www.battlecreekvisitors.org/weddings/request-info/</loc></url>
        <url><loc>https://www.battlecreekvisitors.org/meet/</loc></url>
      </urlset>
    `;

    const links = extractLinksFromSitemapXml(xml, "https://www.battlecreekvisitors.org");
    expect(links).toContain("https://www.battlecreekvisitors.org/weddings/request-info/");
    expect(links).toContain("https://www.battlecreekvisitors.org/meet/");
  });
});

describe("generateDestinationBrief internal links", () => {
  it("returns at least three suggested URLs when current URL is provided", () => {
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
    const urlLinks = brief.internalLinkRecommendations.filter(
      (entry) => entry.source !== "suggested-category",
    );
    expect(urlLinks.length).toBeGreaterThanOrEqual(MIN_STRATEGIC_INTERNAL_LINKS);
    expect(urlLinks.some((entry) => entry.link.includes("weddings/request-info"))).toBe(true);
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
