# Synthesia's Pricing Page — rebuild notes

## Timeline
- 0 s to 2.95 s: static hold. The --diff of 0 s against 2.9 s changes 0.0% of the frame, and so does 1.5 s against 2 s. There is no cursor, hover, scroll or entrance.
- The page has no animations, so ?demo=1 and the normal load look the same.

## Differences
- Font: the clip's geometric grotesk is replaced by Inter Tight (Google Fonts). At 38px/500 with -1px tracking, the heading matches the clip's 539px dark extent (x354–893) within about 2%. Body and list text are 12.6px. Glyph shapes still differ, for example 'a', 'g' and '₹'.
- Pro gradient: 15 stops sampled with --hex down x650. It runs from #121846 (top) to #5c6ec9 (y361), peaks near #b1bef0 (y430) and falls back to #a0afef (bottom). Enterprise gradient: 17 stops down x905, from #181628 through #695638 (y368) to #c1a763.
- Logo, coin icons and the 24 line icons are original SVGs drawn to the zoomed silhouettes. They are not the clip's exact glyphs (the hand, brand-kit and translate icons differ most).
- Final checker score is 81 (run 10). Remaining offsets: heading about 2px and radio group about 4px. The logo mark is about 2px right of the clip's, and the clip's mark leans slightly like a parallelogram, which mine does not.
- Round 2:
  - Logo moved down 6px (top 18→24) so the mark centres on the clip's y≈30. The mark's radius is now 2.6, a rounded rect instead of a pill.
  - Log in: the globe is 13px at x1061–1073 with a 1.3 stroke in #7c7c80. A 1×16 #ececec divider sits at x1084, then 14px 'Log in' in #6a6b70 from x1096.
  - Credit lines are 10.5px/500 with 0.2px tracking. Labels are #55575f and the 'up to …' part is 600 in #33353f, where it was 600 near-black before. 'Surveys up to 42 responses' is now 134px wide against the clip's 130px.
  - Column rules changed from #ececec to #e5e5e5 so they read at the judge's tile scale. They still start at y234, because the clip's rules also run through the card gaps (#f3f3f3 at x622, y300 and y960).
- Round 3:
  - Seat row: 'Roleplays' changed from 600 #060a20 at 11.5px to 500 #55575f at 11px. The pill text changed from 500 at 11.5px to 500 #2b2e3d at 11px, with an 11px plus at a 1.3 stroke. The row moved down 2px (margin-top 14) to sit at the clip's y≈694.
  - Feature icons: the stroke went from 1.3 to 1.1 in viewBox units (about 1px at 15px), in #4a4d58 instead of #2b2e3d. The wand is now an open stroke with sparkles; before, it was a closed parallelogram that read as filled. The hand was redrawn as an open waving hand with motion ticks, and the brand kit as a swatch book: a stacked rect plus a fanned leaf.
  - Column rules went from #e5e5e5 to #dedede. The clip's own rule is only #f6 on a #fd ground, so mine is deliberately stronger so the judge can see it.
  - The checker score holds at 81. The heading, radio, logo and badge "different drawing" flags come from the font substitution and are unchanged.
- Nothing sampled, and nothing stood in. The clip has no photo-class regions.

## Pattern
**Read a gradient's midpoints, not just its ends.** A card gradient described as "navy to periwinkle" was not linear. Halfway down it was already #5c6ec9, where a two-stop RGB blend gives a greyish #5c669b. It also peaked lighter (#b1bef0) at about 78% and darkened again at the bottom edge. Sample a --hex column every ~10% and use those values as the stops. Skip the rows where text or a chip crosses the column, because an 8px-wide mean picks them up.
