// The 관상 free reading, computed only (no writer, no cost), built like the saju free reading (lib/freeReading.ts):
// a headline, what is strong and what to work on, six area cards, and a flow through the ages (유년운기). Every
// line rests on the measures (lib/gwansang.ts, lib/gwansangDeep.ts) and says which.

import { band, hyeong, leadThird, THIRD_NAME, thirdDev, thirdStep, type Metrics } from "./gwansang";
import { palaces, peaks, type Deep, type Grade, type Palace } from "./gwansangDeep";

export type Card = { key: string; title: string; hanja: string; grade: Grade; line: string; tip: string; why: string };
export type Flow = { from: number; to: number; part: string; mood: "활짝" | "무난" | "다지기"; line: string; why: string };
export type GwansangReading = {
  headline: string;
  summary: string;
  strengths: { name: string; line: string }[];
  works: { name: string; line: string }[];
  cards: Card[];
  flow: Flow[];
};

const SCORE: Record<Grade, number | null> = { 상: 2, 중: 1, 보완: 0, "측정 안 함": null };
// The mean of several grades, unread ones left out.
function blend(...gs: Grade[]): Grade {
  const v = gs.map((g) => SCORE[g]).filter((x): x is number => x !== null);
  if (!v.length) return "측정 안 함";
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  return m >= 1.5 ? "상" : m >= 0.75 ? "중" : "보완";
}
const fromStep = (s: 0 | 1 | 2, best: 0 | 2 = 2): Grade => (s === best ? "상" : s === 1 ? "중" : "보완");

// What a strong palace gives, and what a palace marked 보완 asks of the reader.
const PALACE_TEXT: Record<string, { good: string; work: string }> = {
  명궁: { good: "마음의 그릇이 넓어 사람과 일을 넉넉하게 품어요", work: "생각이 한곳에 몰리기 쉬워요. 결정 전에 하루 묵혀 보세요" },
  재백궁: { good: "들어온 돈을 지키고 불리는 힘이 있어요", work: "모으는 힘이 약한 편이에요. 자동 저축처럼 '저절로 모이는 장치'를 두세요" },
  형제궁: { good: "형제와 벗의 인연이 두터워 곁에 사람이 남아요", work: "가까운 사람과의 거리 조절이 숙제예요. 부탁은 분명하게 하세요" },
  전택궁: { good: "집과 터의 복이 있어 머무는 곳이 안정돼요", work: "집과 살림은 서두르기보다 오래 보고 고르는 게 맞아요" },
  노복궁: { good: "따르는 사람과 아랫사람 복이 있어요", work: "혼자 다 떠안기 쉬워요. 일을 나눠 맡기는 연습이 필요해요" },
  처첩궁: { good: "배우자와 연애의 인연이 고르게 들어와요", work: "감정의 온도 차가 생기기 쉬워요. 표현을 한 번 더 하세요" },
  질액궁: { good: "고비를 버텨 내는 기력이 단단해요", work: "몸이 보내는 신호를 미루지 마세요. 잠과 쉼부터 챙기세요" },
  천이궁: { good: "이동과 변화에서 기회가 열려요. 이사, 출장, 해외 운이 좋아요", work: "자리를 옮기기 전에 준비를 한 번 더 하세요" },
  관록궁: { good: "일과 자리에서 이름을 얻는 힘이 있어요", work: "인정받는 데 시간이 걸리는 편이에요. 실적을 기록으로 남기세요" },
  복덕궁: { good: "타고난 복과 마음의 여유가 있어요", work: "스스로를 몰아붙이기 쉬워요. 쉬는 날을 일정에 먼저 넣으세요" },
  부모궁: { good: "부모와 윗사람의 덕을 보는 상이에요", work: "윗사람 도움보다 스스로 길을 내는 편이에요" },
};

