/* ffmpeg for the server: the static binary that ships with the deployment (ffmpeg-static), so a Vercel function can
   read a clip the way the local scripts do. No ffprobe: the stream line of `ffmpeg -i` says what probe would.
   Clips are fetched from the CDN once per warm instance and kept in the temp dir, so a session of look_at calls
   on one entry downloads it once. */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { access, chmod, copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";

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
  try { if ((await stat(file)).size > 0) return file; } catch { /* not yet */ }
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000), headers: { "user-agent": "lookap-registry/0.3" } });
  if (!res.ok) throw new Error(`clip fetch failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > 80 * 1024 * 1024) throw new Error("clip larger than 80 MB");
  await writeFile(file, buf);
  return file;
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
