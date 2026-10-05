// The 관상 free reading, computed only (no writer, no cost), built like the saju free reading (lib/freeReading.ts):
// a headline, strengths, what to watch for and how to prepare, six area cards, and a flow through the ages
// (유년운기). Four grades throughout (대길 · 길 · 주의 · 경계): the weak points are said plainly, each with what
// to do about it. Every line rests on the measures (lib/gwansang.ts, lib/gwansangDeep.ts) and says which.

import { band, BANDS, hyeong, leadThird, plainOf, THIRD_NAME, thirdDev, wordOf, type BandKey, type Metrics } from "./gwansang";
import { avg, bandScore, deep, deepWord, gradeOf, palaces, peaks, pos, third, thirdWord, tiltScore, type Deep, type Grade, type Palace } from "./gwansangDeep";

export type Card = { key: string; title: string; hanja: string; grade: Grade; line: string; tipLabel: "살리는 법" | "대비"; tip: string; why: string };
export type FlowMood = "활짝" | "순조" | "주의" | "고비";
export type Flow = { from: number; to: number; part: string; mood: FlowMood; line: string; prep: string | null; why: string };
export type Watch = { name: string; grade: Grade; line: string; prep: string };
export type Trait = { key: string; part: string; word: string; light: string; shadow: string; why: string };
export type Judged = { key: string; name: string; hanja: string; sub: string; grade: Grade; line: string; prep: string | null; why: string };
export type PalaceRead = { name: string; hanja: string; where: string; rules: string; about: string; grade: Grade; line: string; prep: string | null; plain: string; why: string };
export type PeakRead = { name: string; part: string; means: string; grade: Grade; line: string; prep: string | null; plain: string; why: string };
export type GwansangReading = {
  headline: string;
  sub: string;
  summary: string;
  keywords: { text: string; caution: boolean }[];
  hyeong: { el: string; label: string; look: string; nature: string; mixed: string | null };
  peaks: { verdict: string; plain: string; note: string; caution: boolean; list: PeakRead[] };
  palaces: PalaceRead[];
  strengths: { name: string; line: string }[];
  watch: Watch[];
  traits: Trait[];
  thirds: Judged[];
  organs: Judged[];
  cards: Card[];
  flow: Flow[];
};

// Four lines per grade: [대길, 길, 주의, 경계].
type Four = [string, string, string, string];
const at = (g: Grade, four: Four) => four[g === "대길" ? 0 : g === "길" ? 1 : g === "주의" ? 2 : 3];

