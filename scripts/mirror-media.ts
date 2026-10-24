/* Move the catalogue's media off cdn.vibrant.design onto lookap's own R2 bucket, served at MEDIA_HOST.
   The paths stay the same (videos/<id>/card/720p.mp4, images/<id>/cover/1200.webp, ...), so the switch is a host swap.

     bun scripts/mirror-media.ts download            fetch every file the catalogue uses into media/ (resumable)
     bun scripts/mirror-media.ts upload [--bucket lookap-media]   put each into R2 with wrangler, immutable cache headers
     bun scripts/mirror-media.ts verify              HEAD every file on MEDIA_HOST, compare sizes with media/
     bun scripts/mirror-media.ts switch              rewrite src/lib/catalog.ts to MEDIA_HOST (only after verify passes)

   Needs `wrangler login` (or CLOUDFLARE_API_TOKEN) for upload. The 1080p files are included where they exist: the
   measuring scripts read them. */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CATALOG } from "../src/lib/catalog";

const FROM = "cdn.vibrant.design";
const HOST = process.env.MEDIA_HOST ?? "cdn.openhorizonlabs.tech";
const args = process.argv.slice(2), cmd = args[0];
const flag = (n: string, d: string) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const BUCKET = flag("--bucket", "lookap-media");
const DIR = "media";
const TYPES: Record<string, string> = { ".mp4": "video/mp4", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml" };

/* every vibrant file the catalogue links, plus each clip's 1080p sibling */
const urls = new Set<string>();
for (const r of CATALOG) for (const u of [r.poster, r.video]) if (u?.includes(FROM)) {
  urls.add(u);
  if (u.includes("/720p.mp4")) urls.add(u.replace("/720p.mp4", "/1080p.mp4"));
}
const key = (u: string) => new URL(u).pathname.slice(1);
const local = (u: string) => path.join(DIR, key(u));
const list = [...urls].sort();

async function pool<T>(items: T[], n: number, fn: (t: T) => Promise<void>) {
  let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) await fn(items[i++]); }));
}

if (cmd === "download") {
  let got = 0, skipped = 0, missing = 0, bytes = 0;
  await pool(list, 12, async (u) => {
    const f = local(u);
    if (existsSync(f) && statSync(f).size > 0) { skipped++; bytes += statSync(f).size; return; }
    const res = await fetch(u).catch(() => null);
    if (!res || !res.ok) { missing++; return; }
    const buf = Buffer.from(await res.arrayBuffer());
    mkdirSync(path.dirname(f), { recursive: true }); writeFileSync(f, buf); got++; bytes += buf.length;
  });
  const have = list.filter((u) => existsSync(local(u)));
  writeFileSync(path.join(DIR, "manifest.json"), JSON.stringify(have.map((u) => ({ key: key(u), size: statSync(local(u)).size })), null, 0));
  console.log(`${got} downloaded, ${skipped} already here, ${missing} not on ${FROM} (1080p that does not exist); ${(bytes / 1e9).toFixed(2)} GB in ${DIR}/`);
} else if (cmd === "upload") {
  const man = JSON.parse(readFileSync(path.join(DIR, "manifest.json"), "utf8")) as { key: string; size: number }[];
  let ok = 0; const bad: string[] = [];
  await pool(man, 6, async ({ key: k }) => {
    const r = spawnSync("wrangler", ["r2", "object", "put", `${BUCKET}/${k}`, "--file", path.join(DIR, k), "--remote",
      "--content-type", TYPES[path.extname(k)] ?? "application/octet-stream", "--cache-control", "public, max-age=31536000, immutable"], { encoding: "utf8" });
    if (r.status === 0) ok++; else bad.push(`${k}: ${(r.stderr || r.stdout).trim().split("\n").pop()}`);
  });
  console.log(`${ok} of ${man.length} uploaded to ${BUCKET}${bad.length ? `\nfailed:\n  ${bad.slice(0, 10).join("\n  ")}` : ""}`);
} else if (cmd === "verify") {
  const man = JSON.parse(readFileSync(path.join(DIR, "manifest.json"), "utf8")) as { key: string; size: number }[];
  const bad: string[] = [];
  await pool(man, 16, async ({ key: k, size }) => {
    const res = await fetch(`https://${HOST}/${k}`, { method: "HEAD" }).catch(() => null);
    const len = Number(res?.headers.get("content-length") ?? -1);
    if (!res || !res.ok || len !== size) bad.push(`${k}: ${res ? res.status : "no answer"}, ${len} bytes against ${size}`);
  });
  console.log(bad.length ? `${bad.length} of ${man.length} not right on ${HOST}:\n  ${bad.slice(0, 15).join("\n  ")}` : `all ${man.length} files on ${HOST} match`);
  if (bad.length) process.exit(1);
} else if (cmd === "switch") {
  const f = "src/lib/catalog.ts", s = readFileSync(f, "utf8"), n = s.split(`https://${FROM}/`).length - 1;
  writeFileSync(f, s.replaceAll(`https://${FROM}/`, `https://${HOST}/`));
  console.log(`${n} links in ${f} now point at ${HOST}; add it to next.config images.remotePatterns`);
} else {
  console.error("usage: bun scripts/mirror-media.ts download | upload [--bucket name] | verify | switch"); process.exit(2);
}
