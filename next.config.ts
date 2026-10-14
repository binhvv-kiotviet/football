import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (DB local khi chạy dev) dùng file wasm, không bundle
  serverExternalPackages: ["@electric-sql/pglite"],
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
