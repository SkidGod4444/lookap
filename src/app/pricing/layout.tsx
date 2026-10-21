import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Starter keys from a dollar a month. Pro adds measured recipes and media checks. Team adds shared collections. Browsing stays free.",
  alternates: { canonical: "/pricing" },
};

export default function Layout({ children }: LayoutProps<"/pricing">) {
  return children;
}
