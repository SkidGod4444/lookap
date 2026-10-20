import Image from "next/image";

/* The lookap mark: the magnifier cat on a silver tile. Artwork is an illustration by @ilishandreev (design30club),
   background removed and placed on the product's silver gradient. LICENCE PENDING: replace or license before launch.
   The same tile is the favicon (src/app/icon.png). */
export function Mark({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/mascot-tile.png"
      alt=""
      width={size}
      height={size}
      className={`rounded-[22%] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.6)] ${className}`}
      priority
    />
  );
}
