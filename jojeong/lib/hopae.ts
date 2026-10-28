import { BRANCHES, STEMS } from "./saju";
import type { Rank } from "./sinbun";

// 조선 신분 감정's result drawn as a 호패, the way the real ones were made: per 『호패사목』(1677) ivory (아패) for
// the high, horn (각패) below them, boxwood (황양목패) for 생원·진사, plain wood for the rest. The rank shows in the
// material, never written on the tag. The front carries, as the real tags do, a line across the head (here the
// office), the name column (here the job), the birth year (○○生) and a second small column (the year of this
// 감정); the back the year it was issued and a burnt brand. Drawn as SVG (grain, stains and worn carving from
// noise), so nothing is copied from a museum photograph.

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

type Material = { name: string; hanja: string; base: [string, string, string]; ink: string; light: boolean; grain: number; grainA: number; stain: number; cord: "silk" | "rope" | "hemp" };

export const MATERIAL: Record<Rank, Material> = {
  양반: { name: "아패", hanja: "牙牌", base: ["#f4ecd6", "#e6d5ae", "#d5bf8f"], ink: "#a8261c", light: false, grain: 0.012, grainA: 0.1, stain: 0.18, cord: "silk" },
  중인: { name: "각패", hanja: "角牌", base: ["#3a2d26", "#211813", "#2b201a"], ink: "#d9c8a4", light: true, grain: 0.02, grainA: 0.18, stain: 0.25, cord: "rope" },
  상민: { name: "황양목패", hanja: "黃楊木牌", base: ["#e3b56f", "#cd9450", "#b77d3c"], ink: "#1d1006", light: false, grain: 0.006, grainA: 0.35, stain: 0.4, cord: "hemp" },
  천민: { name: "목패", hanja: "木牌", base: ["#a8703f", "#8c562b", "#6f4320"], ink: "#190b03", light: false, grain: 0.005, grainA: 0.5, stain: 0.55, cord: "hemp" },
};

const ganji = (stem: number, branch: number) => STEMS[stem] + BRANCHES[branch];
// This year's 간지 in Korea (a plain calendar year; the 감정 is dated, not a chart).
export function yearGanji(now = new Date()): string {
  const y = new Date(now.getTime() + 9 * 3600_000).getUTCFullYear();
  return ganji((((y - 4) % 10) + 10) % 10, (((y - 4) % 12) + 12) % 12);
}
// The 띠 year of a chart: its year pillar, or the branch alone for a chart without the year stem.
export const bornOf = (yearStem: number | undefined, yearBranch: number) => (yearStem === undefined ? BRANCHES[yearBranch] : ganji(yearStem, yearBranch)) + "生";

