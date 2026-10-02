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

type Kind = "충" | "육합" | "삼합" | "형" | "원진" | "파" | "해" | "천간합" | "천간충" | "새 기운" | "고름";
type Pick = { score: number; kind: Kind; head: string; why: string };

// What the reader sees: what the decade is like, in plain words, by what happens in it and how it is graded.
// [now or ahead, already past]; a childhood decade has its own line. The hanja and the rule stay in `why`
// (shown when the row is opened) and in `tech`, which is what the report writer is told.
type Plain = { good: [string, string]; mid: [string, string]; hard: [string, string]; young: string };
const same = (now: string, past: string): Plain["good"] => [now, past];
const PLAIN: Record<Kind, Plain> = {
  충: {
    good: same("판이 새로 짜이며 크게 움직이는 10년", "판이 새로 짜이며 크게 움직인 10년"),
    mid: same("변화가 잦아 자리를 옮기기 쉬운 10년", "변화가 잦았던 10년"),
    hard: same("흔들림이 커서 지키는 힘이 필요한 10년", "흔들림이 커서 버티는 힘이 필요했던 10년"),
    young: "환경이 크게 바뀌며 자란 시기",
  },
  육합: {
    good: same("좋은 사람·일과 손잡고 자리를 넓히는 10년", "좋은 사람·일과 손잡고 자리를 넓힌 10년"),
    mid: same("사람과 일이 엮이며 자리가 잡히는 10년", "사람과 일이 엮이며 자리가 잡힌 10년"),
    hard: same("얽힌 관계에 발이 묶이기 쉬운 10년", "얽힌 관계에 발이 묶이기 쉬웠던 10년"),
    young: "가까운 사람들과 정을 쌓으며 자란 시기",
  },
  삼합: {
    good: same("흩어진 힘이 한곳으로 모여 밀고 나가는 10년", "흩어진 힘이 한곳으로 모여 밀고 나간 10년"),
    mid: same("힘이 한데 모여 방향이 잡히는 10년", "힘이 한데 모여 방향이 잡힌 10년"),
    hard: same("한쪽으로 힘이 쏠려 균형을 챙겨야 할 10년", "한쪽으로 힘이 쏠려 균형이 아쉬웠던 10년"),
    young: "한 가지에 힘이 모이며 자란 시기",
  },
  형: {
    good: same("부딪히며 더 단단해지는 10년", "부딪히며 더 단단해진 10년"),
    mid: same("작은 마찰 속에 무뎌지지 않고 다듬어지는 10년", "작은 마찰 속에 다듬어진 10년"),
    hard: same("깎이고 다듬어지며 실력을 쌓는 10년", "깎이고 다듬어지며 실력을 쌓은 10년"),
    young: "부대끼며 단단해진 시기",
  },
  원진: {
    good: same("속마음이 복잡해지기 쉬운 10년", "속마음이 복잡했던 10년"),
    mid: same("속마음이 복잡해지기 쉬운 10년", "속마음이 복잡했던 10년"),
    hard: same("속마음이 복잡해지기 쉬운 10년", "속마음이 복잡했던 10년"),
    young: "마음속 생각이 많던 시기",
  },
  파: {
    good: same("계획이 한 번씩 틀어지기 쉬운 10년", "계획이 한 번씩 틀어지곤 했던 10년"),
    mid: same("계획이 한 번씩 틀어지기 쉬운 10년", "계획이 한 번씩 틀어지곤 했던 10년"),
    hard: same("계획이 한 번씩 틀어지기 쉬운 10년", "계획이 한 번씩 틀어지곤 했던 10년"),
    young: "계획대로만 되지 않던 시기",
  },
  해: {
    good: same("가까운 데서 발목 잡히기 쉬운 10년", "가까운 데서 발목 잡히기 쉬웠던 10년"),
    mid: same("가까운 데서 발목 잡히기 쉬운 10년", "가까운 데서 발목 잡히기 쉬웠던 10년"),
    hard: same("가까운 데서 발목 잡히기 쉬운 10년", "가까운 데서 발목 잡히기 쉬웠던 10년"),
    young: "가까운 사이에서 부대끼며 자란 시기",
  },
  천간합: {
    good: same("마음 맞는 사람과 일이 곁에 생기는 10년", "마음 맞는 사람과 일이 곁에 생긴 10년"),
    mid: same("마음 맞는 사람과 일이 곁에 생기는 10년", "마음 맞는 사람과 일이 곁에 생긴 10년"),
    hard: same("정에 끌려 판단이 흐려지기 쉬운 10년", "정에 끌려 판단이 흐려지기 쉬웠던 10년"),
    young: "따뜻한 손길 속에 자란 시기",
  },
  천간충: {
    good: same("낡은 틀을 깨고 새 길로 나가는 10년", "낡은 틀을 깨고 새 길로 나간 10년"),
    mid: same("생각과 방향이 자주 바뀌는 10년", "생각과 방향이 자주 바뀐 10년"),
    hard: same("마음이 크게 흔들려 중심을 잡아야 할 10년", "마음이 크게 흔들렸던 10년"),
    young: "환경이 크게 바뀌며 자란 시기",
  },
  "새 기운": {
    good: same("없던 힘이 새로 생기는 10년", "없던 힘이 새로 생긴 10년"),
    mid: same("낯선 기운이 들어와 새 경험이 많은 10년", "낯선 기운이 들어와 새 경험이 많았던 10년"),
    hard: same("낯선 기운이 처음 들어와 적응이 필요한 10년", "낯선 기운이 처음 들어와 적응이 필요했던 10년"),
    young: "새로운 것을 많이 접하며 자란 시기",
  },
  고름: {
    good: same("필요한 기운이 들어와 힘이 붙는 10년", "필요한 기운이 들어와 힘이 붙은 10년"),
    mid: same("큰 굴곡 없이 고르게 흐르는 10년", "큰 굴곡 없이 고르게 흐른 10년"),
    hard: same("무리하지 말고 기반을 다질 10년", "기반을 다지며 버틴 10년"),
    young: "무난하게 자란 시기",
  },
};

