import { auth } from "@clerk/nextjs/server";
import { boardsReady, deleteBoard, renameBoard } from "@/lib/boards";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { userId } = await auth();
  if (!userId) return json({ error: "Sign in first." }, 401);
  if (!boardsReady) return json({ error: "Moodboards are not configured." }, 503);
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { name?: unknown };
  const r = await renameBoard(userId, id, body.name);
  return "error" in r ? json({ error: r.error }, r.status) : json(r);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { userId } = await auth();
  if (!userId) return json({ error: "Sign in first." }, 401);
  if (!boardsReady) return json({ error: "Moodboards are not configured." }, 503);
  const { id } = await ctx.params;
  const r = await deleteBoard(userId, id);
  return "error" in r ? json({ error: r.error }, r.status) : json(r);
}
