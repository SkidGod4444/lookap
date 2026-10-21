/* Structured rebuild specs: the measured recipes as data an agent can map one to one, in frame pixels of the clip
   see_design serves. Boxes are [x, y, w, h] in that frame at the first keyframe. Elements that move carry static: false
   and the motion rows say how far. Checks are facts a build can be tested against at a named keyframe. */

export type Box = [number, number, number, number];
export type Element = { name: string; box: Box; radius?: string; fill?: string; z?: number; static?: boolean; note?: string };
export type Timing = { name: string; ms: number; easing?: string; property: string; from: string; to: string; note?: string };
export type Spec = {
  /* crop: the part of the frame the recipe covers, when the clip shows more (a keyboard, a browser) */
  frame: { w: number; h: number; unit: string; crop?: Box };
  elements: Element[];
  timing: Timing[];
  states: { name: string; trigger: string; what: string }[];
  keyframes: { name: string; at: number; src: string; shows: string }[];
  checks: { at: string; check: string }[];
};

/* How every recipe was made. An agent that follows this on a new clip gets the same kind of numbers. */
export const METHOD = [
  "Fetch the clip; read size, fps and duration from the container.",
  "Dump frames at 2 fps plus a contact sheet; pick the idle and active moments and dump those at full resolution.",
  "Convert the chosen frames to raw RGB and measure: bounding boxes of every element, exact hex at flat regions, luminance profiles across edges for the lighting, a per-frame luma trace of the moving region for timing.",
  "Build with one unit, --u, equal to one source pixel at the design size, and write every size as calc(N * var(--u)).",
  "Light rounded objects with inset box-shadows on one overlay (rim, near glow, wide falloff); stacked linear gradients show a seam at the corner.",
  "Render the build headless at --u: 1px, crop to the frame, put it beside the source frame, and look. Fix the three largest differences. Repeat.",
];

const CARD_ORIGIN = { x: 289, y: 194 }; /* the rig's top-left in the designer's 1080 frame: card x 350..724 from y 194, sleeve x 289..784, measured */
const c = (x: number, y: number, w: number, h: number): Box => [CARD_ORIGIN.x + x, CARD_ORIGIN.y + y, w, h];

