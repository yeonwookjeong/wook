import { COMBINE_INTO, meetings, stemClash, stemCombine, type Meeting } from "./deep";
import { BRANCH_EL, chartOf, stemEl, type Reading } from "./myeongri";
import { BRANCHES, STEMS, type FullPillars } from "./saju";
import { josa } from "./josa";

// One ten-year luck pillar (대운) in words of its own: what that pillar's two characters do with THIS chart's
// four, read from the rules the reading already stands on (합·충·형 between branches, 천간합·충 between stems, an
// element the chart barely has). The grade (활짝 … 버티기) only closes the sentence; what opens it is the reason,
// so two decades with the same grade do not read alike. Computed, no writer.

const BR_GLOSS = ["물", "젖은 흙", "나무", "풀", "봄 흙", "불", "불", "마른 흙", "쇠", "쇠", "마른 흙", "물"];
const ST_GLOSS = ["큰 나무", "꽃", "해", "촛불", "큰 산", "논밭", "바위", "보석", "큰 강", "비"];
const EL_WORD = ["나무", "불", "흙", "쇠", "물"];
// A 삼합 turns its members into one element: 申子辰 물, 巳酉丑 쇠, 寅午戌 불, 亥卯未 나무.
const TRIAD_EL = ["물", "쇠", "불", "나무"];
const COUNT = ["", "", "두", "세", "네"];

type G = { hanja: string; gloss: string };
const br = (b: number): G => ({ hanja: BRANCHES[b], gloss: BR_GLOSS[b] });
const st = (s: number): G => ({ hanja: STEMS[s], gloss: ST_GLOSS[s] });
// 丑(젖은 흙), then the particle that fits the gloss: "丑(젖은 흙)이", "亥(물)가".
const tag = (g: G, pair: "이/가" | "은/는" | "과/와" | "을/를" = "이/가") => `${g.hanja}(${g.gloss})${josa(g.gloss, pair).slice(g.gloss.length)}`;
const bare = (g: G) => `${g.hanja}(${g.gloss})`;
// The particle that follows a word, alone: josa("물", "이/가") → "가".
const pt = (word: string, pair: "이/가" | "은/는" | "과/와" | "을/를" | "으로/로") => josa(word, pair).slice(word.length);

export type Level = 1 | 2 | 3 | 4 | 5; // 버티기 … 활짝

type Pick = { score: number; head: string; why: string };

// The branch that completes a 삼합 with two of its three present (寅午戌 with 寅 and 戌 → 午), else null.
const THIRD = (a: number, b: number) => (a % 4 === b % 4 && a !== b ? [0, 1, 2, 3].map((k) => (a % 4) + 4 * k).find((x) => x !== a && x !== b)! : null);

