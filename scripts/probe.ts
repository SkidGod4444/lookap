/* Look at a clip the way the measuring is done: frames and numbers, not impressions. For the factory agent, so a
   rebuild's motion and materials come from the clip's own pixels rather than from the four still keyframes.

     bun scripts/probe.ts <slug> --sheet 0,3.6          contact sheet of that span at 10 fps (6 x 6), written to
                                                         factory/<slug>/sheets/<from>-<to>.png; read it to see what moves
     bun scripts/probe.ts <slug> --col 700 --t 1.5,2.45  luminance runs down column x at each time: L light, M mid,
                                                         D dark, as "L57@430" (57 px of light from y 430); rows, gaps,
                                                         borders and their heights fall out of it
     bun scripts/probe.ts <slug> --row 600 --t 1.5       the same along row y
     bun scripts/probe.ts <slug> --col 700 --t 1 --hex 420,500 [--step 2]
                                                         exact colours, one hex per pixel from y 420 to 500: the real
                                                         gradient of a key, a border's true colour, a gap's shade
     bun scripts/probe.ts <slug> --track 340 --from 2 --to 3.6 [--class red|dark|light]
                                                         per frame at 60 fps: first and last y of that colour class in
                                                         column x; prints only frames where it changed, so a motion
                                                         reads as start time, end time, distance and shape. Track
                                                         something that should not move too (a heading): if it moves,
                                                         the page reflows and you copy the layout rule, not coordinates
     bun scripts/probe.ts <slug> --diff 1.0,1.5           what moved between two moments: the clip at the first, at the
                                                         second, and their difference amplified (white where pixels
                                                         changed), written to factory/<slug>/diff/; the quickest way
                                                         to see which thing moves and which only has something pass
                                                         over it
     bun scripts/probe.ts <slug> --zoom x,y,w,h --t 1.0   that crop of the clip at 3x beside the same crop of your render
                                                         at that moment (from the checker's last run; run it with --at t
                                                         first), written to factory/<slug>/zoom/; the judge of materials
     bun scripts/probe.ts <slug> --patch x,y,w,h --t 1.0 --as sky [--max 480] [--q 72]
                                                         that crop of the clip as a small JPEG, written to
                                                         factory/<slug>/patches/<name>.jpg and set into your file as
                                                         --patch-<name>: url(data:...) in <style id="patches"> so you
                                                         never retype base64; use it as background-image:
                                                         var(--patch-sky). For textures that cannot be drawn (a
                                                         painting, marble, a photo, fabric), cropped where nothing sits
                                                         on them; never a block with its chrome or controls. Every
                                                         entry is licensed for sampling unless factory/<slug>/
                                                         licence.json says {"sampling": false}; for one that is not, a
                                                         crop over 8% of the frame or over 40% of its width or height
                                                         is refused: a texture, never the whole picture
     bun scripts/probe.ts <slug> --placeholder x,y,w,h --t 1.0 --as painting
                                                         the dominant colours of that region as a coarse grid (cells of
                                                         about 50 px, nothing finer), set into your file as
                                                         --placeholder-<name>; the lawful stand-in for a photograph,
                                                         painting or screenshot the rebuild may not copy: same box,
                                                         same colour layout, no detail, marked as not reproduced
     bun scripts/probe.ts <slug> --drive "press 700,588; move 700,700; shot pulled; release; wait 400; shot sprung"
                                                         real pointer gestures on your page (no ?demo), screenshots to
                                                         factory/<slug>/drive/<name>.png: press, move, release, click,
                                                         hover x,y; wait ms; shot name. Interaction is judged here.

   Needs the clip at measure/<id>/source.mp4 (scripts/measure.ts fetches it) and ffmpeg. */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import sharp from "sharp";
