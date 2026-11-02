import { createHmac, timingSafeEqual } from "node:crypto";
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/**
 * Deletion ledger: a backup restored later must not bring deleted accounts or folders back.
 *
 * - Lives outside the database, so restoring a backup cannot roll it back.
 * - Holds only keyed pseudonyms of account ids (HMAC with a dedicated key), times and kinds of
 *   deletion. No names, no e-mail addresses, no folder content.
 * - Every entry is authenticated and chained to the one before it. A head record in a second
 *   place and an anchor in the database reveal a cut-off or lost ledger.
 * - Kept only as long as a backup could still be restored, then removed.
 *
 * Prepared and off: only AMANAH_DELETION_LEDGER=required turns it on. Uses no project imports,
 * because scripts/deletion-ledger.mjs runs the same code without the application.
 */
export const ACTIVE_VALUE = "required";
/** Margin on top of the longest backup retention, including archive copies. */
export const RETENTION_MARGIN_DAYS = 7;
const MAX_RETENTION_DAYS = 3650;
const DAY_MS = 24 * 60 * 60 * 1000;
const LEDGER_FILE = "deletions.jsonl";
const LOCK_FILE = "RESTORE_PENDING";

export type DeletionKind = "account_deleted" | "folder_deleted" | "history_deleted" | "consent_withdrawn";
type EntryType = DeletionKind | "genesis" | "checkpoint" | "cancelled";

export interface LedgerEntry {
  epoch: number;
  seq: number;
  at: string;
  type: EntryType;
  kid: string;
  /** Keyed pseudonym of the account id. */
  subject?: string;
  purpose?: string;
  /** history_deleted: versions up to this time. */
  upTo?: string;
  /** cancelled: seq of a deletion that did not go through. */
  cancels?: number;
  /** genesis, checkpoint: deletions before this time are not known. */
  coversFrom?: string;
  prev: string;
  mac: string;
}

export interface LedgerHead {
  epoch: number;
  seq: number;
  mac: string;
  kid: string;
  headMac: string;
}

export interface LedgerAnchor {
  epoch: number;
  seq: number;
}

export interface LedgerConfig {
  dir: string;
  headPath: string;
  keys: Map<string, Buffer>;
  activeKid: string;
  retentionDays: number;
}

export type LedgerErrorCode =
  | "config_invalid"
  | "ledger_lost"
  | "ledger_tampered"
  | "ledger_truncated"
  | "head_missing"
  | "unknown_key"
  | "restore_pending"
  | "backup_not_covered";

/** The message is the code: it never contains pseudonyms, keys or paths. */
export class LedgerError extends Error {
  readonly code: LedgerErrorCode;
  constructor(code: LedgerErrorCode) {
    super(code);
    this.name = "LedgerError";
    this.code = code;
  }
}

export function isDeletionLedgerEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.AMANAH_DELETION_LEDGER === ACTIVE_VALUE;
}

export function readLedgerConfig(env: NodeJS.ProcessEnv = process.env): LedgerConfig {
  const dir = env.AMANAH_DELETION_LEDGER_DIR?.trim();
  const headPath = env.AMANAH_DELETION_LEDGER_HEAD?.trim();
  const rawKeys = env.AMANAH_DELETION_LEDGER_KEYS?.trim();
  const backupDays = Number(env.AMANAH_BACKUP_MAX_RETENTION_DAYS);
  if (!dir || !headPath || !rawKeys) throw new LedgerError("config_invalid");
  // The head only helps when it does not disappear together with the ledger.
  if (resolve(dirname(headPath)) === resolve(dir)) throw new LedgerError("config_invalid");
  // Deliberately no default: the retention has to follow from the real backup retention.
  if (!Number.isInteger(backupDays) || backupDays < 1 || backupDays + RETENTION_MARGIN_DAYS > MAX_RETENTION_DAYS) throw new LedgerError("config_invalid");

  const keys = new Map<string, Buffer>();
  for (const part of rawKeys.split(",")) {
    const [kid, b64] = part.trim().split(":");
    const key = Buffer.from(b64 ?? "", "base64");
    if (!kid || key.length !== 32) throw new LedgerError("config_invalid");
    keys.set(kid, key);
  }
  const activeKid = env.AMANAH_DELETION_LEDGER_KEY_ACTIVE?.trim() || [...keys.keys()].at(-1)!;
  if (!keys.has(activeKid)) throw new LedgerError("config_invalid");
  return { dir, headPath, keys, activeKid, retentionDays: backupDays + RETENTION_MARGIN_DAYS };
}

function derived(key: Buffer, purpose: "mac" | "pseudonym"): Buffer {
  return createHmac("sha256", key).update(`amanah-deletion-ledger|${purpose}`).digest();
}

