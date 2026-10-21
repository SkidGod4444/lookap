import type { MetadataRoute } from "next";
import { bySection, CATALOG_UPDATED, ENTRIES, INDEX_MIN, SECTION_KINDS } from "@/lib/data";
import { rebuildFor } from "@/lib/rebuilds";
import { SITE_URL } from "@/lib/site";

/* Dates are real: the catalogue's last change for entries and sections (a rebuilt entry carries its rebuild's date),
   not the build time, so crawlers can trust lastmod and skip what has not moved. */
export default function sitemap(): MetadataRoute.Sitemap {
  const catalog = new Date(CATALOG_UPDATED);
  const fixed = ["", "/feed", "/mcp", "/pricing", "/websites", "/launch-videos", "/og-images", "/privacy", "/terms"].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: catalog,
    changeFrequency: (p === "" || p === "/feed" ? "daily" : "weekly") as "daily" | "weekly",
    priority: p === "" ? 1 : p === "/feed" || p === "/mcp" ? 0.9 : 0.6,
  }));
  const sections = SECTION_KINDS().filter((k) => bySection(k).length >= INDEX_MIN).map((k) => ({ url: `${SITE_URL}/sections/${k}`, lastModified: catalog, changeFrequency: "weekly" as const, priority: 0.5 }));
  const entries = ENTRIES.map((e) => {
    const r = rebuildFor(e);
    const at = r ? new Date(r.build.date) : catalog;
    return { url: `${SITE_URL}/${e.kind === "website" ? "website" : "feed"}/${e.slug}`, lastModified: Number.isNaN(at.getTime()) ? catalog : at, changeFrequency: "monthly" as const, priority: r ? 0.8 : 0.7 };
  });
  return [...fixed, ...sections, ...entries];
}
