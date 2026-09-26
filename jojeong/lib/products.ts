// 정 훈도의 비밀 보고서: paid reports. Every report costs the same and gets cheaper with each purchase
// (복채 단골 할인): 990 → 890 → 790 → 690, then 690 for good.

export type ProductId = "gukjeong" | "yeonae" | "jaemul" | "jikup" | "dwitjosa" | "gwangye" | "insa";

export type Product = {
  id: ProductId;
  title: string;
  hanja: string;
  for: "king" | "minister" | "anyone";
  tagline: string;
  toc: string[];
  // Shown as a free first taste before the lock.
  teaser: string;
};

// The Joseon fantasy (king grade, chronicle, 신분 감정) is free. What is sold is the present day: the finest
// fortune-reader of Joseon reading your life now.
export const PRODUCTS: Product[] = [
  {
    id: "gukjeong",
    title: "2026 신년 운세",
    hanja: "國運",
    for: "anyone",
    tagline: "병오년 한 해: 좋은 달과 조심할 달, 돈 · 일 · 연애 · 건강의 흐름",
    toc: ["병오년 총평", "좋은 달과 조심할 달", "재물 · 일 · 연애 · 건강", "올해 곁에 둘 사람", "정 훈도의 개운 처방"],
    teaser: "올해의 기운이 그대의 사주와 어떻게 맞물리는지 첫 장을 먼저 올리옵니다.",
  },
  {
    id: "yeonae",
    title: "연애 · 결혼운",
    hanja: "緣分",
    for: "anyone",
    tagline: "지금 인연이 오는지, 어떤 사람과 맞는지, 결혼은 언제쯤인지",
    toc: ["그대의 연애 기질", "끌리는 사람과 맞는 사람", "인연이 오는 시기", "결혼운과 배우자 자리", "정 훈도의 개운 처방"],
    teaser: "그대의 사주에서 배우자 자리와 인연의 흐름을 살펴 올리옵니다.",
  },
  {
    id: "jaemul",
    title: "재물운 · 돈 버는 법",
    hanja: "財物",
    for: "anyone",
    tagline: "돈이 붙는 방식, 새는 구멍, 투자 성향, 돈이 들어오는 시기",
    toc: ["그대의 재물 그릇", "돈이 붙는 방식", "돈이 새는 구멍", "투자와 저축 성향", "재물이 트이는 시기", "정 훈도의 개운 처방"],
    teaser: "그대의 사주에 재물이 어떤 모양으로 들어 있는지 살펴 올리옵니다.",
  },
  {
    id: "jikup",
    title: "직업 · 적성",
    hanja: "適性",
    for: "anyone",
    tagline: "지금 시대에 어울리는 일 세 가지, 일하는 방식, 이직 · 창업 시기",
    toc: ["그대의 타고난 재주", "어울리는 일 세 가지", "일하는 방식과 상사 · 동료 궁합", "이직과 창업의 때", "정 훈도의 개운 처방"],
    teaser: "조선이었다면 어떤 일을 했을지는 무료로 보셨사옵니다. 이번에는 지금 이 시대의 일을 봐 드리옵니다.",
  },
  {
    id: "dwitjosa",
    title: "현실 궁합 뒷조사",
    hanja: "密探",
    for: "king",
    tagline: "신하 한 명을 골라 현실 궁합: 같이 일 · 여행 · 돈거래 해도 되는지",
    toc: ["이 사람의 겉과 속", "같이 일할 때", "같이 여행할 때", "돈거래를 해도 되는가", "이 사람 다루는 법"],
    teaser: "조정에 입궐한 신하 가운데 한 명을 골라, 교지에는 적지 못한 속사정을 캐어 올리옵니다.",
  },
  {
    id: "gwangye",
    title: "모임 관계도",
    hanja: "朝廷圖",
    for: "anyone",
    tagline: "이 모임 전체의 케미 지도: 팀플 조 짜기, 여행 방 배정까지",
    toc: ["모임 전체의 기운", "누가 누구와 맞는가 (전원 궁합표)", "숨은 실세와 분위기 메이커", "팀을 나눈다면", "모임을 오래 가게 하는 법"],
    teaser: "조정의 모든 신하끼리 궁합을 맞춰 한 장의 관계도로 그려 올리옵니다.",
  },
  {
    id: "insa",
    title: "내 인사기록 열람",
    hanja: "人事",
    for: "minister",
    tagline: "이 친구(왕)가 나를 어떻게 보는지 + 현실에서 이 친구 다루는 법",
    toc: ["전하께 올라간 그대의 인사기록", "전하가 그대를 어떻게 보는가", "이 친구의 약점과 기분 푸는 법", "영의정이 되려면"],
    teaser: "정 훈도가 전하께 올린 그대에 대한 비밀 보고를 그대에게도 보여 드리옵니다.",
  },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);

export const PRICE_STEPS = [990, 890, 790, 690];
export const priceFor = (purchases: number) => PRICE_STEPS[Math.min(purchases, PRICE_STEPS.length - 1)];