function keyOf(config: LedgerConfig, kid: string): Buffer {
  const key = config.keys.get(kid);
  if (!key) throw new LedgerError("unknown_key");
  return key;
}

/** Keyed and account-specific: without the key it cannot be computed from an id or an e-mail address. */
export function pseudonymFor(config: LedgerConfig, userId: string, kid: string = config.activeKid): string {
  return createHmac("sha256", derived(keyOf(config, kid), "pseudonym")).update(userId).digest("base64url");
}

function macOf(config: LedgerConfig, entry: Omit<LedgerEntry, "mac">): string {
  const { epoch, seq, at, type, kid, subject, purpose, upTo, cancels, coversFrom, prev } = entry;
  const canonical = JSON.stringify([epoch, seq, at, type, kid, subject ?? null, purpose ?? null, upTo ?? null, cancels ?? null, coversFrom ?? null, prev]);
  return createHmac("sha256", derived(keyOf(config, kid), "mac")).update(canonical).digest("base64url");
}

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function headMacOf(config: LedgerConfig, head: Omit<LedgerHead, "headMac">): string {
  return createHmac("sha256", derived(keyOf(config, head.kid), "mac")).update(JSON.stringify(["head", head.epoch, head.seq, head.mac])).digest("base64url");
}

function ledgerPath(config: LedgerConfig): string {
  return join(config.dir, LEDGER_FILE);
}

