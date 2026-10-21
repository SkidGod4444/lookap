import { NextResponse } from "next/server";
import { CustomerPortal } from "@polar-sh/nextjs";
import { auth } from "@clerk/nextjs/server";
import { entitlementFor, POLAR_ENV, polarReady } from "@/lib/polar";
import { SITE_URL } from "@/lib/site";

/* The Polar customer portal for the signed-in user: invoices, payment method, cancel, upgrade. */
const handler = polarReady
  ? CustomerPortal({
      accessToken: process.env.POLAR_ACCESS_TOKEN!,
      environment: POLAR_ENV,
      returnUrl: `${SITE_URL}/account`,
      getExternalCustomerId: async () => (await auth()).userId ?? "",
    })
  : null;

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/pricing?signin=1&next=%2Fapi%2Fportal", req.url));
  if (!handler) return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  /* No Polar customer yet means nothing to manage: send them to pick a plan instead of a portal error. */
  const ent = await entitlementFor(userId);
  if (!ent.polarCustomerId) return NextResponse.redirect(new URL("/pricing", req.url));
  return handler(req as never);
}
