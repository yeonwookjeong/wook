import { factsOf, type Facts } from "./byeoseul";
import { TRACK, TRACKS, officeName, sameRankIndex, type Jo, type Office, type Track } from "./byeoseulRanks";
import POP from "./byeoseulPop.json";
import type { TenGod } from "./myeongri";
import type { Pillars } from "./saju";

// 벼슬길 시뮬레이션 (2026-11-17, 대표님 "선택극장처럼, 내 사주로 옛날 벼슬 시뮬레이션, 결과가 ㅈㄴ 다양하게, 정1품부터
// 종9품까지 어디를 가면 어디까지 올라갈 수 있는지"). Nine events, four doors each. Every door is decided by one
// part of the chart: the same door goes well for one chart and badly for another, and the reader can open the
// doors not taken to see what they would have brought (선택극장). The road walked is a ladder of real offices
// (lib/byeoseulRanks.ts); every road also has a ceiling this chart reaches, so the end can say how far each road
// would have gone. Nothing is random: one chart and one set of picks give one life.

export type Trait = TenGod | "역마" | "도화" | "화개" | "귀인" | "양인" | "문창";
export type Tier = 0 | 1 | 2; // 0 잘 풀림, 1 그럭저럭, 2 역풍

export type Out = { text: string; step: number; life?: number; to?: Track; flag?: "fled" | "sayak" };
export type Door = { id: string; label: string; trait: [Trait, number][]; out: [Out, Out, Out]; to?: Track };
export type Scene = { id: string; art: string; title: string; text: string; doors: Door[] };

export const TRAIT_WORD: Record<Trait, string> = {
  정인: "배움과 윗사람 덕(정인)",
  편인: "남다른 눈(편인)",
  식신: "베풀고 기르는 힘(식신)",
  상관: "바른말의 기운(상관)",
  정재: "꼼꼼한 살림(정재)",
  편재: "세상을 굴리는 수완(편재)",
  정관: "질서와 신용(정관)",
  편관: "압박을 견디는 힘(편관)",
  비견: "제 힘으로 서는 기운(비견)",
  겁재: "밀어붙이는 배짱(겁재)",
  역마: "움직이는 별(역마)",
  도화: "사람을 끄는 별(도화)",
  화개: "홀로 깊어지는 별(화개)",
  귀인: "돕는 이를 부르는 별(천을귀인)",
  양인: "칼을 쥔 별(양인)",
  문창: "글재주의 별(문창귀인)",
};

const GROUP: Record<TenGod, keyof Facts["g"]> = {
  비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상", 편재: "재성", 정재: "재성", 편관: "관성", 정관: "관성", 편인: "인성", 정인: "인성",
};
const PAIR: Record<TenGod, TenGod> = {
  비견: "겁재", 겁재: "비견", 식신: "상관", 상관: "식신", 편재: "정재", 정재: "편재", 편관: "정관", 정관: "편관", 편인: "정인", 정인: "편인",
};
const SAL: Partial<Record<Trait, string>> = { 역마: "역마", 도화: "도화", 화개: "화개", 귀인: "천을귀인", 양인: "양인", 문창: "문창귀인" };

// How much of a trait the chart holds: a ten god is its group's share leaning to that side; a 신살 is there or not.
export function traitOf(f: Facts, k: Trait): number {
  const sal = SAL[k];
  if (sal) return f.sals.has(sal as never) ? 0.3 : 0;
  const god = k as TenGod;
  const a = f.t[god];
  const b = f.t[PAIR[god]];
  return f.g[GROUP[god]] * (a + b ? a / (a + b) : 0.5);
}
const doorScore = (f: Facts, d: Door) => d.trait.reduce((s, [k, w]) => s + traitOf(f, k) * w, 0);

