import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OG images",
  description: "Open Graph cards worth borrowing from, listed in the lookap registry.",
  alternates: { canonical: "/og-images" },
};

import { byKind } from "@/lib/data";
import { FeedGrid } from "@/components/FeedGrid";
export default function Page() {
  return <FeedGrid entries={byKind("og")} title="OG Image Inspiration" blurb="Open Graph share images and social cards from the best sites." />;
}
