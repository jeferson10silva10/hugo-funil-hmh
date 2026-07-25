import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Assets referenciados temporariamente do domínio atual (preview).
     Na virada pra produção, empacotar em /public. */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "hugomiyazakioriental.org" },
    ],
  },
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
