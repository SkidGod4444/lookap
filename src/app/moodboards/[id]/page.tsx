import type { Metadata } from "next";
import { Suspense } from "react";
import { Board } from "@/components/Boards";

export const metadata: Metadata = { title: "Moodboard", robots: { index: false, follow: false } };

/* The id is read on the client from the URL, so this page has no dynamic server access to cache around. */
export default function Page() {
  return <Suspense fallback={null}><Board /></Suspense>;
}
