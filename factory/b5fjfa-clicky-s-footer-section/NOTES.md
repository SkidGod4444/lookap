# Clicky's Footer Section — rebuild notes

Credit: Clicky, https://www.heyclicky.com/

## Timeline (measured from sheets at 10 fps, zooms and --hex)

- 0–4.5 s: the cursor sweeps the wordmark. Folders whose centre is within ~122 px of the pointer open.
  - The front panel stays in place (its bottom does not drop). It tilts forward about 55°, so the top is ~66 px wide against 56 at the bottom, and its visible height shrinks from 39 to ~24 px.
  - A white-to-pale-grey paper, ~52 px wide, shows ~10 px above the front. The back panel and tab vanish behind it.
  - Opening takes ~0.1 s, closing ~0.15 s.
- Rest tile: 56×47, with a soft grey shadow (0 3 5, black .3) and no dark edge band.
  - 2.3 s: the whole first "l" stack plus the right side of the first "c" and the "i" serif are open.
  - 2.8 s: the "l" is closed and the second "c" is open.
- 4.3–4.85 s: the pointer is a white pointing hand over the big folder, at ≈(1912,689)–(1936,716) at 4.67 s.
- 4.55 s: the big right-hand folder is clicked.
  - The dim (#f3 → #858585, i.e. black at 0.453) ramps in over 0.33 s; the page measures #a1a1a1 at 4.67 s.
  - The 5 px backdrop blur starts only at ~4.73 s and is full by 5.0 s. The page is still sharp at 4.67 s.
- 4.55 → 5.08 s: the window grows. The timing is linear overall, with eased segments.
  - Starts at opacity 0, scale .55, offset (+420, +200).
  - 4.67 s: opacity .58, box 926,219,764,461 (scale .769). The interior measures #d8d8d8, with the page text visible through it.
  - 5.08 s: full size at 582,62, 994×600.
- Video background at (700,150), from --hex:
  - #e7e7e9 until 4.95 s, then #bebec1 at 5.0, #767676 at 5.04, #505050 at 5.08, #272727 at 5.13, #0b0b0b at 5.2, and #000 from 5.3 s.
  - The title text and speaker inset fade in 4.97–5.06 s, independently of the background.
- 6.1 → 6.4 s: the window fades out (.5 at 6.2 s, .15 at 6.28 s, gone by 6.35 s). The dim and blur clear by 6.4 s.
- 7.1–7.6 s: the cursor sweeps back left. 7.5 s: "e" and the top of the first "y" are open; the "l" is closed.
- Text columns, copyright and folder positions never move. Opening is a transform in place.

## Differences

- **Trash can:** drawn SVG with a silver vertical sheen and four coloured papers. The clip's can has a mottled, translucent mesh look that my version doesn't have (checker deltaE 5.8).
- **Large folder:** now drawn on its own, at 1909,658, 100×80.
  - Parts: a tab 48 px wide, a #47b4ef back, a white paper strip at y 668–676, and a front from 672 to 738 graded #7dd8ff → #52bbfa. There is no drop shadow.
  - The clip's front has slightly more inset top corners.
- **Open folders:** the clip's open fronts are ~2 px taller and cast a slightly heavier shadow on the row below.
- **Rest tiles:** the clip's tiles are faintly soft (video blur) and have a brighter top rim than mine.
- **Demo cursor:** only the hand at the click (4.3–4.85 s) is drawn. The clip's small arrow cursor elsewhere is not.
- **5.08 s:** the clip's slide text sits ~18 px lower than at 5.7 s (the footage moves). Mine is fixed at its 5.7 s place.
- **Copyright and window title:** now 16.6 px #8f8f8f (205 px line, matching the clip's 977–1182) and 16.4 px #7c7c7c (133 px, clip 1013–1146).
- **Top shadow:** a blurred #b4b4b4 rounded box at 965,-34, 220×46, blur 22. The clip's plateau is #d1d1d1 at y 4 across x 1000–1160.
- **Score:** checker run 9 gives pixel 87. 4.67 s rose from 64 to 68.
- **Fonts:** column type is Inter 22 px. The clip's face looks like SF Pro, with widths within ~2 %. The video title is Figtree 300 standing in for the slide's Avenir-like face.
- **Photo regions:**
  - The speaker inset [1284,274,279,209] is sampled from the clip at 5.7 s (`patches/speaker.jpg`, 4.5 KB).
  - The rest of the video frame is pure black plus drawn text ("HeyClicky", "Farza Majeed"), so nothing else was sampled.
- **Demo-mode hover:** driven by a pointer path I read off the sheets and hand-tuned so the open sets at 2.3, 2.8 and 7.5 s match. It is not a frame-exact track of the cursor.

## Pattern

**Pixel wordmarks made of icons are a jittered grid, not a strict one.**
- Here each "pixel" is a 56×46 folder on a ~32.5 px pitch, so neighbours overlap heavily. Paint order (row by row, left to right) decides which tab sits on which body.
- Columns drift by a few px from letter to letter. Read every tile's x from a zoom and don't snap to a computed grid.
- Hover effects on such marks are best modelled as a radius around the pointer on tile centres, driven by one registered custom property (`--o`) per tile.
- The same property then serves a CSS transition for the live pointer and a WAAPI keyframe track for the seekable demo.
