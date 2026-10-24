import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed",
  description: "Hand-picked interface clips and stills. Every entry is measured and sits in the registry your coding agent can call over MCP.",
  alternates: { canonical: "/feed" },
};

import { ENTRIES, bySlug } from "@/lib/data";
import { FeedGrid } from "@/components/FeedGrid";
import { shuffledSlugs } from "@/lib/shuffle";

/* shuffled every few minutes; FeedGrid then puts the rebuilt entries first, keeping this order within each group */
export default async function Page() {
  const order = await shuffledSlugs("feed", ENTRIES.map((e) => e.slug));
  const entries = order.map((s) => bySlug(s)!).filter(Boolean);
  return <FeedGrid entries={entries} title="Interfaces worth rebuilding" blurb="Hand-picked clips and stills. Every entry is in the registry your agent can call." />;
}
