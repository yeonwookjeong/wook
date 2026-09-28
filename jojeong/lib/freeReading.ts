import { domainCard, DOMAINS, type Domain, type DomainCard } from "./domains";
import { isBaekho, isGoegang, salsAt, type Sal } from "./deep";
import { chartOf, GROUP_OF, HIDDEN, readChart, tenGod, type GodGroup } from "./myeongri";
import type { Profile } from "./profile";
import { godRank, patternRate } from "./rarity";
import { isFull, type Pillars } from "./saju";
import { luckFit } from "./yearly";

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

// ④ 인생 흐름: each ten-year luck pillar, graded by how welcome it is (lib/yearly.ts luckFit) and named by what its
// branch brings, which carries the decade, in words for the age it falls in.
type Stage = "young" | "adult" | "late";
const DECADE_OF: Record<GodGroup, Record<Stage, string>> = {
  비겁: { young: "친구·형제와 부대끼며 자란 시기", adult: "내 힘으로 서고 독립하는 10년", late: "내 뜻대로 사는 10년" },
  식상: { young: "재주와 끼가 드러난 시기", adult: "재주를 펼치고 결과를 내는 10년", late: "쌓은 것을 나누는 10년" },
  재성: { young: "집안 형편과 환경이 크게 작용한 시기", adult: "돈과 기회를 잡는 10년", late: "모은 것을 지키고 굴리는 10년" },
  관성: { young: "규칙과 기대 속에서 자란 시기", adult: "자리와 책임이 커지는 10년", late: "이름과 자리를 지키는 10년" },
  인성: { young: "공부와 보살핌 속에 자란 시기", adult: "배우고 자격을 쌓는 10년", late: "마음이 편안해지는 10년" },
};
export const MOODS = {
  기회: "사주에 필요한 기운이 들어와 힘이 붙는 10년",
  무난: "좋고 나쁨이 섞여 흐름이 고른 10년",
  다지기: "버거운 기운이 겹쳐, 크게 벌이기보다 기반을 다질 10년",
} as const;
export type Mood = keyof typeof MOODS;

export type FreeReading = {
  powers: { group: GodGroup; name: string; pct: number; rank: string | null }[];
  strong: { name: string; line: string };
  weak: { name: string; line: string };
  sals: { name: string; plain: string; line: string; rate: number | null }[];
  domains: { domain: Domain; card: DomainCard }[];
  flow: { from: number; to: number; age: string; mood: Mood; theme: string; now: boolean; past: boolean }[] | null;
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
        const fit = luckFit(r, p.dayStem, d.stem, d.branch);
        const g = GROUP_OF[tenGod(p.dayStem, HIDDEN[d.branch].at(-1)![0])];
        const age = by ? d.from - by : 30;
        const stage: Stage = age < 18 ? "young" : age < 60 ? "adult" : "late";
        return {
          from: d.from,
          to: d.to,
          age: by ? `${d.from - by}~${d.to - by}세` : "",
          mood: fit >= 3 ? ("기회" as const) : fit <= -3 ? ("다지기" as const) : ("무난" as const),
          theme: DECADE_OF[g][stage],
          now: d.from <= now && now <= d.to,
          past: d.to < now,
        };
      })
    : null;
  return { powers, strong, weak, sals, domains, flow };
}

// The same verdicts for the writer: a paid report must never say otherwise than the free screen the reader has
// already seen (the decade marks above all).
export function freeBrief(p: Pillars, profile: Profile | null, now = 2026): string {
  const r = freeReadingOf(p, profile, now);
  if (!r) return "";
  const cur = r.flow?.find((f) => f.now);
  return [
    "■ ★ 무료 화면에서 읽는 사람이 이미 본 판정 (보고서는 반드시 이 판정과 같은 방향으로 쓴다. 되풀이하지 말고 이유와 장면으로 넓힌다. 어긋나는 말은 금지)",
    `- 성향 지도: ${r.powers.map((x) => `${x.name} ${x.pct}%${x.rank ? `(${x.rank})` : ""}`).join(", ")} / 가장 강한 힘 ${r.strong.name}, 가장 약한 힘 ${r.weak.name}`,
    `- 사주 속 별: ${r.sals.length ? r.sals.map((x) => `${x.name}(${x.plain})`).join(", ") : "두드러진 신살 없음"}`,
    `- 돈·사랑·일 판정: ${r.domains.map((d) => `${d.domain === "jaemul" ? "돈" : d.domain === "yeonae" ? "사랑" : "일"} '${d.card.type}'`).join(", ")}`,
    ...(r.flow
      ? [
          `- 인생 흐름(10년 대운, ◎기회 ○무난 △다지기): ${r.flow.map((f) => `${f.from}~${f.to}${f.age ? `(${f.age})` : ""} ${f.mood === "기회" ? "◎" : f.mood === "무난" ? "○" : "△"} ${f.theme}${f.now ? "←지금" : ""}`).join(" / ")}`,
          ...(cur ? [`- 지금의 10년은 ${cur.from}~${cur.to}년 '${cur.mood}'. 대운은 해가 바뀌는 첫머리가 아니라 태어난 날 무렵에 넘어가므로, 바뀌는 해를 말할 때는 "${cur.from}년 무렵부터"처럼 쓴다.`] : []),
        ]
      : ["- 인생 흐름: 성별을 몰라 대운을 계산하지 않음(대운 이야기는 하지 않는다)"]),
  ].join("\n");
}
