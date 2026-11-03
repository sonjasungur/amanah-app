import { NextResponse } from "next/server";
import { FOLDER_UNREADABLE_CODE } from "@/lib/storage/types";
import { DataEncryptionError } from "./data-encryption";

const MESSAGE =
  "Deine gespeicherten Daten sind gerade nicht lesbar. Sie wurden nicht verändert. Speichern ist gesperrt, bis das behoben ist.";

/** The answer for any key problem, or null for other errors. Says nothing about keys, logs no user. */
export function folderUnreadableResponse(error: unknown): NextResponse | null {
  if (!(error instanceof DataEncryptionError)) return null;
  // The operator alarm: the error text holds no key material.
  console.error(`[folder] rejected: ${error.message}`);
  return NextResponse.json({ error: MESSAGE, code: FOLDER_UNREADABLE_CODE }, { status: 503, headers: { "Retry-After": "300" } });
}
