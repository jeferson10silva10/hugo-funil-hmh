import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Assets referenciados temporariamente do domínio atual (preview).
     Na virada pra produção, empacotar em /public. */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "hugomiyazakioriental.org" },
    ],
  },
};

export default nextConfig;
