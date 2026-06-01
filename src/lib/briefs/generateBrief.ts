import { enhanceBriefWithOpenAI } from "./enhanceBriefWithOpenAI";
import { generateDestinationBrief } from "./generateDestinationBrief";
import type { DestinationBrief, DestinationBriefInput } from "./types";

export type BriefGenerationSource = "openai" | "deterministic";

export interface GenerateBriefResult {
  brief: DestinationBrief;
  source: BriefGenerationSource;
}

/**
 * Generates a content brief: deterministic baseline, optionally enhanced by OpenAI
 * when `OPENAI_API_KEY` is set in `.env.local`.
 */
export async function generateBrief(input: DestinationBriefInput): Promise<GenerateBriefResult> {
  const baseline = generateDestinationBrief(input);
  const enhanced = await enhanceBriefWithOpenAI(input, baseline);

  if (enhanced) {
    return { brief: enhanced, source: "openai" };
  }

  return { brief: baseline, source: "deterministic" };
}
