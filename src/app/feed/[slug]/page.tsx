import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectPage } from "@/components/ProjectPage";
import { entryMetadata } from "@/lib/seo";
import { bySlug, ENTRIES } from "@/lib/data";

export function generateStaticParams() {
  return ENTRIES.filter((e) => e.kind !== "website").map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = bySlug(slug);
  if (!e) return { title: "Not found" };
  return entryMetadata(e, `/feed/${slug}`);
}

async function Inner({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProjectPage slug={slug} />;
}

export default function Page({ params }: PageProps<"/feed/[slug]">) {
  return <Suspense fallback={null}><Inner params={params} /></Suspense>;
}
