/**
 * Legal review workflow (technical sandbox). Amanah is the software provider only:
 * the mandate is concluded directly between user and law firm, outside this system.
 *
 * Principles: no firm sees cases not assigned to it; access only with a valid,
 * time-limited release by the user; every action is audited; documents are frozen
 * versions; nothing is ever marked "legally valid" by the system.
 */
export type ReviewState =
  | "draft"
  | "submitted"
  | "accepted"
  | "in_review"
  | "question_open"
  | "feedback_provided"
  | "closed"
  | "withdrawn";

export type Actor = { kind: "user"; userId: string } | { kind: "firm"; firmId: string } | { kind: "system" };

export type ReviewAction =
  | "submit"
  | "withdraw"
  | "accept"
  | "start_review"
  | "ask_question"
  | "answer_question"
  | "provide_feedback"
  | "close"
  | "read";

export interface DocumentVersion {
  version: number;
  createdAt: string;
  /** Snapshot of the preparation summary (no raw folder dump). */
  content: string;
}

export interface ReviewMessage {
  at: string;
  author: "user" | "firm";
  text: string;
}

export interface AuditEntry {
  at: string;
  actor: string;
  action: ReviewAction | "denied";
  detail?: string;
}

export interface ReviewRequest {
  id: string;
  ownerId: string;
  firmId: string;
  state: ReviewState;
  /** User release for this firm, purpose-bound and time-limited. */
  release: { grantedAt: string; expiresAt: string; revokedAt: string | null } | null;
  documents: DocumentVersion[];
  messages: ReviewMessage[];
  audit: AuditEntry[];
  /** Firm copy must be deleted after this date (agreed in the cooperation contract). */
  deleteFirmCopyAfter: string | null;
}

const TRANSITIONS: Partial<Record<ReviewAction, { from: ReviewState[]; to: ReviewState; by: Actor["kind"] }>> = {
  submit: { from: ["draft"], to: "submitted", by: "user" },
  withdraw: { from: ["draft", "submitted", "accepted", "in_review", "question_open", "feedback_provided"], to: "withdrawn", by: "user" },
  accept: { from: ["submitted"], to: "accepted", by: "firm" },
  start_review: { from: ["accepted"], to: "in_review", by: "firm" },
  ask_question: { from: ["in_review"], to: "question_open", by: "firm" },
  answer_question: { from: ["question_open"], to: "in_review", by: "user" },
  provide_feedback: { from: ["in_review"], to: "feedback_provided", by: "firm" },
  close: { from: ["feedback_provided"], to: "closed", by: "firm" },
};

const FIRM_VISIBLE: ReviewState[] = ["submitted", "accepted", "in_review", "question_open", "feedback_provided"];
export const RELEASE_DAYS = 60;
export const FIRM_COPY_RETENTION_DAYS = 30;

export class ReviewDenied extends Error {}

function actorLabel(actor: Actor): string {
  return actor.kind === "user" ? `user:${actor.userId}` : actor.kind === "firm" ? `firm:${actor.firmId}` : "system";
}

function releaseValid(request: ReviewRequest, now: Date): boolean {
  const r = request.release;
  return Boolean(r && !r.revokedAt && new Date(r.expiresAt) > now);
}

/** Pure permission check; used for every read and write. */
export function can(actor: Actor, action: ReviewAction, request: ReviewRequest, now = new Date()): boolean {
  if (actor.kind === "user") {
    if (actor.userId !== request.ownerId) return false;
    if (action === "read") return true;
  }
  if (actor.kind === "firm") {
    if (actor.firmId !== request.firmId) return false;
    if (!releaseValid(request, now)) return false;
    if (action === "read") return FIRM_VISIBLE.includes(request.state);
  }
  if (actor.kind === "system") return false;
  const t = TRANSITIONS[action];
  return Boolean(t && t.by === actor.kind && t.from.includes(request.state));
}

function audit(request: ReviewRequest, actor: Actor, action: AuditEntry["action"], now: Date, detail?: string): ReviewRequest {
  return { ...request, audit: [...request.audit, { at: now.toISOString(), actor: actorLabel(actor), action, detail }] };
}

export function createDraft(id: string, ownerId: string, firmId: string, content: string, now = new Date()): ReviewRequest {
  return {
    id,
    ownerId,
    firmId,
    state: "draft",
    release: null,
    documents: [{ version: 1, createdAt: now.toISOString(), content }],
    messages: [],
    audit: [{ at: now.toISOString(), actor: `user:${ownerId}`, action: "read", detail: "Entwurf angelegt" }],
    deleteFirmCopyAfter: null,
  };
}

/**
 * Applies an action or throws ReviewDenied (and records the denial in the audit log
 * of the returned request via `deny`).
 */
export function apply(
  request: ReviewRequest,
  actor: Actor,
  action: Exclude<ReviewAction, "read">,
  payload: { text?: string; releaseConfirmed?: boolean } = {},
  now = new Date()
): ReviewRequest {
  if (action === "submit" && payload.releaseConfirmed !== true) throw new ReviewDenied("Freigabe für die Kanzlei fehlt.");
  if (!can(actor, action, request, now)) throw new ReviewDenied(`${action} nicht erlaubt im Zustand ${request.state}.`);
  const t = TRANSITIONS[action]!;
  let next: ReviewRequest = { ...request, state: t.to };

  if (action === "submit") {
    next.release = { grantedAt: now.toISOString(), expiresAt: new Date(now.getTime() + RELEASE_DAYS * 86_400_000).toISOString(), revokedAt: null };
  }
  if (action === "withdraw" && next.release) next.release = { ...next.release, revokedAt: now.toISOString() };
  if (action === "ask_question" || action === "answer_question" || action === "provide_feedback") {
    if (!payload.text?.trim()) throw new ReviewDenied("Text fehlt.");
    next.messages = [...next.messages, { at: now.toISOString(), author: actor.kind === "user" ? "user" : "firm", text: payload.text.trim() }];
  }
  if (action === "answer_question" && payload.text) {
    const last = next.documents.at(-1)!;
    next.documents = [...next.documents, { version: last.version + 1, createdAt: now.toISOString(), content: `${last.content}\n\nErgänzung: ${payload.text.trim()}` }];
  }
  if (action === "close" || action === "withdraw") {
    next.deleteFirmCopyAfter = new Date(now.getTime() + FIRM_COPY_RETENTION_DAYS * 86_400_000).toISOString();
  }
  next = audit(next, actor, action, now);
  return next;
}

/** Read with permission check; denials are audited. */
export function read(request: ReviewRequest, actor: Actor, now = new Date()): { request: ReviewRequest; visible: ReviewRequest | null } {
  if (!can(actor, "read", request, now)) return { request: audit(request, actor, "denied", now, "read"), visible: null };
  return { request: audit(request, actor, "read", now), visible: request };
}

/** Firms only ever get their own, currently released cases — never a global list. */
export function listForFirm(requests: ReviewRequest[], firmId: string, now = new Date()): ReviewRequest[] {
  return requests.filter((r) => can({ kind: "firm", firmId }, "read", r, now));
}

/** No state ever means "legally valid": feedback is the firm's own statement. */
export const STATE_LABELS: Record<ReviewState, string> = {
  draft: "Entwurf",
  submitted: "An Kanzlei übermittelt",
  accepted: "Von Kanzlei angenommen (Mandat direkt mit der Kanzlei)",
  in_review: "In Prüfung",
  question_open: "Rückfrage der Kanzlei",
  feedback_provided: "Rückmeldung der Kanzlei liegt vor",
  closed: "Abgeschlossen",
  withdrawn: "Zurückgezogen",
};
