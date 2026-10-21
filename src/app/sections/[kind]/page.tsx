import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { bySection, SECTIONS, sectionSlug } from "@/lib/data";
import { FeedGrid } from "@/components/FeedGrid";

export function generateStaticParams() {
  return SECTIONS.map((s) => ({ kind: sectionSlug(s) }));
}

export async function generateMetadata({ params }: { params: Promise<{ kind: string }> }): Promise<Metadata> {
  const { kind } = await params;
  const name = SECTIONS.find((s) => sectionSlug(s) === kind) ?? kind;
  const n = bySection(kind).length;
  const description = `${n} ${n === 1 ? "interface" : "interfaces"} filed under ${name} in the lookap registry, measured and ready for your agent.`;
  return { title: name, description, alternates: { canonical: `/sections/${kind}` } };
}

async function Inner({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const name = SECTIONS.find((s) => sectionSlug(s) === kind) ?? kind;
  const list = bySection(kind);
  if (list.length === 0) {
    return (
      <div className="flex flex-col gap-2 py-10">
        <h1 className="text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-foreground">{name}</h1>
        <p className="text-[14px] text-subtle">No {name.toLowerCase()} entries yet. <Link href="/feed" className="text-foreground underline underline-offset-2">Browse the feed</Link>.</p>
      </div>
    );
  }
  return <FeedGrid entries={list} title={name} blurb={`${list.length} ${list.length === 1 ? "entry" : "entries"} in the registry.`} />;
}

export default function Page({ params }: PageProps<"/sections/[kind]">) {
  return <Suspense fallback={null}><Inner params={params} /></Suspense>;
}
