/* lookap measure: a clip in, a spec-shaped JSON out, no model involved.
   bun scripts/measure.ts <entry slug | catalog id | url | file> [--out measure]

   1. probe the clip (size, fps, duration)
   2. sample it at 10 fps, small, and find the holds between motions: those are the states; one keyframe per hold
   3. at each keyframe, full resolution: palette, flat regions as element boxes with fills, edge lighting on the big ones
   4. track the big elements of the first keyframe through the small frames: when they move, how far, how long
   Output: <out>/<id>/measure.json plus the keyframes as JPEG and a contact sheet. Feed it to the agent with get_method. */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ENTRIES } from "../src/lib/data";

type Box = [number, number, number, number];
const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--"));
const outRoot = args.includes("--out") ? args[args.indexOf("--out") + 1] : "measure";
if (!target) { console.error("usage: bun scripts/measure.ts <slug | id | url | file> [--out dir]"); process.exit(1); }

/* ---- resolve the clip ---- */
function resolve(t: string): { id: string; src: string; title?: string } {
  if (existsSync(t)) return { id: t.replace(/.*\//, "").replace(/\.\w+$/, ""), src: t };
  if (/^https?:/.test(t)) return { id: (t.match(/videos\/([a-z0-9]+)\//)?.[1] ?? "clip"), src: t };
  const row = ENTRIES.find((e) => e.slug === t || e.ref?.includes(`/${t}-`) || e.ref?.endsWith(`/${t}`) || e.video?.src.includes(`/${t}/`));
  if (!row?.video) throw new Error(`No clip for ${t}`);
  const id = row.video.src.match(/videos\/([a-z0-9]+)\//)?.[1] ?? t;
  return { id, src: row.video.src.replace("/720p.mp4", "/1080p.mp4"), title: row.title };
}
const clip = resolve(target);
const out = join(outRoot, clip.id);
mkdirSync(out, { recursive: true });
let src = clip.src;
/* the catalog links 720p; most clips also have a 1080p file, some do not: try the big one, keep what ffprobe accepts */
if (/^https?:/.test(src)) {
  const f = join(out, "source.mp4");
  const valid = () => existsSync(f) && spawnSync("ffprobe", ["-v", "error", f]).status === 0;
  if (!valid()) {
    for (const u of [src, src.replace("/1080p.mp4", "/720p.mp4")]) { execFileSync("curl", ["-sL", "-o", f, u]); if (valid()) { src = u; break; } }
    if (!valid()) throw new Error(`No readable clip at ${src}`);
  }
  src = f;
}

/* ---- 1. probe ---- */
const probe = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate,duration", "-of", "csv=p=0", src]).toString().trim().split(",");
const W = +probe[0], H = +probe[1], FPS = eval(probe[2]) as number, DUR = +probe[3];
console.log(`${clip.id}: ${W}x${H}, ${FPS} fps, ${DUR.toFixed(2)} s`);

/* ---- helpers ---- */
const raw = (a: string[]) => { const r = spawnSync("ffmpeg", ["-v", "error", ...a, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 1 << 30 }); if (r.status !== 0) throw new Error(r.stderr.toString()); return r.stdout; };
const hex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
const luma = (d: Buffer, i: number) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];

/* ---- 2. small frames at 10 fps: motion and holds ---- */
const SW = 320, SH = Math.round((H / W) * SW), SFPS = 20; /* 50 ms steps, about 3 source px per sample px on a 1080 frame */
const small = raw(["-i", src, "-vf", `fps=${SFPS},scale=${SW}:${SH}`]);
const N = Math.floor(small.length / (SW * SH * 3));
const frame = (k: number) => small.subarray(k * SW * SH * 3, (k + 1) * SW * SH * 3);
const diffs: number[] = [0];
for (let k = 1; k < N; k++) { const a = frame(k - 1), b = frame(k); let s = 0; for (let i = 0; i < a.length; i += 3) s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); diffs.push(s / (a.length)); }
const maxDiff = Math.max(...diffs);
const moving = diffs.map((d) => d > Math.max(0.6, 0.12 * maxDiff));
type Span = { from: number; to: number };
const holds: Span[] = [], moves: Span[] = [];
for (let k = 0; k < N; ) { const m = moving[k]; let j = k; while (j < N && moving[j] === m) j++; (m ? moves : holds).push({ from: k, to: j - 1 }); k = j; }
const longHolds = holds.filter((h) => h.to - h.from >= 4);
const keyframes = (longHolds.length ? longHolds : [{ from: 0, to: 0 }]).map((h) => ({ frame: Math.round((h.from + h.to) / 2), hold: h }));
while (keyframes.length > 6) { let si = 0; for (let i = 1; i < keyframes.length; i++) if (keyframes[i].hold.to - keyframes[i].hold.from < keyframes[si].hold.to - keyframes[si].hold.from) si = i; keyframes.splice(si, 1); }
const t = (k: number) => +(k / SFPS).toFixed(2);

/* ---- 3. full frames at the keyframes: palette, regions, lighting ---- */
type Region = { box: Box; fill: string; area: number; touchesEdge: boolean; mean: [number, number, number] };
function regions(d: Buffer, w: number, h: number): Region[] {
  const n = w * h, label = new Int32Array(n).fill(-1), step = 2; const outR: Region[] = []; const stack = new Int32Array(n);
  const TOL = 42;
  for (let y0 = 0; y0 < h; y0 += step) for (let x0 = 0; x0 < w; x0 += step) {
    const s = y0 * w + x0; if (label[s] !== -1) continue;
    const id = outR.length; const sr = d[s * 3], sg = d[s * 3 + 1], sb = d[s * 3 + 2];
    let sp = 0; stack[sp++] = s; label[s] = id; let minx = x0, maxx = x0, miny = y0, maxy = y0, cnt = 0, R = 0, G = 0, B = 0;
    while (sp) { const p = stack[--sp]; const px = p % w, py = (p - px) / w; cnt++; R += d[p * 3]; G += d[p * 3 + 1]; B += d[p * 3 + 2];
      if (px < minx) minx = px; if (px > maxx) maxx = px; if (py < miny) miny = py; if (py > maxy) maxy = py;
      const nb = [p - 1, p + 1, p - w, p + w];
      for (let q = 0; q < 4; q++) { const m = nb[q]; if (m < 0 || m >= n || label[m] !== -1) continue; if ((q === 0 && px === 0) || (q === 1 && px === w - 1)) continue;
        if (Math.abs(d[m * 3] - sr) + Math.abs(d[m * 3 + 1] - sg) + Math.abs(d[m * 3 + 2] - sb) <= TOL) { label[m] = id; stack[sp++] = m; } }
    }
    if (cnt >= n * 0.0004) outR.push({ box: [minx, miny, maxx - minx + 1, maxy - miny + 1], fill: hex(R / cnt, G / cnt, B / cnt), area: cnt, touchesEdge: minx === 0 || miny === 0 || maxx === w - 1 || maxy === h - 1, mean: [R / cnt, G / cnt, B / cnt] });
    else outR.push(null as unknown as Region);
  }
  return outR.filter(Boolean).sort((a, b) => b.area - a.area);
}
function palette(d: Buffer, w: number, h: number) {
  const bins = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < w * h * 3; i += 12) { const k = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4); const e = bins.get(k) ?? { n: 0, r: 0, g: 0, b: 0 }; e.n++; e.r += d[i]; e.g += d[i + 1]; e.b += d[i + 2]; bins.set(k, e); }
  const total = [...bins.values()].reduce((s, e) => s + e.n, 0);
  return [...bins.values()].sort((a, b) => b.n - a.n).slice(0, 8).map((e) => ({ hex: hex(e.r / e.n, e.g / e.n, e.b / e.n), share: +(e.n / total * 100).toFixed(1) }));
}
function edgeProfile(d: Buffer, w: number, box: Box, side: "left" | "top") {
  const [x, y, bw, bh] = box; const vals: number[] = [];
  for (let k = 0; k <= 48 && k < (side === "left" ? bw : bh); k += 6) { const px = side === "left" ? x + k : x + Math.round(bw / 2), py = side === "left" ? y + Math.round(bh / 2) : y + k; vals.push(Math.round(luma(d, (py * w + px) * 3))); }
  const far = vals[vals.length - 1]; const settle = vals.findIndex((v) => Math.abs(v - far) <= 5) * 6;
  return { at: "0,6,12,…48 px in", luma: vals, rim: vals[0], settlesAfterPx: settle };
}
const kfOut: { name: string; at: number; hold: [number, number]; src: string; palette: ReturnType<typeof palette>; background: { fill: string; box: Box }; elements: (Omit<Region, "mean"> & { edges?: { left: ReturnType<typeof edgeProfile>; top: ReturnType<typeof edgeProfile> } })[] }[] = [];
keyframes.forEach((kf, i) => {
  const at = t(kf.frame);
  const jpg = join(out, `kf${i + 1}.jpg`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(at), "-i", src, "-frames:v", "1", "-q:v", "3", jpg]);
  const d = raw(["-ss", String(at), "-i", src, "-frames:v", "1"]);
  const regs = regions(d, W, H);
  const bg = regs.find((r) => r.touchesEdge) ?? regs[0];
  const els = regs.filter((r) => r !== bg).slice(0, 40).map((r, j) => (j < 5 ? { ...r, edges: { left: edgeProfile(d, W, r.box, "left"), top: edgeProfile(d, W, r.box, "top") } } : r));
  kfOut.push({ name: `kf${i + 1}`, at, hold: [t(kf.hold.from), t(kf.hold.to)], src: jpg, palette: palette(d, W, H), background: { fill: bg?.fill ?? "#000000", box: bg?.box ?? [0, 0, W, H] }, elements: els.map((r) => { const { mean, ...rest } = r; void mean; return rest; }) });
  console.log(`  ${kfOut[i].name} at ${at}s: ${els.length} elements, background ${kfOut[i].background.fill}`);
});

/* ---- 4. track the first keyframe's big elements through the small frames ---- */
const sx = SW / W, sy = SH / H;
const tracks = kfOut[0].elements.slice(0, 6).map((el) => {
  const [x, y, w, h] = el.box; const roi = [Math.max(0, x - w * 0.6) * sx, Math.max(0, y - h * 0.6) * sy, (w * 2.2) * sx, (h * 2.2) * sy].map(Math.round) as Box;
  const [r0, g0, b0] = [parseInt(el.fill.slice(1, 3), 16), parseInt(el.fill.slice(3, 5), 16), parseInt(el.fill.slice(5, 7), 16)];
  const path: { t: number; cx: number; cy: number; top: number; left: number }[] = [];
  for (let k = 0; k < N; k++) { const f = frame(k); let cx = 0, cy = 0, n = 0, top = 1e9, left = 1e9;
    for (let yy = roi[1]; yy < Math.min(SH, roi[1] + roi[3]); yy++) for (let xx = roi[0]; xx < Math.min(SW, roi[0] + roi[2]); xx++) { const i = (yy * SW + xx) * 3; if (Math.abs(f[i] - r0) + Math.abs(f[i + 1] - g0) + Math.abs(f[i + 2] - b0) <= 48) { cx += xx; cy += yy; n++; if (yy < top) top = yy; if (xx < left) left = xx; } }
    if (n > 4) path.push({ t: t(k), cx: cx / n / sx, cy: cy / n / sy, top: top / sy, left: left / sx });
  }
  /* a part sliding under another keeps its top and left edges honest while its centroid lags, so both are reported */
  const motion: { from: number; to: number; dx: number; dy: number; dTop: number; dLeft: number; ms: number }[] = [];
  let cur: typeof motion[number] | null = null;
  for (let i = 1; i < path.length; i++) { const dx = path[i].cx - path[i - 1].cx, dy = path[i].cy - path[i - 1].cy, dt = path[i].top - path[i - 1].top, dl = path[i].left - path[i - 1].left; const mv = Math.hypot(dx, dy) > 2 || Math.abs(dt) > 2 || Math.abs(dl) > 2;
    if (mv) { if (cur) { cur.to = path[i].t; cur.dx += dx; cur.dy += dy; cur.dTop += dt; cur.dLeft += dl; } else cur = { from: path[i - 1].t, to: path[i].t, dx, dy, dTop: dt, dLeft: dl, ms: 0 }; }
    else if (cur) { cur.ms = Math.round((cur.to - cur.from) * 1000); motion.push(cur); cur = null; } }
  if (cur) { cur.ms = Math.round((cur.to - cur.from) * 1000); motion.push(cur); }
  const kept = motion.filter((m) => Math.hypot(m.dx, m.dy) > 3 || Math.abs(m.dTop) > 3 || Math.abs(m.dLeft) > 3);
  /* the sampled track says when and roughly how far; two full frames per move say exactly how far */
  const edgesAt = (at: number) => { const f = raw(["-ss", String(at), "-i", src, "-frames:v", "1"]); let top = 1e9, left = 1e9, n = 0;
    const X0 = Math.max(0, x - w * 0.6), Y0 = Math.max(0, y - h * 0.6), X1 = Math.min(W, x + w * 1.6), Y1 = Math.min(H, y + h * 1.6);
    for (let yy = Y0; yy < Y1; yy++) for (let xx = X0; xx < X1; xx++) { const i = (yy * W + xx) * 3; if (Math.abs(f[i] - r0) + Math.abs(f[i + 1] - g0) + Math.abs(f[i + 2] - b0) <= 48) { n++; if (yy < top) top = yy; if (xx < left) left = xx; } }
    return n > 30 ? { top, left } : null; };
  const refined = kept.map((m) => { const a = edgesAt(m.from), b = edgesAt(m.to); return a && b ? { ...m, dTop: b.top - a.top, dLeft: b.left - a.left } : m; });
  return { element: el.fill, box: el.box, moves: refined.map((m) => ({ ...m, dx: Math.round(m.dx), dy: Math.round(m.dy), dTop: Math.round(m.dTop), dLeft: Math.round(m.dLeft) })) };
}).filter((tr) => tr.moves.length);

/* ---- contact sheet + json ---- */
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-vf", `fps=2,scale=${Math.round(1600 / Math.min(12, Math.ceil(DUR * 2)))}:-1,tile=${Math.min(12, Math.ceil(DUR * 2))}x${Math.ceil(Math.ceil(DUR * 2) / Math.min(12, Math.ceil(DUR * 2)))}`, join(out, "sheet.png")]);
const result = {
  source: { id: clip.id, title: clip.title ?? null, url: clip.src, frame: { w: W, h: H }, fps: FPS, duration: +DUR.toFixed(2), unit: "1 source px" },
  phases: moves.map((m) => ({ moving: [t(m.from), t(m.to)] as [number, number] })),
  keyframes: kfOut,
  motion: tracks,
  confidence: {
    phases: "high: sampled every 50 ms, so a phase edge is within 50 ms",
    motion: "high for a part with its own colour: distance from full-resolution edges at the span's start and end, within 2 px; low when two moving parts share a colour",
    palette: "high for areas; small things (text, LEDs, icons) do not reach the top eight",
    elements: "draft: flat regions only; gradients, shadow bands and dot grids split or merge boxes, text and thin parts are missed; review every box against the keyframe before writing a spec",
  },
  coverage: kfOut[0].elements.length ? "flat regions found; boxes and fills are usable as given" : "no flat regions at the first keyframe: photographic or gradient-heavy content; read layout from the keyframes by eye",
  reading: [
    "keyframes are the holds between motions (sampled every 50 ms); name them by what you see (rest, open, done) before writing the spec",
    "elements are flat regions at that keyframe: box [x, y, w, h] in source px, fill as the region's mean; nested parts show as separate regions",
    "edges: luma from the element's left edge and top edge inward, 6 px steps: a bright rim that settles over N px is a light; a flat profile is none",
    "motion: the first keyframe's big elements tracked by colour through the clip; dx, dy move the visible centroid, dTop and dLeft move the top and left edges (trust the edges when a part slides under another); ms is the span",
    "what this cannot read: text content, type sizes, radii under 6 px, and anything the same colour as its neighbour; see the keyframes for those",
  ],
};
writeFileSync(join(out, "measure.json"), JSON.stringify(result, null, 2));
console.log(`wrote ${join(out, "measure.json")}: ${kfOut.length} keyframes, ${tracks.length} moving elements, phases ${moves.length}`);
