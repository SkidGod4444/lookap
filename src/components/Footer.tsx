import Link from "next/link";
import { Mark } from "./Mark";

const LINKS = [["Newsletter", "/newsletter"], ["Contact", "/contact"], ["Sponsor", "/sponsor"], ["Privacy", "/privacy"], ["Terms", "/terms"], ["Licence", "/licence"]];

export function Footer() {
  return (
    <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 pb-2 text-[13px]">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-[-0.02em] text-foreground"><Mark size={14} />lookap</Link>
      <nav className="flex flex-wrap items-center gap-4 text-subtle">
        <a href="https://github.com/SkidGod4444/lookap" className="hover:text-foreground">GitHub</a>
        {LINKS.map(([l, h]) => <Link key={h} href={h} className="hover:text-foreground">{l}</Link>)}
      </nav>
    </footer>
  );
}
