import "server-only";
import { Unkey } from "@unkey/api";
import { createHash } from "node:crypto";
import type { Plan } from "./keys";
import { dbReady, kv } from "./db";

/* lookap keys live in one Unkey keyspace. The plan rides on the key's meta; the owner is the Clerk user id as the identity's externalId.
   Every call needs UNKEY_ROOT_KEY and UNKEY_API_ID. Without them, verification says "no key" and minting fails loudly. */

const ROOT = process.env.UNKEY_ROOT_KEY;
const API_ID = process.env.UNKEY_API_ID;
export const unkeyReady = Boolean(ROOT && API_ID);

let client: Unkey | null = null;
function unkey() {
  if (!ROOT || !API_ID) throw new Error("Unkey is not configured: set UNKEY_ROOT_KEY and UNKEY_API_ID");
  client ??= new Unkey({ rootKey: ROOT });
  return client;
}

/* One flat brake on every key, whatever the plan: 30 requests a minute, enforced by Unkey at verification. It is not a
   tier, only protection against a looping agent; the plan's ceiling is the daily allowance counted in Redis (usage.ts). */
const BRAKE = [{ name: "requests", limit: 60, duration: 60_000, autoApply: true }];
const PLANS = new Set<Plan>(["starter", "pro", "team"]);

export type Verified =
  | { plan: Exclude<Plan, "none">; keyId: string; userId?: string; subscription?: Record<string, unknown>; stale?: boolean }
  | { plan: "none"; code: string };

/* The last good answer for a key, kept a day so an Unkey outage does not lock paying users out. Keyed by a hash of the
   key, never the key. An explicit "invalid" from Unkey clears it, so revocation still lands at once. */
const CACHE_TTL_S = 24 * 60 * 60;
const cacheKey = (key: string) => `vk:${createHash("sha256").update(key).digest("hex").slice(0, 32)}`;
type Good = { plan: Exclude<Plan, "none">; keyId: string; userId?: string; at: number };

/* One call per MCP request: validity, plan, rate limit. Unkey saying no reads as no key, with its code kept for the
   message; Unkey being unreachable falls back to the last good answer, marked stale. */
export async function verifyKey(key: string): Promise<Verified> {
  if (!unkeyReady) return { plan: "none", code: "NOT_CONFIGURED" };
  try {
    const { data } = await unkey().keys.verifyKey({ key });
    if (!data.valid) {
      if (dbReady && data.code !== "RATE_LIMITED") kv().del(cacheKey(key)).catch(() => {});
      return { plan: "none", code: data.code };
    }
    const plan = (data.meta as { plan?: string } | undefined)?.plan;
    if (!plan || !PLANS.has(plan as Plan) || plan === "none") return { plan: "none", code: "NO_PLAN" };
    const good: Good = { plan: plan as Exclude<Plan, "none">, keyId: data.keyId ?? "", userId: data.identity?.externalId, at: Date.now() };
    if (dbReady) kv().set(cacheKey(key), good, { ex: CACHE_TTL_S }).catch(() => {});
    return { ...good, subscription: data.identity?.meta as Record<string, unknown> | undefined };
  } catch {
    if (dbReady) {
      try {
        const last = await kv().get<Good>(cacheKey(key));
        if (last) return { plan: last.plan, keyId: last.keyId, userId: last.userId, stale: true };
      } catch {}
    }
    return { plan: "none", code: "UNKEY_ERROR" };
  }
}

export type KeyRow = { keyId: string; start: string; name?: string; plan: string; createdAt: number; enabled: boolean };

const row = (k: { keyId: string; start: string; name?: string; meta?: unknown; createdAt: number; enabled: boolean }): KeyRow => ({
  keyId: k.keyId,
  start: k.start,
  name: k.name,
  plan: String((k.meta as { plan?: string } | undefined)?.plan ?? "starter"),
  createdAt: k.createdAt,
  enabled: k.enabled,
});

/* The keys one user owns. */
export async function listKeys(userId: string): Promise<KeyRow[]> {
  const page = await unkey().apis.listKeys({ apiId: API_ID!, externalId: userId, limit: 100, revalidateKeysCache: true });
  return page.result.data.map(row).sort((a, b) => b.createdAt - a.createdAt);
}

/* Mint a key for a user on a plan. The plaintext comes back once; the caller shows it once. */
export async function createKey(userId: string, plan: Exclude<Plan, "none">, name: string) {
  const { data } = await unkey().keys.createKey({
    apiId: API_ID!,
    prefix: "lookap",
    byteLength: 24,
    name: name.slice(0, 60) || `${plan} key`,
    externalId: userId,
    meta: { plan },
    ratelimits: BRAKE,
  });
  return { keyId: data.keyId, key: data.key };
}

/* Billing changes reach every key a user owns: switch them on or off, and move them to the plan they now pay for. */
export async function setUserKeys(userId: string, patch: { enabled?: boolean; plan?: Exclude<Plan, "none"> }) {
  const mine = await listKeys(userId);
  await Promise.all(
    mine.map((k) =>
      unkey().keys.updateKey({
        keyId: k.keyId,
        ...(patch.enabled === undefined ? {} : { enabled: patch.enabled }),
        ...(patch.plan ? { meta: { plan: patch.plan }, ratelimits: BRAKE } : {}),
      }),
    ),
  );
  return mine.length;
}

/* The user's subscription, as Polar told us, stored on their Unkey identity. It comes back on every keys.verifyKey,
   so the MCP endpoint knows the plan, the renewal date and the customer without another lookup. */
export async function setIdentitySubscription(userId: string, sub: { plan: string; status?: string; subscriptionId?: string; renewsAt?: string; polarCustomerId?: string }) {
  try {
    await unkey().identities.updateIdentity({ identity: userId, meta: { ...sub, syncedAt: new Date().toISOString() } });
  } catch (e) {
    /* No identity yet (no keys minted): create it carrying the same details. */
    if (e instanceof Error && /not found/i.test(e.message)) {
      await unkey().identities.createIdentity({ externalId: userId, meta: { ...sub, syncedAt: new Date().toISOString() } });
      return;
    }
    throw e;
  }
}

/* Delete a key, but only one the user owns. */
export async function revokeKey(userId: string, keyId: string) {
  const mine = await listKeys(userId);
  if (!mine.some((k) => k.keyId === keyId)) throw new Error("not your key");
  await unkey().keys.deleteKey({ keyId });
}
