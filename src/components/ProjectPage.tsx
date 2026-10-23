import Link from "next/link";
import { notFound } from "next/navigation";
import { ENTRIES, bySlug, sectionSlug, type Entry } from "@/lib/data";
import { Media, STAGE_SIZES, TILE_SIZES } from "./Media";
import { Avatar } from "./Avatar";
import { SaveButton } from "./SaveButton";
import { avatarUrl } from "@/lib/avatar";
import { preload } from "react-dom";
import { hrefFor } from "./FeedCard";
import { button } from "./button";
import { LockScroll } from "./LockScroll";
import { Stage } from "./Stage";
import { Compare } from "./Compare";
import { liveFor } from "./demo/live";
import { AgentPrompts } from "./AgentPrompts";
import { DemandPing } from "./DemandPing";
import { recipeFor, tokens } from "@/lib/registry";
import { FACTORY } from "@/lib/rebuilds";
import { CATALOG_UPDATED, sectionName } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

/* Structured data for crawlers: the clip or still as a VideoObject or ImageObject (Google needs name, thumbnail and
   an upload date: the day it entered the registry) and the breadcrumb Home > Feed or Websites > section > entry. */
function jsonLd(entry: Entry, live: boolean) {
  const url = `${SITE_URL}${hrefFor(entry)}`;
  const listing = entry.kind === "website" ? { name: "Websites", path: "/websites" } : { name: "Feed", path: "/feed" };
  const media = entry.video
    ? { "@type": "VideoObject", name: entry.title, description: entry.description, thumbnailUrl: entry.poster, contentUrl: entry.video.src, uploadDate: CATALOG_UPDATED, width: entry.video.w, height: entry.video.h, ...(entry.duration ? { duration: `PT${Math.round(entry.duration)}S` } : {}), url }
    : { "@type": "ImageObject", name: entry.title, description: entry.description, contentUrl: entry.image?.src ?? entry.poster, width: entry.image?.w, height: entry.image?.h, url };
  return {
    "@context": "https://schema.org",
    "@graph": [
      { ...media, creator: { "@type": entry.x || entry.authorName ? "Person" : "Organization", name: entry.authorName, ...(entry.x ? { url: `https://x.com/${entry.x}` } : {}) }, isPartOf: { "@id": `${SITE_URL}/#website` }, keywords: [entry.category, ...entry.types].join(", "), ...(live ? { hasPart: { "@type": "SoftwareSourceCode", name: `${entry.title}, rebuilt by lookap`, programmingLanguage: (FACTORY[entry.slug] as { react?: unknown } | undefined)?.react ? ["HTML", "CSS", "JavaScript", "TypeScript", "React"] : ["HTML", "CSS", "JavaScript"], ...((FACTORY[entry.slug] as { react?: unknown } | undefined)?.react ? { runtimePlatform: "React 19, Tailwind CSS v4, Motion" } : {}) } } : {}) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "lookap", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: listing.name, item: `${SITE_URL}${listing.path}` },
        { "@type": "ListItem", position: 3, name: sectionName(sectionSlug(entry.category)), item: `${SITE_URL}/sections/${sectionSlug(entry.category)}` },
        { "@type": "ListItem", position: 4, name: entry.title, item: url },
      ] },
    ],
  };
}