import { bySlug } from "../src/lib/data";
import { clipId, draftFor } from "../src/lib/drafts";
import { isLicensed } from "../src/lib/licence";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const flag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
if (!slug) { console.error("usage: bun scripts/probe.ts <slug> --sheet a,b | --col x --t t1,t2 [--hex a,b] | --row y --t t | --track x --from a --to b | --diff a,b | --zoom x,y,w,h --t t | --patch x,y,w,h --t t --as name | --placeholder x,y,w,h --t t --as name | --drive \"...\""); process.exit(2); }
const e = bySlug(slug);
const id = e && clipId(e);
const clip = id ? path.join(ROOT, "measure", id, "source.mp4") : "";
if (!e || !clip || !existsSync(clip)) { console.error(`no clip on disk for ${slug} (expected measure/<id>/source.mp4)`); process.exit(2); }
const dir = path.join(ROOT, "factory", slug);
const draft = draftFor(e);
const html = path.resolve(ROOT, flag("--html") ?? `factory/${slug}/index.html`);

const probe = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height,r_frame_rate,duration", "-of", "csv=p=0", clip], { encoding: "utf8" }).stdout.trim().split(",");
const W = Number(probe[0]), H = Number(probe[1]), FPS = eval(probe[2]) as number, DUR = Number(probe[3]);
const ff = (a: string[]) => spawnSync("ffmpeg", ["-v", "error", "-y", ...a]);
const frameAt = (t: number) => { const p = path.join(tmpdir(), `lookap-frame-${process.pid}-${t}.png`); ff(["-ss", String(t), "-i", clip, "-frames:v", "1", p]); return p; };

const times = (flag("--t") ?? "").split(",").map(Number).filter((n) => Number.isFinite(n));
const cls = (v: number[], what: string) => what === "red" ? v[0] > 110 && v[1] < 90 && v[2] < 110 : what === "dark" ? (v[0] + v[1] + v[2]) / 3 < 140 : (v[0] + v[1] + v[2]) / 3 > 225;

