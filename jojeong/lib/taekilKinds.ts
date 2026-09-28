// What a 택일 can be for, and how many months one search covers. Kept apart from lib/taekil.ts (and its
// almanac library) so the form can import it.
// - yi: the almanac's 宜 words that make a day a candidate (empty: every day is, and the chart decides).
// - weekend: whether the undertaking usually needs a weekend, so the weekend picks are worth showing.
// - hours: the paywall's line on the practical hours.
// - hidden: kept only so reports bought under it still open; never offered in the form.
type Spec = { label: string; title: string; yi: readonly string[]; people: 1 | 2; weekend: boolean; hours: string; hidden?: true };

export const KINDS = {
  wedding: { label: "결혼", title: "결혼 택일", yi: ["嫁娶"], people: 2, weekend: true, hours: "좋은 시간과 예식 시간" },
  meet: { label: "상견례·약혼", title: "상견례·약혼 택일", yi: ["纳采", "订盟", "会亲友"], people: 2, weekend: true, hours: "좋은 시간과 상견례 자리 시간" },
  move: { label: "이사·입주", title: "이사 택일", yi: ["入宅", "移徙"], people: 1, weekend: true, hours: "좋은 시간과 손 방향, 그해 피할 방향" },
  shop: { label: "개업", title: "개업 택일", yi: ["开市"], people: 1, weekend: false, hours: "문 열기 좋은 시간" },
  deal: { label: "계약·매매", title: "계약·매매 택일", yi: ["立券", "交易", "置产"], people: 1, weekend: false, hours: "도장 찍기 좋은 시간" },
  build: { label: "공사·인테리어", title: "공사·인테리어 택일", yi: ["动土", "修造"], people: 1, weekend: false, hours: "첫 삽 뜨기 좋은 시간" },
  travel: { label: "여행·출장", title: "여행·출장 택일", yi: ["出行"], people: 1, weekend: true, hours: "출발하기 좋은 시간" },
  exam: { label: "면접·시험", title: "면접·시험 택일", yi: [], people: 1, weekend: false, hours: "그날 머리가 맑은 시간" },
  open: { label: "개업·계약", title: "개업·계약 택일", yi: ["开市", "立券", "交易"], people: 1, weekend: false, hours: "좋은 시간과 계약 시간", hidden: true },
} as const satisfies Record<string, Spec>;
export type Kind = keyof typeof KINDS;
export const kindOf = (v: unknown): Kind | null => (typeof v === "string" && v in KINDS ? (v as Kind) : null);
// The kinds a new search can choose.
export const OFFERED = (Object.keys(KINDS) as Kind[]).filter((k) => !("hidden" in KINDS[k]));
export const SPANS = [1, 3] as const;
