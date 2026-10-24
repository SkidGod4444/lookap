# Lanyard ID Badge Portfolio (Sam Cheng): rebuild notes

Source: https://x.com/samfcheng/status/2104993779510047203

## Timeline

Read from 10 fps contact sheets over the whole clip (0–17.98s). The pose is the clip top (where the strap meets), x/y in frame px, plus the badge angle (CSS degrees, + = clockwise, so the body swings left). The corner text and the giant name never move.

- 0–0.45s: at rest. Pivot (780,285), angle 0. The cursor is an arrow at (1040,710).
- 0.25–0.5s: the cursor glides onto the badge's pill row.
- 0.5–1.05s: the cursor grabs the badge at (≈790,815) as a grab hand and nudges it: sway to +5° at 0.63s and +7° at 0.8s (badge edge at y=600 moves 14px, then 27px, left, per `--row 600`), then back to +4° at 1.0s.
- 1.25–2.85s: drag 1. The cursor grabs the lower card and pulls up and left, then right: angle goes +12° → -50° (1.5s) → -85° (1.7s). The badge lies sideways with its body to the right of the clip, held 1.8–2.8s with the pivot near (700–760, 240–290).
- 2.9–3.4s: released. It swings back -60° → 0° → +2°, the pivot settling near (880,300).
- 3.45–4.85s: drag 2. Held at -35 to -40° with the pivot drifting to x≈680–750.
- 4.9–6.75s: drag 3. Lifted to the top edge (pivot y < 0 at 5.2s), the badge flips over its top to ≈-265° (body left, sideways), held near (885–990, 15–190).
- 6.8–7.4s: released, falls back clockwise (+60° → +5°).
- 7.5–8.2s: swings to ≈-35° with the body lower right and the pivot at x≈690, the strap bowed left (7.93s).
- 8.25–9.0s: short drag to the right (pivot x 840 → 929), angle -32° → 0°.
- 9.45–10.85s: drag 4. Lifted top-left: angle +30° → +90°, pivot near (500–620, 30–50).
- 10.9–11.7s: released, swings +80° → 0°. 11.8–12.5s: on to -40°. 12.55–13.15s: held at ≈-38°.
- 13.2–14.3s: returns to 0 to +5°.
- 14.4–17.98s: slow decaying swing: +25–30° (14.4–15.2s), 0° (16.0s), -17° (16.75–17.05s, kf2), -10° (17.52s), toward 0 at 17.98s.

Demo mode samples this table (cubic Hermite) at 30 fps into `element.animate` keyframes for the badge rig, the shadow rig, the strap `d` path and a drawn cursor (a grab hand during the drag windows, an arrow elsewhere). Without `?demo`, the badge runs as a rope + pendulum simulation: the clip top is a point on two fixed-length strands anchored above the frame, the badge is a pendulum driven by the pivot's acceleration, and a grabbed point follows the pointer.

## Differences

- Giant name (round 4): Newsreader, opsz 20, weight 495, 335px, letter-spacing -1, word-spacing -12, left -16, top 754. It is set as one line with no per-glyph placement. In round 3 the file still used Gelasio, which failed the judge on low contrast, its 'a' and light strokes. Round 4 tried four faces, each zoomed against the clip at 2.5s:
  - Source Serif 4 opsz 60: far too light and wide.
  - PT Serif: light and wide.
  - Gelasio 540: too bold and wide.
  - Newsreader ≈490: closest on contrast, the ball-terminal 'a' and the beaked 'S'/'C'.

  The 'C' (x≈668) and the 'g' cut at the right edge now line up with the clip. Newsreader's cap height is ≈240 against the clip's 225, while its x-height matches. As a result, the caps sit ≈7px high and the 'm' region reads (-8,12) off. Moving the line 6px down lowered the pixel score from 39 to 36, so it stays at 754. The clip's 'm' has flatter, squarer serifs than Newsreader's wedges.
