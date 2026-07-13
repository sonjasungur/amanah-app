"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TopicProgress {
  checkedQuestionIds: string[];
  starredQuestionIds: string[];
  notes: string;
}

interface FamilienGespraechState {
  topics: Record<string, TopicProgress>;
  toggleQuestion: (topicId: string, questionId: string) => void;
  toggleStar: (topicId: string, questionId: string) => void;
  setNotes: (topicId: string, notes: string) => void;
  getTopic: (topicId: string) => TopicProgress;
}

const emptyTopic = (): TopicProgress => ({
  checkedQuestionIds: [],
  starredQuestionIds: [],
  notes: "",
});

export const useFamilienGespraechStore = create<FamilienGespraechState>()(
  persist(
    (set, get) => ({
      topics: {},
      getTopic: (topicId) => get().topics[topicId] ?? emptyTopic(),
      toggleQuestion: (topicId, questionId) =>
        set((s) => {
          const t = s.topics[topicId] ?? emptyTopic();
          const checked = t.checkedQuestionIds.includes(questionId)
            ? t.checkedQuestionIds.filter((id) => id !== questionId)
            : [...t.checkedQuestionIds, questionId];
          return { topics: { ...s.topics, [topicId]: { ...t, checkedQuestionIds: checked } } };
        }),
      toggleStar: (topicId, questionId) =>
        set((s) => {
          const t = s.topics[topicId] ?? emptyTopic();
          const starred = t.starredQuestionIds.includes(questionId)
            ? t.starredQuestionIds.filter((id) => id !== questionId)
            : [...t.starredQuestionIds, questionId];
          return { topics: { ...s.topics, [topicId]: { ...t, starredQuestionIds: starred } } };
        }),
      setNotes: (topicId, notes) =>
        set((s) => {
          const t = s.topics[topicId] ?? emptyTopic();
          return { topics: { ...s.topics, [topicId]: { ...t, notes } } };
        }),
    }),
    { name: "amanah-familiengespraech-v1" }
  )
);
