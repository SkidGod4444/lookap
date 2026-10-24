# Expanding Search Interaction (sucodee): rebuild notes

Source: https://x.com/sucodeee/status/2106690154429841524. Nothing was sampled. Every surface, icon and shadow is CSS or inline SVG. No photo-class regions.

## Timeline (measured from the clip, 1020 × 720, 7.45 s)

- 0–0.35 s: rest. 112 px circle at x 453–565, y 137–249. White ring 11 px, #ebe9e4 disc about 88–90 px, 1 px hairline (#e4e2e1 top, #d3d2d1 bottom) and a soft shadow below.
- 0.35–0.85 s: the bar widens symmetrically around x≈508. Width: 172 at 0.4 s, 405 at 0.5, 470 at 0.55, 549 at 0.65 (overshoot, x 232–781), settles at 542 (237–779) by about 0.85 s. Top stays at y 137. The magnifier stays 55 px from the bar's left edge and the × stays 56 px from its right edge, so the content is clipped, not scaled. Placeholder and × fade in from 0.4 to 0.48 s.
- 0.47–0.95 s: the panel (top y 263) springs down. Bottom: 303 at 0.5 s, 385 at 0.55, 540 at 0.6, 607 at 0.65, 632–635 at 0.7–0.75 (overshoot), 625 at 0.8, 611 at 0.9, 610 from 0.95 s.
- 0.5 s: the placeholder is cut off by a fixed edge 101 px inside the bar's right edge ("Search compor" at 405 px width).
- 0.5–0.95 s: rows enter 45 ms apart, scaling about the panel centre. Each one goes from blur 9 px / scale 0.9 / +20 px x to blur 3.5 px / scale 0.96 (60 % of 140 ms), overshoots to scale 1.08, then settles to 1 over 0.3 s. At 0.72 s rows 1–3 are sharp and slightly enlarged; Segmented Control is still smeared. Rows are 81 px apart, row centres at y 316/397/478/559, text left at x 276.
- Highlight pill (520 × 80, radius 40) glides from row to row: 1.57–1.72 s to Toast, 2.065–2.34 s to Code Input on cubic-bezier(.4,0,.2,1) (round 4: tracked the pill's top edge at x 700: 356 until 2.05 s, 364 at 2.1, 392 at 2.15, 424 at 2.2, 433 at 2.25, 439 at 2.3, 441 at 2.35), 2.58–2.74 s to Segmented Control, then 2.95–3.24 s back up to Action Button.
- Caret (3 × 34 px, #3d3df2) blinks: off at 1.75–2.05, 2.9–3.15 and 3.95–4.15 s.
- 4.17–4.2 s: 't' typed. The rows still matching (Action Button, Toast) restyle in place to grey with a bold 't'. Code Input and Segmented Control stay sharp, then blur out from 4.2 to 4.36 s.
- 4.2–4.36 s: shared rows glide to their new slots with a slow start: Toast row 2 → 1, Action Button row 1 → 3. Tab Bar, Quantity Stepper and Invite Field blur in 35 ms apart. Panel bottom reaches 698 at 4.43 s.
- 4.5 s: 'o' typed. Toast and Action Button keep their slots and only restyle. Hold to Confirm blurs in. The panel shrinks to 525 at 4.7 s, then 529.
- 5.55–5.65 s: the × hover disc appears (64 px, #e1dfd9).
- 5.98 s: clear. The placeholder returns. The 4 default rows come back 30 ms apart and are sharp by about 6.2 s. The panel bottom springs to 621, then back to 610 by 6.4 s.
- 7.0–7.17 s: the remaining label smears (blur 9 px at 7.1 s) and the panel retracts (bottom 384 at 7.1 s, gone by 7.2 s).
- 7.1–7.38 s: the bar contracts: 252 px at 7.2 s, 108 at 7.3, 112 at 7.38. The circle holds to the end.

## Differences

- Font: Inter 500 at 27 px in place of the clip's system face. Measured widths match within 1 % ("Action Button" 171 px, "Segmented Control" 245 px). Glyph shapes differ slightly ('t', 'a').
- Panel shadow: now a faint 1 px edge plus a wide 22 px-offset, 56 px blur at 11 % alpha. The clip's 1 px bottom line (#babbba) is a little crisper than mine.
- At 0.72 s my Segmented Control is a shade lighter than the clip's smeared label.
- At 4.2 s the clip's leaving rows (Code Input, Segmented Control) look slightly bolder. Mine are regular weight.
- Magnifier: the checker still flags "different drawing" (deltaE 1.5). A 4× zoom shows the same silhouette. Round 3: the zoom showed mine about 1 px high and a shade heavy, so it moved down 1 px and the stroke went from 3.5 to 3.2 (ring r 9.4).
- Round 4: the round 3 note above was wrong. The file still started the Toast → Code Input glide at 2.02 s, so at 2.15 s the judge saw the pill about 20 px low. It now holds on Toast until 2.065 s, then moves on cubic-bezier(.4,0,.2,1) and reaches Code Input at 2.34 s. Zoom results: at 2.15 s my pill top is about 4 px above the clip's 392 (midway between Toast and Code Input), and at 2.2 s they match.
- Pointer mode is unchanged from round 1: click opens, typing filters, hovering glides the highlight, × clears, Escape or an outside click collapses. Checked again with --drive (open + hover on Code Input).
- Round 2 fixed a bug: the 't' list's later rows ended their entry after their own leave time. That made Web Animations throw, and the 't'/'to' lists sat visible and unanimated across the whole clip. Last checker run (round 4): 94 over 21 moments, motion follows the clip.

## Pattern

**Clip, don't scale, an expanding control.** When a circle stretches into a bar, read where the inner glyphs sit at two widths before you animate anything. Here the magnifier kept a fixed 55 px from the left edge and the × a fixed 56 px from the right, while the placeholder was cut off by the moving edge. That means the right build is a container whose width animates with overflow hidden around content in its final layout. A transform scale would squash the icons. One spring curve for width and height, overshoot included, read from four or five sampled frames, carries the whole feel.

**Re-filter is a reorder, not a swap.** When a search list narrows, the items that still match keep their identity. They restyle where they are, then glide to their new slot. Only the items that enter or leave blur. A whole-list cross-fade makes old and new labels overlap into noise ("Tdast"). Build one row per item and animate translateY between slot indices, so blur goes only on the rows whose membership changes.
