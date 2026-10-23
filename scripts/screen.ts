/* A filmed screen, straightened. Some catalogue clips are a camera pointed at a monitor or a phone, at an angle, with
   the room around it. The design is the page on that screen, not the room: this finds the screen, straightens it into
   a flat clip at the page's own proportions, and makes that the entry's source, so the brief, the keyframes, the
   rubric, the checker and the MCP all see the page.

     bun --conditions=react-server scripts/screen.ts <slug> [--model opus] [--dry]

   1. A vision model reads frames and returns how the clip was captured (screen: a screen recording, virtual camera
      moves included; mockup: a rendered device; filmed: a real camera on a real screen) and, for a filmed screen, the
      four corners of the visible page area at a still moment (may lie outside the frame when the screen is cut off),
      the page's real aspect, and whether the camera holds still.
   2. For filmed: ffmpeg's perspective filter maps those corners to a flat frame; the original clip is kept as
      measure/<id>/original.mp4, the straightened one becomes measure/<id>/source.mp4, and measure, drafts and the
      rubric are rebuilt from it. src/lib/screens.json carries the corners so the server warps the CDN clip the same
      way. Anything of the page the camera never saw is black in the flat clip, and the rubric is told so.
   A hand-held camera that moves is warped with the corners of one moment; the flat clip then wobbles a little, which
   the notes say. */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bySlug } from "../src/lib/data";