// Each palace: what a strong one gives, and for a weak one what tends to go wrong and how to prepare.
const PALACE: Record<string, { good: string; fine: string; caution: string; warn: string; prep: string; about: string; key: string; watchKey: string }> = {
  명궁: {
    about: "두 눈썹 사이 인당은 마음이 드나드는 문이에요. 넓고 밝으면 그릇이 크다고 봐요.",
    key: "#그릇이큰사람",
    watchKey: "#걱정은하루만",
    fine: "마음이 넉넉한 편이라 웬만한 일은 품고 넘어가요",
    good: "마음의 그릇이 넓어 사람과 일을 넉넉하게 품어요",
    caution: "걱정을 오래 품어 마음이 좁아지기 쉬워요",
    warn: "한 가지 생각에 갇혀 스스로를 몰아세우기 쉬운 상이에요",
    prep: "큰 결정은 하루 묵히고, 믿는 사람 한 명에게 먼저 말해 보세요",
  },
  재백궁: {
    about: "코는 재물을 담는 곳간이에요. 콧방울이 넉넉하고 코가 서 있으면 곳간 문이 단단하다고 봐요.",
    key: "#재물그릇",
    watchKey: "#지갑단속",
    fine: "버는 만큼 모으는 감각이 있어요",
    good: "들어온 돈을 지키고 불리는 힘이 있어요",
    caution: "들어오는 만큼 새기 쉬워 모으는 힘이 약해요",
    warn: "돈이 손에 머물지 않고, 남의 말에 큰돈이 나가기 쉬운 상이에요",
    prep: "월급날 자동 저축으로 먼저 떼어 두고, 보증과 동업은 피하세요",
  },
  형제궁: {
    about: "눈썹은 형제와 벗의 자리예요. 길고 가지런하면 곁을 지키는 사람이 많다고 봐요.",
    key: "#인복",
    watchKey: "#돈거래금지",
    fine: "형제, 벗과 무난하게 오래 가요",
    good: "형제와 벗의 인연이 두터워 곁에 사람이 남아요",
    caution: "가까운 사람과 서운한 일이 생기기 쉬워요",
    warn: "형제·친구와 돈이나 말로 틀어지기 쉬운 상이에요",
    prep: "가까운 사이일수록 돈거래는 하지 말고, 부탁은 분명하게 하세요",
  },
  전택궁: {
    about: "눈과 눈썹 사이는 집과 땅의 자리예요. 넉넉히 떨어져 있으면 머무는 터가 넓다고 봐요.",
    key: "#집복",
    watchKey: "#계약은두번",
    fine: "머무는 곳이 크게 흔들리지 않아요",
    good: "집과 터의 복이 있어 머무는 곳이 안정돼요",
    caution: "집과 살림이 자주 바뀌어 자리 잡는 데 시간이 걸려요",
    warn: "집·부동산 문제로 손해를 보기 쉬운 상이에요",
    prep: "집 계약은 서두르지 말고, 서류와 등기를 두 번 확인하세요",
  },
  노복궁: {
    about: "턱 양옆은 나를 따르는 사람들의 자리예요. 턱이 받쳐 주면 아랫사람 복이 있다고 봐요.",
    key: "#따르는사람",
    watchKey: "#혼자떠안지말기",
    fine: "함께 일할 사람이 곁에 있어요",
    good: "따르는 사람과 아랫사람 복이 있어요",
    caution: "도와줄 사람이 적어 혼자 떠안는 일이 많아요",
    warn: "믿은 아랫사람이나 동료에게 실망하기 쉬운 상이에요",
    prep: "일을 맡길 때는 기준과 마감을 글로 정해 두세요",
  },
  처첩궁: {
    about: "눈꼬리 끝(어미)은 배우자의 자리예요. 눈꼬리가 고르게 놓이면 인연이 순하다고 봐요.",
    key: "#연애운",
    watchKey: "#표현이필요해",
    fine: "인연이 천천히 깊어지는 편이에요",
    good: "배우자와 연애의 인연이 고르게 들어와요",
    caution: "연애에서 감정의 온도 차로 엇갈리기 쉬워요",
    warn: "인연이 쉽게 흔들리고 다툼이 길어지기 쉬운 상이에요",
    prep: "서운한 건 그날 말로 풀고, 중요한 약속은 미루지 마세요",
  },
  질액궁: {
    about: "두 눈 사이 콧대(산근)는 몸의 기둥이에요. 높고 끊김 없으면 병을 이겨 내는 힘이 크다고 봐요.",
    key: "#강철체력",
    watchKey: "#과로주의",
    fine: "무리만 안 하면 고르게 가는 기력이에요",
    good: "고비를 버텨 내는 기력이 단단해요",
    caution: "피로가 쌓이면 한꺼번에 몸으로 오기 쉬워요",
    warn: "무리한 뒤에 크게 앓기 쉬운 상이에요",
    prep: "해마다 건강검진을 챙기고, 잠을 줄여 일하는 습관부터 끊으세요",
  },
  천이궁: {
    about: "이마 양 끝(역마)은 떠나고 옮기는 운의 자리예요. 넓고 트이면 밖에서 기회가 온다고 봐요.",
    key: "#역마운",
    watchKey: "#이동은신중히",
    fine: "옮겨 다녀도 크게 탈이 없어요",
    good: "이동과 변화에서 기회가 열려요. 이사, 출장, 해외 운이 좋아요",
    caution: "낯선 곳에서 일이 꼬이기 쉬워요",
    warn: "이사·이직·여행 중에 손해나 사고가 나기 쉬운 상이에요",
    prep: "자리를 옮기기 전에 한 번 더 알아보고, 여행 전에는 일정과 보험을 챙기세요",
  },
  관록궁: {
    about: "이마 한가운데는 벼슬의 자리예요. 이마가 높고 반듯하면 일과 명예가 따른다고 봐요.",
    key: "#출세운",
    watchKey: "#기록이답",
    fine: "맡은 자리에서 차근차근 인정받아요",
    good: "일과 자리에서 이름을 얻는 힘이 있어요",
    caution: "애쓴 만큼 인정이 늦게 와요",
    warn: "윗사람과 부딪히거나 자리가 흔들리기 쉬운 상이에요",
    prep: "실적은 기록으로 남기고, 윗사람과의 갈등은 글보다 대화로 푸세요",
  },
  복덕궁: {
    about: "눈썹 위 이마 양쪽(천창)은 하늘이 준 복의 창고예요. 넓을수록 여유가 크다고 봐요.",
    key: "#타고난복",
    watchKey: "#쉼표필요",
    fine: "소소한 복을 누릴 줄 알아요",
    good: "타고난 복과 마음의 여유가 있어요",
    caution: "작은 일에도 마음이 쉽게 지쳐요",
    warn: "복을 누리기보다 스스로를 몰아붙여 여유를 잃기 쉬운 상이에요",
    prep: "쉬는 날을 일정에 먼저 넣고, 하루 한 번은 일과 상관없는 일을 하세요",
  },
  부모궁: {
    about: "이마 위 좌우(일각·월각)는 부모의 자리예요. 이마가 넉넉하면 윗사람 덕이 있다고 봐요.",
    key: "#윗사람덕",
    watchKey: "#자립형",
    fine: "윗사람과 무난하게 지내요",
    good: "부모와 윗사람의 덕을 보는 상이에요",
    caution: "윗사람의 도움보다 스스로 길을 내야 해요",
    warn: "부모·윗사람과 뜻이 엇갈리거나 그 덕을 보기 어려운 상이에요",
    prep: "기대기보다 내 기반을 먼저 만들고, 부모님 건강은 미리 살피세요",
  },
};

