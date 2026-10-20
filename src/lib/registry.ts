import { ENTRIES, SECTIONS, type Entry } from "@/lib/data";

/* The lookap registry: what the MCP server serves. Three kinds of knowledge:
   1. entries, the curated feed (title, category, types, author, demo clip when we own one)
   2. recipes, measured rebuilds: values read from a clip's pixels, with the motion table
   3. notes, design guidance distilled from the work, each tied to the recipes it came from
   Everything here is ours: measured by us or written by us. */

export type Recipe = {
  slug: string;
  title: string;
  source: string;
  palette: Record<string, string>;
  geometry: string[];
  type: string[];
  motion: { phase: string; at: string; what: string }[];
  rules: string[];
};

export const RECIPES: Recipe[] = [
  {
    slug: "id-card-reader-hover",
    title: "ID card reader, hover to insert",
    source: "5.85 s, 1080x1080, 60 fps clip; every value sampled from frames",
    palette: {
      bg: "#000000", card: "#2170f5", cardAvatar: "#4585f5", sleeve: "#131313", sleeveTop: "#1c1c1c", screen: "#171717",
      labelIdle: "#858585", labelActive: "#f0f0f0", ok: "#11d04a", tab: "#e8e8e8",
    },
    geometry: [
      "card 376x240, radius 28, 158 px exposed above the sleeve at rest, slides 118 px on insert",
      "sleeve 496 wide, radius 30, lip 118 tall with a dark seam and a light edge under it",
      "LCD 430x212, radius 14, inset 33 from the sleeve edge, 4 rows at 44.7 px leading",
      "eight grip ridges 28 wide, pitch 55, starting 368 px below the sleeve top",
      "key light top-left: left rim luma 110 falling to 30 over 36 px, top rim 107 for 6 px, right rim a 1 px line",
    ],
    type: ["LCD: dot-matrix mono, 32 px, Doto with ROND axis", "card: humanist sans, name 36 px regular, company 24 px at 60% white"],
    motion: [
      { phase: "pre-press", at: "0.7-1.7 s", what: "card dips 8 px as the cursor arrives" },
      { phase: "insert", at: "1.7-1.9 s", what: "card slides 118 px down, 250 ms, ease-in-out" },
      { phase: "report", at: "1.9-3.2 s", what: "labels brighten; status words type in top to bottom, 22 ms per character; green check pops after each" },
      { phase: "hold", at: "3.2-4.3 s", what: "fully verified" },
      { phase: "eject", at: "4.3-4.5 s", what: "card slides back up, 250 ms; LCD clears" },
    ],
    rules: [
      "the sleeve must clip the card: card behind the lip, above the body, so it visually enters a slot",
      "lights wrap rounded corners with inset box-shadows on one overlay, never stacked linear gradients (they show a seam)",
      "the body dissolves into black toward its base: a mask, not a gradient fill",
    ],
  },
  {
    slug: "lamp-carriage-typewriter",
    title: "Lamp carriage typewriter",
    source: "15 s, 498x1080, 60 fps portrait clip; keyboard omitted",
    palette: { bg: "#171717", paper: "#ede6db", paperNight: "#343533", paperLit: "#e2d1ae", rod: "#585f61", olive: "#6f8164", uiText: "#adafa5", controls: "#ada69b" },
    geometry: [
      "paper from y 210 to 688, full width, elliptical top corners 55x180",
      "typed text left 100, right limit 440, 26 px on 34 px leading, bottom-anchored at y 432 so lines grow upward",
      "rod y 467-493 with 20 px end caps; capsule 92x46 with LEDs at 10/23/36 and a clamp band under the lamp post",
      "cone apex at the lamp head; 144 deg spread (66 deg half-angle measured), reach 230 px, 14 deg soft edge",
    ],
    type: ["typewriter face 26 px with per-glyph baseline jitter of +-0.8 px and ink weight 78-100%", "UI labels mono 10-13 px, letter-spaced"],
    motion: [
      { phase: "night", at: "1.3-1.9 s", what: "paper dims first, sliders fade in, lamp strikes on 380 ms later with a short flicker" },
      { phase: "keystroke", at: "each key", what: "carriage eases to the caret in 180 ms; an electric arc flashes inside the capsule's right end for 260 ms; both LEDs blink orange" },
      { phase: "wrap", at: "line end", what: "previous line moves up, carriage returns to the left" },
      { phase: "idle", at: "always", what: "cone breathes a few percent on a 3.6 s cycle; a thread swings 800 ms after each move" },
    ],
    rules: [
      "measure line breaks from the clip: the text column was narrower than the paper (100 to 440)",
      "a strike effect belongs inside the object it comes from, not floating above it",
      "the light must follow the carriage through its easing (animate the custom property), or it snaps ahead",
    ],
  },
];