export const SPECS: Record<string, Spec> = {
  "id-card-reader-hover": {
    frame: { w: 1080, h: 1080, unit: "1 source px; the rig is 518 x 700 at (289, 192), centred" },
    elements: [
      { name: "rig", box: c(0, 0, 518, 700), note: "container; nothing outside it but black" },
      { name: "card", box: c(59, 0, 376, 240), radius: "28", fill: "#2170f5", z: 1, static: false, note: "inset 0 2px 0 rgba(255,255,255,.28) top edge, inset 0 -1px 0 rgba(0,0,0,.18); a 36 px shade band from y 122 of the card where it enters the slot" },
      { name: "card.avatar", box: c(92, 35, 76, 76), radius: "50%", fill: "rgba(255,255,255,.14)", note: "ring 2 px rgba(255,255,255,.42); person glyph 36 px, white, stroke 1.9" },
      { name: "card.name", box: c(193, 40, 240, 42), note: "humanist sans 36 px regular, white, letter-spacing -0.01em; company line 24 px #b7cdfb, 8 px below" },
      { name: "sleeve", box: c(0, 160, 496, 530), radius: "30 30 26 26", fill: "linear-gradient(180deg,#181818 0%,#181818 70%,#141414 100%)", z: 2, note: "masked to transparent from 80% to 98% of its height so the body dissolves into black; 1.5 px rim rgba(255,255,255,.075)" },
      { name: "sleeve.lip", box: c(0, 160, 496, 118), radius: "30 30 0 0", fill: "linear-gradient(180deg,#272727 0%,#1c1c1c 45%,#181818 100%)", note: "inset 0 2px 0 rgba(255,255,255,.14); a 4 px seam under it: #080808 to rgba(255,255,255,.07)" },
      { name: "sleeve.arrow", box: c(47, 200, 28, 24), fill: "#ffffff", note: "upward triangle, borders 14/14/24" },
      { name: "tab", box: c(496, 184, 22, 48), radius: "9", fill: "linear-gradient(180deg,#fff 0%,#e8e8e8 55%,#d4d4d4 100%)", z: 3, note: "the eject tab on the sleeve's right edge; shadow 0 1px 3px rgba(0,0,0,.8)" },
      { name: "lcd", box: c(33, 286, 430, 212), radius: "14", fill: "#0f0f0f", note: "dot grid: radial #171717 1.4 px on an 8 px pitch; inset 0 3px 6px rgba(0,0,0,.95); padding 22 20 0 28; four rows on a 44.7 px pitch" },
      { name: "lcd.rows", box: c(61, 308, 374, 179), note: "Doto 32 px bold, ROND 100; labels Identity, Access, Data, AI usage at #858585, #f0f0f0 when active with a 4 px glow; values right-aligned; check 26 px #11d04a" },
      { name: "ridges", box: c(33, 528, 430, 162), note: "eight bars 28 wide, radius 14 on top, space-between; each lit by inset shadows: top 2 px black, 1.5 px highlight above, 1.5 px highlight at both sides" },
    ],
    timing: [
      { name: "pre-press", ms: 260, easing: "cubic-bezier(.45,0,.2,1)", property: "card translateY", from: "0", to: "8 px", note: "starts on pointer enter; insert follows after 350 ms" },
      { name: "insert", ms: 260, easing: "cubic-bezier(.45,0,.2,1)", property: "card translateY", from: "8 px", to: "118 px" },
      { name: "labels", ms: 220, property: "label colour", from: "#858585", to: "#f0f0f0" },
      { name: "type", ms: 22, property: "characters per step", from: "0", to: "1", note: "first row 260 ms after insert; next row 60 ms after each check" },
      { name: "check", ms: 160, easing: "cubic-bezier(.34,1.56,.64,1)", property: "check scale", from: "0", to: "1" },
      { name: "eject", ms: 260, easing: "cubic-bezier(.45,0,.2,1)", property: "card translateY", from: "118 px", to: "0", note: "on pointer leave; the LCD clears at once" },
    ],
    states: [
      { name: "rest", trigger: "no pointer", what: "card 158 px exposed above the lip, LCD shows the four labels and no values" },
      { name: "pre", trigger: "pointer enters the rig (fine pointers only)", what: "card dips 8 px" },
      { name: "in", trigger: "350 ms after enter, or tap on coarse pointers", what: "card slides 118 px into the slot; labels brighten; values type in top to bottom with a check after each" },
      { name: "eject", trigger: "pointer leaves, or second tap", what: "card returns, values clear, labels dim" },
    ],
    keyframes: [
      { name: "rest", at: 0.3, src: "/demos/frames/id-card-reader-hover/rest.jpg", shows: "idle rig, cursor outside" },
      { name: "inserted", at: 2.1, src: "/demos/frames/id-card-reader-hover/inserted.jpg", shows: "card in, first rows typing" },
      { name: "verified", at: 3.7, src: "/demos/frames/id-card-reader-hover/verified.jpg", shows: "all four rows checked" },
      { name: "ejected", at: 5.0, src: "/demos/frames/id-card-reader-hover/ejected.jpg", shows: "card back out, LCD cleared" },
    ],
    checks: [
      { at: "rest", check: "card spans x 350..724 (376 px) with its top at y 194; sleeve spans x 289..784 (496 px) from y 354; the blue at the card's centre is #2170f5" },
      { at: "rest", check: "the eject tab is 22 x 48 at x 785, y 378, nearly white; the LCD is 430 x 212 at x 322, y 480 and shows four labels in #858585 with no values" },
      { at: "inserted", check: "the card has moved 118 px down: 40 px of blue remains above the lip; the Identity label is #f0f0f0 and its value is typing" },
      { at: "verified", check: "values read Verified, Restricted, Restricted, Limited, each with a #11d04a check 26 px tall at the row's right" },
      { at: "ejected", check: "the card is back at y 194 and the LCD values are empty" },
      { at: "rest", check: "lighting: the sleeve's left rim luma falls from 110 to 30 over 36 px, the top rim holds 107 for 6 px, the right rim is a 1 px line; no visible seam at the top-left corner" },
    ],
  },
  "lamp-carriage-typewriter": {
    frame: { w: 498, h: 1080, unit: "1 source px of the designer's clip; the recipe covers the top 700 px, the keyboard below is not rebuilt", crop: [0, 0, 498, 700] },
    elements: [
      { name: "top", box: [0, 0, 498, 140], fill: "#171717", note: "back arrow 16 px at (46, 91); count in mono 13 px, letter-spacing .08em, right edge at x 416, top 86; share glyph 19 x 20 at (443, 87); all #adafa5" },
      { name: "paper", box: [0, 210, 498, 478], radius: "55 55 0 0 / 180 180 0 0", fill: "#ede6db", note: "night #343533; fractal grain at 85% multiply; about 70 seeded ink specks 0.6 to 2.2 px" },
      { name: "paper.hint", box: [0, 314, 498, 14], note: "'Need a first line?' centred, typewriter face 12 px #5e574f; hidden once text exists or at night" },
      { name: "paper.text", box: [100, 398, 340, 34], note: "column x 100..440; last line's bottom at y 432 and lines stack upward; Special Elite 26 px on 34 px; ink #35332e, night #2a2924; each glyph offset +-0.8 px and 78..100% opacity, seeded by index" },
      { name: "rod", box: [0, 467, 498, 26], fill: "linear-gradient(180deg,#343b3d 0%,#585f61 22%,#585f61 50%,#1e2023 100%)", note: "end caps 20 x 30 at both ends, radius 3; night: #37372a/#1b1b14/#0a0a08/#2e3022" },
      { name: "carriage", box: [55, 428, 92, 76], static: false, note: "its centre x equals the caret x (101 at rest); clamped to 96..446" },
      { name: "carriage.capsule", box: [55, 458, 92, 46], radius: "23", fill: "linear-gradient(180deg,#8c9a80 0%,#6f8164 30%,#6f8164 55%,#4e5a46 100%)", static: false, note: "LEDs 6 px at x +10, +23, +36 on y +18: green #39d44a lit, two dark; night turns the second orange #ff8a2a" },
      { name: "carriage.clamp", box: [111, 455, 16, 52], radius: "3", fill: "linear-gradient(90deg,#4d5350,#7d8483 35%,#656b6a 65%,#3f4443)", static: false, note: "rivets 10 x 7 above and below" },
      { name: "carriage.post", box: [117, 428, 4, 30], fill: "linear-gradient(90deg,#2a2d2b,#0e100f)", static: false, note: "T-bar 22 x 4 on top; head bar 24 x 4 at y 455, #b9b2a3, lit #fff2c8 with a 6 px and an 18 px glow" },
      { name: "cone", box: [0, 210, 498, 478], static: false, note: "apex 5 px right of the caret at y 456; 144 deg spread, 14 deg feather, reach 250 px; warm rgb(226,209,174) at .95 falling to 0; only at night" },
      { name: "webs", box: [0, 440, 498, 120], note: "night only: three strand clusters centred x 70, 230, 420, 16 bezier strands each in rgba(235,235,225,.34) 0.8 px, three hanging threads per cluster" },
      { name: "sliders", box: [0, 628, 420, 50], note: "night only: LIGHT at x 21 (110 wide), SPREAD at 155 (110), REACH at 290 (104); labels mono 12 px letter-spacing .12em #ada69b; track 1.5 px #6c6d6b with 1 px ticks on a 12.2 px pitch; thumb 9 x 16 #e8e4d8" },
      { name: "sun", box: [430, 640, 36, 36], note: "the night toggle: disc r 8.5 with eight rays, #302f29 by day, #ada69b at night" },
    ],
    timing: [
      { name: "night", ms: 300, property: "paper background", from: "#ede6db", to: "#343533" },
      { name: "lamp", ms: 520, easing: "steps(1,end)", property: "cone and head opacity", from: "0", to: "1", note: "starts 380 ms after night; opacity steps 0 .55 .15 .9 .5 1 .85 1; then a 3.6 s idle flicker between .95 and 1" },
      { name: "carriage", ms: 180, easing: "cubic-bezier(.3,.7,.3,1)", property: "carriage translateX and cone apex", from: "last caret", to: "new caret", note: "the cone's apex animates with the same curve (registered custom property), never snaps" },
      { name: "strike", ms: 260, easing: "steps(1,end)", property: "arc opacity", from: "1", to: "0", note: "a 12 x 48 white bolt inside the capsule's right end with a cool rgba(170,240,210,.85) halo; LEDs blink orange for 160 ms" },
      { name: "thread", ms: 800, property: "thread rotate", from: "0", to: "9 deg, -5, 2, 0", note: "a 70 px thread under the carriage swings after every move" },
    ],
    states: [
      { name: "paper", trigger: "load", what: "light paper, hint and placeholder visible, lamp off, no sliders" },
      { name: "night", trigger: "sun tap", what: "paper dims, webs and sliders fade in, then the lamp strikes on and lights a cone that follows the caret" },
      { name: "typing", trigger: "any printable key", what: "glyph lands with jitter, carriage eases to the caret, arc flashes at night, count updates" },
      { name: "wrap", trigger: "a word passes x 440", what: "the line breaks, earlier lines move up 34 px, the carriage returns left" },
    ],
    keyframes: [
      { name: "paper", at: 0.3, src: "/demos/frames/lamp-carriage-typewriter/paper.jpg", shows: "day scene, nothing typed" },
      { name: "lamp", at: 2.4, src: "/demos/frames/lamp-carriage-typewriter/lamp.jpg", shows: "night, lamp just struck on" },
      { name: "typing", at: 5.0, src: "/demos/frames/lamp-carriage-typewriter/typing.jpg", shows: "a word in, carriage mid-line" },
      { name: "done", at: 12.5, src: "/demos/frames/lamp-carriage-typewriter/done.jpg", shows: "two lines, carriage on the second" },
    ],
    checks: [
      { at: "paper", check: "paper #ede6db fills x 0..498 from y 210 with elliptical top corners 55 x 180; the rod runs y 467..493 full width; the capsule's centre is at x 101" },
      { at: "paper", check: "'Begin here.' starts at x 100 with its baseline near y 426, 26 px typewriter face; the count reads 0 / 3 000" },
      { at: "lamp", check: "paper #343533; the head bar is #fff2c8 and a warm cone opens upward from (106, 456) at 144 deg; sliders and webs are visible" },
      { at: "typing", check: "the carriage's centre sits 2 px right of the last glyph; the lit cone has moved with it; the count equals the characters typed" },
      { at: "done", check: "no glyph passes x 440; the carriage never passes x 446" },
    ],
  },
};
