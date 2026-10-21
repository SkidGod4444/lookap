import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  /* Every response declares that text-and-data-mining and AI use are reserved (TDMRep + the noai robots directive). */
  async headers() {
    return [{ source: "/(.*)", headers: [{ key: "X-Robots-Tag", value: "noai, noimageai" }, { key: "TDM-Reservation", value: "1" }, { key: "TDM-Policy", value: "https://lookap.saidev.codes/llms.txt" }] }];
  },
  /* Catalog media lives on vibrant's CDN; next/image resizes the stills and clip posters to the card width and caches them at the edge. */
  images: { remotePatterns: [{ protocol: "https", hostname: "cdn.vibrant.design", pathname: "/**" }], minimumCacheTTL: 2678400 /* URLs are version-hashed, so a month */ },
  /* the static ffmpeg rides along with the MCP function, so look_at and check_media can read clips on Vercel */
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: { "/api/mcp": ["./node_modules/ffmpeg-static/ffmpeg"] },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
