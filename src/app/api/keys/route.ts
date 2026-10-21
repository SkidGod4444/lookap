import { auth } from "@clerk/nextjs/server";
import { createKey, listKeys, revokeKey, unkeyReady } from "@/lib/unkey";
import type { Plan } from "@/lib/keys";

/* A signed-in user's MCP keys: list, mint, revoke. The owner is the Clerk user id, so keys never cross accounts.
   Billing is not wired yet: minting on any plan is open to every signed-in user. Gate POST on a paid subscription before launch. */

const PLANS = new Set(["starter", "pro", "team"]);
const json = (v: unknown, status = 200) => Response.json(v, { status });

export async function GET() {
  const { userId } = await auth();
  if (!userId) return json({ error: "Sign in first." }, 401);
  if (!unkeyReady) return json({ error: "Key service is not configured." }, 503);
  return json({ keys: await listKeys(userId) });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return json({ error: "Sign in first." }, 401);
  if (!unkeyReady) return json({ error: "Key service is not configured." }, 503);
  const body = (await req.json().catch(() => ({}))) as { plan?: string; name?: string };
  const plan = body.plan ?? "starter";
  if (!PLANS.has(plan)) return json({ error: "Unknown plan." }, 400);
  const existing = await listKeys(userId);
  if (existing.length >= 5) return json({ error: "Five keys is the limit. Revoke one first." }, 400);
  const made = await createKey(userId, plan as Exclude<Plan, "none">, String(body.name ?? "").trim());
  return json({ keyId: made.keyId, key: made.key, plan });
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return json({ error: "Sign in first." }, 401);
  if (!unkeyReady) return json({ error: "Key service is not configured." }, 503);
  const body = (await req.json().catch(() => ({}))) as { keyId?: string };
  if (!body.keyId) return json({ error: "keyId required." }, 400);
  try {
    await revokeKey(userId, body.keyId);
  } catch {
    return json({ error: "Not your key." }, 403);
  }
  return json({ ok: true });
}
