// 정 훈도의 비밀 보고서. One free report (조선 신분 감정) opens the shelf; the paid ones all cost the same fixed
// price, lowered only on the special days listed in SALES.

export type ProductId = "sinbun" | "pyeongsaeng" | "gunghap" | "sokgunghap" | "jaehoe" | "taekil" | "gukjeong" | "yeonae" | "jaemul" | "jikup" | "dwitjosa" | "gwangye" | "insa";

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
  // Present-day reports speak plain 해요체 to "○○님"; the Joseon ones keep 정 훈도's court speech.
  modern?: boolean;
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
    id: "pyeongsaeng",
    title: "평생 사주",
    hanja: "命書",
    for: "anyone",
    tagline: "나는 어떤 사람이고 어떻게 살아갈까? 성격·돈·일·사랑·가족·건강, 인생 전체를 한 권에",
    toc: [
      "나는 어떤 사람일까",
      "남들이 보는 나, 진짜 나",
      "내 사주의 무기와 약점",
      "돈복은 어느 정도일까",
      "어떤 일을 해야 잘 풀릴까",
      "나의 연애와 결혼",
      "부모님, 형제, 그리고 자녀",
      "사람 복: 나를 돕는 사람, 조심할 사람",
      "평생 챙겨야 할 몸",
      "인생의 사계절: 초년·청년·중년·말년",
      "지금 나는 인생의 어디쯤일까",
      "앞으로 10년, 꼭 잡아야 할 기회",
      "정 훈도가 드리는 평생의 처방",
    ],
    teaser: "사주를 처음부터 끝까지, 한 권의 책처럼 풀어 드려요.",
    modern: true,
  },
  {
    id: "gunghap",
    title: "궁합",
    hanja: "宮合",
    for: "anyone",
    tagline: "우리 둘, 진짜 잘 맞을까? 왜 끌리고 왜 부딪히는지, 오래 가려면 뭘 지켜야 하는지",
    toc: ["우리 둘, 첫인상과 끌림의 정체", "서로에게 채워 주는 것, 부딪히는 것", "싸울 때 우리는 어떻게 될까", "돈과 생활, 잘 맞을까", "오래 가려면 꼭 지킬 것", "우리에게 좋은 때와 조심할 때"],
    teaser: "두 사람의 사주를 나란히 놓고, 왜 끌리고 어디서 부딪히는지 풀어 드려요.",
    modern: true,
  },
  {
    id: "sokgunghap",
    title: "속궁합",
    hanja: "合歡",
    for: "anyone",
    tagline: "말로는 다 모르는 우리 둘의 온도. 끌림, 스킨십, 애정 표현이 얼마나 잘 맞는지",
    toc: ["우리 둘의 온도, 첫 끌림의 정체", "다가가는 속도와 방식", "애정 표현, 누가 먼저 어떻게", "잘 맞는 순간과 엇갈리는 순간", "더 가까워지는 법", "관계가 깊어지는 때"],
    teaser: "두 사람 사주의 열기와 촉촉함, 끌어당기는 기운으로 친밀감의 궁합을 풀어 드려요. 만 19세 이상만 볼 수 있어요.",
    modern: true,
  },
  {
    id: "jaehoe",
    title: "재회운",
    hanja: "再會",
    for: "anyone",
    tagline: "그 사람, 다시 올까? 왜 멀어졌는지, 다시 이어질 수 있는지, 언제가 기회인지",
    toc: ["우리가 멀어진 진짜 이유", "그 사람 마음에 남아 있는 것", "다시 이어질 수 있는 인연일까", "연락이 닿기 좋은 때", "다시 만난다면 꼭 달라져야 할 것", "놓아 주는 게 나을 때"],
    teaser: "두 사람의 사주와 앞으로 몇 해의 흐름으로 다시 이어질 인연인지, 언제가 기회인지 풀어 드려요.",
    modern: true,
  },
  {
    id: "taekil",
    title: "택일 · 좋은 날 받기",
    hanja: "擇日",
    for: "anyone",
    tagline: "결혼, 이사, 개업·계약. 책력과 내 사주로 고른 좋은 날",
    toc: ["기간 안의 좋은 날 세 개", "기간 전체 길일 달력", "날짜마다 좋은 이유와 조심할 점", "그날 좋은 시간대"],
    teaser: "관상감 명과학 훈도의 본업, 택일이에요. 책력이 권하는 날에 내 사주와 부딪히지 않는 날을 골라 드려요.",
    modern: true,
  },
  {
    id: "gukjeong",
    title: "2026 신년 운세",
    hanja: "國運",
    for: "anyone",
    tagline: "2026년 나한테 어떤 일이 생길까? 돈·일·사랑·건강부터 달마다 할 일까지",
    toc: ["나는 어떤 사람일까", "2026년, 어떤 해가 될까", "돈은 들어올까, 새어 나갈까", "일: 버틸까, 옮길까", "올해 인연은 들어올까", "누구를 곁에 두고, 누구를 조심할까", "몸과 마음, 어디부터 챙길까", "언제 움직이고 언제 쉴까 (상반기)", "언제 움직이고 언제 쉴까 (하반기)", "올해를 내 편으로 만드는 법"],
    teaser: "사주로 2026년 한 해를 처음부터 끝까지 풀어 드려요.",
    free: true,
    modern: true,
  },
  {
    id: "yeonae",
    title: "연애 · 결혼운",
    hanja: "緣分",
    for: "anyone",
    tagline: "왜 늘 비슷한 사람에게 끌릴까? 나랑 진짜 맞는 사람, 결혼은 언제 누구와",
    toc: ["나는 연애할 때 어떤 사람일까", "왜 늘 비슷한 사람에게 끌릴까", "나랑 진짜 잘 맞는 사람", "연애가 자꾸 꼬이는 이유", "결혼은 언제, 어떤 사람과", "올해 연애운과 인연이 오는 달", "지금 만나는 사람이 있다면"],
    teaser: "사주에서 배우자 자리와 인연의 흐름을 살펴 드려요.",
    modern: true,
  },
  {
    id: "jaemul",
    title: "재물운 · 돈 버는 법",
    hanja: "財物",
    for: "anyone",
    tagline: "돈이 왜 안 모일까? 월급형인지 사업형인지, 투자해도 되는지, 돈이 트이는 때",
    toc: ["나는 돈을 어떻게 버는 사람일까", "돈이 모이지 않는 진짜 이유", "월급이 맞을까, 내 일이 맞을까", "투자해도 되는 사람일까", "돈이 트이는 때", "지갑을 두둑하게 하는 습관"],
    teaser: "사주에 재물이 어떤 모양으로 들어 있는지 살펴 드려요.",
    modern: true,
  },
  {
    id: "jikup",
    title: "직업 · 적성",
    hanja: "適性",
    for: "anyone",
    tagline: "지금 일이 나랑 맞을까? 어울리는 직업 세\u00a0가지, 회사형인지 독립형인지, 옮길 때",
    toc: ["나는 어떤 일을 할 때 빛날까", "지금 일이 버겁게 느껴진다면", "어울리는 일 세 가지", "회사형일까, 독립형일까", "이직·창업, 언제가 좋을까", "일이 술술 풀리는 습관"],
    teaser: "조선이었다면 어떤 일을 했을지는 무료로 보셨죠? 이번에는 지금 이 시대의 일을 봐 드려요.",
    modern: true,
  },
  {
    id: "dwitjosa",
    title: "현실 궁합 뒷조사",
    hanja: "密探",
    for: "king",
    tagline: "이 사람, 겉과 속이 같을까? 같이 일해도, 여행 가도, 돈 빌려줘도 되는지",
    toc: ["이 사람, 겉과 속이 같을까", "같이 일하면 어떨까", "같이 여행 가면 어떨까", "돈 빌려줘도 될까", "이 사람과 잘 지내는 법"],
    teaser: "조정에 입궐한 신하 가운데 한 명을 골라, 교지에는 적지 못한 속사정을 캐어 올리옵니다.",
    free: true,
  },
  {
    id: "gwangye",
    title: "모임 관계도",
    hanja: "朝廷圖",
    for: "anyone",
    tagline: "우리 모임 케미 지도: 누가 누구랑 잘 맞고, 숨은 실세는 누구인지",
    toc: ["우리 모임은 어떤 모임일까", "누가 누구랑 찰떡이고, 누가 삐걱일까", "숨은 실세와 분위기 메이커", "팀을 나눈다면", "이 모임이 오래 가려면"],
    teaser: "조정의 모든 신하끼리 궁합을 맞춰 한 장의 관계도로 그려 올리옵니다.",
    free: true,
  },
  {
    id: "insa",
    title: "내 인사기록 열람",
    hanja: "人事",
    for: "minister",
    tagline: "전하(친구)는 나를 어떻게 볼까? 이 친구 기분 푸는 법까지",
    toc: ["전하께 올라간 나의 인사기록", "전하는 나를 어떻게 볼까", "이 친구가 서운해하는 포인트", "이 친구 기분 푸는 법", "더 가까워지려면"],
    teaser: "정 훈도가 전하께 올린 그대에 대한 비밀 보고를 그대에게도 보여 드리옵니다.",
    free: true,
  },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);

