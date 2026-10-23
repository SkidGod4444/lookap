import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { entitlementFor, isInterval, isPaidPlan, polar, polarReady, productFor } from "@/lib/polar";
import { SITE_URL } from "@/lib/site";
import { getUser } from "@/lib/db";

/* Starter opens with 7 days free. Only for an account that has never had a subscription; Polar itself also refuses a
   second trial to the same customer. The card is taken at checkout and charged when the trial ends. */
const TRIAL_DAYS = 7;

/* /api/checkout?plan=pro&interval=month → a Polar Checkout for that product, tied to the signed-in user by external id.
   Plain requests are redirected to Polar's hosted page. With embed=1 the route answers JSON { url } for the embedded
   checkout, and the session is created with embed_origin set to the page's origin so Polar lets it be framed there.
   Signed out: a redirect back to pricing with signin=1 (or 401 JSON in embed mode) so the header opens the dialog. */

export async function GET(req: NextRequest) {
  const plan = req.nextUrl.searchParams.get("plan") ?? "starter";
  const interval = req.nextUrl.searchParams.get("interval") ?? "month";
  if (!isPaidPlan(plan) || !isInterval(interval)) return NextResponse.json({ error: "Unknown plan or interval." }, { status: 400 });
  const embed = req.nextUrl.searchParams.get("embed") === "1";
  const { userId } = await auth();
  if (!userId) {
    if (embed) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    const next = `/api/checkout?plan=${plan}&interval=${interval}`;
    return NextResponse.redirect(new URL(`/pricing?signin=1&next=${encodeURIComponent(next)}`, req.url));
  }
  if (!polarReady) return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  /* a second checkout on the same or a lower tier would open a second subscription beside the first: plan changes go
     through the account page, where Polar moves the one subscription */
  const RANK: Record<string, number> = { none: 0, starter: 1, pro: 2, team: 3 };
  const have = (await entitlementFor(userId).catch(() => ({ plan: "none" as const }))).plan;
  if ((RANK[have] ?? 0) >= RANK[plan]) {
    const msg = have === plan ? "This is already your plan." : "Your plan already includes this. Change plans from your account page.";
    if (embed) return NextResponse.json({ error: msg, account: "/account" }, { status: 409 });
    return NextResponse.redirect(new URL("/account", req.url));
  }
  /* on a lower paid plan: Polar holds one subscription per customer, so this is an upgrade (POST /api/upgrade), not a checkout */
  if ((RANK[have] ?? 0) > 0) {
    if (embed) return NextResponse.json({ error: "Upgrade from the plan card: your current plan changes, with no second subscription.", upgrade: true }, { status: 409 });
    return NextResponse.redirect(new URL("/pricing", req.url));
  }
  /* The origin that will frame the embedded checkout: the page's own, as the browser reports it. */
  const origin = req.headers.get("origin") ?? (req.headers.get("x-forwarded-host") ? `https://${req.headers.get("x-forwarded-host")}` : req.nextUrl.origin);
  const product = productFor(plan, interval);
  if (!product) return NextResponse.json({ error: `No product configured for ${plan} ${interval}.` }, { status: 503 });
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  /* Polar picks the presentment currency and the local payment methods (UPI in India, for one) from the customer's IP.
     Behind Vercel the real address is the first entry of x-forwarded-for. */
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "";
  const base = {
    products: [product],
    success_url: `${SITE_URL}/account?checkout=success`,
    return_url: `${SITE_URL}/pricing`,
    external_customer_id: userId,
    ...(user?.fullName ? { customer_name: user.fullName } : {}),
    ...(ip && !/^(127\.|::1|10\.|192\.168\.)/.test(ip) ? { customer_ip_address: ip } : {}),
    ...(embed ? { embed_origin: origin } : {}),
    metadata: { plan, interval, userId },
  };
  const trial = plan === "starter" && !(await getUser(userId).catch(() => null))?.subscriptionId;
  if (trial) Object.assign(base, { trial_interval: "day" as const, trial_interval_count: TRIAL_DAYS });
  try {
    let checkout;
    try {
      checkout = await polar().checkouts.create(email ? { ...base, customer_email: email } : base);
    } catch (e) {
      /* Polar validates the prefilled email against the domain's mail setup. If it objects, let Checkout ask for the email itself. */
      const msg = e instanceof Error ? e.message : String(e);
      if (!email || !/customer_email/.test(msg)) throw e;
      checkout = await polar().checkouts.create(base);
    }
    if (embed) return NextResponse.json({ url: checkout.url });
    return NextResponse.redirect(checkout.url, 303);
  } catch (e) {
    console.error("[polar] checkout failed", (e instanceof Error ? e.message : String(e)).slice(0, 300));
    return NextResponse.json({ error: "Checkout could not be started. Try again in a moment." }, { status: 502 });
  }
}
