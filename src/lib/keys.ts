import "server-only";

/* API keys for the MCP endpoint. For now keys live in the LOOKAP_API_KEYS env var as a comma-separated list of
   `key:plan` pairs, e.g. "lk_live_abc:pro,lk_live_def:team". Billing through Polar replaces this with a lookup. */

export type Plan = "none" | "starter" | "pro" | "team";

export function planForKey(key: string | null): Plan {
  if (!key) return "none";
  const list = (process.env.LOOKAP_API_KEYS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  for (const pair of list) {
    const [k, plan] = pair.split(":");
    if (k === key) return plan === "team" ? "team" : plan === "pro" ? "pro" : "starter";
  }
  return "none";
}

export function keyFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization") ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return req.headers.get("x-lookap-key");
}

/* No key, no registry. Starter ($1) opens search and notes; Pro adds recipes and media checks; Team adds seats. */
export const LIMITS: Record<Plan, { search: number; recipes: boolean; notes: number; media: boolean }> = {
  none: { search: 0, recipes: false, notes: 0, media: false },
  starter: { search: 20, recipes: false, notes: 100, media: false },
  pro: { search: 50, recipes: true, notes: 100, media: true },
  team: { search: 100, recipes: true, notes: 100, media: true },
};
