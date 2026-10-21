import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { AI_BOT_RE, AI_NOTICE } from "@/lib/bots";

/* AI crawlers and scraper clients get a 403 with the notice on every page. /api stays open: /api/mcp is the product
   (Claude Code, Cursor and Codex call it with fetch-style user agents) and /api/webhooks receives Clerk and Polar. */
const OPEN = /^\/(api\/|install\.sh$|robots\.txt$|sitemap\.xml$|llms\.txt$|manifest\.webmanifest$)/;

export default clerkMiddleware((_auth, req) => {
  const ua = req.headers.get("user-agent") ?? "";
  if (!OPEN.test(req.nextUrl.pathname) && AI_BOT_RE.test(ua)) {
    return new NextResponse(`${AI_NOTICE}\n`, {
      status: 403,
      headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex, noai, noimageai", "cache-control": "no-store" },
    });
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
