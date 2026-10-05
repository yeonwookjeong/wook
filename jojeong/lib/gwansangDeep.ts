// 오악 and 십이궁: the deeper 관상 layer, read from the same face points as lib/gwansang.ts plus their depth.
// Like the saju engine's briefs, every verdict carries the measure it rests on. Cut-offs are a first draft,
// centred on the faces measured so far, and meant to be recalibrated against real captures (/lab/gwansang
// shows the raw numbers for that).

import { band, level, type Face, type Metrics } from "./gwansang";

export type Grade = "상" | "중" | "보완" | "측정 안 함";
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

// low / high cut-offs for the deep measures (draft).
const CUT = {
  forehead: [0.78, 0.9],
  cheek: [1.12, 1.26],
  noseLen: [0.29, 0.34],
  noseProj: [0.6, 0.8],
  root: [0.08, 0.16],
  browLen: [1.3, 1.55],
  glabella: [0.8, 1.0],
} as const;
const step = (k: keyof typeof CUT, v: number): 0 | 1 | 2 => (v < CUT[k][0] ? 0 : v > CUT[k][1] ? 2 : 1);

export type Palace = { name: string; hanja: string; where: string; rules: string; grade: Grade; why: string };

const f2 = (v: number) => v.toFixed(2);

export function palaces(m: Metrics, x: Deep): Palace[] {
  const g = (s: 0 | 1 | 2, best: 0 | 2 = 2): Grade => (s === best ? "상" : s === 1 ? "중" : "보완");
  const tilt = band("tilt", m.tilt).step;
  const brow = band("brow", m.brow).step;
  const gap = band("gap", m.gap).step;
  const nose = band("nose", m.nose).step;
  const jaw = band("jaw", m.jaw).step;
  const proj = x.noseProj === null ? null : step("noseProj", x.noseProj);
  const root = x.root === null ? null : step("root", x.root);
  const upper = m.upper >= 0.24 ? 2 : m.upper <= 0.19 ? 0 : 1;
  const lowFull = m.lower >= 0.38 && jaw !== 0 ? 2 : m.lower <= 0.33 || jaw === 0 ? 0 : 1;
  return [
    {
      name: "명궁", hanja: "命宮", where: "인당(두 눈썹 사이)", rules: "타고난 뜻과 마음의 크기",
      grade: g(Math.max(step("glabella", x.glabella), gap === 2 ? 2 : 0) as 0 | 1 | 2),
      why: `인당 너비 ${f2(x.glabella)} (눈 너비 기준) · 미간 ${f2(m.gap)}`,
    },
    {
      name: "재백궁", hanja: "財帛宮", where: "코와 콧방울", rules: "재물을 모으고 지키는 힘",
      grade: proj === null ? g(nose) : g(Math.round((proj + nose) / 2) as 0 | 1 | 2),
      why: `콧방울 ${f2(m.nose)}${x.noseProj === null ? "" : ` · 코 높이 ${f2(x.noseProj)}`}`,
    },
    {
      name: "형제궁", hanja: "兄弟宮", where: "눈썹", rules: "형제와 벗의 인연",
      grade: g(step("browLen", x.browLen)),
      why: `눈썹 길이 ${f2(x.browLen)} (눈 너비 기준, 눈보다 길수록 좋음)`,
    },
    {
      name: "전택궁", hanja: "田宅宮", where: "눈과 눈썹 사이", rules: "집과 터, 부동산",
      grade: g(brow),
      why: `눈썹-눈 간격 ${f2(m.brow)}`,
    },
    {
      name: "남녀궁", hanja: "男女宮", where: "눈 아래 와잠", rules: "자녀의 인연",
      grade: "측정 안 함",
      why: "눈 아래 살집은 카메라로 재기 어려워 아직 보지 않아요",
    },
    {
      name: "노복궁", hanja: "奴僕宮", where: "턱 양옆(지각)", rules: "아랫사람과 따르는 사람",
      grade: g(lowFull as 0 | 1 | 2),
      why: `하정 ${(m.lower * 100).toFixed(1)}% · 턱 너비 ${f2(m.jaw)}`,
    },
    {
      name: "처첩궁", hanja: "妻妾宮", where: "눈꼬리 끝(어미)", rules: "배우자와 연애의 인연",
      grade: tilt === 1 ? "상" : "중",
      why: `눈꼬리 기울기 ${m.tilt >= 0 ? "+" : ""}${m.tilt.toFixed(1)}° (평평할수록 안정)`,
    },
    {
      name: "질액궁", hanja: "疾厄宮", where: "산근(두 눈 사이 콧대)", rules: "건강과 고비를 넘는 힘",
      grade: root === null ? "측정 안 함" : g(root),
      why: x.root === null ? "사진 한 장으로는 깊이를 알 수 없어요" : `산근 높이 ${f2(x.root)}`,
    },
    {
      name: "천이궁", hanja: "遷移宮", where: "이마 양 끝(역마)", rules: "이동, 이사, 해외의 운",
      grade: g(step("forehead", x.forehead)),
      why: `이마 너비 ${f2(x.forehead)} (광대 너비 기준)`,
    },
    {
      name: "관록궁", hanja: "官祿宮", where: "이마 한가운데", rules: "벼슬, 직장, 명예",
      grade: g(upper as 0 | 1 | 2),
      why: `상정 ${(m.upper * 100).toFixed(1)}% (이마 윗선은 머리카락에 가려 낮게 잡혀요)`,
    },
    {
      name: "복덕궁", hanja: "福德宮", where: "눈썹 위 이마 양쪽(천창)", rules: "타고난 복과 마음의 여유",
      grade: g(Math.round((step("forehead", x.forehead) + step("browLen", x.browLen)) / 2) as 0 | 1 | 2),
      why: `이마 너비 ${f2(x.forehead)} · 눈썹 길이 ${f2(x.browLen)}`,
    },
    {
      name: "부모궁", hanja: "父母宮", where: "이마 위 좌우(일각·월각)", rules: "부모와 윗사람의 덕",
      grade: g(upper as 0 | 1 | 2),
      why: `이마 높이로 추정 · 상정 ${(m.upper * 100).toFixed(1)}%`,
    },
  ];
}

