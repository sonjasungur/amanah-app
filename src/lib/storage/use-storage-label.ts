"use client";

import { useSyncExternalStore } from "react";
import { getActiveStorageLabel } from "./storage-config";

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

/**
 * The session hint lies in the browser, the server cannot know it. So the first render shows what
 * the server rendered, and the real label follows right after, without a hydration mismatch.
 */
export function useActiveStorageLabel(): ReturnType<typeof getActiveStorageLabel> {
  return useSyncExternalStore(subscribe, getActiveStorageLabel, () => "local");
}
