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
  // Once the own domain works, CANONICAL_HOST (e.g. hundosaju.com) sends the old vercel.app address there,
  // path and query kept, so links already shared keep working. Unset: no redirect.
  async redirects() {
    const canonical = process.env.CANONICAL_HOST?.trim();
    if (!canonical || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(canonical)) return [];
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "wangsaju.vercel.app" }],
        destination: `https://${canonical}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
