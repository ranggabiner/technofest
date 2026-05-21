import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  images: {
    formats: ["image/webp"],
    qualities: [75, 82, 88],
  },
  turbopack: {
    root: path.resolve(appRoot, "../../"),
  },
};

export default nextConfig;
