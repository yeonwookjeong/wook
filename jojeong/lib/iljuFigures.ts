import { Lunar, Solar } from "lunar-javascript";
import { KINGS } from "./kings";
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
  { name: "송시열", line: "조선 후기 성리학을 이끈 학자", born: { lunar: [1607, 11, 12] } },
  { name: "유성룡", line: "임진왜란 때 나라 살림을 맡아 징비록을 남긴 재상", born: { lunar: [1542, 10, 1] } },
  { name: "곽재우", line: "임진왜란 때 붉은 옷을 입고 싸운 의병장", born: { lunar: [1552, 8, 28] } },
  { name: "조식", line: "실천을 앞세운 조선의 선비", born: { lunar: [1501, 6, 26] } },
  { name: "박지원", line: "열하일기를 쓴 실학자", born: { lunar: [1737, 2, 5] } },
  { name: "정선", line: "우리 산천을 그대로 그린 진경산수의 화가", born: { lunar: [1676, 1, 3] } },
  { name: "최제우", line: "동학을 연 사상가", born: { lunar: [1824, 10, 28] } },
  { name: "이육사", line: "광야와 청포도를 노래한 시인", born: { lunar: [1904, 4, 4] } },
  { name: "안창호", line: "교육으로 나라를 세우려 한 독립운동가", born: { solar: [1878, 11, 9] } },
  { name: "윤봉길", line: "상하이에서 뜻을 이룬 독립운동가", born: { solar: [1908, 6, 21] } },
  { name: "이봉창", line: "도쿄에서 뜻을 펼친 독립운동가", born: { solar: [1900, 8, 10] } },
  { name: "유관순", line: "만세 운동에 앞장선 독립운동가", born: { solar: [1902, 12, 16] } },
  { name: "한용운", line: "님의 침묵을 쓴 시인이자 독립운동가", born: { solar: [1879, 8, 29] } },
  { name: "신채호", line: "우리 역사를 새로 쓴 역사학자", born: { solar: [1880, 12, 8] } },
  { name: "주시경", line: "한글이라는 이름을 널리 쓴 국어학자", born: { solar: [1876, 12, 22] } },
  { name: "김소월", line: "진달래꽃을 쓴 시인", born: { solar: [1902, 8, 6] } },
  { name: "이상", line: "날개를 쓴 작가", born: { solar: [1910, 9, 23] } },
  { name: "이중섭", line: "소를 그린 화가", born: { solar: [1916, 4, 10] } },
  { name: "나혜석", line: "우리나라 첫 여성 서양화가", born: { solar: [1896, 4, 28] } },
  { name: "김유정", line: "봄봄과 동백꽃을 쓴 작가", born: { solar: [1908, 1, 11] } },
  { name: "백남준", line: "비디오 아트를 연 예술가", born: { solar: [1932, 7, 20] } },
  { name: "김대건", line: "우리나라 첫 천주교 신부", born: { solar: [1821, 8, 21] } },
  { name: "윤선도", line: "어부사시사를 지은 시인", born: { lunar: [1587, 6, 22] } },
  { name: "안익태", line: "애국가를 작곡한 음악가", born: { solar: [1906, 12, 5] } },
  { name: "정주영", line: "맨손으로 큰 기업을 일군 기업가", born: { solar: [1915, 11, 25] } },
  { name: "이병철", line: "큰 기업을 세운 기업가", born: { solar: [1910, 2, 12] } },
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
  { name: "코페르니쿠스", line: "지구가 해를 돈다고 밝힌 천문학자", born: { solar: [1473, 2, 19] } },
  { name: "벤저민 프랭클린", line: "피뢰침을 만든 발명가이자 미국 건국의 아버지", born: { solar: [1706, 1, 17] } },
  { name: "가우디", line: "사그라다 파밀리아를 지은 건축가", born: { solar: [1852, 6, 25] } },
  { name: "헤밍웨이", line: "노인과 바다를 쓴 작가", born: { solar: [1899, 7, 21] } },
  { name: "루이 암스트롱", line: "재즈의 얼굴이 된 트럼펫 연주자", born: { solar: [1901, 8, 4] } },
  { name: "찰스 린드버그", line: "대서양을 처음 홀로 날아 건넌 비행사", born: { solar: [1902, 2, 4] } },
  { name: "슈베르트", line: "가곡의 왕이라 불린 작곡가", born: { solar: [1797, 1, 31] } },
  { name: "빅토르 위고", line: "레 미제라블을 쓴 작가", born: { solar: [1802, 2, 26] } },
  { name: "안데르센", line: "인어공주를 쓴 동화 작가", born: { solar: [1805, 4, 2] } },
  { name: "루이 파스퇴르", line: "백신의 길을 연 과학자", born: { solar: [1822, 12, 27] } },
  { name: "쥘 베른", line: "해저 2만 리를 쓴 작가", born: { solar: [1828, 2, 8] } },
  { name: "마크 트웨인", line: "톰 소여의 모험을 쓴 작가", born: { solar: [1835, 11, 30] } },
  { name: "차이콥스키", line: "백조의 호수를 쓴 작곡가", born: { solar: [1840, 5, 7] } },
  { name: "슈바이처", line: "아프리카에서 병원을 연 의사", born: { solar: [1875, 1, 14] } },
  { name: "코코 샤넬", line: "옷의 틀을 바꾼 디자이너", born: { solar: [1883, 8, 19] } },
  { name: "찰리 채플린", line: "웃음으로 세상을 그린 배우", born: { solar: [1889, 4, 16] } },
  { name: "월트 디즈니", line: "미키 마우스를 만든 사람", born: { solar: [1901, 12, 5] } },
  { name: "프리다 칼로", line: "자화상으로 이름난 화가", born: { solar: [1907, 7, 6] } },
  { name: "넬슨 만델라", line: "남아프리카의 화해를 이끈 대통령", born: { solar: [1918, 7, 18] } },
  { name: "앤디 워홀", line: "팝아트를 연 예술가", born: { solar: [1928, 8, 6] } },
  { name: "마틴 루서 킹", line: "나에게는 꿈이 있다고 말한 인권 운동가", born: { solar: [1929, 1, 15] } },
  { name: "오드리 헵번", line: "로마의 휴일의 배우이자 구호 활동가", born: { solar: [1929, 5, 4] } },
  { name: "엘비스 프레슬리", line: "로큰롤의 왕", born: { solar: [1935, 1, 8] } },
  { name: "존 레넌", line: "비틀스의 음악가", born: { solar: [1940, 10, 9] } },
  { name: "브루스 리", line: "무술을 세계에 알린 배우", born: { solar: [1940, 11, 27] } },
  { name: "스티븐 호킹", line: "블랙홀을 연구한 물리학자", born: { solar: [1942, 1, 8] } },
  { name: "스티브 잡스", line: "아이폰을 만든 기업가", born: { solar: [1955, 2, 24] } },
  { name: "마이클 잭슨", line: "팝의 황제", born: { solar: [1958, 8, 29] } },
];