// The branch that completes a 삼합 with two of its three present (寅午戌 with 寅 and 戌 → 午), else null.
const THIRD = (a: number, b: number) => (a % 4 === b % 4 && a !== b ? [0, 1, 2, 3].map((k) => (a % 4) + 4 * k).find((x) => x !== a && x !== b)! : null);

// One chart's record of the lines already given, passed to each of its decades in turn.
export const decadeSeen = () => ({ lines: new Set<string>(), kinds: new Set<Kind>() });

// `past`: the decade is over, so its line is told in the past. `seen`: the lines and kinds of the decades before,
// shared across one chart's decades so a line is not repeated word for word.
export function decadeLine(
  p: FullPillars,
  r: Reading,
  d: { stem: number; branch: number; from: number; to: number },
  level: Level,
  young: boolean,
  { past = false, seen }: { past?: boolean; seen?: { lines: Set<string>; kinds: Set<Kind> } } = {},
) {
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
        kind: "충",
        head: `${Ai} ${Bw} 정면으로 부딪히는 10년`,
        why: `${Ai} ${Bw} 정면으로 부딪혀요(충). ${good ? "움직이며 판이 새로 짜이는 때예요." : "자리가 흔들리고 묻어 둔 것이 드러나요."}`,
      });
    if (ms.includes("육합"))
      picks.push({
        score: weight(84),
        kind: "육합",
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
        kind: "삼합",
        head: missing ? `${Ai} ${Bw} 만나 ${el} 기운이 모이는 10년` : `${el} 기운이 삼합으로 완성되는 10년`,
        why: `${Ai} ${Bw} 만나 ${el} 기운이 모여요.${year ? ` ${year}년에 ${tag(br(third!))} 오면 삼합이 완성돼요.` : ""}`,
      });
    }
    if (ms.includes("형"))
      picks.push({
        score: weight(72),
        kind: "형",
        head: `${Aw} ${Bs} 엇갈려 다듬어지는 10년`,
        why: `${Aw} ${Bs} 서로 엇갈려요(형). ${good ? "부딪히며 단단해져요." : "깎이고 다듬어지는 시간이에요."}`,
      });
    if (ms.includes("원진"))
      picks.push({ score: weight(52), kind: "원진", head: `${Aw} ${Bs} 서먹해 생각이 많아지는 10년`, why: `${Aw} ${Bs} 서먹해요(원진). 속으로 생각이 많아지기 쉬워요.` });
    if (ms.includes("파"))
      picks.push({ score: weight(46), kind: "파", head: `${Aw} ${Bs} 어긋나 계획이 흔들리는 10년`, why: `${Aw} ${Bs} 어긋나요(파). 계획이 한 번씩 틀어지기 쉬워요.` });
    if (ms.includes("해"))
      picks.push({ score: weight(42), kind: "해", head: `${Aw} ${Bs} 서로 발목을 잡는 10년`, why: `${Aw} ${Bs} 서로 발목을 잡아요(해).` });
  }

  // ── the decade's stem against the chart's stems (the day stem counts for more)
  const stemsDone = new Set<number>();
  for (const s of slots) {
    if (s.stem === null || stemsDone.has(s.stem)) continue;
    stemsDone.add(s.stem);
    const day = s.pos === "일";
    const S = st(d.stem);
    const T = st(s.stem);
    const how = day ? "일간 " : "원국의 ";
    if (stemCombine(d.stem, s.stem)) {
      const into = EL_WORD[COMBINE_INTO[Math.min(d.stem, s.stem) % 5]];
      picks.push({
        score: day ? 86 : 74,
        kind: "천간합",
        head: `${tag(S)} ${how}${tag(T, "과/와")} 합해 짝이 되는 10년`,
        why: `${tag(S)} ${how}${tag(T, "과/와")} 합해요(천간합). ${into} 기운으로 묶여요.`,
      });
    } else if (stemClash(d.stem, s.stem))
      picks.push({
        score: day ? 90 : 76,
        kind: "천간충",
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
      kind: "새 기운",
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

  // The plain line: from the strongest pick, or the next one when it would read the same as an earlier decade.
  const tone = young ? null : good ? "good" : hard ? "hard" : "mid";
  const plainOf = (kind: Kind) => {
    const t = PLAIN[kind];
    const text = tone ? t[tone][past ? 1 : 0] : t.young;
    // The same gathering again (a 삼합 in an earlier decade too) is said as such.
    return kind === "삼합" && seen?.kinds.has("삼합") ? text.replace("힘이 ", "힘이 다시 ") : text;
  };
  const kinds: Kind[] = top.length ? top.map((x) => x.kind) : ["고름"];
  const line = kinds.map(plainOf).find((x) => !seen?.lines.has(x)) ?? plainOf(kinds[0]);
  seen?.lines.add(line);
  for (const k of kinds.slice(0, 1)) seen?.kinds.add(k);
  return { line, why, tech: head };
}
