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

/* CIE76 colour difference between two sRGB means: under 2 is invisible, 5 is a noticeable shade, 20 is a different colour */
export function deltaE76(a: number[], b: number[]) {
  const lab = (c: number[]) => {
    const lin = c.map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    const [x, y, z] = [(0.4124 * lin[0] + 0.3576 * lin[1] + 0.1805 * lin[2]) / 0.95047, 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2], (0.0193 * lin[0] + 0.1192 * lin[1] + 0.9505 * lin[2]) / 1.08883];
    const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
  };
  const [p, q] = [lab(a), lab(b)];
  return Math.sqrt((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2);
}

/* the best small translation of the submission that matches the reference inside a box: how far a thing sits from
   where it should be, and how different it still is once moved there */
export function bestShift(ref: Buffer, sub: Buffer, w: number, h: number, box: [number, number, number, number], reach = 8) {
  const base = diff(ref, sub, w, box);
  let best = { dx: 0, dy: 0, delta: base };
  for (let dy = -reach; dy <= reach; dy += 2) for (let dx = -reach; dx <= reach; dx += 2) {
    if (!dx && !dy) continue;
    const d = diff(ref, subShifted(sub, w, h, dx, dy), w, box);
    if (d < best.delta - 0.5) best = { dx, dy, delta: d };
  }
  return { ...best, base };
}

/* the share of the frame that changed between two raw frames, in percent: a pixel counts when its colour moved by
   more than codec noise; two moments of a clip against the same two of a render say whether the render moves where
   the clip moves */
export function changedArea(a: Buffer, b: Buffer, W: number, H: number) {
  let n = 0, t = 0;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const i = (y * W + x) * 3; if (i + 2 >= a.length || i + 2 >= b.length) continue; t++; if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 60) n++; }
  return t ? Math.round((1000 * n) / t) / 10 : 0;
}
/* what two changed-area readings say about a render */
export function motionRead(clip: number, render: number) {
  const T = 0.3;
  return clip > T && render < Math.max(0.05, clip * 0.15) ? "render still where the clip moves" : clip <= T && render > T * 3 ? "render moves where the clip is still" : clip > T ? "both move" : "both still";
}

/* two frames and what changed between them, cropped to the content: three panels (at a, at b, the difference in
   white), the share of the frame that changed and where, in the frames' own pixels */
export async function diffView(a: Buffer, b: Buffer, background: string) {
  const [{ data: ra, info }, { data: rb }] = await Promise.all([sharp(a).removeAlpha().raw().toBuffer({ resolveWithObject: true }), sharp(b).removeAlpha().raw().toBuffer({ resolveWithObject: true })]);
  const W = info.width, H = info.height;
  if (rb.length !== ra.length) throw new Error("frames differ in size");
  const bgc = [1, 3, 5].map((i) => parseInt(background.slice(i, i + 2), 16));
  let x0 = W, y0 = H, x1 = -1, y1 = -1, dx0 = W, dy0 = H, dx1 = -1, dy1 = -1, n = 0;
  const d = Buffer.alloc(ra.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3;
    const v = Math.min(255, (Math.abs(ra[i] - rb[i]) + Math.abs(ra[i + 1] - rb[i + 1]) + Math.abs(ra[i + 2] - rb[i + 2])) * 2);
    d[i] = d[i + 1] = d[i + 2] = v;
    if (v > 60) { n++; if (x < dx0) dx0 = x; if (x > dx1) dx1 = x; if (y < dy0) dy0 = y; if (y > dy1) dy1 = y; }
    if (v > 60 || Math.abs(ra[i] - bgc[0]) + Math.abs(ra[i + 1] - bgc[1]) + Math.abs(ra[i + 2] - bgc[2]) > 96) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) { x0 = 0; y0 = 0; x1 = W - 1; y1 = H - 1; }
  const pad = 16, cx = Math.max(0, x0 - pad), cy = Math.max(0, y0 - pad), cw = Math.min(W - cx, x1 - x0 + 1 + 2 * pad), ch = Math.min(H - cy, y1 - y0 + 1 + 2 * pad);
  const S = Math.max(0.25, Math.min(2, 560 / cw, 840 / ch));
  const sw = Math.round(cw * S), sh = Math.round(ch * S);
  const panels = await Promise.all([ra, rb, d].map((buf) => sharp(buf, { raw: { width: W, height: H, channels: 3 } }).extract({ left: cx, top: cy, width: cw, height: ch }).resize(sw, sh, { kernel: "lanczos3" }).png().toBuffer()));
  const png = await sharp({ create: { width: sw * 3 + 24, height: sh, channels: 3, background: "#ff3b30" } }).composite(panels.map((pn, i) => ({ input: pn, left: i * (sw + 12), top: 0 }))).jpeg({ quality: 82 }).toBuffer();
  return { image: png, changed: Math.round((1000 * n) / (W * H)) / 10, changedBox: n ? [dx0, dy0, dx1 - dx0 + 1, dy1 - dy0 + 1] : null, crop: [cx, cy, cw, ch], scale: S, size: { w: W, h: H } };
}

