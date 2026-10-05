// 오악 and 십이궁: the deeper 관상 layer, read from the same face points as lib/gwansang.ts plus their depth.
// Like the saju engine's briefs, every verdict carries the measure it rests on. Cut-offs are a first draft,
// centred on the faces measured so far, and meant to be recalibrated against real captures (/lab/gwansang
// shows the raw numbers for that).

import { BANDS, level, THIRD_CUT, thirdDev, type BandKey, type Face, type Metrics } from "./gwansang";

// Four grades, two on each side so neither reads as the odd one out: 대길 and 길 (good), 주의 (a weak point to
// prepare for) and 경계 (a clear weak point). Each comes from a score of 0–3; several scores are averaged before grading.
export type Grade = "대길" | "길" | "주의" | "경계" | "측정 안 함";
export const gradeOf = (score: number | null): Grade =>
  score === null ? "측정 안 함" : score >= 2.5 ? "대길" : score >= 1.5 ? "길" : score >= 0.5 ? "주의" : "경계";
export const avg = (...v: (number | null)[]): number | null => {
  const k = v.filter((x): x is number => x !== null);
  return k.length ? k.reduce((a, b) => a + b, 0) / k.length : null;
};
export type Deep = {
  forehead: number; // upper forehead width / cheek width
  cheek: number; // cheek width / mean of forehead and jaw widths: how far the cheekbones stand out
  noseLen: number; // brow-root to nose base / face height
  noseProj: number | null; // how far the nose tip stands out from the cheeks, / cheek width (needs depth)
  root: number | null; // how high the nose root (산근) sits above the inner eye corners, / cheek width
  browLen: number; // brow length / eye width
  glabella: number; // space between the inner brow ends (인당) / eye width
};

export function deepMeasure(face: Face): Deep {
  const R = level(face);
  const Z = face.z?.map((z) => z * face.aspect);
  const d = (a: number, b: number) => Math.hypot(R[a][0] - R[b][0], R[a][1] - R[b][1], Z ? Z[a] - Z[b] : 0);
  const cheekW = d(234, 454);
  const eyeW = (d(33, 133) + d(263, 362)) / 2;
  return {
    forehead: d(54, 284) / cheekW,
    cheek: cheekW / ((d(54, 284) + d(172, 397)) / 2),
    noseLen: d(168, 2) / d(10, 152),
    noseProj: Z ? ((Z[234] + Z[454]) / 2 - Z[4]) / cheekW : null,
    root: Z ? ((Z[133] + Z[362]) / 2 - Z[168]) / cheekW : null,
    browLen: (d(46, 55) + d(276, 285)) / 2 / eyeW,
    glabella: d(55, 285) / eyeW,
  };
}

// low / high cut-offs for the deep measures: 20th and 80th percentiles of the same faces as BANDS.
const CUT = {
  forehead: [0.817, 0.864],
  cheek: [1.201, 1.23],
  noseLen: [0.272, 0.297],
  noseProj: [0.654, 0.734],
  root: [0.112, 0.129],
  browLen: [1.549, 1.678],
  glabella: [0.887, 0.977],
} as const;

// Where a value sits against its cut-offs, as a score: below the low cut 0 (경계), the lower half of the usual
// range 1 (주의), the upper half 2 (길), above the high cut 3 (대길). `lowIsGood` turns it round.
export function pos(v: number, [lo, hi]: readonly [number, number], lowIsGood = false): number {
  const s0 = (v - lo) / (hi - lo);
  const s = lowIsGood ? 1 - s0 : s0;
  return s < 0 ? 0 : s < 0.5 ? 1 : s < 1 ? 2 : 3;
}
export const bandScore = (k: BandKey, v: number) => pos(v, BANDS[k].cut);
export const deep = (k: keyof typeof CUT, v: number | null) => (v === null ? null : pos(v, CUT[k]));
export const third = (dev: number) => pos(dev, [-THIRD_CUT, THIRD_CUT]);
// Eye corners read best at their usual tilt: the further from it either way, the lower. The usual tilt is the
// middle of the faces BANDS was set on (about +3°, outer corners a little above the inner ones); the steps are
// about half the spread between people, so the four grades are each reached by a good share of faces.
export const tiltScore = (t: number) => {
  const d = Math.abs(t - 3);
  return d < 1 ? 3 : d < 2.2 ? 2 : d < 3.6 ? 1 : 0;
};

export type Palace = { name: string; hanja: string; where: string; rules: string; score: number | null; grade: Grade; why: string };

const f2 = (v: number) => v.toFixed(2);
const pct = (d: number) => `${d >= 0 ? "+" : ""}${Math.round(d * 100)}%`;

