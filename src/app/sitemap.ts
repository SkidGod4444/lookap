import type { MetadataRoute } from "next";
import { ENTRIES, SECTIONS, sectionSlug } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const fixed = ["", "/feed", "/mcp", "/pricing", "/clone", "/websites", "/launch-videos", "/og-images", "/privacy", "/terms"].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: (p === "" || p === "/feed" ? "daily" : "weekly") as "daily" | "weekly",
    priority: p === "" ? 1 : p === "/feed" || p === "/mcp" ? 0.9 : 0.6,
  }));
  const sections = SECTIONS.map((s) => ({ url: `${SITE_URL}/sections/${sectionSlug(s)}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.5 }));
  const entries = ENTRIES.map((e) => ({ url: `${SITE_URL}/${e.kind === "website" ? "website" : "feed"}/${e.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 }));
  return [...fixed, ...sections, ...entries];
}
