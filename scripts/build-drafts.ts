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
  /* the middle of each measured phase, where things are mid-flight, and one contact sheet of the clip at 2 fps:
     what look_at serves over the MCP, since Vercel has no ffmpeg */
  mids: { at: number; src: string }[];
  sheet: { src: string; fps: number; cols: number; frames: number; tile: number } | null;
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
  const phases: [number, number][] = m.phases.map((p: { moving: [number, number] }) => p.moving);
  const clip = join("measure", id, "source.mp4");
  const mids = phases.filter(([a, b]) => b - a >= 0.1).map(([a, b]) => Number(((a + b) / 2).toFixed(2)))
    .filter((t) => !m.keyframes.some((k: { at: number }) => Math.abs(k.at - t) < 0.15)).slice(0, 8)
    .flatMap((t) => {
      const dst = join(dir, `t${String(t).replace(".", "_")}.jpg`);
      if (!existsSync(dst) && existsSync(clip)) execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(t), "-i", clip, "-frames:v", "1", "-vf", "scale='min(560,iw)':-2", "-q:v", "6", dst]);
      return existsSync(dst) ? [{ at: t, src: `/drafts/${id}/${dst.split("/").pop()}` }] : [];
    });
  const frames = Math.min(48, Math.ceil(m.source.duration * 2));
  const sheetDst = join(dir, "sheet.jpg");
  if (!existsSync(sheetDst) && existsSync(clip)) execFileSync("ffmpeg", ["-v", "error", "-y", "-i", clip, "-vf", `fps=2,scale=240:-2,tile=6x${Math.ceil(frames / 6)}`, "-frames:v", "1", "-q:v", "7", sheetDst]);
  const sheet = existsSync(sheetDst) ? { src: `/drafts/${id}/sheet.jpg`, fps: 2, cols: 6, frames, tile: 240 } : null;
  out[id] = {
    id, frame: m.source.frame, fps: m.source.fps, duration: m.source.duration,
    phases: m.phases.map((p: { moving: [number, number] }) => p.moving),
    keyframes, mids, sheet,
    background: k0.background.fill, palette: k0.palette,
    elements: k0.elements.slice(0, 12).map((e: { box: [number, number, number, number]; fill: string }) => ({ box: e.box, fill: e.fill })),
    motion: m.motion.slice(0, 4).map((t: Draft["motion"][number]) => ({ element: t.element, box: t.box, moves: t.moves.slice(0, 4).map((mv) => ({ from: mv.from, to: mv.to, dTop: mv.dTop, dLeft: mv.dLeft, ms: mv.ms })) })),
    coverage: m.coverage,
  };
}
writeFileSync("src/lib/drafts.json", JSON.stringify(out));
const bytes = readFileSync("src/lib/drafts.json").length;
console.log(`${ids.length} drafts, ${(bytes / 1024).toFixed(0)} KB json, keyframes in public/drafts`);
