"use client";

import { useEffect } from "react";

/* Locks page scrolling at large widths while mounted, so a project page's only scroll is its panel.
   Phones keep normal scrolling, where the panel stacks under the media. */
export function LockScroll() {
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => { document.documentElement.style.overflow = mq.matches ? "hidden" : ""; };
    apply();
    mq.addEventListener("change", apply);
    return () => { mq.removeEventListener("change", apply); document.documentElement.style.overflow = ""; };
  }, []);
  return null;
}