export function decadeLine(p: FullPillars, r: Reading, d: { stem: number; branch: number; from: number; to: number }, level: Level, young: boolean) {
  const slots = chartOf(p);
  // A childhood decade is not graded, so its sentences stay neutral.
  const good = !young && level >= 4;
  const hard = !young && level <= 2;
  const picks: Pick[] = [];

  // ── the decade's branch against each branch the chart holds (a repeated branch is named once, with its count)
  const held = new Map<number, number>();
  for (const s of slots) if (s.branch !== null) held.set(s.branch, (held.get(s.branch) ?? 0) + 1);
  const have = new Set(held.keys());
  for (const [b, n] of held) {
    const A = br(d.branch);
    const B = br(b);
    // "戌(마른 흙) 세 개" counts a repeated branch; the particle follows the last word spoken.
    const lab = n >= 2 ? `${bare(B)} ${COUNT[Math.min(n, 4)]} 개` : bare(B);
    const last = n >= 2 ? "개" : B.gloss;
    const Bw = `${lab}${pt(last, "과/와")}`; // …와
    const Bs = `${lab}${pt(last, "이/가")}`; // …이
    const Aw = tag(A, "과/와");
    const Ai = tag(A);
    const ms: Meeting[] = meetings(d.branch, b);
    const weight = (base: number) => base + (n >= 2 ? 6 : 0);
    if (ms.includes("충"))
      picks.push({
        score: weight(92),
        head: `${Ai} ${Bw} 정면으로 부딪히는 10년`,
        why: `${Ai} ${Bw} 정면으로 부딪혀요(충). ${good ? "움직이며 판이 새로 짜이는 때예요." : "자리가 흔들리고 묻어 둔 것이 드러나요."}`,
      });
    if (ms.includes("육합"))
      picks.push({
        score: weight(84),
        head: `${Ai} ${Bw} 손잡는 10년`,
        why: `${Ai} ${Bw} 손잡아요(합). ${hard ? "끌리는 만큼 발목도 잡혀요." : "사람과 일이 짝을 이뤄요."}`,
      });
    if (ms.includes("삼합")) {
      const third = THIRD(d.branch, b);
      const el = TRIAD_EL[d.branch % 4];
      const missing = third !== null && !have.has(third);
      const year = missing ? Array.from({ length: d.to - d.from + 1 }, (_, i) => d.from + i).find((y) => (((y - 4) % 12) + 12) % 12 === third) : undefined;
      picks.push({
        score: weight(missing ? 66 : 88),
        head: missing ? `${Ai} ${Bw} 만나 ${el} 기운이 모이는 10년` : `${el} 기운이 삼합으로 완성되는 10년`,
        why: `${Ai} ${Bw} 만나 ${el} 기운이 모여요.${year ? ` ${year}년에 ${tag(br(third!))} 오면 삼합이 완성돼요.` : ""}`,
      });
    }
    if (ms.includes("형"))
      picks.push({
        score: weight(72),
        head: `${Aw} ${Bs} 엇갈려 다듬어지는 10년`,
        why: `${Aw} ${Bs} 서로 엇갈려요(형). ${good ? "부딪히며 단단해져요." : "깎이고 다듬어지는 시간이에요."}`,
      });
    if (ms.includes("원진"))
      picks.push({ score: weight(52), head: `${Aw} ${Bs} 서먹해 생각이 많아지는 10년`, why: `${Aw} ${Bs} 서먹해요(원진). 속으로 생각이 많아지기 쉬워요.` });
    if (ms.includes("파"))
      picks.push({ score: weight(46), head: `${Aw} ${Bs} 어긋나 계획이 흔들리는 10년`, why: `${Aw} ${Bs} 어긋나요(파). 계획이 한 번씩 틀어지기 쉬워요.` });
    if (ms.includes("해"))
      picks.push({ score: weight(42), head: `${Aw} ${Bs} 서로 발목을 잡는 10년`, why: `${Aw} ${Bs} 서로 발목을 잡아요(해).` });
  }

  // ── the decade's stem against the chart's stems (the day stem counts for more)
  const seen = new Set<number>();
  for (const s of slots) {
    if (s.stem === null || seen.has(s.stem)) continue;
    seen.add(s.stem);
    const day = s.pos === "일";
    const S = st(d.stem);
    const T = st(s.stem);
    const how = day ? "일간 " : "원국의 ";
    if (stemCombine(d.stem, s.stem)) {
      const into = EL_WORD[COMBINE_INTO[Math.min(d.stem, s.stem) % 5]];
      picks.push({
        score: day ? 86 : 74,
        head: `${tag(S)} ${how}${tag(T, "과/와")} 합해 짝이 되는 10년`,
        why: `${tag(S)} ${how}${tag(T, "과/와")} 합해요(천간합). ${into} 기운으로 묶여요.`,
      });
    } else if (stemClash(d.stem, s.stem))
      picks.push({
        score: day ? 90 : 76,
        head: `${tag(S)} ${how}${tag(T, "과/와")} 부딪히는 10년`,
        why: `${tag(S)} ${how}${tag(T, "과/와")} 부딪혀요(천간충). ${good ? "낡은 틀이 깨져요." : hard ? "마음이 흔들리기 쉬워요." : "서로 밀고 당겨요."}`,
      });
  }

  // ── elements the chart barely holds, coming in for the first time (named once, even if stem and branch both bring one)
  const sum = r.weights.reduce((a, b) => a + b, 0) || 1;
  const fresh: { el: number; src: G }[] = [];
  for (const [el, src] of [[stemEl(d.stem), st(d.stem)] as const, [BRANCH_EL[d.branch], br(d.branch)] as const])
    if (r.weights[el] / sum <= 0.04 && !fresh.some((f) => f.el === el)) fresh.push({ el, src });
  if (fresh.length) {
    const names = fresh.map((f) => EL_WORD[f.el]);
    const who = fresh.map((f) => `${bare(f.src)}${pt(f.src.gloss, "으로/로")}`).join(", ");
    picks.push({
      score: 70,
      head: `처음으로 ${names.join(", ")} 기운이 들어오는 10년`,
      why: `원국에 거의 없던 ${names.join(", ")} 기운이 ${who} 처음 크게 들어와요.`,
    });
  }

  // ── the first two by weight, different in kind
  picks.sort((a, b) => b.score - a.score);
  const top = picks.slice(0, 2);
  const S = st(d.stem);
  const B = br(d.branch);
  const head = top[0]?.head ?? `${bare(S)} 기운에 ${bare(B)}${pt(B.gloss, "이/가")} 깔린 10년`;
  const coda = young
    ? "자라는 동안 이 기운이 환경으로 작용했어요."
    : (
        {
          5: "필요한 기운이 크게 들어와 힘이 확 붙는 때예요.",
          4: "필요한 기운이 들어와 힘이 붙는 때예요.",
          3: "좋고 나쁨이 섞여 흐름이 고른 때예요.",
          2: "크게 벌이기보다 기반을 다지는 쪽이 어울려요.",
          1: "무리하지 말고 정리하며 버티는 쪽이 어울려요.",
        } as const
      )[level];
  const why = [...top.map((x) => x.why), ...(top.length ? [] : [`${tag(S)} ${bare(B)}에 얹혀 흐르는 때예요.`]), coda].join(" ");
  return { line: head, why };
}