export type IljuFigure = { name: string; line: string; stem: number; branch: number; ko: boolean };

function dayOf(b: Born): { stem: number; branch: number } {
  const e = ("lunar" in b ? Lunar.fromYmdHms(...b.lunar, 12, 0, 0) : Solar.fromYmd(...b.solar).getLunar()).getEightChar();
  return {
    stem: STEMS.indexOf(e.getDayGan() as (typeof STEMS)[number]),
    branch: BRANCHES.indexOf(e.getDayZhi() as (typeof BRANCHES)[number]),
  };
}

// Korean names are told first (a reader here meets their own history before the world's).
const FOREIGN = new Set(["바흐", "칸트", "괴테", "간디", "처칠", "피카소", "에디슨", "가우디", "모차르트", "슈베르트", "톨스토이", "나폴레옹", "프로이트", "안데르센", "헤밍웨이"]);
const isKo = (name: string) => /^[가-힣]{2,4}$/.test(name) && !FOREIGN.has(name);
// The kings of Joseon from lib/kings.ts (its dates are checked against the Annals), each with a line that says
// what the reign is remembered for; 연산군 is left out.
const KING_LINE: Record<string, string> = {
  태조: "조선을 세운 임금", 정종: "조선의 두 번째 임금", 태종: "왕권을 다진 조선의 임금", 문종: "측우기를 만드는 데 힘쓴 임금",
  단종: "어린 나이에 왕위에 오른 임금", 세조: "나라의 법과 제도를 정비한 임금", 예종: "조선의 여덟 번째 임금", 성종: "경국대전을 완성한 임금",
  중종: "조선의 열한 번째 임금", 인종: "효심으로 이름난 임금", 명종: "조선의 열세 번째 임금", 선조: "임진왜란을 겪은 임금",
  광해군: "실리를 앞세운 외교를 편 임금", 인조: "조선의 열여섯 번째 임금", 효종: "북벌을 꿈꾼 임금", 현종: "조선의 열여덟 번째 임금",
  숙종: "46년 동안 나라를 다스린 임금", 경종: "조선의 스무 번째 임금", 순조: "조선의 스물세 번째 임금", 헌종: "여덟 살에 왕위에 오른 임금",
  철종: "강화도령이라 불린 임금", 고종: "대한제국을 선포한 임금", 순종: "대한제국의 마지막 황제",
};
const KING_FIGURES: IljuFigure[] = KINGS.filter((k) => KING_LINE[k.name]).map((k) => ({ name: k.name, line: KING_LINE[k.name], stem: k.dayStem, branch: k.dayBranch, ko: true }));

export const ILJU_FIGURES: IljuFigure[] = [...RAW.map((r) => ({ name: r.name, line: r.line, ...dayOf(r.born), ko: isKo(r.name) })), ...KING_FIGURES].sort((a, b) => Number(b.ko) - Number(a.ko));

// The same day pillar if anyone has it; otherwise the same day stem (the element one is born as), so every reader
// gets someone. `same` says which.
export function figuresFor(stem: number, branch: number, max = 3): { same: "ilju" | "stem"; label: string; list: IljuFigure[] } {
  const ilju = ILJU_FIGURES.filter((f) => f.stem === stem && f.branch === branch);
  if (ilju.length) return { same: "ilju", label: `${STEMS_KO[stem]}${BRANCHES_KO[branch]}일 ${STEMS[stem]}${BRANCHES[branch]}`, list: ilju.slice(0, max) };
  return { same: "stem", label: `일간 ${STEMS_KO[stem]} ${STEMS[stem]}`, list: ILJU_FIGURES.filter((f) => f.stem === stem).slice(0, max) };
}