function cardsOf(m: Metrics, pl: Palace[], centre: number | null): Card[] {
  const s = (name: string) => pl.find((x) => x.name === name)!.score;
  const b = (k: keyof typeof BANDS) => pos(m[k], BANDS[k].cut);
  const lower = third(thirdDev(m).lower);
  const card = (key: string, title: string, hanja: string, score: number | null, lines: Four, tips: Four, why: string): Card => {
    const grade = gradeOf(score);
    const bad = grade === "주의" || grade === "경계";
    return { key, title, hanja, grade, line: at(grade, lines), tipLabel: bad ? "대비" : "살리는 법", tip: at(grade, tips), why };
  };
  const why = (name: string) => pl.find((x) => x.name === name)!.plain;
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
      `${why("관록궁")} · ${plainOf(m, "tilt")}`),
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
      `${why("처첩궁")} · ${plainOf(m, "lip")}`),
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
      `${why("노복궁")} · ${plainOf(m, "gap")}`),
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
      `${why("질액궁")} · ${thirdWord("하정(인중~턱)", thirdDev(m).lower)}`),
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
      `${why("부모궁")} · ${why("형제궁")} · ${why("전택궁")}`),
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
    const mood: FlowMood = g === "대길" ? "활짝" : g === "주의" ? "주의" : g === "경계" ? "고비" : "순조";
    return { from: x.from, to: x.to, part: x.part, mood, line: at(g, x.lines), prep: mood === "주의" || mood === "고비" ? x.prep : null, why: x.why };
  });
}

