import { NextResponse } from "next/server";
import { getServerRepository } from "@/lib/server/repository";
import { crossOriginRejected } from "@/lib/server/auth-utils";
import { clearSessionCookie, isSameOriginRequest, readSessionToken } from "@/lib/server/session-cookie";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginRejected();
  const token = readSessionToken(request);
  if (token) {
    await getServerRepository().deleteSession(token);
  }
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