if (flag("--sheet")) {
  const [a, b] = flag("--sheet")!.split(",").map(Number);
  const out = path.join(dir, "sheets", `${a}-${b}.png`);
  mkdirSync(path.dirname(out), { recursive: true });
  const tmp = path.join(tmpdir(), `lookap-sheet-${process.pid}`);
  mkdirSync(tmp, { recursive: true });
  ff(["-ss", String(a), "-t", String(b - a), "-i", clip, "-vf", `fps=10,scale=450:-1`, path.join(tmp, "%03d.png")]);
  ff(["-pattern_type", "glob", "-i", path.join(tmp, "*.png"), "-vf", "tile=6x6", out]);
  console.log(`${path.relative(ROOT, out)}: ${Math.round((b - a) * 10)} frames at 10 fps, left to right then down; frame n is at ${a} + (n - 1) / 10 s. Clip ${W}x${H}, ${FPS} fps, ${DUR}s.`);
} else if (flag("--col") || flag("--row")) {
  const col = flag("--col") ? Number(flag("--col")) : null, row = flag("--row") ? Number(flag("--row")) : null;
  if (!times.length) { console.error("--t needs one or more times"); process.exit(2); }
  const hex = flag("--hex")?.split(",").map(Number), step = Number(flag("--step") ?? 1);
  const crop = col !== null ? `crop=8:${H}:${col}:0` : `crop=${W}:8:0:${row}`;
  const N = col !== null ? H : W;
  for (const t of times) {
    const raw = path.join(tmpdir(), `lookap-probe-${process.pid}.rgb`);
    ff(["-ss", String(t), "-i", clip, "-frames:v", "1", "-vf", crop, "-f", "rawvideo", "-pix_fmt", "rgb24", raw]);
    const d = readFileSync(raw);
    const px = (i: number) => { const c = [0, 0, 0]; for (let k = 0; k < 8; k++) { const o = col !== null ? ((i * 8) + k) * 3 : ((k * W) + i) * 3; c[0] += d[o]; c[1] += d[o + 1]; c[2] += d[o + 2]; } return c.map((v) => Math.round(v / 8)); };
    if (hex) {
      const out: string[] = [];
      for (let i = hex[0]; i <= Math.min(hex[1], N - 1); i += step) out.push(`${i}:#${px(i).map((v) => v.toString(16).padStart(2, "0")).join("")}`);
      console.log(`${t}s ${col !== null ? `x=${col}` : `y=${row}`} (8 px wide mean): ${out.join(" ")}`);
      continue;
    }
    const runs: string[] = []; let cur = "", s = 0;
    for (let i = 0; i < N; i++) {
      const [r, g, b] = px(i), v = (r + g + b) / 3;
      const c = v > 225 ? "L" : v < 140 ? "D" : "M";
      if (c !== cur) { if (cur && i - s >= 2) runs.push(`${cur}${i - s}@${s}`); cur = c; s = i; }
    }
    if (cur) runs.push(`${cur}${N - s}@${s}`);
    console.log(`${t}s ${col !== null ? `x=${col}` : `y=${row}`}: ${runs.join(" ")}`);
  }
  if (!hex) console.log("L light (>225), M mid, D dark (<140); runs under 2 px are dropped. A row body is an L run, its borders and gaps the D between. Add --hex a,b for exact colours.");
} else if (flag("--track")) {
  const x = Number(flag("--track")), from = Number(flag("--from") ?? 0), to = Number(flag("--to") ?? DUR), what = flag("--class") ?? "red";
  const raw = path.join(tmpdir(), `lookap-track-${process.pid}.rgb`);
  ff(["-ss", String(from), "-t", String(to - from), "-i", clip, "-vf", `crop=8:${H}:${x}:0`, "-f", "rawvideo", "-pix_fmt", "rgb24", raw]);
  const d = readFileSync(raw);
  const n = Math.floor(d.length / (H * 8 * 3));
  let prev = "";
  const lines: string[] = [];
  for (let i = 0; i < n; i++) {
    let top = -1, bot = -1;
    for (let y = 0; y < H; y++) {
      let c = 0;
      for (let k = 0; k < 8; k++) { const o = ((i * H + y) * 8 + k) * 3; if (cls([d[o], d[o + 1], d[o + 2]], what)) c++; }
      if (c > 4) { if (top < 0) top = y; bot = y; }
    }
    const key = `${top} ${bot}`;
    if (key !== prev) lines.push(`${(from + i / FPS).toFixed(3)}s top ${top} bottom ${bot} height ${top < 0 ? 0 : bot - top + 1}`);
    prev = key;
  }
  console.log(`${what} in column x=${x}, ${from}s to ${to}s at ${FPS} fps; only frames where the edges moved:`);
  console.log(lines.join("\n"));
} else if (flag("--diff")) {
  /* two moments and what changed between them, cropped to the content so small subjects read: the difference is
     amplified, so a thing that moves reads white and a thing that stays reads black */
  const [a, b] = flag("--diff")!.split(",").map(Number);
  if (![a, b].every(Number.isFinite)) { console.error("--diff needs two times a,b"); process.exit(2); }
  const out = path.join(dir, "diff", `${a}-${b}.png`);
  mkdirSync(path.dirname(out), { recursive: true });
  const [fa, fb] = [frameAt(a), frameAt(b)];
  const [ra, rb] = await Promise.all([fa, fb].map((f) => sharp(f).removeAlpha().raw().toBuffer()));
  /* the content box: everything that is not the frame's background colour in either frame, plus everything that changed */
  const bgc = [1, 3, 5].map((i) => parseInt((draft?.background ?? "#ffffff").slice(i, i + 2), 16));
  let x0 = W, y0 = H, x1 = -1, y1 = -1, n = 0;
  const d = Buffer.alloc(ra.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3;
    const v = Math.min(255, (Math.abs(ra[i] - rb[i]) + Math.abs(ra[i + 1] - rb[i + 1]) + Math.abs(ra[i + 2] - rb[i + 2])) * 2);
    d[i] = d[i + 1] = d[i + 2] = v;
    const content = v > 60 || Math.abs(ra[i] - bgc[0]) + Math.abs(ra[i + 1] - bgc[1]) + Math.abs(ra[i + 2] - bgc[2]) > 96;
    if (v > 60) n++;
    if (content) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) { x0 = 0; y0 = 0; x1 = W - 1; y1 = H - 1; }
  const pad = 16, cx = Math.max(0, x0 - pad), cy = Math.max(0, y0 - pad), cw = Math.min(W - cx, x1 - x0 + 1 + 2 * pad), ch = Math.min(H - cy, y1 - y0 + 1 + 2 * pad);
  const S = Math.max(0.25, Math.min(2, 600 / cw, 900 / ch));
  const sw = Math.round(cw * S), sh = Math.round(ch * S);
  const panels = await Promise.all([ra, rb, d].map((buf) => sharp(buf, { raw: { width: W, height: H, channels: 3 } }).extract({ left: cx, top: cy, width: cw, height: ch }).resize(sw, sh, { kernel: "lanczos3" }).png().toBuffer()));
  await sharp({ create: { width: sw * 3 + 24, height: sh, channels: 3, background: "#ff3b30" } })
    .composite(panels.map((p, i) => ({ input: p, left: i * (sw + 12), top: 0 }))).png().toFile(out);
  /* where the change is, in frame px, so the reader can name the moving thing */
  let dx0 = W, dy0 = H, dx1 = -1, dy1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 3] > 60) { if (x < dx0) dx0 = x; if (x > dx1) dx1 = x; if (y < dy0) dy0 = y; if (y > dy1) dy1 = y; }
  console.log(`${path.relative(ROOT, out)}: the clip at ${a}s, at ${b}s, and what changed (white = changed), cropped to [${cx},${cy},${cw},${ch}] of the frame at ${S.toFixed(2)}x. ${n ? `${((100 * n) / (W * H)).toFixed(1)}% of the frame changed, inside [${dx0},${dy0},${dx1 - dx0 + 1},${dy1 - dy0 + 1}] in frame px.` : "Nothing changed."} Read it: the white shapes are the things that move; a region that is white only along an edge had something pass over it; a thing that stays black does not move even if the draft's motion rows say it does.`);
} else if (flag("--zoom")) {
  /* the clip's crop and the render's crop at 3x, side by side: the thing the score cannot tell you */
  const [x, y, w, h] = flag("--zoom")!.split(",").map(Number);
  const t = times[0];
  if (!Number.isFinite(t)) { console.error("--zoom needs --t <time>"); process.exit(2); }
  const S = Math.max(1, Math.min(4, Math.floor(900 / w)));
  const ref = await sharp(frameAt(t)).extract({ left: x, top: y, width: w, height: h }).resize(w * S, h * S, { kernel: "nearest" }).png().toBuffer();
  const checked = existsSync(path.join(dir, "check.json")) ? (JSON.parse(readFileSync(path.join(dir, "check.json"), "utf8")) as { keyframes: { keyframe: string; at: number }[] }).keyframes : [];
  const moment = checked.find((k) => Math.abs(k.at - t) < 0.01);
  const mine = moment && existsSync(path.join(dir, `${moment.keyframe}.png`)) ? path.join(dir, `${moment.keyframe}.png`) : null;
  const panels = [ref];
  if (mine) panels.push(await sharp(mine).extract({ left: x, top: y, width: w, height: h }).resize(w * S, h * S, { kernel: "nearest" }).png().toBuffer());
  const out = path.join(dir, "zoom", `${t}s-${x}-${y}.png`);
  mkdirSync(path.dirname(out), { recursive: true });
  await sharp({ create: { width: (w * S) * panels.length + 12 * (panels.length - 1), height: h * S, channels: 3, background: "#ff3b30" } })
    .composite(panels.map((p, i) => ({ input: p, left: i * (w * S + 12), top: 0 }))).png().toFile(out);
  console.log(`${path.relative(ROOT, out)}: the clip at ${t}s on the left, ${mine ? "your render on the right" : "no render of yours at that moment (run the checker with --at " + t + " first)"}, ${S}x. Read it and name what differs: edges, radii, gradients, shadows, gaps.`);
} else if (flag("--patch")) {
  /* a texture from the clip, as a JPEG the file can carry: written to patches/ and, with --as, set into the HTML as a
     custom property, so the agent never spends its output on base64 */
  const [x, y, w, h] = flag("--patch")!.split(",").map(Number);
  const t = times[0];
  if (!Number.isFinite(t)) { console.error("--patch needs --t <time>"); process.exit(2); }
  if (![x, y, w, h].every(Number.isFinite) || w < 1 || h < 1 || x < 0 || y < 0 || x + w > W || y + h > H) { console.error(`--patch box must sit inside the ${W}x${H} frame`); process.exit(2); }
  const licensed = isLicensed(dir);
  if (!licensed && ((w * h) / (W * H) > 0.08 || w > 0.4 * W || h > 0.4 * H)) {
    console.error(`--patch refused: ${w}x${h} is ${((100 * w * h) / (W * H)).toFixed(1)}% of the ${W}x${H} frame (${w > 0.4 * W ? "wider" : h > 0.4 * H ? "taller" : "larger"} than the limit). This entry's designer has not licensed sampling (factory/${slug}/licence.json says so), so a patch is a texture, never the whole picture: crop a tile of the material where nothing sits on it (under 8% of the frame, under 40% of its width and height) and tile or stretch it yourself. For a photograph, painting or screenshot that cannot be tiled, use --placeholder ${x},${y},${w},${h} --t ${t} --as <name> instead: the same box with its colour layout and no detail, marked as not reproduced.`);
    process.exit(2);
  }
  const name = (flag("--as") ?? `${t}s-${x}-${y}`).replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const max = Number(flag("--max") ?? 480), q = Number(flag("--q") ?? 72);
  const scale = Math.min(1, max / Math.max(w, h));
  const jpg = await sharp(frameAt(t)).extract({ left: x, top: y, width: w, height: h })
    .resize(Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)), { kernel: "lanczos3" }).jpeg({ quality: q, mozjpeg: true }).toBuffer();
  const out = path.join(dir, "patches", `${name}.jpg`);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, jpg);
  const uri = `data:image/jpeg;base64,${jpg.toString("base64")}`;
  const kb = (jpg.length / 1024).toFixed(1);
  if (flag("--as")) {
    if (!existsSync(html)) { console.error(`no file at ${html} to set the patch into; write the file first`); process.exit(2); }
    let doc = readFileSync(html, "utf8");
    const line = `  --patch-${name}: url("${uri}"); /* ${w}x${h} of the clip at ${t}s from ${x},${y}, ${kb} KB */`;
    const block = /<style id="patches">\n:root \{\n([\s\S]*?)\}\n<\/style>/;
    const m = doc.match(block);
    if (m) {
      const lines = m[1].split("\n").filter((l) => l.trim() && !l.includes(`--patch-${name}:`));
      doc = doc.replace(block, `<style id="patches">\n:root {\n${[...lines, line].join("\n")}\n}\n</style>`);
    } else if (doc.includes("</head>")) {
      doc = doc.replace("</head>", `<style id="patches">\n:root {\n${line}\n}\n</style>\n</head>`);
    } else { console.error("no </head> in the file to put the patches block before"); process.exit(2); }
    writeFileSync(html, doc);
    console.log(`${path.relative(ROOT, out)}: ${w}x${h} of the clip at ${t}s, ${kb} KB, set in ${path.relative(ROOT, html)} as --patch-${name}. Use it: background-image: var(--patch-${name}); background-size: cover (or repeat for a tile). Read the .jpg once to confirm it holds only the texture. Say in the header comment and NOTES.md what was sampled and from where.`);
  } else {
    console.log(`${path.relative(ROOT, out)}: ${w}x${h} of the clip at ${t}s, ${kb} KB. Re-run with --as <name> to set it into your file as --patch-<name> (do not retype the base64 yourself).`);
  }
} else if (flag("--placeholder")) {
  /* a region's colour layout at a coarse grain: the stand-in for imagery the rebuild may not copy. Cells of about
     50 px, so a painting becomes its palette in place and nothing a person would call the painting */
  const [x, y, w, h] = flag("--placeholder")!.split(",").map(Number);
  const t = times[0];
  if (!Number.isFinite(t)) { console.error("--placeholder needs --t <time>"); process.exit(2); }
  if (![x, y, w, h].every(Number.isFinite) || w < 1 || h < 1 || x < 0 || y < 0 || x + w > W || y + h > H) { console.error(`--placeholder box must sit inside the ${W}x${H} frame`); process.exit(2); }
  const name = (flag("--as") ?? `${t}s-${x}-${y}`).replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const cols = Math.max(2, Math.min(8, Math.round(w / 50))), rows = Math.max(2, Math.min(14, Math.round(h / 50)));
  const png = await sharp(frameAt(t)).extract({ left: x, top: y, width: w, height: h }).resize(cols, rows, { kernel: "lanczos3", fit: "fill" }).png().toBuffer();
  const out = path.join(dir, "patches", `${name}.placeholder.png`);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, png);
  const uri = `data:image/png;base64,${png.toString("base64")}`;
  const line = `  --placeholder-${name}: url("${uri}"); /* ${cols}x${rows} colour grid of the ${w}x${h} region at ${x},${y} (clip at ${t}s): a stand-in, not the picture */`;
  if (flag("--as")) {
    if (!existsSync(html)) { console.error(`no file at ${html} to set the placeholder into; write the file first`); process.exit(2); }
    let doc = readFileSync(html, "utf8");
    const block = /<style id="patches">\n:root \{\n([\s\S]*?)\}\n<\/style>/;
    const m = doc.match(block);
    if (m) {
      const lines = m[1].split("\n").filter((l) => l.trim() && !l.includes(`--placeholder-${name}:`));
      doc = doc.replace(block, `<style id="patches">\n:root {\n${[...lines, line].join("\n")}\n}\n</style>`);
    } else if (doc.includes("</head>")) {
      doc = doc.replace("</head>", `<style id="patches">\n:root {\n${line}\n}\n</style>\n</head>`);
    } else { console.error("no </head> in the file to put the patches block before"); process.exit(2); }
    writeFileSync(html, doc);
  }
  console.log(`${path.relative(ROOT, out)}: ${cols}x${rows} colour grid of ${w}x${h} at ${x},${y}, ${png.length} bytes${flag("--as") ? `, set in ${path.relative(ROOT, html)} as --placeholder-${name}` : " (re-run with --as <name> to set it into your file)"}. Use it on the element that stands where the picture was: background: var(--placeholder-${name}) center / 100% 100% no-repeat; add filter: blur(calc(6 * var(--u))) or a grain overlay if the clip's region reads soft or textured, and put data-imagery="not reproduced: <what the clip shows>" on that element. Draw everything that sits on the picture (text, controls, glass, rings) yourself.`);
} else if (flag("--drive")) {
  /* real pointer gestures on the page as a person would make them; screenshots in between */
  if (!existsSync(html)) { console.error(`no file at ${html}`); process.exit(2); }
  const { openPage, sleep } = await import("./chrome");
  const page = await openPage(`file://${html}`, W, H);
  await sleep(1200); /* let a load-time entrance finish */
  mkdirSync(path.join(dir, "drive"), { recursive: true });
  const written: string[] = [];
  for (const step of flag("--drive")!.split(";").map((s) => s.trim()).filter(Boolean)) {
    const [verb, rest = ""] = step.split(/\s+/, 2);
    const [x, y] = rest.split(",").map(Number);
    if (verb === "press") await page.mouse("mousePressed", x, y);
    else if (verb === "move") { await page.mouse("mouseMoved", x, y); await sleep(16); }
    else if (verb === "release") await page.mouse("mouseReleased", x, y || 0);
    else if (verb === "hover") { await page.mouse("mouseMoved", x, y); await sleep(120); }
    else if (verb === "click") { await page.mouse("mouseMoved", x, y); await page.mouse("mousePressed", x, y); await page.mouse("mouseReleased", x, y); await sleep(300); }
    else if (verb === "wait") await sleep(Number(rest));
    else if (verb === "shot") { const p = path.join(dir, "drive", `${rest || "shot"}.png`); writeFileSync(p, await page.shot()); written.push(path.relative(ROOT, p)); }
    else { console.error(`unknown step "${step}"`); }
  }
  page.close();
  console.log(`${written.length} screenshot${written.length === 1 ? "" : "s"}: ${written.join(", ")}. Read them: does the page answer the pointer the way the clip's cursor is answered?`);
}