export type Note = { slug: string; title: string; body: string[]; from: string[] };

export const NOTES: Note[] = [
  {
    slug: "measuring-from-video",
    title: "Measure a UI from its clip, not from memory",
    body: [
      "Extract frames at 2 fps plus full-resolution stills of each resting state. Twelve stills cover a six-second interaction.",
      "Dump stills to raw RGB and read exact hex values, bounding boxes and edge-luminance profiles. The profiles give you the lighting direction and rim width.",
      "Trace mean luminance over the moving region per frame to get every transition's duration. Easing is still a judgement call.",
      "Render the rebuild headlessly beside the source frame and fix what differs. Stills miss motion defects, so capture the hover timeline too.",
    ],
    from: ["id-card-reader-hover", "lamp-carriage-typewriter"],
  },
  {
    slug: "machined-metal-buttons",
    title: "Convex metal buttons on a dark canvas",
    body: [
      "Body: a vertical gradient that darkens toward the lip, with a lighter band near the bottom for the reflection of the surface below. That band sells the curve.",
      "Cap: a pseudo-element over the top half with a soft white sheen and a hard 1 px specular line on the rim.",
      "Bevel: light left edge, dark right edge, 1 px dark ring, a hard 3 px thickness shadow, then a soft 24 px ambient drop. Press sinks 2 px and collapses the shadow.",
      "Text is engraved: dark text on light metal carries a white bottom shadow; light text on dark metal a black top shadow.",
      "Brushed grain at 18% opacity. At 60% it bands on 3x displays. Skip animated sheens: a moving band read as a glitch in testing.",
    ],
    from: [],
  },
  {
    slug: "pressed-slot-badges",
    title: "Badges as pressed slots, so they never read as buttons",
    body: [
      "A recess cut into the surface: dark fill, hard 1 px dark edge at the top of the slot, 5 px inner shadow, a light rim on the bottom lip.",
      "The active chip is a light insert pressed into the same recess, not a raised block.",
      "On near-black canvases the first pass was invisible; the recess needs more depth than it would on grey.",
    ],
    from: [],
  },
  {
    slug: "dark-silver-tokens",
    title: "A dark, silver, single-accent system",
    body: [
      "Gutter #0a0a0a, canvas #111111, card #181818, type #f5f5f5, silver #c9c9c9 and #e8e8e8 for emphasis, subtle #8a8a8a, hairlines at 8% and 14% white.",
      "No colour in the chrome. Colour belongs to the content, so the feed's posters carry it and the shell never competes.",
      "Buttons are the only convex things. Everything else is flat or recessed.",
    ],
    from: [],
  },
  {
    slug: "motion-from-stills",
    title: "Giving motion to a still, honestly",
    body: [
      "A still carries layout, colour and type. It carries no timing. Label added motion as proposed, not observed.",
      "Three slots cover most components: enter (fade up 12 px, 320 ms), hover (lift 2 px with shadow), press (scale 0.98). Offer them as presets and let the user change them.",
      "When a clip exists, take the timing from it instead. Measured beats designed.",
    ],
    from: ["lamp-carriage-typewriter"],
  },
];

export function searchEntries(q: string, opts: { category?: string; kind?: Entry["kind"]; limit?: number } = {}) {
  const needle = q.trim().toLowerCase();
  const words = needle ? needle.split(/\s+/) : [];
  const scored = ENTRIES.filter((e) => !e.sponsored)
    .filter((e) => (opts.category ? e.category.toLowerCase() === opts.category.toLowerCase() : true))
    .filter((e) => (opts.kind ? e.kind === opts.kind : true))
    .map((e) => {
      const hay = `${e.title} ${e.category} ${e.types.join(" ")} ${e.description}`.toLowerCase();
      const score = words.length ? words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0) + (e.title.toLowerCase().includes(needle) ? 2 : 0) : 1;
      return { e, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || Number(Boolean(b.e.video)) - Number(Boolean(a.e.video)));
  return scored.slice(0, opts.limit ?? 12).map((x) => x.e);
}

export const CATEGORIES = Array.from(new Set(ENTRIES.map((e) => e.category))).sort();
export const SECTION_NAMES = [...SECTIONS];

export function publicEntry(e: Entry) {
  return { slug: e.slug, title: e.title, kind: e.kind, category: e.category, types: e.types, author: e.author, description: e.description, ratio: Number(e.ratio.toFixed(3)), duration: e.duration ?? null, demo: e.video ? e.video.src : null, recipe: recipeFor(e)?.slug ?? null };
}

export function recipeFor(e: Entry) {
  return RECIPES.find((r) => e.title.toLowerCase().includes(r.title.split(",")[0].toLowerCase().split(" ")[0]) && e.video);
}
