import { NextResponse } from "next/server";
import { generateBrief } from "@/lib/briefs/generateBrief";
import type { DestinationBriefInput } from "@/lib/briefs/types";
import { hasErrors, validateBriefInput } from "@/lib/briefs/validation";
import { getOpenAIConfig } from "@/lib/env/openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const input = body as DestinationBriefInput;
  const errors = validateBriefInput(input);
  if (hasErrors(errors)) {
    return NextResponse.json({ error: "Validation failed.", fields: errors }, { status: 400 });
  }

  const { brief, source } = await generateBrief(input);
  const { isConfigured } = getOpenAIConfig();

  return NextResponse.json({
    brief,
    source,
    openaiConfigured: isConfigured,
  });
}
