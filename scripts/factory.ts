/* The rebuild factory: for each entry in the queue, hand the draft measurement and the keyframes to a headless Claude
   Code session with one instruction (look, build one HTML file, run the checker, fix, stop at the target or after N
   runs, write what it learned), then record what it cost and how close it got. Nothing here needs the MCP server or a
   key: the checker runs locally and the keyframes are files. Run it on a Mac with Chrome and the claude CLI.

     bun --conditions=react-server scripts/factory.ts [--top 20] [--slug <slug>]... [--rounds 3] [--target 90]
                                                      [--budget 4] [--model fable] [--force] [--pr] [--dry]

   Queue: --slug entries, or the top N by demand (src/lib/demand.ts) that have a draft and no recipe, skipping entries
   with a result already unless --force. Each entry gets factory/<slug>/: brief.json, PROMPT.md, index.html,
   kfN.png, side.png, check.json, NOTES.md, result.json. --pr pushes a branch per entry and opens a pull request with
   the side-by-side for review. --dry writes the brief and prompt and stops.

   The session runs with no MCP servers on purpose: the lookap MCP would spend a key's quota on frames the factory
   already has on disk, and the local probe (sheets, pixel dumps, edge tracks, zoom crops, pointer gestures) can see
   more than the MCP tools do today. What the factory agent needs is what every agent on the MCP needs; the gap
   between probe.ts and the MCP tools is the product backlog. */
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
- The clip itself, through \`bun scripts/probe.ts ${e.slug}\`:
    --sheet a,b                 a contact sheet of that span at 10 fps (36 frames), written to ${rel}/sheets/; cover the whole clip in 3.6 s spans and Read every sheet
    --col x --t t1,t2           light/mid/dark runs down column x at those times: row heights, gaps, borders, where things sit
    --col x --t t --hex a,b     exact colours, one per pixel, from y a to b: the true gradient of a surface, a border's real colour, a gap's shade
    --row y --t t [--hex a,b]   the same along a row
    --track x --from a --to b   the top and bottom edge of the red/dark/light stuff in column x per frame at 60 fps: a motion's start, end, distance and shape
    --zoom x,y,w,h --t t        that crop of the clip at 3x beside the same crop of your render at that moment (run the checker with --at t first), written to ${rel}/zoom/
    --drive "press x,y; move x,y; shot name; release; wait ms; click x,y; hover x,y"
                                real pointer gestures on your page, screenshots to ${rel}/drive/
  Keyframes are moments when nothing moves. Everything between them (how a thing enters, stretches, snaps, settles, in what order) is only in the frames, so look there before you decide the timeline.
- The checker: \`${CHECK} ${e.slug}\`. It renders your file at the frame size, seeks every animation on the page to each moment, screenshots, and diffs against the clip: the keyframes and, with the clip on disk, the middle of every measured phase, where things are mid-flight. It prints a 0..100 score per moment with the boxes and regions that differ most, and writes ${rel}/side.png (designer left, yours right, one row per moment, in time order). --at t1,t2 adds moments of your own; --quick scores only the keyframes and your --at moments. The score is a floor, not the goal: it is a mean pixel difference, so it cannot tell a 3 px black border from a 1 px grey edge, and a grid of buttons one pixel off costs more than a missing shadow. The zoom crops are the judge.

How to look (this is where rebuilds go wrong)
- Track something that should not move. Run --track through the heading with --class dark over the whole clip. If the heading moves when a panel opens or the thing enters, the page is a centred column that reflows, and you copy that layout rule (a flex column centred in the viewport, real heights) rather than absolute coordinates. If it does not move during a drag, that gesture is a transform, not layout. Both kinds can exist in one clip.
- Zoom before you draw. For every surface, --zoom a 150 x 130 crop of its edge at the rest moment and read it: how thick is the edge, what colour, is there a gap behind it, which side is lit. Then --hex a column through it for the real numbers. A row that looks "bordered" from afar is usually a 1 px light edge over a dark gap.
- Materials are part of the design: rims, bevels, inner highlights, the lip under a key, the ring around a button, a strap's stitching, the shade inside a fold. Draw what the crop shows, not what a component library would do.
- Interaction is the design. Whatever the clip's cursor does (hover, click, press, drag) the page must do for a real pointer, with the same response and timing, and it must start anywhere a person would grab: a press on a key or a button inside a draggable body must not stop the drag from beginning (play the note, let the event bubble). Test with --drive and Read the screenshots: the pressed state, the dragged state, the release.

Rules for the file
- The page is exactly the frame: html and body margin 0, overflow hidden, a #stage of ${draft.frame.w} x ${draft.frame.h} px, background ${draft.background}. Set --u: 1px on #stage and write every size as calc(N * var(--u)). Nothing outside the stage.
- Place elements from the keyframes and crops you looked at. The draft boxes are a first pass: trust your eyes over them. Fills from --hex, exact. Match proportion and hierarchy first, then colour, then motion.
- Demo mode for the checker: when the URL has ?demo=1 the page replays the clip's sequence on the clip's own timeline (animation-delay for when each move starts, duration and distance from draft.phases, draft.motion and your own probing) as CSS animations or element.animate calls created at load, so the state at t seconds matches the clip at t and the checker can seek it. Without ?demo the page only answers the pointer (a load-time entrance is fine if the clip has one). No JS timers for the timeline. Respect prefers-reduced-motion.
- Sampling: a texture that is not UI and cannot be drawn (marble, wood, fabric, a photo) may be taken from the clip as a small JPEG data URI patch, cropped where nothing sits on it, and tiled or stretched by you. Never paste a whole block with its chrome, edges, caps or controls: those you draw. Say in the header comment and in NOTES.md exactly what was sampled and from which frame.
- Fonts only from Google Fonts through a <link>; no other network. Credit the designer in a comment at the top with the source link from brief.json. Keep the file under 500 lines.

Loop
1. Read the sheets for the whole clip. Track the heading. Write the timeline as a list of events with numbers (what, from when to when, how far, which easing) from --track, and the layout from --col, --hex and the keyframes. Then build.
2. Run the checker, read side.png, then --zoom the worst region of the worst moment and the edge of each surface. Fix what the crops show, layout first, then materials, then motion. Run the checker again. Stop when the crops match, at a score of ${TARGET} or above, or after ${ROUNDS} runs of the checker.
3. --drive the interactions the clip shows and Read the screenshots. Fix what does not answer the pointer.
4. Write ${rel}/NOTES.md with three parts: "Timeline" (the event list from step 1, as measured), "Differences" (what still differs, with numbers) and "Pattern" (one thing you learned that applies beyond this entry, such as how a surface is lit, how a thing enters or settles, or which motions reflow the page, written as a design note of 3 to 6 factual sentences under a short name).

Do not create or change any file outside ${rel}/. Do not run anything other than the probe and the checker.`;
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
    "--permission-mode", "acceptEdits", "--allowedTools", "Read", "Write", "Edit", `Bash(${CHECK}:*)`, "Bash(bun scripts/probe.ts:*)",
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
