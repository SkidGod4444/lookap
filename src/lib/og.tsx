import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SITE_URL } from "./site";
import type { Entry } from "./data";

/* Shared Open Graph card: dark gutter, a canvas panel, the mascot tile, a headline, a line, and the domain.
   Fonts come from Google at render time and are cached per process. */

export const OG_SIZE = { width: 1200, height: 630 };
/* The home card renders at 2x so the mascot, the posters and the dot-matrix face stay crisp when platforms downscale it. */
export const OG_SIZE_2X = { width: 2400, height: 1260 };

const FONT_CSS = "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Doto:wght@700&display=swap";
let fontsPromise: Promise<{ regular: ArrayBuffer; semibold: ArrayBuffer; doto: ArrayBuffer }> | null = null;

async function loadFonts() {
  if (fontsPromise) return fontsPromise;
  fontsPromise = (async () => {
    const css = await fetch(FONT_CSS, { headers: { "User-Agent": "Mozilla/5.0 (compatible; lookap-og)" } }).then((r) => r.text());
    const faces = [...css.matchAll(/font-family:\s*'([^']+)';[^}]*?font-weight:\s*(\d+)[^}]*?src:\s*url\(([^)]+)\)/g)];
    const pick = (family: string, w: string) => faces.find((m) => m[1] === family && m[2] === w)?.[3];
    const get = (u?: string) => (u ? fetch(u).then((r) => r.arrayBuffer()) : Promise.reject(new Error("font url missing")));
    const [regular, semibold, doto] = await Promise.all([get(pick("Inter", "400")), get(pick("Inter", "600")), get(pick("Doto", "700"))]);
    return { regular, semibold, doto };
  })();
  return fontsPromise;
}

/* The mascot tile, read from public/ once per process. A literal path under process.cwd() keeps it in the server bundle. */
let mascotPromise: Promise<string> | null = null;
function loadMascot() {
  mascotPromise ??= readFile(path.join(process.cwd(), "public/mascot.png")).then((b) => `data:image/png;base64,${b.toString("base64")}`);
  return mascotPromise;
}

export async function ogCard({ title, line, kicker }: { title: string; line: string; kicker?: string }) {
  const [fonts, src] = await Promise.all([loadFonts().catch(() => null), loadMascot()]);
  const host = SITE_URL.replace(/^https?:\/\//, "");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0a0a0a", padding: 36, fontFamily: "Inter, sans-serif" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#111111", borderRadius: 28, padding: "56px 64px", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- satori image */}
            <img src={src} width={84} height={84} alt="" style={{ borderRadius: 20 }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 34, fontWeight: 600, color: "#f5f5f5", letterSpacing: -0.8 }}>lookap</div>
              {kicker && <div style={{ fontSize: 20, color: "#8a8a8a", marginTop: 2 }}>{kicker}</div>}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1000 }}>
            <div style={{ fontSize: title.length > 40 ? 58 : 72, fontWeight: 600, color: "#f5f5f5", letterSpacing: -2.2, lineHeight: 1.05 }}>{title}</div>
            <div style={{ fontSize: 28, color: "#c9c9c9", lineHeight: 1.35 }}>{line}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10 }}>
              {["MCP", "Measured recipes", "Design notes"].map((t) => (
                <div key={t} style={{ fontSize: 18, color: "#c9c9c9", padding: "8px 16px", borderRadius: 999, background: "#080808", border: "1px solid rgba(255,255,255,0.1)" }}>{t}</div>
              ))}
            </div>
            <div style={{ fontSize: 22, color: "#8a8a8a" }}>{host}</div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: fontList(fonts),
    },
  );
}

function fontList(fonts: Awaited<ReturnType<typeof loadFonts>> | null) {
  return fonts
    ? [
        { name: "Inter", data: fonts.regular, weight: 400 as const, style: "normal" as const },
        { name: "Inter", data: fonts.semibold, weight: 600 as const, style: "normal" as const },
        { name: "Doto", data: fonts.doto, weight: 700 as const, style: "normal" as const },
      ]
    : undefined;
}

/* Files from public/, read once per process and handed to satori as data URLs. */
const fileCache = new Map<string, Promise<string>>();
function loadPublic(rel: string, mime: string) {
  let p = fileCache.get(rel);
  if (!p) { p = readFile(path.join(process.cwd(), "public", rel)).then((b) => `data:${mime};base64,${b.toString("base64")}`); fileCache.set(rel, p); }
  return p;
}

/* The home card: a big centred wordmark with the mascot, one line under it, and bits of the product scattered at the edges
   like things left on a desk: a clip thumbnail with its filename, a colour swatch, the mascot tile, a measurement, a window.
   Laid out in 1200x630 units and drawn at 2x (k) so the mascot, posters and dot-matrix face stay crisp after platforms downscale. */
