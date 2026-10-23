import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "From $1 a month. Starter builds from the designer's frames and a checklist; Pro measures the clip and proves the rebuild, with a React, Tailwind and Motion guide; Max gets finished rebuilds.",
  alternates: { canonical: "/pricing" },
};

export default function Layout({ children }: LayoutProps<"/pricing">) {
  return children;
}
