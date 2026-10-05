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

// Each measure's cut-offs, low then high: below the first reads one way, above the second the other.
// Tuned on a handful of faces; meant to be revised against real captures.
export const BANDS: Record<Exclude<keyof Metrics, "upper" | "middle" | "lower">, { label: string; cut: [number, number]; words: [string, string, string] }> = {
  ratio: { label: "얼굴 세로/가로", cut: [1.08, 1.3], words: ["넓은 편", "보통", "긴 편"] },
  jaw: { label: "턱 너비/광대 너비", cut: [0.72, 0.82], words: ["갸름", "보통", "각진 편"] },
  tilt: { label: "눈꼬리 기울기", cut: [-1, 4], words: ["처짐", "수평", "올라감"] },
  open: { label: "눈 뜬 정도", cut: [0.26, 0.36], words: ["가는 눈", "보통", "큰 눈"] },
  gap: { label: "미간/눈 너비", cut: [0.9, 1.15], words: ["좁음", "눈 하나", "넓음"] },
  nose: { label: "콧방울/미간", cut: [0.95, 1.15], words: ["좁은 코", "보통", "넓은 코"] },
  mouth: { label: "입/콧방울", cut: [1.25, 1.5], words: ["작은 입", "보통", "큰 입"] },
  lip: { label: "입술 두께/입 너비", cut: [0.25, 0.38], words: ["얇음", "보통", "도톰"] },
  brow: { label: "눈썹-눈 간격", cut: [0.45, 0.62], words: ["가까움", "보통", "넓음"] },
  philtrum: { label: "인중/하정", cut: [0.26, 0.36], words: ["짧은 인중", "보통", "긴 인중"] },
};
export type BandKey = keyof typeof BANDS;

// 0, 1 or 2 for a measure, and whether it sits within 4% of a cut-off (a reading a retake could tip either way).
export function band(key: BandKey, v: number): { step: 0 | 1 | 2; near: boolean } {
  const [lo, hi] = BANDS[key].cut;
  const near = [lo, hi].some((c) => Math.abs(v - c) <= Math.max(Math.abs(c) * 0.04, key === "tilt" ? 0.8 : 0));
  return { step: v < lo ? 0 : v > hi ? 2 : 1, near };
}

// A measure's word. On the edge between two words it names both ("보통·긴 편"), the same way from either side,
// so a retake that lands a hair across the line still reads the same.
export function wordOf(key: BandKey, v: number): string {
  const { words, cut } = BANDS[key];
  const margin = (c: number) => Math.max(Math.abs(c) * 0.04, key === "tilt" ? 0.8 : 0);
  if (Math.abs(v - cut[0]) <= margin(cut[0])) return `${words[0]}·${words[1]}`;
  if (Math.abs(v - cut[1]) <= margin(cut[1])) return `${words[1]}·${words[2]}`;
  return words[band(key, v).step];
}

export type Hyeong = { el: "木" | "火" | "土" | "金" | "水"; name: string; look: string };
const HYEONG: Record<Hyeong["el"], Hyeong> = {
  木: { el: "木", name: "목형", look: "길고 곧은 얼굴" },
  火: { el: "火", name: "화형", look: "위가 넓고 턱이 뾰족한 얼굴" },
  土: { el: "土", name: "토형", look: "넓고 두터운 얼굴" },
  金: { el: "金", name: "금형", look: "각지고 반듯한 얼굴" },
  水: { el: "水", name: "수형", look: "둥글고 부드러운 얼굴" },
};
function hyeongAt(ratio: number, jaw: number): Hyeong["el"] {
  if (ratio >= 1.3) return "木";
  if (jaw >= 0.82) return ratio < 1.12 ? "土" : "金";
  if (jaw < 0.72) return "火";
  return "水";
}
// The face's 오행 type, and the type a nudge of the measures would give instead (겸형) when it sits on an edge.
// `label` names both in a fixed order (목·화·토·금·수), so either side of the edge reads the same.
export function hyeong(m: Metrics): { main: Hyeong; mixed: Hyeong | null; label: string } {
  const main = hyeongAt(m.ratio, m.jaw);
  const nudges: [number, number][] = [[0.045, 0], [-0.045, 0], [0, 0.03], [0, -0.03]];
  const other = nudges.map(([a, b]) => hyeongAt(m.ratio + a, m.jaw + b)).find((e) => e !== main);
  const order = "木火土金水";
  const both = other ? [main, other].sort((a, b) => order.indexOf(a) - order.indexOf(b)) : [main];
  const label = both.map((e) => HYEONG[e].name.slice(0, 1)).join("·") + "형";
  return { main: HYEONG[main], mixed: other ? HYEONG[other] : null, label };
}

