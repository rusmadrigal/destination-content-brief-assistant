/**
 * Server-only OpenAI configuration. Import only from API routes or server modules.
 */
export function getOpenAIConfig(): {
  apiKey: string | undefined;
  model: string;
  isConfigured: boolean;
} {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  return {
    apiKey,
    model,
    isConfigured: Boolean(apiKey && apiKey.length > 0),
  };
}
