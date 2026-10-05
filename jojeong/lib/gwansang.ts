// 관상 (face reading) from the 478 face points MediaPipe finds on the viewer's own device. Only these numbers
// leave the camera: never the picture. Everything here is pure, so the same points always read the same.

export type Pt = [number, number];
// Points in 0–1 of the frame, the frame's width / height, and each point's depth (MediaPipe's z, on the scale of x)
// when known: lengths are then measured in 3D, so a chin raised or lowered a little does not stretch the face.
export type Face = { pts: Pt[]; aspect: number; z?: number[] };

// Point numbers on the MediaPipe face mesh, as the picture shows them (left = the image's left).
export const IDX = {
  oval: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
  rEyeUp: [33, 246, 161, 160, 159, 158, 157, 173, 133],
  rEyeLo: [33, 7, 163, 144, 145, 153, 154, 155, 133],
  lEyeUp: [263, 466, 388, 387, 386, 385, 384, 398, 362],
  lEyeLo: [263, 249, 390, 373, 374, 380, 381, 382, 362],
  rBrow: [46, 53, 52, 65, 55, 107, 66, 105, 63, 70],
  lBrow: [276, 283, 282, 295, 285, 336, 296, 334, 293, 300],
  lips: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146],
  mouth: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308],
  bridge: [168, 6, 197, 195],
  noseBase: [102, 64, 98, 97, 2, 326, 327, 294, 331],
} as const;

// The points in pixels of a square frame, turned so the eye line is level (a tilted head reads the same).
export function level(face: Face): Pt[] {
  const P = face.pts.map(([x, y]): Pt => [x * face.aspect, y]);
  const roll = Math.atan2(P[263][1] - P[33][1], P[263][0] - P[33][0]);
  const c = P[168];
  const cs = Math.cos(-roll);
  const sn = Math.sin(-roll);
  return P.map(([x, y]): Pt => [(x - c[0]) * cs - (y - c[1]) * sn, (x - c[0]) * sn + (y - c[1]) * cs]);
}

export type Metrics = {
  upper: number; // 삼정: forehead, nose, chin as shares of the face's height (sum 1)
  middle: number;
  lower: number;
  ratio: number; // face height / width
  jaw: number; // jaw width / cheek width
  tilt: number; // outer eye corners above the inner ones, degrees
  open: number; // eye height / eye width
  gap: number; // space between the eyes / one eye's width
  nose: number; // nostril width / space between the eyes
  mouth: number; // mouth width / nostril width
  lip: number; // lip thickness / mouth width
  brow: number; // brow-to-eye distance / eye width
  philtrum: number; // 인중 / the lower third
};

export function measure(face: Face): Metrics {
  const R = level(face);
  const Z = face.z?.map((z) => z * face.aspect);
  const d = (a: number, b: number) => Math.hypot(R[a][0] - R[b][0], R[a][1] - R[b][1], Z ? Z[a] - Z[b] : 0);
  const up = d(9, 10);
  const mid = d(2, 9);
  const low = d(152, 2);
  const sum = up + mid + low;
  const eyeW = (d(33, 133) + d(263, 362)) / 2;
  const tiltOf = (inner: number, outer: number) =>
    (Math.atan2(R[inner][1] - R[outer][1], Math.abs(R[inner][0] - R[outer][0])) * 180) / Math.PI;
  return {
    upper: up / sum,
    middle: mid / sum,
    lower: low / sum,
    ratio: d(10, 152) / d(234, 454),
    jaw: d(172, 397) / d(234, 454),
    tilt: (tiltOf(133, 33) + tiltOf(362, 263)) / 2,
    open: (d(159, 145) / d(33, 133) + d(386, 374) / d(263, 362)) / 2,
    gap: d(133, 362) / eyeW,
    nose: d(64, 294) / d(133, 362),
    mouth: d(61, 291) / d(64, 294),
    lip: d(0, 17) / d(61, 291),
    brow: (R[159][1] - R[105][1] + (R[386][1] - R[334][1])) / 2 / eyeW,
    philtrum: (R[0][1] - R[2][1]) / low,
  };
}

