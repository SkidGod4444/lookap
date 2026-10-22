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
export const SAMPLING_RULE = "Every entry is licensed for sampling unless its brief says the designer declined. A texture (marble, wood, fabric, grain) is sampled as a tile and repeated; a photograph, painting or screenshot is sampled whole from a frame where nothing moving covers it; UI, text and controls are never pasted, they are drawn. Say in the file's header what was sampled and from which frame.";
