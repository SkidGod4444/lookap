import { ENTRIES } from "@/lib/data";
import { FeedGrid } from "@/components/FeedGrid";

export default function Home() {
  return (
    <FeedGrid
      entries={ENTRIES}
      title="Interfaces worth rebuilding"
      blurb="Hand-picked websites, sections, launch films and UI clips. Pick one and clone it from the video."
    />
  );
}
