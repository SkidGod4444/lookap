import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Doto } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/TopBar";
import { ChipNav } from "@/components/ChipNav";
import { Footer } from "@/components/Footer";
import { Sounds } from "@/components/Sounds";
import { BottomBlur } from "@/components/BottomBlur";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], axes: ["opsz"] });
const doto = Doto({ variable: "--font-doto", subsets: ["latin"], weight: "variable", axes: ["ROND"] });

export const metadata: Metadata = {
  title: "lookap",
  description: "A curated design registry, measured from clips and stills, served to coding agents over MCP.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${doto.variable} h-full antialiased`}>
      <body className="min-h-screen bg-gutter font-sans text-foreground antialiased">
        <Sounds />
        <Suspense fallback={<div className="h-14" />}>
          <TopBar />
        </Suspense>
        <div className="relative mx-auto flex min-h-[calc(100vh_-_57px)] w-full max-w-[1680px] flex-col bg-canvas p-4 ring-1 ring-line">
          <Suspense fallback={null}>
            <ChipNav />
          </Suspense>
          <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </div>
        <Suspense fallback={null}>
          <BottomBlur />
        </Suspense>
      </body>
    </html>
  );
}