// Sets: several one-person reports for the same chart, bought at once. Two-person reports stay out, since a
// set must be fixed when it is paid for (a credit to spend later would be a prepaid voucher).
export const SETS = {
  life: { title: "인생 세트", products: ["pyeongsaeng", "jaemul", "jikup"] as ProductId[], price: 2490 },
  all: { title: "전부 세트", products: ["pyeongsaeng", "yeonae", "jaemul", "jikup"] as ProductId[], price: 2990 },
};
export type SetId = keyof typeof SETS;
export const setOf = (v: unknown): SetId | null => (typeof v === "string" && v in SETS ? (v as SetId) : null);
export const setsWith = (id: ProductId) => (Object.keys(SETS) as SetId[]).filter((s) => SETS[s].products.includes(id));

// Reports about two people typed in together (lib/pairToken.ts), and the relation some of them fix.
export const PAIR_PRODUCTS: ProductId[] = ["gunghap", "sokgunghap", "jaehoe"];
export const isPair = (p: Product | ProductId) => PAIR_PRODUCTS.includes(typeof p === "string" ? p : p.id);
export const FIXED_RELATION: Partial<Record<ProductId, "lover" | "ex">> = { sokgunghap: "lover", jaehoe: "ex" };
// 속궁합 is for adults only (만 19세 이상, by birth year).
export const ADULT_ONLY: ProductId[] = ["sokgunghap"];
// 청소년보호법: 19세가 되는 해의 1월 1일부터 성인으로 본다.
export const isAdult = (birthYear: number | null) => birthYear !== null && new Date().getFullYear() - birthYear >= 19;

// 무료 공개 기간: every report opens in full until selling starts. OPEN_ALL=0 in the environment ends it.
export const OPEN_ALL = process.env.OPEN_ALL !== "0";
export const isOpen = (p: Product) => OPEN_ALL || Boolean(p.free);

export const PRICE = 990;

// Special-day sales, in KST dates, both ends inclusive. Outside them every report is PRICE.
// e.g. { name: "설날 행사", from: "2027-02-05", to: "2027-02-09", price: 590 }
type Sale = { name: string; from: string; to: string; price: number };
const SALES: Sale[] = [];

const kstDate = (now: Date) => new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
export function saleNow(now = new Date()): Sale | null {
  const today = kstDate(now);
  return SALES.find((s) => s.from <= today && today <= s.to && s.price > 0 && s.price < PRICE) ?? null;
}
export const priceNow = (now = new Date()) => saleNow(now)?.price ?? PRICE;
// "설날 행사 · 2월 9일까지"
export const saleLabel = (s: Sale) => `${s.name} · ${Number(s.to.slice(5, 7))}월 ${Number(s.to.slice(8))}일까지`;
