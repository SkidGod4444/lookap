import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { kv } from "@/lib/db";

/* The judge's side channel. An agent's screenshots and the composed evidence sheets never travel through the model as
   base64: judge_rebuild on the MCP issues a token, the agent PUTs its renders here with curl (zero output tokens),
   judge_rebuild composes the sheets and stores them here, and the agent's judge (a subagent on its own model) GETs
   them. Everything under a token lives fifteen minutes in Redis and is never listed.

     PUT  /api/judge/<token>/<at>            body: a PNG or JPEG of the render at that moment (seconds); stored at the
                                             entry's frame size as JPEG
     GET  /api/judge/<token>/sheet-<n>.jpg   a composed sheet
     GET  /api/judge/<token>/shots           the moments uploaded so far */
export const maxDuration = 30;
const TTL = 900;
const MAX = 8 * 1024 * 1024;

type Token = { slug: string; w: number; h: number; mark: string };

export async function PUT(req: NextRequest, { params }: { params: Promise<{ token: string; name: string }> }) {
  const { token, name } = await params;
  if (!/^[a-f0-9]{24}$/.test(token)) return NextResponse.json({ error: "no such token" }, { status: 404 });
  const at = Number(name.replace(/\.(png|jpe?g)$/i, ""));
  if (!Number.isFinite(at) || at < 0) return NextResponse.json({ error: "the name is the moment in seconds, e.g. 5.95 or 5.95.png" }, { status: 400 });
  const t = (await kv().get<Token>(`judge:${token}`)) ?? null;
  if (!t) return NextResponse.json({ error: "token unknown or expired: call judge_rebuild again for a new one" }, { status: 404 });
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX) return NextResponse.json({ error: "keep each screenshot under 8 MB" }, { status: 413 });
  const body = Buffer.from(await req.arrayBuffer());
  if (!body.length || body.length > MAX) return NextResponse.json({ error: "empty or oversized body" }, { status: 400 });
  let jpeg: Buffer;
  try { jpeg = await sharp(body).resize(t.w, t.h, { fit: "fill" }).jpeg({ quality: 90 }).toBuffer(); } catch { return NextResponse.json({ error: "not an image sharp can read (PNG or JPEG)" }, { status: 400 }); }
  const key = Number(at.toFixed(2));
  await kv().set(`judge:${token}:shot:${key}`, jpeg.toString("base64"), { ex: TTL });
  await kv().sadd(`judge:${token}:ats`, String(key));
  await kv().expire(`judge:${token}:ats`, TTL);
  return NextResponse.json({ ok: true, slug: t.slug, at: key, stored: `${t.w}x${t.h} JPEG, ${(jpeg.length / 1024).toFixed(0)} KB`, next: "upload the other moments, then call judge_rebuild with this token" });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string; name: string }> }) {
  const { token, name } = await params;
  if (!/^[a-f0-9]{24}$/.test(token)) return new NextResponse(null, { status: 404 });
  const t = (await kv().get<Token>(`judge:${token}`)) ?? null;
  if (!t) return NextResponse.json({ error: "token unknown or expired" }, { status: 404 });
  if (name === "shots") {
    const ats = ((await kv().smembers(`judge:${token}:ats`)) as string[]).map(Number).sort((a, b) => a - b);
    return NextResponse.json({ slug: t.slug, moments: ats });
  }
  const m = name.match(/^sheet-(\d+)\.jpe?g$/);
  if (!m) return new NextResponse(null, { status: 404 });
  const b64 = (await kv().get<string>(`judge:${token}:sheet:${m[1]}`)) ?? null;
  if (!b64) return NextResponse.json({ error: "no such sheet: call judge_rebuild with the token to compose them" }, { status: 404 });
  return new NextResponse(Buffer.from(b64, "base64"), { headers: { "content-type": "image/jpeg", "cache-control": "private, no-store", "x-robots-tag": "noindex" } });
}
