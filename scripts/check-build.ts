/* Check a rebuild against the designer's keyframes, the way check_rebuild does over MCP, but locally and for every
   keyframe at once. Renders the HTML at the clip's frame size in headless Chrome, seeks every animation on the page to
   each keyframe's time, screenshots, and diffs against the keyframe (draft or recipe). Writes, next to the HTML:
   check.json (scores and the largest differences), kfN.png (the render at each keyframe) and side.png (designer on
   the left, the render on the right, one row per keyframe). Prints the summary an agent reads.

     bun --conditions=react-server scripts/check-build.ts <slug> [--html factory/<slug>/index.html]

   Seeking works for CSS animations, transitions and Web Animations started at load; JS timers cannot be seeked, which
   is why the factory prompt forbids them for the timeline. */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { bySlug } from "../src/lib/data";
import { recipeFor } from "../src/lib/registry";
import { draftFor } from "../src/lib/drafts";
import { compareBuild } from "../src/lib/compare";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
if (!slug) { console.error("usage: bun --conditions=react-server scripts/check-build.ts <slug> [--html path]"); process.exit(2); }
const flag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const html = path.resolve(ROOT, flag("--html") ?? `factory/${slug}/index.html`);
const out = path.dirname(html);
if (!existsSync(html)) { console.error(`no file at ${html}`); process.exit(2); }

const e = bySlug(slug);
if (!e) { console.error(`no entry ${slug}`); process.exit(2); }
const recipe = recipeFor(e), draft = recipe ? undefined : draftFor(e);
if (!recipe && !draft) { console.error(`no measurement for ${slug}`); process.exit(2); }
const frame: { w: number; h: number; crop?: [number, number, number, number] } = recipe?.frame ?? draft!.frame;
const frames = recipe?.keyframes ?? draft!.keyframes;
const elements = recipe?.elements ?? draft!.elements.map((d, i) => ({ name: `draft ${i + 1} ${d.fill}`, box: d.box, fill: d.fill }));
const W = frame.crop ? frame.crop[2] : frame.w, H = frame.crop ? frame.crop[3] : frame.h;

/* headless Chrome over CDP, one page */
const port = 9400 + Math.floor(Math.random() * 100);
const profile = path.join(out, ".chrome");
mkdirSync(profile, { recursive: true });
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars", `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, `--window-size=${W},${H}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let targets: { type: string; webSocketDebuggerUrl: string }[] = [];
for (let i = 0; i < 40 && !targets.length; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(250); } }
const page = targets.find((t) => t.type === "page");
if (!page) { chrome.kill(); console.error("Chrome did not start"); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map<number, (v: { result: Record<string, unknown> }) => void>();
ws.onmessage = (m) => { const d = JSON.parse(String(m.data)); if (d.id && pending.has(d.id)) { pending.get(d.id)!(d); pending.delete(d.id); } };
const send = (method: string, params: Record<string, unknown> = {}) => new Promise<{ result: Record<string, unknown> }>((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression: string) => ((await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result as { result: { value: unknown } }).result.value;

await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: `file://${html}` });
await sleep(900);
await ev("document.fonts ? document.fonts.ready.then(() => true) : true");
const animations = Number(await ev("document.getAnimations().length"));

type Row = { keyframe: string; at: number; score: number; overall: number; elements: unknown[]; regions: unknown[] };
const rows: Row[] = [];
const panels: Buffer[] = [];
const SCALE = Math.min(1, 760 / W);
const pw = Math.round(W * SCALE), ph = Math.round(H * SCALE);
for (const kf of frames) {
  /* everything on the page jumps to this moment; the page itself is not reloaded, so fonts and layout are settled */
  await ev(`document.getAnimations().forEach((a) => { try { a.pause(); a.currentTime = ${Math.round(kf.at * 1000)}; } catch {} }); true`);
  await sleep(150);
  const shot = Buffer.from(String(((await send("Page.captureScreenshot", { format: "png" })).result as { data: string }).data), "base64");
  const mine = path.join(out, `${kf.name}.png`);
  writeFileSync(mine, shot);
  const ref = path.join(ROOT, "public", kf.src.replace(/^\//, ""));
  const r = await compareBuild(ref, shot, frame, elements, kf === frames[0]);
  rows.push({ keyframe: kf.name, at: kf.at, score: r.score, overall: r.overall, elements: r.elements.slice(0, 3), regions: r.regions.slice(0, 3) });
  let refImg = sharp(ref);
  if (frame.crop) refImg = refImg.extract({ left: frame.crop[0], top: frame.crop[1], width: frame.crop[2], height: frame.crop[3] });
  const left = await refImg.resize(pw, ph, { fit: "fill" }).png().toBuffer();
  const right = await sharp(shot).resize(pw, ph, { fit: "fill" }).png().toBuffer();
  panels.push(await sharp({ create: { width: pw * 2 + 8, height: ph, channels: 3, background: "#ff3b30" } }).composite([{ input: left, left: 0, top: 0 }, { input: right, left: pw + 8, top: 0 }]).png().toBuffer());
}
ws.close(); chrome.kill();

/* side.png: rows of designer | yours, red gutter between and below so the rows read apart */
const side = sharp({ create: { width: pw * 2 + 8, height: (ph + 8) * panels.length - 8, channels: 3, background: "#ff3b30" } })
  .composite(panels.map((p, i) => ({ input: p, left: 0, top: i * (ph + 8) })));
await side.png().toFile(path.join(out, "side.png"));

const score = Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length);
const prev = existsSync(path.join(out, "check.json")) ? (JSON.parse(readFileSync(path.join(out, "check.json"), "utf8")) as { runs?: number }).runs ?? 0 : 0;
const result = { slug, measured: recipe ? "recipe" : "draft", frame: { w: W, h: H }, animations, score, keyframes: rows, runs: prev + 1, at: new Date().toISOString() };
writeFileSync(path.join(out, "check.json"), JSON.stringify(result, null, 1));

/* the summary the agent reads */
console.log(`score ${score} over ${rows.length} keyframe${rows.length > 1 ? "s" : ""} (run ${result.runs}); ${animations} animation${animations === 1 ? "" : "s"} on the page${animations ? "" : ": nothing to seek, every keyframe shows the load state"}`);
for (const r of rows) {
  console.log(`\n${r.keyframe} at ${r.at}s: score ${r.score}, mean difference ${r.overall}`);
  for (const el of r.elements as { name: string; box: number[]; reference: string; yours: string; delta: number }[]) console.log(`  box ${el.name} [${el.box.join(",")}] reference ${el.reference} yours ${el.yours} delta ${el.delta}`);
  for (const c of r.regions as { cell: string; box: number[]; delta: number; over: string[] }[]) console.log(`  region ${c.cell} [${c.box.join(",")}] delta ${c.delta}${c.over.length ? ` under: ${c.over.join(", ")}` : ""}`);
}
console.log(`\nside by side: ${path.relative(ROOT, path.join(out, "side.png"))} (designer left, yours right, one row per keyframe). ${recipe ? "Element boxes are measured." : "Element boxes are a draft: trust the regions and the picture over them."}`);