// 오악: what each mountain stands for, a line per grade and, for a low one, what to do.
const PEAK: Record<string, { means: string; lines: Four; prep: string }> = {
  남악: {
    means: "초년운과 윗사람, 명예를 맡은 산",
    lines: [
      "이마 산이 높고 넓게 솟았어요. 일찍 이름을 얻고 윗사람이 먼저 알아봐 주는 산이에요",
      "이마 산이 반듯해 배움과 첫 자리가 순하게 열려요",
      "이마 산이 낮은 편이라 초년엔 스스로 길을 내야 해요. 대신 늦게 배운 것이 오래 가요",
      "이마 산이 꺼져 있어 윗사람 덕보다 혼자 버텨 온 날이 많은 산이에요",
    ],
    prep: "기댈 곳을 찾기보다 실력을 보여 줄 기록(자격, 포트폴리오)을 일찍 쌓아 두세요",
  },
  북악: {
    means: "말년운과 아랫사람, 머무는 터를 맡은 산",
    lines: [
      "턱 산이 두텁게 받쳐 줘요. 나이 들수록 사람과 재물이 모이는 산이에요",
      "턱 산이 고르게 받쳐 말년이 편안해요",
      "턱 산이 얇은 편이라 말년에 기댈 곳을 미리 만들어 둬야 해요",
      "턱 산이 꺼져 있어 말년에 곁이 허전해지기 쉬운 산이에요",
    ],
    prep: "노후 자금은 일찍 묶어 두고, 후배와 아랫사람에게 베푼 것이 말년의 산이 된다고 생각하세요",
  },
  중악: {
    means: "오악의 주인. 중년의 재물과 자존을 맡은 산",
    lines: [
      "코 산이 우뚝 섰어요. 내 힘으로 재물과 자리를 세우는 산이에요",
      "코 산이 반듯해 중년의 재물이 안정적으로 쌓여요",
      "코 산이 낮은 편이라 벌어도 내 몫이 덜 남기 쉬워요",
      "코 산이 꺼져 있어 중년에 재물과 자존심이 함께 흔들리기 쉬운 산이에요",
    ],
    prep: "혼자 판을 벌이기보다 조직이나 계약 안에서 내 몫을 분명히 하세요",
  },
  "동악·서악": {
    means: "사회에서의 힘과 권한, 주변의 지지를 맡은 두 산",
    lines: [
      "양 광대가 힘 있게 솟았어요. 사람을 움직이는 권한이 따르는 산이에요",
      "광대가 알맞게 서서 주변의 지지를 고르게 받아요",
      "광대가 밋밋한 편이라 여럿 사이에서 내 목소리가 묻히기 쉬워요",
      "광대 산이 꺼져 있어 남의 기세에 휘둘리기 쉬운 산이에요",
    ],
    prep: "회의와 협상에서는 내 의견을 먼저, 글로 정리해서 꺼내세요",
  },
};

