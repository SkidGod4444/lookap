import Link from "next/link";
import { RECIPES } from "@/lib/registry";

/* One line under the demo: what the registry returns for it, and where to read the rest. */
export function RecipePeek({ slug }: { slug: string }) {
  const r = RECIPES.find((x) => x.slug === slug);
  if (!r) return null;
  return (
    <Link href="/mcp" className="group flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl bg-card px-4 py-3 ring-1 ring-line transition-colors hover:ring-line-strong">
      <code className="min-w-0 break-all font-mono text-[12px] text-silver">get_recipe(&quot;{r.slug}&quot;)</code>
      <span className="text-[12px] text-subtle">→ {Object.keys(r.palette).length} colours · {r.geometry.length} geometry rules · {r.motion.length} motion phases</span>
      <span className="ml-auto text-[12px] font-medium text-subtle transition-colors group-hover:text-foreground">How agents call it →</span>
    </Link>
  );
}
