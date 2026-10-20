/* The lookap mascot: a fluffy ball with two very large eyes, looking up and to the right.
   "look up" is the name and the pose. Drawn in the product's silver on dark; no colour.
   The same drawing is the favicon (src/app/icon.svg). Geometry is generated symmetric: 16 tufts on a circle. */
export function Mark({ size = 20, className = "" }: { size?: number; className?: string }) {
  if (size < 36) return <MarkSmall size={size} className={className} />;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
      <radialGradient id="lk-body" cx="38%" cy="28%" r="75%"><stop offset="0" stopColor="#dedede"/><stop offset=".55" stopColor="#a8a8a8"/><stop offset="1" stopColor="#5c5c5c"/></radialGradient>
      <radialGradient id="lk-eye" cx="45%" cy="40%" r="60%"><stop offset="0" stopColor="#ffffff"/><stop offset="1" stopColor="#d9d9d9"/></radialGradient>
      </defs>
      <g fill="url(#lk-body)" stroke="#161616" strokeWidth="2" strokeLinejoin="round">
    <circle cx="32.0" cy="16.5" r="5.2"/>
    <circle cx="39.5" cy="18.0" r="5.2"/>
    <circle cx="45.8" cy="22.2" r="5.2"/>
    <circle cx="50.0" cy="28.5" r="5.2"/>
    <circle cx="51.5" cy="36.0" r="5.2"/>
    <circle cx="50.0" cy="43.5" r="5.2"/>
    <circle cx="45.8" cy="49.8" r="5.2"/>
    <circle cx="39.5" cy="54.0" r="5.2"/>
    <circle cx="32.0" cy="55.5" r="5.2"/>
    <circle cx="24.5" cy="54.0" r="5.2"/>
    <circle cx="18.2" cy="49.8" r="5.2"/>
    <circle cx="14.0" cy="43.5" r="5.2"/>
    <circle cx="12.5" cy="36.0" r="5.2"/>
    <circle cx="14.0" cy="28.5" r="5.2"/>
    <circle cx="18.2" cy="22.2" r="5.2"/>
    <circle cx="24.5" cy="18.0" r="5.2"/>
    </g>
    <circle cx="32" cy="36" r="21" fill="url(#lk-body)"/>
    <path d="M17 19 C 13 8, 24 7, 26 15" fill="url(#lk-body)" stroke="#161616" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M47 19 C 51 8, 40 7, 38 15" fill="url(#lk-body)" stroke="#161616" strokeWidth="2" strokeLinejoin="round"/>
    <circle cx="23.5" cy="34" r="10.5" fill="url(#lk-eye)" stroke="#161616" strokeWidth="2.2"/>
    <circle cx="40.5" cy="34" r="10.5" fill="url(#lk-eye)" stroke="#161616" strokeWidth="2.2"/>
    <circle cx="26.5" cy="30.5" r="6" fill="#161616"/><circle cx="43.5" cy="30.5" r="6" fill="#161616"/>
    <circle cx="28.5" cy="28.5" r="2" fill="#ffffff"/><circle cx="45.5" cy="28.5" r="2" fill="#ffffff"/>
    <path d="M30.5 45 h3 l-1.5 2 Z" fill="#161616"/>
    <path d="M29 49.5 q3 2.5 6 0" fill="none" stroke="#161616" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

/* Small sizes (header, footer, inline): the same creature reduced to what survives at 20 px,
   a silver disc with two oversized eyes looking up-right. Strokes are thicker so it stays crisp. */
export function MarkSmall({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="lk-body-s" cx="38%" cy="28%" r="75%"><stop offset="0" stopColor="#e2e2e2" /><stop offset=".6" stopColor="#a8a8a8" /><stop offset="1" stopColor="#5c5c5c" /></radialGradient>
      </defs>
      <circle cx="32" cy="34" r="27" fill="url(#lk-body-s)" stroke="#161616" strokeWidth="3" />
      <path d="M13 20 C 9 6, 24 5, 27 14" fill="url(#lk-body-s)" stroke="#161616" strokeWidth="3" strokeLinejoin="round" />
      <path d="M51 20 C 55 6, 40 5, 37 14" fill="url(#lk-body-s)" stroke="#161616" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="21.5" cy="34" r="13" fill="#ffffff" stroke="#161616" strokeWidth="3" />
      <circle cx="42.5" cy="34" r="13" fill="#ffffff" stroke="#161616" strokeWidth="3" />
      <circle cx="25.5" cy="30" r="7.5" fill="#161616" /><circle cx="46.5" cy="30" r="7.5" fill="#161616" />
      <circle cx="28" cy="27.5" r="2.6" fill="#ffffff" /><circle cx="49" cy="27.5" r="2.6" fill="#ffffff" />
    </svg>
  );
}