// A small seeded random, so one life always draws the same tag.
function rng(key: string) {
  let s = 7;
  for (const c of key) s = (s * 31 + c.charCodeAt(0)) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export type HopaeInput = { rank: Rank; job: string; office?: string; born: string; issued: string };

// One face of the tag as an SVG string (270 × 620). `id` keeps filter ids apart when several tags share a page.
export function hopaeSvg(h: HopaeInput, id: string, back = false): string {
  const o = MATERIAL[h.rank];
  const R = rng(h.job + h.rank);
  const W = 270,
    H = 620,
    pw = 124,
    ph = 440,
    x0 = (W - pw) / 2,
    y0 = 150;
  const ch = 10 + R() * 8;
  const chip = () => +(R() * 2.2).toFixed(1);
  const path = `M${x0 + ch},${y0} L${x0 + pw - ch},${y0} L${x0 + pw},${y0 + ch * 1.4} L${x0 + pw - chip()},${y0 + ph * 0.5} L${x0 + pw},${y0 + ph - 6} Q${x0 + pw},${y0 + ph} ${x0 + pw - 6},${y0 + ph} L${x0 + 6},${y0 + ph} Q${x0},${y0 + ph} ${x0},${y0 + ph - 6} L${(x0 + chip()).toFixed(1)},${y0 + ph * 0.45} L${x0},${y0 + ch * 1.4} Z`;
  const n = (k: number) => `${id}${back ? "b" : "f"}${k}`;
  const font = "font-family:var(--font-myeongjo),serif";
  const T = (t: string, x: number, y: number, size: number, w = 800) =>
    `<text x="${x}" y="${y}" style="${font}" font-weight="${w}" font-size="${size}" text-anchor="middle" fill="${o.ink}">${t}</text>`;
  const hx = W / 2,
    hy = y0 + 22;

  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" style="overflow:visible;display:block;width:100%;height:auto">
<defs>
<linearGradient id="${n(1)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.base[0]}"/><stop offset=".6" stop-color="${o.base[1]}"/><stop offset="1" stop-color="${o.base[2]}"/></linearGradient>
<linearGradient id="${n(2)}" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset=".08" stop-color="#fff" stop-opacity=".12"/><stop offset=".2" stop-color="#000" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset=".94" stop-color="#000" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>
<filter id="${n(3)}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${o.grain * 6} ${o.grain * 60 + 0.2}" numOctaves="4" seed="3"/><feColorMatrix values="0 0 0 0 .2  0 0 0 0 .1  0 0 0 0 .03  0 0 0 ${o.grainA * 3} -${o.grainA}"/></filter>
<filter id="${n(4)}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="${Math.floor(R() * 50)}"/><feColorMatrix values="0 0 0 0 .15  0 0 0 0 .07  0 0 0 0 .02  0 0 0 ${o.stain * 2.4} -${o.stain * 1.1}"/></filter>
<filter id="${n(5)}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="9"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.6 1.05"/></filter>
<filter id="${n(6)}"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="4" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="${h.rank === "양반" ? 1.2 : 2.4}"/></filter>
<filter id="${n(7)}" x="-50%" y="-20%" width="200%" height="150%"><feGaussianBlur stdDeviation="10"/></filter>
<clipPath id="${n(8)}"><path d="${path}"/></clipPath>
</defs>
<path d="${path}" transform="translate(10,16)" fill="#000" opacity=".5" filter="url(#${n(7)})"/>
<g clip-path="url(#${n(8)})"><rect width="${W}" height="${H}" fill="url(#${n(1)})"/>
<rect width="${W}" height="${H}" filter="url(#${n(3)})"/><rect width="${W}" height="${H}" filter="url(#${n(4)})"/>
<rect width="${W}" height="${H}" filter="url(#${n(5)})" opacity="${o.light ? 0.05 : 0.08}"/>
<rect x="${x0}" y="${y0}" width="${pw}" height="${ph}" fill="url(#${n(2)})"/><rect x="${x0}" y="${y0}" width="${pw}" height="2" fill="#fff" opacity=".25"/>
<circle cx="${hx}" cy="${hy}" r="6.5" fill="#120c08"/>`;

  let ink = "";
  if (!back) {
    const [a, b] = [...(h.office ?? "訓導")];
    ink += T(a, hx - 26, y0 + 30, 15, 700) + T(b, hx + 26, y0 + 30, 15, 700);
    const chars = [...h.job.replace(/\s/g, "")];
    const big = chars.length > 6 ? 28 : chars.length > 5 ? 32 : 36;
    const step = big + 6;
    const sy = y0 + 44 + (ph - 44 - chars.length * step) / 2 + big * 0.85;
    chars.forEach((c, k) => (ink += T(c, hx, sy + k * step, big, 900)));
    const side = [...h.born];
    const low = [...(h.issued + "鑑定")];
    const sideY = sy + (chars.length - 1) * step - (low.length - 1) * 22;
    side.forEach((c, k) => (ink += T(c, hx + 38, sideY + (low.length - side.length + k) * 22, 16, 700)));
    low.forEach((c, k) => (ink += T(c, hx - 38, sideY + k * 22, 16, 700)));
  } else {
    const [a, b] = [...h.issued];
    ink += T(a, hx, y0 + 110, 34, 900) + T(b, hx, y0 + 152, 34, 900);
  }
  s += `<g filter="url(#${n(6)})">${o.light ? `<g transform="translate(0,-1)" opacity=".6">${ink.replaceAll(o.ink, "#000")}</g>` : ""}${ink}</g>`;
  s += `<rect width="${W}" height="${H}" filter="url(#${n(5)})" opacity=".1"/>`;
  if (back) {
    const bx = hx - 34,
      by = y0 + ph - 150;
    s += `<ellipse cx="${hx}" cy="${by + 34}" rx="52" ry="50" fill="#3a1906" opacity=".18" filter="url(#${n(7)})"/>
<g opacity=".85" filter="url(#${n(6)})"><rect x="${bx}" y="${by}" width="68" height="68" fill="#2a1104" fill-opacity=".25" stroke="#1a0a02" stroke-width="5" rx="3"/>
<text x="${hx}" y="${by + 31}" style="${font}" font-weight="900" font-size="22" text-anchor="middle" fill="#1a0a02">訓導</text><text x="${hx}" y="${by + 56}" style="${font}" font-weight="900" font-size="22" text-anchor="middle" fill="#1a0a02">之印</text></g>`;
  }
  s += `</g>`;

  if (o.cord === "silk") {
    // A silk loop through the hole, a wooden bead, and one small tassel hanging beside.
    let t = "";
    const cx = hx - 66,
      top = y0 + 30;
    for (let k = 0; k < 34; k++) {
      const dx = (k - 16.5) * 0.62;
      t += `<path d="M${cx + dx * 0.5},${top} L${(cx + dx + (R() - 0.5) * 1.2).toFixed(1)},${(top + 96 + R() * 6).toFixed(1)}" stroke="${["#9d9670", "#b8b28b", "#857f5b"][k % 3]}" stroke-width="1.1"/>`;
    }
    s += `<path d="M${hx - 6},${hy} C${hx - 40},${y0 - 60} ${hx - 20},${y0 - 130} ${hx},${y0 - 140} C${hx + 20},${y0 - 130} ${hx + 40},${y0 - 60} ${hx + 6},${hy}" stroke="#b8b088" stroke-width="3.2" fill="none"/>
<path d="M${hx - 10},${y0 - 30} C${hx - 40},${y0 - 20} ${hx - 62},${y0 - 6} ${cx},${y0 + 14}" stroke="#a69f78" stroke-width="2.4" fill="none"/>
<path d="M${cx - 6},${y0 + 12} q6,-6 12,0 l1,18 h-14 z" fill="#8f875f"/>${t}<rect x="${cx - 8}" y="${top - 4}" width="16" height="8" rx="2" fill="#6e2a1f"/>
<ellipse cx="${hx}" cy="${y0 - 36}" rx="17" ry="15" fill="#3b2216"/><ellipse cx="${hx - 5}" cy="${y0 - 41}" rx="6" ry="4" fill="#fff" opacity=".18"/>`;
  } else {
    const col = o.cord === "rope" ? ["#c9b48e", "#a38d68"] : ["#9d7d55", "#7a5c38"];
    const top = y0 - 150,
      len = 150;
    s += `<rect x="${hx - 4.5}" y="${top}" width="9" height="${len - 8}" rx="4" fill="${col[1]}"/>`;
    for (let k = 0; k < 26; k++) {
      const yy = top + (k * len) / 26;
      s += `<path d="M${hx - 4},${yy} C${hx - 1},${yy + 2} ${hx + 2},${yy + 5} ${hx + 4},${yy + 7}" stroke="${col[k % 2]}" stroke-width="4.2" stroke-linecap="round" fill="none"/>`;
    }
    s += `<path d="M${hx - 5},${y0 - 6} q-8,-14 0,-22 q12,-6 14,8 q-2,14 -9,14" stroke="${col[0]}" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M${hx + 4},${y0 - 4} l9,26 M${hx + 2},${y0 - 2} l15,20" stroke="${col[1]}" stroke-width="2" opacity=".8"/><path d="M${hx - 3},${y0 + 2} L${hx - 3},${hy - 4}" stroke="${col[0]}" stroke-width="5"/>`;
  }
  return s + `</svg>`;
}