export type Peak = { name: string; part: string; grade: Grade; why: string };
export type Peaks = { peaks: Peak[]; verdict: string; note: string };

// 오악: forehead (남악), chin (북악), nose (중악) and the two cheekbones (동악·서악), and how they hold together.
export function peaks(m: Metrics, x: Deep): Peaks {
  const g = (s: number): Grade => (s >= 1.5 ? "상" : s >= 0.5 ? "중" : "보완");
  const upper = m.upper >= 0.24 ? 2 : m.upper <= 0.19 ? 0 : 1;
  const south = (upper + step("forehead", x.forehead)) / 2;
  const jaw = band("jaw", m.jaw).step;
  const north = ((m.lower >= 0.38 ? 2 : m.lower <= 0.33 ? 0 : 1) + (jaw === 0 ? 0 : jaw === 2 ? 2 : 1)) / 2;
  const centre = x.noseProj === null ? step("noseLen", x.noseLen) : (step("noseLen", x.noseLen) + step("noseProj", x.noseProj)) / 2;
  const cheek = step("cheek", x.cheek);
  const list: Peak[] = [
    { name: "남악", part: "이마", grade: g(south), why: `상정 ${(m.upper * 100).toFixed(1)}% · 이마 너비 ${f2(x.forehead)}` },
    { name: "북악", part: "턱", grade: g(north), why: `하정 ${(m.lower * 100).toFixed(1)}% · 턱 너비 ${f2(m.jaw)}` },
    { name: "중악", part: "코", grade: g(centre), why: `코 길이 ${f2(x.noseLen)}${x.noseProj === null ? "" : ` · 코 높이 ${f2(x.noseProj)}`}` },
    { name: "동악·서악", part: "양 광대", grade: g(cheek), why: `광대 돌출 ${f2(x.cheek)}` },
  ];
  const tops = list.filter((p) => p.grade === "상").length;
  const lows = list.filter((p) => p.grade === "보완").length;
  if (centre >= 1.5 && cheek === 0)
    return { peaks: list, verdict: "고봉독립(孤峰獨立)", note: "코만 우뚝하고 광대가 받쳐 주지 못하는 형이에요. 남의 도움보다 혼자 힘으로 이루는 사람이라 봅니다." };
  if (cheek === 2 && centre < 0.5)
    return { peaks: list, verdict: "관골이 중악을 누름", note: "광대가 코보다 힘이 센 형이에요. 주변의 기세가 강하니 내 몫을 분명히 챙기라 합니다." };
  if (tops >= 3 && lows === 0)
    return { peaks: list, verdict: "오악조귀(五嶽朝歸)", note: "다섯 산이 고루 솟아 서로 받쳐 주는 형이에요. 운이 한쪽으로 쏠리지 않고 고르게 들어온다 봅니다." };
  return { peaks: list, verdict: "오악이 무난히 어우러짐", note: "크게 기운 곳 없이 다섯 산이 무난히 어우러진 형이에요." };
}
