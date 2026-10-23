/* One place for the facts every crawler, card and sitemap needs. Override the origin with NEXT_PUBLIC_SITE_URL in preview. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://lookap.saidev.codes").replace(/\/$/, "");
export const SITE_NAME = "lookap";
export const TAGLINE = "Give your coding agent good taste in UI.";
export const DESCRIPTION =
  "UI design references your coding agent can rebuild: real interfaces measured from each designer's clip, with a checklist to check its work. HTML or React, Tailwind and Motion, over MCP.";
/* lookap has no X account of its own yet; the founder's profile, behind a redirect we control. */
export const X_URL = "https://ref.saidev.codes/x";
export const GITHUB_URL = "https://ref.saidev.codes/github";
