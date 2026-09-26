import { readChart, type GodGroup } from "./myeongri";
import type { Pillars } from "./saju";

// 조선 신분 감정 (free): what someone would have been in Joseon, read from the chart's most crowded ten-god
// group and whether the day master is strong. Ends with a bridge to the present-day paid reports.

export type Sinbun = {
  rank: "양반" | "중인" | "상민" | "천민";
  job: string;
  line: string;
  day: [string, string, string]; // 새벽 / 낮 / 밤
  rise: number; // 출세 가능성 1–5
  riseText: string;
  now: string;
};

const JOBS: Record<string, Sinbun> = {
  "인성-강": {
    rank: "양반",
    job: "홍문관 교리",
    line: "임금 곁에서 경연을 준비하던 학자 관리",
    day: [
      "경서 한 권을 소리 내어 읽고 나서야 입궐 가마에 올랐다.",
      "임금께 올릴 강의 자료를 고르다 동료와 주석 한 줄로 반나절을 다퉜다.",
      "집에 돌아와서도 붓을 놓지 못해 부인에게 핀잔을 들었다.",
    ],
    rise: 4,
    riseText: "정승 반열까지 오를 그릇이었다. 다만 입바른 소리 한 번에 유배를 갈 뻔한 적이 있다.",
    now: "지금으로 치면 연구·기획·전문 강의 쪽 기질이다.",
  },
  "인성-약": {
    rank: "양반",
    job: "시골 서당 훈장",
    line: "벼슬은 못 했지만 동네에서 글을 제일 잘 쓰던 몰락 양반",
    day: [
      "코흘리개 아이들에게 천자문을 외우게 하며 하루를 열었다.",
      "이웃의 편지와 소장을 대신 써 주고 곡식 한 됫박을 받았다.",
      "호롱불 아래 과거 공부를 했으나, 올해도 낙방이었다.",
    ],
    rise: 2,
    riseText: "과거에는 여러 번 떨어졌지만, 가르친 제자 하나가 판서가 되어 은혜를 갚았다.",
    now: "지금으로 치면 교육·상담·글쓰기 쪽 기질이다.",
  },
  "관성-강": {
    rank: "양반",
    job: "사헌부 감찰",
    line: "관리들의 비리를 캐던 조선의 감사관",
    day: [
      "탐관오리의 장부를 한 장씩 넘기며 숫자가 어긋난 곳을 찾았다.",
      "대낮에 관아를 불시에 들이닥쳐 창고 문을 열게 했다.",
      "원한을 산 자들을 피해 늘 다른 골목으로 퇴청했다.",
    ],
    rise: 4,
    riseText: "강직하다는 평으로 대사헌까지 올랐다. 적도 그만큼 많았다.",
    now: "지금으로 치면 법·감사·품질 관리 쪽 기질이다.",
  },
  "관성-약": {
    rank: "중인",
    job: "관상감 명과학 훈도",
    line: "왕실의 사주와 택일을 맡던 관원, 정 훈도의 동료",
    day: [
      "새벽 절기 시각을 셈하느라 산가지를 잔뜩 늘어놓았다.",
      "왕자와 공주의 혼사 궁합을 심사하며 서류 더미에 묻혔다.",
      "밤이면 관상감 옥상에서 별을 지켜보는 당직을 섰다.",
    ],
    rise: 2,
    riseText: "중인이라 품계는 정해져 있었지만, 왕실의 비밀을 가장 많이 아는 사람이었다.",
    now: "지금으로 치면 데이터 분석·컨설팅·꼼꼼한 전문직 기질이다.",
  },
  "재성-강": {
    rank: "중인",
    job: "사역원 역관",
    line: "청나라를 오가며 통역하고 슬쩍 무역도 하던 조선의 부자",
    day: [
      "사신단을 따라 압록강을 건너며 청나라 말을 중얼중얼 연습했다.",
      "통역을 마치고 나면 몰래 챙겨 간 인삼을 비단과 바꿨다.",
      "한양으로 돌아와 세 번째 기와집을 알아보러 다녔다.",
    ],
    rise: 3,
    riseText: "벼슬은 양반만 못했지만, 곳간은 웬만한 판서보다 넉넉했다.",
    now: "지금으로 치면 무역·영업·재테크 쪽 기질이다.",
  },
  "재성-약": {
    rank: "상민",
    job: "보부상",
    line: "등짐 하나로 팔도 장터를 누비던 장돌뱅이",
    day: [
      "닭 울기 전에 짐을 지고 다음 장터로 길을 나섰다.",
      "종일 목이 쉬도록 흥정해 소금 한 섬을 남겼다.",
      "주막에서 팔도 소문을 모아 다음 장사거리를 점쳤다.",
    ],
    rise: 2,
    riseText: "등짐 하나로 시작했지만, 발품을 판 끝에 객주를 차릴 수 있었다.",
    now: "지금으로 치면 영업·유통·프리랜서 기질이다.",
  },
  "식상-강": {
    rank: "중인",
    job: "도화서 화원",
    line: "임금의 초상(어진)을 그리던 궁중 화가",
    day: [
      "안료를 곱게 갈아 붓끝을 다듬는 것으로 하루를 시작했다.",
      "궁중 잔치를 그림으로 남기느라 하루 종일 붓을 놀렸다.",
      "밤이면 몰래 저잣거리 풍경을 그려 친구들에게 돌렸다.",
    ],
    rise: 3,
    riseText: "어진 화사로 뽑히면 벼슬까지 받을 수 있었다. 풍속화는 이름 없이 남았다.",
    now: "지금으로 치면 디자인·영상·크리에이터 기질이다.",
  },
  "식상-약": {
    rank: "천민",
    job: "남사당패 광대",
    line: "줄 위에서 양반을 풍자하던 재주꾼",
    day: [
      "새벽 공터에서 줄타기 연습을 하다 몇 번이고 떨어졌다.",
      "장터 한복판에서 양반 흉내를 내 구경꾼을 뒤집어지게 했다.",
      "공연이 끝나면 짐을 싸서 다음 고을로 밤길을 걸었다.",
    ],
    rise: 1,
    riseText: "신분은 가장 낮았지만, 이름만큼은 팔도에 퍼졌다.",
    now: "지금으로 치면 방송·공연·유튜버 기질이다.",
  },
  "비겁-강": {
    rank: "양반",
    job: "훈련도감 무관",
    line: "군사를 호령하던 무인",
    day: [
      "새벽 활터에서 화살 오십 발을 쏘고 나서야 아침을 먹었다.",
      "군사들을 조련하며 목청이 터지도록 호령했다.",
      "밤에는 부하들과 술잔을 기울이며 의리를 다졌다.",
    ],
    rise: 4,
    riseText: "전공을 세워 훈련대장까지 오를 수 있었다. 다만 문관들과는 늘 사이가 나빴다.",
    now: "지금으로 치면 스포츠·현장 리더·창업 기질이다.",
  },
  "비겁-약": {
    rank: "상민",
    job: "포도청 포졸",
    line: "한양 골목을 지키던 순라꾼",
    day: [
      "밤새 순라를 돌고 새벽에야 포도청으로 돌아왔다.",
      "도둑을 쫓아 골목을 세 바퀴 돌다 놓쳤다.",
      "국밥 한 그릇으로 허기를 달래며 다음 순번을 기다렸다.",
    ],
    rise: 2,
    riseText: "큰 도적 하나만 잡으면 포교로 오를 수 있었다. 그 한 번이 늘 아슬아슬했다.",
    now: "지금으로 치면 현장직·보안·몸 쓰는 일 기질이다.",
  },
  "고른-양": {
    rank: "상민",
    job: "운종가 주막 주인",
    line: "사람과 소문이 모이던 한양 한복판의 주막을 꾸리던 사람",
    day: [
      "새벽부터 국밥 솥에 불을 지피고 막걸리를 걸렀다.",
      "손님들 싸움을 말리며 팔도 소문을 귀에 담았다.",
      "문을 닫고 나면 그날 들은 소문을 비싸게 팔 곳을 셈했다.",
    ],
    rise: 3,
    riseText: "정보가 곧 돈이었다. 주막 하나가 세 채가 되었다.",
    now: "지금으로 치면 자영업·서비스·커뮤니티 운영 기질이다.",
  },
  "고른-음": {
    rank: "중인",
    job: "내의원 의관",
    line: "임금의 맥을 짚던 궁중 의사",
    day: [
      "새벽 문안 때 임금의 맥을 짚으며 숨을 죽였다.",
      "약재 창고에서 감초와 인삼의 무게를 달았다.",
      "밤이면 의서를 베껴 쓰며 처방을 궁리했다.",
    ],
    rise: 3,
    riseText: "임금의 병을 고치면 품계가 올랐다. 못 고치면 책임도 그만큼 무거웠다.",
    now: "지금으로 치면 의료·돌봄·전문 상담 기질이다.",
  },
};

// Four-character charts (made before the full chart was stored) fall back to the day stem.
const LEGACY: string[] = ["비겁-강", "재성-약", "식상-강", "인성-약", "관성-강", "고른-음", "비겁-강", "관성-약", "재성-강", "인성-강"];

export function sinbunOf(p: Pillars): Sinbun {
  const chart = readChart(p);
  if (!chart) return JOBS[LEGACY[p.dayStem]];
  const entries = Object.entries(chart.gods) as [GodGroup, number][];
  const count = Math.max(...entries.map(([, n]) => n));
  // Ties between groups are common with eight characters; the day branch settles them so no group hogs them.
  const tied = entries.filter(([, n]) => n === count).map(([g]) => g);
  const group = tied[p.dayBranch % tied.length];
  const yang = p.dayStem % 2 === 0;
  // No group stands out (at most two, shared with another): an evenly spread chart.
  if (count < 2 || (count === 2 && tied.length >= 2)) return JOBS[yang ? "고른-양" : "고른-음"];
  // A yang day master takes the outward, louder calling of its group; a yin one the quieter one.
  return JOBS[`${group}-${yang ? "강" : "약"}`];
}
