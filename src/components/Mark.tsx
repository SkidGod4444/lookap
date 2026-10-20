/* The lookap mark: a hand torch, tilted up and to the right, with its beam on. "look up" as a searchlight.
   Silver body on dark, white light. The beam breathes and sweeps a few degrees (see --animate-beam-* in globals.css);
   both stop under prefers-reduced-motion. Sizes under 36 px drop the grip detail so the shape stays crisp. */
export function Mark({ size = 20, className = "", still = false }: { size?: number; className?: string; still?: boolean }) {
  const small = size < 36;
  const anim = still ? "" : "motion-safe:animate-beam-sweep";
  const breathe = still ? "" : "motion-safe:animate-beam-breathe";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true" overflow="visible">
      <defs>
        <linearGradient id="lk-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e4e4e4" />
          <stop offset=".45" stopColor="#a9a9a9" />
          <stop offset=".55" stopColor="#8e8e8e" />
          <stop offset="1" stopColor="#4f4f4f" />
        </linearGradient>
        <linearGradient id="lk-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
          <stop offset=".35" stopColor="#ffffff" stopOpacity=".45" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="lk-lens" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".6" stopColor="#f3f3f3" />
          <stop offset="1" stopColor="#bdbdbd" />
        </radialGradient>
      </defs>
      {/* whole torch tilted 38deg up-right around its centre */}
      <g transform="rotate(-38 32 32)">
        {/* beam: pivots at the lens, sweeps and breathes */}
        <g className={anim} style={{ transformOrigin: "47px 32px", transformBox: "view-box" }}>
          <path className={breathe} d="M47 25 L 70 8 L 70 56 L 47 39 Z" fill="url(#lk-beam)" />
        </g>
        {/* handle */}
        <rect x="6" y="25" width="30" height="14" rx="4" fill="url(#lk-body)" stroke="#161616" strokeWidth={small ? 3 : 2.2} />
        {!small && <g stroke="#161616" strokeWidth="1.4" strokeOpacity=".55"><path d="M12 27v10M17 27v10M22 27v10M27 27v10" /></g>}
        {/* tail cap */}
        <rect x="4" y="27" width="4" height="10" rx="1.5" fill="#3a3a3a" stroke="#161616" strokeWidth={small ? 3 : 2.2} />
        {/* head */}
        <path d="M36 25 L 44 20 L 44 44 L 36 39 Z" fill="url(#lk-body)" stroke="#161616" strokeWidth={small ? 3 : 2.2} strokeLinejoin="round" />
        <rect x="43" y="19" width="5" height="26" rx="1.5" fill="url(#lk-body)" stroke="#161616" strokeWidth={small ? 3 : 2.2} />
        {/* lens */}
        <rect x="47" y="21" width="2.5" height="22" rx="1" fill="url(#lk-lens)" />
        {!small && <circle cx="30" cy="22.5" r="1.8" fill="#161616" />}
      </g>
    </svg>
  );
}
