/* Check a rebuild against the designer's clip, locally and for every moment at once. Renders the HTML at the clip's
   frame size in headless Chrome, seeks every animation on the page to each moment, screenshots, and compares with
   the clip. Writes, next to the HTML: check.json, verdict.json, <moment>.png (the render at each moment), side.png
   (designer on the left, the render on the right, one row per moment) and, with --judge, judge/<id>.png per criterion.

     bun --conditions=react-server scripts/check-build.ts <slug> [--html factory/<slug>/index.html] [--at 0.5,2.8]
                                                             [--quick] [--judge] [--judge-model sonnet] [--judge-budget 1.5] [--judge-votes 3]

   Four readings, because a pixel score cannot see what a person sees:
   1. Pixels: a detail-weighted mean difference per moment (the score). A floor, not the goal: it cannot tell a drawn
      ring from a glass lens or a nine-spoke spinner from a disc. Keep it as a regression guard.
   2. Elements: for every element in the rubric (or the draft's boxes), the colour gap in Lab (deltaE) and how far the
      thing sits from where it should (shift), at the rest moment.
   3. Motion: between consecutive moments, does the render change where the clip changes (a page that stays still
      while the clip moves fails here), and for each measured moving part, does its offset to the clip stay near zero
      across the moments (in step), stay constant (offset) or grow (wrong speed).
   4. The rubric (--judge): the entry's checklist from scripts/rubric.ts, each criterion judged by a vision model on
      a crop of the clip beside the same crop of the render at the named moment (two moments for motion). A rebuild
      is done when every criterion passes and nothing is static, not when a number is reached. The judge is a
      separate model call and is billed outside the coding session; its cost is written into verdict.json and
      costs.jsonl. Run it from the orchestrator once per round, not on every check.

   Moments: the keyframes, the middle of every measured phase (from the clip on disk), the rubric's moments and
   --at moments of your own; --quick scores only the keyframes and the --at moments. Seeking works for CSS
   animations, transitions and Web Animations started at load; JS timers cannot be seeked. */
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { bySlug } from "../src/lib/data";
import { recipeFor } from "../src/lib/registry";
import { clipId, draftFor } from "../src/lib/drafts";
import { bestShift, changedArea as changed, compareBuild, contentBox, deltaE76, mean, motionRead as readMotion, raw } from "../src/lib/compare";
import { JUDGE_INSTRUCTION, JUDGE_SCHEMA, judgeBox, judgeScale, judgeTile } from "../src/lib/judge";
import { openPage, sleep } from "./chrome";
import type { Rubric, Criterion } from "./rubric";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
if (!slug) { console.error("usage: bun --conditions=react-server scripts/check-build.ts <slug> [--html path] [--at t1,t2] [--quick] [--judge]"); process.exit(2); }
const flag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const html = path.resolve(ROOT, flag("--html") ?? `factory/${slug}/index.html`);
const out = path.dirname(html);
const QUICK = args.includes("--quick"), JUDGE = args.includes("--judge");
const JUDGE_MODEL = flag("--judge-model") ?? "sonnet", JUDGE_BUDGET = flag("--judge-budget") ?? "1.5";
const VOTES = Math.max(1, Math.min(5, Number(flag("--judge-votes") ?? 1))); /* judge calls per criterion; a criterion fails on a majority of no, passes on a majority of yes */
if (!existsSync(html)) { console.error(`no file at ${html}`); process.exit(2); }
for (const f of readdirSync(out)) if (/^(kf\d+|[\d.]+s)\.png$/.test(f)) rmSync(path.join(out, f)); /* no stale renders from an earlier run */

