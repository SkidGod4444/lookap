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
export const IMAGERY_RULE: Record<ImageryClass, string> = {
  css: "drawn: CSS or inline SVG, exact to the crops (gradients, rings, glass, lenses, spinners, shadows, text art are all drawable)",
  structured: "an original SVG with the same silhouette, weight and colours, judged on silhouette and colour rather than pixels",
  photo: "not copied from the clip: a placeholder of the same box and colour layout with no detail, softened or grained to the clip's look, carrying data-imagery=\"not reproduced: <what the clip shows>\"; everything that sits on it (text, controls, glass) is drawn. Sampling the picture itself needs the designer's licence, recorded on the entry",
};
export const SAMPLING_RULE = "A texture that is not UI and cannot be drawn (marble, wood, fabric, grain) may be sampled from the clip as a tile, cropped where nothing sits on it and tiled or stretched by you: a texture, never the whole picture. A photograph, painting or screenshot is a photo-class region and follows its rule. Say in the file's header what was sampled or stood in, and from which frame.";
