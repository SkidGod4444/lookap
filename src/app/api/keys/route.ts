import { auth, currentUser } from "@clerk/nextjs/server";
import { setUser } from "@/lib/db";
import { createKey, listKeys, revokeKey, unkeyReady } from "@/lib/unkey";
import { entitlementFor } from "@/lib/polar";

/* A signed-in user's MCP keys: list, mint, revoke. The owner is the Clerk user id, so keys never cross accounts.
   Minting needs an active Polar subscription; the key is always on the plan being paid for. */
const json = (v: unknown, status = 200) => Response.json(v, { status });

/* Unkey failures come back as JSON the page can show, never as an empty 500. A 404 from Unkey usually means the root key
   lacks a permission for this keyspace, which Unkey reports as "not found" on purpose. */
async function guarded(fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const perm = /not found|insufficient/i.test(msg);
    return json({ error: perm ? "The key service refused: the Unkey root key is missing a permission for this keyspace." : `Key service error: ${msg.slice(0, 160)}` }, 502);
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return json({ error: "Sign in first." }, 401);
  if (!unkeyReady) return json({ error: "Key service is not configured." }, 503);
  return guarded(async () => {
    const [keys, entitlement, user] = await Promise.all([listKeys(userId), entitlementFor(userId), currentUser()]);
    await setUser(userId, { email: user?.primaryEmailAddress?.emailAddress, name: user?.fullName ?? undefined, keyCount: keys.length });
    return json({ keys, entitlement });
  });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return json({ error: "Sign in first." }, 401);
  if (!unkeyReady) return json({ error: "Key service is not configured." }, 503);
  const body = (await req.json().catch(() => ({}))) as { name?: string };
  return guarded(async () => {
    const entitlement = await entitlementFor(userId);
    if (entitlement.plan === "none") return json({ error: "No active plan. Pick one on the pricing page first.", checkout: "/pricing" }, 402);
    const existing = await listKeys(userId);
    if (existing.length >= 5) return json({ error: "Five keys is the limit. Revoke one first." }, 400);
    const made = await createKey(userId, entitlement.plan, String(body.name ?? "").trim());
    await setUser(userId, { keyCount: existing.length + 1 });
    return json({ keyId: made.keyId, key: made.key, plan: entitlement.plan });
  });
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return json({ error: "Sign in first." }, 401);
  if (!unkeyReady) return json({ error: "Key service is not configured." }, 503);
  const body = (await req.json().catch(() => ({}))) as { keyId?: string };
  if (!body.keyId) return json({ error: "keyId required." }, 400);
  return guarded(async () => {
    try {
      await revokeKey(userId, body.keyId!);
    } catch (e) {
      if (e instanceof Error && e.message === "not your key") return json({ error: "Not your key." }, 403);
      throw e;
    }
    return json({ ok: true });
  });
}
