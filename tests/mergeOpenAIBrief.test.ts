import { describe, expect, it } from "vitest";
import { generateDestinationBrief } from "@/lib/briefs/generateDestinationBrief";
import { mergeOpenAIResponseWithBaseline } from "@/lib/briefs/mergeOpenAIBrief";
import type { DestinationBriefInput } from "@/lib/briefs/types";

const sampleInput: DestinationBriefInput = {
  destinationName: "Asheville, NC",
  contentType: "Seasonal Guide",
  primaryKeyword: "things to do in Asheville in fall",
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

describe("mergeOpenAIResponseWithBaseline", () => {
  it("recovers from partial invalid OpenAI JSON", () => {
    const baseline = generateDestinationBrief(sampleInput);
    const merged = mergeOpenAIResponseWithBaseline(
      {
        strategicObjective: "Improved objective text.",
        searchIntent: {
          primaryIntent: "Invalid Intent",
          supportingIntents: ["Trip planning", "Not A Real Intent"],
          explanation: "Better explanation.",
        },
        h1Options: ["New H1 option"],
      },
      baseline,
      sampleInput,
    );

    expect(merged.strategicObjective).toBe("Improved objective text.");
    expect(merged.searchIntent.primaryIntent).toBe(baseline.searchIntent.primaryIntent);
    expect(merged.searchIntent.supportingIntents).toEqual(["Trip planning"]);
    expect(merged.h1Options).toEqual(["New H1 option"]);
    expect(merged.overview.destination).toBe("Asheville, NC");
  });
});
