import sharp from "sharp";

/* The judge: how a rebuild is judged against its rubric, shared by the local checker (scripts/check-build.ts, which
   runs the model itself) and the MCP's judge_rebuild (which composes the evidence and hands it to the agent's own
   model). The evidence is a crop of the clip beside the same crop of the render at the criterion's moment, two rows
   for a motion criterion; the sheets pack those pairs twelve to an image so a judge reads three images, not forty. */

export const JUDGE_INSTRUCTION = `You judge a rebuild of a designer's clip against a checklist, strictly. For every criterion below, look at its tile (its header names the criterion's id; in every tile the clip is on the left and the rebuild, "yours", on the right; a motion tile has two rows, the first moment on top and the second below), then compare the right panels with the left panels and decide whether the rebuild shows the same thing the criterion names. Judge by eye only: the criterion is true of the clip; your question is whether it is equally true of the rebuild, side by side. Numbers in a criterion are a guide: within about 10% or 3 px is a pass. For motion criteria compare the change between the two moments on each row. Answer "no" when the rebuild lacks what the criterion names, and also when the attribute the criterion is about is visibly different between the two panels even if a count or a position matches: spokes that are fatter, rounder or softer than the clip's, type that is dimmer, bolder or larger, a rim that is a stroked line where the clip's bends the background, a flat fill where the clip has grain, a seam, a blur where the clip is crisp. Answer "unsure" only when the tile does not let you see. Answer "yes" when the two panels agree on that attribute. In "seen", say in one short sentence what the rebuild shows for this criterion against the clip, with a number where you can read one.`;

export const JUDGE_SCHEMA = { type: "object", additionalProperties: false, required: ["verdicts"], properties: { verdicts: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "pass", "seen"], properties: { id: { type: "string" }, pass: { type: "string", enum: ["yes", "no", "unsure"] }, seen: { type: "string" } } } } } } as const;

/* how an agent on the MCP should run the judge: with a model of its own, apart from the one that built the file */
export const JUDGE_DELEGATION = "A single judge run is noisy: on one unchanged file the same criterion can flip between runs. When a verdict decides whether you stop, run the judge twice and count a no only when both runs say no; when they disagree, zoom that criterion yourself. Run the judge as a separate pass with the strongest vision model available to you, not the one that wrote the file: spawn a subagent (or a fresh session) whose whole input is the sheet links, the criteria and the instruction; have it fetch each sheet to a file (curl -sL <url> -o sheet-1.jpg), read the files, and return the verdicts as the JSON schema given. Do not read the sheets yourself first. Then fix every criterion it answered no, re-render, upload again and judge again; a rebuild is done when every criterion passes and your render moves where the clip moves, not when a score is reached.";

export type Box = [number, number, number, number];
export type JudgeCriterion = { id: string; axis: string; element: string; check: string; box: Box; scope: "crop" | "frame"; at: number; then: number | null };

/* a header strip above a tile: the id and what the panels are, never over the content */
const header = (text: string, w: number) => Buffer.from(`<svg width="${w}" height="18"><rect width="${w}" height="18" fill="#111"/><text x="4" y="13" font-family="Helvetica, Arial" font-size="12" fill="#eee">${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text></svg>`);

/* one panel: a crop of a frame (clip or render) at the box, scaled. k scales the box when the frame is a smaller
   rendition of the W x H source. Integer scales use nearest, so a pixel stays a pixel; others lanczos. */
export async function judgePanel(frame: Buffer, box: Box, S: number, k = 1, W = 0, H = 0) {
  const meta = k === 1 ? null : await sharp(frame).metadata();
  const fw = meta?.width ?? Math.round(W * k) ?? 0, fh = meta?.height ?? Math.round(H * k) ?? 0;
  const x = Math.round(box[0] * k), y = Math.round(box[1] * k), w = Math.max(1, Math.round(box[2] * k)), h = Math.max(1, Math.round(box[3] * k));
  const ow = Math.max(1, Math.round(box[2] * S)), oh = Math.max(1, Math.round(box[3] * S));
  let img = sharp(frame);
  if (fw && fh) img = img.extract({ left: Math.min(x, fw - 1), top: Math.min(y, fh - 1), width: Math.max(1, Math.min(w, fw - x)), height: Math.max(1, Math.min(h, fh - y)) });
  else img = img.extract({ left: x, top: y, width: w, height: h });
  return img.resize(ow, oh, { kernel: S >= 2 && Number.isInteger(S) ? "nearest" : "lanczos3", fit: "fill" }).png().toBuffer();
}

/* the scale a crop is shown at: small things up to 3x, a whole frame to fit; a tall crop is capped so it does not
   take a sheet alone */
export function judgeScale(c: JudgeCriterion, box: Box, fit = 560) {
  const raw = fit / Math.max(box[2], box[3] / 1.4);
  const S = c.scope === "frame" ? Math.min(1, raw) : Math.min(3, Math.max(1, raw), Math.max(0.6, fit / box[3]));
  return Math.round(S * 4) / 4; /* quarter steps, so 2x and 3x stay exact */
}
/* the box a criterion is judged on: its own, or for a whole-frame criterion the content box of the frame (the design,
   not the canvas around it) */
