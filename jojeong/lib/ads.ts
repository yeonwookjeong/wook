// Google AdSense, off until both values are set in the environment (and the site redeployed):
// NEXT_PUBLIC_ADSENSE_CLIENT = "ca-pub-…" (the account) and NEXT_PUBLIC_ADSENSE_SLOT = the display ad unit's id.
// Ads only ever show on the free Joseon pages; the paid reports and the main page stay clean.
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";
export const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT ?? "";
export const adsOn = /^ca-pub-\d{10,20}$/.test(ADSENSE_CLIENT) && /^\d{6,12}$/.test(ADSENSE_SLOT);
// The account alone is enough for AdSense to verify the site (meta tag, ads.txt).
export const adsAccount = /^ca-pub-\d{10,20}$/.test(ADSENSE_CLIENT) ? ADSENSE_CLIENT : null;
