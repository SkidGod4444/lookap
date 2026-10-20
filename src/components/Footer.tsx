"use client";

import Link from "next/link";
import { useIsProject } from "./useIsProject";
import { Mark } from "./Mark";

const LINKS = [["Privacy", "/privacy"], ["Terms", "/terms"]];

export function Footer() {
  if (useIsProject()) return null;
  return (
    <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 pb-2 text-[13px]">
      <Link href="/" className="group/brand flex items-center gap-2 font-semibold tracking-[-0.02em] text-foreground"><Mark size={26} />lookap</Link>
      <nav className="flex flex-wrap items-center gap-4 text-subtle">
        <a href="https://github.com/SkidGod4444/lookap" className="hover:text-foreground">GitHub</a>
        {LINKS.map(([l, h]) => <Link key={h} href={h} className="hover:text-foreground">{l}</Link>)}
      </nav>
    </footer>
  );
}
