import { NextResponse } from "next/server";
import { suggestBriefInputs } from "@/lib/briefs/suggestBriefInputsService";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { destinationName?: string; useOpenAI?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const destinationName = body.destinationName?.trim() ?? "";
  if (destinationName.length < 3) {
    return NextResponse.json(
      { error: "Enter at least 3 characters for the destination name." },
      { status: 400 },
    );
  }

  const suggestions = await suggestBriefInputs(destinationName, {
    useOpenAI: body.useOpenAI !== false,
  });

  return NextResponse.json({ suggestions });
}
