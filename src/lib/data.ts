import { CATALOG } from "@/lib/catalog";

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

/* Our own measured demos, the ones the recipes in the registry are read from. */
const OWN: Entry[] = [
  {
    slug: "s5-lamp-carriage-typewriter", title: "Lamp Carriage Typewriter", kind: "feed", category: "Interface", types: ["Motion", "Dark", "Typing"],
    author: "sai", authorName: "lookap", sourceUrl: "https://github.com/SkidGod4444/lookap", sample: false,
    description: "A writing app where a lamp on a rail lights only the line you are typing.", hue: 40, tone: "dark", duration: 11,
    video: { src: "/demos/typewriter.mp4", w: 498, h: 700 }, poster: "/demos/typewriter.jpg", ratio: 498 / 700,
  },
  {
    slug: "6w4-id-card-reader-hover", title: "ID Card Reader Hover", kind: "feed", category: "Interface", types: ["Hover", "Hardware", "Blue"],
    author: "sai", authorName: "lookap", sourceUrl: "https://github.com/SkidGod4444/lookap", sample: false,
    description: "An ID card slides into a reader and an LCD prints a verification report.", hue: 222, tone: "color", duration: 8,
    video: { src: "/demos/card-reader.mp4", w: 1080, h: 1080 }, poster: "/demos/card-reader.jpg", ratio: 1,
  },
];

const FROM_CATALOG: Entry[] = CATALOG.map((r) => ({
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
}));

export const ENTRIES: Entry[] = [...OWN, ...FROM_CATALOG];

export const bySlug = (slug: string) => ENTRIES.find((e) => e.slug === slug);
export const byKind = (kind: Kind) => ENTRIES.filter((e) => e.kind === kind);
export const bySection = (section: string) =>
  ENTRIES.filter((e) => sectionSlug(e.category) === section || e.types.some((t) => sectionSlug(t) === section));
