// Words a written report must not carry, checked after it is written (the text has streamed by then, so a hit is
// told to the owner, not hidden): for 재회운, promising a return, saying what the other person feels, fate, odds, and
// running the other person down (2026-10-23 강 어사 진단, E). The writer is told the same in its brief
// (lib/reunion.ts reunionBrief). Read sentence by sentence; one that says the thing in order to deny or soften it
// ("반드시 돌아와야 한다는 생각은 내려놓으세요", "~할 수 있어요") is not a hit.
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// The other person, by the usual words and by name (`○○님`, `○○ 씨`).
const themOf = (names: string[]) => String.raw`(?:그\s*사람|그분|상대(?:방)?|그\s*쪽${names.map((n) => `|${esc(n)}\s*(?:님|씨)?`).join("")})`;
const FATE = { re: /운명(?:의\s*(?:상대|짝|사람)|처럼|이야|이에요|이랍니다|적)/, why: "운명 단정" };
const ODDS = { re: /(?:확률|가능성)[은는이가]?\s*\d+\s*(?:%|퍼센트)|\d+\s*(?:%|퍼센트)\s*(?:의\s*)?(?:확률|가능성)|열에\s*\S+[은는]/, why: "확률" };
type Rule = { re: RegExp; why: string; hard?: boolean };
// Every other written text (the life, love, money, work and year reports, 속궁합, 정 훈도의 묻기 답): fate, odds, a
// promised result, an ending said as certain, and a death or grave illness foretold (2026-10-26 엔진 점검 4번).
// Outside 궁합 '오래 못 가' is said of money and luck too: an ending only when it is about the two of them.
const ENDING_PEOPLE = {
  re: /(?:결국|반드시|분명(?:히)?|언젠가)\s*(?:헤어(?:지|져|질)|이혼|갈라(?:서|설|선))|헤어지게\s*(?:돼|될)|이혼(?:하게\s*(?:돼|될)|할\s*(?:거|운명))|결혼(?:은|을)?\s*못\s*(?:해|할|하게|한다)|(?:사이|관계|인연|연애|두\s*사람)[^.!?\n]{0,10}오래\s*못\s*(?:가|간다|갈)/,
  why: "결말 단정",
};
// "이 사람과는 미래가 없어요": no future said of the two of them (not "돈 걱정할 미래는 없어요").
const NO_FUTURE = { re: /(?:사이|관계|인연|두\s*사람|이\s*사람과(?:는)?)[^.!?\n]{0,10}(?:미래|희망|가망)(?:이|가|은|는)?\s*없/, why: "결말 단정", hard: true };
// Any syllable closing on ㅆ (했·셨·았·었·컸…): "~했을 거예요" guesses the reader's past as fact (PAST_V6, 2026-10-26 강 어사).
// "있을 거예요" is left out: mostly the present or a scene to come ("그런 때가 있을 거예요").
const SS = Array.from({ length: 399 }, (_, i) => String.fromCharCode(0xac00 + i * 28 + 20)).join("").replace("있", "");
const PAST = { re: new RegExp(`[${SS}]을\\s*(?:거(?:예요|에요|외다|옵니다)|겁니다|테(?:지요|죠)|것(?:이옵니다|입니다|이에요|이외다))`), why: "과거 단정" };
const PROMISE = {
  re: /(?:반드시|틀림없이|무조건|100\s*%)\s*[^.!?\n]{0,15}(?:돼요|됩니다|되옵니다|와요|나와요|(?:나|들어|찾아)(?:옵니다|오옵니다)|생겨요|생깁니다|생기옵니다|이뤄(?:져요|집니다|지옵니다)|성공해요|성공합니다|부자가)/,
  why: "결과 약속",
};
const GENERIC = (): Rule[] => [
  FATE,
  ODDS,
  ENDING_PEOPLE,
  NO_FUTURE,
  PROMISE,
  PAST,
  { re: /단명|요절(?!복통)|큰\s*병(?:에|이|을)?\s*(?:걸|생기|찾아)|사별(?:해|하게|할)|(?<!기가\s?)죽(?:어요|습니다|게\s*돼)/, why: "죽음·큰 병 단정" },
];

