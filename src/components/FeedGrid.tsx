import type { Entry } from "@/lib/data";
import { FeedCard } from "./FeedCard";
import { hasLive } from "@/lib/rebuilds";

type Props = { entries: Entry[]; title?: string; blurb?: string; hero?: boolean };

/* Four columns at desktop, dealt to the shortest column so heights stay even. The hero takes the first cell.
   The first card or two in each column load eagerly: they are the fold. Entries with a live rebuild come first, in
   their given order, so the thing you can use is the thing you see. */
export function FeedGrid({ entries, title, blurb, hero = true }: Props) {
  const live = new Set(entries.filter(hasLive).map((e) => e.slug));
  const ordered = [...entries.filter((e) => live.has(e.slug)), ...entries.filter((e) => !live.has(e.slug))];
  const cols: Entry[][] = [[], [], [], []];
  const h = [hero ? 1.333 : 0, 0, 0, 0];
  ordered.forEach((e) => {
    const i = h.indexOf(Math.min(...h));
    cols[i].push(e);
    h[i] += 1 / e.ratio + 0.03;
  });
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cols.map((c, i) => (
        <div key={i} className="flex flex-col gap-2">
          {i === 0 && hero && (
            <section className="flex flex-col justify-end gap-5 p-1 sm:aspect-[4/3]">
              <header>
                <h1 className="text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-balance text-foreground">{title}</h1>
                <p className="mt-2 text-[14px] leading-[1.55] text-pretty text-subtle">{blurb}</p>
              </header>
            </section>
          )}
          {c.map((e, j) => <FeedCard key={e.slug} entry={e} eager={j < (i === 0 && hero ? 1 : 2)} live={live.has(e.slug)} />)}
        </div>
      ))}
    </div>
  );
}