// 삼정 against the faces measured so far, not against an even third each: the camera sets the forehead's top at
// the mesh's upper edge, below the real hairline, so the 상정 always reads short in raw shares. Each third is read
// as how far it sits above or below its usual share (+0.10 = a tenth longer than usual).
export const THIRD_REF = { upper: 0.201, middle: 0.38, lower: 0.423 } as const;
// How far from the usual share counts as long or short: about a fifth of faces fall past it on each side.
export const THIRD_CUT = 0.045;
export type Third = keyof typeof THIRD_REF;
export const THIRD_NAME: Record<Third, { part: string; age: string }> = {
  upper: { part: "상정", age: "초년" },
  middle: { part: "중정", age: "중년" },
  lower: { part: "하정", age: "말년" },
};
export function thirdDev(m: Metrics): Record<Third, number> {
  return { upper: m.upper / THIRD_REF.upper - 1, middle: m.middle / THIRD_REF.middle - 1, lower: m.lower / THIRD_REF.lower - 1 };
}
// 0 short, 1 usual, 2 long.
export const thirdStep = (dev: number): 0 | 1 | 2 => (dev < -THIRD_CUT ? 0 : dev > THIRD_CUT ? 2 : 1);
// The third that stands out most, or null when all three sit within their usual range.
export function leadThird(m: Metrics): Third | null {
  const d = thirdDev(m);
  const top = (Object.keys(d) as Third[]).sort((a, b) => d[b] - d[a])[0];
  return d[top] > 0.03 ? top : null;
}

