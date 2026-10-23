/* The rebuild factory: for each entry in the queue, write the entry's rubric once, then run up to N judged rounds. A
   round is one headless Claude Code session that builds or fixes the file and runs the cheap checker as often as it
   likes; when it ends, the orchestrator runs the judge (the rubric, a vision model, once per round), keeps the file
   if it ranks above the best so far and restores the best otherwise, and hands the next round the failures to fix.
   The loop stops when every criterion passes and the render moves where the clip moves, or after N rounds. There
   is no score to reach: a number was what the old loop stopped at while the result looked wrong.

     bun --conditions=react-server scripts/factory.ts [--top 20] [--slug <slug>]... [--rounds 3] [--budget 4]
                                                      [--model opus] [--judge-model sonnet] [--judge-votes 3] [--rubric-model opus]
                                                      [--force] [--pr] [--dry]

   Queue: --slug entries, or the top N by demand (src/lib/demand.ts) that have a draft and no recipe, skipping entries
   with a result already unless --force. Each entry gets factory/<slug>/: brief.json, rubric.json, PROMPT.md,
   index.html, <moment>.png, side.png, check.json, verdict.json, judge/, rounds/ (every round's file and verdict),
   costs.jsonl, NOTES.md, result.json. --budget is per round and caps the coding session only; the rubric and the
   judge are separate model calls, billed outside that cap, and their cost is written into result.json beside it.
   --pr pushes a branch per entry and opens a pull request with the side-by-side. --dry writes the brief, rubric and
   prompt and stops.

   Imagery: the rubric classes every pictorial region. css things are drawn; structured things (icons, logos) get an
   original SVG; photo things (photographs, paintings, screenshots) are not copied: the probe refuses a patch larger
   than a texture tile and offers --placeholder, a coarse colour grid of the region, unless factory/<slug>/licence.json
   says the designer allowed sampling. result.json lists every photo region and whether it was reproduced.

   The session runs with no MCP servers on purpose: the lookap MCP would spend a key's quota on frames the factory
   already has on disk, and the local probe can see more than the MCP tools do today. What the factory agent needs is
   what every agent on the MCP needs; the gap between probe.ts and the MCP tools is the product backlog. */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ENTRIES, bySlug, type Entry } from "../src/lib/data";
import { briefFor, recipeFor } from "../src/lib/registry";
import { lessonsFor } from "../src/lib/lessons";
import { draftFor } from "../src/lib/drafts";
import { topDemand } from "../src/lib/demand";
import type { Rubric } from "./rubric";
import { isLicensed } from "../src/lib/licence";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const flag = (n: string, d: string) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const has = (n: string) => args.includes(n);
const slugs = args.flatMap((a, i) => (a === "--slug" ? [args[i + 1]] : []));
const TOP = Number(flag("--top", "20"));
const ROUNDS = Number(flag("--rounds", "3"));
const BUDGET = flag("--budget", "4");
const MODEL = flag("--model", "opus"); /* Opus 5.5 builds; the judge stays on sonnet so the judge is never the builder */
const JUDGE_MODEL = flag("--judge-model", "sonnet"), RUBRIC_MODEL = flag("--rubric-model", "opus"), VOTES = flag("--judge-votes", "3");
const FORCE = has("--force"), PR = has("--pr"), DRY = has("--dry");
const CHECK = "bun --conditions=react-server scripts/check-build.ts";
const bun = (script: string, a: string[]) => spawnSync("bun", ["--conditions=react-server", script, ...a], { cwd: ROOT, encoding: "utf8" as const, maxBuffer: 1 << 26 });

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

type VerdictFile = {
  rank: number; allPass: boolean; animations: number;
  pixel: { score: number };
  elements: { name: string; box: number[]; read: string; deltaE: number; shift: [number, number] | null }[];
  motion: { read: string; trajectories: { element: string; read: string }[]; changes: { from: string; to: string; clip: number; render: number; read: string }[] };
  scale?: { ok: boolean; changed: number; read: string };
  rubric: { pass: number; fail: number; unsure: number; counted: number; criteria: { id: string; axis: string; element: string; check: string; box: number[]; at: number; then: number | null; policy: string | null; pass: string | null; seen: string | null; image: string | null }[] } | null;
  judge: { model: string; costUsd: number; calls: number } | null;
};

