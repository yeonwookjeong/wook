import { domainCard, DOMAINS, type Domain, type DomainCard } from "./domains";
import { isBaekho, isGoegang, salsAt, type Sal } from "./deep";
import { BRANCH_EL, chartOf, GROUP_OF, readChart, stemEl, tenGod, type GodGroup } from "./myeongri";
import type { Profile } from "./profile";
import { godRank, patternRate } from "./rarity";
import { isFull, type Pillars } from "./saju";
import { elScore } from "./yearly";

// The free reading's extra blocks, computed only (no writer, no cost): what the chart is, in numbers and one-line
// verdicts. The paid reports tell how it plays out and when; these say what it is.

// ① 성향 지도: the five powers (ten-god groups), each as a share, where it stands among all births, and what the
// strongest and weakest mean.
const POWER: Record<GodGroup, { name: string; high: string; low: string }> = {
  비겁: {
    name: "나를 지키는 힘",
    high: "누가 뭐래도 내 방식대로 가는 뚝심이 있어요. 대신 도움을 청하는 게 서툴러요.",
    low: "남에게 맞춰 주는 게 편한 사람이에요. 내 몫을 챙기는 연습이 필요해요.",
  },
  식상: {
    name: "표현하는 힘",
    high: "생각이 바로 말과 결과물로 나와요. 재주가 많은 대신 참는 게 어려워요.",
    low: "속으로 삼키는 게 많아요. 좋은 생각을 밖으로 꺼내는 게 숙제예요.",
  },
  재성: {
    name: "돈·현실 감각",
    high: "손익을 빨리 따지고 현실 감각이 좋아요. 결과가 안 보이면 금방 흥미를 잃어요.",
    low: "돈보다 의미를 좇는 편이에요. 돈 관리는 규칙으로 정해 두는 게 좋아요.",
  },
  관성: {
    name: "책임·규칙의 힘",
    high: "맡은 일은 끝까지 해내는 책임감이 강해요. 스스로를 너무 몰아붙이기 쉬워요.",
    low: "틀에 매이는 걸 못 견뎌요. 자유로운 자리에서 오히려 빛나요.",
  },
  인성: {
    name: "배우고 받는 힘",
    high: "생각이 깊고 준비가 철저해요. 대신 시작이 늦어요.",
    low: "머리보다 몸으로 부딪히며 배워요. 결정이 빠른 대신 준비가 모자랄 때가 있어요.",
  },
};
const GROUPS: GodGroup[] = ["비겁", "식상", "재성", "관성", "인성"];

// ② 신살 the chart holds, with what it means and, where counted, how many in 100 have it.
const SAL: Partial<Record<Sal | "괴강" | "백호", { plain: string; line: string; id?: string }>> = {
  천을귀인: { plain: "위기 때 돕는 사람", line: "막다른 길에서 꼭 누군가 손을 내밀어요.", id: "cheoneul" },
  도화: { plain: "사람을 끄는 매력", line: "가만히 있어도 눈길을 끌고, 표현력과 센스가 무기가 돼요.", id: "dohwa" },
  역마: { plain: "움직여야 풀리는 기운", line: "이사·출장·해외·이직처럼 움직일 때 운이 트여요.", id: "yeokma" },
  화개: { plain: "혼자 깊이 파고드는 힘", line: "공부·예술·연구처럼 한 우물을 깊이 파는 일과 인연이 있어요." },
  문창귀인: { plain: "글과 공부의 재주", line: "글, 시험, 기획처럼 머리로 하는 일에서 빛나요." },
  양인: { plain: "칼 같은 결단력", line: "한번 정하면 밀어붙여요. 욱하는 순간만 조심하면 큰 무기예요.", id: "yangin" },
  괴강: { plain: "우두머리 기질", line: "판이 크고 남 밑에 오래 있기 힘들어요. 잘될 땐 크게 잘돼요.", id: "goegang" },
  백호: { plain: "강한 추진력", line: "밀어붙이는 힘이 큰 만큼 급한 일과 부상은 조심해야 해요.", id: "baekho" },
};

// ④ 인생 흐름: each ten-year luck pillar as uphill, level or a time to rest, with what the decade is about.
const DECADE_OF: Record<GodGroup, string> = {
  비겁: "내 힘으로 밀고 나가는 10년",
  식상: "재주를 펼치는 10년",
  재성: "돈과 현실을 쌓는 10년",
  관성: "자리와 책임이 커지는 10년",
  인성: "배우고 준비하는 10년",
};

export type FreeReading = {
  powers: { group: GodGroup; name: string; pct: number; rank: string | null }[];
  strong: { name: string; line: string };
  weak: { name: string; line: string };
  sals: { name: string; plain: string; line: string; rate: number | null }[];
  domains: { domain: Domain; card: DomainCard }[];
  flow: { from: number; to: number; age: string; mood: "오르막" | "평지" | "쉬어 갈 때"; theme: string; now: boolean }[] | null;
};

export function freeReadingOf(p: Pillars, profile: Profile | null, now = 2026): FreeReading | null {
  const r = readChart(p);
  if (!r || !isFull(p)) return null;
  const gender = profile?.gender ?? null;
  const sum = GROUPS.reduce((a, g) => a + r.godWeights[g], 0) || 1;
  const powers = GROUPS.map((g) => {
    const share = r.godWeights[g] / sum;
    const t = godRank(g, share);
    const pct = Math.max(1, Math.round(t.rate * 100));
    return { group: g, name: POWER[g].name, pct: Math.round(share * 100), rank: t.rate <= 0.25 ? `${t.side === "high" ? "상위" : "하위"} ${pct}%` : null };
  });
  const sorted = [...powers].sort((a, b) => b.pct - a.pct);
  const strong = { name: sorted[0].name, line: POWER[sorted[0].group].high };
  const weak = { name: sorted.at(-1)!.name, line: POWER[sorted.at(-1)!.group].low };

  const found = new Set<string>();
  for (const s of chartOf(p)) if (s.branch !== null) for (const x of salsAt(p, s.branch)) found.add(x);
  if (isGoegang(p)) found.add("괴강");
  if (isBaekho(p)) found.add("백호");
  const sals = Object.entries(SAL)
    .filter(([k]) => found.has(k))
    .map(([k, v]) => ({ name: k, plain: v!.plain, line: v!.line, rate: v!.id ? patternRate(v!.id, gender) : null }));

  const domains = DOMAINS.flatMap((d) => {
    const card = domainCard(d, p, gender);
    return card ? [{ domain: d, card }] : [];
  });

  const by = profile?.birthYear;
  const flow = profile?.daeun?.length
    ? profile.daeun.map((d) => {
        const fit = elScore(r, stemEl(d.stem)) + elScore(r, BRANCH_EL[d.branch]);
        const g = GROUP_OF[tenGod(p.dayStem, d.stem)];
        return {
          from: d.from,
          to: d.to,
          age: by ? `${d.from - by}~${d.to - by}세` : "",
          mood: fit >= 2 ? ("오르막" as const) : fit <= -2 ? ("쉬어 갈 때" as const) : ("평지" as const),
          theme: DECADE_OF[g],
          now: d.from <= now && now <= d.to,
        };
      })
    : null;
  return { powers, strong, weak, sals, domains, flow };
}
