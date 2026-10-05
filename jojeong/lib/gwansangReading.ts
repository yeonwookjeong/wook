// The 관상 free reading, computed only (no writer, no cost), built like the saju free reading (lib/freeReading.ts):
// a headline, strengths, what to watch for and how to prepare, six area cards, and a flow through the ages
// (유년운기). Four grades throughout (좋음 · 무난 · 주의 · 경계): the weak points are said plainly, each with what
// to do about it. Every line rests on the measures (lib/gwansang.ts, lib/gwansangDeep.ts) and says which.

import { BANDS, hyeong, leadThird, THIRD_NAME, thirdDev, type Metrics } from "./gwansang";
import { avg, gradeOf, palaces, peaks, pos, type Deep, type Grade, type Palace } from "./gwansangDeep";

export type Card = { key: string; title: string; hanja: string; grade: Grade; line: string; tipLabel: "살리는 법" | "대비"; tip: string; why: string };
export type FlowMood = "활짝" | "무난" | "주의" | "고비";
export type Flow = { from: number; to: number; part: string; mood: FlowMood; line: string; prep: string | null; why: string };
export type Watch = { name: string; grade: Grade; line: string; prep: string };
export type GwansangReading = {
  headline: string;
  summary: string;
  strengths: { name: string; line: string }[];
  watch: Watch[];
  cards: Card[];
  flow: Flow[];
};

// Four lines per grade: [좋음, 무난, 주의, 경계].
type Four = [string, string, string, string];
const at = (g: Grade, four: Four) => four[g === "좋음" ? 0 : g === "무난" ? 1 : g === "주의" ? 2 : 3];

// Each palace: what a strong one gives, and for a weak one what tends to go wrong and how to prepare.
const PALACE: Record<string, { good: string; caution: string; warn: string; prep: string }> = {
  명궁: {
    good: "마음의 그릇이 넓어 사람과 일을 넉넉하게 품어요",
    caution: "걱정을 오래 품어 마음이 좁아지기 쉬워요",
    warn: "한 가지 생각에 갇혀 스스로를 몰아세우기 쉬운 상이에요",
    prep: "큰 결정은 하루 묵히고, 믿는 사람 한 명에게 먼저 말해 보세요",
  },
  재백궁: {
    good: "들어온 돈을 지키고 불리는 힘이 있어요",
    caution: "들어오는 만큼 새기 쉬워 모으는 힘이 약해요",
    warn: "돈이 손에 머물지 않고, 남의 말에 큰돈이 나가기 쉬운 상이에요",
    prep: "월급날 자동 저축으로 먼저 떼어 두고, 보증과 동업은 피하세요",
  },
  형제궁: {
    good: "형제와 벗의 인연이 두터워 곁에 사람이 남아요",
    caution: "가까운 사람과 서운한 일이 생기기 쉬워요",
    warn: "형제·친구와 돈이나 말로 틀어지기 쉬운 상이에요",
    prep: "가까운 사이일수록 돈거래는 하지 말고, 부탁은 분명하게 하세요",
  },
  전택궁: {
    good: "집과 터의 복이 있어 머무는 곳이 안정돼요",
    caution: "집과 살림이 자주 바뀌어 자리 잡는 데 시간이 걸려요",
    warn: "집·부동산 문제로 손해를 보기 쉬운 상이에요",
    prep: "집 계약은 서두르지 말고, 서류와 등기를 두 번 확인하세요",
  },
  노복궁: {
    good: "따르는 사람과 아랫사람 복이 있어요",
    caution: "도와줄 사람이 적어 혼자 떠안는 일이 많아요",
    warn: "믿은 아랫사람이나 동료에게 실망하기 쉬운 상이에요",
    prep: "일을 맡길 때는 기준과 마감을 글로 정해 두세요",
  },
  처첩궁: {
    good: "배우자와 연애의 인연이 고르게 들어와요",
    caution: "연애에서 감정의 온도 차로 엇갈리기 쉬워요",
    warn: "인연이 쉽게 흔들리고 다툼이 길어지기 쉬운 상이에요",
    prep: "서운한 건 그날 말로 풀고, 중요한 약속은 미루지 마세요",
  },
  질액궁: {
    good: "고비를 버텨 내는 기력이 단단해요",
    caution: "피로가 쌓이면 한꺼번에 몸으로 오기 쉬워요",
    warn: "무리한 뒤에 크게 앓기 쉬운 상이에요",
    prep: "해마다 건강검진을 챙기고, 잠을 줄여 일하는 습관부터 끊으세요",
  },
  천이궁: {
    good: "이동과 변화에서 기회가 열려요. 이사, 출장, 해외 운이 좋아요",
    caution: "낯선 곳에서 일이 꼬이기 쉬워요",
    warn: "이사·이직·여행 중에 손해나 사고가 나기 쉬운 상이에요",
    prep: "자리를 옮기기 전에 한 번 더 알아보고, 여행 전에는 일정과 보험을 챙기세요",
  },
  관록궁: {
    good: "일과 자리에서 이름을 얻는 힘이 있어요",
    caution: "애쓴 만큼 인정이 늦게 와요",
    warn: "윗사람과 부딪히거나 자리가 흔들리기 쉬운 상이에요",
    prep: "실적은 기록으로 남기고, 윗사람과의 갈등은 글보다 대화로 푸세요",
  },
  복덕궁: {
    good: "타고난 복과 마음의 여유가 있어요",
    caution: "작은 일에도 마음이 쉽게 지쳐요",
    warn: "복을 누리기보다 스스로를 몰아붙여 여유를 잃기 쉬운 상이에요",
    prep: "쉬는 날을 일정에 먼저 넣고, 하루 한 번은 일과 상관없는 일을 하세요",
  },
  부모궁: {
    good: "부모와 윗사람의 덕을 보는 상이에요",
    caution: "윗사람의 도움보다 스스로 길을 내야 해요",
    warn: "부모·윗사람과 뜻이 엇갈리거나 그 덕을 보기 어려운 상이에요",
    prep: "기대기보다 내 기반을 먼저 만들고, 부모님 건강은 미리 살피세요",
  },
};

