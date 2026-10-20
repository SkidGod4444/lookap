/* The lookap mark: a viewfinder with its focus dot pulled off-centre. Silver on dark. */
export function Mark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M2 7V3.5A1.5 1.5 0 0 1 3.5 2H7M13 2h3.5A1.5 1.5 0 0 1 18 3.5V7M18 13v3.5a1.5 1.5 0 0 1-1.5 1.5H13M7 18H3.5A1.5 1.5 0 0 1 2 16.5V13" fill="none" stroke="#c9c9c9" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="11.5" cy="8.5" r="2.6" fill="#ffffff" />
    </svg>
  );
}
