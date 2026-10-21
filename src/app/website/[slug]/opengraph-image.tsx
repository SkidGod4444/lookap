import { ogCard, OG_SIZE } from "@/lib/og";
import { bySlug } from "@/lib/data";

export const alt = "A design on lookap";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = bySlug(slug);
  return ogCard({
    kicker: e ? `${e.category} · ${e.types.join(", ")}` : "Design registry",
    title: e?.title ?? "lookap",
    line: e?.description ?? "Real interfaces, measured down to the pixel, served to coding agents over MCP.",
  });
}
