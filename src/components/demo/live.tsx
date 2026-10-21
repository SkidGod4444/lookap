import type { ComponentType } from "react";
import type { Entry } from "@/lib/data";
import { recipeFor } from "@/lib/registry";
import { FACTORY } from "@/lib/rebuilds";
import { CardSleeve } from "./CardSleeve";
import { LampTypewriter } from "./LampTypewriter";

/* Live rebuilds: the recipes we have also built as components, keyed by recipe slug. A project page with one of these
   offers a switch between the designer's clip and our rebuild, so the two can be compared in the same frame. */
/* align: where the rebuild sits in the clip's frame; "start" when the clip shows more below (a keyboard) than was rebuilt */
export const LIVE: Record<string, { Component: ComponentType; hint: string; align?: "start" | "center" }> = {
  "id-card-reader-hover": { Component: CardSleeve, hint: "Hover or tap to insert the card." },
  "lamp-carriage-typewriter": { Component: LampTypewriter, hint: "Click it and type. The sun switches the lamp on. The keyboard is not rebuilt.", align: "start" },
};

/* a factory rebuild runs in a sandboxed frame: its own document from the live route, which answers only to a frame
   on this site; scaled to fill the clip's frame, scripts only */
function RebuildFrame({ slug }: { slug: string }) {
  const rb = FACTORY[slug];
  return <iframe title={`${rb.title}, rebuilt by lookap`} src={`/api/live/${slug}`} sandbox="allow-scripts" className="h-full w-full border-0 bg-[#e7e4db]" />;
}

export function liveFor(e: Entry): { Component: ComponentType; hint: string; align?: "start" | "center" } | null {
  const r = recipeFor(e);
  if (r && LIVE[r.slug]) return LIVE[r.slug];
  const f = FACTORY[e.slug];
  return f ? { Component: () => <RebuildFrame slug={e.slug} />, hint: f.hint } : null;
}
