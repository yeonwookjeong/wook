// 삼재(三災): the folk belief that each 띠 meets three unlucky years in a row every twelve years. The 띠 of one
// 삼합 group share them: 申子辰 → 寅卯辰, 巳酉丑 → 亥子丑, 寅午戌 → 申酉戌, 亥卯未 → 巳午未 (들·눌·날삼재).

export const TTI = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];
const STAGES = ["들삼재", "눌삼재", "날삼재"] as const;
// The first 삼재 branch for each 띠 (by branch index 子=0 … 亥=11).
const START = [2, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8, 5];
const branchOfYear = (year: number) => (((year - 4) % 12) + 12) % 12;

export type Samjae = { stage: (typeof STAGES)[number] | null; next: [number, number, number] };

// Where a 띠 stands in `year`, and its current or next three 삼재 years.
export function samjaeOf(tti: number, year: number): Samjae {
  const offset = (branchOfYear(year) - START[tti] + 12) % 12;
  const stage = offset < 3 ? STAGES[offset] : null;
  const first = offset < 3 ? year - offset : year + (12 - offset);
  return { stage, next: [first, first + 1, first + 2] };
}
