import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SITE_URL } from "./site";

/* Shared Open Graph card: dark gutter, a canvas panel, the mascot tile, a headline, a line, and the domain.
   Fonts come from Google at render time and are cached per process. */

export const OG_SIZE = { width: 1200, height: 630 };

const FONT_CSS = "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap";
let fontsPromise: Promise<{ regular: ArrayBuffer; semibold: ArrayBuffer }> | null = null;

async function loadFonts() {
  if (fontsPromise) return fontsPromise;
  fontsPromise = (async () => {
    const css = await fetch(FONT_CSS, { headers: { "User-Agent": "Mozilla/5.0 (compatible; lookap-og)" } }).then((r) => r.text());
    const urls = [...css.matchAll(/font-weight:\s*(\d+)[^}]*?src:\s*url\(([^)]+)\)/g)];
    const pick = (w: string) => urls.find((m) => m[1] === w)?.[2];
    const [regular, semibold] = await Promise.all([pick("400"), pick("600")].map((u) => (u ? fetch(u).then((r) => r.arrayBuffer()) : Promise.reject(new Error("font url missing")))));
    return { regular, semibold };
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
      fonts: fonts
        ? [
            { name: "Inter", data: fonts.regular, weight: 400, style: "normal" },
            { name: "Inter", data: fonts.semibold, weight: 600, style: "normal" },
          ]
        : undefined,
    },
  );
}