// The middle of several readings of one face, point by point: one blink or twitch in a burst does not move it.
export function medianFace(faces: Face[]): Face {
  const mid = (v: number[]) => {
    const s = [...v].sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const pts = faces[0].pts.map((_, i): Pt => [mid(faces.map((f) => f.pts[i][0])), mid(faces.map((f) => f.pts[i][1]))]);
  const z = faces.every((f) => f.z) ? faces[0].pts.map((_, i) => mid(faces.map((f) => f.z![i]))) : undefined;
  return { pts, aspect: mid(faces.map((f) => f.aspect)), z };
}

// Each measure's cut-offs, low then high: below the first reads one way, above the second the other. Set at the
// 20th and 80th percentiles of 37 front-facing faces from public face-restoration test sets (deepface, CodeFormer,
// GFPGAN), so about a fifth of people land on each side. `noise` is how far the same face moves between shots
// (the same photos re-read scaled, shifted and turned); within it of a cut, a reading names both words.
// Most of those faces are Western: revise against real captures once there are enough.
export const BANDS: Record<Exclude<keyof Metrics, "upper" | "middle" | "lower">, { label: string; cut: [number, number]; noise: number; words: [string, string, string] }> = {
  ratio: { label: "얼굴 세로/가로", cut: [1.12, 1.22], noise: 0.013, words: ["넓은 편", "보통", "긴 편"] },
  jaw: { label: "턱 너비/광대 너비", cut: [0.786, 0.818], noise: 0.005, words: ["갸름", "보통", "각진 편"] },
  tilt: { label: "눈꼬리 기울기", cut: [1, 5.5], noise: 0.5, words: ["처짐", "수평", "올라감"] },
  open: { label: "눈 뜬 정도", cut: [0.252, 0.346], noise: 0.0125, words: ["가는 눈", "보통", "큰 눈"] },
  gap: { label: "미간/눈 너비", cut: [1.168, 1.355], noise: 0.027, words: ["좁음", "눈 하나", "넓음"] },
  nose: { label: "콧방울/미간", cut: [0.982, 1.169], noise: 0.023, words: ["좁은 코", "보통", "넓은 코"] },
  mouth: { label: "입/콧방울", cut: [1.381, 1.612], noise: 0.031, words: ["작은 입", "보통", "큰 입"] },
  lip: { label: "입술 두께/입 너비", cut: [0.265, 0.389], noise: 0.013, words: ["얇음", "보통", "도톰"] },
  brow: { label: "눈썹-눈 간격", cut: [0.606, 0.708], noise: 0.018, words: ["가까움", "보통", "넓음"] },
  philtrum: { label: "인중/하정", cut: [0.171, 0.238], noise: 0.007, words: ["짧은 인중", "보통", "긴 인중"] },
};
export type BandKey = keyof typeof BANDS;
// The part of the face each measure is about, for evidence written in words ("미간 넓음").
export const BAND_PART: Record<BandKey, string> = {
  ratio: "얼굴 길이", jaw: "턱", tilt: "눈꼬리", open: "눈", gap: "미간", nose: "콧방울", mouth: "입", lip: "입술", brow: "눈썹과 눈 사이", philtrum: "인중",
};
// In four steps like the grades: the middle word says which way it leans ("턱 보통(갸름 쪽)").
export const plainOf = (m: Metrics, k: BandKey) => {
  const [w0, w1, w2] = BANDS[k].words;
  const [lo, hi] = BANDS[k].cut;
  const v = m[k];
  return `${BAND_PART[k]} ${v < lo ? w0 : v > hi ? w2 : v < (lo + hi) / 2 ? `${w1}(${w0.replace(/ 편$/, "")} 쪽)` : `${w1}(${w2.replace(/ 편$/, "")} 쪽)`}`;
};

// 0, 1 or 2 for a measure, and whether it sits within 4% of a cut-off (a reading a retake could tip either way).
export function band(key: BandKey, v: number): { step: 0 | 1 | 2; near: boolean } {
  const [lo, hi] = BANDS[key].cut;
  const near = [lo, hi].some((c) => Math.abs(v - c) <= BANDS[key].noise);
  return { step: v < lo ? 0 : v > hi ? 2 : 1, near };
}

// A measure's word. On the edge between two words it names both ("보통·긴 편"), the same way from either side,
// so a retake that lands a hair across the line still reads the same.
export function wordOf(key: BandKey, v: number): string {
  const { words, cut, noise } = BANDS[key];
  if (Math.abs(v - cut[0]) <= noise) return `${words[0]}·${words[1]}`;
  if (Math.abs(v - cut[1]) <= noise) return `${words[1]}·${words[2]}`;
  return words[band(key, v).step];
}

// Each type: its look, a nickname for the headline, and its nature at its best and its other side.
export type Hyeong = { el: "木" | "火" | "土" | "金" | "水"; name: string; look: string; nick: string; nature: string };
const HYEONG: Record<Hyeong["el"], Hyeong> = {
  木: { el: "木", name: "목형", look: "길고 곧은 얼굴", nick: "곧게 뻗는 나무의 얼굴",
    nature: "나무처럼 위로 뻗는 사람이에요. 배우고 오르려는 힘이 크고 뜻이 곧아요. 다만 꺾이는 걸 못 견뎌, 굽힐 때 굽히지 못하고 고집으로 버티기 쉬워요." },
  火: { el: "火", name: "화형", look: "위가 넓고 턱이 뾰족한 얼굴", nick: "번뜩이는 불꽃의 얼굴",
    nature: "불처럼 번뜩이는 재주와 열정이 있어요. 머리 회전이 빠르고 사람을 끄는 매력이 있어요. 다만 빨리 타오르는 만큼 빨리 식어, 끝마무리가 약해지기 쉬워요." },
  土: { el: "土", name: "토형", look: "넓고 두터운 얼굴", nick: "듬직한 흙산의 얼굴",
    nature: "흙처럼 믿음직하고 사람을 넉넉히 품어요. 한번 맡은 일은 끝까지 지고 가요. 다만 한번 정하면 잘 움직이지 않아, 변화가 필요할 때 한 박자 늦기 쉬워요." },
  金: { el: "金", name: "금형", look: "각지고 반듯한 얼굴", nick: "반듯하게 벼린 쇠의 얼굴",
    nature: "쇠처럼 원칙이 분명하고 결단이 빨라요. 맺고 끊음이 확실해 믿고 맡기기 좋은 사람이에요. 다만 날이 서 있어, 가까운 사람이 어려워하거나 상처받기 쉬워요." },
  水: { el: "水", name: "수형", look: "둥글고 부드러운 얼굴", nick: "어디든 스며드는 물의 얼굴",
    nature: "물처럼 어디든 스며드는 적응력과 지혜가 있어요. 사람을 편하게 하고 상황을 읽는 눈이 밝아요. 다만 흐르는 대로 가다 보면 내 중심을 잃고 남에게 맞춰 주기만 하기 쉬워요." },
};
// Quartiles of the same faces: the longest quarter 木, the narrowest jaws 火, the widest jaws 土 (shorter) or
// 金 (longer), the rest 水.
function hyeongAt(ratio: number, jaw: number): Hyeong["el"] {
  if (ratio >= 1.215) return "木";
  if (jaw >= 0.818) return ratio < 1.162 ? "土" : "金";
  if (jaw < 0.788) return "火";
  return "水";
}
// The face's 오행 type, and the type a nudge of the measures would give instead (겸형) when it sits on an edge.
// `label` names both in a fixed order (목·화·토·금·수), so either side of the edge reads the same.
export function hyeong(m: Metrics): { main: Hyeong; mixed: Hyeong | null; label: string } {
  const main = hyeongAt(m.ratio, m.jaw);
  const nudges: [number, number][] = [[BANDS.ratio.noise, 0], [-BANDS.ratio.noise, 0], [0, BANDS.jaw.noise], [0, -BANDS.jaw.noise]];
  const other = nudges.map(([a, b]) => hyeongAt(m.ratio + a, m.jaw + b)).find((e) => e !== main);
  const order = "木火土金水";
  const both = other ? [main, other].sort((a, b) => order.indexOf(a) - order.indexOf(b)) : [main];
  const label = both.map((e) => HYEONG[e].name.slice(0, 1)).join("·") + "형";
  return { main: HYEONG[main], mixed: other ? HYEONG[other] : null, label };
}

// 관상 도식: the notes written around the portrait, each pinned to a face point, and the two boxes under it.
// The point numbers are MediaPipe's; `side` is the side of the picture the note sits on.
export type ChartNote = { anchor: number; side: "L" | "R"; title: string; note: string };

export function chartNotes(m: Metrics): ChartNote[] {
  const st = (k: BandKey) => band(k, m[k]).step;
  const forehead =
    [["아담한 이마", "스스로 일어서는 초년"], ["반듯한 이마", "무난한 초년"], ["넓고 훤한 이마", "초년운이 밝음"]][thirdStep(thirdDev(m).upper)];
  const brow = [["눈썹이 눈에 가까움", "결단이 빠름"], ["가지런한 눈썹", "벗과 형제 복"], ["높고 시원한 눈썹", "도량이 넓음"]][st("brow")];
  const tilt = st("tilt");
  const open = st("open");
  const eye =
    tilt === 2 && open === 2 ? ["눈꼬리 올라간 큰 눈", "기세와 총명"]
    : tilt === 2 ? ["올라간 눈꼬리", "밀고 나가는 힘"]
    : tilt === 0 ? ["순하게 처진 눈꼬리", "온화하고 인복 많음"]
    : open === 2 ? ["크고 맑은 눈", "감수성이 풍부함"]
    : open === 0 ? ["가늘고 긴 눈", "신중하고 속이 깊음"]
    : ["반듯한 눈", "균형 잡힌 판단"];
  const gap = [["좁은 미간", "한 곳을 파는 집중력"], ["알맞은 미간", "안정된 마음"], ["넓은 미간", "너그러운 마음"]][st("gap")];
  const nose = [["곧고 날렵한 코", "깔끔한 재물 관리"], ["반듯한 코", "꾸준히 쌓이는 재물"], ["넉넉한 콧방울", "재물 그릇이 큼"]][st("nose")];
  const mouthWord = ["작은 입", "단정한 입", "큰 입"][st("mouth")];
  const lipWord = ["얇은 입술", "", "도톰한 입술"][st("lip")];
  const mouthNote = st("lip") === 2 ? "정이 많음" : st("lip") === 0 ? "말이 정확함" : st("mouth") === 2 ? "통이 크고 앞장섬" : "말을 아끼는 신중함";
  const philtrum = [["짧은 인중", "빠른 실행력"], ["알맞은 인중", "건강한 기운"], ["긴 인중", "끈기와 장수"]][st("philtrum")];
  const jaw = [["갸름한 턱", "섬세한 감각"], ["둥근 턱", "말년이 안정됨"], ["모난 턱", "끈기와 책임감"]][st("jaw")];
  return [
    { anchor: 151, side: "L", title: forehead[0], note: forehead[1] },
    { anchor: 33, side: "L", title: eye[0], note: eye[1] },
    { anchor: 61, side: "L", title: lipWord ? `${mouthWord} · ${lipWord}` : mouthWord, note: mouthNote },
    { anchor: 164, side: "L", title: philtrum[0], note: philtrum[1] },
    { anchor: 334, side: "R", title: brow[0], note: brow[1] },
    { anchor: 168, side: "R", title: gap[0], note: gap[1] },
    { anchor: 294, side: "R", title: nose[0], note: nose[1] },
    { anchor: 377, side: "R", title: jaw[0], note: jaw[1] },
  ];
}

export function chartSummary(m: Metrics): { trait: string[]; luck: string[] } {
  const notes = chartNotes(m);
  const pick = (a: number) => notes.find((n) => n.anchor === a)!.note;
  const d = thirdDev(m);
  const word = (dev: number) => ["차분히 다져 감", "꾸준히 쌓여 감", "크게 피어남"][thirdStep(dev)];
  return {
    trait: [pick(33), pick(334), pick(377)],
    luck: (Object.keys(THIRD_NAME) as Third[]).map((t) => `${THIRD_NAME[t].age} — ${word(d[t])}`),
  };
}

// How closely a painting's face keeps the sitter's proportions, 0–100: the mean relative difference of the measures
// that make a face recognisable (eye openness is left out: painters may brighten eyes without changing the person).
export function likeness(painted: Metrics, real: Metrics): number {
  const keys = ["ratio", "jaw", "gap", "nose", "mouth", "brow", "philtrum"] as const;
  const diff = keys.reduce((s, k) => s + Math.abs(painted[k] - real[k]) / Math.abs(real[k]), 0) / keys.length;
  return Math.round(100 * Math.max(0, 1 - diff * 2.5));
}
