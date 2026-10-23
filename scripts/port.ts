/* Port a finished rebuild to React + Tailwind + Motion, verified against the clip.

     bun --conditions=react-server scripts/port.ts <slug> [--model opus] [--budget 6]

   Input: factory/<slug>/index.html, the HTML rebuild that already passed its checklist. Output:
   factory/<slug>/react/Rebuild.tsx, one React 19 component styled with Tailwind v4 utility classes and animated with
   Motion (motion/react), that a Max key receives from get_rebuild with stack "react". A headless Claude Code session
   writes it and scores it with scripts/port-check.ts until it matches the HTML file it came from; the record goes to
   factory/<slug>/react/port.json. The component keeps one unit, --u, equal to one source pixel, so it scales like the
   HTML file does: set --u on any parent (or pass unit) and every size follows. */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const flag = (n: string, d: string) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
if (!slug) { console.error("usage: bun --conditions=react-server scripts/port.ts <slug>"); process.exit(2); }
const dir = path.join(ROOT, "factory", slug), rdir = path.join(dir, "react");
if (!existsSync(path.join(dir, "index.html"))) { console.error(`no rebuild at factory/${slug}/index.html`); process.exit(2); }
mkdirSync(rdir, { recursive: true });
const rel = path.relative(ROOT, dir);
const check = `bun --conditions=react-server scripts/port-check.ts ${slug}`;

const prompt = `Port the finished rebuild at ${rel}/index.html to one React component at ${rel}/react/Rebuild.tsx, using React 19, Tailwind CSS v4 and Motion (the motion package, imported from "motion/react"). The HTML file is verified against the designer's clip: the port must look and move exactly like it. Read it in full first, and ${rel}/NOTES.md for what it measured.

The component
- First line "use client". export default function Rebuild({ demo = false, unit, className }: { demo?: boolean; unit?: string; className?: string }). Also export const fonts: string[] with the Google Fonts stylesheet URLs the HTML file loads (the app adds them; the component does not insert <link> tags).
- One unit: every size is calc(N * var(--u)) as in the HTML, written as Tailwind arbitrary values such as w-[calc(376*var(--u))] or inside style. The root element sets --u only when unit is passed (style={unit ? { ["--u" as string]: unit } : undefined}); otherwise it inherits --u from the page. Keep the stage's exact size, overflow hidden and background.
- Styling: Tailwind utilities for layout, spacing, type, colours, radii and simple shadows. A multi-layer gradient, a mask, a filter chain or a long box-shadow stack that would be unreadable as a class goes in a style object or one small <style> string scoped under a unique class; copy every value from the HTML, never round or invent one.
- Motion: every animation in the HTML becomes Motion. Loops become motion components with animate keyframes, transition { duration, ease (cubic-bezier as an array), times, repeat: Infinity, delay }. Sequences become useAnimate with an array of steps at the same moments. Hover, press and drag become whileHover, whileTap, drag or state, with the same values and timings. demo true replays the clip's timeline from mount exactly as the HTML's ?demo=1 does (same start times, durations and easings); demo false behaves like the HTML without ?demo. useReducedMotion turns the timeline and entrances off. Measured values that the HTML drives from its script (an SVG path, a generated list) come over as the same code in a useMemo or useEffect.
- No other packages than react and motion. Images or data URIs in the HTML stay as they are. Credit the designer in a comment at the top with the source link from the HTML header.

Check it: \`${check}\`. It bundles the component, compiles its Tailwind classes, mounts it with demo, photographs it in real time at the clip's moments and prints the pixel score, whether it moves where the clip moves, whether it scales at half size, and the score the HTML file got. Read ${rel}/react/side.png (the clip left, the port right, one row per moment). It also type-checks the file in strict mode on its own, and runs the same hovers, presses and drags on the HTML file and on the port and says which gestures answer differently. The port is done when its score is within 4 of the HTML file's, it moves where the clip moves, it scales, it has no type errors, and every gesture answers as in the HTML file. Fix the largest differences first and check again; stop after five checks.

Then write ${rel}/react/PORT.md: how to use it in a Next.js or Vite app (install: npm i motion; Tailwind v4 set up; add the fonts; set --u or pass unit; demo), the final scores, and anything that differs from the HTML file.

Do not change any file outside ${rel}/react/. Do not run anything other than the check.`;

const env = { ...process.env } as NodeJS.ProcessEnv; delete env.CLAUDECODE;
const t0 = Date.now();
const run = spawnSync("claude", ["-p", prompt, "--output-format", "json", "--model", flag("--model", "opus"), "--max-budget-usd", flag("--budget", "6"), "--permission-mode", "acceptEdits", "--allowedTools", "Read", "Write", "Edit", `Bash(${check}:*)`, "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}'], { cwd: ROOT, env, encoding: "utf8", maxBuffer: 1 << 28 });
let o: { result?: string; total_cost_usd?: number; num_turns?: number; terminal_reason?: string; modelUsage?: Record<string, { inputTokens: number; outputTokens: number; cacheReadInputTokens: number; cacheCreationInputTokens: number }> } = {};
try { o = JSON.parse(String(run.stdout).trim().split("\n").pop() ?? "{}"); } catch { /* below */ }
/* the final score, from a last check of the file as left */
const final = existsSync(path.join(rdir, "Rebuild.tsx")) ? spawnSync("bun", ["--conditions=react-server", "scripts/port-check.ts", slug], { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 26 }).stdout : "";
const score = Number(final.match(/^score (\d+)/m)?.[1] ?? NaN);
const orig = Number(final.match(/scored (\d+) on its last/)?.[1] ?? NaN);
const scales = /^scale: scales/m.test(final);
const moves = /render changes where the clip changes|clip does not move/.test(final);
const typed = /^types: clean/m.test(final);
/* one gesture may read differently from noise alone (the HTML file against itself shows as much); more is a port that answers differently */
const im = final.match(/^interactions: (?:the port answers like|(\d+) of)/m);
const interacts = Boolean(im) && (!im![1] || Number(im![1]) <= 1);
const tok = Object.values(o.modelUsage ?? {}).reduce((s, m) => ({ written: s.written + m.outputTokens, read: s.read + m.inputTokens + m.cacheReadInputTokens + m.cacheCreationInputTokens }), { written: 0, read: 0 });
const rec = { slug, stack: "react-19 + tailwind-4 + motion", score: Number.isFinite(score) ? score : null, html: Number.isFinite(orig) ? orig : null, scales, moves, typed, interacts, ok: Number.isFinite(score) && Number.isFinite(orig) && score >= orig - 4 && scales && moves && typed && interacts, costUsd: Number((o.total_cost_usd ?? 0).toFixed(2)), minutes: Number(((Date.now() - t0) / 60000).toFixed(1)), turns: o.num_turns ?? null, tokens: tok, ended: o.terminal_reason ?? "done", at: new Date().toISOString() };
writeFileSync(path.join(rdir, "port.json"), JSON.stringify(rec, null, 1));
console.log(`${slug}: ${rec.ok ? "port matches" : "port needs review"}: score ${rec.score ?? "-"} against the HTML's ${rec.html ?? "-"}, ${scales ? "scales" : "does not scale"}, ${moves ? "moves with the clip" : "motion off"}; $${rec.costUsd}, ${rec.minutes} min`);
