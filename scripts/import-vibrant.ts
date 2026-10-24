/* Add vibrant.design entries to the catalogue from their page URLs. Each page carries its record in og tags and a
   JSON-LD VideoObject (title, description, clip, poster, creator, keywords, date); website pages credit the site and
   link it. New rows are appended to src/lib/catalog.ts; URLs already in it are skipped.
   Every clip and poster is copied into lookap's S3 bucket as it is read (scripts/lib/media.ts), and the row links the
   bucket: no row points at vibrant's CDN. A page screenshot becomes a 3-second still clip, made and uploaded here.

     bun scripts/import-vibrant.ts <url> [<url> ...]   then: bun scripts/measure.ts <slug>, bun scripts/build-drafts.ts */
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { clipToBucket, stillClip, toBucket } from "./lib/media";

const urls = process.argv.slice(2).filter((a) => a.startsWith("https://vibrant.design/"));
const FILE = "src/lib/catalog.ts";
let src = readFileSync(FILE, "utf8");
const meta = (s: string, k: string) => s.match(new RegExp(`<meta (?:property|name)="${k}" content="([^"]*)"`))?.[1]?.replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"') ?? null;
const GENERIC = new Set(["Vibrant", "Website", "Feed", "Web", "Landing"]);

for (const url of urls) {
  const ref = url.split("?")[0];
  if (src.includes(`"ref": "${ref}"`)) { console.log(`skip (already in): ${ref}`); continue; }
  const html = await (await fetch(ref, { headers: { "user-agent": "Mozilla/5.0" } })).text();
  const id = ref.match(/\/(?:feed|website)\/([a-z0-9]+)-/)![1];
  const lds = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => { try { const j = JSON.parse(m[1]); return Array.isArray(j["@graph"]) ? j["@graph"] : [j]; } catch { return []; } });
  const vid = lds.find((x: { "@type"?: string; contentUrl?: string }) => x["@type"] === "VideoObject" && x.contentUrl?.includes(`/${id}/`)) as { name?: string; description?: string; uploadDate?: string; keywords?: string; creator?: { name?: string; url?: string } } | undefined;
  const website = ref.includes("/website/");
  const alt = meta(html, "og:image:alt");
  const title = (website ? alt : null) ?? vid?.name ?? meta(html, "og:title")!.replace(/ - Vibrant Design$/, "");
  const description = vid?.description ?? meta(html, "description") ?? "";
  const ogVideo = meta(html, "og:video");
  /* a still (a page screenshot) has an ImageObject instead of a clip: lookap hosts it as a short still clip so it can
     be measured, judged and rebuilt like any other entry (scripts/still-clip.ts makes the file) */
  const img = lds.find((x: { "@type"?: string; contentUrl?: string }) => x["@type"] === "ImageObject" && x.contentUrl?.includes(`/images/${id}/`)) as { contentUrl?: string; uploadDate?: string; datePublished?: string; width?: number; height?: number } | undefined;
  const still = !ogVideo && img?.contentUrl ? img.contentUrl : null;
  const sourceVideo = ogVideo;
  const v = (ogVideo ?? still)?.match(/\?v=([a-z0-9]+)/)?.[1];
  const sourcePoster = still ? still.replace(/\/cover\/\d+\.webp/, "/cover/1200.webp") : `https://cdn.vibrant.design/videos/${id}/card/poster/1280.webp${v ? `?v=${v}` : ""}`;
  /* into lookap's bucket before the row is written: the row only ever links the bucket */
  const poster = await toBucket(sourcePoster);
  if (!poster) { console.log(`skip (no poster at ${sourcePoster}): ${ref}`); continue; }
  const video = still ? await stillClip(id, still.replace(/\/cover\/\d+\.webp/, "/cover/2490.webp")) : sourceVideo ? await clipToBucket(sourceVideo) : null;
  const w0 = Number(meta(html, "og:video:width") ?? meta(html, "og:image:width") ?? 1280), h0 = Number(meta(html, "og:video:height") ?? meta(html, "og:image:height") ?? 720);
  const w = 1280, h = Math.round((h0 / w0) * 1280);
  const keywords = (vid?.keywords ?? "").split(",").map((k) => k.trim()).filter((k) => k && !GENERIC.has(k));
  let author: string, x: string | null, source: string;
  if (website) {
    author = title.replace(/['’]s .*$/, "").trim();
    x = null;
    /* the site's own link: the ?ref=vibrant.design link on the company's domain, not a sponsor's */
    const links = [...html.matchAll(/href="(https?:\/\/[^"]+)\?ref=vibrant\.design"/g)].map((m) => m[1]);
    const key = author.toLowerCase().replace(/[^a-z0-9]/g, "");
    source = links.find((l) => new URL(l).hostname.replace(/[^a-z0-9]/g, "").includes(key)) ?? links.find((l) => !/aceternity|sponsor/.test(l)) ?? ref;
  } else {
    const handle = vid?.creator?.url?.match(/x\.com\/([A-Za-z0-9_]+)/)?.[1] ?? meta(html, "twitter:creator")?.replace("@", "") ?? null;
    author = vid?.creator?.name ?? handle ?? "unknown";
    x = handle;
    source = (handle && html.match(new RegExp(`https://x\\.com/${handle}/status/\\d+`, "i"))?.[0]) ?? (handle ? `https://x.com/${handle}` : ref);
  }
  /* section pages name their section in the title; feed pages carry a category */
  const section = title.match(/\b(pricing|footer|bento|hero|faq|testimonials|features|cta|navbar|login|signup|404|blog|careers|changelog|stats)\b/i)?.[1];
  const category = website && section ? section[0].toUpperCase() + section.slice(1).toLowerCase() : (meta(html, "twitter:data1") ?? "Interface");
  /* tone from the poster: mean luminance and saturation */
  let tone: "light" | "dark" | "color" = "light";
  try {
    const buf = Buffer.from(await (await fetch(poster!)).arrayBuffer());
    const st = await sharp(buf).resize(64).stats();
    const [r, g, b] = st.channels.map((c) => c.mean / 255);
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b, sat = Math.max(r, g, b) - Math.min(r, g, b);
    tone = lum < 0.38 ? "dark" : sat > 0.22 ? "color" : "light";
  } catch { /* keep light */ }
  const row = { title, kind: website ? "website" : "feed", category, types: keywords.length ? keywords.slice(0, 3) : [category, ...(still ? ["Page"] : [])], tone, author, x, source, ref, published: vid?.uploadDate ?? img?.uploadDate ?? img?.datePublished ?? meta(html, "video:release_date"), description, poster, video, w, h };
  src = src.replace(/\n\];\s*$/, `\n  ${JSON.stringify(row).replace(/","/g, '", "').replace(/":/g, '": ').replace(/,"/g, ', "')},\n];\n`);
  console.log(`added: ${title} (${row.kind}, ${category}, ${tone}, ${author}); media in the bucket: ${video ?? "no clip"}`);
}
writeFileSync(FILE, src);

