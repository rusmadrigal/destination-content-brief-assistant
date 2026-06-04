import { describe, expect, it } from "vitest";
import { generateDestinationBrief } from "@/lib/briefs/generateDestinationBrief";
import {
  buildPlanningSheetRow,
  formatPlanningSheetRowTsv,
  mapExcelContentType,
} from "@/lib/briefs/planningSheetExport";
import type { DestinationBriefInput } from "@/lib/briefs/types";

const weddingVenuesInput: DestinationBriefInput = {
  destinationName: "Battle Creek, MI",
  contentType: "Landing Page",
  primaryKeyword: "wedding venues battle creek",
  secondaryQueries:
    "wedding venues in battle creek michigan\nvenues in battle creek mi\nWhat types of wedding venues are available in Battle Creek?",
  targetAudience: "Couples",
  seasonality: "Evergreen",
  currentUrl: "https://www.battlecreekvisitors.org/weddings/venues/",
  competitorUrls: "",
  businessGoal: "Refresh outdated content",
  internalLinks:
    "https://www.battlecreekvisitors.org/weddings/request-info/\nhttps://www.battlecreekvisitors.org/weddings/",
  ctaGoal: "Get details from your favorite Battle Creek venues",
  brandVoiceNotes: "",
  localDetailsProvided: "",
};

describe("planningSheetExport", () => {
  it("maps refresh URLs to Page Refresh or Expand Copy by content type", () => {
    expect(mapExcelContentType(weddingVenuesInput)).toBe("Page Refresh");

    expect(
      mapExcelContentType({
        ...weddingVenuesInput,
        contentType: "Landing Page",
        businessGoal: "Increase organic traffic",
      }),
    ).toBe("Expand Copy");

    expect(
      mapExcelContentType({
        ...weddingVenuesInput,
        currentUrl: "",
        contentType: "Blog Article",
      }),
    ).toBe("New Blog");
  });

  it("builds a planning row with Battle Creek-style columns", () => {
    const brief = generateDestinationBrief(weddingVenuesInput);
    const row = buildPlanningSheetRow(brief, weddingVenuesInput);

    expect(row.topic).toMatch(/\[Wedding Venues\] - short form/i);
    expect(row.contentType).toBe("Page Refresh");
    expect(row.url).toBe(weddingVenuesInput.currentUrl);
    expect(row.targetKeywords).toContain("Primary:");
    expect(row.targetKeywords).toContain("wedding venues battle creek");
    expect(row.headersTopics).toContain("1. Objective");
    expect(row.headersTopics).toContain("2. Suggested H1");
    expect(row.headersTopics).toContain("3. Recommended H2 Section Topics");
    expect(row.headersTopics).toContain("FAQs");
    expect(row.internalLinks).toContain("battlecreekvisitors.org/weddings/request-info");
  });

  it("exports a six-column TSV row for Excel paste", () => {
    const brief = generateDestinationBrief(weddingVenuesInput);
    const row = buildPlanningSheetRow(brief, weddingVenuesInput);
    const tsv = formatPlanningSheetRowTsv(row);

    expect(tsv.split("\t")).toHaveLength(6);
    expect(tsv.startsWith("[")).toBe(true);
  });
});
