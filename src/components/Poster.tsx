import type { Entry } from "@/lib/data";

/* Placeholder artwork for entries without media: a quiet dark tile with the title small at the bottom.
   Placeholders are not content, so they get no colour. Real media replaces this once the catalog carries it. */
export function Poster({ entry, className = "", compact = false }: { entry: Entry; className?: string; compact?: boolean }) {
  const { hue, title } = entry;
  const bg = `linear-gradient(160deg, hsl(${hue} 4% 19%), hsl(${hue} 3% 12%))`;
  return (
    <div className={`absolute inset-0 flex flex-col justify-end p-[7%] ${className}`} style={{ background: bg }}>
      {!compact && <div className="text-[13px] leading-[1.3] font-medium text-silver text-balance">{title}</div>}
    </div>
  );
}