export async function ogHero({ line }: { line: string }) {
  const [fonts, mascot, tile, typewriter, cardReader] = await Promise.all([
    loadFonts().catch(() => null),
    loadMascot(),
    readFile(path.join(process.cwd(), "src/app/icon.png")).then((b) => `data:image/png;base64,${b.toString("base64")}`),
    loadPublic("demos/typewriter.jpg", "image/jpeg"),
    loadPublic("demos/card-reader.jpg", "image/jpeg"),
  ]);
  const k = OG_SIZE_2X.width / OG_SIZE.width;
  const host = SITE_URL.replace(/^https?:\/\//, "");
  const ring = `${k}px solid rgba(255,255,255,0.1)`;
  const lift = `0 ${12 * k}px ${32 * k}px rgba(0,0,0,0.6)`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0a0a0a", fontFamily: "Inter, sans-serif", position: "relative", overflow: "hidden" }}>
        {/* top-left: a clip thumbnail, cut by the top edge, with its filename under it */}
        <div style={{ position: "absolute", left: 128 * k, top: -84 * k, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 * k }}>
          <div style={{ display: "flex", width: 316 * k, height: 184 * k, borderRadius: 16 * k, background: "#181818", border: ring, padding: 10 * k, boxShadow: lift }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- satori image */}
            <img src={typewriter} alt="" width={296 * k} height={164 * k} style={{ borderRadius: 8 * k, objectFit: "cover", objectPosition: "50% 42%" }} />
          </div>
          <div style={{ fontSize: 20 * k, color: "#8a8a8a" }}>typewriter.mp4</div>
        </div>
        {/* top centre-right: the card colour, as a swatch */}
        <div style={{ position: "absolute", left: 784 * k, top: 72 * k, width: 40 * k, height: 40 * k, borderRadius: 999, background: "#2170f5", boxShadow: `0 0 0 ${6 * k}px rgba(33,112,245,0.18), 0 ${6 * k}px ${16 * k}px rgba(0,0,0,0.6)` }} />
        {/* top-right: the mascot tile, the flat 1024px icon */}
        {/* eslint-disable-next-line @next/next/no-img-element -- satori image */}
        <img src={tile} alt="" width={82 * k} height={82 * k} style={{ position: "absolute", left: 1098 * k, top: 54 * k, borderRadius: 20 * k, boxShadow: `0 ${k}px ${2 * k}px rgba(0,0,0,0.6), 0 0 0 ${k}px rgba(255,255,255,0.08)` }} />
        {/* centre: the mark and the wordmark */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 196 * k, display: "flex", alignItems: "center", justifyContent: "center", gap: 34 * k }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- satori image */}
          <img src={mascot} alt="" width={168 * k} height={168 * k} />
          <div style={{ fontSize: 196 * k, fontWeight: 600, color: "#f5f5f5", letterSpacing: -11 * k, lineHeight: 0.95, marginTop: -16 * k }}>lookap</div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 418 * k, display: "flex", justifyContent: "center", fontSize: 40 * k, color: "#c9c9c9", letterSpacing: -0.6 * k }}>{line}</div>
        {/* bottom-left: a measurement, in the dot-matrix face we use for callouts */}
        <div style={{ position: "absolute", left: 38 * k, top: 528 * k, display: "flex", fontFamily: "Doto, Inter, sans-serif", fontSize: 36 * k, fontWeight: 700, color: "#8a8a8a", letterSpacing: 2 * k }}>376 px · r 28</div>
        {/* bottom-right: a window, cut by the right and bottom edges, showing the card reader */}
        <div style={{ position: "absolute", left: 1010 * k, top: 500 * k, width: 360 * k, height: 260 * k, borderRadius: 16 * k, display: "flex", flexDirection: "column", background: "#181818", border: ring, boxShadow: lift, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 8 * k, padding: `${12 * k}px ${14 * k}px` }}>
            <div style={{ width: 14 * k, height: 14 * k, borderRadius: 999, background: "#ff5f57" }} />
            <div style={{ width: 14 * k, height: 14 * k, borderRadius: 999, background: "#febc2e" }} />
            <div style={{ width: 14 * k, height: 14 * k, borderRadius: 999, background: "#28c840" }} />
          </div>
          <div style={{ display: "flex", width: 360 * k, height: 222 * k, overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- satori image */}
            <img src={cardReader} alt="" width={360 * k} height={222 * k} style={{ objectFit: "cover", objectPosition: "50% 50%", transform: "scale(1.35)", transformOrigin: "50% 40%" }} />
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 580 * k, display: "flex", justifyContent: "center", fontSize: 20 * k, color: "#5a5a5a" }}>{host}</div>
      </div>
    ),
    { ...OG_SIZE_2X, fonts: fontList(fonts) },
  );
}

