import { NextResponse, type NextRequest } from "next/server";
import { kv } from "@/lib/db";

/* Sampled imagery for an agent's rebuild: look_at what=patch and what=plate store the crop here for an hour and
   return this address, so the image reaches the agent's disk with curl and never passes through its context as base64.
   GET /api/asset/<id>.jpg */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = id.match(/^([a-f0-9]{24})\.jpe?g$/);
  if (!m) return new NextResponse(null, { status: 404 });
  const b64 = (await kv().get<string>(`asset:${m[1]}`)) ?? null;
  if (!b64) return NextResponse.json({ error: "asset expired or unknown: call look_at again" }, { status: 404 });
  return new NextResponse(Buffer.from(b64, "base64"), { headers: { "content-type": "image/jpeg", "cache-control": "private, no-store", "x-robots-tag": "noindex" } });
}
