// What the other person in a 사랑방 is to the guest (lib/bond.ts reads each differently). Kept apart so the
// forms in the browser can list them without the chart engine.
export const RELS = ["연인", "가족", "일", "친구"] as const;
export type Rel = (typeof RELS)[number];
export const REL_LABEL: Record<Rel, string> = { 연인: "연인·배우자", 가족: "가족", 일: "일 (동료·동업·상사)", 친구: "친구" };