// 용모파기: the Joseon way of describing a wanted person's looks, written from the measures.
export function yongmo(m: Metrics): string[] {
  const s = (k: BandKey) => band(k, m[k]).step;
  const top = Math.max(m.upper, m.middle, m.lower);
  const lines = [
    m.upper === top ? "이마가 넓고 훤하며" : m.middle === top ? "콧대가 길게 뻗어 얼굴 가운데가 길고" : "턱 아래가 길고 두툼하며",
    ["얼굴이 넓적한 편이고", "얼굴은 길지도 넓지도 않고", "얼굴이 길쭉한 편이고"][s("ratio")],
    ["턱끝이 뾰족하다.", "턱은 둥글다.", "턱이 모가 났다."][s("jaw")],
    ["눈꼬리가 아래로 처졌고", "눈매가 반듯하고", "눈꼬리가 위로 치켜 올라갔고"][s("tilt")],
    ["눈이 가늘고 길며", "눈은 크지도 작지도 않으며", "눈이 크고 또렷하며"][s("open")],
    ["미간이 좁다.", "미간은 눈 하나가 들어갈 만하다.", "미간이 시원하게 넓다."][s("gap")],
    ["콧방울이 작고", "코는 반듯하고", "콧방울이 넉넉하고"][s("nose")],
    ["입이 작으며", "입은 알맞으며", "입이 크며"][s("mouth")],
    ["입술이 얇다.", "입술은 보통이다.", "입술이 도톰하다."][s("lip")],
    ["인중이 짧다.", "", "인중이 길다."][s("philtrum")],
  ];
  return lines.filter(Boolean);
}

// A bounty between 10 and 99 냥, from the face's words rather than its raw numbers, so a retake that reads the
// same face the same way names the same price.
export function bounty(m: Metrics): number {
  const steps = (Object.keys(BANDS) as BandKey[]).map((k) => band(k, m[k]).step);
  const h = steps.reduce((a, s) => (a * 31 + s + 7) % 100003, 17);
  return 10 + (h % 90);
}

// 관상 도식: the notes written around the portrait, each pinned to a face point, and the two boxes under it.
// The point numbers are MediaPipe's; `side` is the side of the picture the note sits on.
export type ChartNote = { anchor: number; side: "L" | "R"; title: string; note: string };

export function chartNotes(m: Metrics): ChartNote[] {
  const st = (k: BandKey) => band(k, m[k]).step;
  const forehead =
    m.upper >= 0.26 ? ["넓고 훤한 이마", "초년운이 밝음"] : m.upper <= 0.2 ? ["아담한 이마", "스스로 일어서는 초년"] : ["반듯한 이마", "무난한 초년"];
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
  const thirds: [string, number][] = [["초년", m.upper], ["중년", m.middle], ["말년", m.lower]];
  const rank = [...thirds].sort((a, b) => b[1] - a[1]).map((t) => t[0]);
  const word = (t: string) => ["가장 크게 피어남", "꾸준히 쌓여 감", "차분히 다져 감"][rank.indexOf(t)];
  return {
    trait: [pick(33), pick(334), pick(377)],
    luck: thirds.map(([t]) => `${t} — ${word(t)}`),
  };
}
