// Words a written report must not carry, checked after it is written (the text has streamed by then, so a hit is
// told to the owner, not hidden): for 재회운, promising a return, saying what the other person feels, fate, odds, and
// running the other person down (2026-10-23 강 어사 진단, E). The writer is told the same in its brief
// (lib/reunion.ts reunionBrief). Read sentence by sentence; one that says the thing in order to deny or soften it
// ("반드시 돌아와야 한다는 생각은 내려놓으세요", "~할 수 있어요") is not a hit.
const THEM = String.raw`(?:그\s*사람|그분|상대(?:방)?|그\s*쪽)`;
const RISKY: Partial<Record<string, { re: RegExp; why: string }[]>> = {
  jaehoe: [
    { re: /(?:반드시|꼭|분명(?:히)?|결국)\s*(?:다시\s*)?(?:돌아(?:와|오|올)|만나(?:게|요|게\s*돼)|이어(?:져|질|지게))/, why: "재회 약속" },
    { re: /기다리(?:면|시면)[^.!?\n]{0,20}(?:와요|올\s*거|돌아|연락이\s*(?:와|올))/, why: "기다림 권유" },
    { re: /운명(?:의\s*(?:상대|짝|사람)|처럼|이야|이에요|이랍니다|적)/, why: "운명 단정" },
    { re: new RegExp(String.raw`${THEM}[은는이가도]?[^.!?\n]{0,12}(?:아직|여전히|지금도)[^.!?\n]{0,15}(?:사랑|그리워|미련|생각(?:하|뿐|해)|잊지\s*못)`), why: "상대 마음 단정" },
    { re: /(?:확률|가능성)[은는이가]?\s*\d+\s*(?:%|퍼센트)|\d+\s*(?:%|퍼센트)\s*(?:의\s*)?(?:확률|가능성)|열에\s*\S+[은는]|(?:재회|돌아올)\s*(?:확률|가능성)이\s*(?:높|커)/, why: "확률" },
    { re: new RegExp(String.raw`(?:${THEM}|새\s*(?:연인|애인|여자친구|남자친구))[은는이가]?[^.!?\n]{0,12}(?:못된|나쁜\s*사람|형편없|수준\s*낮|쓰레기|별로인\s*사람)`), why: "상대·새 연인 깎아내림" },
  ],
};
// A sentence that denies or softens what it names.
const SOFT = /수\s*(?:도\s*)?있|쉬운|지도\s*몰|건\s*아니|야\s*(?:한다|하는|할)|거라고\s*믿기보다|라고\s*(?:말하|하는)|마세요|말아요|아니에요|않아요/;

export function riskyLines(productId: string, text: string): string[] {
  const rules = RISKY[productId];
  if (!rules) return [];
  const hits: string[] = [];
  for (const sentence of text.split(/(?<=[.!?。])\s+|\n+/)) {
    if (SOFT.test(sentence)) continue;
    for (const { re, why } of rules) {
      const m = sentence.match(re);
      if (m) hits.push(`${why}: "${m[0]}"`);
    }
  }
  return [...new Set(hits)];
}
