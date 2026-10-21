import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for using lookap, its registry and its MCP keys.",
  alternates: { canonical: "/terms" },
};

const TERMS: [string, string][] = [
  ["Browsing", "The site is free to browse. Every entry credits its designer and links to where they posted it; lookap does not claim their work."],
  ["Keys", "A key is for one person and one account. Keys are issued on a plan, counted per account, and may be switched off when the plan ends."],
  ["What a key is for", "A key lets your coding agent build from the registry: search it, read records and briefs, look at frames, pull measured recipes and drafts, check a rebuild, and on the Max plan fetch a finished rebuild. That is the licence: build with it inside your own products."],
  ["What a key is not for", "Walking the registry to copy it, reselling or republishing recipes, drafts, keyframes or rebuilds as design assets, or feeding them to a competing catalogue. Daily allowances and a limit on distinct entries per day exist for this reason; an account that goes past them is paused until the next day, and one that keeps trying may be closed."],
  ["Marks", "Recipes, drafts and finished rebuilds carry a mark that names the account they were issued to. If a copy turns up elsewhere, the mark says where it came from."],
  ["Rebuilds", "A finished rebuild is lookap's own work, made by measuring a designer's clip. It is licensed, not sold: use it in your products, keep the designer's credit in it, do not redistribute it as a standalone asset."],
  ["Billing", "Plans are billed monthly or yearly through Polar and can be cancelled from your account at any time. Access runs to the end of the paid period."],
  ["Changes", "These terms may change as the product does. The date below is the last change."],
];

export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-foreground">Terms</h1>
        <p className="max-w-[60ch] text-[14px] leading-[1.55] text-subtle">Short, because the product is simple: {SITE_NAME} is a registry your agent reads through a key.</p>
      </header>
      <dl className="flex flex-col divide-y divide-line rounded-xl bg-card ring-1 ring-line">
        {TERMS.map(([k, v]) => (
          <div key={k} className="grid gap-1 p-4 sm:grid-cols-[180px_1fr] sm:gap-4">
            <dt className="text-[13px] font-medium text-foreground">{k}</dt>
            <dd className="max-w-[64ch] text-[13px] leading-[1.55] text-subtle">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[12px] text-subtle">Last changed 21 October 2026.</p>
    </div>
  );
}