// ── The ceiling of each road for this chart.
const TRACK_TRAIT: Record<Track, [Trait, number][]> = {
  jo: [["정관", 1], ["정재", 0.4], ["정인", 0.4]],
  eon: [["상관", 1], ["정관", 0.4]],
  hong: [["정인", 1], ["문창", 0.5]],
  seong: [["정인", 0.7], ["식신", 0.5], ["편인", 0.3]],
  suryeong: [["정재", 0.8], ["편재", 0.5], ["비견", 0.3]],
  hun: [["비견", 0.7], ["겁재", 0.5], ["편관", 0.5]],
  byeon: [["편관", 1], ["역마", 0.5], ["양인", 0.5]],
  podo: [["상관", 0.6], ["편관", 0.6], ["양인", 0.5]],
  gwansang: [["편인", 1], ["화개", 0.6]],
  naeui: [["식신", 1], ["정인", 0.3]],
  yeok: [["편재", 1], ["역마", 0.6]],
};
export const trackRaw = (f: Facts, t: Track) => TRACK_TRAIT[t].reduce((s, [k, w]) => s + traitOf(f, k) * w, 0);

const pctOf = (sorted: number[], v: number) => {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (sorted[m] <= v) lo = m + 1;
    else hi = m;
  }
  return lo / sorted.length;
};

// Where this chart stands among all births on a road (0..1), and so how far up its ladder it can climb: from a
// little under half the way for the least suited to the very top for the best suited; 신강 carries one step more.
export function ceilingOf(f: Facts, t: Track): number {
  const pct = pctOf((POP.track as Record<string, number[]>)[t], trackRaw(f, t));
  const top = TRACK[t].ladder.length - 1;
  const strong = f.r.strength === "신강" || f.r.strength === "극신강" ? 1 : 0;
  return Math.max(1, Math.min(top, Math.round(top * (0.45 + 0.55 * pct)) + strong));
}

// 잘 풀림 / 그럭저럭 / 역풍 for a door: where the chart stands among all births on that door's trait, in thirds.
export function tierOf(f: Facts, d: Door): Tier {
  const [lo, hi] = (POP.door as Record<string, number[]>)[d.id] ?? [0.1, 0.2];
  const s = doorScore(f, d);
  // A door whose trait a third of births lack entirely: having none of it is the 역풍.
  return s > hi ? 0 : s < lo || (lo === 0 && s === 0) ? 2 : 1;
}