// 성격 · 빛과 그림자: each feature's word, the temperament it shows at its best, and the same temperament's
// other side. Three variants per feature, by its band (low, usual, high); none is all good or all bad.
type Pair = [string, string]; // [빛, 그림자]
const TRAIT: { key: BandKey; part: string; by: [Pair, Pair, Pair] }[] = [
  { key: "tilt", part: "눈꼬리", by: [
    ["순하고 너그러워 사람이 편하게 다가와요", "싫은 소리를 못 해 손해를 떠안기 쉬워요"],
    ["감정이 고르고 판단이 반듯해요", "속을 잘 드러내지 않아 무심해 보일 수 있어요"],
    ["추진력이 있고 결단이 빨라요", "성급하게 밀어붙여 주변과 부딪히기 쉬워요"],
  ] },
  { key: "open", part: "눈매", by: [
    ["속이 깊고 신중해 끝까지 지켜봐요", "마음을 늦게 열어 차갑다는 오해를 사요"],
    ["보고 듣는 것이 고르고 균형이 잡혀요", "뚜렷한 색이 없어 첫인상이 묻히기 쉬워요"],
    ["감수성이 풍부하고 표현이 솔직해요", "감정이 얼굴에 그대로 드러나 휘둘리기 쉬워요"],
  ] },
  { key: "gap", part: "미간", by: [
    ["집중력이 강하고 한 우물을 파요", "예민하고 걱정이 많아 스스로를 볶아요"],
    ["열린 마음과 신중함이 균형을 이뤄요", "결정적인 순간에 망설임이 길어질 수 있어요"],
    ["너그럽고 낙천적이라 사람을 잘 품어요", "느긋함이 지나쳐 마감과 약속이 밀리기 쉬워요"],
  ] },
  { key: "brow", part: "눈썹과 눈 사이", by: [
    ["행동이 빠르고 눈치가 밝아요", "속을 금방 드러내 감정 다툼에 말려들어요"],
    ["생각과 행동의 속도가 알맞아요", "무리하게 버티다 쉴 때를 놓치기 쉬워요"],
    ["여유롭고 마음씀이 넉넉해요", "결심까지 오래 걸려 기회를 흘려보내요"],
  ] },
  { key: "nose", part: "콧방울", by: [
    ["깔끔하고 자존심이 곧아요", "아끼다 쓸 때를 놓치고, 남에게 기대지 못해요"],
    ["벌고 쓰는 감각이 고르게 잡혀 있어요", "큰 승부를 피하다 판을 키울 때를 놓쳐요"],
    ["배포가 크고 돈을 굴리는 감이 있어요", "씀씀이도 커서 들어온 만큼 새기 쉬워요"],
  ] },
  { key: "mouth", part: "입", by: [
    ["말이 신중하고 실수가 적어요", "할 말을 삼켜 손해 보고 속병이 생겨요"],
    ["말과 행동이 어긋나지 않아 믿음을 얻어요", "앞에 나설 때 존재감이 약하게 비쳐요"],
    ["말에 힘이 있고 사람을 이끌어요", "말이 앞서 약속이 무거워지기 쉬워요"],
  ] },
  { key: "lip", part: "입술", by: [
    ["이성적이고 맺고 끊음이 분명해요", "정이 없다는 말을 듣기 쉬워요"],
    ["정과 이성이 알맞게 섞여 있어요", "정에 끌릴 때와 냉정할 때가 엇갈려 보여요"],
    ["정이 많고 베풀 줄 알아요", "정 때문에 거절을 못 하고 끌려가요"],
  ] },
  { key: "jaw", part: "턱", by: [
    ["섬세하고 머리 회전이 빨라요", "버티는 힘이 약해 오래 가는 싸움에 지쳐요"],
    ["유연함과 끈기를 함께 가졌어요", "어느 쪽으로도 확 밀지 못해 애매해질 때가 있어요"],
    ["의지가 굳고 끝까지 버텨 내요", "고집이 세서 물러설 때를 놓쳐요"],
  ] },
];

// 삼정 풀이: 상정(초년), 중정(중년), 하정(말년) by length against the usual share and the bones that hold each.
const THIRD_TEXT: Record<"upper" | "middle" | "lower", { lines: Four; prep: string }> = {
  upper: {
    lines: [
      "이마가 넉넉해 초년에 윗사람 덕과 배움의 운이 크게 들어요. 일찍 이름을 얻기 좋은 상이에요",
      "초년운이 순하게 흘러 배움과 첫 사회생활이 큰 탈 없이 이어져요",
      "초년에 윗사람 덕이 얇아 스스로 길을 내야 했던 상이에요. 배움이 늦게 빛을 봐요",
      "초년이 가장 고된 상이에요. 집안이나 윗사람의 도움보다 혼자 버텨 온 날이 많아요",
    ],
    prep: "자격증, 기술처럼 남이 빼앗지 못하는 실력을 일찍 쌓고, 믿을 만한 스승 한 분을 꼭 두세요. 늦게 배워도 상정은 쓸수록 자라요",
  },
  middle: {
    lines: [
      "콧대와 광대가 받쳐 중년에 자기 힘으로 큰 성취를 이루는 상이에요. 30~40대가 전성기예요",
      "중년이 안정적으로 흘러 일과 재물이 차근차근 쌓여요",
      "중년에 일은 많은데 내 몫이 덜 남는 상이에요. 애쓴 만큼 인정이 늦게 와요",
      "중년에 기복이 큰 상이에요. 큰돈이 들고 나거나 일터가 자주 바뀌기 쉬워요",
    ],
    prep: "30~40대엔 판을 키우기보다 지키는 쪽으로. 보증, 무리한 대출, 감으로 하는 투자는 피하고 계약은 반드시 글로 남기세요",
  },
  lower: {
    lines: [
      "턱이 두텁게 받쳐 말년에 사람과 재물이 모이는 상이에요. 나이 들수록 대접받아요",
      "말년이 편안하게 흘러 쌓아 둔 것을 지키며 지내요",
      "말년에 기댈 곳이 얇아질 수 있는 상이에요. 젊을 때 준비한 만큼 편해져요",
      "말년이 가장 쓸쓸해지기 쉬운 상이에요. 사람이 흩어지고 모은 것이 새기 쉬워요",
    ],
    prep: "연금과 노후 자금은 40대 전에 자동이체로 묶어 두고, 가족, 오랜 벗과의 관계를 지금부터 챙기세요. 말년운은 아랫사람에게 베푼 만큼 돌아와요",
  },
};

