import { NextRequest, NextResponse } from "next/server";
import { Checkout } from "@polar-sh/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isInterval, isPaidPlan, POLAR_ENV, polarReady, productFor } from "@/lib/polar";
import { SITE_URL } from "@/lib/site";

/* /api/checkout?plan=pro&interval=month → Polar Checkout for that product, tied to the signed-in user.
   Signed out: back to the page that sent them with signin=1 so the header opens the dialog, then here again. */

const handler = polarReady
  ? Checkout({ accessToken: process.env.POLAR_ACCESS_TOKEN!, successUrl: `${SITE_URL}/account?checkout=success`, returnUrl: `${SITE_URL}/pricing`, environment: POLAR_ENV, theme: "dark" })
  : null;

export async function GET(req: NextRequest) {
  const plan = req.nextUrl.searchParams.get("plan") ?? "starter";
  const interval = req.nextUrl.searchParams.get("interval") ?? "month";
  if (!isPaidPlan(plan) || !isInterval(interval)) return NextResponse.json({ error: "Unknown plan or interval." }, { status: 400 });
  const { userId } = await auth();
  if (!userId) {
    const next = `/api/checkout?plan=${plan}&interval=${interval}`;
    return NextResponse.redirect(new URL(`/pricing?signin=1&next=${encodeURIComponent(next)}`, req.url));
  }
  if (!handler) return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  const product = productFor(plan, interval);
  if (!product) return NextResponse.json({ error: `No product configured for ${plan} ${interval}.` }, { status: 503 });
  const user = await currentUser();
  const url = new URL(req.url);
  url.search = "";
  url.searchParams.set("products", product);
  url.searchParams.set("external_customer_id", userId);
  if (user?.primaryEmailAddress?.emailAddress) url.searchParams.set("customer_email", user.primaryEmailAddress.emailAddress);
  if (user?.fullName) url.searchParams.set("customer_name", user.fullName);
  url.searchParams.set("metadata", JSON.stringify({ plan, interval, userId }));
  try {
    return await handler(new NextRequest(url, { headers: req.headers }));
  } catch (e) {
    /* Polar validates the prefilled email against the domain's mail setup. If it objects, let Checkout ask for the email itself. */
    const msg = e instanceof Error ? e.message : String(e);
    if (/customer_email/.test(msg) && url.searchParams.has("customer_email")) {
      url.searchParams.delete("customer_email");
      return handler(new NextRequest(url, { headers: req.headers }));
    }
    console.error("[polar] checkout failed", msg.slice(0, 300));
    return NextResponse.json({ error: "Checkout could not be started. Try again in a moment." }, { status: 502 });
  }
}
