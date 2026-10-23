/* ffmpeg for the server: the static binary that ships with the deployment (ffmpeg-static), so a Vercel function can
   read a clip the way the local scripts do. No ffprobe: the stream line of `ffmpeg -i` says what probe would.
   Clips are fetched from the CDN once per warm instance and kept in the temp dir, so a session of look_at calls
   on one entry downloads it once. */
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { access, chmod, copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";
import SCREENS_JSON from "./screens.json";

/* filmed screens, straightened (scripts/screen.ts): the corners of the page in the source clip and the flat size. A
   clip listed here is warped once per instance after download, so every read sees the page, not the room. */
type Screen = { corners: { tl: [number, number]; tr: [number, number]; br: [number, number]; bl: [number, number] }; source: { w: number; h: number }; flat: { w: number; h: number } };
const SCREENS = SCREENS_JSON as unknown as Record<string, Screen>;

async function flatten(id: string, file: string): Promise<string> {
  const sc = SCREENS[id];
  if (!sc) return file;
  const out = file.replace(/\.mp4$/, "-flat.mp4");
  try { if ((await stat(out)).size > 0) return out; } catch { /* not yet */ }
  const info = await clipInfo(file);
  const k = info.width / sc.source.w;
  const c = sc.corners;
  const pts = [c.tl, c.tr, c.bl, c.br].flat().map((v) => (v * k).toFixed(1)).join(":");
  await ffmpeg(["-v", "error", "-y", "-i", file, "-vf", `perspective=${pts}:interpolation=cubic:sense=source,scale=${sc.flat.w}:${sc.flat.h}:flags=lanczos`, "-c:v", "libx264", "-crf", "18", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-an", out], 55_000);
  return out;
}

const run = promisify(execFile);
let bin: Promise<string> | null = null;

/* the binary, executable: on a read-only deployment it is copied to the temp dir and marked once */
export function ffmpegBin(): Promise<string> {
  bin ??= (async () => {
    const p = ffmpegPath;
    if (!p) throw new Error("ffmpeg is not installed");
    try { await access(p, constants.X_OK); return p; } catch { /* fall through */ }
    const copy = join(tmpdir(), "lookap-ffmpeg");
    try { await access(copy, constants.X_OK); return copy; } catch { /* fall through */ }
    await copyFile(p, copy);
    await chmod(copy, 0o755);
    return copy;
  })();
  return bin;
}

export async function ffmpeg(args: string[], timeout = 30_000) {
  return run(await ffmpegBin(), args, { timeout, maxBuffer: 1 << 26 });
}

export type ClipInfo = { width: number; height: number; fps: number; duration: number; codec: string };

/* what ffprobe would say, read from ffmpeg's own stream line */
export async function clipInfo(file: string): Promise<ClipInfo> {
  const r = await run(await ffmpegBin(), ["-hide_banner", "-i", file], { timeout: 15_000 }).catch((e: { stderr?: string }) => ({ stderr: e.stderr ?? "" }));
  const err = String(r.stderr ?? "");
  const v = err.match(/Stream #\d+:\d+.*?: Video: (\w+)[^\n]*?,\D*?(\d{2,5})x(\d{2,5})[^\n]*/);
  if (!v) throw new Error("Could not read this as a video or an image. Send an mp4, webm, gif, png, jpg or webp.");
  const fps = Number(v[0].match(/([\d.]+) fps/)?.[1] ?? v[0].match(/([\d.]+) tbr/)?.[1] ?? 0);
  const d = err.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const duration = d ? Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]) : 0;
  return { width: Number(v[2]), height: Number(v[3]), fps, duration, codec: v[1] };
}

/* the entry's clip on local disk: fetched from the CDN once per instance */
export async function cachedClip(id: string, url: string): Promise<string> {
  const dir = join(tmpdir(), "lookap-clips");
  await mkdir(dir, { recursive: true });
  const file = join(dir, `${id}.mp4`);
  try { if ((await stat(file)).size > 0) return flatten(id, file); } catch { /* not yet */ }
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000), headers: { "user-agent": "lookap-registry/0.3" } });
  if (!res.ok) throw new Error(`clip fetch failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > 80 * 1024 * 1024) throw new Error("clip larger than 80 MB");
  await writeFile(file, buf);
  return flatten(id, file);
}

/* the sharpest rendition the CDN has, for sampling: the catalogue links 720p, most clips also have 1080p */
export async function cachedClipBest(id: string, url: string): Promise<string> {
  const dir = join(tmpdir(), "lookap-clips");
  await mkdir(dir, { recursive: true });
  const file = join(dir, `${id}-best.mp4`);
  try { if ((await stat(file)).size > 0) return flatten(id, file); } catch { /* not yet */ }
  for (const u of [url.replace("/720p.mp4", "/1080p.mp4"), url]) {
    const res = await fetch(u, { signal: AbortSignal.timeout(25_000), headers: { "user-agent": "lookap-registry/0.3" } }).catch(() => null);
    if (!res?.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 80 * 1024 * 1024 || buf.byteLength < 1000) continue;
    await writeFile(file, buf);
    return flatten(id, file);
  }
  return cachedClip(id, url);
}

/* the per-pixel median of a region over a span: what stays when moving things pass over a still picture (ripples,
   glass, a cursor), so the picture comes out clean. `box` is in the clip file's own pixels. JPEG bytes. */
export async function plateOf(clip: string, box: [number, number, number, number], from: number, to: number, fps = 4): Promise<Buffer> {
  const n = Math.max(3, Math.round((to - from) * fps));
  const r = Math.min(127, Math.floor((n - 1) / 2));
  const dir = join(tmpdir(), `lookap-plate-${process.pid}-${Math.random().toString(36).slice(2)}`);
  await mkdir(dir, { recursive: true });
  const [x, y, w, h] = box.map((v) => Math.max(0, Math.round(v)));
  /* ffmpeg builds differ in which frames tmedian emits (only full windows, or every frame); the middle of what comes
     out is the full-window median either way */
  await ffmpeg(["-v", "error", "-y", "-ss", String(from), "-t", String(to - from), "-i", clip, "-vf", `fps=${fps},crop=${w - (w % 2)}:${h - (h % 2)}:${x}:${y},tmedian=radius=${r}`, "-q:v", "3", join(dir, "%04d.jpg")], 55_000);
  const files = (await readdir(dir)).filter((f) => f.endsWith(".jpg")).sort();
  if (!files.length) throw new Error("the median produced no frame");
  const out = await readFile(join(dir, files[Math.floor(files.length / 2)]));
  await rm(dir, { recursive: true, force: true });
  return out;
}

/* one frame at t seconds, full size, as PNG bytes */
export async function frameAt(clip: string, t: number): Promise<Buffer> {
  const out = join(tmpdir(), `lookap-frame-${process.pid}-${Math.random().toString(36).slice(2)}.png`);
  await ffmpeg(["-v", "error", "-y", "-ss", String(t), "-i", clip, "-frames:v", "1", out]);
  return readFile(out);
}

/* the clip's frames over a span as one contact sheet (JPEG), `fps` frames a second, `cols` across */
export async function sheetOf(clip: string, from: number, to: number, fps: number, cols: number, tile: number): Promise<Buffer> {
  const out = join(tmpdir(), `lookap-sheet-${process.pid}-${Math.random().toString(36).slice(2)}.jpg`);
  const n = Math.ceil((to - from) * fps);
  await ffmpeg(["-v", "error", "-y", "-ss", String(from), "-t", String(to - from), "-i", clip, "-vf", `fps=${fps},scale=${tile}:-2,tile=${cols}x${Math.ceil(n / cols)}`, "-frames:v", "1", "-q:v", "5", out], 60_000);
  return readFile(out);
}

/* per frame over a span: the first and last y (or x) where a colour class holds in one column (or row), the way the
   local probe tracks an edge; only the frames where the edges moved are returned */
export async function trackEdge(clip: string, info: ClipInfo, axis: "col" | "row", pos: number, from: number, to: number, cls: "red" | "dark" | "light") {
  const raw = join(tmpdir(), `lookap-track-${process.pid}-${Math.random().toString(36).slice(2)}.rgb`);
  const W = info.width, H = info.height;
  const crop = axis === "col" ? `crop=8:${H}:${Math.max(0, Math.min(W - 8, pos - 4))}:0` : `crop=${W}:8:0:${Math.max(0, Math.min(H - 8, pos - 4))}`;
  await ffmpeg(["-v", "error", "-y", "-ss", String(from), "-t", String(to - from), "-i", clip, "-vf", crop, "-f", "rawvideo", "-pix_fmt", "rgb24", raw], 60_000);
  const d = await readFile(raw);
  const N = axis === "col" ? H : W;
  const perFrame = N * 8 * 3;
  const n = Math.floor(d.length / perFrame);
  const is = (r: number, g: number, b: number) => cls === "red" ? r > 110 && g < 90 && b < 110 : cls === "dark" ? (r + g + b) / 3 < 140 : (r + g + b) / 3 > 225;
  const lines: { at: number; first: number; last: number }[] = [];
  let prev = "";
  for (let i = 0; i < n; i++) {
    let first = -1, last = -1;
    for (let j = 0; j < N; j++) {
      let c = 0;
      for (let k = 0; k < 8; k++) { const o = i * perFrame + (axis === "col" ? (j * 8 + k) : (k * W + j)) * 3; if (is(d[o], d[o + 1], d[o + 2])) c++; }
      if (c > 4) { if (first < 0) first = j; last = j; }
    }
    const key = `${first} ${last}`;
    if (key !== prev) lines.push({ at: Number((from + i / info.fps).toFixed(3)), first, last });
    prev = key;
  }
  return lines;
}

/* a user's own file, fetched once per instance and kept under a hash of its address; the same size cap as the gate */
export async function cachedUrl(url: string): Promise<{ file: string; id: string }> {
  const u = new URL(url);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Only http(s) URLs are accepted");
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[::1\]|169\.254\.)/.test(u.hostname)) throw new Error("Private hosts are not allowed");
  const id = "u" + createHash("sha256").update(url).digest("hex").slice(0, 32);
  return { file: await cachedClip(id, url), id };
}

export type Measured = {
  frame: { w: number; h: number }; fps: number; duration: number; still: boolean;
  phases: [number, number][]; holds: [number, number][]; moments: { at: number; name: string }[];
  background: string; palette: { hex: string; share: number }[];
};

/* a draft measurement of any clip: where it moves (frame-to-frame change at 10 fps, read at 160 px wide), the holds
   between and their midpoints as moments, the first frame's palette and its background (the colour at the edges) */
export async function measureClip(file: string): Promise<Measured> {
  const info = await clipInfo(file);
  const W = info.width, H = info.height;
  const sw = 160, sh = Math.max(2, Math.round((160 * H) / W));
  const still = /^(png|mjpeg|webp|bmp|tiff)$/.test(info.codec) || info.duration < 0.2;
  const raw = join(tmpdir(), `lookap-measure-${process.pid}-${Math.random().toString(36).slice(2)}.rgb`);
  const FPS = 10;
  await ffmpeg(["-v", "error", "-y", "-i", file, ...(still ? ["-frames:v", "1"] : ["-vf", `fps=${FPS},scale=${sw}:${sh}`, "-t", "60"]), ...(still ? ["-vf", `scale=${sw}:${sh}`] : []), "-f", "rawvideo", "-pix_fmt", "rgb24", raw], 90_000);
  const d = await readFile(raw);
  const per = sw * sh * 3, n = Math.max(1, Math.floor(d.length / per));
  /* phases: spans where consecutive frames differ by more than a little */
  const diffs: number[] = [];
  for (let i = 1; i < n; i++) { let s = 0; for (let j = 0; j < per; j += 3) s += Math.abs(d[i * per + j] - d[(i - 1) * per + j]) + Math.abs(d[i * per + j + 1] - d[(i - 1) * per + j + 1]) + Math.abs(d[i * per + j + 2] - d[(i - 1) * per + j + 2]); diffs.push(s / (per)); }
  const moving = diffs.map((v) => v > 1.2);
  const phases: [number, number][] = [];
  for (let i = 0; i < moving.length; i++) { if (!moving[i]) continue; let j = i; while (j + 1 < moving.length && moving[j + 1]) j++; phases.push([Number((i / FPS).toFixed(2)), Number(((j + 1) / FPS).toFixed(2))]); i = j; }
  const merged: [number, number][] = [];
  for (const p of phases) { const last = merged[merged.length - 1]; if (last && p[0] - last[1] <= 0.15) last[1] = p[1]; else merged.push([...p] as [number, number]); }
  const holds: [number, number][] = [];
  let t = 0; for (const [a, b] of merged) { if (a - t >= 0.3) holds.push([Number(t.toFixed(2)), a]); t = b; }
  const end = Number((n / FPS).toFixed(2)); if (end - t >= 0.3) holds.push([Number(t.toFixed(2)), end]);
  const moments = [...holds.slice(0, 6).map((h, i) => ({ at: Number(((h[0] + h[1]) / 2).toFixed(2)), name: `hold ${i + 1}` })), ...merged.slice(0, 6).map(([a, b]) => ({ at: Number(((a + b) / 2).toFixed(2)), name: "mid-phase" }))].sort((p, q) => p.at - q.at);
  /* palette and background from the first frame */
  const counts = new Map<string, number>();
  const edge = new Map<string, number>();
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    const o = (y * sw + x) * 3; const k = (d[o] >> 4).toString(16) + (d[o + 1] >> 4).toString(16) + (d[o + 2] >> 4).toString(16);
    counts.set(k, (counts.get(k) ?? 0) + 1);
    if (x < 3 || y < 3 || x >= sw - 3 || y >= sh - 3) edge.set(k, (edge.get(k) ?? 0) + 1);
  }
  const hexOf = (k: string) => "#" + k.split("").map((c) => (parseInt(c, 16) * 17).toString(16).padStart(2, "0")).join("");
  const palette = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, c]) => ({ hex: hexOf(k), share: Number((c / (sw * sh)).toFixed(3)) }));
  const bgKey = [...edge.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return { frame: { w: W, h: H }, fps: info.fps, duration: still ? 0 : Number(info.duration.toFixed(2)), still, phases: still ? [] : merged, holds: still ? [] : holds, moments: still ? [{ at: 0, name: "the still" }] : moments, background: bgKey ? hexOf(bgKey) : palette[0]?.hex ?? "#000000", palette };
}
