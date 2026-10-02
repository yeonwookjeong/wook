// Google AdSense, off until both values are set in the environment (and the site redeployed):
// NEXT_PUBLIC_ADSENSE_CLIENT = "ca-pub-…" (the account) and NEXT_PUBLIC_ADSENSE_SLOT = the display ad unit's id.
// Ads show only on free pages (the Joseon game, 신분 감정, the free 2026 reading, 삼재, 일주 랭킹, 책력) and once in the home
// page's footer; the paid reports and the payment never carry one.
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";
export const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT ?? "";
export const adsOn = /^ca-pub-\d{10,20}$/.test(ADSENSE_CLIENT) && /^\d{6,12}$/.test(ADSENSE_SLOT);
// The account alone is enough for AdSense to verify the site (meta tag, ads.txt).
export const adsAccount = /^ca-pub-\d{10,20}$/.test(ADSENSE_CLIENT) ? ADSENSE_CLIENT : null;
