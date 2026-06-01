import type { DestinationBriefInput } from "./types";

export interface GenerateBriefRequestBody extends DestinationBriefInput {
  preferDeterministic?: boolean;
}
