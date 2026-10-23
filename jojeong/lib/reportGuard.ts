// Words a written report must not carry, checked after it is written (the text has streamed by then, so a hit is
// told to the owner, not hidden): for 재회운, promising a return, saying what the other person feels, and odds
// (2026-10-23 강 어사 진단, E). The writer is told the same in its brief (lib/reunion.ts reunionBrief).
const RISKY: Partial<Record<string, { re: RegExp; why: string }[]>> = {
  jaehoe: [
    { re: /반드시\s*(다시\s*)?(돌아|만나|이어)/, why: "재회 약속" },
    { re: /(꼭|분명히?)\s*(다시\s*)?돌아(와|올)/, why: "재회 약속" },
    { re: /기다리면\s*(다시\s*)?(와|올|돌아|연락)/, why: "기다림 권유" },
    { re: /운명(이에요|이랍니다|적인\s*(인연|사이|사람))/, why: "운명 단정" },
    { re: /(그\s*사람|상대|[가-힣]{1,4}님)[은는이가도]?\s*(아직(도)?|여전히)\s*(당신|[가-힣]{1,4}님)[을를]?\s*사랑/, why: "상대 마음 단정" },
    { re: /(확률|가능성)[은는이가]?\s*\d+\s*%|\d+\s*%\s*(의\s*)?(확률|가능성)/, why: "확률" },
  ],
};

export function riskyLines(productId: string, text: string): string[] {
  const rules = RISKY[productId];
  if (!rules) return [];
  const hits: string[] = [];
  for (const { re, why } of rules) {
    const m = text.match(re);
    if (m) hits.push(`${why}: "${m[0]}"`);
  }
  return hits;
}
