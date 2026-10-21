/* Look at a clip the way the measuring is done: frames and numbers, not impressions. For the factory agent, so a
   rebuild's motion comes from the clip's own edges rather than from the four still keyframes.

     bun scripts/probe.ts <slug> --sheet 0,3.6          contact sheet of that span at 10 fps (6 x 6), written to
                                                         factory/<slug>/sheets/<from>-<to>.png; read it to see what moves
     bun scripts/probe.ts <slug> --col 700 --t 1.5,2.45  luminance runs down column x at each time: L light, M mid,
                                                         D dark, as "L57@430" (57 px of light from y 430); rows, gaps,
                                                         borders and their heights fall out of it
     bun scripts/probe.ts <slug> --row 600 --t 1.5       the same along row y
     bun scripts/probe.ts <slug> --track 340 --from 2 --to 3.6 [--class red|dark|light]
                                                         per frame at 60 fps: first and last y of that colour class in
                                                         column x; prints only frames where it changed, so a motion
                                                         reads as start time, end time, distance and shape

   Needs the clip at measure/<id>/source.mp4 (scripts/measure.ts fetches it) and ffmpeg. */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { bySlug } from "../src/lib/data";
import { clipId } from "../src/lib/drafts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const flag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
if (!slug) { console.error("usage: bun scripts/probe.ts <slug> --sheet a,b | --col x --t t1,t2 | --row y --t t | --track x --from a --to b"); process.exit(2); }
const e = bySlug(slug);
const id = e && clipId(e);
const clip = id ? path.join(ROOT, "measure", id, "source.mp4") : "";
if (!e || !clip || !existsSync(clip)) { console.error(`no clip on disk for ${slug} (expected measure/<id>/source.mp4)`); process.exit(2); }

const probe = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height,r_frame_rate,duration", "-of", "csv=p=0", clip], { encoding: "utf8" }).stdout.trim().split(",");
const W = Number(probe[0]), H = Number(probe[1]), FPS = eval(probe[2]) as number, DUR = Number(probe[3]);
const ff = (a: string[]) => spawnSync("ffmpeg", ["-v", "error", "-y", ...a]);

const times = (flag("--t") ?? "").split(",").map(Number).filter((n) => Number.isFinite(n));
const cls = (v: number[], what: string) => what === "red" ? v[0] > 110 && v[1] < 90 && v[2] < 110 : what === "dark" ? (v[0] + v[1] + v[2]) / 3 < 140 : (v[0] + v[1] + v[2]) / 3 > 225;

if (flag("--sheet")) {
  const [a, b] = flag("--sheet")!.split(",").map(Number);
  const dir = path.join(ROOT, "factory", slug, "sheets");
  mkdirSync(dir, { recursive: true });
  const tmp = path.join(tmpdir(), `lookap-sheet-${process.pid}`);
  mkdirSync(tmp, { recursive: true });
  const out = path.join(dir, `${a}-${b}.png`);
  ff(["-ss", String(a), "-t", String(b - a), "-i", clip, "-vf", `fps=10,scale=450:-1`, path.join(tmp, "%03d.png")]);
  ff(["-pattern_type", "glob", "-i", path.join(tmp, "*.png"), "-vf", "tile=6x6", out]);
  console.log(`${path.relative(ROOT, out)}: ${Math.round((b - a) * 10)} frames at 10 fps, left to right then down; frame n is at ${a} + (n - 1) / 10 s. Clip ${W}x${H}, ${FPS} fps, ${DUR}s.`);
} else if (flag("--col") || flag("--row")) {
  const col = flag("--col") ? Number(flag("--col")) : null, row = flag("--row") ? Number(flag("--row")) : null;
  if (!times.length) { console.error("--t needs one or more times"); process.exit(2); }
  const crop = col !== null ? `crop=8:${H}:${col}:0` : `crop=${W}:8:0:${row}`;
  const N = col !== null ? H : W;
  for (const t of times) {
    const raw = path.join(tmpdir(), `lookap-probe-${process.pid}.rgb`);
    ff(["-ss", String(t), "-i", clip, "-frames:v", "1", "-vf", crop, "-f", "rawvideo", "-pix_fmt", "rgb24", raw]);
    const d = readFileSync(raw);
    const runs: string[] = []; let cur = "", s = 0;
    for (let i = 0; i < N; i++) {
      let v = 0;
      for (let k = 0; k < 8; k++) { const o = col !== null ? ((i * 8) + k) * 3 : ((k * W) + i) * 3; v += (d[o] + d[o + 1] + d[o + 2]) / 3; }
      v /= 8;
      const c = v > 225 ? "L" : v < 140 ? "D" : "M";
      if (c !== cur) { if (cur && i - s >= 2) runs.push(`${cur}${i - s}@${s}`); cur = c; s = i; }
    }
    if (cur) runs.push(`${cur}${N - s}@${s}`);
    console.log(`${t}s ${col !== null ? `x=${col}` : `y=${row}`}: ${runs.join(" ")}`);
  }
  console.log("L light (>225), M mid, D dark (<140); runs under 2 px are dropped. A row body is an L run, its borders and gaps the D between.");
} else if (flag("--track")) {
  const x = Number(flag("--track")), from = Number(flag("--from") ?? 0), to = Number(flag("--to") ?? DUR), what = flag("--class") ?? "red";
  const raw = path.join(tmpdir(), `lookap-track-${process.pid}.rgb`);
  ff(["-ss", String(from), "-t", String(to - from), "-i", clip, "-vf", `crop=8:${H}:${x}:0`, "-f", "rawvideo", "-pix_fmt", "rgb24", raw]);
  const d = readFileSync(raw);
  const n = Math.floor(d.length / (H * 8 * 3));
  let prev = "";
  const lines: string[] = [];
  for (let i = 0; i < n; i++) {
    let top = -1, bot = -1;
    for (let y = 0; y < H; y++) {
      let c = 0;
      for (let k = 0; k < 8; k++) { const o = ((i * H + y) * 8 + k) * 3; if (cls([d[o], d[o + 1], d[o + 2]], what)) c++; }
      if (c > 4) { if (top < 0) top = y; bot = y; }
    }
    const key = `${top} ${bot}`;
    if (key !== prev) lines.push(`${(from + i / FPS).toFixed(3)}s top ${top} bottom ${bot} height ${top < 0 ? 0 : bot - top + 1}`);
    prev = key;
  }
  console.log(`${what} in column x=${x}, ${from}s to ${to}s at ${FPS} fps; only frames where the edges moved:`);
  console.log(lines.join("\n"));
}
