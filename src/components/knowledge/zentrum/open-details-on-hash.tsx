"use client";

import { useEffect } from "react";

/**
 * The source groups under an article are folded (owner acceptance 27.11.2026: the full list overwhelmed readers).
 * A reference chip links to "#quelle-…"; this opens the folded group that holds the target and scrolls to it.
 */
export function OpenDetailsOnHash() {
  useEffect(() => {
    const open = () => {
      let id: string;
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return; // malformed hash such as "#%E0": ignore instead of breaking the article page
      }
      if (!id) return;
      const el = document.getElementById(id);
      const box = el?.closest("details");
      if (el && box && !box.open) {
        box.open = true;
        el.scrollIntoView({ block: "start" });
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
