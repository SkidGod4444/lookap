/* Free signals that separate interface recordings from footage, computed on a few small RGB frames.
   Each signal is 0..1 where 1 reads "interface". They are cheap, explainable, and run before any model call. */

export type Signals = {
  flatness: number;   /* share of 8x8 blocks with almost no texture: UI is mostly flat fills */
  palette: number;    /* share of pixels covered by the 8 most common colours: UI uses few colours */
  rectilinear: number;/* share of strong edges that are horizontal or vertical: UI is made of boxes */
  stillness: number;  /* share of pixels that do not change between samples: UI changes locally, cameras move everything */
  sharpness: number;  /* edge contrast at the pixel scale: rendered pixels are crisp, lenses are soft */
};

export type Heuristic = {
  signals: Signals;
  score: number; /* weighted mean, 0..1 */
  verdict: "interface" | "rendered" | "mixed" | "footage";
};

type Frame = { data: Uint8Array; w: number; h: number };

const lum = (d: Uint8Array, i: number) => (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;

function flatness({ data, w, h }: Frame) {
  let flat = 0, total = 0;
  for (let by = 0; by + 8 <= h; by += 8) for (let bx = 0; bx + 8 <= w; bx += 8) {
    let sum = 0, sq = 0;
    for (let y = by; y < by + 8; y++) for (let x = bx; x < bx + 8; x++) { const l = lum(data, (y * w + x) * 3); sum += l; sq += l * l; }
    const mean = sum / 64, v = sq / 64 - mean * mean;
    if (v < 12) flat++;
    total++;
  }
  return total ? flat / total : 0;
}

function palette({ data, w, h }: Frame) {
  const counts = new Map<number, number>();
  const n = w * h;
  for (let i = 0; i < n; i++) {
    const k = ((data[i * 3] >> 4) << 8) | ((data[i * 3 + 1] >> 4) << 4) | (data[i * 3 + 2] >> 4);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const top = [...counts.values()].sort((a, b) => b - a).slice(0, 8).reduce((a, b) => a + b, 0);
  return top / n;
}

function edges({ data, w, h }: Frame) {
  let axis = 0, diag = 0, strong = 0, sumMag = 0, count = 0;
  for (let y = 1; y < h - 1; y += 2) for (let x = 1; x < w - 1; x += 2) {
    const c = lum(data, (y * w + x) * 3);
    const gx = lum(data, (y * w + x + 1) * 3) - c;
    const gy = lum(data, ((y + 1) * w + x) * 3) - c;
    const mag = Math.abs(gx) + Math.abs(gy);
    sumMag += mag; count++;
    if (mag < 40) continue;
    strong++;
    const r = Math.abs(gx) / (Math.abs(gy) + 1e-6);
    if (r > 4 || r < 0.25) axis++; else diag++;
  }
  return { rectilinear: strong ? axis / (axis + diag) : 0, sharpness: Math.min(1, (strong / Math.max(1, count)) * 6), meanMag: sumMag / Math.max(1, count) };
}

function stillness(a: Frame, b: Frame) {
  const n = a.w * a.h; let same = 0;
  for (let i = 0; i < n; i++) if (Math.abs(lum(a.data, i * 3) - lum(b.data, i * 3)) < 6) same++;
  return same / n;
}

export function analyse(frames: Uint8Array[], w: number, h: number): Heuristic {
  const fs: Frame[] = frames.map((data) => ({ data, w, h }));
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  const fl = mean(fs.map(flatness));
  const pa = mean(fs.map(palette));
  const ed = fs.map(edges);
  const re = mean(ed.map((e) => e.rectilinear));
  const sh = mean(ed.map((e) => e.sharpness));
  const st = mean(fs.slice(1).map((f, i) => stillness(fs[i], f)));
  const signals: Signals = { flatness: fl, palette: pa, rectilinear: re, stillness: st, sharpness: sh };
  const score = fl * 0.25 + pa * 0.2 + re * 0.25 + st * 0.2 + sh * 0.1;
  const verdict: Heuristic["verdict"] = score >= 0.62 ? "interface" : score >= 0.48 ? "rendered" : score >= 0.36 ? "mixed" : "footage";
  return { signals, score, verdict };
}
