import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import type { AIMessage } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, context } = body as { messages: AIMessage[]; context?: Record<string, unknown> };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    const provider = getAIProvider();
    const response = await provider.chat(messages, context);

    return NextResponse.json({ response, provider: process.env.AI_PROVIDER || "mock" });
  } catch {
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
