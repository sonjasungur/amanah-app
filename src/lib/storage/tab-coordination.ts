/**
 * Before a logout, every other tab of the same account sends what it still holds and says whether the
 * account has it. Messages carry the account id only, never folder content; a tab of another account,
 * or one whose session changed meanwhile, does not answer and sends nothing.
 */
const CHANNEL = "amanah-tabs";
/** How long to wait for tabs to announce themselves, and then for their answers. */
const ANNOUNCE_MS = 150;
const ANSWER_MS = 1500;

type TabMessage =
  | { type: "save-request"; id: string; userId: string }
  | { type: "save-started"; id: string; tab: string }
  | { type: "save-answer"; id: string; tab: string; saved: boolean };

function channel(): BroadcastChannel | null {
  try {
    return typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANNEL);
  } catch {
    return null;
  }
}

/**
 * Answers save requests for this tab. `saveFor(userId)` returns null when this tab does not belong to
 * that account (it then stays silent), otherwise whether the account holds the tab's state.
 */
export function answerSaveRequests(saveFor: (userId: string) => Promise<boolean> | null): () => void {
  const ch = channel();
  if (!ch) return () => undefined;
  const tab = crypto.randomUUID();
  ch.onmessage = (event: MessageEvent<TabMessage>) => {
    const message = event.data;
    if (message?.type !== "save-request") return;
    const saving = saveFor(message.userId);
    if (!saving) return;
    ch.postMessage({ type: "save-started", id: message.id, tab } satisfies TabMessage);
    void saving
      .catch(() => false)
      .then((saved) => ch.postMessage({ type: "save-answer", id: message.id, tab, saved } satisfies TabMessage));
  };
  return () => ch.close();
}

/** Asks the other tabs of this account to save; resolves with whether every answering tab could. */
export async function askOtherTabsToSave(userId: string): Promise<{ allSaved: boolean; tabs: number }> {
  const ch = channel();
  if (!ch) return { allSaved: true, tabs: 0 };
  const id = crypto.randomUUID();
  const started = new Set<string>();
  const answers = new Map<string, boolean>();
  ch.onmessage = (event: MessageEvent<TabMessage>) => {
    const message = event.data;
    if (message?.id !== id) return;
    if (message.type === "save-started") started.add(message.tab);
    if (message.type === "save-answer") answers.set(message.tab, message.saved);
  };
  ch.postMessage({ type: "save-request", id, userId } satisfies TabMessage);
  await new Promise((resolve) => setTimeout(resolve, ANNOUNCE_MS));
  const deadline = Date.now() + ANSWER_MS;
  while ([...started].some((tab) => !answers.has(tab)) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  ch.close();
  // A tab that started but did not answer in time counts as not saved.
  const allSaved = [...started].every((tab) => answers.get(tab) === true);
  return { allSaved, tabs: started.size };
}
