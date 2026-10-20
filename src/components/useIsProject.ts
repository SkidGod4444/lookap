"use client";

import { usePathname } from "next/navigation";

/* Project pages lock the stage and scroll only their panel; the footer and the bottom blur stay out of the way there. */
export function useIsProject() {
  const p = usePathname();
  return /^\/(feed|website)\/[^/]+/.test(p);
}
