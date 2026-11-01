"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "amanah-reading-size";
const listeners = new Set<() => void>();
let large: boolean | null = null;

function isLarge(): boolean {
  if (large === null) {
    try {
      large = localStorage.getItem(STORAGE_KEY) === "large";
    } catch {
      large = false;
    }
  }
  return large;
}

function setLarge(next: boolean) {
  large = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? "large" : "normal");
  } catch {
    // Without storage the choice simply lasts until the page is reloaded.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Larger text for `.reading-content`, remembered in this browser only. Print always uses the normal size. */
export function ReadingSizeToggle() {
  const active = useSyncExternalStore(subscribe, isLarge, () => false);

  useEffect(() => {
    const root = document.documentElement;
    if (active) root.dataset.readingSize = "large";
    else delete root.dataset.readingSize;
    return () => {
      delete root.dataset.readingSize;
    };
  }, [active]);

  return (
    <Button type="button" variant="outline" size="sm" aria-pressed={active} onClick={() => setLarge(!active)} data-testid="article-reading-size">
      Große Schrift
    </Button>
  );
}
