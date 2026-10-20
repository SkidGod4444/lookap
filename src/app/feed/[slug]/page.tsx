import { Suspense } from "react";
import { ProjectPage } from "@/components/ProjectPage";
import { ENTRIES } from "@/lib/data";

export function generateStaticParams() {
  return ENTRIES.filter((e) => e.kind !== "website").map((e) => ({ slug: e.slug }));
}

async function Inner({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProjectPage slug={slug} />;
}

export default function Page({ params }: PageProps<"/feed/[slug]">) {
  return <Suspense fallback={null}><Inner params={params} /></Suspense>;
}
