import "server-only";
import { createPolar, type Environment } from "@polar-sh/sdk/2026-10";
import type { Plan } from "./keys";
import { ENTITLEMENT_TTL_MS, getUser, setUser } from "./db";

/* Billing through Polar. One subscription product per plan and interval; the Polar customer's external_id is the Clerk user id,
   so a user's entitlement is one lookup of their customer state. Needs POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_SECRET and the six product ids. */

export const POLAR_ENV: Environment = process.env.POLAR_ENVIRONMENT === "production" ? "production" : "sandbox";
const TOKEN = process.env.POLAR_ACCESS_TOKEN;
export const polarReady = Boolean(TOKEN);

export type PaidPlan = Exclude<Plan, "none">;
export type Interval = "month" | "year";

/* Product ids come from the Polar dashboard (or the MCP), one per plan and interval. */
const PRODUCTS: Record<PaidPlan, Record<Interval, string | undefined>> = {
  starter: { month: process.env.POLAR_PRODUCT_STARTER_MONTH, year: process.env.POLAR_PRODUCT_STARTER_YEAR },
  pro: { month: process.env.POLAR_PRODUCT_PRO_MONTH, year: process.env.POLAR_PRODUCT_PRO_YEAR },
  team: { month: process.env.POLAR_PRODUCT_TEAM_MONTH, year: process.env.POLAR_PRODUCT_TEAM_YEAR },
};

export const isPaidPlan = (p: string): p is PaidPlan => p === "starter" || p === "pro" || p === "team";
export const isInterval = (i: string): i is Interval => i === "month" || i === "year";

export function productFor(plan: PaidPlan, interval: Interval) {
  return PRODUCTS[plan][interval] ?? null;
}

export function planForProduct(productId: string): PaidPlan | null {
  for (const plan of ["team", "pro", "starter"] as PaidPlan[]) {
    if (PRODUCTS[plan].month === productId || PRODUCTS[plan].year === productId) return plan;
  }
  return null;
}

let client: ReturnType<typeof createPolar> | null = null;
export function polar() {
  if (!TOKEN) throw new Error("Polar is not configured: set POLAR_ACCESS_TOKEN");
  client ??= createPolar({ accessToken: TOKEN, environment: POLAR_ENV });
  return client;
}

export type Entitlement = { plan: Plan; interval?: Interval; renewsAt?: string; cancelAtPeriodEnd?: boolean; status?: string; subscriptionId?: string; polarCustomerId?: string };

/* Ask Polar for the customer's state and reduce it to one plan: the highest active subscription wins.
   An unknown customer is a 404: they have never checked out. */
export async function entitlementFromPolar(userId: string): Promise<Entitlement> {
  if (!polarReady) return { plan: "none" };
  try {
    const state = await polar().customers.getStateExternal(userId);
    const rank: Record<PaidPlan, number> = { starter: 1, pro: 2, team: 3 };
    let best: Entitlement = { plan: "none", polarCustomerId: state.id };
    for (const s of state.active_subscriptions ?? []) {
      const plan = planForProduct(s.product_id);
      if (!plan) continue;
      if (best.plan === "none" || rank[plan] > rank[best.plan as PaidPlan]) {
        best = { plan, interval: s.recurring_interval === "year" ? "year" : "month", renewsAt: s.current_period_end, cancelAtPeriodEnd: s.cancel_at_period_end, status: s.status, subscriptionId: s.id, polarCustomerId: state.id };
      }
    }
    return best;
  } catch (e) {
    /* No customer with this external id yet: they have never checked out. Quiet. */
    const msg = e instanceof Error ? `${e.name} ${e.message}` : String(e);
    if (/ResourceNotFound|\b404\b/.test(msg)) return { plan: "none" };
    console.error("[polar] entitlement lookup failed", e);
    return { plan: "none" };
  }
}

/* The plan a user is paying for right now. Redis answers first; Polar is asked when the record is missing or stale, and the
   answer is written back. LOOKAP_FREE_MINT=1 (local dev only) grants pro without a subscription. */
export async function entitlementFor(userId: string): Promise<Entitlement> {
  if (process.env.LOOKAP_FREE_MINT === "1") return { plan: "pro", status: "dev" };
  const rec = await getUser(userId);
  const fresh = rec?.entitlementCheckedAt && Date.now() - Date.parse(rec.entitlementCheckedAt) < ENTITLEMENT_TTL_MS;
  if (rec && fresh && rec.plan) {
    return { plan: (rec.plan as Plan) ?? "none", interval: rec.interval as Interval | undefined, renewsAt: rec.renewsAt, cancelAtPeriodEnd: rec.cancelAtPeriodEnd, status: rec.status, subscriptionId: rec.subscriptionId, polarCustomerId: rec.polarCustomerId };
  }
  const live = await entitlementFromPolar(userId);
  await rememberEntitlement(userId, live);
  return live;
}

/* Write what Polar said into the user's record. Called from lookups and from webhooks. */
export async function rememberEntitlement(userId: string, e: Entitlement) {
  await setUser(userId, {
    plan: e.plan,
    interval: e.interval ?? "",
    status: e.status ?? "",
    subscriptionId: e.subscriptionId ?? "",
    renewsAt: e.renewsAt ?? "",
    cancelAtPeriodEnd: e.cancelAtPeriodEnd ?? false,
    polarCustomerId: e.polarCustomerId,
    entitlementCheckedAt: new Date().toISOString(),
  });
}
