/* Count how often each lesson in src/lib/lessons.ts has actually happened: read every judged round in factory/
   (rounds/round-N.verdict.json, and verdict.json), take each criterion the judge failed with a note, and match the
   note against each lesson's pattern. Writes src/lib/lessons.json, which the brief uses to list the most frequent
   lessons first. Notes where the judge could not see the part are skipped.

     bun scripts/lessons.ts */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LESSONS } from "../src/lib/lessons";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const F = path.join(ROOT, "factory");
type Crit = { pass?: string; seen?: string | null; axis?: string; element?: string };
const tally: Record<string, { fails: number; rebuilds: Set<string>; example?: string }> = Object.fromEntries(LESSONS.map((l) => [l.id, { fails: 0, rebuilds: new Set<string>() }]));
let rounds = 0, unmatched = 0;
const rebuilds = new Set<string>();
const misses: string[] = [];
for (const slug of readdirSync(F)) {
  const files = [path.join(F, slug, "verdict.json"), ...(existsSync(path.join(F, slug, "rounds")) ? readdirSync(path.join(F, slug, "rounds")).filter((f) => f.endsWith(".verdict.json")).map((f) => path.join(F, slug, "rounds", f)) : [])].filter(existsSync);
  for (const file of files) {
    let v: { rubric?: { criteria?: Crit[] } };
    try { v = JSON.parse(readFileSync(file, "utf8")); } catch { continue; }
    const crit = v.rubric?.criteria ?? [];
    if (!crit.some((c) => c.pass)) continue;
    rounds++; rebuilds.add(slug);
    for (const c of crit) {
      if (c.pass === "yes" || !c.seen) continue;
      const seen = c.seen.toLowerCase();
      if (/can't be|cannot be|not in the tile|cuts off|outside the tile|no .* visible in either/.test(seen)) continue;
      let hit = false;
      for (const l of LESSONS) if (l.caught.test(seen)) { hit = true; const t = tally[l.id]; t.fails++; t.rebuilds.add(slug); t.example ??= `${c.element}: ${c.seen.replace(/\s*\[votes:[^\]]*\]/, "").slice(0, 200)}`; }
      if (!hit) { unmatched++; misses.push(`${slug.slice(0, 12)} ${c.axis}: ${c.seen.slice(0, 120)}`); }
    }
  }
}
const out = { rounds, rebuilds: rebuilds.size, at: new Date().toISOString().slice(0, 10), lessons: Object.fromEntries(Object.entries(tally).map(([k, t]) => [k, { fails: t.fails, rebuilds: t.rebuilds.size, ...(t.example ? { example: t.example } : {}) }])) };
writeFileSync(path.join(ROOT, "src", "lib", "lessons.json"), JSON.stringify(out, null, 1) + "\n");
console.log(`${rounds} judged rounds over ${rebuilds.size} rebuilds`);
for (const l of LESSONS) console.log(`  ${l.id}: ${out.lessons[l.id].fails} failures in ${out.lessons[l.id].rebuilds} rebuilds`);
console.log(`${unmatched} failures no lesson recognises${misses.length ? ":\n" + misses.slice(0, 12).map((m) => "  " + m).join("\n") : ""}`);
