import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/server/memory-store";
import { getBearerToken } from "@/lib/server/auth-utils";

export async function POST(request: Request) {
  const token = getBearerToken(request);
  if (token) {
    deleteSession(token);
  }
  return NextResponse.json({ success: true });
}
