import { NextResponse, type NextRequest } from "next/server";
import { FACTORY } from "@/lib/rebuilds";
import { checkLiveToken } from "@/lib/rebuilds/token";
import { fingerprint } from "@/lib/usage";

/* The Live view of a factory rebuild, for the project page's frame only. The address carries a signed token the
   project page minted for this view and this signed-in member (thirty minutes), the copy served carries that
   member's mark in its stylesheet, as get_rebuild's files do, and the browser must say this is an iframe on this site
   (Sec-Fetch-Dest and Sec-Fetch-Site, which a browser sets and a page cannot forge) with a Referer from this origin;
   anything else is a 404, so the address cannot be opened, fetched, hotlinked or kept. The response may
   not be framed anywhere but here, fetches nothing but Google Fonts, and is never cached or indexed. The file never
   sits in the project page's own HTML. What a browser renders can still be read in its developer tools; that is the
   limit of any page, which is why the licensed file with its per-buyer mark is a separate thing on get_rebuild. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rb = FACTORY[slug];
  const h = req.headers;
  const ours = h.get("sec-fetch-dest") === "iframe" && h.get("sec-fetch-site") === "same-origin" && (h.get("referer") ?? "").startsWith(req.nextUrl.origin + "/");
  const user = ours ? checkLiveToken(slug, req.nextUrl.searchParams.get("t")) : null;
  if (!rb || !user) return new NextResponse(null, { status: 404 });
  const mark = fingerprint(`user:${user}`);
  const html = rb.embed
    .replace(/(#stage|:root)\s*\{/, `$1{--lk:"${mark}";`)
    .replace("<head>", '<head><meta name="robots" content="noindex, nofollow">')
    .replace("</body>", "<script>document.addEventListener('contextmenu',(e)=>e.preventDefault())</script></body>");
  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex, nofollow, noarchive",
      "content-security-policy": "frame-ancestors 'self'; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'",
      "referrer-policy": "no-referrer",
    },
  });
}