- Corner text: Gelasio, 18.3px, weight 500. '[more]' is #8f8f8f with `text-decoration: underline` 1.6px #8a8a8a, offset 2px, skip-ink off. Round 3's border-bottom fell below the baseline, outside the judge's crop. This underline sits just under the baseline, as in the clip (checked with `--zoom 280,120,80,34`). '[more]' starts ≈12px right of the clip's, because Gelasio sets slightly wide.
- Card text is still Newsreader, where the clip looks like Times.
- Card name: rough edge from feTurbulence displacement (scale 2.3), blurred 0.6px, then an alpha threshold that gives a blotted ink edge. 'Sam'/'Cheng' sit within ≈4px of the clip.
- Swivel clip (round 4): redrawn. The D-ring spans x≈764–800, y≈290–318 and is drawn as three strokes of one path held in `<defs>`: a #8c rim at 4.4px, a #d9 tube at 3px and a white crest at 1.3px. The ring had rendered solid dark grey because the source path carried its own stroke, and `<use>` cannot override that. Below the ring:
  - a tapered neck (y 316–330) with a dark-to-light-to-dark gradient and three faint ridges;
  - a shank (y 330–353) with a six-stop gradient: dark edges, a white crest left of centre;
  - a 9px rounded hook loop (y 352–399) into the slot, with a grey inner gap and a white highlight.

  The clip's ring is ≈3px taller, and its neck is a little darker than ours.
- Multiply pill: #2e078d, from `--row 829 --hex` (core #2b048d). It is no longer flagged. Oracle stays #d0091f: switching to the sampled #c6131e raised its deltaE from 8.8 to 11.5, because the pill's mean includes its white text.
- Sway: the angle is now +5° at 0.63s and +7° at 0.8s (was 4/5). `--row 600` measured the clip's badge edge moving 14px left by 0.63s and 27px by 0.8s, a rotation of ≈3.6° and ≈7° about y≈380. The badge bottom moves ≈30–45px left.
- Holder: fill alpha cut from .22 to .03, so the giant letters show through the margin solid black (#050505 in the clip). Seal: 8 crisp 1px lines at a 2px pitch between y≈423 and 437. The clip's lines are slightly broken and uneven.
- Pose timing comes from 10 fps sheets read by eye, not tracked edges. Expect positions off by 20–40px and angles off by 5–10° during the fast drags (1.3–1.7s, 5.2–5.4s, 9.6–10.0s). The flip over the top at 5.3s is interpolated, so the in-between frames are guessed.
- Strap: a flat 14px stroke (#2e312d) on a quadratic sag curve. No 3D twist, and no stitching or flat end at the D-ring.
- Shadows are blurred shapes offset (+22,+26) for the badge and (+30,+20) for the strap. They follow the badge's pose rather than a light model.
- Nothing was sampled or stood in: no photo-class regions. Strap, clip, holder, card and shadows are all drawn.

## Pattern

**Bake the gesture, don't draw the strap.** When a clip shows a physics toy (rope, lanyard, pendulum) being dragged, record only the pose of the rigid part (pivot x, y and angle) at each sampled moment. Derive the flexible parts (rope curve, shadow) from that pose with one shared function. Demo mode samples the pose table into keyframes, and live mode feeds the same render function from a small simulation, so both stay identical in look. Fixed-length strands drawn as a quadratic with sag `h = sqrt(3c(L−c)/8)` bend convincingly when the pivot comes closer than the strand length. A `translate(%)` on a full-stage element keeps the WAAPI keyframes unit-free, so they scale with `--u`.

**Pick a substitute face by rendering candidates, not by metrics.** A metric-compatible clone (Gelasio for Georgia) can match widths and still fail on the letterforms a viewer notices: terminals, serif shape and contrast. A strip of five or six candidate fonts, rendered in one checker pass and zoomed beside the clip, settles the choice in a single run. Judge the candidates at display size on stroke contrast, the 'a' and the cap serifs. Match the x-height first and then fit the line width with letter- and word-spacing; a 3–4% cap-height mismatch costs less than a wrong 'a'. In SVG, a `<use>` cannot restyle a property that the referenced element sets itself. Keep shared shapes unstyled in `<defs>` and style each `<use>`.
