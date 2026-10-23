import "server-only";

/* API keys for the MCP endpoint. Real keys are minted and verified by Unkey (see unkey.ts); the plan rides on the key.
   LOOKAP_API_KEYS stays as a local-dev fallback: a comma-separated list of `key:plan` pairs, e.g. "lk_test_pro:pro". */

export type Plan = "none" | "starter" | "pro" | "team";
export { PLAN_NAME } from "./plan-names";

/* Dev fallback only: keys listed in the env var. */
export function planFromEnv(key: string): Plan | null {
  const list = (process.env.LOOKAP_API_KEYS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  for (const pair of list) {
    const [k, plan] = pair.split(":");
    if (k === key) return plan === "team" ? "team" : plan === "pro" ? "pro" : "starter";
  }
  return null;
}

/* keyRef: what usage is counted against, the owning account when the key has one */
export type Resolved = { plan: Plan; reason?: string; subscription?: Record<string, unknown>; keyRef?: string; stale?: boolean };

/* The plan behind a request: env list first (dev), then Unkey. No key, or a key Unkey rejects, is "none" with the reason kept. */
export async function resolvePlan(req: Request, opts: { count?: boolean } = {}): Promise<Resolved> {
  const key = keyFromRequest(req);
  if (!key) return { plan: "none", reason: "missing" };
  const env = planFromEnv(key);
  if (env) return { plan: env, keyRef: `env:${key.slice(-8)}` };
  const { verifyKey } = await import("./unkey");
  const v = await verifyKey(key, opts);
  /* quotas count against the account, so every key a user mints shares one counter; env keys have no account */
  return v.plan === "none" ? { plan: "none", reason: v.code } : { plan: v.plan, subscription: v.subscription, keyRef: v.userId ? `user:${v.userId}` : v.keyId, stale: v.stale };
}

export function keyFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization") ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return req.headers.get("x-lookap-key");
}

/* No key, no registry. Each plan is a better rebuild, not only more calls:
   Starter ($1) builds from sight: search, the brief with the entry's checklist, the notes, and the frames themselves.
   Pro ($12) builds from measurement and proves it: every read of the clip, recipes, the pixel and motion check, the judge.
   Max ($39) starts from the finished rebuild, asks for the ones that are missing, and has the highest allowance. */
export const LIMITS: Record<Plan, { search: number; recipes: boolean; notes: number; frames: boolean; media: boolean; source: boolean }> = {
  none: { search: 0, recipes: false, notes: 0, frames: false, media: false, source: false },
  starter: { search: 20, recipes: false, notes: 100, frames: true, media: false, source: false },
  pro: { search: 50, recipes: true, notes: 100, frames: true, media: true, source: false },
  team: { search: 100, recipes: true, notes: 100, frames: true, media: true, source: true },
};
