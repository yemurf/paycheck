import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // 예전 샘플 체험 주소(/check?sample=1)는 샘플 고르기 주소로 보낸다
  async redirects() {
    return [
      {
        source: "/check",
        has: [{ type: "query", key: "sample", value: "1" }],
        destination: "/check/sample",
        permanent: false,
      },
    ];
  },
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
