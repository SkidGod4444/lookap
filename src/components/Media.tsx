import type { Entry } from "@/lib/data";
import { Poster } from "./Poster";
import { Clip } from "./Clip";

/* An entry's media, filling its box: clips play muted on loop, stills show as they are. */
export function Media({ entry, compact = false }: { entry: Entry; compact?: boolean }) {
  if (entry.video) {
    return <Clip src={entry.video.src} w={entry.video.w} h={entry.video.h} />;
  }
  if (entry.image) {
    /* eslint-disable-next-line @next/next/no-img-element -- remote CDN still at its native size, no optimizer in between */
    return <img className="absolute inset-0 h-full w-full object-cover" src={entry.image.src} width={entry.image.w} height={entry.image.h} alt={entry.title} loading="lazy" decoding="async" />;
  }
  return <Poster entry={entry} compact={compact} />;
}
