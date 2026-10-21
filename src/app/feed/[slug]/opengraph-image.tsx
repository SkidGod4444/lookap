import { ogEntry, ogHero, OG_SIZE_2X } from "@/lib/og";
import { bySlug } from "@/lib/data";
import { TAGLINE } from "@/lib/site";

export const alt = "A design on lookap";
export const size = OG_SIZE_2X;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = bySlug(slug);
  return e ? ogEntry(e) : ogHero({ line: TAGLINE.toLowerCase() });
}
