Motion first. The last pass was judged STATIC: the clip moves between the scored moments and the render did not. Make every movement below real, timed to the clip, and loop the whole sequence seamlessly with the clip's period (2.73 s) from t=0:
- Column 1: a selection marquee grows from ~16x16 at (27,218) at 0.13 s to ~46x62 at 0.5 s, then its bottom-right corner reaches ~(115,342) by 1.4 s, top-left fixed; it stays drawn through 2.5 s.
- The cursor drags with the marquee corner, then moves down-right off the document to ~(153,385) by 2 s as a hollow outlined arrow, gone by 2.5 s.
- Wire pulses: the pulse is a soft glowing stretch of the wire itself that fades at both ends, never a dot or arrow. A green stretch appears between 2 s and 2.5 s beyond the puck toward the tile stack (x 640 to 690, y 290 to 315). A blue stretch travels from ~(985,378) at 0.5 s to ~(1045,355) at 1.38 s, reaches the box port (~1065,345) by 2 s, and the wire is grey again by 2.5 s.
- The blue tag inside the ring sways a few px (tilt or shift) between 2 s and 2.5 s; the ring stays put.
- Text, buttons, dividers and the column 1 documents never move.
Run the checker with several moments and confirm the motion read is no longer STATIC before you finish.