/* An entry's card, same desk as the home card: the title big on the left with its category and types, and on the right a window
   showing the clip's poster, tilted a touch and cut by the edge. Entries without media get the same quiet tile the feed shows. */
export async function ogEntry(e: Entry) {
  const [fonts, mascot, poster] = await Promise.all([
    loadFonts().catch(() => null),
    loadMascot(),
    e.video ? loadPublic(e.video.poster.replace(/^\//, ""), "image/jpeg") : Promise.resolve(null),
  ]);
  const k = OG_SIZE_2X.width / OG_SIZE.width;
  const host = SITE_URL.replace(/^https?:\/\//, "");
  const ring = `${k}px solid rgba(255,255,255,0.1)`;
  const lift = `0 ${16 * k}px ${48 * k}px rgba(0,0,0,0.65)`;
  const kicker = `${e.category} · ${e.types.join(", ")}`;
  const big = e.title.length > 26;
  /* window geometry: portrait clips get a tall window, the rest a wide one */
  const portrait = e.ratio < 0.9;
  const ww = portrait ? 300 : 420;
  const wh = portrait ? 420 : 300;
  const img = { w: ww, h: wh - 38 };
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0a0a0a", fontFamily: "Inter, sans-serif", position: "relative", overflow: "hidden" }}>
        {/* top-left: the mark and the wordmark, small */}
        <div style={{ position: "absolute", left: 64 * k, top: 56 * k, display: "flex", alignItems: "center", gap: 14 * k }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- satori image */}
          <img src={mascot} alt="" width={44 * k} height={44 * k} />
          <div style={{ fontSize: 28 * k, fontWeight: 600, color: "#f5f5f5", letterSpacing: -0.8 * k }}>lookap</div>
        </div>
        {/* left: kicker, title, line */}
        <div style={{ position: "absolute", left: 64 * k, top: 190 * k, width: 640 * k, display: "flex", flexDirection: "column", gap: 18 * k }}>
          <div style={{ fontSize: 22 * k, color: "#8a8a8a", letterSpacing: 0.2 * k }}>{kicker}</div>
          <div style={{ fontSize: (big ? 60 : 76) * k, fontWeight: 600, color: "#f5f5f5", letterSpacing: -2.4 * k, lineHeight: 1.02 }}>{e.title}</div>
          <div style={{ fontSize: 24 * k, color: "#c9c9c9", lineHeight: 1.4, marginTop: 6 * k }}>{e.description}</div>
        </div>
        {/* bottom-left: a measurement in the dot-matrix face, and the domain */}
        <div style={{ position: "absolute", left: 64 * k, top: 548 * k, display: "flex", alignItems: "baseline", gap: 28 * k }}>
          <div style={{ display: "flex", fontFamily: "Doto, Inter, sans-serif", fontSize: 30 * k, fontWeight: 700, color: "#8a8a8a", letterSpacing: 2 * k }}>{e.video ? `${e.video.w} × ${e.video.h}` : `${Math.round(e.ratio * 100) / 100} : 1`}</div>
          <div style={{ fontSize: 20 * k, color: "#5a5a5a" }}>{host}</div>
        </div>
        {/* right: the window, tilted, cut by the right edge */}
        <div style={{ position: "absolute", left: (portrait ? 820 : 760) * k, top: (portrait ? 120 : 180) * k, width: ww * k, height: wh * k, borderRadius: 16 * k, display: "flex", flexDirection: "column", background: "#181818", border: ring, boxShadow: lift, overflow: "hidden", transform: "rotate(-4deg)", transformOrigin: "0% 100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 * k, padding: `${12 * k}px ${14 * k}px` }}>
            <div style={{ width: 14 * k, height: 14 * k, borderRadius: 999, background: "#ff5f57" }} />
            <div style={{ width: 14 * k, height: 14 * k, borderRadius: 999, background: "#febc2e" }} />
            <div style={{ width: 14 * k, height: 14 * k, borderRadius: 999, background: "#28c840" }} />
            <div style={{ marginLeft: 10 * k, fontSize: 14 * k, color: "#5a5a5a" }}>{e.video ? e.video.src.split("/").pop() : e.slug}</div>
          </div>
          {poster ? (
            <div style={{ display: "flex", width: img.w * k, height: img.h * k, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- satori image */}
              <img src={poster} alt="" width={img.w * k} height={img.h * k} style={{ objectFit: "cover", objectPosition: "50% 45%" }} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", width: img.w * k, height: img.h * k, padding: 24 * k, background: `linear-gradient(160deg, hsl(${e.hue} 4% 19%), hsl(${e.hue} 3% 12%))` }}>
              <div style={{ fontSize: 18 * k, fontWeight: 500, color: "#c9c9c9", lineHeight: 1.3 }}>{e.title}</div>
            </div>
          )}
        </div>
      </div>
    ),
    { ...OG_SIZE_2X, fonts: fontList(fonts) },
  );
}
