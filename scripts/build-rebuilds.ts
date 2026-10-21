/* Pack the factory's finished rebuilds into src/lib/rebuilds/factory.json, so the site's Live switch and the MCP's
   get_rebuild can serve them from Vercel. A rebuild ships when factory/<slug>/ has index.html, NOTES.md and build.json
   (who finished it, the metered agent run if there was one, what was done by hand, and the hint for the Live switch;
   the factory's result.json is the run's receipt and build.json is the file's record).
   Two copies of the file go in: the file as written (one source pixel per --u, with its header, notes and readable
   CSS: what get_rebuild sells) and the embed for the project page's frame: --u scaled to the frame, comments gone,
   CSS and script minified. The embed runs; it is not the documented file. Visitors who are not signed in see a
   recording instead of the frame: public/live/<slug>.mp4, the embed's own ?demo=1 replay rendered headlessly at
   30 fps (made once; --video remakes it). bun scripts/build-rebuilds.ts [--video] */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openPage, sleep } from "./chrome";
import { transform as css } from "lightningcss";
import * as swc from "next/dist/build/swc";

/* CSS through lightningcss, script through Next's own SWC (names mangled), comments and whitespace out of the markup */
const minifyCss = (code: string) => Buffer.from(css({ filename: "embed.css", code: Buffer.from(code), minify: true }).code).toString();
await swc.loadBindings();
const minifyJs = async (code: string) => (await swc.minify(code, { compress: true, mangle: true })).code;
async function minifyHtml(html: string) {
  const scripts: string[] = [];
  for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) scripts.push(await minifyJs(m[1]));
  let i = 0;
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<style>([\s\S]*?)<\/style>/g, (_, c: string) => `<style>${minifyCss(c)}</style>`)
    .replace(/<script>[\s\S]*?<\/script>/g, () => `<script>${scripts[i++]}</script>`)
    .replace(/>\s+</g, "><").replace(/\n\s*/g, "\n").trim();
}

export type FactoryRebuild = {
  slug: string; title: string; file: string; html: string; embed: string; needs: string[];
  frame: { w: number; h: number }; score: number | null;
  build: { model: string; modelId: string; date: string; run?: { model: string; turns: number; outputTokens: number; totalTokens: number; costUsd: number; minutes: number; score: number }; hand?: string };
  hint: string; pattern: string; preview: string | null;
};

/* the embed's demo replay as a clip: seek every animation to each frame time, screenshot, encode */
async function record(slug: string, embed: string, frame: { w: number; h: number }, seconds: number) {
  const tmp = join(tmpdir(), `lookap-live-${slug}`);
  rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  writeFileSync(join(tmp, "embed.html"), embed);
  const page = await openPage(`file://${join(tmp, "embed.html")}?demo=1`, frame.w, frame.h);
  const FPS = 30, n = Math.ceil(seconds * FPS);
  for (let i = 0; i < n; i++) {
    await page.ev(`document.getAnimations().forEach((a) => { try { a.pause(); a.currentTime = ${Math.round((i / FPS) * 1000)}; } catch {} }); true`);
    if (i === 0) await sleep(300);
    writeFileSync(join(tmp, `${String(i).padStart(4, "0")}.png`), await page.shot());
  }
  page.close();
  mkdirSync("public/live", { recursive: true });
  const out = join("public", "live", `${slug}.mp4`);
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(FPS), "-i", join(tmp, "%04d.png"), "-vf", "scale=960:-2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "27", "-movflags", "+faststart", out]);
  rmSync(tmp, { recursive: true, force: true });
  if (r.status !== 0) { console.error(`${slug}: ffmpeg failed: ${String(r.stderr)}`); return null; }
  return `/live/${slug}.mp4`;
}

const out: Record<string, FactoryRebuild> = {};
for (const slug of existsSync("factory") ? readdirSync("factory").sort() : []) {
  const dir = join("factory", slug);
  if (!["index.html", "NOTES.md", "build.json"].every((f) => existsSync(join(dir, f)))) continue;
  const html = readFileSync(join(dir, "index.html"), "utf8");
  const build = JSON.parse(readFileSync(join(dir, "build.json"), "utf8")) as FactoryRebuild["build"] & { hint: string };
  const check = existsSync(join(dir, "check.json")) ? (JSON.parse(readFileSync(join(dir, "check.json"), "utf8")) as { score: number; frame: { w: number; h: number } }) : null;
  const frame = check?.frame ?? { w: Number(html.match(/width: calc\((\d+) \* var\(--u\)\)/)?.[1] ?? 0), h: Number(html.match(/height: calc\((\d+) \* var\(--u\)\)/)?.[1] ?? 0) };
  const notes = readFileSync(join(dir, "NOTES.md"), "utf8");
  const pattern = notes.split(/^## Pattern\s*$/m)[1]?.trim() ?? "";
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? slug;
  const needs = [...html.matchAll(/fonts\.googleapis\.com\/css2\?family=([^"&]+)/g)].map((m) => decodeURIComponent(m[1]).split(":")[0].replace(/\+/g, " ") + " (Google Fonts)");
  if (!html.includes("--u: 1px;")) { console.error(`${slug}: no "--u: 1px;" to scale for the embed, skipped`); continue; }
  const embed = await minifyHtml(html.replace("--u: 1px;", `--u: min(calc(100vw / ${frame.w}), calc(100vh / ${frame.h}));`)
    .replace(/(html, body \{[^}]*\})/, "$1\nbody { display: flex; align-items: center; justify-content: center; height: 100vh; }"));
  const { hint, ...rest } = build;
  /* the recording: the demo's length comes from the checker's last moment, or the file's own timeline comment */
  const seconds = Math.max(4, ...(existsSync(join(dir, "check.json")) ? (JSON.parse(readFileSync(join(dir, "check.json"), "utf8")) as { keyframes: { at: number }[] }).keyframes.map((k) => k.at + 0.5) : [0]), Number(html.match(/(\d+(?:\.\d+)?)s\s*(?:linear|ease)/)?.[1] ?? 0));
  const clip = join("public", "live", `${slug}.mp4`);
  const preview = existsSync(clip) && !process.argv.includes("--video") ? `/live/${slug}.mp4` : await record(slug, embed, frame, seconds);
  out[slug] = { slug, title, file: `${slug}.html`, html, embed, needs, frame, score: check?.score ?? null, build: rest, hint, pattern, preview };
  console.log(`${slug}: ${Math.round(html.length / 1024)} KB, embed ${Math.round(embed.length / 1024)} KB, ${frame.w}x${frame.h}, score ${check?.score ?? "-"}, needs ${needs.join(", ") || "nothing"}, preview ${preview ?? "none"}${preview && existsSync(clip) ? ` (${Math.round(readFileSync(clip).length / 1024)} KB, ${seconds}s)` : ""}`);
}
writeFileSync("src/lib/rebuilds/factory.json", JSON.stringify(out, null, 1));
console.log(`${Object.keys(out).length} rebuild${Object.keys(out).length === 1 ? "" : "s"} packed into src/lib/rebuilds/factory.json`);
