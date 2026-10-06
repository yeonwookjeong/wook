// The English site's home-screen app: opens on /en.
export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      name: "Hundo Saju · Korean Four Pillars",
      short_name: "Hundo Saju",
      description: "Your Korean saju, read by Hundo, a scholar of the Joseon royal observatory.",
      start_url: "/en",
      scope: "/en",
      display: "standalone",
      background_color: "#f4ecdb",
      theme_color: "#f4ecdb",
      lang: "en",
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "content-type": "application/manifest+json" } },
  );
}
