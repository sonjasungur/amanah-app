import { NextResponse } from "next/server";
import { getServerRepository } from "@/lib/server/repository";
import { getBearerToken } from "@/lib/server/auth-utils";

export async function POST(request: Request) {
  const token = getBearerToken(request);
  if (token) {
    await getServerRepository().deleteSession(token);
  }
  return NextResponse.json({ success: true });
}
