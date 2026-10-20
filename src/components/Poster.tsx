import type { Entry } from "@/lib/data";

/* Placeholder artwork: a deterministic gradient and a title set in the entry's own tone.
   Swap for real posters once the catalog has media. */
export function Poster({ entry, className = "", compact = false }: { entry: Entry; className?: string; compact?: boolean }) {
  const { hue, tone, title } = entry;
  const bg =
    tone === "dark" ? `linear-gradient(160deg, hsl(${hue} 10% 9%), hsl(${hue} 8% 4%))`
    : tone === "color" ? `linear-gradient(160deg, hsl(${hue} 95% 56%), hsl(${hue} 90% 48%))`
    : `linear-gradient(160deg, hsl(${hue} 4% 24%), hsl(${hue} 3% 15%))`; /* silver-grey tiles on the dark canvas */
  const fg = tone === "light" ? "#e8e8e8" : "#ffffff";
  const sub = tone === "light" ? "#9a9a9a" : "rgba(255,255,255,.6)";
  return (
    <div className={`absolute inset-0 flex flex-col justify-end p-[6%] ${className}`} style={{ background: bg, color: fg }}>
      <div className="mb-auto flex items-center gap-1.5 opacity-60">
        <span className="size-2 rounded-full" style={{ background: fg }} />
        <span className="h-1 w-10 rounded-full" style={{ background: sub }} />
      </div>
      {!compact && (
        <>
          <div className="text-[clamp(13px,4.5cqw,22px)] font-medium leading-[1.15] tracking-[-0.015em] text-balance">{title}</div>
        </>
      )}
    </div>
  );
}
