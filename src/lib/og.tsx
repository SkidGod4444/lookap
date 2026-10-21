import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SITE_URL } from "./site";

/* Shared Open Graph card: dark gutter, a canvas panel, the mascot tile, a headline, a line, and the domain.
   Fonts come from Google at render time and are cached per process. */

export const OG_SIZE = { width: 1200, height: 630 };

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
   like things left on a desk: a clip thumbnail with its filename, a colour swatch, the mascot tile, a measurement, a window. */
export async function ogHero({ line }: { line: string }) {
  const [fonts, mascot, typewriter, cardReader] = await Promise.all([
    loadFonts().catch(() => null),
    loadMascot(),
    loadPublic("demos/typewriter.jpg", "image/jpeg"),
    loadPublic("demos/card-reader.jpg", "image/jpeg"),
  ]);
  const host = SITE_URL.replace(/^https?:\/\//, "");
  const ring = "1px solid rgba(255,255,255,0.1)";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0a0a0a", fontFamily: "Inter, sans-serif", position: "relative", overflow: "hidden" }}>
        {/* top-left: a clip thumbnail, cut by the top edge, with its filename under it */}
        <div style={{ position: "absolute", left: 128, top: -84, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", width: 316, height: 184, borderRadius: 16, background: "#181818", border: ring, padding: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.6)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- satori image */}
            <img src={typewriter} alt="" width={296} height={164} style={{ borderRadius: 8, objectFit: "cover", objectPosition: "50% 42%" }} />
          </div>
          <div style={{ fontSize: 20, color: "#8a8a8a" }}>typewriter.mp4</div>
        </div>
        {/* top centre-right: the card colour, as a swatch */}
        <div style={{ position: "absolute", left: 784, top: 72, width: 40, height: 40, borderRadius: 999, background: "#2170f5", boxShadow: "0 0 0 6px rgba(33,112,245,0.18), 0 6px 16px rgba(0,0,0,0.6)" }} />
        {/* top-right: the mascot tile */}
        <div style={{ position: "absolute", left: 1098, top: 54, width: 82, height: 82, borderRadius: 20, display: "flex", background: "linear-gradient(180deg,#ececec 0%,#cfcfcf 50%,#a8a8a8 100%)", boxShadow: "0 1px 2px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- satori image */}
          <img src={mascot} alt="" width={62} height={62} style={{ margin: 10 }} />
        </div>
        {/* centre: the mark and the wordmark */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 196, display: "flex", alignItems: "center", justifyContent: "center", gap: 34 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- satori image */}
          <img src={mascot} alt="" width={168} height={168} />
          <div style={{ fontSize: 196, fontWeight: 600, color: "#f5f5f5", letterSpacing: -11, lineHeight: 0.95, marginTop: -16 }}>lookap</div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 418, display: "flex", justifyContent: "center", fontSize: 40, color: "#c9c9c9", letterSpacing: -0.6 }}>{line}</div>
        {/* bottom-left: a measurement, in the dot-matrix face we use for callouts */}
        <div style={{ position: "absolute", left: 38, top: 528, display: "flex", fontFamily: "Doto, Inter, sans-serif", fontSize: 36, fontWeight: 700, color: "#8a8a8a", letterSpacing: 2 }}>376 px · r 28</div>
        {/* bottom-right: a window, cut by the right and bottom edges, showing the card reader */}
        <div style={{ position: "absolute", left: 1010, top: 500, width: 360, height: 260, borderRadius: 16, display: "flex", flexDirection: "column", background: "#181818", border: ring, boxShadow: "0 12px 32px rgba(0,0,0,0.6)", overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 8, padding: "12px 14px" }}>
            <div style={{ width: 14, height: 14, borderRadius: 999, background: "#ff5f57" }} />
            <div style={{ width: 14, height: 14, borderRadius: 999, background: "#febc2e" }} />
            <div style={{ width: 14, height: 14, borderRadius: 999, background: "#28c840" }} />
          </div>
          <div style={{ display: "flex", width: 360, height: 222, overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- satori image */}
            <img src={cardReader} alt="" width={360} height={222} style={{ objectFit: "cover", objectPosition: "50% 50%", transform: "scale(1.35)", transformOrigin: "50% 40%" }} />
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 580, display: "flex", justifyContent: "center", fontSize: 20, color: "#5a5a5a" }}>{host}</div>
      </div>
    ),
    { ...OG_SIZE, fonts: fontList(fonts) },
  );
}
