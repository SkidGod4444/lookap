import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { entitlementFromPolar, isInterval, isPaidPlan, polar, polarReady, productFor, rememberEntitlement } from "@/lib/polar";
import { setUserKeys } from "@/lib/unkey";

/* POST /api/upgrade { plan, interval }: move the signed-in account's one subscription up to a higher plan. Polar allows
   one subscription per customer, so a second checkout would fail; this changes the product on the existing one and
   Polar charges the prorated difference. An upgrade during the Starter trial ends the trial, so it is never free Pro.
   The webhook confirms the change; the keys move at once here so the agent sees the new plan on its next call. */
const RANK: Record<string, number> = { none: 0, starter: 1, pro: 2, team: 3 };

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!polarReady) return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { plan?: string; interval?: string };
  const plan = body.plan ?? "", interval = body.interval ?? "month";
  if (!isPaidPlan(plan) || !isInterval(interval)) return NextResponse.json({ error: "Unknown plan or interval." }, { status: 400 });
  let ent;
  try { ent = await entitlementFromPolar(userId, { strict: true }); } catch { return NextResponse.json({ error: "Billing could not be reached. Try again in a moment." }, { status: 502 }); }
  if (!ent.subscriptionId || ent.plan === "none") return NextResponse.json({ error: "No plan to upgrade yet.", checkout: true }, { status: 409 });
  if ((RANK[ent.plan] ?? 0) >= RANK[plan]) return NextResponse.json({ error: "Your plan already includes this." }, { status: 409 });
  const product = productFor(plan, interval);
  if (!product) return NextResponse.json({ error: `No product configured for ${plan} ${interval}.` }, { status: 503 });
  try {
    await polar().subscriptions.update(ent.subscriptionId, { product_id: product, proration_behavior: "prorate" });
    if (ent.status === "trialing") await polar().subscriptions.update(ent.subscriptionId, { trial_end: "now" } as never);
  } catch (e) {
    console.error("[polar] upgrade failed", (e instanceof Error ? e.message : String(e)).slice(0, 300));
    return NextResponse.json({ error: "The upgrade could not be made. Try again, or change plans from your account page." }, { status: 502 });
  }
  await Promise.all([
    setUserKeys(userId, { enabled: true, plan }).catch((e) => console.error("[unkey] upgrade sync failed", e)),
    rememberEntitlement(userId, { ...ent, plan, interval, status: "active" }).catch(() => {}),
  ]);
  return NextResponse.json({ ok: true, plan });
}
