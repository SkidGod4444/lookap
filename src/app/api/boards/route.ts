import { auth } from "@clerk/nextjs/server";
import { boardsReady, createBoard, listBoards } from "@/lib/boards";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

export async function GET() {
  const { userId } = await auth();
  if (!userId) return json({ error: "Sign in first." }, 401);
  if (!boardsReady) return json({ error: "Moodboards are not configured." }, 503);
  return json({ boards: await listBoards(userId) });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return json({ error: "Sign in first." }, 401);
  if (!boardsReady) return json({ error: "Moodboards are not configured." }, 503);
  const body = (await req.json().catch(() => ({}))) as { name?: unknown };
  const r = await createBoard(userId, body.name);
  return "error" in r ? json({ error: r.error }, r.status) : json({ board: r }, 201);
}