function writeDurably(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const temp = `${path}.tmp`;
  const fd = openSync(temp, "w", 0o600);
  try {
    writeSync(fd, content);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(temp, path);
}

function appendDurably(path: string, line: string): void {
  const fd = openSync(path, "a", 0o600);
  try {
    writeSync(fd, line);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

function writeHead(config: LedgerConfig, last: LedgerEntry): void {
  const head = { epoch: last.epoch, seq: last.seq, mac: last.mac, kid: config.activeKid };
  writeDurably(config.headPath, `${JSON.stringify({ ...head, headMac: headMacOf(config, head) })}\n`);
}

function readHead(config: LedgerConfig): LedgerHead | null {
  if (!existsSync(config.headPath)) return null;
  let head: LedgerHead;
  try {
    head = JSON.parse(readFileSync(config.headPath, "utf8")) as LedgerHead;
  } catch {
    throw new LedgerError("ledger_tampered");
  }
  const { headMac, ...rest } = head;
  if (!same(headMac ?? "", headMacOf(config, rest))) throw new LedgerError("ledger_tampered");
  return head;
}

function parseEntries(config: LedgerConfig): LedgerEntry[] {
  const lines = readFileSync(ledgerPath(config), "utf8").split("\n").filter(Boolean);
  let previous: LedgerEntry | null = null;
  return lines.map((line, index) => {
    let entry: LedgerEntry;
    try {
      entry = JSON.parse(line) as LedgerEntry;
    } catch {
      throw new LedgerError("ledger_tampered");
    }
    const { mac, ...rest } = entry;
    if (!same(mac ?? "", macOf(config, rest))) throw new LedgerError("ledger_tampered");
    const startsChain = entry.type === "genesis" || entry.type === "checkpoint";
    if (index === 0 ? !startsChain : startsChain) throw new LedgerError("ledger_tampered");
    if (previous && (entry.seq !== previous.seq + 1 || entry.prev !== previous.mac || entry.epoch !== previous.epoch)) {
      throw new LedgerError("ledger_tampered");
    }
    previous = entry;
    return entry;
  });
}

/**
 * Returns the checked entries, or an empty list when nothing exists yet. Fails closed: whatever
 * does not fit stops here, because a replay from a damaged ledger would miss deletions.
 */
export function verifyLedger(config: LedgerConfig, anchor: LedgerAnchor | null = null): LedgerEntry[] {
  const exists = existsSync(ledgerPath(config));
  const head = readHead(config);
  if (!exists) {
    if (head || anchor) throw new LedgerError("ledger_lost");
    return [];
  }
  const entries = parseEntries(config);
  if (entries.length === 0) throw new LedgerError("ledger_tampered");
  if (!head) throw new LedgerError("head_missing");
  const last = entries.at(-1)!;
  if (head.epoch !== last.epoch) throw new LedgerError("ledger_tampered");
  if (last.seq < head.seq) throw new LedgerError("ledger_truncated");
  // One entry ahead of the head is a crash between the two writes, nothing else is expected.
  if (last.seq > head.seq + 1) throw new LedgerError("ledger_tampered");
  const atHead = entries.find((e) => e.seq === head.seq);
  if (atHead && !same(atHead.mac, head.mac)) throw new LedgerError("ledger_tampered");
  if (last.seq === head.seq + 1) writeHead(config, last);
  if (anchor) {
    if (anchor.epoch > last.epoch) throw new LedgerError("ledger_lost");
    if (anchor.epoch === last.epoch && anchor.seq > last.seq) throw new LedgerError("ledger_truncated");
  }
  return entries;
}

function chainEntry(config: LedgerConfig, input: Omit<LedgerEntry, "mac" | "kid">): LedgerEntry {
  const body = { ...input, kid: config.activeKid };
  return { ...body, mac: macOf(config, body) };
}

function append(config: LedgerConfig, entries: LedgerEntry[], input: Pick<LedgerEntry, "at" | "type"> & Partial<LedgerEntry>): LedgerEntry {
  const last = entries.at(-1)!;
  const entry = chainEntry(config, { ...input, epoch: last.epoch, seq: last.seq + 1, prev: last.mac });
  appendDurably(ledgerPath(config), `${JSON.stringify(entry)}\n`);
  writeHead(config, entry);
  return entry;
}

/** The ledger starts here: deletions before `coversFrom` are not known to it. */
export function initLedger(config: LedgerConfig, now: Date = new Date(), epoch = 1): LedgerEntry[] {
  const entry = chainEntry(config, { epoch, seq: 1, at: now.toISOString(), type: "genesis", coversFrom: now.toISOString(), prev: "" });
  writeDurably(ledgerPath(config), `${JSON.stringify(entry)}\n`);
  writeHead(config, entry);
  return [entry];
}

export function openLedger(config: LedgerConfig, anchor: LedgerAnchor | null = null, now: Date = new Date()): LedgerEntry[] {
  const entries = verifyLedger(config, anchor);
  return entries.length ? entries : initLedger(config, now);
}

export interface DeletionEvent {
  kind: DeletionKind;
  userId: string;
  purpose?: string;
  upTo?: Date;
}

/** Written before the deletion, so that a crash in between cannot leave a deletion unrecorded. */
export function recordDeletion(config: LedgerConfig, event: DeletionEvent, now: Date = new Date()): LedgerEntry {
  const entries = openLedger(config, null, now);
  return append(config, entries, {
    at: now.toISOString(),
    type: event.kind,
    subject: pseudonymFor(config, event.userId),
    ...(event.purpose ? { purpose: event.purpose } : {}),
    ...(event.upTo ? { upTo: event.upTo.toISOString() } : {}),
  });
}

/** The deletion failed: the data still exists and must not be removed by a later replay. */
export function cancelDeletion(config: LedgerConfig, seq: number, now: Date = new Date()): void {
  append(config, verifyLedger(config), { at: now.toISOString(), type: "cancelled", cancels: seq });
}

/** Removes entries past the retention. The checkpoint states what is no longer known. */
export function purgeLedger(config: LedgerConfig, now: Date = new Date()): number {
  const entries = verifyLedger(config);
  if (entries.length === 0) return 0;
  const cutoff = new Date(now.getTime() - config.retentionDays * DAY_MS).toISOString();
  const keptAll = entries.slice(1).filter((e) => e.at >= cutoff);
  // A cancellation whose deletion is gone has nothing left to cancel.
  const present = new Set(keptAll.map((e) => e.seq));
  const kept = keptAll.filter((e) => e.cancels === undefined || present.has(e.cancels));
  const removed = entries.length - 1 - kept.length;
  if (removed === 0) return 0;
  // Sequence numbers keep running, so the head and the database anchor stay comparable. The entries
  // are signed anew as a chain; the checkpoint binds them to the old end of the ledger.
  const last = entries.at(-1)!;
  const checkpoint = chainEntry(config, { epoch: last.epoch, seq: last.seq + 1, at: now.toISOString(), type: "checkpoint", coversFrom: cutoff, prev: last.mac });
  const lines: LedgerEntry[] = [checkpoint];
  // Pseudonyms stay under their old key: a kept entry keeps its kid and is signed with it.
  const seqMap = new Map<number, number>();
  for (const entry of kept) {
    const previous = lines.at(-1)!;
    const seq = previous.seq + 1;
    seqMap.set(entry.seq, seq);
    const cancels = entry.cancels === undefined ? undefined : seqMap.get(entry.cancels);
    const body: Omit<LedgerEntry, "mac"> = { ...entry, seq, prev: previous.mac, ...(cancels === undefined ? {} : { cancels }) };
    delete (body as Partial<LedgerEntry>).mac;
    lines.push({ ...body, mac: macOf(config, body) });
  }
  writeDurably(ledgerPath(config), lines.map((e) => `${JSON.stringify(e)}\n`).join(""));
  writeHead(config, lines.at(-1)!);
  return removed;
}

/** Only on an explicit decision after a real loss. Backups older than this moment are then refused. */
export function acceptLedgerLoss(config: LedgerConfig, anchor: LedgerAnchor | null, now: Date = new Date()): LedgerEntry[] {
  let epoch = anchor?.epoch ?? 0;
  try {
    epoch = Math.max(epoch, readHead(config)?.epoch ?? 0);
  } catch {
    // A damaged head cannot be trusted either; the new epoch still moves past the anchor.
  }
  if (existsSync(ledgerPath(config))) renameSync(ledgerPath(config), `${ledgerPath(config)}.damaged-${now.getTime()}`);
  return initLedger(config, now, epoch + 1);
}

export function ledgerCoversFrom(entries: LedgerEntry[]): Date {
  return new Date(entries[0].coversFrom ?? entries[0].at);
}

export function assertBackupCovered(entries: LedgerEntry[], backupTakenAt: Date): void {
  if (backupTakenAt < ledgerCoversFrom(entries)) throw new LedgerError("backup_not_covered");
}

export function lockForRestore(config: LedgerConfig, now: Date = new Date()): void {
  writeDurably(join(config.dir, LOCK_FILE), `${now.toISOString()}\n`);
}

export function unlockAfterRestore(config: LedgerConfig): void {
  rmSync(join(config.dir, LOCK_FILE), { force: true });
}

export function isRestorePending(config: LedgerConfig): boolean {
  return existsSync(join(config.dir, LOCK_FILE));
}

/** Plain SQL in both callers, so the script and the application behave identically. */
export interface ReplayDb {
  rows(sql: string): Promise<{ id: string }[]>;
  exec(sql: string, params: unknown[]): Promise<number>;
}

export interface ReplayResult {
  accounts: number;
  folders: number;
  versions: number;
  consents: number;
}

const UTC = "::timestamptz AT TIME ZONE 'UTC'";

/**
 * Applies the deletions to the database. Safe to repeat. Conditions on the times keep everything
 * that came into being after a deletion: a folder saved anew afterwards stays.
 */
export async function replayDeletions(db: ReplayDb, config: LedgerConfig, entries: LedgerEntry[]): Promise<ReplayResult> {
  const cancelled = new Set(entries.filter((e) => e.type === "cancelled").map((e) => e.cancels));
  const ids = (await db.rows("SELECT id FROM users")).map((r) => r.id);
  const byPseudonym = new Map<string, string>();
  for (const kid of new Set(entries.map((e) => e.kid))) {
    for (const id of ids) byPseudonym.set(`${kid}|${pseudonymFor(config, id, kid)}`, id);
  }
  const result: ReplayResult = { accounts: 0, folders: 0, versions: 0, consents: 0 };
  for (const entry of entries) {
    if (!entry.subject || cancelled.has(entry.seq)) continue;
    const userId = byPseudonym.get(`${entry.kid}|${entry.subject}`);
    if (!userId) continue;
    if (entry.type === "account_deleted") {
      result.accounts += await db.exec(`DELETE FROM users WHERE id = $1 AND created_at <= $2${UTC}`, [userId, entry.at]);
    } else if (entry.type === "folder_deleted") {
      result.versions += await db.exec(`DELETE FROM amanah_data_versions WHERE user_id = $1 AND created_at <= $2${UTC}`, [userId, entry.at]);
      result.folders += await db.exec(`DELETE FROM amanah_data WHERE user_id = $1 AND updated_at <= $2${UTC}`, [userId, entry.at]);
    } else if (entry.type === "history_deleted") {
      result.versions += await db.exec(`DELETE FROM amanah_data_versions WHERE user_id = $1 AND created_at <= $2${UTC}`, [userId, entry.upTo ?? entry.at]);
    } else if (entry.type === "consent_withdrawn") {
      result.consents += await db.exec(
        `UPDATE consent_records SET revoked_at = $3${UTC} WHERE user_id = $1 AND purpose = $2 AND revoked_at IS NULL AND granted_at <= $3${UTC}`,
        [userId, entry.purpose, entry.at],
      );
    }
  }
  return result;
}

export function anchorOf(entries: LedgerEntry[]): LedgerAnchor {
  const last = entries.at(-1)!;
  return { epoch: last.epoch, seq: last.seq };
}

export const ANCHOR_SQL =
  "INSERT INTO deletion_ledger_anchor (id, epoch, seq, updated_at) VALUES (1, $1, $2, now()) ON CONFLICT (id) DO UPDATE SET epoch = EXCLUDED.epoch, seq = EXCLUDED.seq, updated_at = now()";
