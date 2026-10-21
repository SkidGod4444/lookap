import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for using lookap, its registry and its MCP keys.",
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-2 py-10">
      <h1 className="text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-foreground">Terms</h1>
      <p className="max-w-[60ch] text-[14px] leading-[1.55] text-subtle">Browse free. Keys are per person. Full terms before launch.</p>
    </div>
  );
}
