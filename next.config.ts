import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      // Guide "photo" blocks fall back to embedding small images as a
      // data: URI directly in the DB when no Vercel Blob store is
      // connected (see add-block.tsx). That pushes a form submission
      // past Next's 1mb default server-action body limit, so raise it
      // enough to cover the 2MB file cap used for that fallback.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
