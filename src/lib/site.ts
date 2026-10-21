/* One place for the facts every crawler, card and sitemap needs. Override the origin with NEXT_PUBLIC_SITE_URL in preview. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://lookap.saidev.codes").replace(/\/$/, "");
export const SITE_NAME = "lookap";
export const TAGLINE = "Give your coding agent good taste in UI.";
export const DESCRIPTION =
  "lookap is a design registry for coding agents. Hundreds of real interfaces, measured recipes and design notes, one MCP call away from Claude Code, Codex, Cursor, VS Code and Gemini CLI. Keys from a dollar a month.";
/* lookap has no X account of its own yet; the founder's profile, behind a redirect we control. */
export const X_URL = "https://ref.saidev.codes/x";
export const GITHUB_URL = "https://ref.saidev.codes/github";
