/* Write the rubric for every clip entry that has a draft, no recipe and no rubric yet, one after another, and pack
   them when done. Resumable: an entry with factory/<slug>/rubric.json is skipped, so a stopped run picks up where
   it left off. Prints one line per entry and a total; the same lines go to factory/rubrics.log.
     bun --conditions=react-server scripts/rubric-all.ts [--limit N] [--model opus] */
import { spawnSync } from "node:child_process";
import { existsSync, appendFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ENTRIES } from "../src/lib/data";
import { recipeFor } from "../src/lib/registry";
import { clipId, draftFor } from "../src/lib/drafts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const flag = (n: string, d: string) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const LIMIT = Number(flag("--limit", "1000")), MODEL = flag("--model", "opus");
const queue = ENTRIES.filter((e) => e.video && !recipeFor(e) && draftFor(e) && clipId(e) && existsSync(path.join(ROOT, "measure", clipId(e)!, "source.mp4")) && !existsSync(path.join(ROOT, "factory", e.slug, "rubric.json"))).slice(0, LIMIT);
console.log(`${queue.length} entries without a rubric`);
const log = path.join(ROOT, "factory", "rubrics.log");
let cost = 0, done = 0, failed = 0;
const t0 = Date.now();
for (const e of queue) {
  const t = Date.now();
  const r = spawnSync("bun", ["--conditions=react-server", "scripts/rubric.ts", e.slug, "--model", MODEL], { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 26 });
  const line = (r.stdout.trim().split("\n").pop() ?? "").replace(/^factory\/[^:]+: /, "");
  const m = line.match(/\$([\d.]+)/);
  if (r.status === 0 && m) { cost += Number(m[1]); done++; } else failed++;
  const out = `${e.slug}: ${r.status === 0 ? line : `FAILED ${r.stderr.trim().split("\n").pop()}`} (${((Date.now() - t) / 60000).toFixed(1)} min; ${done} done, ${failed} failed, $${cost.toFixed(2)} so far)`;
  console.log(out);
  appendFileSync(log, `${new Date().toISOString()} ${out}\n`);
}
const pack = spawnSync("bun", ["scripts/build-rubrics.ts"], { cwd: ROOT, encoding: "utf8" });
console.log(`${pack.stdout.trim()}\n${done} written, ${failed} failed, $${cost.toFixed(2)}, ${((Date.now() - t0) / 3600000).toFixed(1)} h`);
