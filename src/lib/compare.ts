import "server-only";
import sharp from "sharp";
import type { Element } from "@/lib/specs";

/* Compare a screenshot of a rebuild with a reference keyframe, region by region. Both are resized to the frame size,
   then each spec element's box gets a mean colour on both sides, and a 6 x 6 grid gets a mean absolute difference.
   This finds the wrong colour, the missing element and the misplaced block; it is not a pixel-perfect judge, and
   says so. Moving elements are only compared at the first keyframe, where the spec's boxes hold.

   Differences are weighted by detail: a pixel on an edge, in text or in a texture counts up to ten times a pixel in
   a flat field, on whichever side has the detail. A mostly black frame with garbled text no longer scores 91 because
   the black matched; a flat background that is the wrong shade still counts, just less than the thing on it. */

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

/* how much is going on at a sampled pixel: the colour change to its neighbours two pixels right and down, 0..255 */
function detail(d: Buffer, W: number, i: number, x: number, y: number, H: number) {
  const r = x + 2 < W ? i + 6 : i, dn = y + 2 < H ? i + W * 6 : i;
  return (Math.abs(d[i] - d[r]) + Math.abs(d[i + 1] - d[r + 1]) + Math.abs(d[i + 2] - d[r + 2]) + Math.abs(d[i] - d[dn]) + Math.abs(d[i + 1] - d[dn + 1]) + Math.abs(d[i + 2] - d[dn + 2])) / 2;
}

/* the submission moved by (dx, dy): a translated copy, so the same diff reads it against the reference's box */
const shiftCache = new WeakMap<Buffer, Map<string, Buffer>>();
function subShifted(sub: Buffer, W: number, H: number, dx: number, dy: number) {
  let m = shiftCache.get(sub); if (!m) { m = new Map(); shiftCache.set(sub, m); }
  const k = `${dx},${dy}`; const hit = m.get(k); if (hit) return hit;
  const out = Buffer.alloc(sub.length);
  for (let y = 0; y < H; y++) {
    const sy = y + dy; if (sy < 0 || sy >= H) continue;
    const x0 = Math.max(0, -dx), x1 = Math.min(W, W - dx);
    if (x1 > x0) sub.copy(out, (y * W + x0) * 3, (sy * W + x0 + dx) * 3, (sy * W + x1 + dx) * 3);
  }
  m.set(k, out);
  return out;
}

function diff(a: Buffer, b: Buffer, W: number, box: [number, number, number, number]) {
  const [x0, y0, bw, bh] = box.map(Math.round);
  const H = Math.floor(a.length / (W * 3));
  let s = 0, n = 0;
  /* a pixel is judged against the closest match within two pixels on the other side, so an edge drawn one pixel off
     is a small fault and a missing edge a large one */
  const near = (d: Buffer, i: number, r: number, g: number, bl: number, x: number, y: number) => {
    let best = 765;
    for (const dy of [-2, 0, 2]) for (const dx of [-2, 0, 2]) {
      const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const j = (yy * W + xx) * 3; const v = Math.abs(d[j] - r) + Math.abs(d[j + 1] - g) + Math.abs(d[j + 2] - bl);
      if (v < best) best = v;
    }
    return best;
  };
  for (let y = y0; y < y0 + bh; y += 2) for (let x = x0; x < x0 + bw; x += 2) {
    const i = (y * W + x) * 3; if (i + 2 >= a.length || x < 0 || y < 0) continue;
    const wgt = 1 + Math.min(9, Math.max(detail(a, W, i, x, y, H), detail(b, W, i, x, y, H)) / 8);
    const v = Math.max(near(b, i, a[i], a[i + 1], a[i + 2], x, y), near(a, i, b[i], b[i + 1], b[i + 2], x, y));
    s += wgt * v; n += wgt;
  }
  return n ? s / (n * 3) : 0;
}

/* The reference is cropped to the recipe's region when it has one; the submission is expected to show that region only. */
export async function compareBuild(referencePath: string, submitted: Buffer, frame: { w: number; h: number; crop?: [number, number, number, number] }, elements: Element[], firstKeyframe: boolean) {
  const w = frame.crop ? frame.crop[2] : frame.w, h = frame.crop ? frame.crop[3] : frame.h;
  const [ref, sub] = await Promise.all([raw(referencePath, w, h, frame.crop), raw(submitted, w, h)]);
  const overall = diff(ref, sub, w, [0, 0, w, h]);
  /* per element: the colour difference, and whether moving your box a few pixels would close the gap. A box that
     matches once shifted is misplaced; one that stays different at its best shift is the wrong colour or the wrong
     drawing. The shift is yours relative to the reference, in frame pixels. */
  const shifted = (box: [number, number, number, number]) => {
    const base = diff(ref, sub, w, box);
    let best = { dx: 0, dy: 0, delta: base };
    for (let dy = -8; dy <= 8; dy += 2) for (let dx = -8; dx <= 8; dx += 2) {
      if (!dx && !dy) continue;
      const d = diff(ref, subShifted(sub, w, h, dx, dy), w, box);
      if (d < best.delta - 0.5) best = { dx, dy, delta: d };
    }
    return best;
  };
  const els = elements
    .filter((e) => firstKeyframe || e.static !== false)
    .map((e) => {
      const a = mean(ref, w, e.box), b = mean(sub, w, e.box);
      const delta = Math.round(diff(ref, sub, w, e.box));
      const colour = Math.round((Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 3);
      const best = delta > 12 ? shifted(e.box) : { dx: 0, dy: 0, delta };
      const atBest = Math.round(best.delta);
      const cause = delta <= 12 ? "matches" : colour > 24 && atBest > delta * 0.7 ? "wrong colour" : atBest < delta * 0.55 ? `misplaced: yours sits ${best.dx > 0 ? `${best.dx} px left` : best.dx < 0 ? `${-best.dx} px right` : ""}${best.dx && best.dy ? " and " : ""}${best.dy > 0 ? `${best.dy} px above` : best.dy < 0 ? `${-best.dy} px below` : ""} the reference` : "different drawing: size, shape or texture";
      return { name: e.name, box: e.box, reference: hex(a[0], a[1], a[2]), yours: hex(b[0], b[1], b[2]), delta, colour, shift: best.dx || best.dy ? [best.dx, best.dy] : null, afterShift: atBest, cause };
    })
    .sort((p, q) => q.delta - p.delta);
  const N = 6, cw = w / N, ch = h / N, cells: { cell: string; box: [number, number, number, number]; delta: number; over: string[] }[] = [];
  for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
    const box: [number, number, number, number] = [gx * cw, gy * ch, cw, ch];
    const over = elements.filter((e) => e.box[0] < box[0] + cw && e.box[0] + e.box[2] > box[0] && e.box[1] < box[1] + ch && e.box[1] + e.box[3] > box[1]).map((e) => e.name);
    cells.push({ cell: `${"ABCDEF"[gy]}${gx + 1}`, box: box.map(Math.round) as [number, number, number, number], delta: Math.round(diff(ref, sub, w, box)), over });
  }
  cells.sort((p, q) => q.delta - p.delta);
  /* 0 is identical; with detail weighted and two pixels of tolerance, a close rebuild sits near 20 and a wrong one past 50 */
  const score = Math.max(0, Math.round(100 - overall * 1.6));
  return { score, overall: Math.round(overall), elements: els.slice(0, 5), regions: cells.slice(0, 3), skipped: firstKeyframe ? [] : elements.filter((e) => e.static === false).map((e) => e.name) };
}
