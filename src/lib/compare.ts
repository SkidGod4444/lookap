import "server-only";
import sharp from "sharp";
import type { Element } from "@/lib/specs";

/* Compare a screenshot of a rebuild with a reference keyframe, region by region. Both are resized to the frame size,
   then each spec element's box gets a mean colour on both sides, and a 6 x 6 grid gets a mean absolute difference.
   This finds the wrong colour, the missing element and the misplaced block; it is not a pixel-perfect judge, and
   says so. Moving elements are only compared at the first keyframe, where the spec's boxes hold. */

const hex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

async function raw(input: Buffer | string, w: number, h: number, crop?: [number, number, number, number]) {
  let img = sharp(input);
  if (crop) img = img.extract({ left: crop[0], top: crop[1], width: crop[2], height: crop[3] });
  const { data } = await img.resize(w, h, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return data;
}

function mean(d: Buffer, W: number, box: [number, number, number, number]) {
  const [x0, y0, bw, bh] = box.map(Math.round);
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = y0; y < y0 + bh; y += 2) for (let x = x0; x < x0 + bw; x += 2) { const i = (y * W + x) * 3; if (i + 2 >= d.length || x < 0 || y < 0) continue; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
  return n ? [r / n, g / n, b / n] : [0, 0, 0];
}

function diff(a: Buffer, b: Buffer, W: number, box: [number, number, number, number]) {
  const [x0, y0, bw, bh] = box.map(Math.round);
  let s = 0, n = 0;
  for (let y = y0; y < y0 + bh; y += 2) for (let x = x0; x < x0 + bw; x += 2) { const i = (y * W + x) * 3; if (i + 2 >= a.length || x < 0 || y < 0) continue; s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); n++; }
  return n ? s / (n * 3) : 0;
}

/* The reference is cropped to the recipe's region when it has one; the submission is expected to show that region only. */
export async function compareBuild(referencePath: string, submitted: Buffer, frame: { w: number; h: number; crop?: [number, number, number, number] }, elements: Element[], firstKeyframe: boolean) {
  const w = frame.crop ? frame.crop[2] : frame.w, h = frame.crop ? frame.crop[3] : frame.h;
  const [ref, sub] = await Promise.all([raw(referencePath, w, h, frame.crop), raw(submitted, w, h)]);
  const overall = diff(ref, sub, w, [0, 0, w, h]);
  const els = elements
    .filter((e) => firstKeyframe || e.static !== false)
    .map((e) => {
      const a = mean(ref, w, e.box), b = mean(sub, w, e.box);
      return { name: e.name, box: e.box, reference: hex(a[0], a[1], a[2]), yours: hex(b[0], b[1], b[2]), delta: Math.round(diff(ref, sub, w, e.box)) };
    })
    .sort((p, q) => q.delta - p.delta);
  const N = 6, cw = w / N, ch = h / N, cells: { cell: string; box: [number, number, number, number]; delta: number; over: string[] }[] = [];
  for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
    const box: [number, number, number, number] = [gx * cw, gy * ch, cw, ch];
    const over = elements.filter((e) => e.box[0] < box[0] + cw && e.box[0] + e.box[2] > box[0] && e.box[1] < box[1] + ch && e.box[1] + e.box[3] > box[1]).map((e) => e.name);
    cells.push({ cell: `${"ABCDEF"[gy]}${gx + 1}`, box: box.map(Math.round) as [number, number, number, number], delta: Math.round(diff(ref, sub, w, box)), over });
  }
  cells.sort((p, q) => q.delta - p.delta);
  /* 0 is identical; a mean channel difference of 40 or more reads as a different picture */
  const score = Math.max(0, Math.round(100 - overall * 2.5));
  return { score, overall: Math.round(overall), elements: els.slice(0, 5), regions: cells.slice(0, 3), skipped: firstKeyframe ? [] : elements.filter((e) => e.static === false).map((e) => e.name) };
}
