"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/* The page scrolls inside #scroll, not the window, so the browser's own scroll memory does not apply. This keeps it:
   a new page opens at the top; going back (closing a project, the back button) returns to where you were. */
const positions = new Map<string, number>();

export function ScrollReset() {
  const path = usePathname();
  const current = useRef(path);
  const pop = useRef(false);

  useEffect(() => {
    const onPop = () => { pop.current = true; };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const el = document.getElementById("scroll");
    if (!el) return;
    const onScroll = () => positions.set(current.current, el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = document.getElementById("scroll");
    current.current = path;
    if (!el) return;
    const saved = pop.current ? positions.get(path) : undefined;
    pop.current = false;
    el.scrollTo({ top: saved ?? 0 });
  }, [path]);

  return null;
}
