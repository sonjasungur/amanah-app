"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  WISSEN_SIDEBAR_ITEMS,
  type WissenNavSection,
} from "@/lib/knowledge/wissen-hub";

const SECTION_TO_NAV = Object.fromEntries(
  WISSEN_SIDEBAR_ITEMS.map((item) => [item.sectionId, item.id])
) as Record<string, WissenNavSection>;

export function useWissenScrollSpy(enabled: boolean) {
  const [active, setActive] = useState<WissenNavSection>("all");
  const scrollingRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToSection = useCallback((sectionId: string, navId: WissenNavSection) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    scrollingRef.current = true;
    setActive(navId);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      scrollingRef.current = false;
    }, 700);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const sectionIds = WISSEN_SIDEBAR_ITEMS.map((i) => i.sectionId);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollingRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (top?.target.id && SECTION_TO_NAV[top.target.id]) {
          setActive(SECTION_TO_NAV[top.target.id]);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.15, 0.4, 0.6] }
    );

    for (const el of elements) observer.observe(el);
    return () => {
      observer.disconnect();
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [enabled]);

  return { active, scrollToSection, setActive };
}
