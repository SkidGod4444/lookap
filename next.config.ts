import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  /* Every response declares that text-and-data-mining and AI use are reserved (TDMRep + the noai robots directive). */
  async headers() {
    return [{ source: "/(.*)", headers: [{ key: "X-Robots-Tag", value: "noai, noimageai" }, { key: "TDM-Reservation", value: "1" }, { key: "TDM-Policy", value: "https://lookap.saidev.codes/llms.txt" }] }];
  },
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
