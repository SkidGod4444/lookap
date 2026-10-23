# FlyingPress Bento Feature Grid: notes

Credit: Ashik (@AshikArtistry), https://x.com/AshikArtistry/status/2110310645874729396
Sampled: nothing. Every surface, icon and logo is CSS or inline SVG. The FlyingPress "F", the W circle, the Kinsta wordmark (set as text), the Elementor E, the grid mark and the cloud are original stand-in drawings.

## Timeline (6 s loop, t mod 6; measured with --diff pairs and the 10 fps sheets)
- Header and card frames: never move (checked with diffs 1.4/1.9, 2.2/2.7, 3.45/4.25, 6.4/7.4).
- Easy to Use: Active until 2.3 s. Crossfades to Inactive / "Optimize my site" / empty chips over 2.3–2.45 s. Cursor rests at (347,417), glides to (297,378) over 3.45–3.95 s and presses at 4.4 s (button scales to 0.97). The label blurs as "Optimizing..." over 4.4–4.9 s. Back to Active at 5.0 s. Cursor returns to rest over 5.6–6.0 s.
- Fewer Settings: Critical CSS turns off at 0.42 s, Image Optimization at 0.9 s, Page Caching at 1.5 s (all off by 1.9 s). The pills collapse into one "All optimizations" pill over 2.3–2.62 s, with two smaller pills peeking 8 and 16 px below. Its toggle turns on at 3.7–3.88 s. The pills fan back out over 4.45–4.8 s with all three on.
- Core Web Vitals: the list moves up one slot over 0.3–0.6, 2.3–2.6 and 4.3–4.6 s (eased; about 75 % of the travel is done at the midpoint). The outgoing top pill fades upward, and the new bottom pill fades in from below about 0.3 s later.
  - The middle value improves late in each beat: LCP 1.5 s Poor → 1.2 s Good at 1.6 s; INP 380 → 375 → 175 → 71 → 48 ms Good at 3.75 s; CLS 0.31 → 0.12 → 0.05 Poor → 0.02 Good at 5.75 s.
- Great Support: three bubbles orbit clockwise at r = 118 around (600,778). The rate is fitted at 60°/s (one turn per 6 s). "?" is at 18° from the top at 1.4 s, 258° at 5.4 s and 18° at 7.4 s.
- Compatibility: the top row runs left at about 48 px/s, measured from the W and Kinsta tiles across keyframes. The bottom row runs right one 88 px tile pitch per 2 s beat, starting at 1.4, 3.4 and 5.4 s. Round 3: Elementor moves 62 px in the first 0.5 s (x≈913 → 975, confirmed in the 1.9 s zoom; mine lands at 978). The last 26 px eases out by +1.0 s. Round 2 put the whole 88 px into 0.5 s, which the judge read as too fast. The middle row is still.
- All in One: background tiles fade between 1 and 0.08 opacity over 0.5 s, each with a 2.5 s hold and its own offset. The hourglass tile fades in, and the link tile fades out, over 1.4–1.9 s.

## Differences
- Orbit timing is a fit, not a match. The clip's bubbles move in stutters: no change from 1.9 to 2.9 s, then 67° in 0.8 s, then about 19° in 1.15 s. A constant 60°/s puts "?" about 30° off at 3.45 s.
- Ring arcs: round 2 follows the clip. Rings are 4.4 px thick. LCP 1.5 s keeps its "Poor" badge with a green 86 % arc, and INP 380 ms has an amber 93 % arc.
- Headline: Inter Tight 500 at 48 px with −0.055em tracking. Inter at 500 was 8 % too wide. Inter Tight is now within about 5 px over the full line, and its stroke is a touch heavier than the clip's.
- The FlyingPress icon F is an original two-swoosh drawing. It has a dark offset copy as its shadow, a yellow radial gloss and a 1.5 px yellow rim at the top. The clip's F reads as three thinner strokes; mine has two strokes plus the shadow edge.
- Compatibility logos are original pale filled glyphs (#e5dfdb) on 28 % white tiles. They are not the real host and builder marks, and the tile order in each row is approximate.
- The dot dither on Easy to Use, Fewer Settings and Core Web Vitals is two even, fine orange dot grids (6 px and 9 px, dots about 1 px) under a radial mask. The clip's dither is irregular.
  - Round 3: the Fewer Settings wash and its dots now sit in a 42 % × 38 % radial peaking at x≈43.5 % of the card top (the checker's #f6b17a patch is in step). Before, they covered the whole top.
  - Easy to Use's wash is lighter (#f9cfaa corner, #fef3eb top) and gained a faint top-left dither, as in the clip.
- All in One tiles: round 3 swapped the thin outline glyphs for solid #d8d0cc glyphs with white cut-outs (A tile, gear-calendar, document ±, code brackets in an outlined box, link, hourglass, check). These are still original drawings, and the per-tile layout is approximate.
- Icon gloss: a stronger yellow (#ffe54a) radial now sits under the top rim of each FlyingPress icon. The clip's rim also glows around the sides; mine glows only at the top.
- Great Support rings are flat discs with radius 152, 112 and 72, filled #feede3, #fde9d9 and #fae2ca on a #fdf3eb card, as measured with --hex at y=778. The headset glyph is an outline, where the clip's is chunkier.
- Pointer behaviour was not re-driven in rounds 2 or 3. The click handlers are unchanged from round 1.
- Round 3 checker: score 78 overall (stills 79). The worst region is still the CWV middle pill (delta about 30). The headline, titles and cursor are still flagged as "different drawing".

## Pattern: a stepped ambient loop is not a constant rate
An orbit or marquee in a recorded clip can look continuous across keyframes but move in bursts between them. Measure the same object at four or more times, including two half a second apart, before picking one rate. If positions repeat across a pair, the motion is stepped or eased per beat, and a linear loop will be off at mid-beat moments. The loop period of the whole piece (here 6 s) is the safest anchor: fit the motion so it closes exactly on that period, then place its eased bursts inside each beat.
