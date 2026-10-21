/* Run the measuring script over every entry with a clip, one at a time (each run can take a gigabyte), skipping the
   ones already done. bun scripts/measure-all.ts [--force]  Then bun scripts/build-drafts.ts packs the results. */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { ENTRIES } from "../src/lib/data";

const force = process.argv.includes("--force");
const clips = ENTRIES.filter((e) => e.video);
let ok = 0, skipped = 0; const failed: string[] = [];
const t0 = Date.now();
for (const [i, e] of clips.entries()) {
  const id = e.video!.src.match(/videos\/([a-z0-9]+)\//)?.[1] ?? e.slug;
  if (!force && existsSync(`measure/${id}/measure.json`)) { skipped++; continue; }
  const t = Date.now();
  const r = spawnSync("bun", ["scripts/measure.ts", e.slug], { encoding: "utf8", maxBuffer: 1 << 26 });
  const secs = ((Date.now() - t) / 1000).toFixed(1);
  if (r.status === 0) { ok++; console.log(`${String(i + 1).padStart(3)}/${clips.length} ${id} ${secs}s ${r.stdout.trim().split("\n").pop()}`); }
  else { failed.push(id); console.log(`${String(i + 1).padStart(3)}/${clips.length} ${id} FAILED ${r.stderr.split("\n").find((l) => /error/i.test(l))?.slice(0, 100) ?? ""}`); }
}
console.log(`done: ${ok} measured, ${skipped} already done, ${failed.length} failed [${failed.join(", ")}] in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
