import { enhanceBriefWithOpenAI } from "./enhanceBriefWithOpenAI";
import { generateDestinationBrief } from "./generateDestinationBrief";
import type { DestinationBrief, DestinationBriefInput } from "./types";

export type BriefGenerationSource = "openai" | "deterministic";

export interface GenerateBriefOptions {
  /** When true, skips OpenAI even if OPENAI_API_KEY is set. */
  preferDeterministic?: boolean;
}

export interface GenerateBriefResult {
  brief: DestinationBrief;
  source: BriefGenerationSource;
  openaiAttempted: boolean;
  openaiError?: string;
}

/**
 * Generates a content brief: deterministic baseline, optionally enhanced by OpenAI
 * when `OPENAI_API_KEY` is set and `preferDeterministic` is false.
 */
export async function generateBrief(
  input: DestinationBriefInput,
  options: GenerateBriefOptions = {},
): Promise<GenerateBriefResult> {
  const baseline = generateDestinationBrief(input);

  if (options.preferDeterministic) {
    return { brief: baseline, source: "deterministic", openaiAttempted: false };
  }

  const enhanced = await enhanceBriefWithOpenAI(input, baseline);

  if (enhanced.success) {
    return { brief: enhanced.brief, source: "openai", openaiAttempted: true };
  }

  return {
    brief: baseline,
    source: "deterministic",
    openaiAttempted: true,
    openaiError: enhanced.error,
  };
}