const e = bySlug(slug);
if (!e) { console.error(`no entry ${slug}`); process.exit(2); }
const recipe = recipeFor(e), draft = recipe ? undefined : draftFor(e);
if (!recipe && !draft) { console.error(`no measurement for ${slug}`); process.exit(2); }
const frame: { w: number; h: number; crop?: [number, number, number, number] } = recipe?.frame ?? draft!.frame;
const frames = recipe?.keyframes ?? draft!.keyframes;
const elements = recipe?.elements ?? draft!.elements.map((d, i) => ({ name: `draft ${i + 1} ${d.fill}`, box: d.box, fill: d.fill }));
const W = frame.crop ? frame.crop[2] : frame.w, H = frame.crop ? frame.crop[3] : frame.h;
type Box = [number, number, number, number];
const rubricPath = path.join(ROOT, "factory", slug, "rubric.json");
const rubric: Rubric | null = existsSync(rubricPath) ? (JSON.parse(readFileSync(rubricPath, "utf8")) as Rubric) : null;
const licensed = existsSync(path.join(ROOT, "factory", slug, "licence.json")) && Boolean((JSON.parse(readFileSync(path.join(ROOT, "factory", slug, "licence.json"), "utf8")) as { sampling?: boolean }).sampling);
if (JUDGE && !rubric) console.error(`no rubric at ${path.relative(ROOT, rubricPath)}: run scripts/rubric.ts ${slug} first; judging skipped`);

