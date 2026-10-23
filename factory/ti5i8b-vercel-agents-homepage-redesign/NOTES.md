# Vercel Agents Homepage Redesign — rebuild notes

Design by Christopher Kindl (https://x.com/kindlaar/status/2112285144774234287). Nothing was sampled from the clip: no patches, no placeholders. The cube, Vercel marks, robot avatar and snowflake are original inline SVG.

## Timeline

Read from the two 10 fps contact sheets and zooms at 0.6, 1.5, 2.05, 2.8, 4.2 and 5.65 s. Every annotation fade is about 0.2 s and eased. The layout never moves.

| t (s) | event |
|---|---|
| 0.0–0.3 | Cursor comes from below the cube (≈812,744) onto the lower-left face (≈950,588) |
| 0.30–0.42 | **Cube spreads** (round 2, measured with --col at x 950/1100): at rest it is a compact hexagon (x 823–1150, y 364–649) with a ~4 px black rim. On hover the six bars slide out in three pairs (left pair −21,0; top + upper-right +11,−17; bottom + lower-right +11,+17), and the core grows 3 %. The faces slide out less (top −4,−7; right +8,0; lower-left −4,+8), so the bars stagger and background shows at the TL, R and BL corners. It stays spread for every hover |
| 3.35–3.45 | Cube contracts back to the compact hexagon as the cursor leaves |
| 0.2–0.4 | Lower-left face lightens; **Connect** fades in (text x 719, y 661; leader 843–893 at y 668) |
| 0.95–1.1 | Cursor moves to the right face (≈1065,548); Connect fades out over 1.0–1.15 s (still solid at 1.0 s), right face lightens, **Sandbox** fades in (text x 1202, leader 1168–1196 at y 507) |
| 1.75–1.9 | Cursor moves to the top face (≈920,472); Sandbox out; top face lightens, **eve** in (x 719, y 337; leader 843–893 at y 344) |
| 2.45–2.6 | Cursor moves to the cube's left point (≈812,518); eve out; **Drives** in (x 645, y 500; leader to the left point at y 507). No face lights up for Drives |
| 3.2–3.4 | Cursor leaves downward (≈824,690); Drives fades out; nothing is annotated from 3.3 s |
| 4.1 | Hard cut, light → dark (`--d` 0 → 1 over 4.09–4.11 s). Faces become black with grey hairline edges, chevrons become grey outlines, buttons invert |
| 5.0–5.25 | Cursor moves onto the lower-left face (≈933,585); face gets a soft grey gradient; **Connect** fades in (white title, grey caption) |
| 4.98–5.10 | Cube spreads again (dark) |
| 5.95–6.15 | Cursor leaves past the bottom edge; Connect and the highlight fade out |
| 6.12–6.24 | Cube contracts (still spread at 6.1 s, contracting at 6.2 s by --hex at x 1100) |

## Differences

- **Checker score:** 85 over 11 moments (round 2, run 9; round 1 ended at 81). All four measured moving parts are now "in step" except the light grey halo region at 4.2 s (−2,−6).
- **Round 2 fixes:** the cube is drawn compact and spreads on hover through one `--x` scalar. This replaces the static spread drawing whose `#back` plate filled the corner gaps. Face gradients now come from --hex: top #2b2b2b→#171717, lower-left #1e1e1e→#000 by 45 % of its height, right #181818→#0a0a0a, with a 1 px rim. The shadow is lighter (.17). Subhead is 15.3 px; subhead and stat captions are #444. The user bubble is 199×62 with an SVG tail at its bottom-right. The robot avatar is a 17 px outlined head with an antenna, inside a #d4d4d4-bordered circle.
- **Round 3, frame bars (c21):** the three stroked polylines are now six filled parallelograms, measured spread at 2.05 s. Top bar y 347–360, x 924–1077. The right bars reach x 1154 and end flat at y 480 and y 531. The left bars run from the tip at x 803 out to y 374 and y 640. Every end is cut along the lattice: slanted bars end flat, top and bottom bars end at 60°. Each bar has a 1.2 px stroke, black in light mode and #3c3c3c in dark. The core hexagon grows 3 % with `--x` so no background shows between the bars and the faces once they spread. At the right tip the core still sticks out ~2 px past the bar ends.
- **Round 3, dark hover (c27):** the hover gradient is now #171717→#080808 in dark mode (was #2c2c2c→#0a0a0a). The clip measures #161616 at the top-right and #080808 at the bottom-left. Its gradient runs diagonally; mine runs mostly vertical, because the light mode shares the gradient's direction.
- **Checker:** 84–85 per moment after round 3 (run 13).
- **Bubble tail:** the tail's hook is a little smaller and flatter than the clip's.
- **Cube triangle colour:** the checker still reports deltaE ~10 on the white mark, from anti-aliasing around a 19 px shape on a near-black face.
- **Dark-mode gaps:** the clip's faces sit closer together in dark mode (~10 px gaps) than mine (~18 px, the same as light mode). The clip's face edges are also brighter on the upper-left (≈#9a9a9a) than my uniform #6e6e6e.
- **Headline:** the checker reports it 4×2 px off. It is Geist 52.5 px at weight 450, tracking −0.045em; the clip's face is probably Geist itself or a close relative.
- **Cube triangle colour:** the checker reports deltaE 8.8 on the white triangle on the top face, most likely from the anti-aliasing around a 19 px shape.
- **Motion span 2.8–4.0 s:** the checker flags that the clip changes slightly here and the render does not. The clip's cursor drifts and Drives fades a little later than mine.
- **Photo-class regions:** none. The imagery list is all CSS/SVG-drawable, so nothing was stood in.

## Pattern

**Check that a "still" object really is still.** The rubric said the layout never moves, but one --col through the cube at 2.05 s and at 3.7 s gave different dark spans (347–666 vs 364–649). The cube explodes on hover. A keyframe taken mid-hover shows only the exploded state, so a rebuild drawn from it draws the wrong rest state, and the pieces' staggered gaps look like a static design. Draw the rest state, then move each piece along its own outward vector with one shared scalar. Hover drives that scalar through a transition; the demo drives it with WAAPI.
