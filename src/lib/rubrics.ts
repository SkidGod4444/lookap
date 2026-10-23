import rubrics from "./rubrics.json";
import type { Entry } from "./data";

/* The checklist a rebuild of an entry is judged against, written once per entry by scripts/rubric.ts from the clip
   itself and packed by scripts/build-rubrics.ts. Criteria are binary and visual; each names a box in frame pixels and
   the moment to look at (two for motion). Imagery regions carry a class that decides how a rebuild may handle them. */
export type ImageryClass = "css" | "structured" | "photo";
export type RubricCriterion = { id: string; element: string; axis: "present" | "position" | "style" | "text" | "motion" | "imagery"; check: string; box: [number, number, number, number]; scope: "crop" | "frame"; at: number; then: number | null };
export type EntryRubric = {
  frame: { w: number; h: number }; written: string; licensed: boolean; summary: string;
  elements: { name: string; box: [number, number, number, number]; kind: string; class: ImageryClass | null; note: string }[];
  criteria: RubricCriterion[];
  imagery: { name: string; box: [number, number, number, number]; class: ImageryClass; what: string; at: number }[];
  moves: { element: string; what: string; from: number; to: number; px: number | null }[];
};
export const RUBRICS = rubrics as unknown as Record<string, EntryRubric>;
export const rubricFor = (e: Entry): EntryRubric | undefined => RUBRICS[e.slug];

/* the rule for each imagery class: what a rebuild does with a pictorial region */
export const IMAGERY_RULE: Record<ImageryClass | "licensed", string> = {
  css: "drawn: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)",
  structured: "an original SVG with the same silhouette, weight and colours, judged on silhouette and colour rather than pixels",
  photo: "this designer declined sampling: a placeholder of the same box and colour layout with no detail, softened or grained to the clip's look, carrying data-imagery=\"not reproduced: <what the clip shows>\"; everything that sits on it (text, controls, glass) is drawn",
  licensed: "licensed (the default for every entry): the picture is taken from the clip itself, from a frame where nothing moving covers it, cropped free of UI, text and controls, which are drawn; the file's header says what was sampled and from which frame",
};
/* How the materials that rebuilds most often get wrong are built, so an agent reaches for the technique rather than
   the outline. Each names what the material is NOT as well. */
export const MATERIALS: Record<string, string> = {
  ripple: "Water or a glass ripple bends what lies beneath: build each ring as a copy of the picture behind it, scaled about the ring's centre by 2 to 8% (or shifted outward by a few px), seen through a soft ring mask (radial-gradient mask from transparent to opaque over 6 to 16 px and back); add a faint light crest on the outer edge and a 2 to 4 px darker lip just inside. Animate the radius with a registered custom property (@property --r { syntax: '<number>' }) so keyframes interpolate. NOT a stroked circle, NOT a flat band, NOT a border-radius outline. SVG feTurbulence plus feDisplacementMap is the alternative for an irregular surface.",
  glass: "Glass and lenses refract and magnify: the picture behind is visible, shifted or enlarged at the rim, with a specular highlight along one edge and a thin dark line at the opposite edge. Build it as the background again, transformed, under a mask, plus a gradient highlight. NOT a translucent white fill with a border.",
  frosted: "Frosted glass blurs what is behind it: backdrop-filter: blur() with a 3 to 10% white tint and a 1 px inner highlight at the top; the shapes behind stay readable as soft forms. NOT an opaque card, NOT a sharp see-through panel.",
  metal: "Brushed or polished metal carries a specular band that moves with the light: layered linear gradients for the band, a repeating-linear-gradient at 1 to 2 px for brushing, inset shadows for the bevel. NOT a flat grey.",
  paper: "Paper and cards have grain and a soft contact shadow: a low-opacity noise layer (feTurbulence) and a two-layer shadow, a tight dark one and a wide faint one. NOT a hard drop shadow.",
  glow: "A glow is light, not a fill: a radial gradient from the colour at 40 to 60% opacity to transparent, often with mix-blend-mode: screen or plus-lighter, sometimes blurred. NOT a solid coloured disc.",
};

export const SAMPLING_RULE = "Every entry is licensed for sampling unless its brief says the designer declined. A texture (marble, wood, fabric, grain) is sampled as a tile and repeated; a photograph, painting or screenshot is sampled whole from a frame where nothing moving covers it; UI, text and controls are never pasted, they are drawn. Say in the file's header what was sampled and from which frame.";
