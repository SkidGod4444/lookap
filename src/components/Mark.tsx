/* The lookap mark: the magnifier cat on a silver tile, in two layers so the magnifier can move.
   Artwork is an illustration by @ilishandreev (design30club), background removed and split around the lens.
   LICENCE PENDING: replace or license before launch. The favicon (src/app/icon.png) is the flat tile.
   Hover: the glass lifts out of the tile, spins once, and drops back in with a little overshoot.
   Layers are served at 2x of the 314 px source; sharper needs the original file. */
export function Mark({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`group/mark relative inline-block shrink-0 overflow-visible rounded-[22%] bg-[linear-gradient(180deg,#ececec_0%,#cfcfcf_50%,#a8a8a8_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.6)] ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size layered artwork, served as-is */}
      <img src="/mascot-body.png" alt="" draggable={false} className="absolute inset-[12%] h-[76%] w-[76%] select-none" />
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size layered artwork, served as-is */}
      <img
        src="/mascot-glass.png"
        alt=""
        draggable={false}
        className="absolute inset-[12%] h-[76%] w-[76%] select-none [transform-origin:34%_40%] motion-safe:group-hover/mark:animate-glass-swag"
      />
    </span>
  );
}
