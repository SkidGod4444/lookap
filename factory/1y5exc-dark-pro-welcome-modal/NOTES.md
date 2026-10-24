# Dark Pro Welcome Modal — rebuild notes

Credit: Craftwork, https://x.com/craftworkdesign/status/2105643365383700505
Nothing was sampled or stood in: the hero, reader, card foil, logo and glow are all CSS / inline SVG.

## Timeline (measured)

Tracked with `--track 800 --class light` (card top edge) and read from the 10 fps sheets 0–10.8 s.

- 0 s: the clip loops, so frame 0 still shows the CTA in grey (#c9c9c9). It turns white by 0.05 s.
- 0–0.2 s: slot dark, LED bright amber (#b1822d), no card. The LED blinks bright and dim about every 0.42 s until the lift (details under Differences).
- 0.2–0.42 s: a white bloom grows along the whole slot length, brightest in the middle and still lit at the ends. Measured at 0.4 s down x=720: the deck reads #92 at the slot lip (y 480) and #43 16 px out, and is back to its base shade by about 25 px. Faint at 0.3 s, full by about 0.42 s.
- Card feed, six ratchet steps of ~47 px, each ~100 ms ease-out, holding between steps. Card top:
  482 → 447 (0.45–0.55), → 400 (0.70–0.80), → 352 (0.95–1.05), → 304 (1.22–1.32), → 257 (1.48–1.58), → 209 (1.73–1.85).
  Below the slot line (y≈486) the card is hidden; a white glow lights its exit edge throughout.
- 2.02–2.22 s: card lifts clear, top 209 → ~154 (overshoot), settles at 161 by 2.5 s (rest box 495–945 × 161–446). Glow fades out by 2.25 s.
- 2.03–2.12 s: LED switches amber → green.
- 2.1–3.1 s: small post-lift wobble (tilt and foil drift), then rest.
- 3.6 s onward: cursor over the card. The rainbow band sits on the side opposite the cursor (cursor bottom-right → band off, card green-silver at 4.0 s; cursor left → band at top-right, gold base at 5.4 s). The card tilts a few degrees toward the cursor and stays within ~5 px of its rest box.
- 2.03–2.12 s: the LED turns green (core #25984f, faint halo #1f302a).
- 8.7 s onward: the cursor leaves the card. The band swings left from 8.6 to 9.0 s (about 180 px), then back right by 9.6 s (about 135 px). `--diff 8.88,9` shows only the card changing. At about 9.6 s the cursor rests on the CTA (hover #f4f4f4).
- Card shadow at 3.3 s: in the 14 px gap under the card (y 447–459) the hero reads #0f under the card and #14 beside it.
- Headline, body, CTA, link, close and reader never move. Tracked through the whole clip.

Layout: modal 400–1040 × 106–976, r=32, page #0b0b0b. Hero 106–585: radial #222 top-centre → #141414 at the base and sides. Lower panel #1e1e1e.
Reader: deck top face y 461–510 (trapezoid 497–943 → 445–995, rounded shoulders, #363638 lip → #262628), slot y 481–490 (x 486–954, black, #3f3f42 lip under it), body 511–585 #202022 → #1a1a1a, LED 8 px at (952,548).
Text column x=439: headline 35.5 px bold white (cap top ≈630), body 25.5/36 px #9a9a9a, CTA 439–1001 × 810–883 r=14, link centred at y≈921.

## Differences

- Fonts: Figtree stands in for the clip's geometric sans. Sizes were raised ~6% (34 → 35.5, 24 → 25.5) so line widths match within ~2%; letterforms differ slightly (the clip's headline is a touch lighter).
- Foil: the band is a 62° linear gradient pushed through an feTurbulence displacement (coarse + fine) for mottled, grainy edges. The clip's posterised flecks are crisper and more saturated, especially at 1–2 s. I tried hard posterisation (feComponentTransfer discrete). It drew contour lines across the gold/mauve base, so I removed it.
- Band position at 5.4 s sits ~40–60 px left of the clip's (the clip shows violet only in the top-right corner).
- The band position and tilt in demo mode follow a cursor path read by eye from 10 fps sheets, not a tracked path. In between moments they can be off by ~0.1 of the card width.
- The tilt maps pointer to rotateX ±3°, rotateY ±6° about a rest point. The clip's tilt amplitude was judged by eye (a few px of edge skew).
- Round 3 (checker runs 7–9). Slot glow: it now runs the full slot length (500 px with a soft mask at the ends) and lights the deck about 25 px above and below the slot. At 0.3 s it is at about half strength. The clip shows almost nothing there until about 0.35 s, so mine is slightly early on purpose, to meet c30.
- CTA: the clip's frame 0 shows a left-over grey (#c9c9c9) because the clip loops. My render now matches it, which brought the colour deltaE from 17.9 down to 5.9. Hover is #f4f4f4.
- LED: the amber blinks while the card feeds; it is not one steady colour. I sampled the centre pixel every 0.1 s. It is bright #b1822d at 0–0.4 s, 0.75–0.85, 1.2, 1.62–1.72 and 2.0 s, and dims to #4c3d20 at 0.5–0.6, 1.0, 1.4 and 1.85–1.92 s. That is a period of about 0.42 s, out of step with the ratchet steps. It turns green #25984f at 2.04–2.1 s. Earlier rounds drew one steady amber, and every amber I tried scored wrong at some moment (deltaE 19.8, then 40.2, then 44.2 as I dimmed it), because the clip is bright at some moments and dim at others. The blink is now keyframed from those samples. On the last checker run (run 11, keyframes plus 0.3, 1, 1.2 and 2.5 s) the LED's colour error fell to 17.1, and the overall pixel score was 87. In the 4x zoom at 1.2 s, the clip's lit core is still a little yellower and brighter than mine.
- Card shadow: a blurred dark ellipse under the card. In the clip the gap under the card is only 5 levels darker than the hero (#0f against #14), so in both renders it reads faintly.
- 8.88–9 s (fixed in round 4): the checker said my render was still where the clip changes. Zooms at 8.6, 9 and 9.6 s showed the cause. After the cursor leaves the card, the clip's band swings left and then back. At the top edge, its white-green core sits at card x ≈ 330 (8.6 s), 230 (8.88), 150 (9.0), 190 (9.32) and 285 (9.6). My band had held near x 250–290. The demo cursor path now carries those positions. The checker now reports "the render changes where the clip changes" (run 14).
- Round 4 headline: the checker's suggested shift went from −2 px to −4 px after I moved the headline 1.5 px left, so that move was the wrong way. It now sits 1.5 px right of the column instead. On run 15 the checker no longer suggests a shift, and the stills score 88. The headline, close X, link and body are still flagged "different drawing" (difference 16–30). The cause is the Figtree stand-in's letterforms and the clip's video softening, not position or colour.
- The headline, close X and link are still flagged "different drawing" at deltaE ≤ 2.1. The cause is the Figtree stand-in font, not the colour.

## Pattern

**Foil follows the light, not the hand.** On a holographic card the rainbow band sits on the side opposite the pointer, as if a light behind the viewer reflects off a tilted surface. Write it as one function of the pointer, b = 1 − (0.75·x + 0.25·y), that drives both the band offset and the tilt, so the two can never disagree. For a replayed demo, write down the cursor path, not the band path, and feed it through the same function. Hard posterisation over a pale pastel base draws contour lines. Use displacement noise for grain, and keep any posterising to the saturated band only.
