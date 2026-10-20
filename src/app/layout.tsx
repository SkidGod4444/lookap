import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/TopBar";
import { ChipNav } from "@/components/ChipNav";
import { Footer } from "@/components/Footer";
import { Sounds } from "@/components/Sounds";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], axes: ["opsz"] });

export const metadata: Metadata = {
  title: "lookap",
  description: "Hand-picked interfaces worth rebuilding, and a pipeline that turns any demo video into a working component.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
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
      </body>
    </html>
  );
}
