import { describe, expect, it } from "vitest";
import { suggestBriefInputsDeterministic } from "@/lib/briefs/suggestBriefInputs";

describe("suggestBriefInputsDeterministic", () => {
  it("suggests beach-oriented fields for Panama City Beach", () => {
    const s = suggestBriefInputsDeterministic("Panama City Beach, FL");
    expect(s.contentType).toBe("Things To Do Page");
    expect(s.primaryKeyword.toLowerCase()).toContain("panama city beach");
    expect(s.targetAudience).toBe("Families");
    expect(s.seasonality).toBe("Summer");
    expect(s.secondaryQueries.split("\n").length).toBeGreaterThanOrEqual(4);
    expect(s.contextHints.some((h) => h.toLowerCase().includes("beach"))).toBe(true);
  });
});
