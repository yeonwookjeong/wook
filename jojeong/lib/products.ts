// 정 훈도의 비밀 보고서. One free report (조선 신분 감정) opens the shelf; the paid ones all cost the same and get
// cheaper with each purchase (복채 단골 할인): 990 → 890 → 790 → 690, then 690 for good.

export type ProductId = "sinbun" | "gukjeong" | "yeonae" | "jaemul" | "jikup" | "dwitjosa" | "gwangye" | "insa";

export type Product = {
  id: ProductId;
  title: string;
  hanja: string;
  for: "king" | "minister" | "anyone";
  tagline: string;
  toc: string[];
  // Shown as a free first taste before the lock.
  teaser: string;
  // Free reports open in full with no price.
  free?: boolean;
};

// The Joseon fantasy (king grade, chronicle, 신분 감정) is free. What is sold is the present day: the finest
// fortune-reader of Joseon reading your life now.
export const PRODUCTS: Product[] = [
  {
    id: "sinbun",
    title: "조선 신분 감정",
    hanja: "身分",
    for: "anyone",
    tagline: "조선에 태어났다면 어떤 신분, 어떤 일, 어떤 삶이었을지",
    toc: ["태어난 집", "그 신분의 하루", "사람들이 본 그대", "인생의 고비", "귀인과 악연", "출세", "말년"],
    teaser: "그대의 사주로 조선에서의 한평생을 일곱 장에 담아 올리옵니다.",
    free: true,
  },
  {
    id: "gukjeong",
    title: "2026 신년 운세",
    hanja: "國運",
    for: "anyone",
    tagline: "2026년 나한테 어떤 일이 생길까? 돈·일·사랑·건강부터 달마다 할 일까지",
    toc: ["그대는 이런 사람이옵니다", "2026년, 어떤 해가 될까", "돈은 들어올까, 새어 나갈까", "일: 버틸까, 옮길까", "올해 인연은 들어올까", "누구를 곁에 두고, 누구를 조심할까", "몸과 마음, 어디부터 챙길까", "언제 움직이고 언제 쉴까 (상반기)", "언제 움직이고 언제 쉴까 (하반기)", "올해를 내 편으로 만드는 법"],
    teaser: "그대의 사주로 병오년 한 해를 처음부터 끝까지 풀어 올리옵니다.",
    free: true,
  },
  {
    id: "yeonae",
    title: "연애 · 결혼운",
    hanja: "緣分",
    for: "anyone",
    tagline: "왜 늘 비슷한 사람에게 끌릴까? 나랑 진짜 맞는 사람, 결혼은 언제 누구와",
    toc: ["나는 연애할 때 어떤 사람일까", "왜 늘 비슷한 사람에게 끌릴까", "나랑 진짜 잘 맞는 사람", "연애가 자꾸 꼬이는 이유", "결혼은 언제, 어떤 사람과", "올해 연애운과 인연이 오는 달", "지금 만나는 사람이 있다면"],
    teaser: "그대의 사주에서 배우자 자리와 인연의 흐름을 살펴 올리옵니다.",
  },
  {
    id: "jaemul",
    title: "재물운 · 돈 버는 법",
    hanja: "財物",
    for: "anyone",
    tagline: "돈이 왜 안 모일까? 월급형인지 사업형인지, 투자해도 되는지, 돈이 트이는 때",
    toc: ["나는 돈을 어떻게 버는 사람일까", "돈이 모이지 않는 진짜 이유", "월급이 맞을까, 내 일이 맞을까", "투자해도 되는 사람일까", "돈이 트이는 때", "지갑을 두둑하게 하는 습관"],
    teaser: "그대의 사주에 재물이 어떤 모양으로 들어 있는지 살펴 올리옵니다.",
  },
  {
    id: "jikup",
    title: "직업 · 적성",
    hanja: "適性",
    for: "anyone",
    tagline: "지금 일이 나랑 맞을까? 어울리는 직업 세\u00a0가지, 회사형인지 독립형인지, 옮길 때",
    toc: ["나는 어떤 일을 할 때 빛날까", "지금 일이 버겁게 느껴진다면", "어울리는 일 세 가지", "회사형일까, 독립형일까", "이직·창업, 언제가 좋을까", "일이 술술 풀리는 습관"],
    teaser: "조선이었다면 어떤 일을 했을지는 무료로 보셨사옵니다. 이번에는 지금 이 시대의 일을 봐 드리옵니다.",
  },
  {
    id: "dwitjosa",
    title: "현실 궁합 뒷조사",
    hanja: "密探",
    for: "king",
    tagline: "이 사람, 겉과 속이 같을까? 같이 일해도, 여행 가도, 돈 빌려줘도 되는지",
    toc: ["이 사람, 겉과 속이 같을까", "같이 일하면 어떨까", "같이 여행 가면 어떨까", "돈 빌려줘도 될까", "이 사람과 잘 지내는 법"],
    teaser: "조정에 입궐한 신하 가운데 한 명을 골라, 교지에는 적지 못한 속사정을 캐어 올리옵니다.",
  },
  {
    id: "gwangye",
    title: "모임 관계도",
    hanja: "朝廷圖",
    for: "anyone",
    tagline: "우리 모임 케미 지도: 누가 누구랑 잘 맞고, 숨은 실세는 누구인지",
    toc: ["우리 모임은 어떤 모임일까", "누가 누구랑 찰떡이고, 누가 삐걱일까", "숨은 실세와 분위기 메이커", "팀을 나눈다면", "이 모임이 오래 가려면"],
    teaser: "조정의 모든 신하끼리 궁합을 맞춰 한 장의 관계도로 그려 올리옵니다.",
  },
  {
    id: "insa",
    title: "내 인사기록 열람",
    hanja: "人事",
    for: "minister",
    tagline: "전하(친구)는 나를 어떻게 볼까? 이 친구 기분 푸는 법까지",
    toc: ["전하께 올라간 나의 인사기록", "전하는 나를 어떻게 볼까", "이 친구가 서운해하는 포인트", "이 친구 기분 푸는 법", "더 가까워지려면"],
    teaser: "정 훈도가 전하께 올린 그대에 대한 비밀 보고를 그대에게도 보여 드리옵니다.",
  },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);

// 무료 공개 기간: every report opens in full while the writing is being polished and payments are not live.
export const OPEN_ALL = true;
export const isOpen = (p: Product) => OPEN_ALL || Boolean(p.free);

export const PRICE_STEPS = [990, 890, 790, 690];
export const priceFor = (purchases: number) => PRICE_STEPS[Math.min(purchases, PRICE_STEPS.length - 1)];
