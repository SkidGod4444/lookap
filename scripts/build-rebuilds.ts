/* Pack the factory's finished rebuilds into src/lib/rebuilds/factory.json, so the site's Live switch and the MCP's
   get_rebuild can serve them from Vercel. A rebuild ships when factory/<slug>/ has index.html, NOTES.md and build.json
   (who finished it, the metered agent run if there was one, what was done by hand, and the hint for the Live switch;
   the factory's result.json is the run's receipt and build.json is the file's record).
   Two copies of the file go in: the file as written (one source pixel per --u, for get_rebuild) and the embed, the
   same file with --u scaled to the iframe so it fills the project page's frame. bun scripts/build-rebuilds.ts */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type FactoryRebuild = {
  slug: string; title: string; file: string; html: string; embed: string; needs: string[];
  frame: { w: number; h: number }; score: number | null;
  build: { model: string; modelId: string; date: string; run?: { model: string; turns: number; outputTokens: number; totalTokens: number; costUsd: number; minutes: number; score: number }; hand?: string };
  hint: string; pattern: string;
};

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
  const embed = html.replace("--u: 1px;", `--u: min(calc(100vw / ${frame.w}), calc(100vh / ${frame.h}));`)
    .replace(/(html, body \{[^}]*\})/, "$1\nbody { display: flex; align-items: center; justify-content: center; height: 100vh; }");
  const { hint, ...rest } = build;
  out[slug] = { slug, title, file: `${slug}.html`, html, embed, needs, frame, score: check?.score ?? null, build: rest, hint, pattern };
  console.log(`${slug}: ${Math.round(html.length / 1024)} KB, ${frame.w}x${frame.h}, score ${check?.score ?? "-"}, needs ${needs.join(", ") || "nothing"}`);
}
writeFileSync("src/lib/rebuilds/factory.json", JSON.stringify(out, null, 1));
console.log(`${Object.keys(out).length} rebuild${Object.keys(out).length === 1 ? "" : "s"} packed into src/lib/rebuilds/factory.json`);
