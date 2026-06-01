import { NextResponse } from "next/server";
import type { GenerateBriefRequestBody } from "@/lib/briefs/apiTypes";
import { generateBrief } from "@/lib/briefs/generateBrief";
import type { DestinationBriefInput } from "@/lib/briefs/types";
import { hasErrors, validateBriefInput } from "@/lib/briefs/validation";
import { getOpenAIConfig } from "@/lib/env/openai";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 100_000;

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

  let body: GenerateBriefRequestBody;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body too large." }, { status: 413 });
    }
    body = JSON.parse(raw) as GenerateBriefRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { preferDeterministic, ...inputFields } = body;
  const input = inputFields as DestinationBriefInput;

  const errors = validateBriefInput(input);
  if (hasErrors(errors)) {
    return NextResponse.json({ error: "Validation failed.", fields: errors }, { status: 400 });
  }

  const { brief, source, openaiAttempted, openaiError } = await generateBrief(input, {
    preferDeterministic: Boolean(preferDeterministic),
  });
  const { isConfigured } = getOpenAIConfig();

  return NextResponse.json({
    brief,
    source,
    openaiConfigured: isConfigured,
    openaiAttempted,
    openaiError,
  });
}
