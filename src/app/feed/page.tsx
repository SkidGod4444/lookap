import { ENTRIES } from "@/lib/data";
import { FeedGrid } from "@/components/FeedGrid";

export default function Page() {
  return <FeedGrid entries={ENTRIES} title="Interfaces worth rebuilding" blurb="Hand-picked clips and stills. Every entry is in the registry your agent can call." />;
}
