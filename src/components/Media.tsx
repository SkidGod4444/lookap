import Image from "next/image";
import type { Entry } from "@/lib/data";
import { Poster } from "./Poster";
import { Clip } from "./Clip";

/* Width hints for next/image so the optimizer serves a card-sized file, not the CDN original. */
export const CARD_SIZES = "(min-width: 1680px) 410px, (min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";
export const STAGE_SIZES = "(min-width: 1024px) 900px, 100vw";
export const TILE_SIZES = "160px";

/* An entry's media, filling its box: clips play muted on loop over an instant poster, stills show as they are.
   `eager` is for the first row: the poster is preloaded and the clip starts fetching from the HTML, before hydration. */
export function Media({ entry, sizes = CARD_SIZES, eager = false, compact = false, contain = false }: { entry: Entry; sizes?: string; eager?: boolean; compact?: boolean; contain?: boolean }) {
  if (entry.video) {
    return <Clip src={entry.video.src} poster={entry.poster} w={entry.video.w} h={entry.video.h} title={entry.title} sizes={sizes} eager={eager} still={compact} contain={contain} />;
  }
  if (entry.image) {
    return <Image src={entry.image.src} alt={entry.title} fill sizes={sizes} priority={eager} className="object-cover" />;
  }
  return <Poster entry={entry} compact={compact} />;
}
