import { byKind } from "@/lib/data";
import { FeedGrid } from "@/components/FeedGrid";
export default function Page() {
  return <FeedGrid entries={byKind("feed")} title="Best of X" blurb="UI shots and interactions posted by designers on X." />;
}
