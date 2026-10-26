// What the other person in a 사랑방 is to the guest (lib/bond.ts reads each differently). Kept apart so the
// forms in the browser can list them without the chart engine.
export const RELS = ["연인", "가족", "일", "친구"] as const;
export type Rel = (typeof RELS)[number];
export const REL_LABEL: Record<Rel, string> = { 연인: "연인·배우자", 가족: "가족", 일: "일 (동료·동업·상사)", 친구: "친구" };

// The seat each relation lives in, named for the reader by where the letter sits (궁합, 2026-10-25 강 어사 기준):
// only lovers have a '배우자 자리'; for the rest the line says whose letter it is, not what the seat means.
export const SEAT_NAME: Record<Rel, string> = { 연인: "태어난 날 아래 글자", 일: "태어난 달 아래 글자", 친구: "태어난 달 아래 글자", 가족: "태어난 해 아래 글자" };
export const seatOf = (p: { dayBranch: number; monthBranch?: number; yearBranch: number }, rel: Rel) =>
  rel === "연인" ? p.dayBranch : rel === "가족" ? p.yearBranch : (p.monthBranch ?? p.dayBranch);
// 子午卯酉: a 반합 with one of these in it is a real half of the three-way combination.
export const halfCombine = (x: number, y: number) => x !== y && x % 4 === y % 4 && (x % 3 === 0 || y % 3 === 0);
