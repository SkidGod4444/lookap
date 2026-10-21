import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { AI_BOT_NAMES } from "@/lib/bots";

/* Search engines may index the site. AI crawlers and scrapers are refused everywhere (and 403'd in proxy.ts for
   those that ignore robots). The full notice for agents is at /llms.txt. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: AI_BOT_NAMES, disallow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/api/", "/sso-callback", "/account", "/moodboards"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