import { clipId, draftFor } from "../src/lib/drafts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const flag = (n: string, d: string) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
if (!slug) { console.error("usage: bun --conditions=react-server scripts/screen.ts <slug> [--model opus] [--dry]"); process.exit(2); }
const e = bySlug(slug), d = e && draftFor(e), id = e && clipId(e);
if (!e || !d || !id) { console.error(`no draft for ${slug}`); process.exit(2); }
const mdir = path.join(ROOT, "measure", id);
const original = path.join(mdir, "original.mp4"), source = path.join(mdir, "source.mp4");
const clip = existsSync(original) ? original : source;
if (!existsSync(clip)) { console.error(`no clip at ${source}`); process.exit(2); }
const probe = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height,r_frame_rate,duration", "-of", "csv=p=0", clip], { encoding: "utf8" }).stdout.trim().split(",");
const W = Number(probe[0]), H = Number(probe[1]), DUR = Number(probe[3]);
const dir = path.join(ROOT, "factory", slug, ".screen");
mkdirSync(dir, { recursive: true });
const times = [0.1, DUR * 0.25, DUR * 0.5, DUR * 0.75].map((t) => Number(t.toFixed(2)));
for (const t of times) { const f = path.join(dir, `${t}.png`); if (!existsSync(f)) spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", String(t), "-i", clip, "-frames:v", "1", f]); }

type Found = { capture: "screen" | "mockup" | "filmed"; why: string; at: number; corners: { tl: [number, number]; tr: [number, number]; br: [number, number]; bl: [number, number] } | null; aspect: number | null; still: boolean; page: string };
const SCHEMA = { type: "object", additionalProperties: false, required: ["capture", "why", "at", "corners", "aspect", "still", "page"], properties: {
  capture: { type: "string", enum: ["screen", "mockup", "filmed"] }, why: { type: "string" }, at: { type: "number" },
  corners: { type: ["object", "null"], additionalProperties: false, required: ["tl", "tr", "br", "bl"], properties: Object.fromEntries(["tl", "tr", "br", "bl"].map((k) => [k, { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 }])) },
  aspect: { type: ["number", "null"] }, still: { type: "boolean" }, page: { type: "string" } } };
const prompt = `You decide how a design clip was captured and, for a real camera filming a real screen, where the page is.
Frames of the clip (${W} x ${H} px, ${DUR.toFixed(1)} s), Read every one:
${times.map((t) => `  - ${path.join(dir, `${t}.png`)} at ${t}s`).join("\n")}
You may measure with up to eight probe calls: bun scripts/probe.ts ${slug} --zoom x,y,w,h --t t (a crop at up to 4x), --row y --t t or --col x --t t (light and dark runs along a line: a screen edge shows as a run boundary).

capture: "screen" for a screen recording, even with a virtual camera that zooms, pans or tilts in software (crisp pixels, no room, no glare); "mockup" for a rendered device or 3D mock-up on a flat stage; "filmed" for a real camera pointed at a real monitor, laptop or phone: room or desk visible, glare, moiré, hand-held shake, a lens.
For "filmed" only: corners of the visible page area (the browser or app viewport, inside the bezel and below any browser tabs and address bar) at a moment when the camera is steadiest, in frame pixels, as tl, tr, br, bl. A corner may lie outside the frame (negative, or beyond ${W} x ${H}) when the screen is cut off: extend the screen's edges as straight lines and give their intersection. Zoom each corner region before you settle it. aspect: the page area's real width / height (a desktop browser viewport is usually 1.5 to 1.8, a phone 0.45 to 0.5). still: whether the screen stays within about 10 px of those corners over the whole clip. page: one line naming what the page is.
For "screen" and "mockup": corners and aspect null.`;
const env = { ...process.env } as NodeJS.ProcessEnv; delete env.CLAUDECODE;
/* two independent reads: one decides the capture, both decide the corners, averaged, because a single estimate of a
   corner that lies outside the frame can move by a hundred pixels between reads */
const read = () => {
  const run = spawnSync("claude", ["-p", prompt, "--output-format", "json", "--model", flag("--model", "opus"), "--max-budget-usd", "2", "--allowedTools", "Read", `Bash(bun scripts/probe.ts ${slug}:*)`, "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}', "--json-schema", JSON.stringify(SCHEMA)], { cwd: ROOT, env, encoding: "utf8", maxBuffer: 1 << 26 });
  let o: { structured_output?: Found; total_cost_usd?: number; result?: string } = {};
  try { o = JSON.parse(String(run.stdout).trim().split("\n").pop() ?? "{}"); } catch { /* below */ }
  return { f: o.structured_output, cost: o.total_cost_usd ?? 0, err: (o.result ?? run.stderr ?? "").slice(-600) };
};
const r1 = read();
if (!r1.f) { console.error(`screen read failed: ${r1.err}`); process.exit(1); }
let f: Found = r1.f, spent = r1.cost;
if (f.capture === "filmed" && f.corners) {
  const r2 = read(); spent += r2.cost;
  if (r2.f?.capture === "filmed" && r2.f.corners) {
    const avg = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const c1 = f.corners, c2 = r2.f.corners;
    const spread = Math.max(...(["tl", "tr", "br", "bl"] as const).map((k) => Math.hypot(c1[k][0] - c2[k][0], c1[k][1] - c2[k][1])));
    f = { ...f, corners: { tl: avg(c1.tl, c2.tl), tr: avg(c1.tr, c2.tr), br: avg(c1.br, c2.br), bl: avg(c1.bl, c2.bl) }, aspect: f.aspect && r2.f.aspect ? (f.aspect + r2.f.aspect) / 2 : f.aspect ?? r2.f.aspect };
    console.log(`two reads agree within ${Math.round(spread)} px on the corners; averaged`);
  }
}
const cost = spent.toFixed(2);
writeFileSync(path.join(dir, "found.json"), JSON.stringify(f, null, 1));
if (f.capture !== "filmed" || !f.corners) { console.log(`${slug}: ${f.capture} (${f.why}); nothing to straighten, $${cost}`); process.exit(0); }

/* the flat size: the longer of the top and bottom edges as the width (no upscaling past 1.25x of what the camera
   saw), the page's aspect for the height, both even */
const len = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const c = f.corners;
const seen = Math.max(len(c.tl, c.tr), len(c.bl, c.br));
const aspect = f.aspect && f.aspect > 0.3 && f.aspect < 3 ? f.aspect : seen / Math.max(len(c.tl, c.bl), len(c.tr, c.br));
const ow = Math.round(Math.min(1600, Math.max(720, seen * 1.25)) / 2) * 2, oh = Math.round(ow / aspect / 2) * 2;
const pts = [c.tl, c.tr, c.bl, c.br].flat().map((v) => v.toFixed(1)).join(":");
const vf = `perspective=${pts}:interpolation=cubic:sense=source,scale=${ow}:${oh}:flags=lanczos`;
console.log(`${slug}: filmed (${f.page}); corners ${JSON.stringify(c)} at ${f.at}s, ${f.still ? "camera still" : "camera moves: one warp, the flat clip will wobble"}; flat ${ow}x${oh} (aspect ${aspect.toFixed(2)}), $${cost}`);
if (args.includes("--dry")) {
  spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", String(f.at), "-i", clip, "-frames:v", "1", "-vf", vf, path.join(dir, "flat.png")]);
  console.log(`dry run: ${path.relative(ROOT, path.join(dir, "flat.png"))}`);
  process.exit(0);
}

/* the flat clip becomes the source; the original is kept */
if (!existsSync(original)) renameSync(source, original);
const tmp = path.join(dir, `${id}.mp4`);
const enc = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", original, "-vf", vf, "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p", "-an", tmp], { encoding: "utf8" });
if (enc.status !== 0) { console.error(enc.stderr); renameSync(original, source); process.exit(1); }
copyFileSync(tmp, source);
writeFileSync(path.join(mdir, "screen.json"), JSON.stringify({ slug, capture: "filmed", corners: c, at: f.at, still: f.still, page: f.page, source: { w: W, h: H }, flat: { w: ow, h: oh }, aspect }, null, 1));
/* rebuild the measurement from the flat clip: measure, then the packed drafts (their stored frames are regenerated) */
const m = spawnSync("bun", ["scripts/measure.ts", tmp, "--out", "measure"], { cwd: ROOT, encoding: "utf8" });
if (m.status !== 0) { console.error(m.stderr.slice(-800)); process.exit(1); }
rmSync(path.join(ROOT, "public", "drafts", id), { recursive: true, force: true });
spawnSync("bun", ["scripts/build-drafts.ts"], { cwd: ROOT, encoding: "utf8" });
rmSync(tmp, { force: true });
/* the server's copy of the warp */
const sp = path.join(ROOT, "src", "lib", "screens.json");
const all = existsSync(sp) ? (JSON.parse(readFileSync(sp, "utf8")) as Record<string, unknown>) : {};
all[id] = { slug, corners: c, source: { w: W, h: H }, flat: { w: ow, h: oh } };
writeFileSync(sp, JSON.stringify(all, null, 1));
/* the rubric and the factory's caches were written against the filmed frame */
for (const p of ["rubric.json", ".ref", "diff", "judge"]) rmSync(path.join(ROOT, "factory", slug, p), { recursive: true, force: true });
const r = spawnSync("bun", ["--conditions=react-server", "scripts/rubric.ts", slug, "--force"], { cwd: ROOT, encoding: "utf8" });
console.log(r.stdout.trim().split("\n").pop());
console.log(`${slug}: the entry's source is now the flat ${ow}x${oh} page; the filmed clip is ${path.relative(ROOT, original)}`);
