/* A designer's X profile picture, by handle, cached on our edge. unavatar.io resolves it (slowly, the first time);
   after that the bytes live on Vercel's CDN for a week and refresh in the background. A miss is cached for an hour so a
   handle that fails is not retried on every page view. */

const HANDLE = /^[A-Za-z0-9_]{1,15}$/;

export async function GET(_req: Request, ctx: { params: Promise<{ handle: string }> }) {
  const { handle } = await ctx.params;
  if (!HANDLE.test(handle)) return new Response("bad handle", { status: 400 });
  try {
    const res = await fetch(`https://unavatar.io/x/${handle}?fallback=false`, { headers: { "user-agent": "lookap/0.2 (+https://lookap.saidev.codes)" }, signal: AbortSignal.timeout(8_000), cache: "no-store" });
    if (!res.ok) return miss();
    const type = res.headers.get("content-type") ?? "image/jpeg";
    if (!type.startsWith("image/")) return miss();
    return new Response(await res.arrayBuffer(), {
      headers: { "content-type": type, "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000", "x-robots-tag": "noindex" },
    });
  } catch {
    return miss();
  }
}

const miss = () => new Response(null, { status: 404, headers: { "cache-control": "public, max-age=600, s-maxage=3600" } });
