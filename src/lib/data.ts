export type Kind = "feed" | "website" | "launch" | "og";

export type Entry = {
  slug: string;
  title: string;
  kind: Kind;
  ratio: number;
  category: string;
  types: string[];
  author: string;
  description: string;
  site?: string;
  hue: number;
  tone: "light" | "dark" | "color";
  sponsored?: boolean;
  duration?: number;
  /* a real demo clip we own; the card takes its exact aspect ratio from w/h */
  video?: { src: string; poster: string; w: number; h: number };
};

export const SECTIONS = [
  "Hero", "Features", "Bento", "Pricing", "CTA", "Logo Cloud", "Testimonials", "FAQ", "Changelog", "Footer",
  "How it works", "Integrations", "Stats", "Careers", "Blogs", "Docs", "Login and Signup", "404",
] as const;

export const sectionSlug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

/* Aspect ratios a real masonry feed produces: landscape shots around 1.4, a few squares and portraits. */
const RATIOS = [1.4035, 0.7487, 1.3333, 1.1044, 1.7558, 1.0, 1.4763, 0.7622, 1.5628, 1.3278, 1.1111, 1.6677, 1.3646, 1.7344, 1.4831, 1.3719];

type Seed = [string, Kind, string, string[], string, string, number, Entry["tone"], string?];

