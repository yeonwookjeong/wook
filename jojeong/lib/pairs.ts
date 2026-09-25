import { matchPillars, type Facts } from "./saju";
import type { Minister } from "./store";

export type Pair = { a: Minister; b: Minister; score: number; facts: Facts };

// Ministers are peers, so the score is the average of both directions.
function pairOf(a: Minister, b: Minister): Pair {
  const ab = matchPillars(a.pillars, b.pillars);
  const ba = matchPillars(b.pillars, a.pillars);
  return { a, b, score: Math.round((ab.score + ba.score) / 2), facts: ab.facts };
}

function allPairs(ministers: Minister[]): Pair[] {
  const pairs: Pair[] = [];
  for (let i = 0; i < ministers.length; i++)
    for (let j = i + 1; j < ministers.length; j++) pairs.push(pairOf(ministers[i], ministers[j]));
  return pairs;
}

export function pairHighlights(ministers: Minister[]) {
  const pairs = allPairs(ministers);
  if (pairs.length === 0) return null;
  const best = pairs.reduce((x, y) => (y.score > x.score ? y : x));
  const worst = pairs.reduce((x, y) => (y.score < x.score ? y : x));
  return { best, worst: worst === best ? null : worst };
}

export function goodReason(f: Facts) {
  if (f.stemCombine) return "하늘이 맺어준 짝이옵니다 (천간합)";
  if (f.daySix) return "말 안 해도 속마음이 통하는 사이이옵니다 (일지 육합)";
  if (f.dayThree) return "같은 곳을 바라보는 사이이옵니다 (일지 반합)";
  if (f.yearSix || f.yearThree) return "띠부터 잘 맞는 사이이옵니다";
  if (f.group === "비겁") return "같은 기운을 타고난 동지이옵니다";
  if (f.group === "인성" || f.group === "식상") return "서로를 키워주는 사이이옵니다";
  return "무난하게 잘 맞는 사이이옵니다";
}

export function badReason(f: Facts) {
  if (f.dayClash) return "생활 방식이 정반대라 부딪치옵니다 (일지 충)";
  if (f.dayWonjin) return "괜히 서로 서운한 사이이옵니다 (원진)";
  if (f.yearClash) return "첫인상부터 엇갈린 사이이옵니다 (띠 충)";
  if (f.group === "재성" || f.group === "관성") return "한쪽이 다른 쪽을 누르는 사이이옵니다";
  return "미묘하게 결이 다른 사이이옵니다";
}
