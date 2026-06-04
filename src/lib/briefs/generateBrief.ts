import { discoverSiteInternalLinks } from "./discoverSiteInternalLinks";
import { enhanceBriefWithOpenAI } from "./enhanceBriefWithOpenAI";
import { generateDestinationBrief } from "./generateDestinationBrief";
import type { LinkDiscoverySignals } from "./internalLinkSuggestions";
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
  /** True when the server scanned the destination site for internal links. */
  siteLinksDiscovered?: boolean;
}

/**
 * Generates a content brief: deterministic baseline, optionally enhanced by OpenAI
 * when `OPENAI_API_KEY` is set and `preferDeterministic` is false.
 */
export async function generateBrief(
  input: DestinationBriefInput,
  options: GenerateBriefOptions = {},
): Promise<GenerateBriefResult> {
  const shouldDiscoverLinks = !input.internalLinks.trim() && Boolean(input.currentUrl.trim());
  const discovery = shouldDiscoverLinks
    ? await discoverSiteInternalLinks(input)
    : { rankedLinks: [], linkSignals: { navigationLinks: [], inPageLinks: [] } as LinkDiscoverySignals };
  const baseline = generateDestinationBrief(input, {
    discoveredLinks: discovery.rankedLinks,
    linkSignals: discovery.linkSignals,
  });

  if (options.preferDeterministic) {
    return {
      brief: baseline,
      source: "deterministic",
      openaiAttempted: false,
      siteLinksDiscovered: discovery.rankedLinks.length > 0,
    };
  }

  const enhanced = await enhanceBriefWithOpenAI(input, baseline);

  if (enhanced.success) {
    return {
      brief: enhanced.brief,
      source: "openai",
      openaiAttempted: true,
      siteLinksDiscovered: discovery.rankedLinks.length > 0,
    };
  }

  return {
    brief: baseline,
    source: "deterministic",
    openaiAttempted: true,
    openaiError: enhanced.error,
    siteLinksDiscovered: discovery.rankedLinks.length > 0,
  };
}
