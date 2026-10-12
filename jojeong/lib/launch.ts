// The renewed site (the free screen with the 만세력 rows, the locks and 2027; the 2027 wording; the note for those
// who come back) opens for everyone at this moment. Before it only the owner's 시안 모드 shows it (lib/admin.ts).
export const RENEWAL_AT = Date.parse("2026-10-13T00:00:00+09:00");
export const RENEWED_ON = "2026-10-13";
// Branch previews (VERCEL_ENV=preview) show it already, so the whole renewal can be walked through before it opens.
export const renewed = (now = Date.now()) => now >= RENEWAL_AT || process.env.VERCEL_ENV === "preview";
