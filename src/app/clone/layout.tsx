import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check a clip or a still",
  description: "Paste a URL or upload a file. lookap reads the pixels and tells you whether it holds an interface, with signals and a verdict.",
  alternates: { canonical: "/clone" },
};

export default function Layout({ children }: LayoutProps<"/clone">) {
  return children;
}
