/* The rubric for one entry: the checklist a rebuild is judged against, written once per entry from the clip itself.

     bun --conditions=react-server scripts/rubric.ts <slug> [--model opus] [--budget 3] [--force]

   A pixel score cannot tell a drawn ring from a glass lens, a nine-spoke spinner from a disc, or dim copy from white
   copy, and a rebuild that reaches the number can still look wrong. What tracks human judgement (WebVR, 2026) is a
   list of binary, atomic, visual checks per element, each judged by looking. This script asks a vision model to read
   the clip's keyframes, its mid-phase frames and its contact sheet beside the draft measurement, and to write that
   list: every element it can see, with its box in frame pixels and its class, and 20 to 80 criteria, each one thing
   (present, positioned, styled, reads, moves) with a box and a moment where the judge should look.

   The same pass classifies every piece of imagery, which decides how a rebuild may handle it:
     css         gradients, rings, lenses, spinners, shadows, text art: must be drawn
     structured  icons, logos, simple illustrations: an original SVG approximation, judged on silhouette and colour
     photo       photographs, paintings, screenshots of other work: not copied from the clip; a placeholder of the
                 measured size and palette (probe --placeholder), unless factory/<slug>/licence.json allows sampling

   Writes factory/<slug>/rubric.json and the frames it read to factory/<slug>/.ref/. Costs one model call per entry
   (about a dollar on opus); the file is kept and reused until --force. The judge in check-build.ts reads it. */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bySlug } from "../src/lib/data";
import { briefFor } from "../src/lib/registry";
import { clipId, draftFor } from "../src/lib/drafts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const flag = (n: string, d: string) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
if (!slug) { console.error("usage: bun --conditions=react-server scripts/rubric.ts <slug> [--model opus] [--budget 3] [--force]"); process.exit(2); }
const e = bySlug(slug);
const draft = e && draftFor(e);
if (!e || !draft) { console.error(`no draft measurement for ${slug}`); process.exit(2); }
const dir = path.join(ROOT, "factory", slug);
const out = path.join(dir, "rubric.json");
if (existsSync(out) && !args.includes("--force")) { console.log(`${path.relative(ROOT, out)} exists (${(JSON.parse(readFileSync(out, "utf8")) as Rubric).criteria.length} criteria); --force to rewrite`); process.exit(0); }
mkdirSync(path.join(dir, ".ref"), { recursive: true });

export type Criterion = { id: string; element: string; axis: "present" | "position" | "style" | "text" | "motion" | "imagery"; check: string; box: [number, number, number, number]; scope: "crop" | "frame"; at: number; then: number | null };
export type ImageryClass = "css" | "structured" | "photo";
export type Rubric = {
  slug: string; frame: { w: number; h: number }; at: string; model: string; costUsd: number;
  summary: string;
  elements: { name: string; box: [number, number, number, number]; kind: string; class: ImageryClass | null; note: string }[];
  criteria: Criterion[];
  imagery: { name: string; box: [number, number, number, number]; class: ImageryClass; what: string; at: number }[];
  moves: { element: string; what: string; from: number; to: number; px: number | null }[];
};

const id = clipId(e)!;
const clip = path.join(ROOT, "measure", id, "source.mp4");
const W = draft.frame.w, H = draft.frame.h;

/* the frames the model reads: every keyframe and mid-phase moment at full size, pulled from the clip when it is on
   disk, else the 720 px copies the site serves; plus the 2 fps contact sheet */
const D = draft.duration;
const times = [...draft.keyframes.map((k) => k.at), ...draft.phases.filter(([a, b]) => b - a >= 0.1).map(([a, b]) => Number(((a + b) / 2).toFixed(2))),
  /* and moments half a second after each keyframe, plus a few early ones: two frames a short time apart show what moves and which way */
  ...draft.keyframes.map((k) => Number((k.at + 0.5).toFixed(2))), 0.5, 1, 2.5]
  .filter((t) => t >= 0 && t <= D).filter((t, i, arr) => arr.findIndex((u) => Math.abs(u - t) < 0.15) === i).sort((a, b) => a - b).slice(0, 12);
const frames: { at: number; file: string }[] = [];
for (const t of times) {
  const file = path.join(dir, ".ref", `${t}.png`);
  if (!existsSync(file) && existsSync(clip)) spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", String(t), "-i", clip, "-frames:v", "1", file]);
  if (existsSync(file)) frames.push({ at: t, file });
}
if (!frames.length) for (const k of draft.keyframes) frames.push({ at: k.at, file: path.join(ROOT, "public", k.src) });
const sheet = draft.sheet ? path.join(ROOT, "public", draft.sheet.src) : null;
/* a denser sheet when the clip is here: 6 x 6 at a rate that covers the whole clip */
const dense = existsSync(clip) ? path.join(dir, ".ref", "sheet-36.png") : null;
if (dense && !existsSync(dense)) spawnSync("ffmpeg", ["-v", "error", "-y", "-i", clip, "-vf", `fps=${(36 / draft.duration).toFixed(4)},scale=320:-2,tile=6x6`, "-frames:v", "1", dense]);

