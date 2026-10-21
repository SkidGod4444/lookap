/* One place for the facts every crawler, card and sitemap needs. Override the origin with NEXT_PUBLIC_SITE_URL in preview. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://lookap.saidev.codes").replace(/\/$/, "");
export const SITE_NAME = "lookap";
export const TAGLINE = "Give your agent an eye for design.";
export const DESCRIPTION =
  "lookap is a design registry for coding agents. Real interfaces measured down to the pixel, served to Claude Code, Codex and Cursor over MCP. Keys from a dollar a month.";
export const X_HANDLE = "@lookap";
