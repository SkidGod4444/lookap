import { auth } from "@clerk/nextjs/server";
import { entitlementFor } from "@/lib/polar";
import { METER_LABEL, usageFor } from "@/lib/usage";

/* The signed-in account's counters, straight from Upstash: today's calls and entries, the month's meters. The same
   keys the MCP endpoint increments, so the account page can poll this and show a call land as it happens. Light on
   purpose: no key listing, no Clerk profile, one Redis read. Never cached. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });
  const entitlement = await entitlementFor(userId);
  if (entitlement.plan === "none") return Response.json({ usage: null }, { headers: { "cache-control": "no-store" } });
  const u = await usageFor(`user:${userId}`, entitlement.plan);
  const usage = { today: u.today, entries: u.entries, month: Object.entries(u.month).map(([tool, m]) => ({ label: METER_LABEL[tool] ?? tool, ...m })) };
  return Response.json({ usage, at: new Date().toISOString() }, { headers: { "cache-control": "no-store" } });
}
