import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo root holds a separate Expo app with its own lockfile.
  turbopack: { root: __dirname },
  outputFileTracingRoot: __dirname,
  // Share images read these files from disk at request time.
  outputFileTracingIncludes: {
    "/court/**": ["./assets/fonts/**/*", "./public/**/*"],
    "/opengraph-image": ["./assets/fonts/**/*", "./public/**/*"],
  },
};

export default nextConfig;
