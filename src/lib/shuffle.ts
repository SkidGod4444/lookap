import { cacheLife } from "next/cache";

/* A fresh order for a list of slugs, made on the server and kept a few minutes ("minutes": served for 5 min, remade
   at most every minute), so visitors see the feed in a new order without the page reshuffling after it paints.
   `key` keeps separate lists (the feed, the home section) from sharing one order. */
export async function shuffledSlugs(key: string, slugs: string[]): Promise<string[]> {
  "use cache";
  cacheLife("minutes");
  void key;
  const s = [...slugs];
  for (let k = s.length - 1; k > 0; k--) { const r = Math.floor(Math.random() * (k + 1)); [s[k], s[r]] = [s[r], s[k]]; }
  return s;
}
