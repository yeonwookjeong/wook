import { BRANCHES, STEMS } from "./saju";
import type { Rank } from "./sinbun";

// 조선 신분 감정's result drawn as a 호패, the way the real ones were made: per 『호패사목』(1677) ivory (아패) for
// the high, horn (각패) below them, boxwood (황양목패) for 생원·진사, plain wood for the rest. The rank shows in the
// material, never written on the tag. The front carries, as the real tags do, a line across the head (here the
// office), the name column (here the job), the birth year (○○生) and a second small column (the year of this
// 감정); the back the year it was issued and a burnt brand. The tags are pictures made for us (no museum photo);
// the letters are carved over them in SVG.

// Two characters across the head, from the base life's office (lib/sinbun.ts, lib/sinbunF.ts).
export const OFFICE: Record<string, string> = {
  "홍문관 교리": "弘文",
  "시골 서당 훈장": "書堂",
  "사헌부 감찰": "憲府",
  "관상감 명과학 훈도": "觀象",
  "사역원 역관": "譯院",
  보부상: "褓負",
  "도화서 화원": "圖畫",
  "남사당패 광대": "才人",
  "훈련도감 무관": "訓局",
  "포도청 포졸": "捕廳",
  "운종가 주막 주인": "酒幕",
  "내의원 의관": "內醫",
  "규장각 검서관": "奎章",
  "산사의 학승": "山寺",
  "고을 관아의 관노": "官衙",
  "호조 정랑": "戶曹",
  "대갓집 수노": "大家",
  "예문관 사관": "藝文",
  "종로 전기수": "傳奇",
  "무예청 별감": "武藝",
  "단오 씨름판 장사": "角力",
  "조운선 사공": "漕運",
  "고을 현감": "縣監",
  "수라간 숙수": "水剌",
  "규방 문장가": "閨房",
  "서사 상궁": "尙宮",
  "언문 대필 선생": "諺文",
  "산사의 비구니": "山寺",
  "종가 종부": "宗家",
  "감찰 상궁": "監察",
  "포도청 다모": "捕廳",
  "관아 관비": "官衙",
  "대갓집 안방마님": "大家",
  "역관 댁 무역 안주인": "譯官",
  방물장수: "方物",
  "대갓집 찬모": "廚房",
  "규방 화가": "丹靑",
  "침방 나인": "針房",
  "판소리 소리꾼": "名唱",
  "교방 가야금 기생": "敎坊",
  "의병장 댁 안주인": "義兵",
  "포구 객주 여주인": "客主",
  "해녀 상군": "海女",
  "나루터 뱃사공": "渡船",
  "현감 댁 안주인": "縣監",
  "혜민서 의녀": "惠民",
  "장터 주막 주모": "酒幕",
  "수라간 나인": "水剌",
};

// The four tags (public/hopae/*.webp, 510 × 1000, drawn for us, background cut). `face`: the flat front of the tag
// in that picture (left, right, top, bottom), where the carving goes. The back is the same picture mirrored.
type Material = { name: string; hanja: string; file: string; face: [number, number, number, number]; ink: string; shade: string; lit: string };

export const MATERIAL: Record<Rank, Material> = {
  양반: { name: "아패", hanja: "牙牌", file: "/hopae/a.webp", face: [156, 352, 238, 941], ink: "#9a1a12", shade: "#2a1608", lit: "#fff6e0" },
  중인: { name: "각패", hanja: "角牌", file: "/hopae/g.webp", face: [160, 346, 240, 928], ink: "#cfbd99", shade: "#000000", lit: "#5a4636" },
  상민: { name: "황양목패", hanja: "黃楊木牌", file: "/hopae/y.webp", face: [148, 360, 232, 904], ink: "#3a2410", shade: "#2a1608", lit: "#fff1cf" },
  천민: { name: "목패", hanja: "木牌", file: "/hopae/m.webp", face: [151, 362, 278, 943], ink: "#24140a", shade: "#1a0c04", lit: "#e8c99a" },
};

const ganji = (stem: number, branch: number) => STEMS[stem] + BRANCHES[branch];
// This year's 간지 in Korea (a plain calendar year; the 감정 is dated, not a chart).
export function yearGanji(now = new Date()): string {
  const y = new Date(now.getTime() + 9 * 3600_000).getUTCFullYear();
  return ganji((((y - 4) % 10) + 10) % 10, (((y - 4) % 12) + 12) % 12);
}
// The 띠 year of a chart: its year pillar, or the branch alone for a chart without the year stem.
export const bornOf = (yearStem: number | undefined, yearBranch: number) => (yearStem === undefined ? BRANCHES[yearBranch] : ganji(yearStem, yearBranch)) + "生";