// `lover`: false for 궁합 between family, at work or friends, where talk of love and the spouse seat hurts however
// softly it is said (hard: no softening excuses it) (2026-10-25).
const RISKY: Partial<Record<string, (THEM: string, lover: boolean) => Rule[]>> = {
  gunghap: (_, lover) => [
    FATE,
    ODDS,
    PAST,
    { re: /천생연분|평생\s*(?:함께\s*갈|가는)\s*(?:인연|사이)/, why: "운명 단정" },
    {
      re: /(?:결국|반드시|분명(?:히)?|언젠가)\s*(?:헤어(?:지|져|질)|이혼|갈라(?:서|설|선))|헤어지게\s*(?:돼|될)|이혼(?:하게\s*(?:돼|될)|할\s*(?:거|운명))|결혼(?:은|을)?\s*못\s*(?:해|할|하게|한다)|결혼(?:하기)?(?:는|가)?\s*어려|오래\s*못\s*(?:가|간다|갈)/,
      why: "결말 단정",
    },
    ...(lover ? [] : [{ re: /배우자|연애|설렘|끌림|(?:남편|아내|연인)처럼|이성으로\s*(?:느끼|보|끌)|결혼/, why: "연인 아닌 관계에 연애 말", hard: true }]),
  ],
  jaehoe: (THEM) => [
    PAST,
    { re: /(?:반드시|꼭|분명(?:히)?|결국)\s*(?:다시\s*)?(?:돌아(?:와|오|올)|만나(?:게|요|게\s*돼)|이어(?:져|질|지게)|연락(?:이\s*(?:와|올)|해\s*올))/, why: "재회 약속" },
    { re: /기다리(?:면|시면)[^.!?\n]{0,20}(?:와요|올\s*거|돌아|연락이\s*(?:와|올))/, why: "기다림 권유" },
    { re: /운명(?:의\s*(?:상대|짝|사람)|처럼|이야|이에요|이랍니다|적)/, why: "운명 단정" },
    { re: new RegExp(String.raw`${THEM}[은는이가도]?[^.!?\n]{0,12}(?:아직|여전히|지금도)[^.!?\n]{0,15}(?:사랑|그리워|미련|생각(?:하|뿐|해)|잊지\s*못)`), why: "상대 마음 단정" },
    { re: /(?:확률|가능성)[은는이가]?\s*\d+\s*(?:%|퍼센트)|\d+\s*(?:%|퍼센트)\s*(?:의\s*)?(?:확률|가능성)|열에\s*\S+[은는]|(?:재회|돌아올|만날)\s*(?:확률|가능성)[이은는]\s*(?:높|커|크)/, why: "확률" },
    { re: new RegExp(String.raw`(?:${THEM}|새\s*(?:연인|애인|여자친구|남자친구))[은는이가]?[^.!?\n]{0,12}(?:못된|나쁜\s*사람|형편없|수준\s*낮|쓰레기|별로인\s*사람)`), why: "상대·새 연인 깎아내림" },
  ],
};
// A clause that softens or denies what it names ("~할 수 있어요", "~해야 한다는 생각은", "~인 건 아니에요"). Read
// per clause (split at commas too), so a soft word elsewhere in the sentence ("걱정하지 마세요") excuses nothing.
const SOFT = /수\s*(?:도\s*)?있|쉬운|지도\s*몰|건\s*아니|야\s*(?:한다|하는|할)|야\s*하(?:옵|오|세|시)|편이|면\s*좋|거라고\s*믿기보다|아니에요|아니지만|아니라|아니(?:옵니다|오|사옵니다|외다)|(?:할|걱정할)\s*(?:일|필요)[은는이가]?\s*없|사주는\s*없/;
// The next clause quoting it back ("운명이에요, 라고 말하는 곳도…").
const QUOTED = /^\s*(?:이?라(?:고|는)|하는\s*말)/;

// `them`: the other person's name, so "현우님은 아직…" is read like "그 사람은 아직…".
export function riskyLines(productId: string, text: string, them: string[] = [], lover = true): string[] {
  const rules = (RISKY[productId] ?? GENERIC)(themOf(them.filter(Boolean)), lover);
  if (!rules) return [];
  const hits: string[] = [];
  const clauses = text.split(/(?<=[.!?。])\s+|\n+|[,，]/);
  clauses.forEach((clause, i) => {
    const soft = SOFT.test(clause) || QUOTED.test(clauses[i + 1] ?? "");
    for (const { re, why, hard } of rules) {
      if (soft && !hard) continue;
      const m = clause.match(re);
      if (m) hits.push(`${why}: "${m[0]}"`);
    }
  });
  return [...new Set(hits)];
}
