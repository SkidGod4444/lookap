import { auth } from "@clerk/nextjs/server";
import { createKey, listKeys, revokeKey, unkeyReady } from "@/lib/unkey";
import type { Plan } from "@/lib/keys";

/* A signed-in user's MCP keys: list, mint, revoke. The owner is the Clerk user id, so keys never cross accounts.
   Billing is not wired yet: minting on any plan is open to every signed-in user. Gate POST on a paid subscription before launch. */

const PLANS = new Set(["starter", "pro", "team"]);
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
  return guarded(async () => json({ keys: await listKeys(userId) }));
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return json({ error: "Sign in first." }, 401);
  if (!unkeyReady) return json({ error: "Key service is not configured." }, 503);
  const body = (await req.json().catch(() => ({}))) as { plan?: string; name?: string };
  const plan = body.plan ?? "starter";
  if (!PLANS.has(plan)) return json({ error: "Unknown plan." }, 400);
  return guarded(async () => {
    const existing = await listKeys(userId);
    if (existing.length >= 5) return json({ error: "Five keys is the limit. Revoke one first." }, 400);
    const made = await createKey(userId, plan as Exclude<Plan, "none">, String(body.name ?? "").trim());
    return json({ keyId: made.keyId, key: made.key, plan });
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
