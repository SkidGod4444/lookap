import { ogHero, OG_SIZE_2X } from "@/lib/og";
import { TAGLINE } from "@/lib/site";

export const alt = "lookap. Give your coding agent good taste in UI.";
export const size = OG_SIZE_2X;
export const contentType = "image/png";

export default function Image() {
  return ogHero({ line: TAGLINE.toLowerCase() });
}
