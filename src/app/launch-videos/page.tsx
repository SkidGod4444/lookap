import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Launch videos",
  description: "Product launch clips with interface motion worth studying, in the lookap registry.",
  alternates: { canonical: "/launch-videos" },
};

import { byKind } from "@/lib/data";
import { FeedGrid } from "@/components/FeedGrid";
export default function Page() {
  return <FeedGrid entries={byKind("launch")} title="Launch Video Inspiration" blurb="Product launch and announcement films, cloneable frame by frame." />;
}