const POLICY = {
  css: "draw it: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)",
  structured: "draw an original SVG with the same silhouette, weight and colours; it is judged on silhouette and colour, not pixels",
  photo: "this designer has not licensed sampling: do not copy the clip's pixels. Stand it in with `--placeholder x,y,w,h --t t --as name` (a coarse colour grid of the region: same box, same colour layout, no detail), blur or grain it to the clip's softness, put data-imagery=\"not reproduced: <what the clip shows>\" on that element, and draw everything that sits on it yourself. --patch refuses anything bigger than a texture tile for this entry",
  licensed: "licensed: take it from the clip with --patch at a moment when nothing moving covers it (a tile to repeat, or the whole region as one patch; keep it under 120 KB and crop out any UI, text or controls, which you draw), then name what was sampled and from which frame in the header comment and NOTES.md. When something moving passes over it, sample from the frame where it is clear, or several frames stitched",
} as const;

function prompt(e: Entry, dir: string, rubric: Rubric | null, licensed: boolean) {
  const draft = draftFor(e)!;
  const kfs = draft.keyframes.map((k) => `  - ${k.name} at ${k.at}s: public${k.src}`).join("\n");
  const rel = path.relative(ROOT, dir);
  const criteria = rubric ? rubric.criteria.map((c) => `  ${c.id} [${c.axis}, ${c.element}] ${c.check}${c.then == null ? ` (look at ${c.at}s)` : ` (compare ${c.at}s with ${c.then}s)`}`).join("\n") : "  (no rubric: judge by the crops)";
  const imagery = rubric && rubric.imagery.length
    ? rubric.imagery.map((m) => `  - ${m.name} [${m.box.join(",")}] is ${m.class}: ${m.what}. Rule: ${m.class === "photo" && licensed ? POLICY.licensed : POLICY[m.class]}`).join("\n")
    : "  - nothing pictorial was found; everything is UI and is drawn";
  return `Rebuild the lookap entry "${e.title}" by ${e.authorName} as one self-contained HTML file at ${rel}/index.html.

What you have
- ${rel}/brief.json: the record, the draft measurement (frame, phases, keyframes with their times, background, palette, element boxes, moves), the credit, and the measuring method behind every recipe.
- ${rel}/rubric.json: the checklist this rebuild is judged against, written from the clip. ${rubric ? `Its summary: ${rubric.summary}` : ""}
- The designer's clip at its keyframes (frame ${draft.frame.w} x ${draft.frame.h}, ${draft.duration}s):
${kfs}
  Read every one of them before writing anything, then describe the layout to yourself in one paragraph: regions, alignment, type scale, radii, spacing rhythm, what moves between the keyframes.
- The clip itself, through \`bun scripts/probe.ts ${e.slug}\`:
    --sheet a,b                 a contact sheet of that span at 10 fps (36 frames), written to ${rel}/sheets/; cover the whole clip in 3.6 s spans and Read every sheet
    --diff a,b                  the clip at a, at b, and what changed between them in white: which thing moves, which only has something pass over it; written to ${rel}/diff/
    --col x --t t1,t2           light/mid/dark runs down column x at those times: row heights, gaps, borders, where things sit
    --col x --t t --hex a,b     exact colours, one per pixel, from y a to b: the true gradient of a surface, a border's real colour, a gap's shade
    --row y --t t [--hex a,b]   the same along a row
    --track x --from a --to b   the top and bottom edge of the red/dark/light stuff in column x per frame at 60 fps: a motion's start, end, distance and shape
    --zoom x,y,w,h --t t        that crop of the clip at up to 4x beside the same crop of your render at that moment (run the checker with --at t first), written to ${rel}/zoom/
    --patch x,y,w,h --t t --as name
                                a texture tile from the clip as a small JPEG, written to ${rel}/patches/ and set into your index.html as --patch-name in <style id="patches">, for background-image: var(--patch-name). The only way to sample; never retype base64 yourself. Refused above a tile's size.
    --placeholder x,y,w,h --t t --as name
                                a coarse colour grid of that region, set as --placeholder-name: the stand-in for a photograph, painting or screenshot the rebuild may not copy.
    --drive "press x,y; move x,y; shot name; release; wait ms; click x,y; hover x,y"
                                real pointer gestures on your page, screenshots to ${rel}/drive/
  Keyframes are moments when nothing moves. Everything between them (how a thing enters, stretches, snaps, settles, in what order) is only in the frames, so look there before you decide the timeline.
- The checker: \`${CHECK} ${e.slug}\`. It renders your file at the frame size, seeks every animation on the page to each moment, screenshots, and compares with the clip at the keyframes, the middle of every measured phase and the rubric's moments. It prints: a pixel score per moment (a floor, not a goal: it cannot tell a drawn ring from a glass lens or a nine-spoke spinner from a disc), the elements whose colour (deltaE) or place (shift) differ, whether your render moves where the clip moves, and how each measured moving part keeps step. It writes ${rel}/side.png (designer left, yours right, one row per moment) and ${rel}/verdict.json. --at t1,t2 adds moments; --quick scores only the keyframes and your --at moments. The rubric itself is judged by a separate vision model after your session ends, criterion by criterion on crop pairs; you cannot run it, so check each criterion by eye with --zoom before you stop.

The checklist (every line must be true of your file; the judge looks at a crop of the clip beside the same crop of your render):
${criteria}

Imagery (what the clip shows that is not plain UI, and the rule for each):
${imagery}

How to look (this is where rebuilds go wrong)
- Find what moves with --diff before you decide the timeline: two frames half a second apart, in two or three parts of the clip. The draft's motion rows can be fooled by a thing passing over a region. Then --track the moving edge for its start, end, distance and speed.
- Track something that should not move. Run --track through the heading with --class dark over the whole clip. If the heading moves when a panel opens or the thing enters, the page is a centred column that reflows, and you copy that layout rule rather than absolute coordinates. If it does not move during a drag, that gesture is a transform, not layout.
- Zoom before you draw. For every surface, --zoom a 150 x 130 crop of its edge at the rest moment and read it: how thick is the edge, what colour, is there a gap behind it, which side is lit. Then --hex a column through it for the real numbers.
- Materials are part of the design: a glass ring refracts what is behind it at its rim (the background shifts and a highlight runs along the edge), it is not an outline; a frosted panel shows the picture through it; rims, bevels, inner highlights, the lip under a key, the shade inside a fold. Draw what the crop shows, not what a component library would do.
- Known ways rebuilds fail, in order of how often: a water ripple or lens drawn as hard concentric rings or a stroked outline, where the clip shows the picture beneath bending softly with a faint crest (build it as displacement or magnification of the background with soft falloff, never as a drawn ring); type dimmer, lighter or a different weight than the clip's; a texture as a flat gradient where the clip has grain; a seam where a patch tiles; a page that does not move while the clip does (the checker says STATIC); a wrong count (spokes, dots, rows, rings); the wrong thing moving (the background drifting when it is the rings that grow); timing read from the stills instead of tracked.
- Interaction is the design. Whatever the clip's cursor does (hover, click, press, drag) the page must do for a real pointer, with the same response and timing. Test with --drive and Read the screenshots.

Rules for the file
- The page is exactly the frame: html and body margin 0, overflow hidden, a #stage of ${draft.frame.w} x ${draft.frame.h} px, background ${draft.background}. Set --u: 1px on #stage and write every size as calc(N * var(--u)), including an inline SVG's size (give it a CSS width and height in var(--u), not only width and height attributes) and every length the script sets or animates (calc(${"${n}"} * var(--u)), never ${"${n}"}px). The site shows the file at any size by changing --u; the checker renders it at half size and fails it if anything stays full size. Nothing outside the stage.
- Place elements from the keyframes and crops you looked at. The draft boxes are a first pass and the rubric boxes a second: trust your eyes over both. Fills from --hex, exact. Match proportion and hierarchy first, then colour, then motion.
- Demo mode for the checker: when the URL has ?demo=1 the page replays the clip's sequence on the clip's own timeline (animation-delay for when each move starts, duration and distance from draft.phases, draft.motion and your own probing) as CSS animations or element.animate calls created at load, so the state at t seconds matches the clip at t and the checker can seek it. Without ?demo the page only answers the pointer (a load-time entrance is fine if the clip has one). No JS timers for the timeline. Respect prefers-reduced-motion.
- Sampling: a texture that is not UI and cannot be drawn (marble, wood, fabric, grain) is taken from the clip with --patch as a tile, cropped where nothing sits on it, at a moment when it is at rest, and tiled, stretched or layered by you; keep each under 60 KB. A photograph, painting or screenshot is a photo-class region and follows its rule above${licensed ? " (this entry is licensed: the picture itself may be sampled)" : ""}. Never paste a block with its chrome, text or controls: those you draw. Say in the header comment and in NOTES.md exactly what was sampled or stood in, and from which frame.
- Fonts only from Google Fonts through a <link>; no other network. Credit the designer in a comment at the top with the source link from brief.json. Keep the file under 500 lines.

What earlier rebuilds got wrong (each failed the judge on real entries; check every one before you call a round done)
${lessonsFor(rubric ? `${rubric.criteria.map((c) => c.check).join(" ")}` : `${e.title} ${e.types.join(" ")}`, "pro").map((l) => `- ${l.title}. ${l.rule}`).join("\n")}

Loop
1. Read the sheets and two or three --diff pairs for the whole clip. Track the moving edge and the heading. Write the timeline as a list of events with numbers (what, from when to when, how far, which easing), and the layout from --col, --hex and the keyframes. Then build.
2. Run the checker, read side.png, then --zoom the worst region of the worst moment, the edge of each surface, and every rubric criterion you are not sure of. Fix what the crops show: layout first, then materials, then motion. Run the checker again. Stop when the crops match the clip for every criterion, or after four runs of the checker: more runs past that have not bought anything in earlier entries, and the judge runs when you stop.
3. --drive the interactions the clip shows and Read the screenshots. Fix what does not answer the pointer.
4. Write ${rel}/NOTES.md with three parts: "Timeline" (the event list from step 1, as measured), "Differences" (what still differs, with numbers, and every photo-class region stood in rather than reproduced) and "Pattern" (one thing you learned that applies beyond this entry, written as a design note of 3 to 6 factual sentences under a short name).

Do not create or change any file outside ${rel}/. Do not run anything other than the probe and the checker.`;
}

