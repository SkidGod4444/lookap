import { auth } from "@clerk/nextjs/server";
import { addItem, boardsReady, removeItem } from "@/lib/boards";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
type Ctx = { params: Promise<{ id: string }> };

async function change(req: Request, ctx: Ctx, fn: typeof addItem) {
  const { userId } = await auth();
  if (!userId) return json({ error: "Sign in first." }, 401);
  if (!boardsReady) return json({ error: "Moodboards are not configured." }, 503);
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { slug?: unknown };
  const slug = String(body.slug ?? "");
  const r = await fn(userId, id, slug);
  return "error" in r ? json({ error: r.error }, r.status) : json(r);
}

export const POST = (req: Request, ctx: Ctx) => change(req, ctx, addItem);
export const DELETE = (req: Request, ctx: Ctx) => change(req, ctx, removeItem);