/* difference views: each keyframe against half a second later, so the model sees what moves rather than reading it off the draft */
const diffs: string[] = [];
if (existsSync(clip)) for (const k of draft.keyframes.slice(0, 4)) {
  const a = k.at, b = Number(Math.min(D, k.at + 0.5).toFixed(2));
  if (b - a < 0.2) continue;
  const f = path.join(dir, "diff", `${a}-${b}.png`);
  if (!existsSync(f)) spawnSync("bun", ["scripts/probe.ts", slug, "--diff", `${a},${b}`], { cwd: ROOT, encoding: "utf8" });
  if (existsSync(f)) diffs.push(`  - ${f}: the clip at ${a}s, at ${b}s, and what changed between them (white)`);
}

const brief = briefFor(e);
const briefText = JSON.stringify({ title: brief.title, what: brief.what, traits: brief.traits, section: brief.section, tone: brief.tone, draft: brief.draft }, null, 1);

const SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["summary", "elements", "criteria", "imagery", "moves"],
  properties: {
    summary: { type: "string", description: "one paragraph: regions, alignment, type, radii, what moves and when" },
    elements: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "box", "kind", "class", "note"], properties: {
      name: { type: "string" }, box: { type: "array", items: { type: "number" }, minItems: 4, maxItems: 4 },
      kind: { type: "string", enum: ["surface", "text", "control", "icon", "image", "motion", "decoration", "chrome"] },
      class: { type: ["string", "null"], enum: ["css", "structured", "photo", null] },
      note: { type: "string" } } } },
    criteria: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "element", "axis", "check", "box", "scope", "at", "then"], properties: {
      id: { type: "string" }, element: { type: "string" },
      axis: { type: "string", enum: ["present", "position", "style", "text", "motion", "imagery"] },
      check: { type: "string" }, box: { type: "array", items: { type: "number" }, minItems: 4, maxItems: 4 },
      scope: { type: "string", enum: ["crop", "frame"] }, at: { type: "number" }, then: { type: ["number", "null"] } } } },
    imagery: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "box", "class", "what", "at"], properties: {
      name: { type: "string" }, box: { type: "array", items: { type: "number" }, minItems: 4, maxItems: 4 },
      class: { type: "string", enum: ["css", "structured", "photo"] }, what: { type: "string" }, at: { type: "number" } } } },
    moves: { type: "array", items: { type: "object", additionalProperties: false, required: ["element", "what", "from", "to", "px"], properties: {
      element: { type: "string" }, what: { type: "string" }, from: { type: "number" }, to: { type: "number" }, px: { type: ["number", "null"] } } } },
  },
} as const;

const prompt = `You write the checklist a rebuild of a designer's clip will be judged against. Read every image listed below with the Read tool before answering; the numbers in the draft measurement are a help, the frames are the truth.

The clip: "${e.title}" by ${e.authorName}, ${W} x ${H} px, ${draft.duration}s.
Frames at full size (frame px are the coordinates you use everywhere):
${frames.map((f) => `  - ${f.at}s: ${f.file}`).join("\n")}
Contact sheets, left to right then down:
${[dense ? `  - ${dense}: 36 frames evenly spaced over the ${draft.duration}s` : null, sheet ? `  - ${sheet}: 2 fps, ${draft.sheet!.cols} per row` : null].filter(Boolean).join("\n")}
What moves (three panels: the clip at a, at b, and the difference, white where pixels changed; cropped to the content):
${diffs.join("\n") || "  (no clip on disk: read the sheets)"}
Draft measurement (phases are measured spans of motion in seconds; motion rows are measured moves of the first keyframe's big parts and can be fooled by something passing over a region, so trust the difference views over them; elements are flat colour regions, a first pass that misses text and thin parts):
${briefText}

You may also run the probe to measure before you write, up to about ten calls (each prints numbers or writes an image you then Read):
  bun scripts/probe.ts ${slug} --diff a,b            what changed between two moments; try pairs 0.3 s and 1 s apart in different parts of the clip
  bun scripts/probe.ts ${slug} --track x --from a --to b [--class dark|light|red]   the top and bottom edge of that colour in column x per frame: when a thing starts and stops moving, how far, how fast
  bun scripts/probe.ts ${slug} --zoom x,y,w,h --t t  that crop of the clip at up to 4x, to count spokes, read small type, see a material's edge
  bun scripts/probe.ts ${slug} --col x --t t --hex a,b   exact colours down a column
Before writing any motion criterion, confirm with --diff or --track what moves and what stays. Before writing a count (spokes, dots, rows) or a material (glass, outline, blur), --zoom it.

Return, in the schema:
1. summary: one paragraph describing the layout and the motion as a designer would.
2. elements: every distinct thing a person can see, with its box [x, y, w, h] in frame px at its rest moment, its kind, and for anything pictorial its class: css (gradients, rings, glass, lenses, spinners, shadows, text art, anything CSS or SVG can draw exactly), structured (icons, logos, simple flat illustrations: an original SVG approximation is acceptable), photo (photographs, paintings, textured artwork, screenshots of other products: the clip's pixels may not be copied). class is null for plain UI.
3. criteria: 20 to 80 binary checks. Rules: visual proof only (what a person sees in the frames, never HTML or class names); extreme atomicity (one attribute per criterion: one position, one colour, one count, one text, one move); decomposed per element and per axis: present (it exists at all), position (where, with numbers), style (colour, radius, weight, edge, material), text (the exact words, their size and brightness), motion (what changes between two moments, with the distance and the timing), imagery (how a pictorial region is handled per its class: a css one is drawn as in the clip; a structured one is an original drawing with the same silhouette and colour; a photo one is a placeholder of the same box and dominant colours, or the real texture only under licence). Each criterion names the box to look at and the moment at (seconds); motion criteria also give then, the second moment to compare with. scope is crop when the judge should look at the box at 2 to 3x, frame when the whole picture is the evidence (alignment, overall layout, a page that should have changed between two moments). Quote text exactly as read. Give numbers (px, counts, seconds) wherever the frames allow. Cover the things pixel diffs miss: material (a glass ring shows the background refracted at its rim, not an outline), counts (spokes, dots, rows), brightness of type, seams and tiles in textures, whether anything moves at all, the order and timing of moves. Write ids as c01, c02, ...
4. imagery: every pictorial region with its class and what it depicts, at a rest moment.
5. moves: the motion as a list: what moves, from when to when, how far in px when it can be read.`;

