import OpenAI from "openai";
import { getOpenAIConfig } from "@/lib/env/openai";
import {
  BUSINESS_GOALS,
  CONTENT_TYPES,
  SEASONALITIES,
  TARGET_AUDIENCES,
} from "./options";
import { suggestBriefInputsDeterministic } from "./suggestBriefInputs";
import { parseOpenAIJsonContent } from "./mergeOpenAIBrief";
import type { BriefInputSuggestions } from "./suggestTypes";
import type { BusinessGoal, ContentType, Seasonality, TargetAudience } from "./types";

const CONTENT_TYPE_SET = new Set<string>(CONTENT_TYPES);
const AUDIENCE_SET = new Set<string>(TARGET_AUDIENCES);
const SEASON_SET = new Set<string>(SEASONALITIES);
const GOAL_SET = new Set<string>(BUSINESS_GOALS);

function pickEnum<T extends string>(value: unknown, allowed: Set<string>, fallback: T): T {
  return typeof value === "string" && allowed.has(value) ? (value as T) : fallback;
}

function pickString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function coerceSuggestions(parsed: unknown, baseline: BriefInputSuggestions): BriefInputSuggestions {
  const o = typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
  return {
    destinationName: baseline.destinationName,
    contentType: pickEnum<ContentType>(
      o.contentType,
      CONTENT_TYPE_SET,
      baseline.contentType || "Things To Do Page",
    ),
    primaryKeyword: pickString(o.primaryKeyword, baseline.primaryKeyword),
    secondaryQueries: pickString(o.secondaryQueries, baseline.secondaryQueries),
    targetAudience: pickEnum<TargetAudience>(
      o.targetAudience,
      AUDIENCE_SET,
      baseline.targetAudience || "Leisure travelers",
    ),
    seasonality: pickEnum<Seasonality>(o.seasonality, SEASON_SET, baseline.seasonality || "Evergreen"),
    businessGoal: pickEnum<BusinessGoal>(
      o.businessGoal,
      GOAL_SET,
      baseline.businessGoal || "Increase organic traffic",
    ),
    ctaGoal: pickString(o.ctaGoal, baseline.ctaGoal),
    internalLinks: pickString(o.internalLinks, baseline.internalLinks),
    brandVoiceNotes: pickString(o.brandVoiceNotes, baseline.brandVoiceNotes),
    contextHints: Array.isArray(o.contextHints)
      ? o.contextHints.filter((h): h is string => typeof h === "string" && h.trim().length > 0)
      : baseline.contextHints,
    source: "openai",
  };
}

const SYSTEM_PROMPT = `You suggest SEO content-brief FORM VALUES for DMO (destination marketing) teams.

Return JSON with these keys only:
contentType, primaryKeyword, secondaryQueries, targetAudience, seasonality, businessGoal, ctaGoal, internalLinks, brandVoiceNotes, contextHints

Rules:
- contentType must be one of: ${CONTENT_TYPES.join(", ")}
- targetAudience must be one of: ${TARGET_AUDIENCES.join(", ")}
- seasonality must be one of: ${SEASONALITIES.join(", ")}
- businessGoal must be one of: ${BUSINESS_GOALS.join(", ")}
- secondaryQueries: 4-6 lines, one query per line, realistic search phrases for the destination
- internalLinks: 4-6 relative paths like /things-to-do/ one per line
- contextHints: 2-3 short strings explaining your reasoning
- Do NOT invent specific businesses, restaurants, events, venues, or attractions by name
- Do NOT invent addresses, dates, or prices
- Use the destination name naturally in keywords
- No em dashes
- JSON only`;

export type SuggestInputsResult =
  | { success: true; suggestions: BriefInputSuggestions }
  | { success: false; error: string };

export async function suggestBriefInputsWithOpenAI(
  destinationName: string,
): Promise<SuggestInputsResult> {
  const baseline = suggestBriefInputsDeterministic(destinationName);
  const { apiKey, model, isConfigured } = getOpenAIConfig();

  if (!isConfigured || !apiKey) {
    return { success: true, suggestions: baseline };
  }

  const client = new OpenAI({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Suggest form values for a DMO content brief about: ${baseline.destinationName}\n\nBaseline to improve (keep valid enums):\n${JSON.stringify(baseline, null, 2)}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return { success: true, suggestions: baseline };
    }

    const parsed = parseOpenAIJsonContent(raw);
    const suggestions = coerceSuggestions(parsed, baseline);
    return { success: true, suggestions };
  } catch (error) {
    console.warn("[OpenAI suggest] Failed, using deterministic:", error);
    return { success: true, suggestions: baseline };
  }
}
