/* Benchmark the measuring script against the hand-measured recipes, and stress it on a batch of catalog clips.
   bun scripts/bench-measure.ts            accuracy on the recipes that have a spec (uses measure/<id>/measure.json, running measure if missing)
   bun scripts/bench-measure.ts --stress 8 also run measure on 8 catalog clips of varied shape and report time, memory, failures */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { ENTRIES } from "../src/lib/data";
import { RECIPES, recipeFor } from "../src/lib/registry";

type Box = [number, number, number, number];
const iou = (a: Box, b: Box) => { const x = Math.max(a[0], b[0]), y = Math.max(a[1], b[1]), r = Math.min(a[0] + a[2], b[0] + b[2]), t = Math.min(a[1] + a[3], b[1] + b[3]); const i = Math.max(0, r - x) * Math.max(0, t - y); return i / (a[2] * a[3] + b[2] * b[3] - i); };
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const dist = (a: string, b: string) => { const p = rgb(a), q = rgb(b); return Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]); };
const pad = (v: unknown, n: number) => String(v).padEnd(n);

function measured(id: string) {
  const f = `measure/${id}/measure.json`;
  if (!existsSync(f)) { const r = spawnSync("bun", ["scripts/measure.ts", id], { stdio: "inherit" }); if (r.status !== 0) throw new Error(`measure failed for ${id}`); }
  return JSON.parse(readFileSync(f, "utf8"));
}

console.log("Accuracy against the hand-measured recipes\n");
for (const recipe of RECIPES) {
  const entry = ENTRIES.find((e) => recipeFor(e)?.slug === recipe.slug)!;
  const m = measured(recipe.ref);
  const kf = m.keyframes[0];
  const found = [kf.background, ...kf.elements] as { box: Box; fill?: string }[];
  /* elements: every spec box at the first keyframe (moving parts are at rest there); the fill is compared when the spec gives one flat hex */
  const flat = recipe.elements.filter((e) => !/\.(name|rows|hint|text)$/.test(e.name));
  let hit = 0; const errs: number[] = [], colour: number[] = [];
  const rows: string[] = [];
  for (const e of flat) {
    let best = { iou: 0, box: null as Box | null, fill: "" };
    for (const f of found) { const v = iou(e.box, f.box); if (v > best.iou) best = { iou: v, box: f.box, fill: f.fill ?? "" }; }
    const ok = best.iou >= 0.5; if (ok) hit++;
    const err = best.box ? Math.max(...e.box.map((v, i) => Math.abs(v - best.box![i]))) : NaN;
    if (ok) errs.push(err);
    const flatFill = e.fill && /^#[0-9a-f]{6}$/i.test(e.fill) ? e.fill : null;
    if (ok && best.fill && flatFill) colour.push(dist(flatFill, best.fill));
    rows.push(`    ${pad(e.name, 18)} iou ${best.iou.toFixed(2)}  edge err ${isNaN(err) ? "-" : err + " px"}${flatFill ? `  fill ${flatFill} vs ${best.fill || "-"}` : ""}`);
  }
  /* motion: the spec's timing rows that move a box, against the tracked moves */
  const specMoves = recipe.timing.filter((t) => /translate/.test(t.property) && !isNaN(parseFloat(t.to))).map((t) => ({ name: t.name, ms: t.ms, px: Math.abs(parseFloat(t.to) - (parseFloat(t.from) || 0)) }));
  const trackedPx = m.motion.flatMap((tr: { moves: { dTop: number; dLeft: number; ms: number }[] }) => tr.moves.map((mv) => ({ px: Math.max(Math.abs(mv.dTop), Math.abs(mv.dLeft)), ms: mv.ms })));
  const motionRows = specMoves.map((sm) => { let best = trackedPx[0]; for (const t of trackedPx) if (Math.abs(t.px - sm.px) < Math.abs((best?.px ?? 1e9) - sm.px)) best = t; return `    ${pad(sm.name, 16)} spec ${sm.px} px / ${sm.ms} ms   measured ${best ? `${best.px} px / ${best.ms} ms` : "-"}`; });
  /* phases: the recipe's prose motion rows "a-b s" against the measured moving spans */
  const specPhases = recipe.motion.map((r) => r.at.match(/([\d.]+)-([\d.]+) s/)).filter(Boolean).map((x) => [parseFloat(x![1]), parseFloat(x![2])]);
  const phases = m.phases.map((p: { moving: [number, number] }) => p.moving);
  const phaseHits = specPhases.filter(([a, b]) => phases.some(([c, d]: [number, number]) => Math.abs(c - a) <= 0.25 || Math.abs(d - b) <= 0.25 || (c >= a - 0.1 && d <= b + 0.1))).length;
  /* palette: each spec colour's nearest measured colour at any keyframe */
  const measuredColours = new Set<string>(m.keyframes.flatMap((k: { palette: { hex: string }[]; elements: { fill: string }[]; background: { fill: string } }) => [...k.palette.map((p) => p.hex), ...k.elements.map((e) => e.fill), k.background.fill]));
  const pal = Object.entries(recipe.palette).map(([k, v]) => { let b = 1e9; for (const c of measuredColours) b = Math.min(b, dist(v, c)); return [k, b] as const; });
  const palHit = pal.filter(([, d]) => d <= 30).length;

  console.log(`${recipe.title} (${entry.slug})`);
  console.log(`  elements: ${hit}/${flat.length} found at IoU ≥ 0.5; edge error median ${errs.length ? errs.sort((a, b) => a - b)[Math.floor(errs.length / 2)] : "-"} px, max ${errs.length ? Math.max(...errs) : "-"} px; fill ΔRGB median ${colour.length ? colour.sort((a, b) => a - b)[Math.floor(colour.length / 2)] : "-"}`);
  rows.forEach((r) => console.log(r));
  console.log(`  motion: ${specMoves.length} spec moves`); motionRows.forEach((r) => console.log(r));
  console.log(`  phases: ${phaseHits}/${specPhases.length} spec phases matched within 250 ms; measured ${JSON.stringify(phases)}`);
  console.log(`  palette: ${palHit}/${pal.length} spec colours within ΔRGB 30; misses ${pal.filter(([, d]) => d > 30).map(([k, d]) => `${k} (${d})`).join(", ") || "none"}`);
  console.log(`  keyframes: ${m.keyframes.length} found at ${m.keyframes.map((k: { at: number }) => k.at).join(", ")} s; spec has ${recipe.keyframes.map((k) => k.at).join(", ")} s\n`);
}