function cardsOf(m: Metrics, pl: Palace[], centre: number | null): Card[] {
  const s = (name: string) => pl.find((x) => x.name === name)!.score;
  const b = (k: keyof typeof BANDS) => pos(m[k], BANDS[k].cut);
  const lower = pos(thirdDev(m).lower, [-0.07, 0.07]);
  const card = (key: string, title: string, hanja: string, score: number | null, lines: Four, tips: Four, why: string): Card => {
    const grade = gradeOf(score);
    const bad = grade === "주의" || grade === "경계";
    return { key, title, hanja, grade, line: at(grade, lines), tipLabel: bad ? "대비" : "살리는 법", tip: at(grade, tips), why };
  };
  const why = (name: string) => pl.find((x) => x.name === name)!.why;
  return [
    card("money", "재물", "財", avg(s("재백궁"), centre),
      [
        "재물 그릇이 커요. 코가 받쳐 주니 들어온 돈이 쉽게 새지 않는 상이에요.",
        "버는 만큼 차곡차곡 모이는 꾸준한 재물 상이에요.",
        "들어오는 만큼 나가기 쉬워 모으는 힘이 약한 상이에요. 충동 지출이 새는 구멍이에요.",
        "돈이 손에 머물지 않는 상이에요. 남의 말에 큰돈이 나가거나 보증·동업으로 잃기 쉬워요.",
      ],
      [
        "큰돈은 한 번에 굴리기보다 나눠 담으세요.",
        "고정 지출부터 줄이면 그릇이 한 뼘 커져요.",
        "월급날 자동 저축으로 먼저 떼어 두고, 카드 한 장만 쓰세요.",
        "보증·동업·지인 투자는 거절하고, 목돈은 손이 안 닿는 곳에 묶어 두세요.",
      ],
      why("재백궁")),
    card("work", "일과 명예", "官", avg(s("관록궁"), s("천이궁"), b("tilt") === 3 ? 3 : 1.5),
      [
        "이마와 눈의 기세가 받쳐 줘서 자리를 맡고 이름을 얻는 상이에요.",
        "맡은 자리에서 차근차근 인정받는 상이에요.",
        "애쓴 만큼 인정이 늦게 오는 상이에요. 공을 남에게 빼앗기기 쉬워요.",
        "윗사람과 부딪히거나 자리가 흔들리기 쉬운 상이에요. 이직이 잦아질 수 있어요.",
      ],
      [
        "앞에 서는 자리를 피하지 마세요.",
        "한 분야를 오래 파면 이름이 붙어요.",
        "한 일은 기록과 보고로 남겨 내 몫을 분명히 하세요.",
        "옮기기 전에 다음 자리를 먼저 잡고, 윗사람과의 갈등은 대화로 일찍 푸세요.",
      ],
      `${why("관록궁")} · 눈꼬리 ${m.tilt >= 0 ? "+" : ""}${m.tilt.toFixed(1)}°`),
    card("love", "연애와 배우자", "緣", avg(s("처첩궁"), b("lip")),
      [
        "눈꼬리가 고르고 입술에 정이 있어 인연이 따뜻하게 이어지는 상이에요.",
        "천천히 깊어지는 인연이 맞는 상이에요.",
        "마음은 깊은데 표현이 덜 닿아 오해가 쌓이기 쉬운 상이에요.",
        "인연이 쉽게 흔들리고 다툼이 길어지기 쉬운 상이에요.",
      ],
      [
        "좋은 사람을 오래 곁에 두는 힘이 있어요. 표현은 지금처럼.",
        "서두르지 말고 함께 보내는 시간을 늘리세요.",
        "좋아하는 마음과 서운한 마음 모두 그날 말로 꺼내세요.",
        "다툰 날은 넘기지 말고 풀고, 결혼 같은 큰 결정은 1년은 지켜본 뒤에 하세요.",
      ],
      `${why("처첩궁")} · 입술 두께 ${m.lip.toFixed(2)}`),
    card("people", "사람과 관계", "人", avg(s("노복궁"), b("gap"), b("mouth")),
      [
        "미간이 트이고 턱이 받쳐 줘서 사람이 모이고 따르는 상이에요.",
        "가까운 사람과 오래 가는 관계가 맞는 상이에요.",
        "곁에 사람이 적어 혼자 떠안는 일이 많은 상이에요.",
        "믿은 사람에게 실망하거나 말이 돌아 곤란해지기 쉬운 상이에요.",
      ],
      [
        "모임의 중심에 서면 운이 커져요.",
        "새 사람보다 있는 인연을 챙기세요.",
        "부탁은 미리, 고마움은 바로 표현해 내 편을 만들어 두세요.",
        "속 이야기는 아끼고, 돈과 일은 친분이 아니라 계약으로 하세요.",
      ],
      `${why("노복궁")} · 미간 ${m.gap.toFixed(2)}`),
    card("health", "건강과 기력", "壽", avg(s("질액궁"), lower),
      [
        "산근과 턱이 단단해 고비를 잘 버티는 기력의 상이에요.",
        "무리하지 않으면 고르게 가는 기력이에요.",
        "피로가 쌓이면 한꺼번에 몸으로 오기 쉬운 상이에요.",
        "무리한 뒤에 크게 앓기 쉬운 상이에요. 기력을 아껴 써야 해요.",
      ],
      [
        "기력이 좋을수록 쉬는 날을 정해 두세요.",
        "잠과 끼니를 규칙적으로 지키면 충분해요.",
        "주말 하루는 꼭 쉬고, 피곤하면 미루지 말고 쉬세요.",
        "해마다 건강검진을 챙기고, 밤샘과 과음부터 줄이세요.",
      ],
      `${why("질액궁")} · 하정 보통 대비 ${Math.round(thirdDev(m).lower * 100)}%`),
    card("family", "집안과 터", "家", avg(s("부모궁"), s("형제궁"), s("전택궁")),
      [
        "부모, 형제, 집터의 복이 고루 있는 상이에요.",
        "집안의 도움과 내 힘이 반반인 상이에요.",
        "집안의 도움보다 스스로 터를 일구는 상이에요. 집 문제로 고생할 수 있어요.",
        "가족과 뜻이 엇갈리거나, 집·부동산 문제로 손해를 보기 쉬운 상이에요.",
      ],
      [
        "받은 복을 나누면 더 커져요.",
        "가족 일은 미리 의논해 두면 편해요.",
        "내 집, 내 터는 조급하지 않게 오래 보고 정하세요.",
        "가족과 돈은 섞지 말고, 집 계약은 서류와 등기를 두 번 확인하세요.",
      ],
      `${why("부모궁")} · ${why("형제궁")}`),
  ];
}

