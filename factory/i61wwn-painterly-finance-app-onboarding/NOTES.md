# Painterly Finance App Onboarding, rebuilt

Factory run (Fable, $6.50, 13 min, pixel 90), then finished by hand from the clip's pixels. The painting is sampled from the clip under the catalogue licence: one plate, the per-pixel median of the phone region over the clip's 24 s, with the spinner, copy and pill painted out. Rubric: 33 of 36 criteria pass under a three-vote judge (what fails is the rim's refraction being subtler than the clip's and the outermost ripple fading early at 5.95 s); pixel 94 over 10 moments; the render moves where the clip moves.

## Timeline

Nothing reflows. The rings are the only motion; the spinner's rotation is invisible because its nine spokes are symmetric.

- A glass ring is born at the spinner's centre (156, 451 in the 314 x 684 screen) every 2.00 s, at 0.92 s past the even second (births at 0.92, 2.92, 4.92 ...), measured as frame minus plate by radius at 0 s, 5.95 s, 6.95 s, 18 s and 18.5 s.
- Radius grows at 53 px/s, linear: at 5.95 s the rings sit at 54, 161, 266 and 372 px (the clip: 54, 161, 265.5, 368). Consecutive rings are 106 px apart.
- A ring is at full strength for about 5 s and gone by 7.2 s (the ring at 372 px reads as +4 luma at most), so four are alive at once. Built as one 8 s linear CSS animation on four elements with delays of -7.08, -5.08, -3.08 and -1.08 s; the checker seeks it.
- The spinner steps 40 degrees every 111 ms (9 steps per second). Any period looks the same.
- The pill answers hover (background #f1f1f1) and press (scale .98, #e9e9e9) in 150 ms, the only pointer response in the clip.

## What was measured, and how it is built

- **Painting.** The per-pixel median of the clip's phone region over its 24 s at 6 fps (`ffmpeg tmedian`). The rings move, so the median is the painting with no ring in it; the spinner, three lines of copy and the pill are static, so they came through too and were painted out by mirroring the clean rows beside each (the gaps between the lines, the disc between r 23 and 32 around the spinner, the 50 rows above the pill). The frosted panel (a 3 % white tint with a 1.5 px blur, 275 x 200 at 20, 410) and the soft disc under the spinner (r 32) are tints of the painting that cannot be separated from it, so they stay in the plate. The plate carries mirrored margins (56 left and right, 152 above, 80 below) so the rims can pull from beyond the screen. One JPEG, 53 KB, set as `--plate`.
- **Ring lip.** Over the sky at 5.95 s (column 700 of the frame, rows 395 to 415) the rim is a 4 px band 30 luma darker than the sky, warm, with nothing lighter inside and a faint lighter edge outside at the smaller rings. Built as a radial gradient per ring: rgba(50,30,10,.18) from R-3.6 to R-1.2 px, white at .07 from R+0.8 to R+2.5 px.
- **Ring glass.** Inside the rim a band of about 10 px shows the painting from further out, squeezed: over the hills it is sky-coloured, over the tree it is sky, over the yellow floor it is foliage, over the sky it is invisible. That is a fisheye edge, not a magnifier: the same look at every radius. Built as the plate again, shrunk to 0.75 about the spinner, seen through a soft-edged radial mask from R-16 (transparent) to R-10 (opaque) to R.
- **Spinner.** Nine 4 px spokes from radius 6 to 21.5 about (156.5, 451.5), 40 degrees apart, the first 8 degrees past 12 o'clock, white, square ends (from the median plate: rows 430 to 472, columns 135 to 177, bright arcs at 6, 48, 90, 132, 174, 213, 252, 291, 327 degrees).
- **Copy.** Inter 13 px on 19 px, white, 0.15 px tighter than Inter sets it, centred at x 156; cap tops at 505, 524 and 543; line widths 200, 212 and 164 px (the render: 203, 219, 168 before tightening, 200, 213, 164 after).
- **Pill.** 277 x 44 at (18, 626), radius 22, #fdfdfd; label Inter 13 medium, #0a0a0a, 0.1 px tighter, cap rows 644 to 652, x 122 to 188.
- **Phone.** 314 x 684 at (656, 199) in the 1628 x 1080 frame, corner radius 27.

## Differences

- The rim's bright band over the hills (ring 2 at 5.95 s) is a touch narrower and dimmer than the clip's, and the clip's ring around the spinner reads a little heavier. The clip's lip is also softer than a gradient can be, since the clip itself is soft: at 4x the clip's dark line blurs over 2 px, the render's over 1 px.
- The painting is the clip's, so its texture is right, but it is a JPEG of a compressed video frame averaged over time: fine brush detail is a little softer than the clip at 4x, and under the copy and the spinner it is mirrored rows, not the real paint.
- The frosted panel and the spinner's disc are in the plate rather than drawn, so a lens passing over them pulls them with the paint. The clip's rings pass over them too, and look the same.
- The spinner's rotation and the exact rim optics are inferred: the clip cannot show the first, and the second was fitted to the crops rather than derived.

## Pattern

**A moving glass over a still picture: take the picture from the whole clip, not from a frame.** When something translucent moves over a static image, no single frame shows the image clean, but the per-pixel median over the clip does, because each pixel is covered only briefly. Static UI on top of the image survives the median and has to be painted out, by mirroring the rows beside it. Measure the moving thing as frame minus median by radius or by row: the lip, the pull and the timing fall out as numbers, and the thing itself is then drawn over the clean plate.

**A glass rim is a fisheye edge, not a magnifier.** At the rim of a glass ring or bubble the world from further out is squeezed into a thin band, so the band takes the colour of whatever lies a third again as far from the centre: sky over the hills, sky over the tree, foliage over the floor, nothing visible over the sky. A dark line of 3 to 4 px sits just inside the rim and a faint light line just outside. Build it as the picture again, shrunk about the centre by about a quarter, seen through a thin soft-edged ring mask, with the dark line as a gradient on top.
