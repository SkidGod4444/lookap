/* Pack every measure/<id>/measure.json into src/lib/drafts.json (small: phases, moves, palette, draft boxes, keyframe
   times) and copy up to four keyframes per clip into public/drafts/<id>/ at 720 px wide, so the MCP can serve draft
   measurements and keyframes from Vercel, which has no ffmpeg. bun scripts/build-drafts.ts */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type Draft = {
  id: string; frame: { w: number; h: number }; fps: number; duration: number;
  phases: [number, number][];
  keyframes: { name: string; at: number; src: string; hold: [number, number] }[];
  background: string; palette: { hex: string; share: number }[];
  elements: { box: [number, number, number, number]; fill: string }[];
  motion: { element: string; box: [number, number, number, number]; moves: { from: number; to: number; dTop: number; dLeft: number; ms: number }[] }[];
  coverage: string;
};

const out: Record<string, Draft> = {};
const ids = existsSync("measure") ? readdirSync("measure").filter((d) => existsSync(join("measure", d, "measure.json"))) : [];
for (const id of ids) {
  const m = JSON.parse(readFileSync(join("measure", id, "measure.json"), "utf8"));
  const dir = join("public", "drafts", id); mkdirSync(dir, { recursive: true });
  const keyframes = m.keyframes.slice(0, 4).map((k: { name: string; at: number; src: string; hold: [number, number] }) => {
    const dst = join(dir, `${k.name}.jpg`);
    if (!existsSync(dst)) execFileSync("ffmpeg", ["-v", "error", "-y", "-i", k.src, "-vf", "scale='min(720,iw)':-2", "-q:v", "6", dst]);
    return { name: k.name, at: k.at, src: `/drafts/${id}/${k.name}.jpg`, hold: k.hold };
  });
  const k0 = m.keyframes[0];
  out[id] = {
    id, frame: m.source.frame, fps: m.source.fps, duration: m.source.duration,
    phases: m.phases.map((p: { moving: [number, number] }) => p.moving),
    keyframes,
    background: k0.background.fill, palette: k0.palette,
    elements: k0.elements.slice(0, 12).map((e: { box: [number, number, number, number]; fill: string }) => ({ box: e.box, fill: e.fill })),
    motion: m.motion.slice(0, 4).map((t: Draft["motion"][number]) => ({ element: t.element, box: t.box, moves: t.moves.slice(0, 4).map((mv) => ({ from: mv.from, to: mv.to, dTop: mv.dTop, dLeft: mv.dLeft, ms: mv.ms })) })),
    coverage: m.coverage,
  };
}
writeFileSync("src/lib/drafts.json", JSON.stringify(out));
const bytes = readFileSync("src/lib/drafts.json").length;
console.log(`${ids.length} drafts, ${(bytes / 1024).toFixed(0)} KB json, keyframes in public/drafts`);