// 유년운기, simplified from the 마의상법 age chart: each age span is read on the face part it falls on.
function flowOf(m: Metrics, pl: Palace[], centre: number | null, south: number | null, north: number | null): Flow[] {
  const s = (name: string) => pl.find((x) => x.name === name)!.score;
  const b = (k: keyof typeof BANDS) => pos(m[k], BANDS[k].cut);
  const eye = avg(s("처첩궁"), b("open"));
  const mouth = avg(b("philtrum"), b("lip"), b("mouth"));
  const spans: { from: number; to: number; part: string; score: number | null; lines: [string, string, string, string]; prep: string; why: string }[] = [
    { from: 15, to: 30, part: "이마(상정)", score: avg(south, s("관록궁"), s("부모궁")),
      lines: ["배움과 첫 자리가 순하게 열리는 시기", "스스로 길을 찾아가는 시기", "첫 자리를 잡기까지 돌아가는 시기", "배움과 첫 자리가 막히기 쉬운 시기"],
      prep: "자격과 기술을 일찍 쌓아 두면 늦게 와도 단단하게 와요", why: "이마, 관록궁, 부모궁" },
    { from: 31, to: 34, part: "눈썹", score: s("형제궁"),
      lines: ["벗과 동료의 도움이 붙는 시기", "사람 사이에서 자리를 잡는 시기", "가까운 사람과 서운한 일이 생기는 시기", "친구·동료와 틀어지기 쉬운 시기"],
      prep: "이 시기엔 돈거래와 보증을 피하고 관계를 넓히기보다 지키세요", why: "눈썹, 형제궁" },
    { from: 35, to: 40, part: "눈", score: eye,
      lines: ["판단이 서고 기세가 오르는 시기", "보는 눈이 깊어지는 시기", "판단이 흐려 엇갈리기 쉬운 시기", "사람과 일에 속기 쉬운 시기"],
      prep: "큰 결정은 혼자 하지 말고, 계약은 한 번 더 확인하세요", why: "눈, 처첩궁" },
    { from: 41, to: 50, part: "코(산근에서 준두까지)", score: avg(centre, s("재백궁"), s("질액궁")),
      lines: ["재물과 자리가 크게 무르익는 시기", "모은 것을 굴려 키우는 시기", "벌기보다 지키는 게 중요한 시기", "재물과 건강이 함께 흔들리기 쉬운 시기"],
      prep: "무리한 확장과 투자는 미루고, 건강검진과 비상금을 먼저 챙기세요", why: "중악, 재백궁, 질액궁" },
    { from: 51, to: 60, part: "인중과 입", score: mouth,
      lines: ["말과 덕이 사람을 모으는 시기", "쌓은 것을 나누며 가는 시기", "말실수와 구설을 조심할 시기", "말로 인한 다툼과 건강을 함께 챙겨야 할 시기"],
      prep: "말은 한 번 거르고, 식습관과 혈압을 챙기세요", why: "인중, 입" },
    { from: 61, to: 75, part: "턱(지각)", score: avg(north, s("노복궁")),
      lines: ["따르는 사람과 터가 든든한 시기", "편안하게 거두는 시기", "곁의 사람이 줄어 쓸쓸하기 쉬운 시기", "기댈 곳이 약해지기 쉬운 시기"],
      prep: "노후 자금과 머물 곳을 미리 정하고, 가까운 사람과의 연을 꾸준히 이어 두세요", why: "턱, 북악, 노복궁" },
  ];
  return spans.map((x) => {
    const g = gradeOf(x.score);
    const mood: FlowMood = g === "좋음" ? "활짝" : g === "주의" ? "주의" : g === "경계" ? "고비" : "무난";
    return { from: x.from, to: x.to, part: x.part, mood, line: at(g, x.lines), prep: mood === "주의" || mood === "고비" ? x.prep : null, why: x.why };
  });
}

