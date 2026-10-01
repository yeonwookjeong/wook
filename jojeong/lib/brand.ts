// The site: 정 훈도's present-day readings. "왕이 될 사주" is its free, shareable Joseon game (/king).
export const SITE_NAME = "훈도사주";
export const SITE_TAGLINE = "누구에게나 맞는 말 말고, 나한테만 맞는 말";
export const SERVICE_NAME = "왕이 될 사주";
export const TAGLINE = "관상감 막내 정 훈도가 봐드리는 궁중 사주";
export const CHARACTER_NAME = "관상감 막내 · 정 훈도";
// What the site is, in one breath: for search engines (the JSON-LD in app/layout.tsx) and the about page.
export const SITE_SUMMARY =
  "훈도사주는 생년월일로 사주를 풀어 주는 웹 서비스예요. 무료 사주 분석과 신년 운세부터 평생 사주, 궁합, 연애, 재물, 직업, 택일 보고서까지, 조선 관상감 명과학 훈도 '정 훈도'가 어려운 용어 없이 풀어 드려요. 생년월일은 저장하지 않아요.";
export const SNS_URLS = ["https://www.instagram.com/hundosaju/", "https://www.threads.com/@hundosaju"];
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
