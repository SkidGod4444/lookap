import { ogHero, OG_SIZE_2X } from "@/lib/og";
import { TAGLINE } from "@/lib/site";

export const alt = "lookap. Give your agent an eye for design.";
export const size = OG_SIZE_2X;
export const contentType = "image/png";

export default function Image() {
  return ogHero({ line: TAGLINE.toLowerCase() });
}
