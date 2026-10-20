import { button } from "@/components/button";
import Link from "next/link";
import type { Entry } from "@/lib/data";
import { FeedCard } from "./FeedCard";

type Props = { entries: Entry[]; title: string; blurb: string; actions?: boolean };

/* Four columns at desktop, dealt to the shortest column so heights stay even. The hero takes the first cell. */
export function FeedGrid({ entries, title, blurb, actions = true }: Props) {
  const cols: Entry[][] = [[], [], [], []];
  const h = [1.333, 0, 0, 0];
  entries.forEach((e) => {
    const i = h.indexOf(Math.min(...h));
    cols[i].push(e);
    h[i] += 1 / e.ratio + 0.03;
  });
  const random = entries[Math.floor(entries.length / 2)];
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cols.map((c, i) => (
        <div key={i} className="flex flex-col gap-2">
          {i === 0 && (
            <section className="flex flex-col justify-end gap-5 p-1 sm:aspect-[4/3]">
              <header>
                <h1 className="text-[22px] leading-[1.15] font-medium tracking-[-0.015em] text-balance text-foreground">{title}</h1>
                <p className="mt-2 text-[14px] leading-normal text-pretty text-subtle">{blurb}</p>
              </header>
              {actions && random && (
                <div className="flex flex-wrap gap-2">
                  <Link href={random.kind === "website" ? `/website/${random.slug}` : `/feed/${random.slug}`} className={button("outline", "h-8 rounded-full px-3.5 text-sm")}>Surprise me</Link>
                  <Link href="/moodboards" className={button("silver", "h-8 rounded-full px-3.5 text-sm")}>Explore Moodboards</Link>
                </div>
              )}
            </section>
          )}
          {c.map((e) => <FeedCard key={e.slug} entry={e} />)}
        </div>
      ))}
    </div>
  );
}
