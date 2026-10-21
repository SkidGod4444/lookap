import "server-only";

/* API keys for the MCP endpoint. Real keys are minted and verified by Unkey (see unkey.ts); the plan rides on the key.
   LOOKAP_API_KEYS stays as a local-dev fallback: a comma-separated list of `key:plan` pairs, e.g. "lk_test_pro:pro". */

export type Plan = "none" | "starter" | "pro" | "team";

/* Dev fallback only: keys listed in the env var. */
export function planFromEnv(key: string): Plan | null {
  const list = (process.env.LOOKAP_API_KEYS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  for (const pair of list) {
    const [k, plan] = pair.split(":");
    if (k === key) return plan === "team" ? "team" : plan === "pro" ? "pro" : "starter";
  }
  return null;
}

export type Resolved = { plan: Plan; reason?: string; subscription?: Record<string, unknown>; keyRef?: string; stale?: boolean };

/* The plan behind a request: env list first (dev), then Unkey. No key, or a key Unkey rejects, is "none" with the reason kept. */
export async function resolvePlan(req: Request): Promise<Resolved> {
  const key = keyFromRequest(req);
  if (!key) return { plan: "none", reason: "missing" };
  const env = planFromEnv(key);
  if (env) return { plan: env, keyRef: `env:${key.slice(-8)}` };
  const { verifyKey } = await import("./unkey");
  const v = await verifyKey(key);
  return v.plan === "none" ? { plan: "none", reason: v.code } : { plan: v.plan, subscription: v.subscription, keyRef: v.keyId, stale: v.stale };
}

export function keyFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization") ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return req.headers.get("x-lookap-key");
}

/* No key, no registry. Starter ($1) opens search and notes; Pro adds recipes, keyframes and checks; Team adds seats and the finished source. */
export const LIMITS: Record<Plan, { search: number; recipes: boolean; notes: number; media: boolean; source: boolean }> = {
  none: { search: 0, recipes: false, notes: 0, media: false, source: false },
  starter: { search: 20, recipes: false, notes: 100, media: false, source: false },
  pro: { search: 50, recipes: true, notes: 100, media: true, source: false },
  team: { search: 100, recipes: true, notes: 100, media: true, source: true },
};