/* Sample catalog. Every entry is invented for lookap; swap in real posts once the catalog API exists. */
const SEEDS: Seed[] = [
  ["Lamp Carriage Typewriter", "feed", "Interface", ["Motion", "Dark", "Typing"], "sai", "A writing app where a lamp on a rail lights only the line you are typing.", 40, "dark"],
  ["ID Card Reader Hover", "feed", "Interface", ["Hover", "Hardware", "Blue"], "sai", "An ID card slides into a reader and an LCD prints a verification report.", 222, "color"],
  ["Ledger Table With Running Totals", "website", "Features", ["Table", "Mono"], "ivo", "A finance table whose totals recompute as you scroll past them.", 210, "light"],
  ["Orbit Pricing Dial", "feed", "Pricing", ["Dial", "Motion"], "ren", "Plans arranged on a dial. Spin it and the price counter rolls.", 0, "dark"],
  ["Monorail Hero", "website", "Hero", ["Diagram", "Light"], "ivo", "A single horizontal line carries the product story across the fold.", 200, "light"],
  ["Six-Tile Bento With One Live Tile", "website", "Bento", ["Grid", "Live"], "mara", "Five static tiles, one streaming real data, nothing else moves.", 28, "light"],
  ["Dot-Matrix Weather Poster", "feed", "Typography", ["Dot-Matrix", "Blue"], "mara", "A forecast rendered as a wall of dots on a flat blue field.", 225, "color"],
  ["Two-Speed Tooltip Study", "feed", "Interface", ["Tooltip", "Comparison"], "jun", "Same toolbar, two hover delays, side by side.", 330, "light"],
  ["Black Cube Agents Hero", "website", "Hero", ["Dark", "3D"], "sol", "A rotating cube and three numbers make the hero.", 0, "light"],
  ["Piano-Key FAQ", "feed", "FAQ", ["Accordion", "Playful"], "lea", "Each question is a key. Press one and it sounds.", 350, "light"],
  ["Thermostat Menubar App", "feed", "Interface", ["Mobile", "Dark"], "tomo", "Room temperature as a dial with mode chips underneath.", 215, "dark"],
  ["One-Plan Checkout Sheet", "feed", "Pricing", ["Modal", "Grey"], "ana", "One plan, one price, one button, inside a grey shell.", 0, "light"],
  ["Lantern Launch Film", "launch", "Launch", ["Cinematic", "Warm"], "oz", "A lantern lights a room in a ten-second product film.", 280, "color"],
  ["Whale Empty State", "feed", "Interface", ["ASCII", "Chat"], "kit", "A whale drifts through the empty state of a chat window.", 0, "light"],
  ["Polite Cookie Banner", "feed", "Modal", ["Illustration", "Playful"], "ben", "A cookie banner that asks once and means it.", 35, "light"],
  ["Sheet Keyframes Side By Side", "feed", "Motion", ["Code", "Dark"], "eli", "The keyframes of a bottom sheet, shown beside the sheet.", 0, "dark"],
  ["Install Command Hero", "website", "Hero", ["Terminal", "Orange"], "zed", "A single install command sits under the headline.", 20, "light"],
  ["Cursor Swarm Builder", "feed", "Motion", ["Cursors", "Minimal"], "ro", "A ring of cursors builds the page while you watch.", 160, "light"],
  ["Studio Work Grid", "website", "Features", ["Grid", "Dark"], "ash", "Project thumbnails on black with a single wordmark.", 0, "dark"],
  ["Sponsored: Ship a landing page tonight", "feed", "Sponsored", ["Sponsored"], "spn", "Sponsored placement.", 210, "light"],
  ["Waveform From Code", "launch", "Launch", ["Audio", "Dark"], "kai", "Sound waves drawn from the code that produced them.", 190, "dark"],
  ["Thumbs With Bounce", "feed", "Interface", ["Toggle", "Playful"], "may", "Thumbs up and thumbs down with a little bounce.", 0, "light"],
  ["Button That Becomes The Thing", "feed", "Interface", ["Button", "Minimal"], "cy", "A button that morphs into the result it produces.", 240, "light"],
  ["Drop-And-Shift Converter", "feed", "Interface", ["Drag", "Blue"], "pia", "Drop a file, shift its format, done.", 230, "light"],
  ["Region Latency Dashboard", "website", "Dashboard", ["Dark", "Data"], "nox", "Requests by region on a dark map, with a latency strip.", 0, "dark"],
  ["Before-And-After Plugin Cards", "website", "Features", ["Cards", "Orange"], "fp", "Three plugin cards with before-and-after numbers.", 30, "light"],
  ["Three Toggles Two Buttons", "feed", "Interface", ["Toggle", "Grey"], "ben", "A settings row reduced to the minimum.", 0, "light"],
  ["Wordmark From Blur", "launch", "Launch", ["Type", "Light"], "nl", "A wordmark that resolves from blur.", 0, "light"],
  ["Payments API Share Card", "og", "OG", ["Card", "Blue"], "pay", "Open Graph card for a payments API.", 225, "color"],
  ["Voice Product Share Card", "og", "OG", ["Card", "Dark"], "vx", "Open Graph card for a voice product.", 0, "dark"],
  ["Billing Share Card", "og", "OG", ["Card", "Light"], "pol", "Open Graph card for a billing platform.", 210, "light"],
  ["Browser Doorway Film", "launch", "Launch", ["Cinematic", "Dark"], "arc", "A browser window becomes a doorway.", 260, "dark"],
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const DEMOS: Record<string, Entry["video"]> = {
  "Lamp Carriage Typewriter": { src: "/demos/typewriter.mp4", poster: "/demos/typewriter.jpg", w: 498, h: 700 },
  "ID Card Reader Hover": { src: "/demos/card-reader.mp4", poster: "/demos/card-reader.jpg", w: 1080, h: 1080 },
};

export const ENTRIES: Entry[] = SEEDS.map((s, i) => ({
  slug: `${(i * 7919 + 1013).toString(36)}-${slugify(s[0])}`,
  title: s[0],
  kind: s[1],
  category: s[2],
  types: s[3],
  author: s[4],
  description: s[5],
  hue: s[6],
  tone: s[7],
  site: s[8],
  ratio: DEMOS[s[0]] ? DEMOS[s[0]]!.w / DEMOS[s[0]]!.h : s[1] === "og" ? 1.91 : RATIOS[i % RATIOS.length],
  sponsored: s[2] === "Sponsored",
  duration: DEMOS[s[0]] ? (s[0].startsWith("Lamp") ? 11 : 8) : s[1] === "feed" || s[1] === "launch" ? 4 + ((i * 37) % 12) : undefined,
  video: DEMOS[s[0]],
}));

export const bySlug = (slug: string) => ENTRIES.find((e) => e.slug === slug);
export const byKind = (kind: Kind) => ENTRIES.filter((e) => e.kind === kind);
export const bySection = (section: string) =>
  ENTRIES.filter((e) => sectionSlug(e.category) === section || e.types.some((t) => sectionSlug(t) === section));

