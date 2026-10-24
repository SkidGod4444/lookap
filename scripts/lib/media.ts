/* Every media file lookap keeps lives in its own S3 bucket. toBucket() takes a URL from anywhere (vibrant's CDN, a
   designer's site, any other host) or a local file, stores a copy in the bucket and returns the bucket's public URL,
   so nothing in the catalogue points at someone else's server.

   Keys: cdn.vibrant.design keeps its own path (videos/<id>/card/720p.mp4, images/<id>/cover/1200.webp, ...), any
   other host goes under ext/<host>/<path>, a local file under the key it is given. A URL already in the bucket is
   returned as is. Each upload carries a one-year immutable cache header and is checked on the public URL before the
   URL is handed back. Uploads go through the AWS CLI, signed in with `aws login`. */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

export const BUCKET = process.env.MEDIA_BUCKET ?? "lookap";
export const REGION = process.env.MEDIA_REGION ?? "ap-south-1";
export const MEDIA_HOST = process.env.MEDIA_HOST ?? `${BUCKET}.s3.${REGION}.amazonaws.com`;
const CACHE = "public, max-age=31536000, immutable";
const DIR = "media";
const TYPES: Record<string, string> = { ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".avif": "image/avif", ".svg": "image/svg+xml" };
const EXT: Record<string, string> = Object.fromEntries(Object.entries(TYPES).map(([e, t]) => [t, e]));

export const publicUrl = (key: string) => `https://${MEDIA_HOST}/${key}`;
export const inBucket = (url: string) => url.startsWith(`https://${MEDIA_HOST}/`);

/* the bucket key for a URL: vibrant's paths as they are, any other host under ext/<host>/ */
export function keyFor(url: string, type?: string): string {
  const u = new URL(url);
  let p = decodeURIComponent(u.pathname).replace(/^\/+/, "").replace(/[^A-Za-z0-9._\-/]/g, "_") || "index";
  if (!path.extname(p) && type && EXT[type]) p += EXT[type];
  return u.hostname === "cdn.vibrant.design" ? p : `ext/${u.hostname}/${p}`;
}

/* put one local file at key, then check it answers on the public URL with the same size */
export async function uploadFile(file: string, key: string, type?: string): Promise<string> {
  const ct = type ?? TYPES[path.extname(key).toLowerCase()] ?? "application/octet-stream";
  const r = spawnSync("aws", ["s3", "cp", file, `s3://${BUCKET}/${key}`, "--region", REGION, "--content-type", ct, "--cache-control", CACHE, "--only-show-errors"], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`upload of ${key} failed: ${(r.stderr || r.stdout).trim().slice(-300)} (is the AWS CLI signed in? run: aws login)`);
  const res = await fetch(publicUrl(key), { method: "HEAD" });
  const len = Number(res.headers.get("content-length") ?? -1);
  if (!res.ok || len !== statSync(file).size) throw new Error(`${key} uploaded but ${publicUrl(key)} answers ${res.status} with ${len} bytes`);
  return publicUrl(key);
}

/* fetch a URL (kept under media/ so a rerun does not fetch it again), upload it, return the bucket URL; null when the
   source has nothing there (a 1080p that was never made) */
export async function toBucket(url: string): Promise<string | null> {
  if (inBucket(url)) return url.split("?")[0];
  let file = "", type = "";
  const known = path.join(DIR, keyFor(url));
  if (existsSync(known) && statSync(known).size > 0) file = known;
  else {
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (lookap media import)" }, redirect: "follow" }).catch(() => null);
    if (!res || !res.ok) return null;
    type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!/^(image|video)\//.test(type)) throw new Error(`${url} is ${type || "an unknown type"}, not an image or a video`);
    file = path.join(DIR, keyFor(url, type));
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return uploadFile(file, path.relative(DIR, file), type || undefined);
}

/* a clip and, for vibrant clips, its 1080p sibling (the measuring scripts read the larger one); returns the clip's URL */
export async function clipToBucket(url: string): Promise<string | null> {
  const main = await toBucket(url);
  if (main && url.includes("cdn.vibrant.design") && url.includes("/720p.mp4")) await toBucket(url.replace("/720p.mp4", "/1080p.mp4"));
  return main;
}

/* a page screenshot as a 3-second still clip at half size (the screenshot is 2x), uploaded as videos/<id>/card/720p.mp4;
   seeds measure/<id>/source.mp4 so measuring works at once. Returns the clip's bucket URL. */
export async function stillClip(id: string, imageUrl: string): Promise<string> {
  mkdirSync(`measure/${id}`, { recursive: true });
  const img = `measure/${id}/still.webp`, out = `measure/${id}/source.mp4`;
  if (!existsSync(img)) writeFileSync(img, Buffer.from(await (await fetch(imageUrl)).arrayBuffer()));
  execFileSync("ffmpeg", ["-v", "error", "-y", "-loop", "1", "-i", img, "-t", "3", "-r", "30", "-vf", "scale=trunc(iw/4)*2:trunc(ih/4)*2,format=yuv420p", "-c:v", "libx264", "-crf", "18", "-movflags", "+faststart", out]);
  const key = `videos/${id}/card/720p.mp4`;
  mkdirSync(path.dirname(path.join(DIR, key)), { recursive: true });
  writeFileSync(path.join(DIR, key), readFileSync(out));
  return uploadFile(path.join(DIR, key), key, "video/mp4");
}
