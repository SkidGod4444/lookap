/* Pack every factory/<slug>/rubric.json into src/lib/rubrics.json (the checklist, the element boxes, the imagery
   classes and the measured moves; not the model or the cost), so get_brief and judge_rebuild can serve them from
   Vercel. bun scripts/build-rubrics.ts */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Rubric } from "./rubric";

export type PackedRubric = Pick<Rubric, "frame" | "summary" | "elements" | "criteria" | "imagery" | "moves"> & { written: string; licensed: boolean };
const out: Record<string, PackedRubric> = {};
const dirs = existsSync("factory") ? readdirSync("factory").filter((d) => existsSync(join("factory", d, "rubric.json"))) : [];
for (const slug of dirs) {
  const r = JSON.parse(readFileSync(join("factory", slug, "rubric.json"), "utf8")) as Rubric;
  const lic = join("factory", slug, "licence.json");
  const licensed = existsSync(lic) && Boolean((JSON.parse(readFileSync(lic, "utf8")) as { sampling?: boolean }).sampling);
  out[slug] = { frame: r.frame, summary: r.summary, elements: r.elements, criteria: r.criteria, imagery: r.imagery, moves: r.moves, written: r.at.slice(0, 10), licensed };
}
writeFileSync("src/lib/rubrics.json", JSON.stringify(out));
console.log(`${dirs.length} rubric${dirs.length === 1 ? "" : "s"}: ${dirs.join(", ") || "none"}; ${(readFileSync("src/lib/rubrics.json").length / 1024).toFixed(0)} KB`);
