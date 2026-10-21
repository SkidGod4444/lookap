import { Webhooks } from "@polar-sh/nextjs";
import { planForProduct } from "@/lib/polar";
import { setUserKeys } from "@/lib/unkey";

/* Polar tells us when a subscription starts, changes or ends. Entitlement is read live from Polar when it matters;
   what the webhook does is keep the user's existing MCP keys in step: on, off, and on the plan being paid for. */

type Sub = { product_id: string; customer: { external_id?: string | null } };

async function sync(sub: Sub, enabled: boolean) {
  const userId = sub.customer.external_id;
  if (!userId) return;
  const plan = planForProduct(sub.product_id);
  const n = await setUserKeys(userId, { enabled, ...(enabled && plan ? { plan } : {}) });
  console.log(`[polar] keys ${enabled ? "on" : "off"} for ${userId}: ${n}${plan ? ` (${plan})` : ""}`);
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET ?? "",
  onSubscriptionActive: async ({ data }) => sync(data, true),
  onSubscriptionUncanceled: async ({ data }) => sync(data, true),
  onSubscriptionResumed: async ({ data }) => sync(data, true),
  onSubscriptionUpdated: async ({ data }) => { if (data.status === "active") await sync(data, true); },
  onSubscriptionRevoked: async ({ data }) => sync(data, false),
  onSubscriptionPaused: async ({ data }) => sync(data, false),
});
