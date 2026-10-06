import type { MetadataRoute } from "next";

// Lets visitors add 훈도사주 to their phone's home screen and open it like an app (components/InstallPrompt.tsx
// shows them how). The English pages carry their own (app/en/manifest.webmanifest).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "훈도사주 · 관상감 명과학 훈도",
    short_name: "훈도사주",
    description: "평생 사주, 궁합, 운세를 정 훈도가 풀어 드려요.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4ecdb",
    theme_color: "#f4ecdb",
    lang: "ko",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
