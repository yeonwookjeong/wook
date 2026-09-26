// 정 훈도의 비밀 보고서: paid reports. Every report costs the same and gets cheaper with each purchase
// (복채 단골 할인): 990 → 890 → 790 → 690, then 690 for good.

export type ProductId = "gukjeong" | "hwansaeng" | "dwitjosa" | "gwangye" | "insa" | "sinbun";

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

export const PRODUCTS: Product[] = [
  {
    id: "gukjeong",
    title: "2026 국정 운영 보고서",
    hanja: "國政",
    for: "king",
    tagline: "병오년 한 해를 나라 살림처럼: 좋은 달, 조심할 달, 분야별 흐름",
    toc: ["병오년 총평", "좋은 달과 조심할 달", "재물 · 일 · 연애 · 건강", "사람 운: 올해 곁에 둘 신하", "정 훈도의 개운 처방"],
    teaser: "올해의 기운이 전하의 사주와 어떻게 맞물리는지 첫 장을 먼저 올리옵니다.",
  },
  {
    id: "hwansaeng",
    title: "환생 보고서",
    hanja: "還生",
    for: "king",
    tagline: "전하가 2026년에 다시 태어났다면: 직업, 일하는 방식, 연애, 돈 버는 법",
    toc: ["환생한 전하의 첫인상", "어울리는 직업 세 가지", "일하는 방식과 상사 · 동료 궁합", "연애 스타일", "돈이 붙는 방법과 새는 구멍", "정 훈도의 개운 처방"],
    teaser: "조선의 옥좌를 내려놓고 지금 이 시대에 태어나셨다면 어떤 사람이셨을지 아뢰옵니다.",
  },
  {
    id: "dwitjosa",
    title: "신하 뒷조사",
    hanja: "密探",
    for: "king",
    tagline: "신하 한 명을 골라 현실 궁합을 캐다: 같이 일 · 여행 · 돈거래 해도 되는지",
    toc: ["이 신하의 겉과 속", "같이 일할 때", "같이 여행할 때", "돈거래를 해도 되는가", "이 신하 다루는 법"],
    teaser: "조정에 입궐한 신하 가운데 한 명을 골라, 교지에는 적지 못한 속사정을 캐어 올리옵니다.",
  },
  {
    id: "gwangye",
    title: "조정 관계도",
    hanja: "朝廷圖",
    for: "anyone",
    tagline: "모임 전체의 케미 지도: 팀플 조 짜기, 여행 방 배정까지",
    toc: ["조정 전체의 기운", "누가 누구와 맞는가 (전원 궁합표)", "숨은 실세와 분위기 메이커", "팀을 나눈다면", "조정을 오래 가게 하는 법"],
    teaser: "조정의 모든 신하끼리 궁합을 맞춰 한 장의 관계도로 그려 올리옵니다.",
  },
  {
    id: "insa",
    title: "내 인사기록 열람",
    hanja: "人事",
    for: "minister",
    tagline: "왕이 받은 나에 대한 보고서 + 이 왕(친구)을 현실에서 다루는 법",
    toc: ["전하께 올라간 그대의 인사기록", "전하가 그대를 어떻게 보는가", "이 왕의 약점과 기분 푸는 법", "영의정이 되려면"],
    teaser: "정 훈도가 전하께 올린 그대에 대한 비밀 보고를 그대에게도 보여 드리옵니다.",
  },
  {
    id: "sinbun",
    title: "조선 신분 감정서",
    hanja: "身分",
    for: "anyone",
    tagline: "내가 조선에 태어났다면: 신분, 직업, 하루 일과, 출세 가능성",
    toc: ["그대의 신분", "조선에서의 직업", "그대의 하루", "출세할 수 있었는가", "지금 시대에 남은 그 흔적"],
    teaser: "양반인지 중인인지, 장터의 보부상인지 궁궐의 광대인지 사주로 감정하옵니다.",
  },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);

export const PRICE_STEPS = [990, 890, 790, 690];
export const priceFor = (purchases: number) => PRICE_STEPS[Math.min(purchases, PRICE_STEPS.length - 1)];