export function gwansangReading(m: Metrics, x: Deep): GwansangReading {
  const pl = palaces(m, x);
  const pk = peaks(m, x);
  const score = (name: string) => pk.peaks.find((p) => p.name === name)!.score;
  const h = hyeong(m);
  const lead = leadThird(m);
  const leadLine = lead ? `${THIRD_NAME[lead].part}이 길어 ${THIRD_NAME[lead].age}에 힘이 실리는 상` : "세 마디가 고르게 나뉜 상";
  // Palaces read from the same measure count once (관록궁 and 부모궁 both rest on the forehead's height).
  const basis = (name: string) => (name === "부모궁" ? "관록궁" : name);
  const once = (list: Palace[]) => list.filter((p, i) => list.findIndex((q) => basis(q.name) === basis(p.name)) === i);
  const strengths = once(pl.filter((p) => p.grade === "좋음"))
    .slice(0, 3)
    .map((p) => ({ name: p.name, line: PALACE[p.name].good }));
  // Every 경계 and 주의 palace, worst first, each with how to prepare.
  const watch = once(pl.filter((p) => p.grade === "경계" || p.grade === "주의"))
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 4)
    .map((p) => ({ name: p.name, grade: p.grade, line: p.grade === "경계" ? PALACE[p.name].warn : PALACE[p.name].caution, prep: PALACE[p.name].prep }));
  return {
    headline: `${h.label} · ${pk.verdict}`,
    summary: `${h.main.look}에 ${leadLine}이에요. ${pk.note}`,
    strengths,
    watch,
    cards: cardsOf(m, pl, score("중악")),
    flow: flowOf(m, pl, score("중악"), score("남악"), score("북악")),
  };
}