export function palaces(m: Metrics, x: Deep): Palace[] {
  const dev = thirdDev(m);
  const P = (name: string, hanja: string, where: string, rules: string, score: number | null, why: string): Palace => ({
    name, hanja, where, rules, score, grade: gradeOf(score), why,
  });
  return [
    P("명궁", "命宮", "인당(두 눈썹 사이)", "타고난 뜻과 마음의 크기", avg(deep("glabella", x.glabella), bandScore("gap", m.gap)),
      `인당 너비 ${f2(x.glabella)} (눈 너비 기준) · 미간 ${f2(m.gap)}`),
    P("재백궁", "財帛宮", "코와 콧방울", "재물을 모으고 지키는 힘", avg(bandScore("nose", m.nose), deep("noseProj", x.noseProj)),
      `콧방울 ${f2(m.nose)}${x.noseProj === null ? "" : ` · 코 높이 ${f2(x.noseProj)}`}`),
    P("형제궁", "兄弟宮", "눈썹", "형제와 벗의 인연", deep("browLen", x.browLen),
      `눈썹 길이 ${f2(x.browLen)} (눈 너비 기준, 눈보다 길수록 좋음)`),
    P("전택궁", "田宅宮", "눈과 눈썹 사이", "집과 터, 부동산", bandScore("brow", m.brow), `눈썹-눈 간격 ${f2(m.brow)}`),
    P("남녀궁", "男女宮", "눈 아래 와잠", "자녀의 인연", null, "눈 아래 살집은 카메라로 재기 어려워 아직 보지 않아요"),
    P("노복궁", "奴僕宮", "턱 양옆(지각)", "아랫사람과 따르는 사람", avg(third(dev.lower), bandScore("jaw", m.jaw)),
      `하정 보통 대비 ${pct(dev.lower)} · 턱 너비 ${f2(m.jaw)}`),
    P("처첩궁", "妻妾宮", "눈꼬리 끝(어미)", "배우자와 연애의 인연", tiltScore(m.tilt),
      `눈꼬리 기울기 ${m.tilt >= 0 ? "+" : ""}${m.tilt.toFixed(1)}° (+3° 안팎이 안정)`),
    P("질액궁", "疾厄宮", "산근(두 눈 사이 콧대)", "건강과 고비를 넘는 힘", deep("root", x.root),
      x.root === null ? "사진 한 장으로는 깊이를 알 수 없어요" : `산근 높이 ${f2(x.root)}`),
    P("천이궁", "遷移宮", "이마 양 끝(역마)", "이동, 이사, 해외의 운", deep("forehead", x.forehead),
      `이마 너비 ${f2(x.forehead)} (광대 너비 기준)`),
    P("관록궁", "官祿宮", "이마 한가운데", "벼슬, 직장, 명예", third(dev.upper), `상정 보통 대비 ${pct(dev.upper)}`),
    P("복덕궁", "福德宮", "눈썹 위 이마 양쪽(천창)", "타고난 복과 마음의 여유", avg(deep("forehead", x.forehead), deep("browLen", x.browLen)),
      `이마 너비 ${f2(x.forehead)} · 눈썹 길이 ${f2(x.browLen)}`),
    P("부모궁", "父母宮", "이마 위 좌우(일각·월각)", "부모와 윗사람의 덕", third(dev.upper), `이마 높이로 추정 · 상정 보통 대비 ${pct(dev.upper)}`),
  ];
}

export type Peak = { name: string; part: string; score: number | null; grade: Grade; why: string };
export type Peaks = { peaks: Peak[]; verdict: string; note: string; caution: boolean };

// 오악: forehead (남악), chin (북악), nose (중악) and the two cheekbones (동악·서악), and how they hold together.
export function peaks(m: Metrics, x: Deep): Peaks {
  const dev = thirdDev(m);
  const south = avg(third(dev.upper), deep("forehead", x.forehead))!;
  const north = avg(third(dev.lower), bandScore("jaw", m.jaw))!;
  const centre = avg(deep("noseLen", x.noseLen), deep("noseProj", x.noseProj))!;
  const cheek = deep("cheek", x.cheek)!;
  const K = (name: string, part: string, score: number, why: string): Peak => ({ name, part, score, grade: gradeOf(score), why });
  const list = [
    K("남악", "이마", south, `상정 보통 대비 ${pct(dev.upper)} · 이마 너비 ${f2(x.forehead)}`),
    K("북악", "턱", north, `하정 보통 대비 ${pct(dev.lower)} · 턱 너비 ${f2(m.jaw)}`),
    K("중악", "코", centre, `코 길이 ${f2(x.noseLen)}${x.noseProj === null ? "" : ` · 코 높이 ${f2(x.noseProj)}`}`),
    K("동악·서악", "양 광대", cheek, `광대 돌출 ${f2(x.cheek)}`),
  ];
  const sunk = list.filter((p) => p.grade === "경계");
  if (centre >= 2.5 && cheek < 1)
    return { peaks: list, caution: true, verdict: "고봉독립(孤峰獨立)",
      note: "코만 우뚝하고 광대가 받쳐 주지 못하는 형이에요. 혼자 힘으로 이루는 대신, 도와줄 사람이 곁에 적어 지치기 쉬워요. 큰일일수록 함께할 사람을 먼저 구하세요." };
  if (cheek >= 2.5 && centre < 1)
    return { peaks: list, caution: true, verdict: "관골이 중악을 누름",
      note: "광대가 코보다 센 형이에요. 주변의 기세에 내 몫이 눌리기 쉬워요. 동업이나 공동 투자는 몫과 책임을 글로 남겨 두세요." };
  if (sunk.length)
    return { peaks: list, caution: true, verdict: `${sunk.map((p) => p.name).join("·")}이 꺼진 상`,
      note: `${sunk.map((p) => p.part).join(", ")} 쪽 산이 낮아 그 자리가 맡은 시기와 일에서 힘이 덜 실려요. 아래 영역 풀이의 '대비'를 먼저 챙기세요.` };
  if (list.filter((p) => p.grade === "대길").length >= 3)
    return { peaks: list, caution: false, verdict: "오악조귀(五嶽朝歸)", note: "다섯 산이 고루 솟아 서로 받쳐 주는 형이에요. 운이 한쪽으로 쏠리지 않고 고르게 들어온다 봅니다." };
  return { peaks: list, caution: false, verdict: "오악이 무난히 어우러짐", note: "크게 꺼지거나 튀는 곳 없이 다섯 산이 어우러진 형이에요." };
}
