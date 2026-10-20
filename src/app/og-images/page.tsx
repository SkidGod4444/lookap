import { byKind } from "@/lib/data";
import { FeedGrid } from "@/components/FeedGrid";
export default function Page() {
  return <FeedGrid entries={byKind("og")} title="OG Image Inspiration" blurb="Open Graph share images and social cards from the best sites." />;
}
