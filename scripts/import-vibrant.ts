/* Add vibrant.design entries to the catalogue from their page URLs. Each page carries its record in og tags and a
   JSON-LD VideoObject (title, description, clip, poster, creator, keywords, date); website pages credit the site and
   link it. New rows are appended to src/lib/catalog.ts; URLs already in it are skipped.

     bun scripts/import-vibrant.ts <url> [<url> ...]   then: bun scripts/measure.ts <slug>, bun scripts/build-drafts.ts */
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const urls = process.argv.slice(2).filter((a) => a.startsWith("https://vibrant.design/"));
const FILE = "src/lib/catalog.ts";
let src = readFileSync(FILE, "utf8");
const meta = (s: string, k: string) => s.match(new RegExp(`<meta (?:property|name)="${k}" content="([^"]*)"`))?.[1]?.replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"') ?? null;
const GENERIC = new Set(["Vibrant", "Website", "Feed", "Web", "Landing"]);

const stills: { id: string; src: string }[] = [];
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
  const video = ogVideo ?? (still ? `https://lookap.saidev.codes/videos/${id}/card/720p.mp4` : null);
  const v = (ogVideo ?? still)?.match(/\?v=([a-z0-9]+)/)?.[1];
  const poster = still ? still.replace(/\/cover\/\d+\.webp/, "/cover/1200.webp") : `https://cdn.vibrant.design/videos/${id}/card/poster/1280.webp${v ? `?v=${v}` : ""}`;
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
    const buf = Buffer.from(await (await fetch(poster)).arrayBuffer());
    const st = await sharp(buf).resize(64).stats();
    const [r, g, b] = st.channels.map((c) => c.mean / 255);
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b, sat = Math.max(r, g, b) - Math.min(r, g, b);
    tone = lum < 0.38 ? "dark" : sat > 0.22 ? "color" : "light";
  } catch { /* keep light */ }
  const row = { title, kind: website ? "website" : "feed", category, types: keywords.length ? keywords.slice(0, 3) : [category, ...(still ? ["Page"] : [])], tone, author, x, source, ref, published: vid?.uploadDate ?? img?.uploadDate ?? img?.datePublished ?? meta(html, "video:release_date"), description, poster, video, w, h };
  src = src.replace(/\n\];\s*$/, `\n  ${JSON.stringify(row).replace(/","/g, '", "').replace(/":/g, '": ').replace(/,"/g, ', "')},\n];\n`);
  if (still) stills.push({ id, src: still.replace(/\/cover\/\d+\.webp/, "/cover/2490.webp") });
  console.log(`added: ${title} (${row.kind}, ${category}, ${tone}, ${author})`);
}
writeFileSync(FILE, src);
/* new entries' clips and posters go to lookap's own bucket straight away (and, once the catalogue points at it,
   their links too): nothing new depends on vibrant's servers */
if (urls.length) {
  const dl = spawnSync("bun", ["scripts/mirror-media.ts", "download"], { encoding: "utf8" }); process.stdout.write(dl.stdout);
  const up = spawnSync("bun", ["scripts/mirror-media.ts", "upload"], { encoding: "utf8" }); process.stdout.write(up.stdout || up.stderr);
  const host = process.env.MEDIA_HOST ?? "lookap.s3.ap-south-1.amazonaws.com";
  if (readFileSync(FILE, "utf8").includes(`https://${host}/`)) writeFileSync(FILE, readFileSync(FILE, "utf8").replaceAll("https://cdn.vibrant.design/", `https://${host}/`));
}
if (stills.length) { writeFileSync("measure/stills.json", JSON.stringify(stills, null, 1)); console.log(`${stills.length} stills: run bun scripts/still-clip.ts`); }
