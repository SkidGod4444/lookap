import { ENTRIES, SECTIONS, sectionSlug, type Entry } from "@/lib/data";
import { METHOD, SPECS, type Spec } from "@/lib/specs";
import { DRAFT_NOTE, draftFor } from "@/lib/drafts";

/* The lookap registry: what the MCP server serves. Three kinds of knowledge:
   1. entries, the curated feed (title, category, types, author, media, credit)
   2. recipes, measured rebuilds: values read from a clip's pixels, with the motion table
   3. notes, design guidance distilled from the work, each tied to the recipes it came from
   Everything here is ours: measured by us or written by us. */

export type Recipe = {
  slug: string;
  /* the catalog id of the clip it was measured from; the entry whose ref contains it carries the recipe */
  ref: string;
  title: string;
  source: string;
  palette: Record<string, string>;
  geometry: string[];
  type: string[];
  motion: { phase: string; at: string; what: string }[];
  rules: string[];
  /* what the rebuild cost: read from the session transcript that produced it, not estimated */
  build: { model: string; modelId: string; outputTokens: number; totalTokens: number; toolCalls: number; minutes: number; rounds: number; date: string };
} & Spec;

const MEASURED: Omit<Recipe, keyof Spec>[] = [
  {
    slug: "id-card-reader-hover",
    ref: "ft7ve7j",
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
    build: { model: "Claude Fable 5.1", modelId: "claude-fable-5-1", outputTokens: 108605, totalTokens: 12467511, toolCalls: 49, minutes: 17, rounds: 8, date: "2026-10-20" },
  },
  {
    slug: "lamp-carriage-typewriter",
    ref: "muhvp71",
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
    build: { model: "Claude Fable 5.1", modelId: "claude-fable-5-1", outputTokens: 457063, totalTokens: 31633521, toolCalls: 90, minutes: 21, rounds: 3, date: "2026-10-20" },
  },
];

/* prose + spec = the recipe an agent gets; the method rides along so a different agent can repeat the measuring */
export const RECIPES: Recipe[] = MEASURED.map((r) => ({ ...r, ...SPECS[r.slug] }));
export { METHOD };

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
    from: ["qw9pku-skeuomorphic-privacy-data-vault", "35ihv-typewriter-writing-app"],
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

export type SearchOpts = { category?: string; kind?: Entry["kind"]; section?: string; tone?: Entry["tone"]; author?: string; limit?: number };

/* Ranked search. Title hits outrank type hits, which outrank description hits; a whole-phrase title match tops all.
   Filters narrow before ranking. An empty query with filters is a browse. */
