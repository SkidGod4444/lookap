/* Build a React port of a rebuild into a page the checker can score, then score it against the clip.

     bun --conditions=react-server scripts/port-check.ts <slug> [--quick]

   The port lives at factory/<slug>/react/Rebuild.tsx: a React 19 component styled with Tailwind v4 and animated with
   Motion (motion/react), that renders the rebuild at --u per source pixel. This bundles it with Bun, compiles its
   Tailwind classes with the Tailwind CLI, and writes factory/<slug>/react/index.html: the component on a page with
   --u: 1px on :root and the original file's Google Fonts. The timeline starts when the checker calls window.__go(),
   so the checker's --realtime mode can photograph each moment as it passes. Then it runs the checker on that page and
   prints the port's score beside the HTML rebuild's, so a port that drifted from the file it came from shows. */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
if (!slug) { console.error("usage: bun --conditions=react-server scripts/port-check.ts <slug> [--quick]"); process.exit(2); }
const dir = path.join(ROOT, "factory", slug), rdir = path.join(dir, "react");
const comp = path.join(rdir, "Rebuild.tsx");
if (!existsSync(comp)) { console.error(`no port at ${path.relative(ROOT, comp)}`); process.exit(2); }
mkdirSync(path.join(rdir, ".build"), { recursive: true });
const b = path.join(rdir, ".build");

/* the harness: mount on __go when the checker asks to wait, at once otherwise */
writeFileSync(path.join(b, "harness.tsx"), `import { createRoot } from "react-dom/client";
import Rebuild from "../Rebuild";
const q = new URLSearchParams(location.search);
const root = createRoot(document.getElementById("root")!);
const go = () => { (window as unknown as { __t0: number }).__t0 = performance.now(); root.render(<Rebuild demo={q.has("demo")} />); };
(window as unknown as { __go: () => void }).__go = go;
if (!q.has("wait")) go();
`);
/* --production: the production JSX runtime and NODE_ENV, so React's dev-only jsxDEV is never called */
const bundle = spawnSync("bun", ["build", path.join(b, "harness.tsx"), "--outfile", path.join(b, "bundle.js"), "--production", "--target", "browser"], { cwd: ROOT, encoding: "utf8" });
if (bundle.status !== 0) { console.error(`bundle failed:\n${bundle.stderr || bundle.stdout}`); process.exit(1); }
writeFileSync(path.join(b, "input.css"), `@import "tailwindcss";\n@source "../Rebuild.tsx";\n`);
const tw = spawnSync(path.join(ROOT, "node_modules", ".bin", "tailwindcss"), ["-i", path.join(b, "input.css"), "-o", path.join(b, "out.css"), "--minify"], { cwd: rdir, encoding: "utf8" });
if (tw.status !== 0) { console.error(`tailwind failed:\n${tw.stderr}`); process.exit(1); }
const html = readFileSync(path.join(dir, "index.html"), "utf8");
const fonts = [...html.matchAll(/<link[^>]+fonts\.googleapis\.com[^>]*>/g)].map((m) => m[0]).join("\n");
const bg = html.match(/html,\s*body\s*\{[^}]*background:\s*([^;}\s]+)/)?.[1] ?? "#ffffff";
writeFileSync(path.join(rdir, "index.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${slug} (React port)</title>
${fonts}
<style>:root { --u: 1px; } html, body { margin: 0; padding: 0; overflow: hidden; background: ${bg}; }</style>
<style>${readFileSync(path.join(b, "out.css"), "utf8")}</style>
</head><body><div id="root"></div>
<script>window.addEventListener("error", (e) => { window.__err = (e.message || "error") + (e.error && e.error.stack ? "\n" + String(e.error.stack).split("\n").slice(0, 4).join("\n") : ""); });</script>
<script>${readFileSync(path.join(b, "bundle.js"), "utf8").replace(/<\/script/g, "<\\/script")}</script>
</body></html>
`);
/* customers paste this into typed projects: it must type-check in strict mode on its own */
const tsc = spawnSync(path.join(ROOT, "node_modules", ".bin", "tsc"), ["--noEmit", "--strict", "--jsx", "react-jsx", "--module", "esnext", "--moduleResolution", "bundler", "--target", "es2022", "--lib", "dom,es2022", "--skipLibCheck", "--esModuleInterop", comp], { cwd: ROOT, encoding: "utf8" });
const typeErrors = (tsc.stdout.match(/error TS/g) ?? []).length;
console.log(typeErrors ? `types: ${typeErrors} error${typeErrors === 1 ? "" : "s"} in strict mode, fix them:\n${tsc.stdout.split("\n").filter((l) => l.includes("error TS")).slice(0, 8).map((l) => "  " + l.replace(/^.*Rebuild\.tsx/, "Rebuild.tsx")).join("\n")}` : "types: clean in strict mode");
const kb = Math.round(readFileSync(path.join(rdir, "index.html")).length / 1024);
/* a port that throws renders nothing, and a blank page scores as a bad rebuild: say so plainly instead */
{
  const { openPage, sleep } = await import("./chrome");
  const p = await openPage(`file://${path.join(rdir, "index.html")}?demo=1`, 800, 600);
  await sleep(1200);
  const r = JSON.parse(String(await p.ev(`JSON.stringify({ n: document.getElementById("root").children.length, err: window.__err || null })`))) as { n: number; err: string | null };
  p.close();
  if (r.err || !r.n) { console.log(`the port did not render: ${r.err ?? "the root stayed empty"}\nfix this first; nothing else is scored`); process.exit(1); }
}
console.log(`built ${path.relative(ROOT, path.join(rdir, "index.html"))} (${kb} KB); scoring in real time`);
const check = spawnSync("bun", ["--conditions=react-server", "scripts/check-build.ts", slug, "--html", path.join(rdir, "index.html"), "--realtime", ...(args.includes("--quick") ? ["--quick"] : [])], { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 26 });
const out = check.stdout.split("\n");
const line = (p: string) => out.find((l) => l.startsWith(p)) ?? "";
const orig = existsSync(path.join(dir, "check.json")) ? (JSON.parse(readFileSync(path.join(dir, "check.json"), "utf8")) as { score: number }).score : null;
console.log(line("score"));
console.log(line("scale:"));
console.log(`the HTML rebuild it ports scored ${orig ?? "?"} on its last full check; side by side: ${path.relative(ROOT, path.join(rdir, "side.png"))}`);
if (check.status !== 0) console.error(check.stderr.slice(-600));
