/* The rebuild factory: for each entry in the queue, hand the draft measurement and the keyframes to a headless Claude
   Code session with one instruction (look, build one HTML file, run the checker, fix, stop at the target or after N
   runs, write what it learned), then record what it cost and how close it got. Nothing here needs the MCP server or a
   key: the checker runs locally and the keyframes are files. Run it on a Mac with Chrome and the claude CLI.

     bun --conditions=react-server scripts/factory.ts [--top 20] [--slug <slug>]... [--rounds 3] [--target 90]
                                                      [--budget 4] [--model fable] [--force] [--pr] [--dry]

   Queue: --slug entries, or the top N by demand (src/lib/demand.ts) that have a draft and no recipe, skipping entries
   with a result already unless --force. Each entry gets factory/<slug>/: brief.json, PROMPT.md, index.html,
   kfN.png, side.png, check.json, NOTES.md, result.json. --pr pushes a branch per entry and opens a pull request with
   the side-by-side for review. --dry writes the brief and prompt and stops. */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ENTRIES, bySlug, type Entry } from "../src/lib/data";
import { briefFor, recipeFor } from "../src/lib/registry";
import { draftFor } from "../src/lib/drafts";
import { topDemand } from "../src/lib/demand";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const flag = (n: string, d: string) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const has = (n: string) => args.includes(n);
const slugs = args.flatMap((a, i) => (a === "--slug" ? [args[i + 1]] : []));
const TOP = Number(flag("--top", "20"));
const ROUNDS = Number(flag("--rounds", "3"));
const TARGET = Number(flag("--target", "90"));
const BUDGET = flag("--budget", "4");
const MODEL = flag("--model", "fable");
const FORCE = has("--force"), PR = has("--pr"), DRY = has("--dry");
const CHECK = "bun --conditions=react-server scripts/check-build.ts";

/* the queue */
let queue: Entry[];
if (slugs.length) {
  queue = slugs.map((s) => { const e = bySlug(s); if (!e) { console.error(`no entry ${s}`); process.exit(2); } return e; });
} else {
  const ranked = await topDemand(200);
  const bySlugRank = new Map(ranked.map((r, i) => [r.slug, i]));
  queue = ENTRIES.filter((e) => e.video && !recipeFor(e) && draftFor(e))
    .sort((a, b) => (bySlugRank.get(a.slug) ?? 1e9) - (bySlugRank.get(b.slug) ?? 1e9))
    .filter((e) => FORCE || !existsSync(path.join(ROOT, "factory", e.slug, "result.json")))
    .slice(0, TOP);
}
if (!queue.length) { console.log("nothing queued"); process.exit(0); }
console.log(`${queue.length} entr${queue.length === 1 ? "y" : "ies"} queued: ${queue.map((e) => e.slug).join(", ")}`);

function prompt(e: Entry, dir: string) {
  const draft = draftFor(e)!;
  const kfs = draft.keyframes.map((k) => `  - ${k.name} at ${k.at}s: public${k.src}`).join("\n");
  const rel = path.relative(ROOT, dir);
  return `Rebuild the lookap entry "${e.title}" by ${e.authorName} as one self-contained HTML file at ${rel}/index.html.

What you have
- ${rel}/brief.json: the record, the draft measurement (frame, phases, keyframes with their times, background, palette, element boxes, moves), the credit, and the measuring method behind every recipe.
- The designer's clip at its keyframes (frame ${draft.frame.w} x ${draft.frame.h}, ${draft.duration}s):
${kfs}
  Read every one of them before writing anything, then describe the layout to yourself in one paragraph: regions, alignment, type scale, radii, spacing rhythm, what moves between the keyframes.
- The checker: \`${CHECK} ${e.slug}\`. It renders your file at the frame size, seeks every animation on the page to each keyframe's time, screenshots, and diffs against the designer's keyframe. It prints a 0..100 score per keyframe with the boxes and regions that differ most, and writes ${rel}/side.png (designer left, yours right, one row per keyframe). Read side.png after every run; your eyes judge what the numbers cannot.

Rules for the file
- The page is exactly the frame: html and body margin 0, overflow hidden, a #stage of ${draft.frame.w} x ${draft.frame.h} px, background ${draft.background}. Set --u: 1px on #stage and write every size as calc(N * var(--u)). Nothing outside the stage.
- Place elements from the keyframes you looked at. The draft boxes are a first pass: trust your eyes over them. Fills from the palette, exact hex. Match proportion and hierarchy first, then colour, then motion.
- Motion as CSS animations that start at load: animation-delay for when a move starts, duration and distance from draft.phases and draft.motion, so the state at t seconds matches the keyframe at t. No JS timers for the timeline. JS only for what CSS cannot express, and then through element.animate so the checker can seek it. Respect prefers-reduced-motion.
- Fonts only from Google Fonts through a <link>; no other network. Credit the designer in a comment at the top with the source link from brief.json. Keep the file under 400 lines.

Loop
1. Look, build, run the checker, read side.png.
2. Fix the three largest differences. Run the checker again. Stop at a score of ${TARGET} or above, or after ${ROUNDS} runs of the checker.
3. Write ${rel}/NOTES.md with two parts: "Differences" (what still differs, with numbers) and "Pattern" (one thing you learned that applies beyond this entry, such as how a surface is lit, how a thing enters or settles, written as a design note of 3 to 6 factual sentences under a short name).

Do not create or change any file outside ${rel}/. Do not run anything other than the checker.`;
}