export function joOf(f: Facts): Jo {
  const c: [Jo, number][] = [
    ["이조", f.g.관성 * 1.05],
    ["호조", f.g.재성],
    ["예조", f.g.인성],
    ["병조", traitOf(f, "편관") * 1.6],
    ["형조", traitOf(f, "상관") * 1.6],
    ["공조", traitOf(f, "식신") * 1.6],
  ];
  return c.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

// ── The nine scenes. `{office}` is the office held when the scene opens.
const o = (text: string, step: number, extra: Partial<Out> = {}): Out => ({ text, step, ...extra });

export const EXAM: Scene = {
  id: "exam",
  art: "yard",
  title: "과거장",
  text: "스무 살 남짓, 그대는 과거를 보러 한양에 올라왔사옵니다. 어느 과거에 이름을 걸겠사옵니까.",
  doors: [
    { id: "ex-mun", label: "문과, 붓으로 나라를 다스리겠다", trait: [["정인", 1], ["정관", 0.6], ["문창", 0.4]], out: [o("시권이 장원으로 뽑혔사옵니다. 첫 자리부터 한 계단 위에서 시작하옵니다.", 1), o("무난히 급제했사옵니다.", 0), o("두 번 낙방하고 세 번째에야 급제했사옵니다.", 0)] },
    { id: "ex-mu", label: "무과, 활과 말로 이름을 떨치겠다", trait: [["비견", 0.7], ["편관", 0.7], ["양인", 0.5]], out: [o("활 열 발이 모두 과녁에 꽂혔사옵니다. 장원이옵니다.", 1), o("말 위에서 한 번 휘청였으나 급제했사옵니다.", 0), o("낙마해 한 해를 쉬고서야 급제했사옵니다.", 0)] },
    { id: "ex-jap", label: "잡과, 재주 하나로 서겠다", trait: [["식신", 0.6], ["편재", 0.6], ["편인", 0.6]], out: [o("시험관이 그대의 재주에 놀라 바로 이름을 적었사옵니다.", 1), o("차분히 급제했사옵니다.", 0), o("문제 하나를 잘못 읽어 겨우 붙었사옵니다.", 0)] },
    { id: "ex-eum", label: "시험은 됐다, 조상 덕으로 들어간다", trait: [["정인", 0.6], ["정재", 0.6], ["귀인", 0.6]], out: [o("할아버지의 이름이 문을 활짝 열어 주었사옵니다.", 1), o("음서로 조용히 첫 벼슬을 받았사옵니다.", 0), o("음서 출신이라고 뒤에서 수군거렸사옵니다.", 0)] },
  ],
};

// The first post, by the exam taken.
export const FIRST: Record<string, Scene> = {
  "ex-mun": {
    id: "first-mun",
    art: "gate",
    title: "첫 벼슬",
    text: "이조에서 첫 자리를 고르라 하옵니다.",
    doors: [
      { id: "f-hong", to: "hong", label: "홍문관, 임금의 학문을 돕겠다", trait: [["정인", 1], ["문창", 0.5]], out: [o("옥당에 들어가 첫해부터 경연에 불려 나갔사옵니다.", 1), o("책 냄새 나는 방에서 조용히 일을 익혔사옵니다.", 0), o("선배들 틈에서 한동안 붓만 갈았사옵니다.", 0)] },
      { id: "f-jo", to: "jo", label: "승문원, 나랏일의 큰길로", trait: [["정관", 1], ["정재", 0.4]], out: [o("외교 문서를 한 글자도 안 틀려 이름이 났사옵니다.", 1), o("문서를 베끼며 나랏일을 배웠사옵니다.", 0), o("실수 한 번에 크게 꾸중을 들었사옵니다.", 0)] },
      { id: "f-eon", to: "eon", label: "예문관, 사관이 되어 바른 기록을", trait: [["상관", 1], ["정관", 0.3]], out: [o("임금 곁에서 한 마디도 빠짐없이 적어 신임을 얻었사옵니다.", 1), o("붓을 들고 어전 구석에 앉았사옵니다.", 0), o("적지 말라는 말을 적었다가 눈총을 받았사옵니다.", 0)] },
      { id: "f-seong", to: "seong", label: "성균관, 인재를 기르겠다", trait: [["정인", 0.6], ["식신", 0.7]], out: [o("유생들이 그대 강의에 줄을 섰사옵니다.", 1), o("유생들과 함께 책을 읽었사옵니다.", 0), o("유생들이 그대를 만만히 보았사옵니다.", 0)] },
    ],
  },
  "ex-mu": {
    id: "first-mu",
    art: "gate",
    title: "첫 벼슬",
    text: "병조에서 첫 자리를 고르라 하옵니다.",
    doors: [
      { id: "f-hun", to: "hun", label: "훈련도감, 한양의 군영으로", trait: [["비견", 0.8], ["겁재", 0.5]], out: [o("첫 훈련에서 병사들의 마음을 얻었사옵니다.", 1), o("병사들과 함께 땀을 흘렸사옵니다.", 0), o("고참 병사들이 그대 말을 듣지 않았사옵니다.", 0)] },
      { id: "f-byeon", to: "byeon", label: "국경의 진, 눈보라 속으로", trait: [["편관", 1], ["역마", 0.6]], out: [o("첫 겨울에 오랑캐를 물리쳐 공을 세웠사옵니다.", 1), o("눈보라 속에서 성을 지켰사옵니다.", 0), o("추위에 병을 얻어 한동안 누웠사옵니다.", 0, { life: -1 })] },
      { id: "f-podo", to: "podo", label: "포도청, 한양의 도적을 잡겠다", trait: [["상관", 0.6], ["편관", 0.7]], out: [o("첫 달에 이름난 도적 떼를 일망타진했사옵니다.", 1), o("골목을 돌며 얼굴을 익혔사옵니다.", 0), o("도적을 쫓다 놓쳐 웃음거리가 되었사옵니다.", 0)] },
      { id: "f-su", to: "suryeong", label: "무관 출신 수령, 고을을 맡겠다", trait: [["정재", 0.8], ["비견", 0.4]], out: [o("고을 장부를 단번에 바로잡았사옵니다.", 1), o("작은 고을을 맡아 조용히 다스렸사옵니다.", 0), o("아전들이 그대를 속였사옵니다.", 0)] },
    ],
  },
  "ex-jap": {
    id: "first-jap",
    art: "gate",
    title: "첫 벼슬",
    text: "어느 관청에서 재주를 쓰겠사옵니까.",
    doors: [
      { id: "f-gwan", to: "gwansang", label: "관상감, 하늘과 날을 읽겠다", trait: [["편인", 1], ["화개", 0.6]], out: [o("첫해에 일식 날짜를 정확히 맞혔사옵니다.", 1), o("밤마다 별을 보며 기록했사옵니다.", 0), o("비 오는 날을 맑다 했다가 혼이 났사옵니다.", 0)] },
      { id: "f-naeui", to: "naeui", label: "내의원, 임금의 몸을 돌보겠다", trait: [["식신", 1], ["정인", 0.3]], out: [o("왕자의 열병을 사흘 만에 내리게 했사옵니다.", 1), o("약재를 다듬으며 일을 배웠사옵니다.", 0), o("약 한 첩을 잘못 지어 경을 쳤사옵니다.", 0)] },
      { id: "f-yeok", to: "yeok", label: "사역원, 사신을 따라 바다 건너로", trait: [["편재", 1], ["역마", 0.6]], out: [o("첫 사행길에 통역으로 큰 거래를 성사시켰사옵니다.", 1), o("사신단 끝자리에서 길을 따랐사옵니다.", 0), o("말 한 마디를 잘못 옮겨 사신이 곤란해졌사옵니다.", 0)] },
      { id: "f-re", to: "jo", label: "아니다, 문과에 다시 도전한다", trait: [["정인", 0.8], ["비견", 0.5]], out: [o("문과에도 급제해 승문원으로 옮겼사옵니다.", 1), o("세 번 만에 문과에 붙었사옵니다.", 0), o("문과는 끝내 높았사옵니다. 늦게서야 붙었사옵니다.", 0)] },
    ],
  },
  "ex-eum": {
    id: "first-eum",
    art: "gate",
    title: "첫 벼슬",
    text: "조상 덕으로 받은 자리, 어디서 시작하겠사옵니까.",
    doors: [
      { id: "f-e-su", to: "suryeong", label: "능참봉, 왕릉을 지키며 시작", trait: [["정재", 0.8], ["화개", 0.4]], out: [o("왕릉을 정성껏 지켜 임금이 이름을 기억했사옵니다.", 1), o("한적한 능에서 몇 해를 보냈사옵니다.", 0), o("능을 지키다 지루해 병이 날 뻔했사옵니다.", 0)] },
      { id: "f-e-jo", to: "jo", label: "승문원, 큰길로 바로", trait: [["정관", 1]], out: [o("음서 출신답지 않게 일을 잘해 놀라움을 샀사옵니다.", 1), o("눈치를 보며 일을 익혔사옵니다.", 0), o("급제 출신들이 그대를 따돌렸사옵니다.", 0)] },
      { id: "f-e-seong", to: "seong", label: "성균관, 학문으로 인정받겠다", trait: [["정인", 1]], out: [o("유생들 앞에서 실력으로 입을 다물게 했사옵니다.", 1), o("조용히 책을 읽었사옵니다.", 0), o("유생들이 음서라 비웃었사옵니다.", 0)] },
      { id: "f-e-hun", to: "hun", label: "훈련도감, 몸으로 증명하겠다", trait: [["비견", 0.7], ["편관", 0.5]], out: [o("병사들보다 먼저 뛰어 인정을 받았사옵니다.", 1), o("군영의 법도를 익혔사옵니다.", 0), o("훈련에서 다쳐 한동안 쉬었사옵니다.", 0, { life: -1 })] },
    ],
  },
};

export const EVENTS: Scene[] = [
  {
    id: "bribe",
    art: "gansin",
    title: "윗사람의 비리",
    text: "{office}로 일하던 어느 날, 윗사람이 나랏돈을 빼돌리는 것을 보았사옵니다.",
    doors: [
      { id: "b-report", label: "상소로 고발한다", trait: [["상관", 1], ["정관", 0.3]], out: [o("상소가 임금 눈에 들어, 바른말 하는 자리로 발탁되었사옵니다.", 1, { to: "eon" }), o("상소는 올라갔으나 조용히 묻혔사옵니다.", 0), o("증거가 모자라 오히려 무고죄로 몰렸사옵니다.", -1)] },
      { id: "b-wait", label: "증거를 모아 때를 기다린다", trait: [["편인", 1], ["정인", 0.3]], out: [o("삼 년 뒤, 모아 둔 증거로 단번에 끌어내리고 그 자리에 앉았사옵니다.", 2), o("증거는 모았으나 윗사람이 먼저 자리를 떴사옵니다.", 0), o("눈치챈 윗사람이 그대를 먼 고을로 보냈사옵니다.", -1, { to: "suryeong" })] },
      { id: "b-side", label: "못 본 척, 윗사람 편에 선다", trait: [["편재", 1], ["정재", 0.3]], out: [o("윗사람이 그대를 아껴 직접 끌어 주었사옵니다.", 2), o("조용히 넘어갔으나 마음 한구석이 무거웠사옵니다.", 1), o("윗사람이 걸려들 때 그대도 함께 엮였사옵니다.", -2, { life: -1 })] },
      { id: "b-face", label: "직접 찾아가 따진다", trait: [["겁재", 1], ["비견", 0.5], ["양인", 0.5]], out: [o("윗사람이 뉘우치고 돈을 돌려놓았사옵니다. 그 배짱이 소문났지요.", 1), o("말다툼만 하고 끝났사옵니다.", 0), o("미운털이 박혀 외딴 고을로 쫓겨났사옵니다.", -1, { to: "suryeong" })] },
    ],
  },
  {
    id: "famine",
    art: "gate",
    title: "흉년",
    text: "그대가 맡은 곳에 흉년이 들어, 백성들이 굶고 있사옵니다.",
    doors: [
      { id: "fa-open", label: "허락 없이 나라 곳간을 연다", trait: [["겁재", 0.6], ["양인", 0.6], ["식신", 0.4]], out: [o("백성이 살아났고, 임금은 그 결단을 칭찬했사옵니다.", 2), o("백성은 살았으나 곳간을 연 죄로 녹봉이 깎였사옵니다.", 0), o("명을 어긴 죄로 파직되어 한 해를 쉬었사옵니다.", -1)] },
      { id: "fa-rich", label: "부자들을 설득해 쌀을 내게 한다", trait: [["식신", 1], ["도화", 0.4]], out: [o("부자들이 앞다퉈 쌀을 내놓아 한 사람도 굶어 죽지 않았사옵니다.", 1), o("쌀은 모였으나 모자랐사옵니다.", 0), o("부자들이 비웃으며 대문을 닫았사옵니다.", 0)] },
      { id: "fa-wait", label: "조정에 보고하고 명을 기다린다", trait: [["정관", 1]], out: [o("보고서가 꼼꼼하다 하여 조정에 불려 올라갔사옵니다.", 1), o("명이 늦게 내려와 반쯤만 구했사옵니다.", 0), o("명을 기다리는 사이 민란이 일어났사옵니다.", -1)] },
      { id: "fa-buy", label: "다른 고을에서 쌀을 사 온다", trait: [["편재", 1], ["역마", 0.5]], out: [o("싼 쌀을 배로 실어 와 고을도 살리고 곳간도 채웠사옵니다.", 2), o("쌀값이 올라 본전치기였사옵니다.", 0), o("쌀배가 풍랑에 가라앉았사옵니다.", -1)] },
    ],
  },
  {
    id: "faction",
    art: "gansin",
    title: "당쟁",
    text: "조정이 두 패로 갈려, 그대에게도 줄을 서라 하옵니다.",
    doors: [
      { id: "fc-strong", label: "힘센 쪽에 선다", trait: [["정관", 0.7], ["정재", 0.5]], out: [o("이긴 편이 되어 단숨에 두 계단 올랐사옵니다.", 2), o("이긴 편이었으나 좋은 자리는 남이 먼저 차지했사옵니다.", 1), o("힘센 쪽이 하루아침에 무너졌사옵니다.", -2, { life: -1 })] },
      { id: "fc-right", label: "옳다고 믿는 쪽에 선다", trait: [["상관", 0.8], ["정인", 0.4]], out: [o("바른 쪽이 끝내 이겼고, 그대 이름이 맨 앞에 섰사옵니다.", 2), o("졌으나 지조 있다는 평을 얻었사옵니다.", 0), o("진 편이 되어 귀양을 갔사옵니다.", -2, { life: -1 })] },
      { id: "fc-none", label: "어느 편도 들지 않는다", trait: [["정인", 0.6], ["화개", 0.6]], out: [o("두 편이 싸우는 사이 그대만 남아 자리를 지켰사옵니다.", 1), o("미움도 사랑도 받지 않았사옵니다.", 0), o("양쪽에서 버림받아 한직으로 밀려났사옵니다.", -1)] },
      { id: "fc-peace", label: "두 편을 화해시키겠다 나선다", trait: [["귀인", 0.8], ["식신", 0.6]], out: [o("귀인의 도움으로 화해를 이끌어, 임금의 큰 신임을 얻었사옵니다.", 3), o("잠시 싸움을 멈췄을 뿐이었사옵니다.", 0), o("양쪽 모두에게 첩자로 몰렸사옵니다.", -1)] },
    ],
  },
  {
    id: "marriage",
    art: "throne",
    title: "혼담",
    text: "{office} 그대에게, 혼담이 세 집에서 들어왔사옵니다.",
    doors: [
      { id: "m-power", label: "권세가 집안과 혼인한다", trait: [["정재", 1], ["정관", 0.3]], out: [o("처가의 힘으로 출셋길이 활짝 열렸사옵니다.", 2), o("처가 덕을 조금 보았사옵니다.", 1), o("처가가 역모에 휘말려 그대까지 의심받았사옵니다.", -2, { life: -1 })] },
      { id: "m-love", label: "마음 가는 사람과 혼인한다", trait: [["도화", 0.7], ["식신", 0.6]], out: [o("집안이 화목하니 일도 술술 풀렸사옵니다.", 1, { life: 1 }), o("출세에 도움은 없었으나 행복했사옵니다.", 0, { life: 1 }), o("가난한 살림에 벼슬길이 더뎠사옵니다.", -1)] },
      { id: "m-teacher", label: "스승 댁과 혼인한다", trait: [["정인", 1]], out: [o("장인이 대제학이라 학문의 길이 열렸사옵니다.", 1, { to: "hong" }), o("점잖은 집안에서 조용히 살았사옵니다.", 0), o("장인과 뜻이 맞지 않아 늘 불편했사옵니다.", 0)] },
      { id: "m-none", label: "혼인은 미루고 일에 묻힌다", trait: [["비견", 0.6], ["화개", 0.6]], out: [o("일에만 몰두해 누구보다 빨리 올랐사옵니다.", 2), o("일은 잘 풀렸으나 외로웠사옵니다.", 1), o("홀로 지내다 병을 얻었사옵니다.", 0, { life: -1 })] },
    ],
  },
  {
    id: "secret",
    art: "throne",
    title: "임금의 밀명",
    text: "어느 밤, 임금이 그대만 따로 불러 한 대신을 몰래 살피라 하옵니다.",
    doors: [
      { id: "s-obey", label: "명을 받든다", trait: [["정관", 1], ["편관", 0.3]], out: [o("임금의 그림자가 되어 측근 중의 측근이 되었사옵니다.", 2), o("맡은 일만 하고 조용히 물러났사옵니다.", 1), o("대신에게 들켜 원한을 샀사옵니다.", -1)] },
      { id: "s-refuse", label: "정중히 거절한다", trait: [["상관", 0.8], ["정인", 0.3]], out: [o("임금이 오히려 그 곧은 뜻을 아껴 중히 썼사옵니다.", 1), o("임금이 서운해했으나 탈은 없었사옵니다.", 0), o("임금의 눈 밖에 나 지방으로 보내졌사옵니다.", -1, { to: "suryeong" })] },
      { id: "s-tip", label: "받드는 척하고 대신에게 귀띔한다", trait: [["편재", 1], ["겁재", 0.3]], out: [o("대신이 은혜를 잊지 않고 두고두고 그대를 밀어주었사옵니다.", 2), o("양쪽 눈치만 보다 끝났사옵니다.", 0), o("이중첩자로 들통났사옵니다.", -3, { life: -2 })] },
      { id: "s-fair", label: "사사로움 없이 조사해 그대로 아뢴다", trait: [["편인", 0.7], ["정관", 0.4]], out: [o("대신의 비리가 드러나, 그 자리를 그대가 이어받았사옵니다.", 2), o("대신은 깨끗했고, 임금은 그대를 믿게 되었사옵니다.", 1), o("조사하는 동안 그대 뒷말이 퍼졌사옵니다.", -1)] },
    ],
  },
  {
    id: "frame",
    art: "exile",
    title: "모함",
    text: "누군가 그대를 역모로 모함해, 의금부로 끌려갔사옵니다.",
    doors: [
      { id: "fr-plead", label: "결백을 밝히는 상소를 올린다", trait: [["정인", 0.7], ["정관", 0.4]], out: [o("결백이 밝혀지고, 모함한 자가 벌을 받았사옵니다.", 1), o("풀려났으나 한 계단 내려앉았사옵니다.", -1), o("상소가 오히려 화를 키워 먼 섬으로 귀양 갔사옵니다.", -2)] },
      { id: "fr-exile", label: "순순히 귀양을 떠난다", trait: [["화개", 0.6], ["편인", 0.7]], out: [o("귀양지에서 쓴 책이 한양까지 소문나 다시 불려 왔사옵니다.", 1, { to: "hong" }), o("몇 해 뒤 조용히 풀려났사옵니다.", -1), o("섬의 풍토병에 몸이 많이 상했사옵니다.", -1, { life: -2 })] },
      { id: "fr-flee", label: "몰래 도망친다", trait: [["역마", 1], ["편재", 0.5]], out: [o("국경을 넘어 장사를 시작했고, 끝내 거상이 되었사옵니다.", 0, { flag: "fled" }), o("숨어 지내다 사면을 받아 돌아왔사옵니다.", -1), o("붙잡혀 죄가 더 무거워졌사옵니다.", -2, { life: -2 })] },
      { id: "fr-patron", label: "귀인에게 도움을 청한다", trait: [["귀인", 1], ["정인", 0.3]], out: [o("높은 분이 나서 하루 만에 풀려났고, 오히려 한 계단 올랐사옵니다.", 1), o("도움을 받아 겨우 목숨을 건졌사옵니다.", -1), o("귀인마저 등을 돌렸사옵니다.", -2)] },
    ],
  },
  {
    id: "last",
    art: "hero",
    title: "마지막 물음",
    text: "세월이 흘러 머리가 희었사옵니다. 임금이 마지막으로 묻사옵니다. 무엇을 남기겠는가.",
    doors: [
      { id: "l-reform", label: "목숨을 건 개혁 상소를 올린다", trait: [["상관", 0.7], ["양인", 0.6]], out: [o("상소가 받아들여져 나라가 바뀌었고, 그대는 두 계단 더 올랐사옵니다.", 2), o("상소는 반만 받아들여졌사옵니다.", 1), o("상소가 임금의 역린을 건드렸사옵니다. 사약이 내려왔사옵니다.", 0, { life: -9, flag: "sayak" })] },
      { id: "l-teach", label: "후학을 길러 내겠다", trait: [["정인", 0.7], ["식신", 0.5]], out: [o("그대의 제자들이 다음 대의 정승이 되었고, 임금이 그 공을 높였사옵니다.", 1), o("서원을 열어 조용히 가르쳤사옵니다.", 0), o("제자들이 하나둘 떠났사옵니다.", 0)] },
      { id: "l-home", label: "고향으로 돌아가겠다", trait: [["비견", 0.6], ["정재", 0.6]], out: [o("임금이 아쉬워하며 한 품계를 더 올려 보냈사옵니다.", 1), o("고향에서 편히 지냈사옵니다.", 0, { life: 1 }), o("고향 사람들이 몰라봐 쓸쓸했사옵니다.", 0)] },
      { id: "l-give", label: "재산을 백성에게 나눈다", trait: [["식신", 0.7], ["편재", 0.4]], out: [o("백성들이 그대 이름으로 비석을 세웠고, 임금이 크게 상을 내렸사옵니다.", 1), o("백성이 고마워했사옵니다.", 0), o("친척들이 들고일어나 집안이 시끄러웠사옵니다.", 0)] },
    ],
  },
];

export const ALL_DOORS: Door[] = [EXAM, ...Object.values(FIRST), ...EVENTS].flatMap((s) => s.doors);

// ── Walking the road.

export type Step = { scene: string; door: string; tier: Tier; out: Out; from: Office; to: Office; track: Track; capped: boolean };
export type Life = {
  track: Track;
  index: number;
  life: number;
  steps: Step[];
  dead: boolean;
  fled: boolean;
  sayak: boolean;
  capped: boolean; // reached this chart's ceiling on the road and went no further
};

export type Board = { f: Facts; jo: Jo; ceil: Record<Track, number> };

export function boardOf(p: Pillars): Board | null {
  const f = factsOf(p);
  if (!f) return null;
  return { f, jo: joOf(f), ceil: Object.fromEntries(TRACKS.map((t) => [t, ceilingOf(f, t)])) as Record<Track, number> };
}

export const officeAt = (b: Board, t: Track, i: number) => TRACK[t].ladder[i];
export const nameAt = (b: Board, t: Track, i: number) => officeName(TRACK[t].ladder[i], b.jo);

export function start(): Life {
  return { track: "jo", index: 0, life: 3, steps: [], dead: false, fled: false, sayak: false, capped: false };
}

// One door taken: the outcome this chart draws from it, the move up or down (and to another road), never past the
// chart's ceiling on the road it ends on.
export function walk(b: Board, l: Life, scene: Scene, door: Door): Life {
  const tier = tierOf(b.f, door);
  const out = door.out[tier];
  const fromOffice = officeAt(b, l.track, l.index);
  let track = l.track;
  let index = l.index;
  const first = scene.id.startsWith("first");
  if (first && door.to) {
    track = door.to;
    index = 0;
  }
  if (out.to && out.to !== track) {
    index = sameRankIndex(out.to, fromOffice.rank);
    track = out.to;
  }
  // Years pass: a step of seniority every other scene, besides what the door brought.
  // A setback is never softened by seniority, so the words and the move agree.
  index += out.step + (scene.id === "exam" || first || out.step < 0 || l.steps.length % 2 === 1 ? 0 : 1);
  const top = TRACK[track].ladder.length - 1;
  const ceil = b.ceil[track];
  // Past the ceiling this chart reaches on this road, it goes no further.
  const capped = index >= ceil;
  index = Math.max(0, Math.min(top, ceil, index));
  const life = l.life + (out.life ?? 0);
  const step: Step = { scene: scene.id, door: door.id, tier, out, from: fromOffice, to: officeAt(b, track, index), track, capped };
  return {
    track,
    index,
    life,
    steps: [...l.steps, step],
    dead: life <= 0,
    fled: l.fled || out.flag === "fled",
    sayak: l.sayak || out.flag === "sayak",
    capped,
  };
}

// The scene that comes after the doors taken so far, or null when the road has ended.
export function nextScene(l: Life): Scene | null {
  if (l.dead || l.fled) return null;
  const n = l.steps.length;
  if (n === 0) return EXAM;
  if (n === 1) return FIRST[l.steps[0].door];
  return EVENTS[n - 2] ?? null;
}

export const sceneOf = (id: string): Scene | undefined => [EXAM, ...Object.values(FIRST), ...EVENTS].find((s) => s.id === id);

// Every road's end for this chart, highest first: where each road would have taken it.
export function roadEnds(b: Board): { track: Track; office: Office; name: string }[] {
  return TRACKS.map((t) => ({ track: t, office: officeAt(b, t, b.ceil[t]), name: nameAt(b, t, b.ceil[t]) })).sort(
    (a, c) => c.office.rank - a.office.rank || (c.office.dangsang ? 1 : 0) - (a.office.dangsang ? 1 : 0),
  );
}