function cardsOf(m: Metrics, pl: Palace[], centre: Grade): Card[] {
  const p = (name: string) => pl.find((x) => x.name === name)!;
  const tilt = band("tilt", m.tilt).step;
  const lip = band("lip", m.lip).step;
  const gap = band("gap", m.gap).step;
  const mouth = band("mouth", m.mouth).step;
  const money = blend(p("재백궁").grade, centre);
  const work = blend(p("관록궁").grade, p("천이궁").grade, tilt === 2 ? "상" : "중");
  const love = blend(p("처첩궁").grade, lip === 2 ? "상" : lip === 0 ? "보완" : "중");
  const people = blend(p("노복궁").grade, gap === 2 ? "상" : gap === 0 ? "보완" : "중", mouth === 2 ? "상" : "중");
  const health = blend(p("질액궁").grade, fromStep(thirdStep(thirdDev(m).lower)));
  const family = blend(p("부모궁").grade, p("형제궁").grade, p("전택궁").grade);
  const pick = (g: Grade, three: [string, string, string]) => (g === "상" ? three[0] : g === "보완" ? three[2] : three[1]);
  return [
    {
      key: "money", title: "재물", hanja: "財", grade: money,
      line: pick(money, [
        "재물 그릇이 커요. 코가 받쳐 주니 들어온 돈이 쉽게 새지 않는 상이에요.",
        "버는 만큼 차곡차곡 모이는 꾸준한 재물 상이에요.",
        "씀씀이가 깔끔한 대신 모으는 힘은 약한 편이에요.",
      ]),
      tip: pick(money, ["큰돈은 한 번에 굴리기보다 나눠 담으세요.", "고정 지출부터 줄이면 그릇이 한 뼘 커져요.", "월급날 자동 저축처럼 '저절로 모이는 장치'를 두세요."]),
      why: p("재백궁").why,
    },
    {
      key: "work", title: "일과 명예", hanja: "官", grade: work,
      line: pick(work, [
        "이마와 눈의 기세가 받쳐 줘서 자리를 맡고 이름을 얻는 상이에요.",
        "맡은 자리에서 차근차근 인정받는 상이에요.",
        "단번에 올라가기보다 실력을 쌓아 늦게 빛나는 상이에요.",
      ]),
      tip: pick(work, ["앞에 서는 자리를 피하지 마세요.", "한 분야를 오래 파면 이름이 붙어요.", "실적을 기록으로 남겨 두세요. 늦게라도 꼭 쓰여요."]),
      why: `${p("관록궁").why} · 눈꼬리 ${m.tilt >= 0 ? "+" : ""}${m.tilt.toFixed(1)}°`,
    },
    {
      key: "love", title: "연애와 배우자", hanja: "緣", grade: love,
      line: pick(love, [
        "눈꼬리가 고르고 입술에 정이 있어 인연이 따뜻하게 이어지는 상이에요.",
        "천천히 깊어지는 인연이 맞는 상이에요.",
        "마음은 깊은데 표현이 덜 닿기 쉬운 상이에요.",
      ]),
      tip: pick(love, ["좋은 사람을 오래 곁에 두는 힘이 있어요. 표현은 지금처럼.", "서두르지 말고 함께 보내는 시간을 늘리세요.", "좋아하는 마음은 말로 한 번 더 꺼내세요."]),
      why: `${p("처첩궁").why} · 입술 두께 ${m.lip.toFixed(2)}`,
    },
    {
      key: "people", title: "사람과 관계", hanja: "人", grade: people,
      line: pick(people, [
        "미간이 트이고 턱이 받쳐 줘서 사람이 모이고 따르는 상이에요.",
        "가까운 사람과 오래 가는 관계가 맞는 상이에요.",
        "사람을 가려 사귀는 신중한 상이에요.",
      ]),
      tip: pick(people, ["모임의 중심에 서면 운이 커져요.", "새 사람보다 있는 인연을 챙기세요.", "믿을 사람 몇 명이면 충분해요. 넓히기보다 깊게."]),
      why: `${p("노복궁").why} · 미간 ${m.gap.toFixed(2)}`,
    },
    {
      key: "health", title: "건강과 기력", hanja: "壽", grade: health,
      line: pick(health, [
        "산근과 턱이 단단해 고비를 잘 버티는 기력의 상이에요.",
        "무리하지 않으면 고르게 가는 기력이에요.",
        "기력을 아껴 써야 하는 상이에요.",
      ]),
      tip: pick(health, ["기력이 좋을수록 쉬는 날을 정해 두세요.", "잠과 끼니를 규칙적으로 지키면 충분해요.", "몸의 신호를 미루지 말고, 잠부터 챙기세요."]),
      why: `${p("질액궁").why} · 하정 보통 대비 ${Math.round(thirdDev(m).lower * 100)}%`,
    },
    {
      key: "family", title: "집안과 터", hanja: "家", grade: family,
      line: pick(family, [
        "부모, 형제, 집터의 복이 고루 있는 상이에요.",
        "집안의 도움과 내 힘이 반반인 상이에요.",
        "집안의 도움보다 스스로 터를 일구는 상이에요.",
      ]),
      tip: pick(family, ["받은 복을 나누면 더 커져요.", "가족 일은 미리 의논해 두면 편해요.", "내 집, 내 터는 조급하지 않게 오래 보고 정하세요."]),
      why: `${p("부모궁").why} · ${p("형제궁").why}`,
    },
  ];
}

