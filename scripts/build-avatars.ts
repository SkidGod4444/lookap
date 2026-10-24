/* Fetch every catalogue designer's X profile picture once and keep a small copy with the site, so the feed's cards
   can show it without a request per card to /api/avatar (which waits on unavatar.io the first time).
   Writes public/avatars/<handle>.webp (64 px, about 2 KB) and src/lib/avatars.json, the handles that have one.
   Handles already on disk are skipped; --force refetches.   bun scripts/build-avatars.ts [--force] */
import { existsSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { CATALOG } from "../src/lib/catalog";

const force = process.argv.includes("--force");
const handles = [...new Set(CATALOG.map((r) => r.x).filter((x): x is string => Boolean(x && /^[A-Za-z0-9_]{1,15}$/.test(x))))];
const have: string[] = [], missed: string[] = [];
const one = async (h: string) => {
  const out = `public/avatars/${h.toLowerCase()}.webp`;
  if (!force && existsSync(out)) { have.push(h); return; }
  for (const url of [`https://unavatar.io/x/${h}?fallback=false`, `https://lookap.saidev.codes/api/avatar/${h}`]) {
    try {
      const res = await fetch(url, { headers: { "user-agent": "lookap/0.2 (+https://lookap.saidev.codes)" }, signal: AbortSignal.timeout(15_000) });
      if (!res.ok || !(res.headers.get("content-type") ?? "").startsWith("image/")) continue;
      await sharp(Buffer.from(await res.arrayBuffer())).resize(64, 64, { fit: "cover" }).webp({ quality: 80 }).toFile(out);
      have.push(h); return;
    } catch { /* next source */ }
  }
  missed.push(h);
};
for (let i = 0; i < handles.length; i += 6) await Promise.all(handles.slice(i, i + 6).map(one));
writeFileSync("src/lib/avatars.json", JSON.stringify(have.map((h) => h.toLowerCase()).sort()) + "\n");
console.log(`${have.length} of ${handles.length} handles have a picture${missed.length ? `; no picture for: ${missed.join(", ")}` : ""}`);
