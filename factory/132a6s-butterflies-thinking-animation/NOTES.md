# Butterflies Thinking Animation — rebuild notes

Credit: sucodee, https://x.com/sucodeee/status/2106671284385882304
Sampled: nothing. Type, pill, download icon and every butterfly are drawn (original inline SVG). No photo-class regions.

## Timeline (measured from sheets 0-3.6 / 3.6-7.2, diffs 0.15-0.65 and 1.2-1.7, zooms at 0.65, 1, 1.72, 2.5, 5.97)
- Static at all times: "Thinking..." (T top y288, baseline y405, stems 17-18 px, word x220-821, dots 21 px at centres x848/885/921.5, pitch 37) and the GIF pill [1055,18,86,44]. No reflow, no movement.
- Swarm cycle period 4.4 s, two cycles: phase 0.3-3.15 and 4.7-7.6; empty hold 3.2-4.65.
- Arrival: butterflies come in from the left/below-left, land on glyph strokes left to right. Landing start ≈ 0.05 + 0.95·u s (u = 0 at T, 1 at last dot), each flight ~0.3-0.45 s, fade-in 0.08 s.
- Peak cover 1.0-1.7 s (5.4-6.1 s): word patterned with butterflies, dots partly covered.
- Lift-off left first from ~1.2 s; the right letters still covered at 2.5 s. Each rises ~120-200 px nearly straight up, then bends up-right (+60..+320 x, −250..−400 y total), fading out over the second half of a ~0.75-1.05 s flight. All gone by 3.15 s (7.55 s).
- One purple straggler upper right at 7.45-8.55 s (≈820,105 at 8.1 s).
- Round 2 (c16, zoom 150,150,300,300 at 0.15 s): the clip opens on just two crisp mint scouts, ≈15 px at (312,163) above "T" flying in, ≈25 px at (359,406) at the foot of "h". Built as two scripted mint butterflies (#3fd6b4 over #7fe8cf) visible from 0.08 s, landing on "h" by 0.7 s and leaving with the flock 1.5-2.5 s. Every other lander and far flier now stays at opacity 0 until ≥0.3 s / ≥0.35 s, so nothing sits off-word at the far left early.
- Wings flap continuously (scaleX 1 → 0.28 → 1, 0.16-0.30 s per beat).

## Differences
- Font: Inter 500 stands in for the clip's SF-like grotesque; the word is forced to the measured 601 px with textLength, so inner letters sit 2-8 px left of the clip's (checker: "ing" offset −4..−8 px).
- At 2.5 s my departing flock is denser and more clumped above "kin" (~60 aloft) than the clip's (~30, spread x240-660, y120-260).
- Butterflies are ~22-40 px landers plus 16-26 px soft fliers; the clip's look marginally more varied in pose (side-on, folded).
- Cycle 2 in the clip (sheet 3.6-7.2) runs ~0.2-0.3 s later than a strict 4.4 s repeat: a flock is still over "king" at 7.1-7.2 s, while mine repeats cycle 1 exactly and is mostly gone by 7.47 s.
- Seven checker runs were used (three past the suggested four; the last a --quick check that 4.45 s is empty after delaying the first scouts to 0.08 s). Full-run score 65 (stills 77, mid-motion 61; the pixel score is limited by the random swarm).
- Round 2 used four checker runs. When the seek lands, the 0.15 s render shows only the two scouts (quick run: kf1 score 77, up from 69). In the other three runs the checker's first one or two shots (0 s, 0.15 s) caught the landers 0.25-0.8 s ahead while the scouts sat where they should (scores 64-73). The flock now builds synchronously at load and rebuilds on the real Inter glyphs once the font arrives, carrying over currentTime and paused state, so a seek before font load is not lost. The early-shot offset happened in runs before and after that change, and I did not find its cause.
- Unchanged from round 1: Download icon 2 px off (−2,−2); headline inner letters −2..−8 px from the clip.
- No pointer interaction in the clip; the pill is static (cursor: pointer only).

## Pattern
**Swarms that draw a shape: sample the shape, schedule by position.**
When many small sprites settle onto text or a logo, take landing spots from the glyph's own pixels (render the same font to an offscreen canvas and pick filled pixels) instead of hand-placing them. Sort spots by x and derive every sprite's arrival and departure time from its normalised position, so the "left to right" sweep comes out of one formula. Keep fade-in short (under 0.1 s): long opacity ramps make an arriving swarm read as a grey haze. Departure should rise before it drifts; a straight diagonal exit reads as a sliding band rather than flight.
