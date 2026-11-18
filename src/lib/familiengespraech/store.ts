"use client";

import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { normalizeFamilyConversation } from "@/lib/domain/migration";
import type { ConversationTopicProgress, FamilyConversation, FamilyTalk } from "@/lib/domain/types";
import { isAccountFolderKnown, isRemotePersistenceActive } from "@/lib/storage/store-sync";

/**
 * The family conversation lives in the encrypted folder (section `familyConversation`) since P2.5-D.
 * Before, it was kept only in the browser tab and was lost at sign-out in account mode.
 *
 * The old browser copy (`amanah-familiengespraech-v1`) is read once into an empty folder record and
 * is still removed with the other device data on sign-out (see device-data.ts).
 */
export const LEGACY_FAMILY_CONVERSATION_ITEM = "amanah-familiengespraech-v1";

export type TopicProgress = ConversationTopicProgress;

const emptyTopic = (): TopicProgress => ({ checkedQuestionIds: [], starredQuestionIds: [], notes: "" });
const EMPTY: FamilyConversation = { topics: {}, talks: [] };

function current(): FamilyConversation {
  return useAmanahStore.getState().familyConversation ?? EMPTY;
}

function write(next: FamilyConversation) {
  useAmanahStore.getState().updateField("familyConversation", next);
}

function updateTopic(topicId: string, change: (t: TopicProgress) => TopicProgress) {
  const c = current();
  write({ ...c, topics: { ...c.topics, [topicId]: change(c.topics[topicId] ?? emptyTopic()) } });
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export const familyConversationActions = {
  getTopic: (topicId: string): TopicProgress => current().topics[topicId] ?? emptyTopic(),
  toggleQuestion: (topicId: string, questionId: string) => updateTopic(topicId, (t) => ({ ...t, checkedQuestionIds: toggle(t.checkedQuestionIds, questionId) })),
  toggleStar: (topicId: string, questionId: string) => updateTopic(topicId, (t) => ({ ...t, starredQuestionIds: toggle(t.starredQuestionIds, questionId) })),
  setNotes: (topicId: string, notes: string) => updateTopic(topicId, (t) => ({ ...t, notes })),
  addTalk: (talk: FamilyTalk) => write({ ...current(), talks: [talk, ...current().talks] }),
  updateTalk: (id: string, patch: Partial<FamilyTalk>) => write({ ...current(), talks: current().talks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }),
  removeTalk: (id: string) => write({ ...current(), talks: current().talks.filter((t) => t.id !== id) }),
};

/** Hook for pages: the record plus the actions; re-renders when the folder record changes. */
export function useFamilienGespraechStore() {
  const conversation = useAmanahStore((s) => s.familyConversation) ?? EMPTY;
  return {
    conversation,
    topics: conversation.topics,
    talks: conversation.talks,
    ...familyConversationActions,
    // Reads from the rendered record, so the page shows what it renders.
    getTopic: (topicId: string): TopicProgress => conversation.topics[topicId] ?? emptyTopic(),
  };
}

export function newTalk(): FamilyTalk {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `talk-${Date.now()}`;
  return { id, date: new Date().toISOString().slice(0, 10), personIds: [], otherPeople: "", topicIds: [], tasks: [], documentsToKnow: [], storageExplained: "", openPoints: "" };
}

/**
 * Takes over notes from the old browser-only copy, once, and only into an empty folder record, so
 * nothing in the account is ever overwritten. Returns whether something was taken over.
 */
export function importLegacyConversation(storages?: Storage[]): boolean {
  // Before the account folder is known, the record looks empty although the account may hold one;
  // a change made now would win over it while loading (see store-sync). So wait.
  if (isRemotePersistenceActive() && !isAccountFolderKnown()) return false;
  const list = storages ?? (typeof window === "undefined" ? [] : [window.localStorage, window.sessionStorage]);
  const c = current();
  if (Object.keys(c.topics).length > 0 || c.talks.length > 0) return false;
  for (const storage of list) {
    let raw: string | null = null;
    try {
      raw = storage.getItem(LEGACY_FAMILY_CONVERSATION_ITEM);
    } catch {
      continue;
    }
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as { state?: { topics?: unknown }; topics?: unknown };
      const legacy = normalizeFamilyConversation({ topics: parsed.state?.topics ?? parsed.topics });
      const hasContent = Object.values(legacy.topics).some((t) => t.notes.trim() || t.checkedQuestionIds.length || t.starredQuestionIds.length);
      if (!hasContent) continue;
      write({ ...c, topics: legacy.topics });
      storage.removeItem(LEGACY_FAMILY_CONVERSATION_ITEM);
      return true;
    } catch {
      continue;
    }
  }
  return false;
}
