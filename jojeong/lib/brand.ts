export const SERVICE_NAME = "왕이 될 사주";
export const TAGLINE = "관상감 막내 정 훈도가 봐드리는 궁중 사주";
export const CHARACTER_NAME = "관상감 막내 · 정 훈도";
// Cut from assets/hundo-sheet.webp; each file lives in public/.
export const CHARACTER = {
  face: "/hundo-face.png",
  bust: "/hundo.png",
  bow: "/hundo-bow.png",
  fan: "/hundo-fan.png",
  shock: "/hundo-shock.png",
  decree: "/hundo-decree.png",
} as const;
export type Mood = keyof typeof CHARACTER;

export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
