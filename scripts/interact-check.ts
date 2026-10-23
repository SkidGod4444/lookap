/* Does a React port answer the pointer like the HTML rebuild it came from? The same gestures run on both pages, not in
   demo mode: hover each control the rubric names, press it, release it, and drag it when the rebuild's hint says
   things are dragged. A screenshot after each step on both sides, compared with the checker's own difference. A step
   that differs far more than the two pages differ at rest means the port lost a hover, a click or a drag.

     bun --conditions=react-server scripts/interact-check.ts <slug> [--html factory/<slug>/index.html] [--port factory/<slug>/react/index.html]

   Prints one line per step and a verdict; writes factory/<slug>/react/interact.json. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { diff, raw } from "../src/lib/compare";
import { openPage, sleep, type Page } from "./chrome";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const flag = (n: string, d: string) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
if (!slug) { console.error("usage: bun --conditions=react-server scripts/interact-check.ts <slug>"); process.exit(2); }
const dir = path.join(ROOT, "factory", slug);
const htmlFile = path.resolve(ROOT, flag("--html", path.join(dir, "index.html")));
const portFile = path.resolve(ROOT, flag("--port", path.join(dir, "react", "index.html")));
if (!existsSync(htmlFile) || !existsSync(portFile)) { console.error("need both the HTML rebuild and the built port (run port-check first)"); process.exit(2); }
const check = JSON.parse(readFileSync(path.join(dir, "check.json"), "utf8")) as { frame: { w: number; h: number } };
const W = check.frame.w, H = check.frame.h;
type Box = [number, number, number, number];
const rubric = existsSync(path.join(dir, "rubric.json")) ? (JSON.parse(readFileSync(path.join(dir, "rubric.json"), "utf8")) as { elements: { name: string; box: Box; kind: string }[] }) : { elements: [] };
const build = existsSync(path.join(dir, "build.json")) ? (JSON.parse(readFileSync(path.join(dir, "build.json"), "utf8")) as { hint?: string }) : {};
const drags = /drag|pull|swipe|slide/i.test(build.hint ?? "");

/* the targets: the rubric's controls, then its other small parts, centred, at most eight */
const targets = [...rubric.elements.filter((e) => e.kind === "control"), ...rubric.elements.filter((e) => e.kind !== "control" && e.kind !== "chrome" && e.box[2] * e.box[3] < W * H * 0.25)]
  .filter((e, i, a) => a.findIndex((x) => x.name === e.name) === i).slice(0, 8)
  .map((e) => ({ name: e.name, box: e.box, x: Math.round(e.box[0] + e.box[2] / 2), y: Math.round(e.box[1] + e.box[3] / 2) }));
type Step = { label: string; act: (p: Page) => Promise<void>; box?: Box };
const steps: Step[] = [{ label: "at rest", act: async () => {} }];
for (const t of targets) {
  steps.push({ label: `hover ${t.name}`, box: t.box, act: async (p) => { await p.mouse("mouseMoved", t.x, t.y); await sleep(450); } });
  steps.push({ label: `press ${t.name}`, box: t.box, act: async (p) => { await p.mouse("mousePressed", t.x, t.y); await sleep(250); } });
  steps.push({ label: `release ${t.name}`, box: t.box, act: async (p) => { await p.mouse("mouseReleased", t.x, t.y); await sleep(650); } });
  if (drags) steps.push({ label: `drag ${t.name}`, box: t.box, act: async (p) => { await p.mouse("mousePressed", t.x, t.y); for (let k = 1; k <= 8; k++) { await p.mouse("mouseMoved", t.x, t.y + k * 12); await sleep(16); } await sleep(200); } }, { label: `let go of ${t.name}`, box: t.box, act: async (p) => { await p.mouse("mouseReleased", t.x, t.y + 96); await sleep(800); } });
}

async function run(file: string) {
  const p = await openPage(`file://${file}`, W, H);
  await sleep(1500); /* past a load-time entrance */
  const shots: Buffer[] = [];
  for (const s of steps) { await s.act(p); shots.push(await p.shot()); }
  p.close();
  return shots;
}
const [a, b] = [await run(htmlFile), await run(portFile)];
const { mkdirSync } = await import("node:fs");
const sharp = (await import("sharp")).default;
mkdirSync(path.join(dir, "react", "interact"), { recursive: true });
const rows: { step: string; diff: number }[] = [];
for (let i = 0; i < steps.length; i++) {
  const [ra, rb] = await Promise.all([raw(a[i], W, H), raw(b[i], W, H)]);
  rows.push({ step: steps[i].label, diff: Math.round(diff(ra, rb, W, [0, 0, W, H]) * 10) / 10 });
  /* the pair, side by side, for any step that reads as different */
  if (rows[rows.length - 1].diff > 4) {
    const sw = Math.round(W / 2), sh = Math.round(H / 2);
    const [pa, pb] = await Promise.all([sharp(a[i]).resize(sw, sh).png().toBuffer(), sharp(b[i]).resize(sw, sh).png().toBuffer()]);
    await sharp({ create: { width: sw * 2 + 8, height: sh, channels: 3, background: "#ff3b30" } }).composite([{ input: pa, left: 0, top: 0 }, { input: pb, left: sw + 8, top: 0 }]).png().toFile(path.join(dir, "react", "interact", `${i}.png`));
  }
}
const rest = rows[0].diff;
/* the question per gesture: did the part under the pointer respond, on each page? Measured as the change in that
   part's neighbourhood from the step before, on the same page, so a timeline that plays on its own on both pages,
   a little out of step, does not read as a broken hover */
const RESP = 3;
const grow = (b: Box): Box => { const x = Math.max(0, b[0] - 24), y = Math.max(0, b[1] - 24); return [x, y, Math.min(W - x, b[2] + 48), Math.min(H - y, b[3] + 48)]; };
const answers: { step: string; html: number; port: number; mismatch: boolean }[] = [];
for (let i = 1; i < steps.length; i++) {
  const box = steps[i].box ? grow(steps[i].box!) : ([0, 0, W, H] as Box);
  const [a0, a1, b0, b1] = await Promise.all([raw(a[i - 1], W, H), raw(a[i], W, H), raw(b[i - 1], W, H), raw(b[i], W, H)]);
  const dh = Math.round(diff(a0, a1, W, box) * 10) / 10, dp = Math.round(diff(b0, b1, W, box) * 10) / 10;
  answers.push({ step: steps[i].label, html: dh, port: dp, mismatch: (dh > RESP) !== (dp > RESP) && Math.abs(dh - dp) > RESP });
}
const bad = answers.filter((x) => x.mismatch);
const ok = bad.length === 0;
for (const x of answers) console.log(`  ${x.step}: the HTML ${x.html > RESP ? "responds" : "stays"} (${x.html}), the port ${x.port > RESP ? "responds" : "stays"} (${x.port})${x.mismatch ? "  <- differs" : ""}`);
console.log(`interactions: ${ok ? `the port answers like the HTML rebuild over ${answers.length} gestures` : `${bad.length} of ${answers.length} gestures answer differently: ${bad.map((x) => x.step).join("; ")}`} (whole frames at rest differ by ${rest})`);
writeFileSync(path.join(dir, "react", "interact.json"), JSON.stringify({ slug, ok, rest, gestures: answers, frames: rows, targets, drags, at: new Date().toISOString() }, null, 1));
