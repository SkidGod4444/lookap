import { byKind } from "@/lib/data";
import { FeedGrid } from "@/components/FeedGrid";
export default function Page() {
  return <FeedGrid entries={byKind("website")} title="Website Inspiration" blurb="Full pages from the best builders on the internet." />;
}