type Claude = { result?: string; total_cost_usd?: number; duration_ms?: number; num_turns?: number; is_error?: boolean; terminal_reason?: string; modelUsage?: Record<string, { inputTokens: number; outputTokens: number; cacheReadInputTokens: number; cacheCreationInputTokens: number }> };

const rows: string[] = [];
for (const e of queue) {
  const dir = path.join(ROOT, "factory", e.slug);
  mkdirSync(dir, { recursive: true });
  const brief = briefFor(e);
  writeFileSync(path.join(dir, "brief.json"), JSON.stringify({ ...brief, keyframeFiles: draftFor(e)!.keyframes.map((k) => ({ name: k.name, at: k.at, file: `public${k.src}` })) }, null, 1));
  const text = prompt(e, dir);
  writeFileSync(path.join(dir, "PROMPT.md"), text);
  if (DRY) { console.log(`${e.slug}: brief and prompt written`); continue; }

  console.log(`\n${e.slug}: starting (${MODEL}, budget $${BUDGET}, ${ROUNDS} runs, target ${TARGET})`);
  const t0 = Date.now();
  const env = { ...process.env } as NodeJS.ProcessEnv;
  delete env.CLAUDECODE; /* the CLI refuses to nest otherwise */
  const run = spawnSync("claude", [
    "-p", text, "--output-format", "json", "--model", MODEL, "--max-budget-usd", BUDGET,
    "--permission-mode", "acceptEdits", "--allowedTools", "Read", "Write", "Edit", `Bash(${CHECK}:*)`,
    "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}',
  ], { cwd: ROOT, env, encoding: "utf8", maxBuffer: 1 << 28 });
  const minutes = Number(((Date.now() - t0) / 60000).toFixed(1));
  let out: Claude = {};
  const stdout = String(run.stdout ?? ""), stderr = String(run.stderr ?? "");
  try { out = JSON.parse(stdout.trim().split("\n").pop() ?? "{}"); } catch { out = { is_error: true, result: stdout.slice(-2000) }; }
  if (run.status !== 0 && !out.result) out.result = stderr.slice(-2000);

  /* a final check, so the record is of the file as left, not of the agent's last run */
  const check = existsSync(path.join(dir, "index.html")) ? spawnSync("bun", ["--conditions=react-server", "scripts/check-build.ts", e.slug], { cwd: ROOT, encoding: "utf8" as const }) : null;
  const scored = existsSync(path.join(dir, "check.json")) ? (JSON.parse(readFileSync(path.join(dir, "check.json"), "utf8")) as { score: number; runs: number; keyframes: { keyframe: string; score: number }[] }) : null;
  const usage = Object.values(out.modelUsage ?? {}).reduce((s, m) => ({ written: s.written + m.outputTokens, read: s.read + m.inputTokens + m.cacheReadInputTokens + m.cacheCreationInputTokens }), { written: 0, read: 0 });
  const result = {
    slug: e.slug, title: e.title, author: e.authorName, model: MODEL,
    score: scored?.score ?? null, keyframes: scored?.keyframes ?? [], checkerRuns: scored ? scored.runs - 1 : 0, /* minus the final one here */
    minutes, turns: out.num_turns ?? null, costUsd: out.total_cost_usd ?? null, tokens: usage,
    ended: out.terminal_reason ?? (out.is_error ? "error" : "done"), notes: existsSync(path.join(dir, "NOTES.md")),
    summary: (out.result ?? "").slice(0, 1200), checker: check ? String(check.stdout).split("\n")[0] : "no file", at: new Date().toISOString(),
  };
  writeFileSync(path.join(dir, "result.json"), JSON.stringify(result, null, 1));
  const line = `${e.slug}: score ${result.score ?? "-"} after ${result.checkerRuns} runs, ${minutes} min, ${result.turns ?? "?"} turns, $${result.costUsd?.toFixed(2) ?? "?"}, ${Math.round(usage.written / 1000)}k written / ${(usage.read / 1e6).toFixed(1)}M read, ${result.ended}`;
  rows.push(line);
  console.log(line);

  if (PR && result.score !== null) {
    const branch = `rebuild/${e.slug}`;
    const git = (...a: string[]) => spawnSync("git", a, { cwd: ROOT, encoding: "utf8" });
    git("checkout", "-q", "-B", branch, "main");
    git("add", `factory/${e.slug}`);
    git("commit", "-q", "-m", `Rebuild: ${e.title} (factory, score ${result.score})\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`);
    git("push", "-q", "-u", "origin", branch);
    const body = [
      `Factory rebuild of **${e.title}** by ${e.authorName}${e.sourceUrl ? ` (${e.sourceUrl})` : ""}.`, "",
      `Score ${result.score} over ${result.keyframes.length} keyframes (${result.keyframes.map((k) => `${k.keyframe} ${k.score}`).join(", ")}), ${result.checkerRuns} checker runs, ${minutes} min, $${result.costUsd?.toFixed(2)}.`, "",
      `![side by side](https://github.com/SkidGod4444/lookap/blob/${branch}/factory/${e.slug}/side.png?raw=true)`, "",
      "Designer left, rebuild right, one row per keyframe. Merge to keep the file under factory/; reject to drop it.", "",
      "🤖 Generated with [Claude Code](https://claude.com/claude-code)",
    ].join("\n");
    const pr = spawnSync("gh", ["pr", "create", "--title", `Rebuild: ${e.title}`, "--body", body, "--base", "main", "--head", branch], { cwd: ROOT, encoding: "utf8" });
    console.log(pr.stdout.trim() || pr.stderr.trim());
    git("checkout", "-q", "main");
  }
}
if (rows.length > 1) console.log(`\n${rows.join("\n")}`);
