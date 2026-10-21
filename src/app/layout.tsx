import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { DESCRIPTION, SITE_NAME, SITE_URL, TAGLINE, X_HANDLE } from "@/lib/site";
import { Suspense } from "react";
import { Inter, Doto } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/TopBar";
import { ChipNav } from "@/components/ChipNav";
import { Footer } from "@/components/Footer";
import { Sounds } from "@/components/Sounds";
import { NoInspect } from "@/components/NoInspect";
import { BottomBlur } from "@/components/BottomBlur";
import { Analytics } from "@vercel/analytics/next";
import { AI_NOTICE } from "@/lib/bots";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], axes: ["opsz"] });
const doto = Doto({ variable: "--font-doto", subsets: ["latin"], weight: "variable", axes: ["ROND"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}. ${TAGLINE}`, template: `%s · ${SITE_NAME}` },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["design registry", "MCP", "Claude Code", "Codex", "Cursor", "UI inspiration", "design tokens", "motion recipes", "measured interfaces", "coding agents"],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  category: "technology",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE_NAME, url: "/", locale: "en_US" },
  twitter: { card: "summary_large_image", site: X_HANDLE, creator: X_HANDLE },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  formatDetection: { email: false, telephone: false, address: false },
  other: { "ai-notice": AI_NOTICE, "tdm-reservation": "1" },
};

export const viewport: Viewport = { themeColor: "#0a0a0a", colorScheme: "dark", width: "device-width", initialScale: 1 };

/* Structured data: the site, and the product it sells. Prices mirror /pricing. */
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: SITE_NAME, description: DESCRIPTION, publisher: { "@id": `${SITE_URL}/#org` } },
    { "@type": "Organization", "@id": `${SITE_URL}/#org`, name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/icon.png` },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      url: SITE_URL,
      description: DESCRIPTION,
      offers: [
        { "@type": "Offer", name: "Starter key", price: "1", priceCurrency: "USD", url: `${SITE_URL}/pricing` },
        { "@type": "Offer", name: "Pro key", price: "12", priceCurrency: "USD", url: `${SITE_URL}/pricing` },
        { "@type": "Offer", name: "Team key", price: "39", priceCurrency: "USD", url: `${SITE_URL}/pricing` },
      ],
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${doto.variable} h-full antialiased`}>
      <body className="min-h-screen bg-gutter font-sans text-foreground antialiased">
        <ClerkProvider>
          <Sounds />
          <NoInspect />
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
          <Analytics />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
        </ClerkProvider>
      </body>
    </html>
  );
}
