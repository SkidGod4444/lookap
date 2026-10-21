import drafts from "./drafts.json";
import type { Entry } from "./data";

/* Draft measurements for every clip, from scripts/measure.ts: timings and moves are measured, boxes are a first pass.
   Packed by scripts/build-drafts.ts; keyframes live in public/drafts/<id>/. Keyed by the clip's catalog id. */
export type Draft = {
  id: string; frame: { w: number; h: number }; fps: number; duration: number;
  phases: [number, number][];
  keyframes: { name: string; at: number; src: string; hold: [number, number] }[];
  /* mid-phase frames and a 2 fps contact sheet, for look_at */
  mids: { at: number; src: string }[];
  sheet: { src: string; fps: number; cols: number; frames: number; tile: number } | null;
  anchors: { phase: [number, number]; start: [number, number, number, number]; end: [number, number, number, number]; moved: { top: number; bottom: number; left: number; right: number }; read: string; reliable: boolean }[];
  background: string; palette: { hex: string; share: number }[];
  elements: { box: [number, number, number, number]; fill: string }[];
  motion: { element: string; box: [number, number, number, number]; moves: { from: number; to: number; dTop: number; dLeft: number; ms: number }[] }[];
  coverage: string;
};

export const DRAFTS = drafts as unknown as Record<string, Draft>;
export const clipId = (e: Entry) => e.video?.src.match(/videos\/([a-z0-9]+)\//)?.[1];
export function draftFor(e: Entry): Draft | undefined {
  const id = clipId(e);
  return id ? DRAFTS[id] : undefined;
}
export const DRAFT_NOTE = {
  phases: "measured: sampled every 50 ms",
  motion: "measured: moves of the first keyframe's big parts, edges read at full resolution; dTop and dLeft are the distance in source px",
  palette: "measured for areas; small things do not reach it",
  anchors: "measured where the content stands clear of its background (reliable true): the box of everything that is not background at a phase's start and end, and which edges moved; where the content fills the frame the field says so and look_at what=track is the way to read an edge",
  elements: "draft: flat regions at the first keyframe; nested parts split or merge, text and thin parts are missing; check each box against the keyframe (see_design with at) before trusting it",
};
