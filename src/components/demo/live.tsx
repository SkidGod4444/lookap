import { Suspense, type ComponentType } from "react";
import { connection } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { button } from "../button";
import type { Entry } from "@/lib/data";
import { recipeFor } from "@/lib/registry";
import { FACTORY } from "@/lib/rebuilds";
import { liveToken } from "@/lib/rebuilds/token";
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
   on this site carrying the token minted here for the signed-in member, per request (the page itself stays
   prerendered; this hole streams); scaled to fill the clip's frame, scripts only. A visitor gets the lock instead:
   every copy that leaves the server names the member it was served to. */
async function RebuildFrame({ slug }: { slug: string }) {
  await connection();
  const { userId } = await auth();
  const rb = FACTORY[slug];
  if (!userId) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#121212] px-6 text-center">
        <p className="max-w-[300px] text-[14px] leading-[1.5] text-silver">Sign in to use the rebuild. Members can click, play and drag it here; the file itself is on Max.</p>
        <a href={`/feed/${slug}?signin=1&next=${encodeURIComponent(`/feed/${slug}`)}`} className={button("silver", "h-9 rounded-lg px-4 text-[13px]")}>Sign in</a>
      </div>
    );
  }
  return <iframe title={`${rb.title}, rebuilt by lookap`} src={`/api/live/${slug}?t=${liveToken(slug, userId)}`} sandbox="allow-scripts" className="h-full w-full border-0 bg-[#e7e4db]" />;
}

export function liveFor(e: Entry): { Component: ComponentType; hint: string; align?: "start" | "center" } | null {
  const r = recipeFor(e);
  if (r && LIVE[r.slug]) return LIVE[r.slug];
  const f = FACTORY[e.slug];
  return f ? { Component: () => <Suspense fallback={<div className="h-full w-full bg-[#e7e4db]" />}><RebuildFrame slug={e.slug} /></Suspense>, hint: f.hint } : null;
}