/* the box of everything that is not the background in a frame, padded, in the frame's own pixels: what a whole-frame
   criterion should look at when the design sits small on a plain canvas */
export async function contentBox(frame: Buffer, background: string, pad = 24): Promise<[number, number, number, number]> {
  const { data, info } = await sharp(frame).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const bgc = [1, 3, 5].map((i) => parseInt(background.slice(i, i + 2), 16));
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  const mx = Math.ceil(W * 0.02), my = Math.ceil(H * 0.02);
  for (let y = my; y < H - my; y += 2) for (let x = mx; x < W - mx; x += 2) { const i = (y * W + x) * 3; if (Math.abs(data[i] - bgc[0]) + Math.abs(data[i + 1] - bgc[1]) + Math.abs(data[i + 2] - bgc[2]) > 96) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  if (x1 < 0 || (x1 - x0) * (y1 - y0) > 0.85 * W * H) return [0, 0, W, H];
  const cx = Math.max(0, x0 - pad), cy = Math.max(0, y0 - pad);
  return [cx, cy, Math.min(W - cx, x1 - x0 + 1 + 2 * pad), Math.min(H - cy, y1 - y0 + 1 + 2 * pad)];
}

const hex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

export async function raw(input: Buffer | string, w: number, h: number, crop?: [number, number, number, number]) {
  let img = sharp(input);
  if (crop) img = img.extract({ left: crop[0], top: crop[1], width: crop[2], height: crop[3] });
  const { data } = await img.resize(w, h, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return data;
}

export function mean(d: Buffer, W: number, box: [number, number, number, number]) {
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
export function subShifted(sub: Buffer, W: number, H: number, dx: number, dy: number) {
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

export function diff(a: Buffer, b: Buffer, W: number, box: [number, number, number, number]) {
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
  const shifted = (box: [number, number, number, number]) => bestShift(ref, sub, w, h, box);
  const els = elements
    .filter((e) => firstKeyframe || e.static !== false)
    .map((e) => {
      const a = mean(ref, w, e.box), b = mean(sub, w, e.box);
      const delta = Math.round(diff(ref, sub, w, e.box));
      const colour = Math.round((Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 3);
      const best = delta > 12 ? shifted(e.box) : { dx: 0, dy: 0, delta };
      const atBest = Math.round(best.delta);
      const cause = delta <= 12 ? "matches" : colour > 24 && atBest > delta * 0.7 ? "wrong colour" : atBest < delta * 0.55 ? `misplaced: yours sits ${best.dx > 0 ? `${best.dx} px left` : best.dx < 0 ? `${-best.dx} px right` : ""}${best.dx && best.dy ? " and " : ""}${best.dy > 0 ? `${best.dy} px above` : best.dy < 0 ? `${-best.dy} px below` : ""} the reference` : "different drawing: size, shape or texture";
      return { name: e.name, box: e.box, reference: hex(a[0], a[1], a[2]), yours: hex(b[0], b[1], b[2]), delta, colour, deltaE: Math.round(deltaE76(a, b) * 10) / 10, shift: best.dx || best.dy ? [best.dx, best.dy] : null, afterShift: atBest, cause };
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
