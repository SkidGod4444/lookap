import type { Metadata } from "next";

export const metadata: Metadata = { title: "Account", description: "Your lookap MCP keys.", robots: { index: false, follow: false } };

export default function Layout({ children }: LayoutProps<"/account">) {
  return children;
}
