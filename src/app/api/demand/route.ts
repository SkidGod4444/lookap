import { auth } from "@clerk/nextjs/server";
import { bump, topDemand } from "@/lib/demand";
import { bySlug } from "@/lib/data";

/* POST: a page view, sent as a beacon when a project page opens. GET: the demand table, for the admin ids only. */
const json = (v: unknown, status = 200) => Response.json(v, { status, headers: { "cache-control": "no-store" } });
const ADMINS = new Set((process.env.LOOKAP_ADMIN_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean));

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { slug?: unknown };
  const slug = String(body.slug ?? "");
  if (!bySlug(slug)) return json({ ok: false }, 404);
  bump(slug, "view");
  return json({ ok: true });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId || !ADMINS.has(userId)) return json({ error: "Not for this account." }, 403);
  return json({ rows: await topDemand(100) });
}