/* the moments to score: the keyframes, then mid-phase, rubric and --at moments pulled from the clip when it is here */
type Moment = { name: string; at: number; src: string; still: boolean };
const moments: Moment[] = frames.map((k) => ({ name: k.name, at: k.at, src: path.join(ROOT, "public", k.src.replace(/^\//, "")), still: true }));
const clip = (() => { const id = clipId(e); const p = id ? path.join(ROOT, "measure", id, "source.mp4") : ""; return p && existsSync(p) ? p : null; })();
const extra = (flag("--at") ?? "").split(",").map(Number).filter((n) => Number.isFinite(n) && n >= 0);
const mids = draft && !QUICK ? draft.phases.filter(([a, b]) => b - a >= 0.1).map(([a, b]) => Number(((a + b) / 2).toFixed(2))) : [];
const rubricTimes = rubric && (!QUICK || JUDGE) ? rubric.criteria.flatMap((c) => [c.at, ...(c.then == null ? [] : [c.then])]).map((t) => Number(t.toFixed(2))).filter((t, i, arr) => arr.indexOf(t) === i) : [];
const CAP = JUDGE ? 48 : 24;
if (clip) {
  mkdirSync(path.join(out, ".ref"), { recursive: true });
  /* the stored keyframes are 720 px copies for the site; with the clip here, every reference is a full frame of it */
  for (const m of moments) {
    const src = path.join(out, ".ref", `${m.at}.png`);
    if (!existsSync(src)) spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", String(m.at), "-i", clip, "-frames:v", "1", src]);
    if (existsSync(src)) m.src = src;
  }
  const wanted = [...extra, ...rubricTimes, ...mids].map((t) => Number(t.toFixed(2))).filter((t, i, arr) => arr.indexOf(t) === i && !moments.some((m) => Math.abs(m.at - t) < 0.15)).slice(0, CAP).sort((a, b) => a - b);
  if ([...extra, ...rubricTimes, ...mids].filter((t, i, arr) => arr.indexOf(t) === i).length > CAP) console.error(`more moments asked for than the cap of ${CAP}; the rubric's later moments may be judged at the nearest rendered one`);
  for (const t of wanted) {
    const src = path.join(out, ".ref", `${t}.png`);
    if (!existsSync(src)) spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", String(t), "-i", clip, "-frames:v", "1", src]);
    if (existsSync(src)) moments.push({ name: `${t}s`, at: t, src, still: false });
  }
  moments.sort((a, b) => a.at - b.at);
} else if (extra.length || rubricTimes.length) console.error(`no clip at measure/<id>/source.mp4, so only the keyframes have a reference`);
const momentAt = (t: number) => moments.reduce((best, m) => (Math.abs(m.at - t) < Math.abs(best.at - t) ? m : best), moments[0]);

/* headless Chrome, one page. ?demo=1 asks an interactive page to replay the clip's sequence on its timeline; a page
   without interaction ignores it */
const page = await openPage(`file://${html}?demo=1`, W, H);
const { ev } = page;
const animations = Number(await ev("document.getAnimations().length"));

type Row = { keyframe: string; at: number; still: boolean; score: number; overall: number; elements: unknown[]; regions: unknown[] };
const rows: Row[] = [];
const panels: Buffer[] = [];
const SCALE = Math.min(1, 760 / W);
const pw = Math.round(W * SCALE), ph = Math.round(H * SCALE);
/* reading 2: the elements, at the rest moment (the first keyframe) */
const restBoxes: { name: string; box: Box }[] = rubric ? rubric.elements.filter((el) => el.kind !== "motion").map((el) => ({ name: el.name, box: el.box })) : elements.map((el) => ({ name: el.name, box: el.box as Box }));
type ElementRow = { name: string; box: Box; deltaE: number; delta: number; shift: [number, number] | null; afterShift: number; read: string };
let elementRows: ElementRow[] = [];
/* reading 3: motion. change between consecutive moments on both sides, and each measured moving part's offset per moment */
type Change = { from: string; to: string; clip: number; render: number; read: string };
const changes: Change[] = [];
const tracked = (draft?.motion ?? []).map((m) => ({ element: m.element, box: m.box as Box, shifts: [] as { at: number; dx: number; dy: number; delta: number }[] }));
let prev: { name: string; ref: Buffer; sub: Buffer } | null = null;
const changedArea = (a: Buffer, b: Buffer) => changed(a, b, W, H);
for (const kf of moments) {
  /* everything on the page jumps to this moment; the page itself is not reloaded, so fonts and layout are settled */
  await ev(`document.getAnimations().forEach((a) => { try { a.pause(); a.currentTime = ${Math.round(kf.at * 1000)}; } catch {} }); true`);
  await sleep(150);
  const shot = await page.shot();
  const mine = path.join(out, `${kf.name}.png`);
  writeFileSync(mine, shot);
  const ref = kf.src;
  const r = await compareBuild(ref, shot, frame, elements, kf === moments[0]);
  rows.push({ keyframe: kf.name, at: kf.at, still: kf.still, score: r.score, overall: r.overall, elements: r.elements.slice(0, 3), regions: r.regions.slice(0, 3) });
  const [rawRef, rawSub] = await Promise.all([raw(ref, W, H, frame.crop), raw(shot, W, H)]);
  if (kf === moments[0]) {
    elementRows = restBoxes.map(({ name, box }) => {
      const a = mean(rawRef, W, box), b = mean(rawSub, W, box);
      const dE = Math.round(deltaE76(a, b) * 10) / 10;
      const best = bestShift(rawRef, rawSub, W, H, box);
      const delta = Math.round(best.base), afterShift = Math.round(best.delta);
      const moved = best.dx || best.dy;
      const read = delta <= 12 ? "matches" : dE > 8 && afterShift > delta * 0.7 ? `wrong colour (deltaE ${dE})` : moved && afterShift < delta * 0.55 ? `misplaced by ${Math.abs(best.dx)} x ${Math.abs(best.dy)} px` : "different drawing: size, shape or texture";
      return { name, box, deltaE: dE, delta, shift: moved ? ([best.dx, best.dy] as [number, number]) : null, afterShift, read };
    }).sort((p, q) => q.delta - p.delta);
  }
  for (const t of tracked) { const b = bestShift(rawRef, rawSub, W, H, t.box, 12); t.shifts.push({ at: kf.at, dx: b.dx, dy: b.dy, delta: Math.round(b.delta) }); }
  if (prev) {
    /* the share of the frame that changed, in percent: a pixel counts when its colour moved by more than codec noise */
    const c = changedArea(prev.ref, rawRef), s = changedArea(prev.sub, rawSub);
    changes.push({ from: prev.name, to: kf.name, clip: c, render: s, read: readMotion(c, s) });
  }
  prev = { name: kf.name, ref: rawRef, sub: rawSub };
  let refImg = sharp(ref);
  if (frame.crop) refImg = refImg.extract({ left: frame.crop[0], top: frame.crop[1], width: frame.crop[2], height: frame.crop[3] });
  const left = await refImg.resize(pw, ph, { fit: "fill" }).png().toBuffer();
  const right = await sharp(shot).resize(pw, ph, { fit: "fill" }).png().toBuffer();
  panels.push(await sharp({ create: { width: pw * 2 + 8, height: ph, channels: 3, background: "#ff3b30" } }).composite([{ input: left, left: 0, top: 0 }, { input: right, left: pw + 8, top: 0 }]).png().toBuffer());
}
page.close();
prev = null;

/* side.png: rows of designer | yours, red gutter between and below so the rows read apart */
const side = sharp({ create: { width: pw * 2 + 8, height: (ph + 8) * panels.length - 8, channels: 3, background: "#ff3b30" } })
  .composite(panels.map((p, i) => ({ input: p, left: 0, top: i * (ph + 8) })));
await side.png().toFile(path.join(out, "side.png"));

/* stills and motion moments weigh the same per moment; the motion ones are what a keyframe-only check would miss */
const score = Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length);
const stills = rows.filter((r) => r.still), moving = rows.filter((r) => !r.still);
const avg = (xs: Row[]) => (xs.length ? Math.round(xs.reduce((s, r) => s + r.score, 0) / xs.length) : null);
const prevRuns = existsSync(path.join(out, "check.json")) ? (JSON.parse(readFileSync(path.join(out, "check.json"), "utf8")) as { runs?: number }).runs ?? 0 : 0;

/* motion read-outs */
const staticFlags = changes.filter((c) => c.read === "render still where the clip moves");
const clipMoves = changes.some((c) => c.clip > 0.3), renderMoves = changes.some((c) => c.render > 0.3);
const motionRead = !clipMoves ? "the clip does not move between the scored moments" : !renderMoves ? "STATIC: the clip moves between the scored moments and the render does not" : staticFlags.length ? `the render stays still in ${staticFlags.length} of ${changes.length} spans where the clip moves` : "the render changes where the clip changes";
const trajectories = tracked.map((t) => {
  const mags = t.shifts.map((s) => Math.hypot(s.dx, s.dy));
  const mx = Math.max(...mags), first = mags[0] ?? 0, last = mags[mags.length - 1] ?? 0;
  const read = mx <= 3 ? "in step" : Math.max(...mags) - Math.min(...mags) <= 3 ? `offset by about ${Math.round(mags.reduce((a, b) => a + b, 0) / mags.length)} px throughout` : last > first + 4 ? "drifts: the gap grows over time (wrong speed or start)" : "varies: the gap changes between moments (wrong timing)";
  return { element: t.element, box: t.box, shifts: t.shifts, read };
});

/* reading 4: the rubric, judged by a vision model on crop pairs */
type Verdict = { id: string; pass: "yes" | "no" | "unsure"; seen: string };
const verdicts: Verdict[] = [];
let judge: { model: string; costUsd: number; calls: number; images: string; votes: number; spread: number[] } | null = null;
const photoNames = new Set((rubric?.imagery ?? []).filter((m) => m.class === "photo").map((m) => m.name.toLowerCase()));
const byPolicy = (c: Criterion) => !licensed && c.axis !== "imagery" && c.axis !== "position" && c.axis !== "motion" && photoNames.has(c.element.toLowerCase());
if (JUDGE && rubric) {
  const jdir = path.join(out, "judge");
  rmSync(jdir, { recursive: true, force: true });
  mkdirSync(jdir, { recursive: true });
  /* the clip's frame at a moment (full size when the clip is on disk, cropped to the recipe's region) and the render */
  const refCache = new Map<string, Buffer>();
  const clipAt = async (t: number) => { const m = momentAt(t); let f = refCache.get(m.name); if (!f) { f = frame.crop ? await sharp(m.src).extract({ left: frame.crop[0], top: frame.crop[1], width: frame.crop[2], height: frame.crop[3] }).png().toBuffer() : readFileSync(m.src); refCache.set(m.name, f); } const meta = await sharp(f).metadata(); return { frame: f, k: (meta.width ?? W) / W }; };
  const renderAt = async (t: number) => readFileSync(path.join(out, `${momentAt(t).name}.png`));
  const frameBox = (() => { const b = draft?.background ?? "#ffffff"; return contentBox((refCache.size, readFileSync(moments[0].src)), b); })();
  const listed: string[] = [];
  const lines: string[] = [];
  const snapped: string[] = []; /* criteria whose moment was not rendered: not judged, reported as unsure */
  const fb = await frameBox;
  for (const c of rubric.criteria) {
    const a = momentAt(c.at), b = c.then == null ? null : momentAt(c.then);
    if (Math.abs(a.at - c.at) > 0.2 || (b && Math.abs(b.at - c.then!) > 0.2) || (b && a === b)) { snapped.push(c.id); continue; }
    const file = path.join(jdir, `${c.id}.png`);
    await sharp(await judgeTile(c, W, H, clipAt, renderAt, 560, fb)).png().toFile(file);
    listed.push(file);
    const box = judgeBox(c, fb), S = judgeScale(c, box, 560);
    lines.push(`${c.id} [${c.axis}, ${c.element}${byPolicy(c) ? ", photo-class region: judge it as written anyway" : ""}] ${c.check}\n    image: ${file} (${b ? `top row the clip at ${a.at}s and the rebuild at the same moment, bottom row both at ${b.at}s` : `left the clip at ${a.at}s, right the rebuild at the same moment`}${c.scope === "frame" ? `, the design's box [${box.join(",")}] of the frame` : `, crop of frame box [${box.join(",")}] at ${S}x`})`);
  }
  const SCHEMA = JUDGE_SCHEMA;
  const CHUNK = 20;
  let cost = 0, calls = 0;
  const votes: Verdict[][] = [];
  for (let v = 0; v < VOTES; v++) {
    const got: Verdict[] = [];
    for (let i = 0; i < lines.length; i += CHUNK) {
      const chunk = lines.slice(i, i + CHUNK);
      const prompt = `${JUDGE_INSTRUCTION}\n\nFrame ${W} x ${H} px. Criteria:\n${chunk.join("\n")}`;
      const env = { ...process.env } as NodeJS.ProcessEnv; delete env.CLAUDECODE;
      const run = spawnSync("claude", ["-p", prompt, "--output-format", "json", "--model", JUDGE_MODEL, "--max-budget-usd", JUDGE_BUDGET, "--allowedTools", "Read", "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}', "--json-schema", JSON.stringify(SCHEMA)], { cwd: ROOT, env, encoding: "utf8", maxBuffer: 1 << 26 });
      let o: { structured_output?: { verdicts: Verdict[] }; total_cost_usd?: number; result?: string } = {};
      try { o = JSON.parse(String(run.stdout).trim().split("\n").pop() ?? "{}"); } catch { /* below */ }
      calls++; cost += o.total_cost_usd ?? 0;
      if (!o.structured_output) { console.error(`judge call ${calls} failed: ${(o.result ?? String(run.stderr)).slice(-600)}`); continue; }
      got.push(...o.structured_output.verdicts);
    }
    votes.push(got);
  }
  /* the vote: a criterion passes on a majority of yes, fails on a majority of no, else unsure; the reasons kept are the majority's */
  for (const c of rubric.criteria) {
    const vs = votes.map((g) => g.find((x) => x.id === c.id)).filter((x): x is Verdict => Boolean(x));
    if (!vs.length) continue;
    const n = (p: Verdict["pass"]) => vs.filter((x) => x.pass === p).length;
    const pass: Verdict["pass"] = n("yes") > vs.length / 2 ? "yes" : n("no") > vs.length / 2 ? "no" : "unsure";
    const seen = (vs.find((x) => x.pass === pass) ?? vs[0]).seen + (VOTES > 1 ? ` [votes: ${vs.map((x) => x.pass).join("/")}]` : "");
    verdicts.push({ id: c.id, pass, seen });
  }
  for (const id of snapped) verdicts.push({ id, pass: "unsure", seen: "its moment was not rendered (too many moments asked for); run with --at to add it" });
  judge = { model: JUDGE_MODEL, costUsd: Math.round(cost * 1000) / 1000, calls, images: path.relative(ROOT, jdir), votes: VOTES, spread: votes.map((g) => g.filter((x) => x.pass === "yes").length) };
  appendFileSync(path.join(out, "costs.jsonl"), JSON.stringify({ what: "judge", model: JUDGE_MODEL, calls, costUsd: judge.costUsd, criteria: rubric.criteria.length, at: new Date().toISOString() }) + "\n");
}

/* the verdict: a rebuild is done when every criterion that counts passes and the render moves where the clip moves */
const judged = rubric ? rubric.criteria.map((c) => ({ ...c, policy: byPolicy(c) ? "photo" as const : null, verdict: verdicts.find((v) => v.id === c.id) ?? null })) : [];
const counted = judged.filter((c) => !c.policy);
const passed = counted.filter((c) => c.verdict?.pass === "yes"), failed = counted.filter((c) => c.verdict?.pass === "no"), unsure = counted.filter((c) => c.verdict && c.verdict.pass === "unsure"), unjudged = counted.filter((c) => !c.verdict);
const policyRows = judged.filter((c) => c.policy);
const passRate = counted.length && judge ? passed.length / counted.length : null;
const allPass = Boolean(judge) && failed.length === 0 && unjudged.length === 0 && staticFlags.length === 0 && (clipMoves ? renderMoves : true);
/* rank: for picking the best round, never for stopping */
const rank = Math.round((passRate ?? 0) * 70 + (score / 100) * 20 + (staticFlags.length === 0 && (!clipMoves || renderMoves) ? 10 : 0));
const result = { slug, measured: recipe ? "recipe" : "draft", frame: { w: W, h: H }, animations, score, stills: avg(stills), motion: avg(moving), keyframes: rows, runs: prevRuns + 1, at: new Date().toISOString(), rank, allPass, rubric: judge ? { pass: passed.length, fail: failed.length, unsure: unsure.length, of: counted.length } : null };
writeFileSync(path.join(out, "check.json"), JSON.stringify(result, null, 1));
const verdict = {
  slug, at: result.at, runs: result.runs, html: path.relative(ROOT, html), pixel: { score, stills: avg(stills), motion: avg(moving), moments: rows.length }, animations, rank, allPass,
  elements: elementRows, motion: { read: motionRead, changes, trajectories },
  rubric: rubric ? { file: path.relative(ROOT, rubricPath), total: rubric.criteria.length, counted: counted.length, pass: passed.length, fail: failed.length, unsure: unsure.length, unjudged: unjudged.length, passRate: passRate == null ? null : Math.round(passRate * 100), licensed, criteria: judged.map((c) => ({ id: c.id, axis: c.axis, element: c.element, check: c.check, box: c.box, at: c.at, then: c.then, policy: c.policy, pass: c.verdict?.pass ?? null, seen: c.verdict?.seen ?? null, image: judge ? path.relative(ROOT, path.join(out, "judge", `${c.id}.png`)) : null })) } : null,
  judge,
};
writeFileSync(path.join(out, "verdict.json"), JSON.stringify(verdict, null, 1));

/* the summary the agent reads: what fails first, then the numbers */
const zoom = (c: { box: Box; at: number }) => `bun scripts/probe.ts ${slug} --zoom ${c.box.join(",")} --t ${c.at}`;
if (judge) {
  console.log(`verdict: ${allPass ? "PASS" : "not yet"}. rubric ${passed.length}/${counted.length} pass, ${failed.length} fail, ${unsure.length} unsure${unjudged.length ? `, ${unjudged.length} not judged` : ""}${policyRows.length ? ` (+${policyRows.length} on photo-class imagery, by policy, not counted)` : ""}; pixel ${score}; motion: ${motionRead}; judge ${judge.model} $${judge.costUsd} in ${judge.calls} call${judge.calls === 1 ? "" : "s"}${judge.votes > 1 ? `, ${judge.votes} votes, yes-counts per vote ${judge.spread.join("/")}` : ""} (run ${result.runs})`);
  for (const c of failed) console.log(`  FAIL ${c.id} [${c.axis}] ${c.element}: ${c.check}\n       seen: ${c.verdict!.seen}\n       ${verdict.rubric!.criteria.find((x) => x.id === c.id)!.image}  |  ${zoom(c)}`);
  for (const c of unsure) console.log(`  ?    ${c.id} [${c.axis}] ${c.element}: ${c.check}\n       seen: ${c.verdict!.seen}  |  ${zoom(c)}`);
  for (const c of policyRows) console.log(`  photo-class, by policy${licensed ? " (licensed: counts as judged)" : " (no licence.json: a placeholder of the box and palette is the rule)"}: ${c.id} ${c.verdict?.pass ?? "-"}: ${c.check}`);
} else {
  console.log(`score ${score} over ${rows.length} moments: ${stills.length} stills ${avg(stills)}${moving.length ? `, ${moving.length} mid-motion ${avg(moving)}` : " (no clip on disk, so no mid-motion moments)"} (run ${result.runs}); ${animations} animation${animations === 1 ? "" : "s"} on the page${animations ? "" : ": nothing to seek, every moment shows the load state"}; motion: ${motionRead}${rubric ? `; rubric: ${rubric.criteria.length} criteria in ${path.relative(ROOT, rubricPath)} (the orchestrator judges them with --judge; read them and check each by eye)` : ""}`);
}
console.log(`\nelements at rest (${rubric ? "rubric boxes" : "draft boxes"}), worst first:`);
for (const el of elementRows.slice(0, 8)) console.log(`  ${el.name} [${el.box.join(",")}]: ${el.read}${el.read === "matches" ? "" : `; deltaE ${el.deltaE}, difference ${el.delta}${el.shift ? `, ${el.afterShift} once moved ${el.shift[0]},${el.shift[1]}` : ""}`}`);
if (trajectories.length) { console.log(`\nmeasured moving parts across the moments:`); for (const t of trajectories) console.log(`  ${t.element} [${t.box.join(",")}]: ${t.read} (${t.shifts.map((s) => `${s.at}s ${s.dx},${s.dy}`).join("; ")})`); }
if (staticFlags.length) { console.log(`\nspans where the clip moves and the render does not:`); for (const c of staticFlags) console.log(`  ${c.from} to ${c.to}: ${c.clip}% of the clip's frame changed, ${c.render}% of the render's`); }
console.log(`\nper moment:`);
for (const r of rows) {
  const worst = (r.regions as { box: number[]; delta: number; cell: string }[])[0];
  console.log(`  ${r.keyframe} at ${r.at}s${r.still ? "" : " (mid-motion)"}: score ${r.score}${worst ? `, worst region ${worst.cell} delta ${worst.delta}: bun scripts/probe.ts ${slug} --zoom ${worst.box.join(",")} --t ${r.at}` : ""}`);
}
console.log(`\nside by side: ${path.relative(ROOT, path.join(out, "side.png"))} (designer left, yours right, one row per moment, in time order); verdict.json has every number. ${recipe ? "Element boxes are measured." : rubric ? "Element boxes are from the rubric." : "Element boxes are a draft: trust the regions and the picture over them."}`);
