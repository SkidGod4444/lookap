Motion first. The last pass still sat still in 1 of 7 spans and the card trajectories drifted out of step. The whole section should feel alive and loop seamlessly with the clip (period 3.17 s, from t=0):
- The card field slides as one rigid field along the isometric diagonal, down-right about 2 px right per 1 px down: the "1099-MISC" card goes from ~(527,455) to ~(598,490) over ~1.7 s, slow, linear and continuous with no pause; positions differ at 1.0, 1.75 and 2.5 s. At ~0.55 s it jumps back up-left one drift span (the loop seam), matching the clip; time it so the measured trajectories stay in step rather than drifting.
- The green glow stays fixed in frame: cards turn green as they enter it and white as they leave.
- The puck stays centred on x≈626 and rises steadily ~25 px (lower edge y 311 at 0.6 s to y 284 at 2.9 s), resetting with the loop.
- Heading and pinstripe margins never move.
Also fix the failed static item: the card field fades to the background toward all four edges, so the outer cards are faint and ghostly (a mask or gradient over the field).
