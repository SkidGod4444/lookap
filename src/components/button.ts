/* Button and badge recipes as Tailwind class strings.
   The material is machined aluminium under a soft top light:
   - a glossy cap on the upper half (pseudo-element), with a hard specular line at the very top rim
   - a brushed body that falls off toward the bottom, with a thin reflection band just above the lip
   - a dark lip, a 1px edge ring, a hard thickness shadow, then a soft ambient drop
   Pressing removes the lift and tightens the shadow. */

const base =
  "relative isolate inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap select-none cursor-pointer outline-none " +
  "transition-[transform,box-shadow,filter] duration-150 ease-out active:translate-y-[2px] focus-visible:ring-[3px] focus-visible:ring-ring " +
  /* glossy cap */
  "before:pointer-events-none before:absolute before:inset-x-[1.5px] before:top-[1px] before:z-[-1] before:h-[46%] before:rounded-[inherit] before:rounded-b-none " +
  "before:bg-[linear-gradient(180deg,rgba(255,255,255,0.62)_0%,rgba(255,255,255,0.22)_55%,rgba(255,255,255,0)_100%)] " +
  /* brushed grain */
  "after:pointer-events-none after:absolute after:inset-0 after:z-[-1] after:rounded-[inherit] after:opacity-[0.18] " +
  "after:bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,rgba(0,0,0,0.05)_1px,rgba(0,0,0,0.05)_2px)]";

/* bodies: note the lighter band at 90% — the reflection of the surface below, which sells the curve */
const alloyLight =
  "bg-[linear-gradient(180deg,#e9e9e9_0%,#cdcdcd_28%,#b1b1b1_50%,#9d9d9d_72%,#a9a9a9_90%,#7f7f7f_100%)]";
const alloyLightHover =
  "hover:bg-[linear-gradient(180deg,#f2f2f2_0%,#d8d8d8_28%,#bdbdbd_50%,#a9a9a9_72%,#b5b5b5_90%,#8a8a8a_100%)]";
const alloyDark =
  "bg-[linear-gradient(180deg,#5c5c5c_0%,#434343_28%,#333333_50%,#2a2a2a_72%,#343434_90%,#1a1a1a_100%)]";
const alloyDarkHover =
  "hover:bg-[linear-gradient(180deg,#686868_0%,#4e4e4e_28%,#3d3d3d_50%,#333333_72%,#3d3d3d_90%,#222222_100%)]";

/* bevels: rim, lip, side shading, edge ring, thickness, ambient */
const bevelLight =
  "shadow-[inset_0_1px_0_#ffffff,inset_0_-1px_0_rgba(0,0,0,0.45),inset_0_-5px_6px_rgba(0,0,0,0.16),inset_2px_0_1px_rgba(255,255,255,0.35),inset_-2px_0_1px_rgba(0,0,0,0.22),0_0_0_1px_#2b2b2b,0_2px_0_#141414,0_3px_0_#0b0b0b,0_6px_10px_rgba(0,0,0,0.55),0_12px_24px_rgba(0,0,0,0.35)] " +
  "active:shadow-[inset_0_1px_0_#ffffff,inset_0_-1px_0_rgba(0,0,0,0.45),inset_0_-3px_4px_rgba(0,0,0,0.18),0_0_0_1px_#2b2b2b,0_1px_0_#141414,0_2px_4px_rgba(0,0,0,0.5)]";
const bevelDark =
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.42),inset_0_-1px_0_rgba(0,0,0,0.7),inset_0_-5px_6px_rgba(0,0,0,0.4),inset_2px_0_1px_rgba(255,255,255,0.1),inset_-2px_0_1px_rgba(0,0,0,0.45),0_0_0_1px_#0f0f0f,0_2px_0_#070707,0_3px_0_#000000,0_6px_10px_rgba(0,0,0,0.6),0_12px_24px_rgba(0,0,0,0.4)] " +
  "active:shadow-[inset_0_1px_0_rgba(255,255,255,0.42),inset_0_-1px_0_rgba(0,0,0,0.7),inset_0_-3px_4px_rgba(0,0,0,0.4),0_0_0_1px_#0f0f0f,0_1px_0_#070707,0_2px_4px_rgba(0,0,0,0.55)]";

const variants = {
  silver: `text-[#101010] [text-shadow:0_1px_0_rgba(255,255,255,0.55)] ${alloyLight} ${alloyLightHover} ${bevelLight}`,
  outline: `text-[#e9e9e9] [text-shadow:0_-1px_0_rgba(0,0,0,0.7)] hover:text-white ${alloyDark} ${alloyDarkHover} ${bevelDark}`,
} as const;

export function button(variant: keyof typeof variants, extra = "") {
  return `sfx-button sfx-${variant} ${base} ${variants[variant]} ${extra}`.trim();
}

/* Badges and chips are flat, so they read as labels and never compete with the metal buttons:
   a hairline ring, a quiet fill, no gloss, no lift. The active chip is solid silver. */
const badgeBase = "inline-flex items-center justify-center whitespace-nowrap select-none rounded-full font-medium transition-colors duration-150";

const badges = {
  chip: "bg-chip text-subtle ring-1 ring-inset ring-line-strong hover:bg-chip-hover hover:text-foreground",
  active: "bg-silver-bright text-black ring-1 ring-inset ring-white/60",
  dark: "bg-black/70 text-silver ring-1 ring-inset ring-line-strong backdrop-blur-sm",
  silver: "bg-silver-bright text-black ring-1 ring-inset ring-white/60",
  darkHover: "bg-black/70 text-silver ring-1 ring-inset ring-line-strong backdrop-blur-sm hover:text-white",
} as const;

export function badge(variant: keyof typeof badges, extra = "") {
  return `sfx-badge ${badgeBase} ${badges[variant]} ${extra}`.trim();
}

/* Hide a scrollbar while keeping the element scrollable. */
export const noScrollbar = "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";
