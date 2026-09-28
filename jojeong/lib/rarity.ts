import { ELEMENT_HANJA, ELEMENT_KO, GYEOK_NAME, readChart, type GodGroup, type TenGod } from "./myeongri";
import { patternsOf, type Pattern } from "./patterns";
import type { Gender } from "./profile";
import data from "./rarity.json";
import { BRANCHES, STEMS, type Pillars } from "./saju";

// How rare this chart's features are among 258,600 real births (lib/rarity.json, built by scripts/rarity.mts).

type Metric = keyof typeof data.metrics;

// Share of births at or beyond this value, on the side it leans to (the top for a high share, the bottom
// for a low one).
function tail(metric: Metric, value: number): { side: "high" | "low"; rate: number } {
  const h = data.metrics[metric] as number[];
  const total = h.reduce((a, b) => a + b, 0);
  const v = Math.round(value * 100);
  const above = h.slice(v).reduce((a, b) => a + b, 0) / total;
  const below = h.slice(0, v + 1).reduce((a, b) => a + b, 0) / total;
  return above <= below ? { side: "high", rate: above } : { side: "low", rate: below };
}

// How a ten-god group's share stands among all births: "상위 12%" / "하위 8%".
export function godRank(group: GodGroup, share: number): { side: "high" | "low"; rate: number } {
  return tail(`god:${group}` as Metric, share);
}

export const patternRate = (id: string, gender: Gender | null) => {
  const m = data.patterns.m[id as keyof typeof data.patterns.m] / data.n.m;
  const f = data.patterns.f[id as keyof typeof data.patterns.f] / data.n.f;
  return gender === "m" ? m : gender === "f" ? f : (m + f) / 2;
};

// "100명 중 3명" style, never below 1 in 100.
export const perHundred = (rate: number) => (rate < 0.01 ? "100명 중 1명도 안 되는" : `100명 중 ${Math.round(rate * 100)}명`);

const GROUP_PLAIN: Record<GodGroup, string> = {
  비겁: "나와 같은 기운(비겁: 자존심·동료)",
  식상: "표현하는 기운(식상: 말·재주)",
  재성: "재물의 기운(재성: 돈·현실)",
  관성: "규칙과 책임의 기운(관성: 일·조직)",
  인성: "받쳐 주는 기운(인성: 공부·보살핌)",
};

export type Distinct = {
  patterns: (Pattern & { rate: number })[]; // rarest first
  extremes: { label: string; value: number; side: "high" | "low"; rate: number }[]; // shares in the top or bottom 10%
  ilju: { name: string; build: string; rate: number } | null; // how many of the same day pillar share this build
  weights: { simple: number[]; weighted: number[] }; // the elements counted flat (8 characters) and by position
};

export function distinctOf(p: Pillars, gender: Gender | null): Distinct | null {
  const r = readChart(p);
  if (!r) return null;
  const patterns = patternsOf(p, gender)
    .map((x) => ({ ...x, rate: patternRate(x.id, gender) }))
    .sort((a, b) => a.rate - b.rate);
  const gsum = Object.values(r.godWeights).reduce((a, b) => a + b, 0) || 1;
  const esum = r.weights.reduce((a, b) => a + b, 0);
  const extremes = [
    ...(Object.keys(r.godWeights) as GodGroup[]).map((g) => ({ label: GROUP_PLAIN[g], value: r.godWeights[g] / gsum, ...tail(`god:${g}` as Metric, r.godWeights[g] / gsum) })),
    ...[0, 1, 2, 3, 4].map((e) => ({ label: `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]}) 기운`, value: r.weights[e] / esum, ...tail(`el:${e}` as Metric, r.weights[e] / esum) })),
  ]
    // Only a heavy share, or one all but absent, says something about the person.
    .filter((x) => x.rate <= 0.1 && (x.side === "high" || x.value <= 0.03))
    .sort((a, b) => a.rate - b.rate);
  const groups: GodGroup[] = ["비겁", "식상", "재성", "관성", "인성"];
  const heavy = groups.reduce((a, b) => (r.godWeights[b] > r.godWeights[a] ? b : a));
  const cell = (data.ilju as Record<string, { n: number; sig: Record<string, number> }>)[`${p.dayStem}-${p.dayBranch}`];
  const count = cell?.sig[`${r.season}|${r.gyeok}|${heavy}`];
  const ilju = cell && count
    ? {
        name: `${STEMS[p.dayStem]}${BRANCHES[p.dayBranch]}`,
        build: `${r.season}에 태어난 ${GYEOK_NAME[r.gyeok as TenGod]}, ${GROUP_PLAIN[heavy].split("(")[0]}이 가장 무거운`,
        rate: count / cell.n,
      }
    : null;
  return { patterns, extremes, ilju, weights: { simple: r.elements.map((n) => n / r.elements.reduce((a, b) => a + b, 0)), weighted: r.weights.map((w) => w / esum) } };
}
