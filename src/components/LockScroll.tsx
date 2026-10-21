"use client";

import { useEffect } from "react";

/* Locks page scrolling at large widths while mounted, so a project page's only scroll is its panel.
   The page scrolls in #scroll (under the top bar), so that is what gets locked. Phones keep normal scrolling. */
export function LockScroll() {
  useEffect(() => {
    const el = document.getElementById("scroll");
    if (!el) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => { el.style.overflowY = mq.matches ? "hidden" : ""; };
    apply();
    mq.addEventListener("change", apply);
    return () => { mq.removeEventListener("change", apply); el.style.overflowY = ""; };
  }, []);
  return null;
}
