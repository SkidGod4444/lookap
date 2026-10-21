/* Check a rebuild against the designer's keyframes, the way check_rebuild does over MCP, but locally and for every
   keyframe at once. Renders the HTML at the clip's frame size in headless Chrome, seeks every animation on the page to
   each keyframe's time, screenshots, and diffs against the keyframe (draft or recipe). Writes, next to the HTML:
   check.json (scores and the largest differences), kfN.png (the render at each keyframe) and side.png (designer on
   the left, the render on the right, one row per keyframe). Prints the summary an agent reads.

     bun --conditions=react-server scripts/check-build.ts <slug> [--html factory/<slug>/index.html] [--at 0.5,2.8] [--quick]

   Stills are not enough: a keyframe is a moment when nothing moves, so a rebuild can match every keyframe and still
   get the motion wrong. When the source clip is on disk (measure/<id>/source.mp4) the checker also scores the middle
   of every measured phase, where things are mid-flight, pulling those reference frames from the clip with ffmpeg;
   --at adds moments of your own; --quick scores only the keyframes and the --at moments, for a fast loop on one spot.
   Seeking works for CSS animations, transitions and Web Animations started at load; JS timers cannot be seeked, which
   is why the factory prompt forbids them for the timeline. Renders from an earlier run are deleted first, so every
   <moment>.png in the folder is from this run.

   The score is a floor, not the goal: it is a mean pixel difference per moment, so a grid of buttons that is one
   pixel off scores worse than a missing shadow. When a box's mean colour matches but its difference is large, the
   texture differs: zoom there (probe --zoom) and look. */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { bySlug } from "../src/lib/data";
import { recipeFor } from "../src/lib/registry";
import { clipId, draftFor } from "../src/lib/drafts";
import { compareBuild } from "../src/lib/compare";
import { openPage, sleep } from "./chrome";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
if (!slug) { console.error("usage: bun --conditions=react-server scripts/check-build.ts <slug> [--html path]"); process.exit(2); }
const flag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const html = path.resolve(ROOT, flag("--html") ?? `factory/${slug}/index.html`);
const out = path.dirname(html);
const QUICK = args.includes("--quick");
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

/* the moments to score: the keyframes, then mid-phase moments and --at moments pulled from the clip when it is here */
type Moment = { name: string; at: number; src: string; still: boolean };
const moments: Moment[] = frames.map((k) => ({ name: k.name, at: k.at, src: path.join(ROOT, "public", k.src.replace(/^\//, "")), still: true }));
const clip = (() => { const id = clipId(e); const p = id ? path.join(ROOT, "measure", id, "source.mp4") : ""; return p && existsSync(p) ? p : null; })();
const extra = (flag("--at") ?? "").split(",").map(Number).filter((n) => Number.isFinite(n) && n >= 0);
const mids = draft && !QUICK ? draft.phases.filter(([a, b]) => b - a >= 0.1).map(([a, b]) => Number(((a + b) / 2).toFixed(2))) : [];
if (clip) {
  mkdirSync(path.join(out, ".ref"), { recursive: true });
  for (const t of [...extra, ...mids].filter((t, i, arr) => arr.indexOf(t) === i && !moments.some((m) => Math.abs(m.at - t) < 0.15)).slice(0, 16).sort((a, b) => a - b)) {
    const src = path.join(out, ".ref", `${t}.png`);
    if (!existsSync(src)) spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", String(t), "-i", clip, "-frames:v", "1", src]);
    if (existsSync(src)) moments.push({ name: `${t}s`, at: t, src, still: false });
  }
  moments.sort((a, b) => a.at - b.at);
} else if (extra.length) console.error(`no clip at measure/<id>/source.mp4, so --at moments have no reference; keyframes only`);

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
  let refImg = sharp(ref);
  if (frame.crop) refImg = refImg.extract({ left: frame.crop[0], top: frame.crop[1], width: frame.crop[2], height: frame.crop[3] });
  const left = await refImg.resize(pw, ph, { fit: "fill" }).png().toBuffer();
  const right = await sharp(shot).resize(pw, ph, { fit: "fill" }).png().toBuffer();
  panels.push(await sharp({ create: { width: pw * 2 + 8, height: ph, channels: 3, background: "#ff3b30" } }).composite([{ input: left, left: 0, top: 0 }, { input: right, left: pw + 8, top: 0 }]).png().toBuffer());
}
page.close();

/* side.png: rows of designer | yours, red gutter between and below so the rows read apart */
const side = sharp({ create: { width: pw * 2 + 8, height: (ph + 8) * panels.length - 8, channels: 3, background: "#ff3b30" } })
  .composite(panels.map((p, i) => ({ input: p, left: 0, top: i * (ph + 8) })));
await side.png().toFile(path.join(out, "side.png"));

/* stills and motion moments weigh the same per moment; the motion ones are what a keyframe-only check would miss */
const score = Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length);
const stills = rows.filter((r) => r.still), moving = rows.filter((r) => !r.still);
const avg = (xs: Row[]) => (xs.length ? Math.round(xs.reduce((s, r) => s + r.score, 0) / xs.length) : null);
const prev = existsSync(path.join(out, "check.json")) ? (JSON.parse(readFileSync(path.join(out, "check.json"), "utf8")) as { runs?: number }).runs ?? 0 : 0;
const result = { slug, measured: recipe ? "recipe" : "draft", frame: { w: W, h: H }, animations, score, stills: avg(stills), motion: avg(moving), keyframes: rows, runs: prev + 1, at: new Date().toISOString() };
writeFileSync(path.join(out, "check.json"), JSON.stringify(result, null, 1));

/* the summary the agent reads */
console.log(`score ${score} over ${rows.length} moments: ${stills.length} stills ${avg(stills)}${moving.length ? `, ${moving.length} mid-motion ${avg(moving)}` : " (no clip on disk, so no mid-motion moments)"} (run ${result.runs}); ${animations} animation${animations === 1 ? "" : "s"} on the page${animations ? "" : ": nothing to seek, every moment shows the load state"}`);
for (const r of rows) {
  console.log(`\n${r.keyframe} at ${r.at}s${r.still ? "" : " (mid-motion)"}: score ${r.score}, mean difference ${r.overall}`);
  const near = (a: string, b: string) => { const v = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const [x, y] = [v(a), v(b)]; return x.every((c, i) => Math.abs(c - y[i]) < 14); };
  for (const el of r.elements as { name: string; box: number[]; reference: string; yours: string; delta: number }[]) console.log(`  box ${el.name} [${el.box.join(",")}] reference ${el.reference} yours ${el.yours} delta ${el.delta}${near(el.reference, el.yours) && el.delta > 40 ? " (same colour, different texture or position: zoom it)" : ""}`);
  for (const c of r.regions as { cell: string; box: number[]; delta: number; over: string[] }[]) console.log(`  region ${c.cell} [${c.box.join(",")}] delta ${c.delta}${c.over.length ? ` under: ${c.over.join(", ")}` : ""}`);
  const worst = (r.regions as { box: number[] }[])[0];
  if (worst) console.log(`  look: bun scripts/probe.ts ${slug} --zoom ${worst.box.join(",")} --t ${r.at}`);
}
console.log(`\nside by side: ${path.relative(ROOT, path.join(out, "side.png"))} (designer left, yours right, one row per moment, in time order). ${recipe ? "Element boxes are measured." : "Element boxes are a draft: trust the regions and the picture over them."}`);
