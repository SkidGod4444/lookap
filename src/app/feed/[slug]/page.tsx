import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectPage } from "@/components/ProjectPage";
import { bySlug, ENTRIES } from "@/lib/data";

export function generateStaticParams() {
  return ENTRIES.filter((e) => e.kind !== "website").map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = bySlug(slug);
  if (!e) return { title: "Not found" };
  const title = e.title;
  const description = `${e.description} ${e.category}, ${e.types.join(", ")}. In the lookap registry, measured for your agent.`;
  return {
    title,
    description,
    alternates: { canonical: `/feed/${slug}` },
    openGraph: { url: `/feed/${slug}`, type: e.video ? "video.other" : "article", siteName: "lookap", locale: "en_US" },
  };
}

async function Inner({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProjectPage slug={slug} />;
}

export default function Page({ params }: PageProps<"/feed/[slug]">) {
  return <Suspense fallback={null}><Inner params={params} /></Suspense>;
}
