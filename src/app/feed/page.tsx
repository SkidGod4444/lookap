import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed",
  description: "Hand-picked interface clips and stills. Every entry is measured and sits in the registry your coding agent can call over MCP.",
  alternates: { canonical: "/feed" },
};

import { ENTRIES } from "@/lib/data";
import { FeedGrid } from "@/components/FeedGrid";

export default function Page() {
  return <FeedGrid entries={ENTRIES} title="Interfaces worth rebuilding" blurb="Hand-picked clips and stills. Every entry is in the registry your agent can call." />;
}
