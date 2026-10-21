import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { AI_BOT_RE, AI_NOTICE } from "@/lib/bots";

/* AI crawlers and scraper clients get a 403 with the notice on every page. /api stays open: /api/mcp is the product
   (Claude Code, Cursor and Codex call it with fetch-style user agents) and /api/webhooks receives Clerk and Polar.
   /api/live/ is left out of the matcher below: it serves a rebuild into a sandboxed frame with no cookies, and Clerk's
   handshake redirect would loop it; the route gates itself on the browser's fetch metadata. */
const OPEN = /^\/(api\/|install\.sh$|robots\.txt$|sitemap\.xml$|llms\.txt$|manifest\.webmanifest$)/;

/* Pages that belong to a signed-in person. A signed-out visit never renders them: it lands on the feed with the
   sign-in dialog open and comes back here once signed in. */
const PRIVATE = createRouteMatcher(["/account(.*)", "/moodboards(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const ua = req.headers.get("user-agent") ?? "";
  if (!OPEN.test(req.nextUrl.pathname) && AI_BOT_RE.test(ua)) {
    return new NextResponse(`${AI_NOTICE}\n`, {
      status: 403,
      headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex, noai, noimageai", "cache-control": "no-store" },
    });
  }
  if (PRIVATE(req)) {
    const { userId } = await auth();
    if (!userId) {
      const to = req.nextUrl.clone();
      to.pathname = "/";
      to.search = `?signin=1&next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
      return NextResponse.redirect(to);
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|api/live/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|mp4|webm|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api(?!/live/)|trpc)(.*)",
  ],
};
