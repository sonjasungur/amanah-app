import { NextResponse } from "next/server";
import { getDatabaseStatus } from "@/lib/server/memory-store";
import { getDbConnectionStatus } from "@/lib/server/db";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    storage: "memory",
    database: getDatabaseStatus(),
    databaseUrl: getDbConnectionStatus(),
    auth: "memory",
    timestamp: new Date().toISOString(),
    disclaimer: "Orientierung und Vorbereitung — keine Garantie auf Vollständigkeit oder rechtliche Wirksamkeit.",
  });
}
