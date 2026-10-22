import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/* Whether a rebuild may sample an entry's imagery from the clip: the painting, photograph or screenshot itself, not
   only a texture tile. lookap holds a licence for every catalogue entry by default, so sampling is allowed unless
   factory/<slug>/licence.json says {"sampling": false}, which is how one designer's refusal is recorded. The packed
   rubrics carry the answer to Vercel (rubrics.json, licensed), since the server has no factory/ folder. */
export const LICENSED_BY_DEFAULT = true;

export function isLicensed(factoryDir: string): boolean {
  const f = path.join(factoryDir, "licence.json");
  if (!existsSync(f)) return LICENSED_BY_DEFAULT;
  try { const v = (JSON.parse(readFileSync(f, "utf8")) as { sampling?: boolean }).sampling; return typeof v === "boolean" ? v : LICENSED_BY_DEFAULT; } catch { return LICENSED_BY_DEFAULT; }
}
