/**
 * PROTOTYPE – not wired to any API, store or page. Concept: docs/release/p2-angehoerigenzugang-konzept.md.
 *
 * Emergency access for named trusted people, per information area, without handing over the main
 * password. Rules this model enforces (each one is a test in p2-emergency-access.test.ts):
 * - Nothing is ever active by itself: a grant starts as a draft; the owner must confirm it, the
 *   invited person must accept it with their own verified account.
 * - Each area is granted separately; health details need their own explicit confirmation.
 * - "After confirmation" access needs an emergency request and a waiting period during which the
 *   owner can object; only then is access open, and only for the granted areas.
 * - Revoking ends access at once; expired grants give no access.
 * - Every access attempt is logged (who, which area, when, allowed or why not); the log never holds
 *   the content itself.
 * - No public links and no QR codes: access is only for a signed-in, verified person.
 */
export type AccessArea = "notfallkarte" | "dokumente_orte" | "janazah" | "familie" | "gesundheit" | "vermoegen" | "schulden";

export const ACCESS_AREA_LABELS: Record<AccessArea, string> = {
  notfallkarte: "Notfallkarte",
  dokumente_orte: "Wo Dokumente liegen",
  janazah: "Janazah-Wünsche",
  familie: "Familie & Kontakte",
  gesundheit: "Gesundheitsangaben",
  vermoegen: "Vermögensübersicht",
  schulden: "Schulden & Amanah",
};

/** Areas that need their own confirmation by the owner (special categories, Art. 9 DSGVO; finances). */
export const SENSITIVE_AREAS: readonly AccessArea[] = ["gesundheit", "vermoegen", "schulden"];

export type GrantMode = "sofort" | "nach_notfallanfrage";
export type GrantStatus = "entwurf" | "eingeladen" | "aktiv" | "widerrufen" | "abgelaufen";

export interface AccessGrant {
  id: string;
  ownerId: string;
  /** Account id of the trusted person once they accepted; never an e-mail link. */
  granteeAccountId: string | null;
  granteeName: string;
  areas: AccessArea[];
  /** Sensitive areas the owner confirmed separately. */
  confirmedSensitive: AccessArea[];
  mode: GrantMode;
  status: GrantStatus;
  createdAt: string;
  invitedAt?: string;
  acceptedAt?: string;
  revokedAt?: string;
  expiresAt?: string;
  /** Hours the owner has to object to an emergency request (mode "nach_notfallanfrage"). */
  waitingHours: number;
}

export interface EmergencyRequest {
  grantId: string;
  requestedAt: string;
  objectedAt?: string;
}

export interface AccessLogEntry {
  at: string;
  grantId: string;
  actorAccountId: string;
  area: AccessArea;
  allowed: boolean;
  reason: string;
}

export const MIN_WAITING_HOURS = 24;
const HOUR = 3_600_000;

export function createGrant(input: { id: string; ownerId: string; granteeName: string; areas: AccessArea[]; mode: GrantMode; now: Date; waitingHours?: number; expiresAt?: string }): AccessGrant {
  return {
    id: input.id,
    ownerId: input.ownerId,
    granteeAccountId: null,
    granteeName: input.granteeName,
    areas: [...new Set(input.areas)],
    confirmedSensitive: [],
    mode: input.mode,
    status: "entwurf",
    createdAt: input.now.toISOString(),
    expiresAt: input.expiresAt,
    waitingHours: Math.max(MIN_WAITING_HOURS, input.waitingHours ?? MIN_WAITING_HOURS),
  };
}

/** The owner confirms a sensitive area for this person. Without it the area stays closed. */
export function confirmSensitive(grant: AccessGrant, area: AccessArea): AccessGrant {
  if (!SENSITIVE_AREAS.includes(area) || !grant.areas.includes(area)) return grant;
  return { ...grant, confirmedSensitive: [...new Set([...grant.confirmedSensitive, area])] };
}

/** Only an explicit action by the owner turns a draft into an invitation. */
export function invite(grant: AccessGrant, ownerConfirmed: boolean, now: Date): AccessGrant {
  if (grant.status !== "entwurf" || !ownerConfirmed) return grant;
  return { ...grant, status: "eingeladen", invitedAt: now.toISOString() };
}