export const judgeBox = (c: JudgeCriterion, frameBox: Box): Box => {
  if (c.scope === "frame") return frameBox;
  /* a motion criterion on a small box gets room around it, so the thing's travel and its neighbours read */
  if (c.then != null && (c.box[2] < 200 || c.box[3] < 200)) {
    const w = Math.max(c.box[2], 200), h = Math.max(c.box[3], 200);
    const x = Math.max(frameBox[0], Math.min(c.box[0] + c.box[2] / 2 - w / 2, frameBox[0] + frameBox[2] - w)), y = Math.max(frameBox[1], Math.min(c.box[1] + c.box[3] / 2 - h / 2, frameBox[1] + frameBox[3] - h));
    return [Math.round(x), Math.round(y), Math.round(Math.min(w, frameBox[0] + frameBox[2] - x)), Math.round(Math.min(h, frameBox[1] + frameBox[3] - y))];
  }
  return c.box;
};

/* one criterion's evidence: a header, then clip | yours, two rows for motion */
export async function judgeTile(c: JudgeCriterion, W: number, H: number, clipAt: (t: number) => Promise<{ frame: Buffer; k: number }>, renderAt: (t: number) => Promise<Buffer>, fit = 560, frameBox: Box = [0, 0, W, H]) {
  const box = judgeBox(c, frameBox), S = judgeScale(c, box, fit);
  const moments = c.then == null ? [c.at] : [c.at, c.then];
  const cells: Buffer[][] = [];
  for (const t of moments) {
    const { frame, k } = await clipAt(t);
    cells.push([await judgePanel(frame, box, S, k, W, H), await judgePanel(await renderAt(t), box, S, 1, W, H)]);
  }
  const cw = Math.max(1, Math.round(box[2] * S)), ch = Math.max(1, Math.round(box[3] * S)), gap = 8, top = 18;
  const width = cw * 2 + gap;
  const text = moments.length > 1 ? `${c.id}   left: clip, right: yours   top row at ${moments[0]}s, bottom row at ${moments[1]}s` : `${c.id}   left: clip at ${moments[0]}s, right: yours at ${moments[0]}s`;
  return sharp({ create: { width, height: top + ch * cells.length + gap * (cells.length - 1), channels: 3, background: "#ff3b30" } })
    .composite([{ input: header(text, width), left: 0, top: 0 }, ...cells.flatMap((row, i) => [{ input: row[0], left: 0, top: top + i * (ch + gap) }, { input: row[1], left: cw + gap, top: top + i * (ch + gap) }])]).png().toBuffer();
}

/* tiles packed into sheets: rows of tiles, each sheet at most `maxH` tall and `maxW` wide, JPEG; returns the sheets
   and which criteria each holds */
export async function packSheets(tiles: { id: string; png: Buffer }[], maxW = 1400, maxH = 1600, quality = 72) {
  /* tallest first, so rows hold tiles of a similar height and the sheets stay few */
  const metas = (await Promise.all(tiles.map(async (t) => ({ ...t, ...(await sharp(t.png).metadata()) })))).sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
  const sheets: { jpeg: Buffer; ids: string[]; width: number; height: number }[] = [];
  let row: typeof metas = [], rows: (typeof metas)[] = [], rowW = 0, sheetH = 0;
  const gap = 14;
  const flush = async () => {
    if (row.length) { rows.push(row); row = []; rowW = 0; }
    if (!rows.length) return;
    const width = Math.max(...rows.map((r) => r.reduce((s, t) => s + (t.width ?? 0), 0) + gap * (r.length - 1)));
    const height = rows.reduce((s, r) => s + Math.max(...r.map((t) => t.height ?? 0)), 0) + gap * (rows.length - 1);
    const comps: { input: Buffer; left: number; top: number }[] = [];
    let top = 0;
    for (const r of rows) { let left = 0; const rh = Math.max(...r.map((t) => t.height ?? 0)); for (const t of r) { comps.push({ input: t.png, left, top }); left += (t.width ?? 0) + gap; } top += rh + gap; }
    const jpeg = await sharp({ create: { width, height, channels: 3, background: "#222" } }).composite(comps).jpeg({ quality, mozjpeg: true }).toBuffer();
    sheets.push({ jpeg, ids: rows.flat().map((t) => t.id), width, height });
    rows = []; sheetH = 0;
  };
  for (const t of metas) {
    const tw = t.width ?? 0, th = t.height ?? 0;
    if (row.length && rowW + gap + tw > maxW) { rows.push(row); sheetH += Math.max(...row.map((x) => x.height ?? 0)) + gap; row = []; rowW = 0; }
    if (sheetH + th > maxH && (rows.length || row.length)) await flush();
    row.push(t); rowW += (row.length > 1 ? gap : 0) + tw;
  }
  await flush();
  return sheets;
}
