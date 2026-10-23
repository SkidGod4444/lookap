/* What agents get wrong when they rebuild a clip, learned from the factory's judged rounds. Every rebuild the factory
   runs is judged criterion by criterion against the designer's clip; the failures repeat across entries. Each lesson
   is one repeated failure, the rule that avoids it, and the tool call that checks it.

   `applies` picks the lessons for one entry from the words in its checklist (null: every entry). `caught` recognises
   the lesson in a judge's failure note; scripts/lessons.ts counts those over every judged round into lessons.json, so
   the brief lists the most widespread first and says in how many rebuilds each appeared (once per rebuild, matched
   loosely by words, so a guide to order, not a statistic). Run
   `bun scripts/lessons.ts` after factory runs to refresh the counts. */
import counts from "./lessons.json";

export type Lesson = { id: string; title: string; rule: string; check: { pro: string; starter: string }; applies: RegExp | null; caught: RegExp };

export const LESSONS: Lesson[] = [
  {
    id: "stroke-weight",
    title: "Strokes and small marks drawn too thin or too small",
    rule: "Rings, spinners, chevrons, ticks, dashes, dots and outlines come out thinner and smaller than the clip's almost every time: an agent's default is a 1.5 px line icon. Measure the stroke width and the mark's outer size in source pixels and use those numbers. A spinner is usually a thick ring on a faint track, not a thin open arc.",
    check: { pro: "look_at what=zoom on each small mark at 4x; count the stroke in pixels, beside the same crop of your render", starter: "see_design at the moment the mark is largest; compare its stroke against a known size such as the text's cap height" },
    applies: null,
    caught: /\b(thin|thinner|thicker|bolder|heavier|lighter)(,? \w+)? (ring|rings|arc|arcs|stroke|strokes|line|lines|tick|chevron|dashes|open arc|partial arcs?)\b|\bstroke\b(?!s? and weave)|\b(smaller|larger|half the size|60% the size|about \d+px against)\b/,
  },
  {
    id: "text-grey",
    title: "Secondary text set too light",
    rule: "Subtitles, captions and body copy end up a lighter grey than the clip's. Anti-aliasing makes an averaged sample look lighter than the ink: take the darkest pixels inside the glyph stems, not the average of the text box.",
    check: { pro: "look_at what=colors along a line through the thickest strokes of a word; use the darkest value", starter: "see_design and compare the grey against the headline's colour; when unsure, go darker" },
    applies: /\b(subtitle|subhead|caption|body|label|copy|reads)\b/,
    caught: /\b(grey|gray)\b.*\b(lighter|dimmer|paler)\b|\b(lighter|dimmer|paler)\b.*\b(grey|gray)\b/,
  },
  {
    id: "text-width",
    title: "Text the right words but the wrong width",
    rule: "A substituted or wrongly weighted font sets the same words 5 to 10 percent wider or narrower. Measure the pixel width of one full line in the clip and adjust font-size, weight and letter-spacing until your line matches it within 2 percent. Script and handwritten faces need the right family, not the nearest script.",
    check: { pro: "look_at what=zoom on the longest line; read its left and right edge in source pixels and compare with your render", starter: "see_design and compare where each line ends against a fixed point such as a card edge" },
    applies: /\b(reads|headline|title|text|label)\b/,
    caught: /\b(wider|narrower|tracking|bolder and wider|heavier and wider|different font|different script|script is)\b/,
  },
  {
    id: "icon-style",
    title: "Library outline icons where the clip has its own glyphs",
    rule: "Agents reach for an outline icon set. The clip's icons are often filled, chunky or glossy, and of a different shape. Match fill against outline, the weight and the silhouette; draw the SVG path from the zoomed frame instead of picking the nearest named icon.",
    check: { pro: "look_at what=zoom on each icon; note filled or outlined, weight, and any highlight", starter: "see_design and name each icon's fill and shape before choosing one" },
    applies: /\b(icon|glyph|logo|avatar|badge)\b/,
    caught: /\b(outline icons?|thin outline|outlined|filled|chunky|glyph|glyphs|icon is|icons are)\b/,
  },
  {
    id: "shadow-depth",
    title: "Shadows and borders too faint",
    rule: "Drop shadows, hairline borders and the step between a card and its background are drawn weaker than in the clip, until cards float on nothing. Sample the shadow's darkest row and its spread; sample a card's fill against the page: pure white on grey reads very differently from off-white on grey.",
    check: { pro: "look_at what=colors on a vertical line from inside a card down through its shadow into the background", starter: "see_design and compare card, border and background tones side by side" },
    applies: /\b(shadow|card|border|outline|panel|button)\b/,
    caught: /\b(shadow|border|outline)\b.*\b(fainter|faint|invisible|barely|no visible|heavier)\b|\b(off-white|pure white)\b/,
  },
  {
    id: "glow-falloff",
    title: "Glows and washes flat, mis-centred or the wrong strength",
    rule: "A radial glow or colour wash has a centre, a peak colour and a falloff. Agents draw an even tint across the whole element. Find where it is strongest, sample the peak and two points on the way out, and build the gradient from those stops. Halftone and dot fields: match dot size, spacing and where they fade.",
    check: { pro: "look_at what=colors on a line from the glow's brightest point to the element's edge", starter: "see_design and mark where the glow is strongest and where it disappears" },
    applies: /\b(glow|halo|wash|gradient|radial|halftone|dots|tint)\b/,
    caught: /\b(glow|wash|halftone|dither|dots|tint|saturated|paler|flatter)\b/,
  },
  {
    id: "texture-not-blur",
    title: "Blur used to fake texture or glass",
    rule: "A painting, canvas, grain or foliage is not a blurred gradient, and glass is not a stroked outline. Painted or photographic imagery comes from the clip itself (sampled, under the imagery rule) or is drawn with real texture. Glass shows the background displaced and magnified inside the shape, with a bright rim.",
    check: { pro: "look_at what=patch or what=plate for the picture; look_at what=zoom on a glass edge to see how far the background shifts across it", starter: "see_design at full size and describe the texture before drawing it; never substitute blur" },
    applies: /\b(paint|painting|canvas|brush|texture|grain|marble|glass|lens|refract|photo|foliage|wood|leather|metal)\b/,
    caught: /\b(blur|blurred|smooth|texture|brush|canvas|impasto|refract|magnif|weave|displacement)\b/,
  },
  {
    id: "motion-distance",
    title: "Motion the right kind but the wrong distance or speed",
    rule: "Agents get what moves right and how far wrong: a slide of 88 px built as 19, a rise twice as fast. Track every moving element and read its start, end and timing from the clip. A move is right when its position matches at three moments, not when it looks similar.",
    check: { pro: "look_at what=track on the moving edge; build from the measured positions and times", starter: "see_design at the start, middle and end of each move and read the positions against fixed points" },
    applies: /\b(moves?|slides?|rises?|drops?|springs?|grows?|scrolls?|stretch|overshoot)\b/,
    caught: /\b(moves? (only )?about|too fast|too slow|px against|different heights|starts at about|lands)\b/,
  },
  {
    id: "position",
    title: "Positions and spacing off by tens of pixels",
    rule: "Parts land 20 to 40 px from where the clip has them, and repeated parts get uneven spacing. Read every box from the clip, not by eye: the brief's boxes are a first pass, so confirm each against a frame. Repeated parts (rings, rows, cards) share one pitch; measure it once and step by it.",
    check: { pro: "look_at what=zoom on each part's edges; read its top-left and size in source pixels and compare with your render", starter: "see_design and check each part's edges against fixed points such as the frame edge or a neighbouring card" },
    applies: null,
    caught: /\b(sits|shifted|higher|lower|spacing|uneven|off by|inset|top edges?|ring tops)\b/,
  },
  {
    id: "invented-motion",
    title: "Motion added that the clip does not have",
    rule: "Agents add habits: a press shrink, a hover lift, an easing bounce, a fade. If the clip does not show it, it is wrong, however good it looks. Build only the moves you can see in the clip and leave everything else still.",
    check: { pro: "look_at what=diff across each interaction; anything that moves in your render and not in the clip's diff comes out", starter: "see_design before and after each interaction; remove any change the clip does not show" },
    applies: null,
    caught: /\bclip's .* (looks|stays) (about )?the same\b.*\brebuild's\b|\bthe clip (does not|doesn't) (move|change)\b/,
  },
  {
    id: "end-state",
    title: "The end of the clip assumed to hold still",
    rule: "Clips often keep changing in their last seconds: a fade out, a reset, a loop back. Agents stop the timeline at the last big move. Look at the final two seconds separately and rebuild what happens there.",
    check: { pro: "look_at what=diff between the last moments half a second apart", starter: "see_design at the last moment and one second before it" },
    applies: null,
    caught: /\b(end state|final state|holds still|faded|does not hold|by \d+(\.\d+)?s the)\b/,
  },
  {
    id: "shape-detail",
    title: "Shapes simplified and small parts dropped",
    rule: "A bubble's tail, an antenna, the gaps in staggered bars, a curved bulge built as a straight wedge, a sliver of an avatar: agents simplify the outline and drop small parts. Before drawing any shape, zoom on it and list its parts; check each part is in your render.",
    check: { pro: "look_at what=zoom on each shape and list every part, then the same crop of your render", starter: "see_design and list each shape's parts before drawing it" },
    applies: null,
    caught: /\b(no tail|no antenna|missing|merge|only a small|tapering|wedges|straight|regular|simplif|no .* sliver)\b/,
  },
];

type Counts = { rounds: number; rebuilds: number; at: string; lessons: Record<string, { fails: number; rebuilds: number; example?: string }> };
const COUNTS = counts as Counts;

/* The lessons for one entry: up to five its own checklist names, then the three most widespread general ones; within
   each group the most widespread first (rebuilds it showed up in, then failures). Only the rebuild count is shown. */
const rank = (x: Lesson) => [COUNTS.lessons[x.id]?.rebuilds ?? 0, COUNTS.lessons[x.id]?.fails ?? 0];
const byRank = (a: Lesson, b: Lesson) => rank(b)[0] - rank(a)[0] || rank(b)[1] - rank(a)[1];
const shape = (l: Lesson, plan: "starter" | "pro" | "team") => {
  const n = COUNTS.lessons[l.id];
  return { title: l.title, rule: l.rule, check: plan === "starter" ? l.check.starter : l.check.pro, ...(n?.rebuilds ? { seen: `in ${n.rebuilds} of ${COUNTS.rebuilds} judged rebuilds so far` } : {}) };
};
export function lessonsFor(said: string, plan: "starter" | "pro" | "team", own = 5, general = 3) {
  const text = said.toLowerCase();
  const mine = LESSONS.filter((l) => l.applies && text && l.applies.test(text)).sort(byRank).slice(0, own);
  const always = LESSONS.filter((l) => !l.applies).sort(byRank).slice(0, general);
  return [...mine, ...always].map((l) => shape(l, plan));
}

/* every lesson, for get_method */
export function allLessons(plan: "starter" | "pro" | "team") {
  return [...LESSONS].sort(byRank).map((l) => shape(l, plan));
}
