import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isInterval, isPaidPlan, polar, polarReady, productFor } from "@/lib/polar";
import { SITE_URL } from "@/lib/site";

/* /api/checkout?plan=pro&interval=month → a Polar Checkout for that product, tied to the signed-in user by external id.
   Signed out: back to pricing with signin=1 so the header opens the dialog, then here again. */

export async function GET(req: NextRequest) {
  const plan = req.nextUrl.searchParams.get("plan") ?? "starter";
  const interval = req.nextUrl.searchParams.get("interval") ?? "month";
  if (!isPaidPlan(plan) || !isInterval(interval)) return NextResponse.json({ error: "Unknown plan or interval." }, { status: 400 });
  const { userId } = await auth();
  if (!userId) {
    const next = `/api/checkout?plan=${plan}&interval=${interval}`;
    return NextResponse.redirect(new URL(`/pricing?signin=1&next=${encodeURIComponent(next)}`, req.url));
  }
  if (!polarReady) return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
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
    metadata: { plan, interval, userId },
  };
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
    return NextResponse.redirect(checkout.url, 303);
  } catch (e) {
    console.error("[polar] checkout failed", (e instanceof Error ? e.message : String(e)).slice(0, 300));
    return NextResponse.json({ error: "Checkout could not be started. Try again in a moment." }, { status: 502 });
  }
}
