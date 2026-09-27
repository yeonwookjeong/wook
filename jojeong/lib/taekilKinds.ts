// What a 택일 can be for, and how many months one search covers. Kept apart from lib/taekil.ts (and its
// almanac library) so the form can import it.
export const KINDS = {
  wedding: { label: "결혼", title: "결혼 택일", yi: ["嫁娶"], people: 2 },
  move: { label: "이사·입주", title: "이사 택일", yi: ["入宅", "移徙"], people: 1 },
  open: { label: "개업·계약", title: "개업·계약 택일", yi: ["开市", "立券", "交易"], people: 1 },
} as const;
export type Kind = keyof typeof KINDS;
export const kindOf = (v: unknown): Kind | null => (typeof v === "string" && v in KINDS ? (v as Kind) : null);
export const SPANS = [1, 3] as const;
