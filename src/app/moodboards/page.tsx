import type { Metadata } from "next";
import { Boards } from "@/components/Boards";

export const metadata: Metadata = { title: "Moodboards", robots: { index: false, follow: false } };

export default function Page() {
  return <Boards />;
}
