import { NextResponse } from "next/server";
import {
  getPublicAuthMode,
  getPublicStorageMode,
  getServerStorageMode,
  isDbConfigured,
} from "@/lib/server/config";
import { getServerRepository } from "@/lib/server/repository";
import { getAiProviderName, isAiEnabled, requiresExternalAiConsent } from "@/lib/ai/config";

export async function GET() {
  const serverStorage = getServerStorageMode();
  const dbConfigured = isDbConfigured();
  let dbReachable = false;

  if (dbConfigured && serverStorage === "postgres") {
    dbReachable = (await getServerRepository().checkConnection?.()) ?? false;
  }

  return NextResponse.json({
    status: "ok",
    authMode: getPublicAuthMode(),
    storageMode: getPublicStorageMode(),
    serverStorage,
    dbConfigured,
    dbReachable,
    aiEnabled: isAiEnabled(),
    aiProvider: getAiProviderName(),
    aiRequiresConsent: requiresExternalAiConsent(),
    timestamp: new Date().toISOString(),
    disclaimer: "Orientierung und Vorbereitung — keine Garantie auf Vollständigkeit oder rechtliche Wirksamkeit.",
  });
}
