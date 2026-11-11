import { Lunar, Solar } from "lunar-javascript";
import { BRANCHES, BRANCHES_KO, STEMS, STEMS_KO } from "./saju";

// "나와 같은 일주로 태어난 인물": people whose birthday is well recorded, matched to the reader by the day pillar
// alone (most of them have no recorded birth hour, and the day pillar is the part of a chart that is "me").
// Only the date and a one-line life are written by hand; the pillar is worked out here with the site's calendar.
// Korean figures are kept as their recorded lunar date (실록, 연보); everyone else as the solar date of birth
// (lunar-javascript reads a solar date before 1582 as Julian, which is how those dates are recorded).
// Lines say what a life made, never how it ended.

type Born = { lunar: [number, number, number] } | { solar: [number, number, number] };
type Raw = { name: string; line: string; born: Born };

const RAW: Raw[] = [
  { name: "세종", line: "조선의 임금, 훈민정음을 펴내다", born: { lunar: [1397, 4, 10] } },
  { name: "이순신", line: "조선 수군을 이끌고 바다를 지키다", born: { lunar: [1545, 3, 8] } },
  { name: "정약용", line: "실학자, 유배지에서 수많은 책을 쓰다", born: { lunar: [1762, 6, 16] } },
  { name: "정조", line: "조선의 임금, 규장각을 세우다", born: { lunar: [1752, 9, 22] } },
  { name: "영조", line: "조선에서 가장 오래 나라를 다스린 임금", born: { lunar: [1694, 9, 13] } },
  { name: "이성계", line: "조선을 세운 임금", born: { lunar: [1335, 10, 11] } },
  { name: "신사임당", line: "조선의 화가이자 시인", born: { lunar: [1504, 10, 29] } },
  { name: "이황", line: "조선 성리학의 큰 스승", born: { lunar: [1501, 11, 25] } },
  { name: "이이", line: "과거에 아홉 번 장원한 조선의 학자", born: { lunar: [1536, 12, 26] } },
  { name: "정몽주", line: "고려의 학자이자 외교가", born: { lunar: [1337, 12, 22] } },
  { name: "김정희", line: "추사체를 만든 서예가", born: { lunar: [1786, 6, 3] } },
  { name: "김구", line: "대한민국 임시정부를 이끈 독립운동가", born: { lunar: [1876, 7, 11] } },
  { name: "홍범도", line: "봉오동에서 이긴 독립군 사령관", born: { lunar: [1868, 8, 27] } },
  { name: "안중근", line: "하얼빈에서 뜻을 이룬 독립운동가", born: { solar: [1879, 9, 2] } },
  { name: "방정환", line: "어린이날을 만든 사람", born: { solar: [1899, 11, 9] } },
  { name: "윤동주", line: "하늘과 바람과 별을 노래한 시인", born: { solar: [1917, 12, 30] } },
  { name: "레오나르도 다빈치", line: "모나리자를 그린 화가이자 발명가", born: { solar: [1452, 4, 15] } },
  { name: "갈릴레오 갈릴레이", line: "망원경으로 하늘을 새로 본 과학자", born: { solar: [1564, 2, 15] } },
  { name: "아이작 뉴턴", line: "만유인력을 밝힌 과학자", born: { solar: [1643, 1, 4] } },
  { name: "바흐", line: "음악의 아버지라 불린 작곡가", born: { solar: [1685, 3, 31] } },
  { name: "칸트", line: "생각하는 법을 다시 세운 철학자", born: { solar: [1724, 4, 22] } },
  { name: "조지 워싱턴", line: "미국의 첫 대통령", born: { solar: [1732, 2, 22] } },
  { name: "괴테", line: "파우스트를 쓴 작가", born: { solar: [1749, 8, 28] } },
  { name: "모차르트", line: "천재라 불린 작곡가", born: { solar: [1756, 1, 27] } },
  { name: "나폴레옹", line: "유럽을 뒤흔든 프랑스의 황제", born: { solar: [1769, 8, 15] } },
  { name: "에이브러햄 링컨", line: "노예 해방을 이끈 미국 대통령", born: { solar: [1809, 2, 12] } },
  { name: "찰스 다윈", line: "진화론을 세운 과학자", born: { solar: [1809, 2, 12] } },
  { name: "나이팅게일", line: "근대 간호를 세운 사람", born: { solar: [1820, 5, 12] } },
  { name: "톨스토이", line: "전쟁과 평화를 쓴 작가", born: { solar: [1828, 9, 9] } },
  { name: "에디슨", line: "전구를 실용화한 발명가", born: { solar: [1847, 2, 11] } },
  { name: "반 고흐", line: "해바라기를 그린 화가", born: { solar: [1853, 3, 30] } },
  { name: "니콜라 테슬라", line: "교류 전기를 연 발명가", born: { solar: [1856, 7, 10] } },
  { name: "프로이트", line: "마음속 무의식을 연구한 의사", born: { solar: [1856, 5, 6] } },
  { name: "마리 퀴리", line: "노벨상을 두 번 받은 과학자", born: { solar: [1867, 11, 7] } },
  { name: "간디", line: "비폭력으로 독립을 이끈 사람", born: { solar: [1869, 10, 2] } },
  { name: "처칠", line: "전쟁 속 영국을 이끈 총리", born: { solar: [1874, 11, 30] } },
  { name: "아인슈타인", line: "상대성 이론을 세운 과학자", born: { solar: [1879, 3, 14] } },
  { name: "헬렌 켈러", line: "보지도 듣지도 못한 채 세상을 바꾼 작가", born: { solar: [1880, 6, 27] } },
  { name: "피카소", line: "그림의 틀을 깨뜨린 화가", born: { solar: [1881, 10, 25] } },
  { name: "엔리코 페르미", line: "첫 원자로를 세운 물리학자", born: { solar: [1901, 9, 29] } },
];

export type IljuFigure = { name: string; line: string; stem: number; branch: number };

function dayOf(b: Born): { stem: number; branch: number } {
  const e = ("lunar" in b ? Lunar.fromYmdHms(...b.lunar, 12, 0, 0) : Solar.fromYmd(...b.solar).getLunar()).getEightChar();
  return {
    stem: STEMS.indexOf(e.getDayGan() as (typeof STEMS)[number]),
    branch: BRANCHES.indexOf(e.getDayZhi() as (typeof BRANCHES)[number]),
  };
}

export const ILJU_FIGURES: IljuFigure[] = RAW.map((r) => ({ name: r.name, line: r.line, ...dayOf(r.born) }));

// The same day pillar if anyone has it; otherwise the same day stem (the element one is born as), so every reader
// gets someone. `same` says which.
export function figuresFor(stem: number, branch: number, max = 3): { same: "ilju" | "stem"; label: string; list: IljuFigure[] } {
  const ilju = ILJU_FIGURES.filter((f) => f.stem === stem && f.branch === branch);
  if (ilju.length) return { same: "ilju", label: `${STEMS_KO[stem]}${BRANCHES_KO[branch]}일 ${STEMS[stem]}${BRANCHES[branch]}`, list: ilju.slice(0, max) };
  return { same: "stem", label: `일간 ${STEMS_KO[stem]} ${STEMS[stem]}`, list: ILJU_FIGURES.filter((f) => f.stem === stem).slice(0, max) };
}