// 오관 풀이: the five organs and their offices. The ears are out of a front camera's reach.
const ORGAN_TEXT: Record<string, { lines: Four; prep: string }> = {
  눈썹: {
    lines: [
      "눈썹이 길게 뻗고 눈과 넉넉히 떨어져 형제, 벗의 덕이 두텁고 이름이 오래 가요",
      "눈썹이 고르게 자리 잡아 사람 사이가 원만하고 평판이 무난해요",
      "눈썹이 짧거나 눈에 바짝 붙어 성미가 급하고 형제, 벗의 도움이 얇아요",
      "눈썹이 짧은 편인 데다 눈에 바짝 내려앉아 사람 일로 속앓이가 잦은 상이에요",
    ],
    prep: "친구, 형제와 돈거래는 하지 말고, 화가 날 땐 하루 묵힌 뒤 말하세요. 눈썹 꼬리를 길게 다듬는 것도 예부터 권한 방법이에요",
  },
  눈: {
    lines: [
      "눈매가 알맞게 기울고 또렷해 사람과 일을 보는 눈이 밝아요. 오관 중 가장 귀하게 치는 자리예요",
      "눈이 안정되어 판단이 고르고 사람을 크게 잘못 보지 않아요",
      "눈꼬리나 눈매가 한쪽으로 치우쳐 사람을 보는 눈이 흐려질 때가 있어요",
      "눈꼬리가 많이 처지거나 치켜올라 감정에 따라 판단이 크게 흔들리는 상이에요",
    ],
    prep: "큰 결정은 혼자 내리지 말고 믿는 사람 둘에게 먼저 물으세요. 첫인상으로 사람을 들이지 말고 석 달은 지켜보세요",
  },
  코: {
    lines: [
      "코가 길고 우뚝해 재물과 자존이 단단해요. 자기 힘으로 일가를 이루는 상이에요",
      "코가 반듯해 재물이 들고 나는 흐름이 안정적이에요",
      "코의 힘이 약해 들어온 돈이 오래 머물지 않아요",
      "코가 낮거나 짧아 재물이 새고 자존이 꺾이기 쉬운 상이에요",
    ],
    prep: "월급날 바로 떼어 두는 저축 통장을 따로 두고, 큰 지출은 사흘 미뤄 보세요. 내 이름 걸고 하는 일보다 조직 안에서 쌓는 편이 유리해요",
  },
  입: {
    lines: [
      "입이 크고 입술이 도톰해 먹을 복과 말의 힘을 함께 타고났어요",
      "입이 알맞아 말과 먹을 것이 모자라지 않아요",
      "입이 작거나 입술이 얇아 말로 손해를 보거나 먹을 복이 얇아요",
      "입이 작고 입술이 많이 얇아 말 한마디로 인연이 끊기기 쉬운 상이에요",
    ],
    prep: "중요한 말은 글로 한 번 다듬어 하고, 서운한 말은 그 자리에서 하지 마세요. 끼니를 거르지 않는 것이 출납관을 지키는 첫걸음이에요",
  },
};

