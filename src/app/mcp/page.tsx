import Link from "next/link";
import { badge, button } from "@/components/button";
import { NOTES, RECIPES } from "@/lib/registry";

const TOOLS = [
  ["search_designs", "Find curated interfaces by words, category or kind.", "free: 5 results"],
  ["get_design", "Attribution, types, demo clip and the measured recipe for one entry.", "recipe paid"],
  ["get_recipe", "Palette, geometry, type and motion table, read from the clip's pixels.", "paid"],
  ["list_notes", "Design guidance distilled from the rebuilds.", "free"],
  ["get_note", "One note in full.", "free: first note"],
  ["check_media", "Does this clip or still hold an interface? Signals, verdict, score.", "paid"],
];

export default function McpPage() {
  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-10 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-balance text-foreground">Design knowledge your agent can call.</h1>
        <p className="max-w-[62ch] text-[14px] leading-[1.55] text-subtle">lookap is a registry, not a service. Claude Code, Codex and Cursor connect over MCP and pull curated interfaces, measured recipes and design notes while they build. Nothing runs on our side except the lookup.</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">Connect</h2>
        <pre className="overflow-x-auto rounded-xl bg-card p-4 font-mono text-[12.5px] leading-relaxed text-silver ring-1 ring-line">{`claude mcp add --transport http lookap https://lookap.app/api/mcp \\
  --header "Authorization: Bearer lk_live_…"`}</pre>
        <p className="text-[13px] text-subtle">No key? Leave the header off. The free tier answers with a sample so you can see the shape before paying. Local dev: use http://localhost:3000/api/mcp.</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">Tools</h2>
        <ul className="divide-y divide-line rounded-xl bg-card ring-1 ring-line">
          {TOOLS.map(([name, what, tier]) => (
            <li key={name} className="grid gap-1 p-4 sm:grid-cols-[180px_1fr_auto] sm:items-baseline sm:gap-4">
              <code className="font-mono text-[12.5px] text-foreground">{name}</code>
              <span className="text-[13px] text-subtle">{what}</span>
              <span className={badge("dark", "w-fit px-2 py-0.5 font-mono text-[10px]")}>{tier}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">Measured recipes</h2>
          <ul className="mt-2 flex flex-col gap-1.5 text-[13px]">
            {RECIPES.map((r) => <li key={r.slug}><span className="text-foreground">{r.title}</span><span className="block text-subtle">{r.source}</span></li>)}
          </ul>
        </div>
        <div>
          <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">Notes</h2>
          <ul className="mt-2 flex flex-col gap-1.5 text-[13px]">
            {NOTES.map((n) => <li key={n.slug} className="text-foreground">{n.title}</li>)}
          </ul>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3 rounded-2xl bg-card p-5 ring-1 ring-line">
        <p className="min-w-[24ch] flex-1 text-[14px] text-subtle">A Pro key opens the whole registry, recipes and media checks. Team keys add shared collections.</p>
        <Link href="/pricing" className={button("silver", "h-9 rounded-lg px-4 text-[13px]")}>Get a key</Link>
        <Link href="/feed" className="text-[13px] font-medium text-subtle transition-colors hover:text-foreground">Browse first</Link>
      </section>
    </div>
  );
}
