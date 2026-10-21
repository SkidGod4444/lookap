import { Webhooks } from "@polar-sh/nextjs";
import { planForProduct, rememberEntitlement } from "@/lib/polar";
import type { Plan } from "@/lib/keys";
import { setIdentitySubscription, setUserKeys } from "@/lib/unkey";
import { setUser } from "@/lib/db";

/* Polar tells us when a subscription starts, changes or ends. Each event lands in three places:
   the user's Redis record (what the account page reads), the Unkey identity (what every key verification carries),
   and the keys themselves (on, off, and on the plan being paid for). */

type Sub = {
  id: string;
  status: string;
  product_id: string;
  recurring_interval: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  customer_id: string;
  customer: { id: string; external_id?: string | null; email?: string | null; name?: string | null };
};

async function sync(sub: Sub, enabled: boolean) {
  const userId = sub.customer.external_id;
  if (!userId) return;
  const plan = enabled ? planForProduct(sub.product_id) : null;
  const planValue: Plan = plan ?? "none";
  const details = {
    plan: planValue,
    interval: sub.recurring_interval === "year" ? ("year" as const) : ("month" as const),
    status: sub.status,
    subscriptionId: sub.id,
    renewsAt: sub.current_period_end ?? undefined,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    polarCustomerId: sub.customer.id,
  };
  await Promise.all([
    rememberEntitlement(userId, details),
    setUser(userId, { email: sub.customer.email ?? undefined, name: sub.customer.name ?? undefined }),
    setIdentitySubscription(userId, { plan: details.plan, status: details.status, subscriptionId: details.subscriptionId, renewsAt: details.renewsAt, polarCustomerId: details.polarCustomerId }).catch((e) => console.error("[unkey] identity sync failed", e)),
    setUserKeys(userId, { enabled, ...(plan ? { plan } : {}) }).then((n) => console.log(`[polar] keys ${enabled ? "on" : "off"} for ${userId}: ${n}${plan ? ` (${plan})` : ""}`)),
  ]);
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET ?? "",
  onSubscriptionActive: async ({ data }) => sync(data, true),
  onSubscriptionUncanceled: async ({ data }) => sync(data, true),
  onSubscriptionResumed: async ({ data }) => sync(data, true),
  onSubscriptionUpdated: async ({ data }) => { if (data.status === "active") await sync(data, true); },
  onSubscriptionRevoked: async ({ data }) => sync(data, false),
  onSubscriptionPaused: async ({ data }) => sync(data, false),
  onCustomerCreated: async ({ data }) => { if (data.external_id) await setUser(data.external_id, { polarCustomerId: data.id, email: data.email ?? undefined, name: data.name ?? undefined }); },
  onCustomerUpdated: async ({ data }) => { if (data.external_id) await setUser(data.external_id, { polarCustomerId: data.id, email: data.email ?? undefined, name: data.name ?? undefined }); },
});
