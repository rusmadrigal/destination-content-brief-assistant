import OpenAI from "openai";
import { getOpenAIConfig } from "./openai";

let cachedClient: OpenAI | null = null;
let cachedKey: string | undefined;

/** Reuses a single OpenAI client instance across requests (avoids cold connection setup). */
export function getOpenAIClient(): OpenAI | null {
  const { apiKey, isConfigured } = getOpenAIConfig();
  if (!isConfigured || !apiKey) return null;

  if (!cachedClient || cachedKey !== apiKey) {
    cachedClient = new OpenAI({ apiKey });
    cachedKey = apiKey;
  }

  return cachedClient;
}
