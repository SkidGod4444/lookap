import { CATALOG, type CatalogRow } from "@/lib/catalog";

export type Kind = "feed" | "website" | "launch" | "og";

export type Media = { src: string; w: number; h: number };

export type Entry = {
  slug: string;
  title: string;
  kind: Kind;
  /* w / h of the clip or still; cards and the stage take their shape from it */
  ratio: number;
  category: string;
  types: string[];
  author: string;      /* short id used for the avatar bubble; not an X handle */
  authorName: string;
  /* the designer's X handle, without the @, when the source carried one */
  x?: string;
  /* the post or repo the entry comes from */
  sourceUrl?: string;
  sample: boolean;
  description: string;
  site?: string;
  hue: number;
  tone: "light" | "dark" | "color";
  sponsored?: boolean;
  duration?: number;
  /* a clip: cards play it muted on loop */
  video?: Media;
  /* a still: shown as it is */
  image?: Media;
  /* a frame of the clip for share cards and crawlers; cards never show it, they play the clip */
  poster?: string;
  /* the catalog page this came from; recipes attach to entries by it */
  ref?: string;
};

export const SECTIONS = [
  "Hero", "Features", "Bento", "Pricing", "CTA", "Logo Cloud", "Testimonials", "FAQ", "Changelog", "Footer",
  "How it works", "Integrations", "Stats", "Careers", "Blogs", "Docs", "Login and Signup", "404",
] as const;

export const sectionSlug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const initials = (name: string) => name.replace(/[^A-Za-z0-9 ]/g, "").trim().split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 2).toLowerCase() || "vd";

/* Stable slugs: a short hash of the source URL so links survive reordering of the catalog. */
const hash = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36).slice(0, 6); };

/* Catalog rows the export did not carry. Same shape as the generated catalog, same credits. */
const EXTRA: CatalogRow[] = [
  {
    title: "Typewriter Writing App", kind: "feed", category: "Interface", types: ["Typing", "Skeuomorphic", "Motion", "Dark"], tone: "dark",
    author: "Albia Hossain", x: "AlbiaHossain", source: "https://x.com/AlbiaHossain/status/2110349874608931157",
    ref: "https://vibrant.design/feed/muhvp71-typewriter-writing-app", published: "2026-10-18T00:00:00.000Z",
    description: "A minimalist writing app UI with a skeuomorphic typewriter carriage rolling across textured paper, paired with a dark mobile keyboard.",
    poster: "https://cdn.vibrant.design/videos/muhvp71/card/poster/1280.webp?v=3b0e418f8c27", video: "https://cdn.vibrant.design/videos/muhvp71/card/720p.mp4?v=3b0e418f8c27", w: 332, h: 720,
  },
];

const FROM_CATALOG: Entry[] = [...CATALOG, ...EXTRA].map((r) => ({
  slug: `${hash(r.ref)}-${slugify(r.title)}`,
  title: r.title,
  kind: r.kind,
  category: r.category,
  types: r.types,
  author: initials(r.author),
  authorName: r.author,
  x: r.x ?? undefined,
  sourceUrl: r.source,
  sample: false,
  description: r.description,
  hue: 0,
  tone: r.tone,
  ratio: r.w / r.h,
  video: r.video ? { src: r.video, w: r.w, h: r.h } : undefined,
  image: r.video ? undefined : { src: r.poster, w: r.w, h: r.h },
  poster: r.poster,
  ref: r.ref,
}));

export const ENTRIES: Entry[] = FROM_CATALOG;

export const bySlug = (slug: string) => ENTRIES.find((e) => e.slug === slug);
export const byKind = (kind: Kind) => ENTRIES.filter((e) => e.kind === kind);
export const bySection = (section: string) =>
  ENTRIES.filter((e) => sectionSlug(e.category) === section || e.types.some((t) => sectionSlug(t) === section));

/* When the catalogue last changed; the sitemap and structured data date entries by it. Bump it when catalog.ts is
   regenerated or rows are added by hand. */
export const CATALOG_UPDATED = "2026-10-21";

/* A section's display name: one of SECTIONS, or the category or type as an entry spells it (types like "Accordion"
   have pages too, and their slugs must not become the heading). */
export function sectionName(kind: string) {
  const fixed = SECTIONS.find((s) => sectionSlug(s) === kind);
  if (fixed) return fixed;
  for (const e of ENTRIES) {
    if (sectionSlug(e.category) === kind) return e.category;
    const t = e.types.find((x) => sectionSlug(x) === kind);
    if (t) return t;
  }
  return kind;
}

/* Every section slug that has a page: the fixed sections plus each category and type the entries use. Pages with fewer
   than INDEX_MIN entries exist for browsing but ask not to be indexed, and stay out of the sitemap: a page with one
   card is thin, and a few hundred of them would drag the rest down. */
export const INDEX_MIN = 3;
export const SECTION_KINDS = (): string[] => {
  const kinds = new Set<string>(SECTIONS.map(sectionSlug));
  for (const e of ENTRIES) { kinds.add(sectionSlug(e.category)); e.types.forEach((t) => kinds.add(sectionSlug(t))); }
  return [...kinds];
};
