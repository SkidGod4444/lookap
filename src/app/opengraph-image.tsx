import { ogHero, OG_SIZE } from "@/lib/og";
import { TAGLINE } from "@/lib/site";

export const alt = "lookap. Give your agent an eye for design.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogHero({ line: TAGLINE.toLowerCase() });
}
