import "server-only";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const run = promisify(execFile);

export type FrameSet = {
  width: number;
  height: number;
  fps: number;
  duration: number;
  /* sampled frames as raw RGB at `fw` x `fh`, evenly spaced across the clip */
  fw: number;
  fh: number;
  frames: Uint8Array[];
  /* contact sheet (JPEG) of the same frames, for the UI and the vision call */
  sheetJpeg: Buffer;
};

const MAX_BYTES = 60 * 1024 * 1024;
const FRAMES = 8;
const FW = 320;

/* Download a clip, probe it, and sample it. Only http(s) URLs to public hosts; size and time capped.
   Requires ffmpeg and ffprobe on PATH. */
export async function sampleVideo(url: string): Promise<FrameSet> {
  const u = new URL(url);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Only http(s) URLs are accepted");
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[::1\]|169\.254\.)/.test(u.hostname)) throw new Error("Private hosts are not allowed");

  const dir = await mkdtemp(join(tmpdir(), "lookap-gate-"));
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000), headers: { "user-agent": "lookap-gate/0.1" } });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_BYTES) throw new Error("Clip is larger than 60 MB");
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) throw new Error("Clip is larger than 60 MB");
    const src = join(dir, "src");
    await writeFile(src, buf);

    const probe = await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate:format=duration", "-of", "json", src]);
    const info = JSON.parse(probe.stdout) as { streams?: { width: number; height: number; r_frame_rate: string }[]; format?: { duration: string } };
    const s = info.streams?.[0];
    if (!s) throw new Error("No video stream found. Is this a video?");
    const [n, d] = s.r_frame_rate.split("/").map(Number);
    const fps = d ? n / d : n;
    const duration = Number(info.format?.duration ?? 0);
    const fh = Math.max(2, Math.round((FW * s.height) / s.width));

    /* evenly spaced frames: select by timestamp so long clips are covered end to end */
    const step = Math.max(duration / FRAMES, 0.05);
    const raw = join(dir, "frames.rgb");
    await run("ffmpeg", ["-v", "error", "-i", src, "-vf", `fps=1/${step.toFixed(4)},scale=${FW}:${fh}`, "-frames:v", String(FRAMES), "-f", "rawvideo", "-pix_fmt", "rgb24", raw, "-y"], { timeout: 60_000 });
    const all = await readFile(raw);
    const per = FW * fh * 3;
    const frames: Uint8Array[] = [];
    for (let i = 0; i + per <= all.byteLength; i += per) frames.push(new Uint8Array(all.buffer, all.byteOffset + i, per));
    if (frames.length < 2) throw new Error("Could not read enough frames from the clip");

    const sheet = join(dir, "sheet.jpg");
    await run("ffmpeg", ["-v", "error", "-i", src, "-vf", `fps=1/${step.toFixed(4)},scale=${FW}:-2,tile=4x2:padding=4:color=black`, "-frames:v", "1", "-q:v", "4", sheet, "-y"], { timeout: 60_000 });
    const sheetJpeg = await readFile(sheet);

    return { width: s.width, height: s.height, fps, duration, fw: FW, fh, frames, sheetJpeg };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
