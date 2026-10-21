import "server-only";
import { Unkey } from "@unkey/api";
import type { Plan } from "./keys";

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

/* Requests per minute each plan may make against the MCP endpoint. Enforced by Unkey at verification. */
const RPM: Record<Exclude<Plan, "none">, number> = { starter: 60, pro: 300, team: 600 };
const PLANS = new Set<Plan>(["starter", "pro", "team"]);

export type Verified = { plan: Exclude<Plan, "none">; keyId: string } | { plan: "none"; code: string };

/* One call per MCP request: validity, plan, rate limit. Any failure reads as no key, with Unkey's code kept for the message. */
export async function verifyKey(key: string): Promise<Verified> {
  if (!unkeyReady) return { plan: "none", code: "NOT_CONFIGURED" };
  try {
    const { data } = await unkey().keys.verifyKey({ key });
    if (!data.valid) return { plan: "none", code: data.code };
    const plan = (data.meta as { plan?: string } | undefined)?.plan;
    if (!plan || !PLANS.has(plan as Plan) || plan === "none") return { plan: "none", code: "NO_PLAN" };
    return { plan: plan as Exclude<Plan, "none">, keyId: data.keyId ?? "" };
  } catch {
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
    ratelimits: [{ name: "requests", limit: RPM[plan], duration: 60_000, autoApply: true }],
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
        ...(patch.plan ? { meta: { plan: patch.plan }, ratelimits: [{ name: "requests", limit: RPM[patch.plan], duration: 60_000, autoApply: true }] } : {}),
      }),
    ),
  );
  return mine.length;
}

/* Delete a key, but only one the user owns. */
export async function revokeKey(userId: string, keyId: string) {
  const mine = await listKeys(userId);
  if (!mine.some((k) => k.keyId === keyId)) throw new Error("not your key");
  await unkey().keys.deleteKey({ keyId });
}