// 유년운기, simplified from the 마의상법 age chart: each age span is read on the face part it falls on.
function flowOf(m: Metrics, pl: Palace[], centre: Grade, south: Grade, north: Grade): Flow[] {
  const p = (name: string) => pl.find((x) => x.name === name)!.grade;
  const eye = band("tilt", m.tilt).step !== 0 && band("open", m.open).step !== 0 ? "상" : "중";
  const mouthG = blend(fromStep(band("philtrum", m.philtrum).step), band("lip", m.lip).step === 0 ? "보완" : "중", band("mouth", m.mouth).step === 2 ? "상" : "중");
  const spans: { from: number; to: number; part: string; grade: Grade; good: string; steady: string; build: string; why: string }[] = [
    { from: 15, to: 30, part: "이마(상정)", grade: blend(south, p("관록궁"), p("부모궁")),
      good: "배움과 첫 자리가 순하게 열리는 시기", steady: "스스로 길을 찾아가는 시기", build: "기반을 혼자 다지는 시기", why: "이마, 관록궁, 부모궁" },
    { from: 31, to: 34, part: "눈썹", grade: p("형제궁"),
      good: "벗과 동료의 도움이 붙는 시기", steady: "사람 사이에서 자리를 잡는 시기", build: "관계를 정리하고 다지는 시기", why: "눈썹, 형제궁" },
    { from: 35, to: 40, part: "눈", grade: blend(eye, p("처첩궁")),
      good: "판단이 서고 기세가 오르는 시기", steady: "보는 눈이 깊어지는 시기", build: "속도를 늦추고 살피는 시기", why: "눈, 처첩궁" },
    { from: 41, to: 50, part: "코(산근에서 준두까지)", grade: blend(centre, p("재백궁"), p("질액궁")),
      good: "재물과 자리가 크게 무르익는 시기", steady: "모은 것을 굴려 키우는 시기", build: "무리한 확장보다 지키는 시기", why: "중악, 재백궁, 질액궁" },
    { from: 51, to: 60, part: "인중과 입", grade: mouthG,
      good: "말과 덕이 사람을 모으는 시기", steady: "쌓은 것을 나누며 가는 시기", build: "말을 아끼고 건강을 챙기는 시기", why: "인중, 입" },
    { from: 61, to: 75, part: "턱(지각)", grade: blend(north, p("노복궁")),
      good: "따르는 사람과 터가 든든한 시기", steady: "편안하게 거두는 시기", build: "가진 것을 정리하며 가볍게 가는 시기", why: "턱, 북악, 노복궁" },
  ];
  return spans.map((s) => ({
    from: s.from,
    to: s.to,
    part: s.part,
    mood: s.grade === "상" ? "활짝" : s.grade === "보완" ? "다지기" : "무난",
    line: s.grade === "상" ? s.good : s.grade === "보완" ? s.build : s.steady,
    why: s.why,
  }));
}

export function gwansangReading(m: Metrics, x: Deep): GwansangReading {
  const pl = palaces(m, x);
  const pk = peaks(m, x);
  const grade = (name: string) => pk.peaks.find((p) => p.name === name)!.grade;
  const h = hyeong(m);
  const lead = leadThird(m);
  const leadLine = lead ? `${THIRD_NAME[lead].part}이 길어 ${THIRD_NAME[lead].age}에 힘이 실리는 상` : "세 마디가 고르게 나뉜 상";
  const read = pl.filter((p) => p.grade !== "측정 안 함");
  // Palaces read from the same measure count once (관록궁 and 부모궁 both rest on the forehead's height).
  const basis = (name: string) => (name === "부모궁" ? "관록궁" : name);
  const once = (list: Palace[]) => list.filter((p, i) => list.findIndex((q) => basis(q.name) === basis(p.name)) === i);
  const strengths = once(read.filter((p) => p.grade === "상")).slice(0, 3).map((p) => ({ name: p.name, line: PALACE_TEXT[p.name].good }));
  // Like the saju reading's weakest power, there is always something to grow: a 보완 palace, else a middling one.
  const low = once(read.filter((p) => p.grade === "보완"));
  const works = (low.length ? low : once(read.filter((p) => p.grade === "중")).slice(0, 1))
    .slice(0, 2)
    .map((p) => ({ name: p.name, line: PALACE_TEXT[p.name].work }));
  return {
    headline: `${h.label} · ${pk.verdict}`,
    summary: `${h.main.look}에 ${leadLine}이에요. ${pk.note}`,
    strengths,
    works,
    cards: cardsOf(m, pl, grade("중악")),
    flow: flowOf(m, pl, grade("중악"), grade("남악"), grade("북악")),
  };
}
