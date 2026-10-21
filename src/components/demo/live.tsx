import type { ComponentType } from "react";
import type { Entry } from "@/lib/data";
import { recipeFor } from "@/lib/registry";
import { CardSleeve } from "./CardSleeve";
import { LampTypewriter } from "./LampTypewriter";

/* Live rebuilds: the recipes we have also built as components, keyed by recipe slug. A project page with one of these
   offers a switch between the designer's clip and our rebuild, so the two can be compared in the same frame. */
/* align: where the rebuild sits in the clip's frame; "start" when the clip shows more below (a keyboard) than was rebuilt */
export const LIVE: Record<string, { Component: ComponentType; hint: string; align?: "start" | "center" }> = {
  "id-card-reader-hover": { Component: CardSleeve, hint: "Hover or tap to insert the card." },
  "lamp-carriage-typewriter": { Component: LampTypewriter, hint: "Click it and type. The sun switches the lamp on. The keyboard is not rebuilt.", align: "start" },
};

export function liveFor(e: Entry) {
  const r = recipeFor(e);
  return r ? LIVE[r.slug] ?? null : null;
}
