import { Suspense } from "react";
import { bySection, SECTIONS, sectionSlug, ENTRIES } from "@/lib/data";
import { FeedGrid } from "@/components/FeedGrid";

export function generateStaticParams() {
  return SECTIONS.map((s) => ({ kind: sectionSlug(s) }));
}

async function Inner({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const name = SECTIONS.find((s) => sectionSlug(s) === kind) ?? kind;
  const list = bySection(kind);
  return <FeedGrid entries={list.length ? list : ENTRIES.slice(0, 12)} title={`${name} inspiration`} blurb={`Hand-picked ${name.toLowerCase()} sections from real products.`} />;
}

export default function Page({ params }: PageProps<"/sections/[kind]">) {
  return <Suspense fallback={null}><Inner params={params} /></Suspense>;
}
