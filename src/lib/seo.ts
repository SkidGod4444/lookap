import type { Metadata } from "next";
import type { Entry } from "./data";
import { rebuildFor } from "./rebuilds";

/* One place for an entry page's metadata, so feed and website pages say the same thing: a title that names the
   design and what kind of UI it is, a description that fits a search snippet (about 155 characters), the designer's
   credit, and the clip's own poster and video for link previews. */
const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, "")}…`);

export function entryMetadata(e: Entry, path: string): Metadata {
  const rb = rebuildFor(e);
  const react = Boolean(rb && (rb as { react?: unknown }).react);
  /* "Interface" says nothing in a title; the entry's first type does (Tooltip, Slider, Modal) */
  const noun = (e.category === "Interface" ? e.types[0] ?? "Interface" : e.category).toLowerCase();
  const kind = e.kind === "website" ? "website design" : `${noun} UI`;
  const title = rb ? `${e.title}, ${kind} rebuilt in ${react ? "React and HTML" : "HTML and CSS"}` : `${e.title}, ${kind} reference`;
  const lead = clip(e.description.replace(/\s+/g, " ").trim(), 110);
  const description = clip(`${lead} By ${e.authorName.replace(/\.$/, "")}. ${rb ? "Rebuilt from the clip; play with it." : "Measured for your coding agent."}`, 158);
  const image = e.poster ?? e.image?.src;
  return {
    title,
    description,
    alternates: { canonical: path },
    keywords: [e.title, e.category, ...e.types, `${e.category} UI`, "UI design reference", ...(rb ? ["HTML CSS rebuild", ...(react ? ["React", "Tailwind CSS", "Motion"] : [])] : [])],
    authors: e.authorName ? [{ name: e.authorName, ...(e.x ? { url: `https://x.com/${e.x}` } : {}) }] : undefined,
    openGraph: {
      url: path, type: e.video ? "video.other" : "article", siteName: "lookap", locale: "en_US", title, description,
      ...(image ? { images: [{ url: image, alt: `${e.title} by ${e.authorName}` }] } : {}),
      ...(e.video ? { videos: [{ url: e.video.src, width: e.video.w, height: e.video.h, type: "video/mp4" }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description, ...(image ? { images: [image] } : {}), ...(e.x ? { creator: `@${e.x}` } : {}) },
  };
}