/* the next round starts from the best file so far and is told exactly what the judge found wrong with it */
function handoff(round: number, v: VerdictFile, rel: string) {
  const failed = v.rubric?.criteria.filter((c) => c.pass === "no" && !c.policy) ?? [];
  const unsure = v.rubric?.criteria.filter((c) => c.pass === "unsure" && !c.policy) ?? [];
  const els = v.elements.filter((el) => el.read !== "matches").slice(0, 6);
  return `\n\nRound ${round}. ${rel}/index.html already exists: it is the best file so far (rubric ${v.rubric?.pass ?? 0} of ${v.rubric?.counted ?? 0} pass, pixel ${v.pixel.score}). Do not start over; open it, fix exactly what follows, and keep everything that passes. Read each listed image first: the clip is on the left (or the top row), yours on the right (or the bottom row).
${failed.length ? `Failed criteria:\n${failed.map((c) => `  ${c.id} [${c.axis}, ${c.element}] ${c.check}\n      judge saw: ${c.seen}\n      ${c.image}  |  bun scripts/probe.ts ${path.basename(rel)} --zoom ${c.box.join(",")} --t ${c.at}`).join("\n")}` : "No criterion failed outright."}
${unsure.length ? `Unsure (the judge could not see; make it unmistakable):\n${unsure.map((c) => `  ${c.id} ${c.check} (judge: ${c.seen})`).join("\n")}` : ""}
${v.scale && !v.scale.ok ? `Scale: ${v.scale.read}. Fix this first.\n` : ""}Motion: ${v.motion.read}.${v.motion.trajectories.filter((t) => t.read !== "in step").map((t) => ` ${t.element}: ${t.read}.`).join("")}
${els.length ? `Elements at rest that differ: ${els.map((el) => `${el.name} ${el.read}`).join("; ")}.` : ""}
Then run the checker, zoom what you changed, and update ${rel}/NOTES.md.`;
}