const pctOf = (d: number) => `${d >= 0 ? "+" : ""}${Math.round(d * 100)}%`;

const num = (k: BandKey, v: number) => (k === "tilt" ? `${v >= 0 ? "+" : ""}${v.toFixed(1)}°` : v.toFixed(2));

function traitsOf(m: Metrics): Trait[] {
  return TRAIT.map((t) => {
    const [light, shadow] = t.by[band(t.key, m[t.key]).step];
    return { key: t.key, part: t.part, word: wordOf(t.key, m[t.key]), light, shadow, why: `${BANDS[t.key].label} ${num(t.key, m[t.key])}` };
  });
}

function thirdsOf(m: Metrics, x: Deep, south: number | null, centre: number | null, north: number | null): Judged[] {
  const dev = thirdDev(m);
  const J = (key: "upper" | "middle" | "lower", hanja: string, sub: string, score: number | null, why: string): Judged => {
    const grade = gradeOf(score);
    const bad = grade === "주의" || grade === "경계";
    return { key, name: THIRD_NAME[key].part, hanja, sub, grade, line: at(grade, THIRD_TEXT[key].lines), prep: bad ? THIRD_TEXT[key].prep : null, why };
  };
  return [
    J("upper", "上停", "이마 · 초년(15~30세)", avg(third(dev.upper), south), `이마 높이 보통보다 ${pctOf(dev.upper)} · ${deepWord("forehead", x.forehead)}`),
    J("middle", "中停", "눈썹~코끝 · 중년(31~50세)", avg(third(dev.middle), centre, deep("cheek", x.cheek)),
      `코 높이 보통보다 ${pctOf(dev.middle)} · ${deepWord("noseLen", x.noseLen)} · ${deepWord("cheek", x.cheek)}`),
    J("lower", "下停", "인중~턱 · 말년(51세~)", avg(third(dev.lower), north, pos(m.philtrum, BANDS.philtrum.cut)),
      `인중~턱 보통보다 ${pctOf(dev.lower)} · ${plainOf(m, "jaw")} · ${plainOf(m, "philtrum")}`),
  ];
}

function organsOf(m: Metrics, x: Deep, centre: number | null): Judged[] {
  const J = (key: string, hanja: string, sub: string, score: number | null, why: string): Judged => {
    const grade = gradeOf(score);
    const t = ORGAN_TEXT[key];
    const bad = grade === "주의" || grade === "경계";
    return { key, name: key, hanja, sub, grade, line: t ? at(grade, t.lines) : why, prep: t && bad ? t.prep : null, why };
  };
  return [
    J("눈썹", "保壽官", "보수관 · 수명과 형제", avg(deep("browLen", x.browLen), bandScore("brow", m.brow)),
      `${deepWord("browLen", x.browLen)} · ${plainOf(m, "brow")}`),
    J("눈", "監察官", "감찰관 · 사람과 일을 보는 눈", avg(tiltScore(m.tilt), pos(m.open, BANDS.open.cut)),
      `${plainOf(m, "tilt")} · ${plainOf(m, "open")}`),
    J("코", "審辨官", "심변관 · 재물과 자존", avg(centre, bandScore("nose", m.nose)),
      [deepWord("noseLen", x.noseLen), deepWord("noseProj", x.noseProj), plainOf(m, "nose")].filter(Boolean).join(" · ")),
    J("입", "出納官", "출납관 · 말과 먹을 복", avg(bandScore("mouth", m.mouth), bandScore("lip", m.lip)),
      `${plainOf(m, "mouth")} · ${plainOf(m, "lip")}`),
    J("귀", "採聽官", "채청관 · 어릴 적 복과 듣는 힘", null, "정면 카메라로는 귀의 크기와 높이를 재기 어려워 아직 보지 않아요"),
  ];
}