const model = flag("--model", "opus"), budget = flag("--budget", "3");
const env = { ...process.env } as NodeJS.ProcessEnv; delete env.CLAUDECODE;
const t0 = Date.now();
const run = spawnSync("claude", ["-p", prompt, "--output-format", "json", "--model", model, "--max-budget-usd", budget, "--allowedTools", "Read", `Bash(bun scripts/probe.ts ${slug}:*)`, "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}', "--json-schema", JSON.stringify(SCHEMA)], { cwd: ROOT, env, encoding: "utf8", maxBuffer: 1 << 26 });
type Out = { structured_output?: Omit<Rubric, "slug" | "frame" | "at" | "model" | "costUsd">; result?: string; total_cost_usd?: number; is_error?: boolean };
let o: Out = {};
try { o = JSON.parse(String(run.stdout).trim().split("\n").pop() ?? "{}"); } catch { /* below */ }
if (!o.structured_output) { console.error(`rubric failed: ${(o.result ?? String(run.stderr)).slice(-1500)}`); process.exit(1); }
const r = o.structured_output;
const clampBox = (b: number[]): [number, number, number, number] => { const x = Math.max(0, Math.min(W - 1, Math.round(b[0]))), y = Math.max(0, Math.min(H - 1, Math.round(b[1]))); return [x, y, Math.max(1, Math.min(W - x, Math.round(b[2]))), Math.max(1, Math.min(H - y, Math.round(b[3])))]; };
const rubric: Rubric = {
  slug, frame: { w: W, h: H }, at: new Date().toISOString(), model, costUsd: Number((o.total_cost_usd ?? 0).toFixed(3)),
  summary: r.summary,
  elements: r.elements.map((el) => ({ ...el, box: clampBox(el.box) })),
  criteria: r.criteria.map((c, i) => ({ ...c, id: c.id || `c${String(i + 1).padStart(2, "0")}`, box: clampBox(c.box), at: Math.max(0, Math.min(draft.duration, c.at)), then: c.then == null ? null : Math.max(0, Math.min(draft.duration, c.then)) })),
  imagery: r.imagery.map((m) => ({ ...m, box: clampBox(m.box) })),
  moves: r.moves,
};
writeFileSync(out, JSON.stringify(rubric, null, 1));
const byAxis = rubric.criteria.reduce<Record<string, number>>((s, c) => ({ ...s, [c.axis]: (s[c.axis] ?? 0) + 1 }), {});
console.log(`${path.relative(ROOT, out)}: ${rubric.criteria.length} criteria (${Object.entries(byAxis).map(([k, v]) => `${v} ${k}`).join(", ")}), ${rubric.elements.length} elements, ${rubric.imagery.length} imagery regions (${rubric.imagery.map((m) => `${m.name}: ${m.class}`).join("; ") || "none"}), $${rubric.costUsd} on ${model}, ${((Date.now() - t0) / 60000).toFixed(1)} min`);
