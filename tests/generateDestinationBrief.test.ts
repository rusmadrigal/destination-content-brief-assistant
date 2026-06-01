import { describe, expect, it } from "vitest";
import { generateDestinationBrief } from "@/lib/briefs/generateDestinationBrief";
import type { DestinationBriefInput } from "@/lib/briefs/types";

const sampleInput: DestinationBriefInput = {
  destinationName: "Asheville, NC",
  contentType: "Seasonal Guide",
  primaryKeyword: "things to do in Asheville in fall",
  secondaryQueries: "fall events in Asheville\nAsheville fall foliage",
  targetAudience: "Leisure travelers",
  seasonality: "Fall",
  currentUrl: "https://www.example.com/fall-guide/",
  competitorUrls: "https://competitor.example.com/fall/",
  businessGoal: "Refresh outdated content",
  internalLinks: "/things-to-do/\n/events/",
  ctaGoal: "Explore fall events",
  brandVoiceNotes: "Friendly and local",
  localDetailsProvided: "",
};

describe("generateDestinationBrief", () => {
  it("returns all 18 markdown sections", () => {
    const brief = generateDestinationBrief(sampleInput);
    expect(brief.markdownOutput).toContain("## 1. Brief Overview");
    expect(brief.markdownOutput).toContain("## 18. Final Writer Checklist");
  });

  it("includes competitive notes when URLs are provided", () => {
    const brief = generateDestinationBrief(sampleInput);
    expect(brief.competitiveAndRefreshNotes.length).toBeGreaterThan(1);
    expect(brief.competitiveAndRefreshNotes.some((n) => n.includes("competitor"))).toBe(true);
    expect(brief.competitiveAndRefreshNotes.some((n) => n.includes("example.com/fall-guide"))).toBe(true);
  });

  it("does not invent local details when none provided", () => {
    const brief = generateDestinationBrief(sampleInput);
    expect(brief.localKnowledgeNeeded.detailsProvided).toHaveLength(0);
    expect(brief.localKnowledgeNeeded.additionalToConfirm.length).toBeGreaterThan(0);
  });

  it("includes Simpleview platform notes", () => {
    const brief = generateDestinationBrief(sampleInput);
    expect(brief.simpleviewPlatformNotes.some((n) => n.toLowerCase().includes("simpleview"))).toBe(true);
  });

  it("includes accessibility guidance in editorial and checklist", () => {
    const brief = generateDestinationBrief(sampleInput);
    const editorial = brief.editorialGuidelines.join(" ");
    const checklist = brief.finalWriterChecklist.join(" ");
    expect(editorial.toLowerCase()).toContain("wcag");
    expect(checklist.toLowerCase()).toContain("accessibility");
  });

  it("avoids em dashes in generated risks", () => {
    const brief = generateDestinationBrief(sampleInput);
    const joined = brief.risksAndWatchouts.join(" ");
    expect(joined).not.toContain("—");
  });
});
