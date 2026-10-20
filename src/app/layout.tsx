import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Doto } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/TopBar";
import { ChipNav } from "@/components/ChipNav";
import { Footer } from "@/components/Footer";
import { Sounds } from "@/components/Sounds";

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
        <div className="relative mx-auto flex min-h-screen w-full max-w-[1680px] flex-col bg-canvas p-4 ring-1 ring-line">
          <Suspense fallback={null}>
            <ChipNav />
          </Suspense>
          <main className="relative flex min-w-0 flex-1 flex-col">{children}</main>
          <Footer />
        </div>
        {/* progressive blur along the bottom edge: content softens and fades into the gutter as it leaves the viewport */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] h-40">
          <i className="absolute inset-0 backdrop-blur-[1px] [mask-image:linear-gradient(to_top,#000_0%,#000_60%,transparent_100%)]" />
          <i className="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,#000_0%,#000_50%,transparent_85%)]" />
          <i className="absolute inset-0 backdrop-blur-[4px] [mask-image:linear-gradient(to_top,#000_0%,#000_40%,transparent_70%)]" />
          <i className="absolute inset-0 backdrop-blur-[8px] [mask-image:linear-gradient(to_top,#000_0%,#000_30%,transparent_55%)]" />
          <i className="absolute inset-0 backdrop-blur-[16px] [mask-image:linear-gradient(to_top,#000_0%,#000_20%,transparent_40%)]" />
          <i className="absolute inset-0 backdrop-blur-[32px] [mask-image:linear-gradient(to_top,#000_0%,#000_8%,transparent_25%)]" />
        </div>
      </body>
    </html>
  );
}
