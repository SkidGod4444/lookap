import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "MCP server",
  description: "Connect Claude Code, Codex, Cursor, VS Code or Gemini CLI to the lookap registry in one command. Search designs, read measured recipes and design notes, check media, all over MCP.",
  alternates: { canonical: "/mcp" },
};

import Link from "next/link";
import { badge, button } from "@/components/button";
import { NOTES, RECIPES, TOOLS } from "@/lib/registry";
import { ConnectPanel } from "@/components/ConnectPanel";


export default function McpPage() {
  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-10 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-balance text-foreground">Connect your agent</h1>
        <p className="max-w-[62ch] text-[14px] leading-[1.55] text-subtle">One command or one config block, and your agent can search the registry, read measured recipes and design notes while it builds. Nothing runs on our side except the lookup.</p>
      </header>

      <ConnectPanel url={`${SITE_URL}/api/mcp`} />

      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">Tools</h2>
        <p className="text-[14px] leading-[1.55] text-subtle">{TOOLS.length} tools and two workflows your agent can run: rebuild an entry (look, brief, build, check, fix) or remix two or three into something new.</p>
        <ul className="divide-y divide-line rounded-xl bg-card ring-1 ring-line">
          {TOOLS.map(([name, title, what, tier]) => (
            <li key={name} className="grid gap-1 p-4 sm:grid-cols-[180px_1fr_auto] sm:items-baseline sm:gap-4">
              <span className="text-[13px] font-medium text-foreground">{title}</span>
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
        <p className="min-w-[24ch] flex-1 text-[14px] text-subtle">A Pro key opens the whole registry, recipes and checks. A Max key adds the finished rebuilds and the highest daily allowance.</p>
        <Link href="/pricing" className={button("outline", "h-9 rounded-lg px-4 text-[13px]")}>See pricing</Link>
        <Link href="/feed" className="text-[13px] font-medium text-subtle transition-colors hover:text-foreground">Browse first</Link>
      </section>
    </div>
  );
}