export type HopaeInput = { rank: Rank; job: string; office?: string; born: string; issued: string };

export const HOPAE_W = 510;
export const HOPAE_H = 1000;

// The carving for one face, as an SVG laid over the picture (same 510 × 1000 box). Letters are cut in: a dark
// wall on the upper left of each stroke, a lit wall on the lower right, the groove filled with ink (red 주사 on
// ivory, pale on horn, 먹 on wood). `id` keeps filter ids apart when several tags share a page.
export function carvingSvg(h: HopaeInput, id: string, back = false): string {
  const m = MATERIAL[h.rank];
  const [fl, fr, top, bottom] = m.face;
  const [l, r] = back ? [HOPAE_W - fr, HOPAE_W - fl] : [fl, fr];
  const cx = (l + r) / 2;
  const w = r - l;
  const f = `${id}${back ? "b" : "f"}`;
  const T = (t: string, x: number, y: number, size: number) =>
    `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" text-anchor="middle">${t}</text>`;

  let t = "";
  if (!back) {
    const [a, b] = [...(h.office ?? "訓導")];
    t += T(a, cx - w * 0.2, top + 30, 23) + T(b, cx + w * 0.2, top + 30, 23);
    const chars = [...h.job.replace(/\s/g, "")];
    const room = bottom - top - 90;
    const big = Math.min(64, Math.floor(room / chars.length) - 10);
    const step = big + 10;
    const sy = top + 60 + (room - chars.length * step) / 2 + big * 0.85;
    chars.forEach((c, k) => (t += T(c, cx, sy + k * step, big)));
    const side = [...h.born];
    const low = [...(h.issued + "鑑定")];
    const ly = sy + (chars.length - 1) * step - (low.length - 1) * 31;
    side.forEach((c, k) => (t += T(c, cx + w * 0.33, ly + (low.length - side.length + k) * 31, 27)));
    low.forEach((c, k) => (t += T(c, cx - w * 0.33, ly + k * 31, 27)));
  } else {
    const [a, b] = [...h.issued];
    t += T(a, cx, top + 120, 60) + T(b, cx, top + 190, 60);
    // The burnt brand of the office that issued it.
    const by = bottom - 190;
    t += `<rect x="${cx - 48}" y="${by}" width="96" height="96" rx="4" fill="none" stroke="#000" stroke-width="8"/>` + T("訓導", cx, by + 43, 30) + T("之印", cx, by + 80, 30);
  }

  const ink = back ? "#2a1104" : m.ink;
  return `<svg viewBox="0 0 ${HOPAE_W} ${HOPAE_H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%">
<defs><filter id="${f}" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="3" result="nz"/>
<feMorphology in="SourceAlpha" operator="dilate" radius=".55" result="D"/><feDisplacementMap in="D" in2="nz" scale="${back ? 2.5 : 0.9}" result="A"/>
<feOffset in="A" dx="1.6" dy="1.8" result="Ao"/><feComposite in="A" in2="Ao" operator="out" result="e1"/><feGaussianBlur in="e1" stdDeviation=".7" result="e1b"/>
<feFlood flood-color="${m.shade}" flood-opacity=".85"/><feComposite in2="e1b" operator="in" result="shade"/>
<feOffset in="A" dx="-1.2" dy="-1.2" result="Ai"/><feComposite in="A" in2="Ai" operator="out" result="e2"/><feGaussianBlur in="e2" stdDeviation=".6" result="e2b"/>
<feFlood flood-color="${m.lit}" flood-opacity=".55"/><feComposite in2="e2b" operator="in" result="lit"/>
<feFlood flood-color="${ink}" flood-opacity="${back ? 0.8 : 1}"/><feComposite in2="A" operator="in" result="fill"/>
<feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="1" seed="7" result="wn"/><feColorMatrix in="wn" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.7 1.25" result="wear"/>
<feComposite in="fill" in2="wear" operator="in" result="fw"/>
<feMerge><feMergeNode in="fw"/><feMergeNode in="shade"/><feMergeNode in="lit"/></feMerge>
</filter></defs>
<g filter="url(#${f})" style="font-family:var(--font-myeongjo),serif;font-weight:900">${t}</g></svg>`;
}