const si = process.argv.indexOf("--stress");
if (si > 0) {
  const n = +process.argv[si + 1] || 8;
  /* varied shapes: tallest, widest, longest, shortest, and a spread in between, all with a clip */
  const clips = ENTRIES.filter((e) => e.video && e.ref && !/ft7ve7j|muhvp71/.test(e.ref));
  const sorted = [...clips].sort((a, b) => a.ratio - b.ratio);
  const pick = new Set<typeof clips[number]>();
  for (let i = 0; i < n; i++) pick.add(sorted[Math.round((i / Math.max(1, n - 1)) * (sorted.length - 1))]);
  console.log(`Stress: ${pick.size} clips\n`);
  console.log(`  ${pad("id", 9)}${pad("frame", 12)}${pad("dur", 7)}${pad("time", 7)}${pad("rss MB", 8)}${pad("kf", 4)}${pad("els", 5)}${pad("moving", 8)}result`);
  for (const e of pick) {
    const id = e.video!.src.match(/videos\/([a-z0-9]+)\//)?.[1] ?? e.slug;
    const t0 = Date.now();
    const r = spawnSync("/usr/bin/time", ["-l", "bun", "scripts/measure.ts", e.slug], { encoding: "utf8", maxBuffer: 1 << 26 });
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    const rss = Math.round(parseInt(r.stderr.match(/(\d+)\s+maximum resident set size/)?.[1] ?? "0") / 1048576);
    if (r.status !== 0) { console.log(`  ${pad(id, 9)}${pad("-", 12)}${pad("-", 7)}${pad(secs, 7)}${pad(rss, 8)}FAILED ${r.stderr.split("\n").find((l) => /error/i.test(l))?.slice(0, 80)}`); continue; }
    const m = JSON.parse(readFileSync(`measure/${id}/measure.json`, "utf8"));
    console.log(`  ${pad(id, 9)}${pad(`${m.source.frame.w}x${m.source.frame.h}`, 12)}${pad(m.source.duration, 7)}${pad(secs + "s", 7)}${pad(rss, 8)}${pad(m.keyframes.length, 4)}${pad(m.keyframes[0].elements.length, 5)}${pad(m.motion.length, 8)}ok`);
  }
}