type Claude = { result?: string; total_cost_usd?: number; duration_ms?: number; num_turns?: number; is_error?: boolean; terminal_reason?: string; modelUsage?: Record<string, { inputTokens: number; outputTokens: number; cacheReadInputTokens: number; cacheCreationInputTokens: number }> };
type RoundRow = { round: number; minutes: number; turns: number | null; costUsd: number; tokens?: { written: number; read: number }; judgeUsd: number; ended: string; score: number | null; rank: number | null; allPass: boolean; rubric: { pass: number; fail: number; unsure: number; of: number } | null; motion: string | null; kept: boolean };

const rows: string[] = [];
for (const e of queue) {
  const dir = path.join(ROOT, "factory", e.slug);
  const rel = path.relative(ROOT, dir);
  mkdirSync(path.join(dir, "rounds"), { recursive: true });
  const brief = briefFor(e);
  writeFileSync(path.join(dir, "brief.json"), JSON.stringify({ ...brief, keyframeFiles: draftFor(e)!.keyframes.map((k) => ({ name: k.name, at: k.at, file: `public${k.src}` })) }, null, 1));

  /* the rubric, once per entry */
  const rubricPath = path.join(dir, "rubric.json");
  if (!existsSync(rubricPath)) { const r = bun("scripts/rubric.ts", [e.slug, "--model", RUBRIC_MODEL]); process.stdout.write(r.stdout); if (r.status !== 0) console.error(r.stderr.slice(-800)); }
  const rubric: Rubric | null = existsSync(rubricPath) ? (JSON.parse(readFileSync(rubricPath, "utf8")) as Rubric) : null;
  const licensed = isLicensed(dir);
  const base = prompt(e, dir, rubric, licensed);
  writeFileSync(path.join(dir, "PROMPT.md"), base);
  if (DRY) { console.log(`${e.slug}: brief, rubric and prompt written`); continue; }

  console.log(`\n${e.slug}: starting (${MODEL}, $${BUDGET} a round, up to ${ROUNDS} rounds, judge ${JUDGE_MODEL}${rubric ? `, ${rubric.criteria.length} criteria` : ", no rubric"})`);
  const t0 = Date.now();
  const roundRows: RoundRow[] = [];
  let best: { round: number; rank: number; verdict: VerdictFile } | null = null;
  let ended = "round limit";
  for (let round = 1; round <= ROUNDS; round++) {
    const existing = round === 1 && existsSync(path.join(dir, "index.html")) ? `\n\nA file already exists at ${rel}/index.html from an earlier pass. Read it and its NOTES.md first; keep what matches the clip and the checklist, fix what does not, and start over only if the structure is wrong.` : "";
    const text = (round === 1 || !best ? base : base + handoff(round, best.verdict, rel)) + existing;
    const tr = Date.now();
    const env = { ...process.env } as NodeJS.ProcessEnv;
    delete env.CLAUDECODE; /* the CLI refuses to nest otherwise */
    const run = spawnSync("claude", [
      "-p", text, "--output-format", "json", "--model", MODEL, "--max-budget-usd", BUDGET,
      "--permission-mode", "acceptEdits", "--allowedTools", "Read", "Write", "Edit", `Bash(${CHECK}:*)`, "Bash(bun scripts/probe.ts:*)",
      "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}',
    ], { cwd: ROOT, env, encoding: "utf8", maxBuffer: 1 << 28 });
    let out: Claude = {};
    const stdout = String(run.stdout ?? ""), stderr = String(run.stderr ?? "");
    try { out = JSON.parse(stdout.trim().split("\n").pop() ?? "{}"); } catch { out = { is_error: true, result: stdout.slice(-2000) }; }
    if (run.status !== 0 && !out.result) out.result = stderr.slice(-2000);
    const sessionEnded = out.terminal_reason ?? (out.is_error ? "error" : "done");
    if (!existsSync(path.join(dir, "index.html"))) { roundRows.push({ round, minutes: Number(((Date.now() - tr) / 60000).toFixed(1)), turns: out.num_turns ?? null, costUsd: out.total_cost_usd ?? 0, judgeUsd: 0, ended: sessionEnded, score: null, rank: null, allPass: false, rubric: null, motion: null, kept: false }); console.log(`  round ${round}: no file written (${sessionEnded})`); continue; }

    /* the judge, once per round */
    /* the judge, once per round; a run that dies before judging (a runtime crash under load) is retried, never scored as zero */
    const judgeOnce = () => {
      const c = bun("scripts/check-build.ts", [e.slug, "--judge", "--judge-model", JUDGE_MODEL, "--judge-votes", VOTES]);
      const vf = existsSync(path.join(dir, "verdict.json")) ? (JSON.parse(readFileSync(path.join(dir, "verdict.json"), "utf8")) as VerdictFile) : null;
      return { c, vf, ok: Boolean(vf && (!rubric || vf.judge)) };
    };
    let j = judgeOnce();
    for (let tries = 1; !j.ok && tries < 3; tries++) { console.error(`  judge did not finish (status ${j.c.status}, signal ${j.c.signal ?? "none"}): ${(j.c.stderr || "").slice(-300)}; retrying`); j = judgeOnce(); }
    const v = j.ok ? j.vf : null;
    copyFileSync(path.join(dir, "index.html"), path.join(dir, "rounds", `round-${round}.html`));
    if (v) copyFileSync(path.join(dir, "verdict.json"), path.join(dir, "rounds", `round-${round}.verdict.json`));
    if (existsSync(path.join(dir, "side.png"))) copyFileSync(path.join(dir, "side.png"), path.join(dir, "rounds", `round-${round}.side.png`));
    const kept = Boolean(v) && (!best || v!.rank >= best.rank);
    const tok = Object.values(out.modelUsage ?? {}).reduce((s2, m) => ({ written: s2.written + m.outputTokens, read: s2.read + m.inputTokens + m.cacheReadInputTokens + m.cacheCreationInputTokens }), { written: 0, read: 0 });
    const row: RoundRow = { round, minutes: Number(((Date.now() - tr) / 60000).toFixed(1)), turns: out.num_turns ?? null, costUsd: out.total_cost_usd ?? 0, tokens: tok, judgeUsd: v?.judge?.costUsd ?? 0, ended: sessionEnded, score: v?.pixel.score ?? null, rank: v?.rank ?? null, allPass: v?.allPass ?? false, rubric: v?.rubric ? { pass: v.rubric.pass, fail: v.rubric.fail, unsure: v.rubric.unsure, of: v.rubric.counted } : null, motion: v?.motion.read ?? null, kept };
    roundRows.push(row);
    console.log(`  round ${round}: ${v ? `rubric ${row.rubric?.pass}/${row.rubric?.of}${row.rubric?.fail ? ` (${row.rubric.fail} fail)` : ""}, pixel ${row.score}, rank ${row.rank}, ${v.motion.read}` : "no verdict"}; ${row.minutes} min, $${row.costUsd.toFixed(2)} + judge $${row.judgeUsd.toFixed(2)}, ${sessionEnded}${kept ? "" : ` (below round ${best!.round}, restored)`}`);
    if (kept && v) best = { round, rank: v.rank, verdict: v };
    else if (best) copyFileSync(path.join(dir, "rounds", `round-${best.round}.html`), path.join(dir, "index.html"));
    if (v?.allPass) { ended = "all criteria pass"; break; }
    if (sessionEnded === "budget_exhausted" && round === ROUNDS) ended = "budget";
  }
  /* leave the folder describing the best file: its verdict, its renders and its side-by-side */
  if (best && roundRows[roundRows.length - 1]?.round !== best.round) {
    for (const f of ["html", "verdict.json", "side.png"]) {
      const src = path.join(dir, "rounds", `round-${best.round}.${f}`);
      if (existsSync(src)) copyFileSync(src, path.join(dir, f === "html" ? "index.html" : f));
    }
  }
  const minutes = Number(((Date.now() - t0) / 60000).toFixed(1));
  const codingUsd = roundRows.reduce((s, r) => s + r.costUsd, 0), judgeUsd = roundRows.reduce((s, r) => s + r.judgeUsd, 0), rubricUsd = rubric?.costUsd ?? 0;
  const v = best?.verdict ?? null;
  const bucket = v?.allPass ? "pass" : v && v.rank >= 70 ? "review" : "human";
  const result = {
    slug: e.slug, title: e.title, author: e.authorName, model: MODEL, judgeModel: JUDGE_MODEL,
    bucket, ended, bestRound: best?.round ?? null, rank: v?.rank ?? null, allPass: v?.allPass ?? false,
    rubric: v?.rubric ? { pass: v.rubric.pass, fail: v.rubric.fail, unsure: v.rubric.unsure, of: v.rubric.counted, failed: v.rubric.criteria.filter((c) => c.pass === "no" && !c.policy).map((c) => `${c.id} ${c.check}`) } : null,
    score: v?.pixel.score ?? null, motion: v?.motion.read ?? null,
    imagery: (rubric?.imagery ?? []).map((m) => ({ name: m.name, class: m.class, box: m.box, reproduced: m.class !== "photo" || licensed, how: m.class === "photo" ? (licensed ? "sampled under licence" : "placeholder: designer declined sampling") : m.class === "structured" ? "original SVG" : "drawn" })),
    rounds: roundRows, minutes, tokens: roundRows.reduce((t, r) => ({ written: t.written + (r.tokens?.written ?? 0), read: t.read + (r.tokens?.read ?? 0) }), { written: 0, read: 0 }),
    cost: { codingUsd: Number(codingUsd.toFixed(2)), judgeUsd: Number(judgeUsd.toFixed(2)), rubricUsd, totalUsd: Number((codingUsd + judgeUsd + rubricUsd).toFixed(2)) },
    notes: existsSync(path.join(dir, "NOTES.md")), at: new Date().toISOString(),
  };
  writeFileSync(path.join(dir, "result.json"), JSON.stringify(result, null, 1));
  const line = `${e.slug}: ${bucket}${v?.rubric ? `, rubric ${v.rubric.pass}/${v.rubric.counted}` : ""}, pixel ${result.score ?? "-"}, best round ${best?.round ?? "-"} of ${roundRows.length}, ${minutes} min, $${result.cost.totalUsd} (coding $${result.cost.codingUsd}, judge $${result.cost.judgeUsd}, rubric $${rubricUsd}), ${ended}`;
  rows.push(line);
  console.log(line);

  if (PR && v) {
    const branch = `rebuild/${e.slug}`;
    const git = (...a: string[]) => spawnSync("git", a, { cwd: ROOT, encoding: "utf8" });
    git("checkout", "-q", "-B", branch, "main");
    git("add", `factory/${e.slug}`);
    git("commit", "-q", "-m", `Rebuild: ${e.title} (factory, rubric ${v.rubric?.pass ?? 0}/${v.rubric?.counted ?? 0})\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`);
    git("push", "-q", "-u", "origin", branch);
    const body = [
      `Factory rebuild of **${e.title}** by ${e.authorName}${e.sourceUrl ? ` (${e.sourceUrl})` : ""}.`, "",
      `Rubric ${v.rubric?.pass ?? 0} of ${v.rubric?.counted ?? 0} pass, pixel ${v.pixel.score}, ${v.motion.read}; best of ${roundRows.length} rounds, ${minutes} min, $${result.cost.totalUsd}.`, "",
      result.imagery.some((m) => !m.reproduced) ? `Not reproduced (photo-class, no licence): ${result.imagery.filter((m) => !m.reproduced).map((m) => m.name).join(", ")}.` : "", "",
      `![side by side](https://github.com/SkidGod4444/lookap/blob/${branch}/factory/${e.slug}/side.png?raw=true)`, "",
      "Designer left, rebuild right, one row per moment. Merge to keep the file under factory/; reject to drop it.", "",
      "🤖 Generated with [Claude Code](https://claude.com/claude-code)",
    ].join("\n");
    const pr = spawnSync("gh", ["pr", "create", "--title", `Rebuild: ${e.title}`, "--body", body, "--base", "main", "--head", branch], { cwd: ROOT, encoding: "utf8" });
    console.log(pr.stdout.trim() || pr.stderr.trim());
    git("checkout", "-q", "main");
  }
}
if (rows.length > 1) console.log(`\n${rows.join("\n")}`);
