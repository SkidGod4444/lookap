import { byKind } from "@/lib/data";
import { FeedGrid } from "@/components/FeedGrid";
export default function Page() {
  return <FeedGrid entries={byKind("launch")} title="Launch Video Inspiration" blurb="Product launch and announcement films, cloneable frame by frame." />;
}
