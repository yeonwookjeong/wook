import { Lunar } from "lunar-javascript";
import { josa } from "./josa";
import { BRANCHES, ELEMENTS_KO, STEMS, STEMS_KO, type Pillars } from "./saju";

// Lunar birthdays from the Annals, cross-checked against at least one published solar date each where available.
const RAW: { name: string; lunar: [number, number, number]; note: string }[] = [
  { name: "태조", lunar: [1335, 10, 11], note: "조선을 세운 개국 군주" },
  { name: "정종", lunar: [1357, 7, 18], note: "왕위를 동생 태종에게 넘긴 조선 2대 왕" },
  { name: "태종", lunar: [1367, 5, 16], note: "왕권을 다진 조선 3대 왕 이방원" },
  { name: "세종", lunar: [1397, 4, 10], note: "훈민정음을 만든 조선 4대 왕" },
  { name: "문종", lunar: [1414, 10, 3], note: "측우기 제작에 힘쓴 조선 5대 왕" },
  { name: "단종", lunar: [1441, 7, 23], note: "어린 나이에 즉위한 비운의 조선 6대 왕" },
  { name: "세조", lunar: [1417, 9, 24], note: "계유정난으로 즉위한 조선 7대 왕" },
  { name: "예종", lunar: [1450, 1, 1], note: "재위 1년 남짓의 조선 8대 왕" },
  { name: "성종", lunar: [1457, 7, 30], note: "경국대전을 완성한 조선 9대 왕" },
  { name: "연산군", lunar: [1476, 11, 7], note: "폐위된 조선 10대 왕" },
  { name: "중종", lunar: [1488, 3, 5], note: "중종반정으로 즉위한 조선 11대 왕" },
  { name: "인종", lunar: [1515, 2, 25], note: "재위 8개월의 조선 12대 왕" },
  { name: "명종", lunar: [1534, 5, 22], note: "문정왕후가 수렴청정한 조선 13대 왕" },
  { name: "선조", lunar: [1552, 11, 11], note: "임진왜란을 겪은 조선 14대 왕" },
  { name: "광해군", lunar: [1575, 4, 26], note: "중립 외교를 펼친 조선 15대 왕" },
  { name: "인조", lunar: [1595, 11, 7], note: "인조반정으로 즉위한 조선 16대 왕" },
  { name: "효종", lunar: [1619, 5, 22], note: "북벌을 꿈꾼 조선 17대 왕" },
  { name: "현종", lunar: [1641, 2, 4], note: "예송 논쟁이 벌어진 조선 18대 왕" },
  { name: "숙종", lunar: [1661, 8, 15], note: "46년간 재위한 조선 19대 왕" },
  { name: "경종", lunar: [1688, 10, 28], note: "장희빈의 아들, 조선 20대 왕" },
  { name: "영조", lunar: [1694, 9, 13], note: "탕평책을 펼친 조선 21대 왕" },
  { name: "정조", lunar: [1752, 9, 22], note: "규장각을 세운 조선 22대 왕" },
  { name: "순조", lunar: [1790, 6, 18], note: "어린 나이에 즉위한 조선 23대 왕" },
  { name: "헌종", lunar: [1827, 7, 18], note: "여덟 살에 즉위한 조선 24대 왕" },
  { name: "철종", lunar: [1831, 6, 17], note: "강화도령이라 불린 조선 25대 왕" },
  { name: "고종", lunar: [1852, 7, 25], note: "대한제국을 선포한 조선 26대 왕" },
  { name: "순종", lunar: [1874, 2, 8], note: "대한제국의 마지막 황제" },
];

export type HistoricKing = { name: string; note: string; dayStem: number; dayBranch: number };

export const KINGS: HistoricKing[] = RAW.map(({ name, note, lunar: [y, m, d] }) => {
  const ec = Lunar.fromYmdHms(y, m, d, 12, 0, 0).getEightChar();
  return {
    name,
    note,
    dayStem: STEMS.indexOf(ec.getDayGan() as (typeof STEMS)[number]),
    dayBranch: BRANCHES.indexOf(ec.getDayZhi() as (typeof BRANCHES)[number]),
  };
});

export type KingLink =
  | { kind: "pillar"; kings: HistoricKing[] }
  | { kind: "stem"; kings: HistoricKing[] }
  | { kind: "none" };

export function kingLink(p: Pillars): KingLink {
  const pillar = KINGS.filter((k) => k.dayStem === p.dayStem && k.dayBranch === p.dayBranch);
  if (pillar.length) return { kind: "pillar", kings: pillar };
  const stem = KINGS.filter((k) => k.dayStem === p.dayStem);
  if (stem.length) return { kind: "stem", kings: stem };
  return { kind: "none" };
}

export function kingLinkText(p: Pillars) {
  const link = kingLink(p);
  const stemLabel = `${STEMS_KO[p.dayStem]}${ELEMENTS_KO[Math.floor(p.dayStem / 2)]}`;
  const list = (ks: HistoricKing[]) =>
    [...ks.slice(0, -1).map((k) => k.name), josa(ks.at(-1)!.name, "과/와")].join(" · ");
  if (link.kind === "pillar") {
    const pillar = `${STEMS[p.dayStem]}${BRANCHES[p.dayBranch]}`;
    return {
      link,
      headline: `실록 기준, 전하와 일주(${pillar})가 같은 왕`,
      short: `${list(link.kings)} 일주가 같은 왕`,
    };
  }
  if (link.kind === "stem") {
    return {
      link,
      headline: `실록 기준, 전하와 같은 ${stemLabel} 일간의 왕`,
      short: `${list(link.kings.slice(0, 2))} 같은 ${stemLabel} 일간`,
    };
  }
  return {
    link,
    headline: `조선 27왕 중 ${stemLabel} 일간은 한 분도 없었사옵니다`,
    short: `조선 최초의 ${stemLabel} 군주`,
  };
}
