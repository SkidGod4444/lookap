import "server-only";
import { dbReady, kv } from "./db";
import { ENTRIES } from "./data";
import { recipeFor } from "./registry";

/* Demand per entry: what people save, what agents pull, what gets opened. One hash per slug with the three counts and
   one sorted set with a weighted score, so the rebuild queue can be read in one call. A save is worth five opens; an
   agent read is worth three, since someone is building from it. Counting never blocks the request that caused it. */
export type Kind = "save" | "agent" | "view";
const WEIGHT: Record<Kind, number> = { save: 5, agent: 3, view: 1 };

export function bump(slug: string, kind: Kind, by = 1) {
  if (!dbReady || !slug) return;
  const p = kv().pipeline();
  p.hincrby(`demand:${slug}`, kind, by);
  p.zincrby("demand:rank", WEIGHT[kind] * by, slug);
  p.exec().catch(() => {});
}

export type DemandRow = { slug: string; title: string; author: string; score: number; saves: number; agent: number; views: number; measured: boolean; rebuilt: boolean };

/* The queue: entries by demand, highest first, with their counts and whether a recipe exists yet. */
export async function topDemand(n = 50): Promise<DemandRow[]> {
  if (!dbReady) return [];
  const ranked = await kv().zrange<string[]>("demand:rank", 0, n - 1, { rev: true, withScores: true });
  const slugs: string[] = [], scores: number[] = [];
  for (let i = 0; i < ranked.length; i += 2) { slugs.push(String(ranked[i])); scores.push(Number(ranked[i + 1])); }
  if (!slugs.length) return [];
  const p = kv().pipeline();
  slugs.forEach((s) => p.hgetall<Record<string, number>>(`demand:${s}`));
  const counts = (await p.exec()) as (Record<string, number> | null)[];
  return slugs.map((slug, i) => {
    const e = ENTRIES.find((x) => x.slug === slug);
    const c = counts[i] ?? {};
    const r = e ? recipeFor(e) : undefined;
    return { slug, title: e?.title ?? slug, author: e?.authorName ?? "", score: scores[i], saves: Number(c.save ?? 0), agent: Number(c.agent ?? 0), views: Number(c.view ?? 0), measured: Boolean(r), rebuilt: Boolean(r) };
  });
}
