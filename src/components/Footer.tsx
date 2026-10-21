"use client";

import Link from "next/link";
import { useIsProject } from "./useIsProject";
import { Mark } from "./Mark";
import { ENTRIES, SECTIONS, sectionSlug, bySection } from "@/lib/data";
import { NOTES, RECIPES, TOOLS } from "@/lib/registry";
import { GITHUB_URL, X_URL } from "@/lib/site";

/* The footer is the registry's index card: what it holds (real counts), where to browse, how an agent connects, and the
   small print. Three link columns on wide screens, two on phones. The top rule is scored like the ruler scrollbar. */
const BROWSE = [["Feed", "/feed"], ["Websites", "/websites"], ["Launch videos", "/launch-videos"], ["OG images", "/og-images"]] as const;
const AGENT = [["Connect over MCP", "/mcp"], ["Pricing", "/pricing"], ["Your keys", "/account"]] as const;
const SMALL = [["Privacy", "/privacy"], ["Terms", "/terms"]] as const;

export function Footer() {
  const isProject = useIsProject();
  if (isProject) return null;
  const sections = SECTIONS.filter((s) => bySection(sectionSlug(s)).length > 0).slice(0, 6);
  const entries = ENTRIES.filter((e) => !e.sponsored).length;
  const designers = new Set(ENTRIES.map((e) => e.authorName)).size;
  return (
    <footer className="mt-16 pb-2 text-[13px]">
      {/* scored rule: a tick every 4 px, a long one every 20, same as the ruler */}
      <div aria-hidden className="h-[7px] w-full bg-[repeating-linear-gradient(to_right,transparent_0_19px,rgba(255,255,255,0.22)_19px_20px),repeating-linear-gradient(to_right,transparent_0_3px,rgba(255,255,255,0.1)_3px_4px)] [background-size:100%_7px,100%_4px] [background-position:left_top,left_top] [background-repeat:no-repeat] border-t border-line" />

      <div className="grid gap-10 pt-8 sm:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        {/* what this is */}
        <div className="flex max-w-[34ch] flex-col gap-4">
          <Link href="/" className="group/brand flex items-center gap-2 font-semibold tracking-[-0.02em] text-foreground"><Mark size={26} />lookap</Link>
          <p className="leading-[1.55] text-subtle">A design registry for coding agents. Real interfaces, measured recipes and design notes, one MCP call away.</p>
          <p className="leading-[1.55] text-subtle">
            Built with <span aria-label="a black heart" role="img" className="inline-block translate-y-[1px]">🖤</span> by <a href={X_URL} className="text-silver hover:text-foreground">Saidev Dhal</a>.
          </p>
          <dl className="flex flex-wrap gap-x-6 gap-y-1.5 font-mono text-[12px] text-subtle">
            <div className="flex gap-2"><dt className="text-silver-bright">{entries}</dt><dd>entries</dd></div>
            <div className="flex gap-2"><dt className="text-silver-bright">{designers}</dt><dd>designers</dd></div>
            <div className="flex gap-2"><dt className="text-silver-bright">{RECIPES.length}</dt><dd>measured recipes</dd></div>
            <div className="flex gap-2"><dt className="text-silver-bright">{NOTES.length}</dt><dd>design notes</dd></div>
            <div className="flex gap-2"><dt className="text-silver-bright">{TOOLS.length}</dt><dd>MCP tools</dd></div>
          </dl>
        </div>

        <nav aria-label="Browse" className="flex flex-col gap-2.5">
          <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">Browse</h2>
          {BROWSE.map(([l, h]) => <Link key={h} href={h} className="w-fit text-silver hover:text-foreground">{l}</Link>)}
          <h2 className="mt-2 text-[11px] font-medium tracking-[.06em] text-subtle uppercase">Sections</h2>
          {sections.map((s) => <Link key={s} href={`/sections/${sectionSlug(s)}`} className="w-fit text-silver hover:text-foreground">{s}</Link>)}
        </nav>

        <nav aria-label="Agent" className="flex flex-col gap-2.5">
          <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">Your agent</h2>
          {AGENT.map(([l, h]) => <Link key={h} href={h} className="w-fit text-silver hover:text-foreground">{l}</Link>)}
          <p className="mt-2 leading-[1.5] text-subtle">Works in Claude Code, Codex, Cursor, VS Code and Gemini CLI.</p>
        </nav>

        <nav aria-label="Elsewhere" className="flex flex-col gap-2.5">
          <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">Elsewhere</h2>
          <a href={X_URL} className="w-fit text-silver hover:text-foreground">Follow on X</a>
          <a href={GITHUB_URL} className="w-fit text-silver hover:text-foreground">GitHub</a>
          <h2 className="mt-2 text-[11px] font-medium tracking-[.06em] text-subtle uppercase">Small print</h2>
          {SMALL.map(([l, h]) => <Link key={h} href={h} className="w-fit text-silver hover:text-foreground">{l}</Link>)}
        </nav>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-[12px] text-subtle">
        <p>© {new Date().getFullYear()} lookap. Every entry is credited to its designer and links to the source post.</p>
        <p className="font-mono">Browsing is free. Keys from $1 a month.</p>
      </div>
    </footer>
  );
}
