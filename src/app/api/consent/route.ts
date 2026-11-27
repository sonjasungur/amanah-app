import { NextResponse } from "next/server";
import { CONSENT_PURPOSES, isConsentPurpose } from "@/lib/consent/purposes";
import { crossOriginRejected, getAuthenticatedUserId, getServerRepository } from "@/lib/server/auth-utils";
import { findActiveConsent } from "@/lib/server/consent";
import { isSameOriginRequest } from "@/lib/server/session-cookie";

function unauthorized() {
  return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
}

/** Current state per purpose plus the full history (proof of consent). */
export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();
  const records = await getServerRepository().listConsents(userId);
  const status = Object.fromEntries(
    Object.values(CONSENT_PURPOSES).map((def) => {
      const active = findActiveConsent(records, def.purpose);
      return [def.purpose, { granted: Boolean(active), version: def.version, grantedAt: active?.grantedAt ?? null }];
    })
  );
  return NextResponse.json({ status, history: records, definitions: CONSENT_PURPOSES });
}

/** Grant requires an explicit act: confirmed === true and the exact current text version. */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginRejected();
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();
  const { purpose, version, confirmed } = (await request.json().catch(() => ({}))) as {
    purpose?: unknown;
    version?: unknown;
    confirmed?: unknown;
  };
  if (!isConsentPurpose(purpose) || confirmed !== true || version !== CONSENT_PURPOSES[purpose].version) {
    return NextResponse.json({ error: "Einwilligung unvollständig oder veraltet." }, { status: 400 });
  }
  const repo = getServerRepository();
  const records = await repo.listConsents(userId);
  const record = findActiveConsent(records, purpose) ?? (await repo.grantConsent(userId, purpose, version));
  return NextResponse.json({ consent: record }, { status: 201 });
}

/** Withdrawal. For folder storage the server copy is deleted; the account remains. */
export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginRejected();
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();
  const { purpose } = (await request.json().catch(() => ({}))) as { purpose?: unknown };
  if (!isConsentPurpose(purpose)) return NextResponse.json({ error: "Unbekannter Zweck." }, { status: 400 });

  const repo = getServerRepository();
  await repo.revokeConsent(userId, purpose);
  if (purpose === "sensitive_folder_storage") await repo.deleteAmanahData(userId);
  return NextResponse.json({ success: true, message: CONSENT_PURPOSES[purpose].onWithdraw });
}