const LEAD_KEY: Record<string, string> = { upper: "#소년등과", middle: "#중년전성기", lower: "#대기만성" };

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
  // The best palaces first: every 대길, then 길 to fill three.
  const best = once(pl.filter((p) => p.grade === "대길" || p.grade === "길").sort((a, b) => (b.score ?? 0) - (a.score ?? 0))).slice(0, 3);
  // Every 경계 and 주의 palace, worst first, each with how to prepare.
  const worst = once(pl.filter((p) => p.grade === "경계" || p.grade === "주의")).sort((a, b) => (a.score ?? 0) - (b.score ?? 0)).slice(0, 4);
  const lineOf = (p: Palace) => {
    const t = PALACE[p.name];
    return t ? at(p.grade, [t.good, t.fine, t.caution, t.warn]) : "";
  };
  const strengths = best.map((p) => ({ name: `${p.name} · ${p.rules}`, line: PALACE[p.name].good }));
  const watch = worst.map((p) => ({ name: `${p.name} · ${p.rules}`, grade: p.grade, line: lineOf(p), prep: PALACE[p.name].prep }));
  const keywords = [
    ...(lead ? [{ text: LEAD_KEY[lead], caution: false }] : []),
    ...best.slice(0, 3).map((p) => ({ text: PALACE[p.name].key, caution: false })),
    ...worst.slice(0, 2).map((p) => ({ text: PALACE[p.name].watchKey, caution: true })),
  ];
  const top = best[0];
  const low = worst[0];
  const summary = [
    `${h.main.look}에 ${leadLine}이에요.`,
    `얼굴의 다섯 산(오악)으로 보면 ${pk.plain}이에요.`,
    top ? `가장 든든한 자리는 ${top.name}(${top.rules})이라, ${PALACE[top.name].good}.` : "",
    low ? `가장 챙길 자리는 ${low.name}(${low.rules})이에요. ${lineOf(low)}.` : "크게 꺼진 자리 없이 고른 얼굴이에요.",
  ].filter(Boolean).join(" ");
  return {
    headline: h.main.nick,
    sub: `${h.label} · ${pk.verdict}`,
    summary,
    keywords,
    hyeong: {
      el: h.main.el,
      label: h.label,
      look: h.main.look,
      nature: h.main.nature,
      mixed: h.mixed ? `${h.main.name}과 ${h.mixed.name}의 경계에 있는 겸형이라, ${h.mixed.name}의 기질도 함께 비쳐요.` : null,
    },
    peaks: {
      verdict: pk.verdict,
      plain: pk.plain,
      note: pk.note,
      caution: pk.caution,
      list: pk.peaks.map((p) => {
        const t = PEAK[p.name];
        const bad = p.grade === "주의" || p.grade === "경계";
        return { name: p.name, part: p.part, means: t.means, grade: p.grade, line: at(p.grade, t.lines), prep: bad ? t.prep : null, plain: p.plain, why: p.why };
      }),
    },
    palaces: pl.map((p) => {
      const t = PALACE[p.name];
      const bad = p.grade === "주의" || p.grade === "경계";
      return {
        name: p.name, hanja: p.hanja, where: p.where, rules: p.rules,
        about: t?.about ?? "눈 아래 도톰한 살(와잠)은 자녀의 자리예요.",
        grade: p.grade,
        line: t ? lineOf(p) : "와잠의 두께는 정면 카메라로 재기 어려워 아직 보지 않아요.",
        prep: t && bad ? t.prep : null,
        plain: p.plain, why: p.why,
      };
    }),
    strengths,
    watch,
    traits: traitsOf(m),
    thirds: thirdsOf(m, x, score("남악"), score("중악"), score("북악")),
    organs: organsOf(m, x, score("중악")),
    cards: cardsOf(m, pl, score("중악")),
    flow: flowOf(m, pl, score("중악"), score("남악"), score("북악")),
  };
}
