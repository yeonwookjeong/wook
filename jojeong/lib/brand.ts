export const SERVICE_NAME = "나의 조정";
export const TAGLINE = "사주로 뽑는 나만의 조정";
export const CHARACTER_NAME = "명과학 훈도 서운";
// Swap this for the AI-generated character (e.g. /seoun.png) once it's ready.
export const CHARACTER_IMAGE = "/seoun.svg";

export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