/** The invited person accepts with a verified account (second factor checked by the server). */
export function accept(grant: AccessGrant, account: { id: string; emailVerified: boolean; secondFactor: boolean }, now: Date): AccessGrant {
  if (grant.status !== "eingeladen" || !account.emailVerified || !account.secondFactor || account.id === grant.ownerId) return grant;
  return { ...grant, status: "aktiv", granteeAccountId: account.id, acceptedAt: now.toISOString() };
}

export function revoke(grant: AccessGrant, now: Date): AccessGrant {
  if (grant.status === "widerrufen") return grant;
  return { ...grant, status: "widerrufen", revokedAt: now.toISOString() };
}

function expired(grant: AccessGrant, now: Date): boolean {
  return Boolean(grant.expiresAt && Date.parse(grant.expiresAt) <= now.getTime());
}

/** Whether an emergency request has passed its waiting period without objection. */
export function requestOpen(grant: AccessGrant, request: EmergencyRequest | undefined, now: Date): boolean {
  if (!request || request.grantId !== grant.id || request.objectedAt) return false;
  return now.getTime() - Date.parse(request.requestedAt) >= grant.waitingHours * HOUR;
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
}

/** The single check for every read. */
export function canAccess(grant: AccessGrant, actorAccountId: string, area: AccessArea, now: Date, request?: EmergencyRequest): AccessDecision {
  if (grant.status !== "aktiv") return { allowed: false, reason: `Freigabe ist ${grant.status}.` };
  if (expired(grant, now)) return { allowed: false, reason: "Freigabe ist abgelaufen." };
  if (actorAccountId !== grant.granteeAccountId) return { allowed: false, reason: "Nicht die freigegebene Person." };
  if (!grant.areas.includes(area)) return { allowed: false, reason: "Bereich nicht freigegeben." };
  if (SENSITIVE_AREAS.includes(area) && !grant.confirmedSensitive.includes(area)) return { allowed: false, reason: "Sensibler Bereich nicht gesondert bestätigt." };
  if (grant.mode === "nach_notfallanfrage" && !requestOpen(grant, request, now)) return { allowed: false, reason: "Notfallanfrage fehlt, läuft noch oder wurde widersprochen." };
  return { allowed: true, reason: "Freigegeben." };
}

/** Checks and records in one step, so that no read can skip the log. */
export function accessWithLog(log: AccessLogEntry[], grant: AccessGrant, actorAccountId: string, area: AccessArea, now: Date, request?: EmergencyRequest): { decision: AccessDecision; log: AccessLogEntry[] } {
  const decision = canAccess(grant, actorAccountId, area, now, request);
  const entry: AccessLogEntry = { at: now.toISOString(), grantId: grant.id, actorAccountId, area, allowed: decision.allowed, reason: decision.reason };
  return { decision, log: [...log, entry] };
}

/** Plain words for the owner: what this person can see, and when. */
export function describeGrant(grant: AccessGrant, now: Date): string {
  const areas = grant.areas.map((a) => (SENSITIVE_AREAS.includes(a) && !grant.confirmedSensitive.includes(a) ? `${ACCESS_AREA_LABELS[a]} (noch nicht bestätigt)` : ACCESS_AREA_LABELS[a])).join(", ");
  if (grant.status === "entwurf") return `Entwurf für ${grant.granteeName}: noch nicht eingeladen, kein Zugriff.`;
  if (grant.status === "eingeladen") return `${grant.granteeName} ist eingeladen, hat aber noch nicht angenommen: kein Zugriff.`;
  if (grant.status === "widerrufen") return `Für ${grant.granteeName} widerrufen: kein Zugriff.`;
  if (expired(grant, now) || grant.status === "abgelaufen") return `Für ${grant.granteeName} abgelaufen: kein Zugriff.`;
  return grant.mode === "sofort"
    ? `${grant.granteeName} kann jetzt sehen: ${areas}.`
    : `${grant.granteeName} kann im Notfall sehen: ${areas} – erst nach einer Notfallanfrage und ${grant.waitingHours} Stunden, in denen du widersprechen kannst.`;
}
