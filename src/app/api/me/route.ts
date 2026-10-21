import { auth } from "@clerk/nextjs/server";
import { entitlementFor } from "@/lib/polar";

/* Who is asking and what they pay for: enough for the site to decide whether to show a prompt, a sign-in or an upgrade. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ signedIn: false, plan: "none" }, { headers: { "cache-control": "no-store" } });
  const ent = await entitlementFor(userId);
  return Response.json({ signedIn: true, plan: ent.plan }, { headers: { "cache-control": "no-store" } });
}
