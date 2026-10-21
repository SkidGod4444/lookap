import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Websites",
  description: "Full sites worth rebuilding, measured and listed in the lookap registry.",
  alternates: { canonical: "/websites" },
};

import { byKind } from "@/lib/data";
import { FeedGrid } from "@/components/FeedGrid";
export default function Page() {
  return <FeedGrid entries={byKind("website")} title="Website Inspiration" blurb="Full pages from the best builders on the internet." />;
}
