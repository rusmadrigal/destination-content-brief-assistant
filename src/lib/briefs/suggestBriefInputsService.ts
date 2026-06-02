import { suggestBriefInputsDeterministic } from "./suggestBriefInputs";
import { suggestBriefInputsWithOpenAI } from "./suggestBriefInputsWithOpenAI";
import type { BriefInputSuggestions } from "./suggestTypes";

export interface SuggestBriefInputsOptions {
  useOpenAI?: boolean;
}

export async function suggestBriefInputs(
  destinationName: string,
  options: SuggestBriefInputsOptions = {},
): Promise<BriefInputSuggestions> {
  const trimmed = destinationName.trim();
  if (trimmed.length < 3) {
    return suggestBriefInputsDeterministic(trimmed || "Destination");
  }

  if (options.useOpenAI === false) {
    return suggestBriefInputsDeterministic(trimmed);
  }

  const result = await suggestBriefInputsWithOpenAI(trimmed);
  if (result.success) return result.suggestions;
  return suggestBriefInputsDeterministic(trimmed);
}