export function searchEntries(q: string, opts: SearchOpts = {}) {
  const needle = q.trim().toLowerCase();
  const words = needle ? needle.split(/\s+/).filter((w) => w.length > 1) : [];
  const section = opts.section ? sectionSlug(opts.section) : null;
  const scored = ENTRIES.filter((e) => !e.sponsored)
    .filter((e) => (opts.category ? e.category.toLowerCase() === opts.category.toLowerCase() : true))
    .filter((e) => (opts.kind ? e.kind === opts.kind : true))
    .filter((e) => (opts.tone ? e.tone === opts.tone : true))
    .filter((e) => (opts.author ? e.authorName.toLowerCase().includes(opts.author.toLowerCase()) || e.x?.toLowerCase() === opts.author.toLowerCase().replace(/^@/, "") : true))
    .filter((e) => (section ? sectionSlug(e.category) === section || e.types.some((t) => sectionSlug(t) === section) : true))
    .map((e) => {
      const title = e.title.toLowerCase(), types = e.types.map((t) => t.toLowerCase()), desc = e.description.toLowerCase(), cat = e.category.toLowerCase();
      let score = words.length ? 0 : 1;
      for (const w of words) {
        if (title.includes(w)) score += 4;
        if (cat === w || types.some((t) => t === w)) score += 3;
        else if (types.some((t) => t.includes(w))) score += 2;
        if (desc.includes(w)) score += 1;
      }
      if (needle && title.includes(needle)) score += 6;
      return { e, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || Number(Boolean(b.e.video)) - Number(Boolean(a.e.video)));
  return scored.slice(0, opts.limit ?? 12).map((x) => x.e);
}

/* Entries that share types with this one, then category, then kind. A rare shared type (Segmented) counts for more
   than a common one (Dark). The entry itself is never returned. */
const TYPE_COUNT = new Map<string, number>();
for (const e of ENTRIES) for (const t of e.types) TYPE_COUNT.set(t.toLowerCase(), (TYPE_COUNT.get(t.toLowerCase()) ?? 0) + 1);
const rarity = (t: string) => 1 / Math.log(2 + (TYPE_COUNT.get(t.toLowerCase()) ?? 1));

export function similarEntries(e: Entry, limit = 8) {
  const mine = new Set(e.types.map((t) => t.toLowerCase()));
  return ENTRIES.filter((x) => x.slug !== e.slug && !x.sponsored)
    .map((x) => ({ x, score: x.types.filter((t) => mine.has(t.toLowerCase())).reduce((n, t) => n + 6 * rarity(t), 0) + (x.category === e.category ? 1.5 : 0) + (x.kind === e.kind ? 0.5 : 0) + (x.tone === e.tone ? 0.5 : 0) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.x);
}

/* What the catalog is made of, so an agent learns the vocabulary before it searches. */
export function facets() {
  const count = (pick: (e: Entry) => string[]) => {
    const m = new Map<string, number>();
    for (const e of ENTRIES) if (!e.sponsored) for (const k of pick(e)) m.set(k, (m.get(k) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, n }));
  };
  return { kinds: count((e) => [e.kind]), categories: count((e) => [e.category]), tones: count((e) => [e.tone]), types: count((e) => e.types).slice(0, 40) };
}

/* A rebuild brief for an entry with no measured recipe: everything the record and the notes can say, with timing
   labeled as proposed. When a measured recipe exists it is the brief, and this points at it. */
export function briefFor(e: Entry) {
  const recipe = recipeFor(e);
  const draft = recipe ? undefined : draftFor(e);
  const wide = e.ratio >= 1.2, tall = e.ratio < 0.85;
  const notes = NOTES.filter((n) => n.slug === "motion-from-stills" || (e.tone === "dark" && n.slug === "dark-silver-tokens") || (e.types.some((t) => /button|toggle|switch/i.test(t)) && n.slug === "machined-metal-buttons"));
  return {
    slug: e.slug,
    title: e.title,
    measured: Boolean(recipe),
    recipe: recipe?.slug ?? null,
    what: e.description,
    frame: { ratio: Number(e.ratio.toFixed(3)), shape: tall ? "portrait" : wide ? "landscape" : "square", media: e.video ? "clip" : "still" },
    tone: e.tone === "dark" ? "dark surface, light type" : e.tone === "light" ? "light surface, dark type" : "coloured surface; take the palette from the media",
    traits: e.types,
    section: e.category,
    steps: [
      "Call see_design for the frame and read the layout from it: regions, alignment, type scale, corner radii, spacing rhythm.",
      e.video ? "The media is a clip: name each state you can see (rest, hover, press, open) and the order they occur in." : "The media is a still: it carries layout, colour and type, not timing.",
      "Build with the project's own stack and tokens; match proportion and hierarchy before matching pixels.",
      draft ? "A draft measurement is attached: its phases, moves and palette are measured from the clip; its boxes are a first pass to check against the keyframes." : e.video ? "Timing below is proposed, not measured. Ask for get_recipe when a measured one exists." : "Timing below is proposed, not observed. Label it so in the code.",
    ],
    draft: draft ? { frame: draft.frame, duration: draft.duration, phases: draft.phases, keyframes: draft.keyframes.map((k) => ({ name: k.name, at: k.at, hold: k.hold })), background: draft.background, palette: draft.palette, elements: draft.elements, motion: draft.motion, coverage: draft.coverage, confidence: DRAFT_NOTE } : null,
    motion: {
      status: recipe ? "measured, see get_recipe" : draft ? "draft measured: see draft.phases and draft.motion for what moved, when and how far" : "proposed",
      enter: "fade up 12 px, 320 ms, cubic-bezier(0.2, 0.8, 0.2, 1)",
      hover: e.types.some((t) => /hover|card/i.test(t)) ? "ring brightens or lift 2 px with shadow, 150 ms" : "colour or ring only, 150 ms",
      press: "scale 0.98, 120 ms",
      reducedMotion: "respect prefers-reduced-motion: no entrance, instant hover",
    },
    notes: notes.map((n) => ({ slug: n.slug, title: n.title })),
    credit: { author: e.authorName, x: e.x ?? null, source: e.sourceUrl ?? null },
    method: METHOD,
    build: recipe ? { ...recipe.build, note: "whole-session totals for the measured rebuild, feedback rounds included; with the recipe in hand expect one pass" } : null,
    oneShot: recipe
      ? "get_recipe has every value as data: frame, elements with boxes, timing, states, keyframes, checks. Build from it, render, then call check_rebuild with a screenshot and fix what it reports. A Max key can call get_rebuild for the finished file and port it."
      : draft
        ? "No measured recipe, but a draft: build from draft.elements and draft.motion, look at each keyframe with see_design (at), then call check_rebuild with a screenshot; its regions are reliable, its element rows are as good as the draft boxes."
        : "No measured recipe yet: see_design, build from the frame, then compare by eye against it.",
  };
}

export const CATEGORIES = Array.from(new Set(ENTRIES.map((e) => e.category))).sort();
export const SECTION_NAMES = [...SECTIONS];

/* The tools the MCP server registers, with the plan that opens each. The /mcp page and the home count read this. */
/* name for the protocol, title and line for people, plan that opens it */
export const TOOLS = [
  ["search_designs", "Search the registry", "Find interfaces by words, section, kind, tone or designer. Returns facets too.", "starter"],
  ["similar_designs", "Designs like this one", "Entries that share traits with one slug.", "starter"],
  ["get_design", "One design, in full", "Attribution, traits, media and the measured recipe for one entry.", "starter · recipe pro"],
  ["get_brief", "Rebuild brief", "How to rebuild an entry: frame, tone, steps, proposed motion, notes that apply.", "starter"],
  ["see_design", "See a design", "The entry's frame as an image, or a named keyframe of the clip, for agents that can look.", "pro"],
  ["look_at", "Look at a clip", "A contact sheet of the clip, the frame nearest any moment, a crop enlarged beside your own render, exact colours along a line.", "pro"],
  ["check_rebuild", "Check a rebuild", "Send a screenshot of your build; get back the regions and colours that differ from the reference frame.", "pro"],
  ["get_rebuild", "The finished rebuild", "The finished rebuild as one HTML file, to port to your stack.", "max"],
  ["get_usage", "What is left", "Today's calls, the month's quotas, and what the next plan adds.", "starter"],
  ["get_recipe", "Measured recipe", "Palette, geometry, type and motion table, read from the clip's pixels.", "pro"],
  ["get_method", "How clips are measured", "The measuring steps behind every recipe, to apply to a clip of your own.", "starter"],
  ["list_notes", "Design notes", "Design guidance distilled from the rebuilds.", "starter"],
  ["get_note", "One note", "One note in full.", "starter"],
  ["check_media", "Check a clip", "Does this clip or still hold an interface? Signals, verdict, score.", "pro"],
] as const;

export function publicEntry(e: Entry) {
  return { slug: e.slug, title: e.title, kind: e.kind, category: e.category, types: e.types, tone: e.tone, author: e.authorName, x: e.x ?? null, sample: e.sample, description: e.description, ratio: Number(e.ratio.toFixed(3)), duration: e.duration ?? null, media: e.video ? { type: "video" as const, src: e.video.src, w: e.video.w, h: e.video.h } : e.image ? { type: "image" as const, src: e.image.src, w: e.image.w, h: e.image.h } : null, source: e.sourceUrl ?? null, recipe: recipeFor(e)?.slug ?? null, draft: !recipeFor(e) && Boolean(draftFor(e)) };
}

/* 108605 -> "109k", 12467511 -> "12.5M" */
export function tokens(n: number) {
  return n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n);
}

export function recipeFor(e: Entry) {
  return e.ref ? RECIPES.find((r) => e.ref!.includes(`/${r.ref}-`) || e.ref!.endsWith(`/${r.ref}`)) : undefined;
}