export function ProjectPage({ slug }: { slug: string }) {
  const entry = bySlug(slug);
  if (!entry) notFound();
  const similar = ENTRIES.filter((e) => e.slug !== entry.slug && (e.category === entry.category || e.kind === entry.kind)).slice(0, 6);
  const live = liveFor(entry);
  const recipe = recipeFor(entry);
  /* the stage takes the rebuild's shape when it differs from the clip's: a filmed screen straightened into a flat page
     (scripts/screen.ts) is wide where the phone video of it was tall; the clip then sits inside the frame, uncropped */
  const fr = FACTORY[entry.slug];
  const rebuiltRatio = fr ? fr.frame.w / fr.frame.h : null;
  const ratio = rebuiltRatio && Math.abs(rebuiltRatio - entry.ratio) / entry.ratio > 0.02 ? rebuiltRatio : entry.ratio;
  const reshaped = ratio !== entry.ratio;
  /* the frame fits the stage height too, so the switch and caption under it stay on screen */
  const frame = { maxWidth: `min(${ratio >= 1 ? 900 : 420}px, calc((100dvh - 220px) * ${ratio.toFixed(4)}))`, aspectRatio: ratio };
  const site = entry.site && entry.site !== "example.com" ? `https://${entry.site}` : null;
  /* the credit's picture starts loading from the document head, before any script runs */
  if (entry.x) preload(avatarUrl(entry.x), { as: "image" });

  return (
    /* on large screens the page does not scroll: the stage is fixed and only the panel scrolls */
    <div className="-mx-4 -mt-4 -mb-4 flex flex-1 flex-col lg:h-[calc(100vh_-_57px)] lg:flex-none lg:flex-row lg:overflow-hidden">
      <LockScroll />
      <DemandPing slug={entry.slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(entry, Boolean(live))) }} />
      <Stage>
        <Compare clip={<Media entry={entry} sizes={STAGE_SIZES} eager contain={reshaped} />} live={live ? <live.Component /> : null} hint={live?.hint} align={live?.align} style={frame} />
      </Stage>

      <aside className="w-full shrink-0 border-t border-line bg-canvas px-5 pt-6 pb-10 lg:h-full lg:w-[280px] lg:overflow-y-auto lg:border-t-0 lg:border-l">
        <div className="flex min-h-full flex-col gap-5">
          <header className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-balance text-foreground">{entry.title}</h1>
              <SaveButton slug={entry.slug} label className="relative shrink-0" />
            </div>
            <p className="text-[14px] leading-[1.55] text-pretty text-subtle">{entry.description}</p>
          </header>

          {/* credit: links out only when we hold a verified handle or it is our own work; samples say so */}
          {entry.x || entry.sourceUrl ? (
            <a href={entry.x ? `https://x.com/${entry.x}` : entry.sourceUrl} className="group flex items-center gap-2.5">
              <Avatar name={entry.authorName} x={entry.x} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-foreground group-hover:underline underline-offset-2">{entry.authorName}</span>
                <span className="block truncate text-[12px] text-subtle">{entry.x ? `@${entry.x}` : "source"}</span>
              </span>
            </a>
          ) : (
            <div className="flex items-center gap-2.5">
              <Avatar name={entry.authorName} x={entry.x} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-foreground">{entry.authorName}</span>
                <span className="block truncate text-[12px] text-subtle">Sample entry. Real credits link to the designer.</span>
              </span>
            </div>
          )}

          {(entry.x || site || entry.sourceUrl) && (
            <a href={entry.sourceUrl ?? (entry.x ? `https://x.com/${entry.x}` : site!)} className={button("silver", "h-8 justify-between rounded-lg px-3 text-[13px]")}>
              {entry.sourceUrl?.includes("x.com/") ? "Open post on X" : entry.x ? "Open on X" : site ? "Visit site" : "View source"}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>
            </a>
          )}

          <AgentPrompts slug={entry.slug} title={entry.title} measured={Boolean(recipe)} rebuilt={Boolean(live)} react={Boolean((FACTORY[entry.slug] as { react?: unknown } | undefined)?.react)} />

          <dl className="flex flex-col divide-y divide-dashed divide-line-strong [&>*]:flex [&>*]:items-start [&>*]:justify-between [&>*]:gap-3 [&>*]:py-2.5 text-[12px]">
            <div><dt className="font-medium text-foreground">Category</dt><dd><Link href={`/sections/${sectionSlug(entry.category)}`} className="text-subtle underline-offset-2 hover:text-foreground hover:underline">{entry.category}</Link></dd></div>
            <div><dt className="font-medium text-foreground">Type</dt><dd className="text-right text-subtle">{entry.types.join(", ")}</dd></div>
            <div><dt className="font-medium text-foreground">Media</dt><dd className="text-subtle">{entry.video ? (entry.duration ? `clip · ${entry.duration}s` : "clip") : "still"}</dd></div>
          </dl>

          {/* the cost of the rebuild, read from the transcript of the session that made it */}
          {!recipe && FACTORY[entry.slug] && (() => { const f = FACTORY[entry.slug]; return (
            <div className="flex flex-col gap-2">
              <h2 className="text-[11px] font-medium tracking-[0.04em] text-subtle uppercase">Rebuilt by lookap</h2>
              <dl className="flex flex-col gap-1.5 text-[12px] leading-[1.4]">
                <div className="flex justify-between gap-3"><dt className="font-medium text-foreground">Finished by</dt><dd className="text-right text-subtle"><span className="text-foreground">{f.build.model}</span><br />{f.build.modelId}, {f.build.date}</dd></div>
                {f.build.run && (
                  <>
                    <div className="flex justify-between gap-3"><dt className="font-medium text-foreground">Agent run</dt><dd className="text-right text-subtle"><span className="text-foreground">{f.build.run.model}</span><br />{f.build.run.turns} turns, {f.build.run.minutes} min, ${f.build.run.costUsd.toFixed(2)}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="font-medium text-foreground">Tokens</dt><dd className="text-right text-subtle"><span className="text-foreground">{tokens(f.build.run.outputTokens)}</span> written<br />{tokens(f.build.run.totalTokens)} read, context re-read each turn</dd></div>
                  </>
                )}
              </dl>
              <p className="mt-2 text-[11px] leading-[1.5] text-subtle">{f.build.run ? `The agent run above is metered; it matched the clip's stills at ${f.build.run.score}/100 and missed the motion. ` : ""}{f.build.hand ? `Then ${f.build.hand}, not metered. ` : ""}Flip the switch above to use it. The file is on Max.</p>
            </div>
          ); })()}
          {recipe && (
            <section>
              <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">Rebuilt by</h2>
              <dl className="mt-2 flex flex-col divide-y divide-dashed divide-line-strong [&>*]:flex [&>*]:items-start [&>*]:justify-between [&>*]:gap-3 [&>*]:py-2.5 text-[12px]">
                <div><dt className="font-medium text-foreground">Model</dt><dd className="text-right text-subtle"><span className="text-foreground">{recipe.build.model}</span><br />{recipe.build.modelId}</dd></div>
                <div><dt className="font-medium text-foreground">Tokens</dt><dd className="text-right text-subtle"><span className="text-foreground">{tokens(recipe.build.outputTokens)}</span> written<br />{tokens(recipe.build.totalTokens)} read, context re-read each turn</dd></div>
                <div><dt className="font-medium text-foreground">Work</dt><dd className="text-right text-subtle">{recipe.build.minutes} min · {recipe.build.toolCalls} tool calls<br />{recipe.build.rounds} rounds of feedback</dd></div>
              </dl>
              <p className="mt-2 text-[11px] leading-[1.5] text-subtle">Whole-session totals, feedback rounds included. The agent measured the designer&apos;s clip frame by frame, built, and compared renders side by side until it matched.</p>
            </section>
          )}

          <section>
            <h2 className="text-[11px] font-medium tracking-[.06em] text-subtle uppercase">More like this</h2>
            <ul className="mt-2 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-line ring-1 ring-line lg:grid-cols-2">
              {similar.map((s) => (
                <li key={s.slug} className="min-w-0 bg-canvas">
                  <Link href={hrefFor(s)} className="block"><span className="relative block aspect-[4/3] overflow-hidden"><Media entry={s} sizes={TILE_SIZES} compact /></span></Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </aside>
    </div>
  );
}
