/* Turn each still a page import found (measure/stills.json) into a 3-second still clip, so measuring, the checklist
   and the factory treat it like any clip. The screenshot is 2x: the clip is at half size, one source pixel per CSS
   pixel. Writes public/videos/<id>/card/720p.mp4 (served by lookap, linked from the catalogue) and seeds
   measure/<id>/source.mp4 so bun scripts/measure.ts <slug> works before the file is deployed. */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
const stills = JSON.parse(readFileSync("measure/stills.json", "utf8")) as { id: string; src: string }[];
for (const s of stills) {
  const dir = `public/videos/${s.id}/card`, out = `${dir}/720p.mp4`;
  mkdirSync(dir, { recursive: true }); mkdirSync(`measure/${s.id}`, { recursive: true });
  const img = `measure/${s.id}/still.webp`;
  if (!existsSync(img)) execFileSync("curl", ["-sL", "-o", img, s.src]);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-loop", "1", "-i", img, "-t", "3", "-r", "30", "-vf", "scale=trunc(iw/4)*2:trunc(ih/4)*2,format=yuv420p", "-c:v", "libx264", "-crf", "18", "-movflags", "+faststart", out]);
  copyFileSync(out, `measure/${s.id}/source.mp4`);
  console.log(`${s.id}: ${out} (${Math.round(readFileSync(out).length / 1024)} KB)`);
}
