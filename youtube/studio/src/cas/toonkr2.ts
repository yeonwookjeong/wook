// 코노라마 캐릭터 2판 (모델 시트용 새 그림)
// 1판(toonkr.ts)의 약점: 동그라미+원통 조립, 목·코·귀 없음, 벙어리장갑, 모두 같은 얼굴.
// 2판 원칙: 사람마다 머리·얼굴형·키·체형이 다르다 / 목·어깨·팔꿈치·손가락이 있다 /
// 바깥선은 굵게, 안쪽 선(코·주름·옷 접힘)은 가늘게 / 빛은 왼쪽 위에서 하나, 오른쪽에 그림자 한 단계.
// 설계 공간 600 x 1000, 발바닥 y = 975, 몸 중심 x = 300.

export const INK2 = "#2a1c24";
type G = CanvasRenderingContext2D;
type P = [number, number];

export type HairStyle = "kidBob" | "momLong" | "dadShort" | "granPerm" | "bossSide";
export type Outfit = "tee" | "blouse" | "cardigan" | "suit" | "sweater";
export type Cast = {
  skin: string;
  hair: HairStyle;
  hairC: string;
  top: string;
  accent: string; // 옷의 두 번째 색 (깃, 안에 입은 옷, 넥타이)
  bottom: string;
  shoes: string;
  outfit: Outfit;
  skirt?: boolean;
  H: number; // 전체 키(px)
  headR: number; // 머리 반폭
  headH: number; // 머리 높이
  sw: number; // 어깨 반폭
  hw: number; // 엉덩이 반폭
  belly?: number; // 배 둥글기 0..1
  jaw: number; // 0 둥근 턱 .. 1 각진 턱
  glasses?: boolean;
  mustache?: boolean;
  wrinkles?: boolean;
  kid?: boolean;
  browW?: number; // 눈썹 굵기
};
export type Face = "smile" | "grin" | "open" | "o" | "smug" | "flat" | "sad" | "worried";
export type Pose2 = {
  armL?: number; // 어깨 각도(도): 0 아래, 90 옆으로
  armR?: number;
  bendL?: number; // 팔꿈치 굽힘(도): + 안쪽(몸 쪽)으로
  bendR?: number;
  face?: Face;
  brow?: number; // + 놀람, - 찡그림
  look?: number; // 눈동자 -1..1
  blink?: boolean;
  blush?: number;
  walk?: number;
};

// ------------------------------------------------------------------ 펜
const shade = (c: string, k: number) => {
  const n = parseInt(c.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
};
const OUT = 9; // 바깥선
const INNER = 5; // 안쪽 선

function ink(g: G, path: Path2D, fill: string, w = OUT) {
  g.fillStyle = fill;
  g.fill(path);
  if (w > 0) {
    g.lineWidth = w;
    g.strokeStyle = INK2;
    g.lineJoin = "round";
    g.lineCap = "round";
    g.stroke(path);
  }
}
function line(g: G, pts: P[], w = INNER, c = INK2, curve = true) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  if (curve && pts.length === 3) g.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]);
  else if (curve && pts.length === 4) g.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]);
  else pts.slice(1).forEach(([x, y]) => g.lineTo(x, y));
  g.lineWidth = w;
  g.strokeStyle = c;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.stroke();
}
/** 그림자 한 단계: path 안쪽에서, 오른쪽(빛 반대편)에 띠를 칠함 */
function shadeRight(g: G, path: Path2D, c: string, x0: number, k = 0.86) {
  g.save();
  g.clip(path);
  g.fillStyle = shade(c, k);
  g.beginPath();
  g.moveTo(x0, -10);
  g.bezierCurveTo(x0 - 30, 300, x0 + 20, 700, x0 - 10, 1010);
  g.lineTo(700, 1010);
  g.lineTo(700, -10);
  g.closePath();
  g.fill();
  g.restore();
}
const mirror = (pts: P[]): P[] => pts.map(([x, y]) => [600 - x, y] as P);

// ------------------------------------------------------------------ 몸 치수
type Frame = { top: number; cy: number; chin: number; shY: number; hipY: number; footY: number };
function frameOf(C: Cast): Frame {
  const footY = 975;
  const top = footY - C.H;
  const cy = top + C.headH * 0.5;
  const chin = top + C.headH;
  const neck = C.kid ? 10 : 26;
  const shY = chin + neck;
  const legLen = C.kid ? C.H * 0.24 : C.H * 0.32;
  const hipY = footY - legLen;
  return { top, cy, chin, shY, hipY, footY };
}

// ------------------------------------------------------------------ 머리카락
function hairBack(g: G, C: Cast, F: Frame) {
  const r = C.headR, cy = F.cy, hh = C.headH;
  const p = new Path2D();
  if (C.hair === "kidBob") {
    p.moveTo(300 - r - 22, cy);
    p.bezierCurveTo(300 - r - 30, cy - hh * 0.62, 300 + r + 30, cy - hh * 0.62, 300 + r + 22, cy);
    p.bezierCurveTo(300 + r + 26, cy + hh * 0.3, 300 + r + 10, cy + hh * 0.5, 300 + r - 26, cy + hh * 0.5);
    p.lineTo(300 - r + 26, cy + hh * 0.5);
    p.bezierCurveTo(300 - r - 10, cy + hh * 0.5, 300 - r - 26, cy + hh * 0.3, 300 - r - 22, cy);
  } else if (C.hair === "momLong") {
    const end = F.shY + 150;
    p.moveTo(300 - r - 18, cy - 10);
    p.bezierCurveTo(300 - r - 26, cy - hh * 0.66, 300 + r + 26, cy - hh * 0.66, 300 + r + 18, cy - 10);
    p.bezierCurveTo(300 + r + 30, cy + hh * 0.4, 300 + r + 46, end - 70, 300 + r + 30, end);
    p.bezierCurveTo(300 + r + 10, end + 26, 300 + r - 20, end + 4, 300 + r - 34, end - 18);
    p.bezierCurveTo(300 + r - 50, F.shY + 40, 300 + 60, F.chin + 20, 300, F.chin);
    p.bezierCurveTo(300 - 60, F.chin + 20, 300 - r + 50, F.shY + 40, 300 - r + 34, end - 18);
    p.bezierCurveTo(300 - r + 20, end + 4, 300 - r - 10, end + 26, 300 - r - 30, end);
    p.bezierCurveTo(300 - r - 46, end - 70, 300 - r - 30, cy + hh * 0.4, 300 - r - 18, cy - 10);
  } else if (C.hair === "granPerm") {
    // 뒤쪽 볼륨 (뽀글 파마)
    p.ellipse(300, cy - hh * 0.12, r + 34, hh * 0.52, 0, 0, Math.PI * 2);
  } else return;
  p.closePath();
  ink(g, p, C.hairC);
  shadeRight(g, p, C.hairC, 340, 0.8);
  g.lineWidth = OUT; g.strokeStyle = INK2; g.stroke(p);
}

function hairFront(g: G, C: Cast, F: Frame) {
  const r = C.headR, cy = F.cy, hh = C.headH;
  const hc = C.hairC;
  const p = new Path2D();
  if (C.hair === "kidBob") {
    // 앞머리: 이마를 덮는 일자 뱅인데 끝이 세 갈래로 살짝 갈라짐
    p.moveTo(300 - r - 16, cy + 6);
    p.bezierCurveTo(300 - r - 20, cy - hh * 0.6, 300 + r + 20, cy - hh * 0.6, 300 + r + 16, cy + 6);
    p.lineTo(300 + r - 6, cy - 10);
    p.quadraticCurveTo(300 + r * 0.6, cy - hh * 0.12, 300 + r * 0.36, cy - hh * 0.1);
    p.lineTo(300 + r * 0.22, cy - hh * 0.17);
    p.quadraticCurveTo(300, cy - hh * 0.1, 300 - r * 0.18, cy - hh * 0.09);
    p.lineTo(300 - r * 0.32, cy - hh * 0.16);
    p.quadraticCurveTo(300 - r * 0.62, cy - hh * 0.1, 300 - r + 6, cy - 10);
    p.closePath();
  } else if (C.hair === "momLong") {
    // 옆가르마 + 옆으로 넘긴 앞머리
    p.moveTo(300 - r - 12, cy + 10);
    p.bezierCurveTo(300 - r - 18, cy - hh * 0.62, 300 + r + 18, cy - hh * 0.62, 300 + r + 12, cy + 40);
    p.lineTo(300 + r - 12, cy + 30);
    p.bezierCurveTo(300 + r - 20, cy - hh * 0.18, 300 + r * 0.3, cy - hh * 0.26, 300 - r * 0.25, cy - hh * 0.3);
    p.bezierCurveTo(300 - r * 0.6, cy - hh * 0.26, 300 - r + 8, cy - hh * 0.12, 300 - r + 4, cy + 4);
    p.closePath();
  } else if (C.hair === "dadShort") {
    p.moveTo(300 - r - 6, cy + 4);
    p.bezierCurveTo(300 - r - 16, cy - hh * 0.66, 300 + r + 16, cy - hh * 0.66, 300 + r + 6, cy + 4);
    p.lineTo(300 + r - 8, cy + 14); // 구레나룻
    p.lineTo(300 + r - 14, cy - hh * 0.14);
    p.bezierCurveTo(300 + r * 0.4, cy - hh * 0.32, 300 - r * 0.1, cy - hh * 0.24, 300 - r * 0.2, cy - hh * 0.3); // 가르마 쪽으로 넘긴 앞머리
    p.bezierCurveTo(300 - r * 0.5, cy - hh * 0.24, 300 - r + 14, cy - hh * 0.2, 300 - r + 8, cy + 14);
    p.closePath();
  } else if (C.hair === "granPerm") {
    // 정수리와 이마 위 뽀글 파마: 둥근 컬 여러 개
    const curls: [number, number, number][] = [];
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.05 + (i / 8) * 0.9);
      curls.push([300 + Math.cos(a) * (r + 8), cy - hh * 0.06 + Math.sin(a) * (hh * 0.5), 40]);
    }
    curls.push([300 - 40, cy - hh * 0.36, 34], [300 + 30, cy - hh * 0.38, 36], [300 - 90, cy - hh * 0.25, 30], [300 + 88, cy - hh * 0.25, 30]);
    // 원마다 선을 그으면 겹친 곳이 지저분해짐: 굵은 잉크로 전부 칠한 뒤 색을 위에 덮어 바깥 윤곽만 남김
    curls.forEach(([x, y, cr]) => { const q = new Path2D(); q.ellipse(x, y, cr, cr * 0.92, 0, 0, Math.PI * 2); g.lineWidth = OUT * 2; g.strokeStyle = INK2; g.stroke(q); p.addPath(q); });
    g.fillStyle = hc; g.fill(p);
    g.save(); g.clip(p); g.fillStyle = shade(hc, 0.86); g.fillRect(300 + r * 0.35, cy - hh, 300, hh); g.restore();
    // 컬 안쪽 소용돌이
    curls.forEach(([x, y, cr], i) => {
      if (i % 2) return;
      g.beginPath();
      g.arc(x + 4, y + 4, cr * 0.42, Math.PI * 1.0, Math.PI * 1.8);
      g.lineWidth = 3.5; g.strokeStyle = shade(hc, 0.82); g.stroke();
    });
    return;
  } else if (C.hair === "bossSide") {
    // 옆과 뒤에만 머리, 정수리는 빗어 넘긴 가는 머리 몇 가닥 + 희끗한 관자놀이
    const side = (sd: number) => {
      const q = new Path2D();
      q.moveTo(300 + sd * (r + 6), cy + 26);
      q.bezierCurveTo(300 + sd * (r + 16), cy - hh * 0.2, 300 + sd * (r - 10), cy - hh * 0.4, 300 + sd * (r * 0.45), cy - hh * 0.44);
      q.lineTo(300 + sd * (r * 0.5), cy - hh * 0.36);
      q.bezierCurveTo(300 + sd * (r - 22), cy - hh * 0.3, 300 + sd * (r - 8), cy - hh * 0.05, 300 + sd * (r - 8), cy + 26);
      q.closePath();
      ink(g, q, hc);
      g.save(); g.clip(q); g.fillStyle = "#b8b4b8"; g.fillRect(300 + (sd > 0 ? r - 26 : -r - 20), cy - 40, 46, 80); g.restore();
      g.lineWidth = OUT; g.strokeStyle = INK2; g.stroke(q);
    };
    side(-1); side(1);
    for (let i = 0; i < 4; i++) line(g, [[300 - r * 0.42 + i * 10, cy - hh * 0.4 - i * 3], [300 + i * 6, cy - hh * 0.52], [300 + r * 0.5 - i * 4, cy - hh * 0.42 + i * 2]], 5, hc);
    return;
  }
  ink(g, p, hc);
  // 머리결: 가는 선 두세 개 + 광택
  if (C.hair === "kidBob") {
    line(g, [[300 - r * 0.5, cy - hh * 0.4], [300 - r * 0.62, cy - hh * 0.25], [300 - r * 0.6, cy - hh * 0.14]], 4, shade(hc, 1.9));
  } else if (C.hair === "momLong") {
    line(g, [[300 - r * 0.25, cy - hh * 0.3], [300 + r * 0.3, cy - hh * 0.5], [300 + r * 0.8, cy - hh * 0.3]], 4, shade(hc, 0.65));
    line(g, [[300 - r * 0.5, cy - hh * 0.38], [300 - r * 0.35, cy - hh * 0.46], [300 - r * 0.1, cy - hh * 0.49]], 5, shade(hc, 1.6));
  } else if (C.hair === "dadShort") {
    line(g, [[300 - r * 0.2, cy - hh * 0.3], [300 - r * 0.1, cy - hh * 0.42], [300 - r * 0.15, cy - hh * 0.5]], 4, shade(hc, 2.2));
  }
}

// ------------------------------------------------------------------ 얼굴
function headShape(C: Cast, F: Frame) {
  const r = C.headR, cy = F.cy, hh = C.headH, j = C.jaw;
  const p = new Path2D();
  const half: P[] = [];
  p.moveTo(300, F.top + 4);
  p.bezierCurveTo(300 + r * 0.56, F.top + 4, 300 + r, cy - hh * 0.32, 300 + r, cy);
  p.bezierCurveTo(300 + r, cy + hh * (0.18 + j * 0.08), 300 + r * (0.62 + j * 0.3), cy + hh * 0.46, 300 + r * (0.2 + j * 0.16), cy + hh * 0.5);
  p.quadraticCurveTo(300, cy + hh * 0.52, 300 - r * (0.2 + j * 0.16), cy + hh * 0.5);
  p.bezierCurveTo(300 - r * (0.62 + j * 0.3), cy + hh * 0.46, 300 - r, cy + hh * (0.18 + j * 0.08), 300 - r, cy);
  p.bezierCurveTo(300 - r, cy - hh * 0.32, 300 - r * 0.56, F.top + 4, 300, F.top + 4);
  p.closePath();
  void half;
  return p;
}

function ears(g: G, C: Cast, F: Frame) {
  if (C.hair === "momLong") return;
  [-1, 1].forEach((sd) => {
    const x = 300 + sd * (C.headR - 2), y = F.cy + C.headH * 0.06;
    const p = new Path2D();
    p.ellipse(x + sd * 10, y, 20, 28, 0, 0, Math.PI * 2);
    ink(g, p, sd > 0 ? shade(C.skin, 0.9) : C.skin);
    line(g, [[x + sd * 14, y - 12], [x + sd * 2, y], [x + sd * 12, y + 12]], 4);
  });
}

function face(g: G, C: Cast, F: Frame, P: Pose2) {
  const r = C.headR, hh = C.headH, cy = F.cy;
  const ey = cy + hh * 0.08;
  const ex = r * (C.kid ? 0.4 : 0.36);
  const lk = (P.look ?? 0) * 7;
  const brow = P.brow ?? 0;
  // 볼
  g.globalAlpha = 0.3 + 0.4 * (P.blush ?? 0);
  g.fillStyle = "#ff8a8a";
  [-1, 1].forEach((sd) => { g.beginPath(); g.ellipse(300 + sd * r * 0.6, ey + hh * 0.17, 24, 15, 0, 0, Math.PI * 2); g.fill(); });
  g.globalAlpha = 1;
  // 눈
  [-1, 1].forEach((sd) => {
    const x = 300 + sd * ex;
    if (P.blink || P.face === "grin") {
      line(g, [[x - 16, ey + 4], [x, ey - 10], [x + 16, ey + 4]], 7);
    } else {
      const eh = C.kid ? 21 : 18, ew = C.kid ? 14 : 12;
      g.fillStyle = INK2;
      g.beginPath(); g.ellipse(x + lk, ey, ew, eh, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#ffffff";
      g.beginPath(); g.ellipse(x + lk - 4, ey - 7, 4.5, 5.5, 0, 0, Math.PI * 2); g.fill();
      if (!C.kid) line(g, [[x - 20, ey - eh - 2], [x, ey - eh - 9], [x + 18, ey - eh - 4]], 4); // 위 눈꺼풀
    }
    // 눈썹: 사람마다 굵기, 표정마다 각도
    const by = ey - (C.kid ? 40 : 44) - brow * 10;
    // 안쪽 끝(코 쪽)을 올리면 걱정, 내리면 단호
    const lift = (P.face === "sad" || P.face === "worried" ? 10 : P.face === "smug" ? -6 : 0);
    line(g, [[x - sd * 18, by - lift], [x, by - 6 - lift * 0.3], [x + sd * 18, by + 2]], C.browW ?? 7);
    if (C.wrinkles) line(g, [[x + sd * 26, ey + 2], [x + sd * 34, ey + 8], [x + sd * 32, ey + 16]], 3.5); // 눈가 주름
  });
  // 안경
  if (C.glasses) {
    g.lineWidth = 6; g.strokeStyle = "#3a2c34";
    [-1, 1].forEach((sd) => { g.beginPath(); g.roundRect(300 + sd * ex - 34, ey - 28, 68, 54, 18); g.stroke(); });
    line(g, [[300 - ex + 34, ey - 6], [300, ey - 12], [300 + ex - 34, ey - 6]], 5, "#3a2c34");
    g.globalAlpha = 0.25; g.fillStyle = "#ffffff";
    [-1, 1].forEach((sd) => { g.beginPath(); g.roundRect(300 + sd * ex - 26, ey - 22, 16, 12, 6); g.fill(); });
    g.globalAlpha = 1;
  }
  // 코: 어른은 ㄴ 모양 한 획, 아이는 작은 콧망울 점
  const ny = ey + hh * (C.kid ? 0.14 : 0.17);
  if (C.kid) { g.fillStyle = shade(C.skin, 0.72); g.beginPath(); g.ellipse(300, ny, 7, 5, 0, 0, Math.PI * 2); g.fill(); }
  else line(g, [[302, ny - 26], [296, ny], [312, ny + 2]], 4.5);
  // 콧수염
  if (C.mustache) {
    const m = new Path2D();
    m.moveTo(300, ny + 12);
    m.bezierCurveTo(280, ny + 6, 252, ny + 14, 256, ny + 30);
    m.bezierCurveTo(272, ny + 26, 288, ny + 28, 300, ny + 22);
    m.bezierCurveTo(312, ny + 28, 328, ny + 26, 344, ny + 30);
    m.bezierCurveTo(348, ny + 14, 320, ny + 6, 300, ny + 12);
    ink(g, m, C.hairC, 5);
  }
  // 입
  const my = ny + (C.mustache ? 52 : C.kid ? 34 : 40);
  const f = P.face ?? "smile";
  const mouth = new Path2D();
  if (f === "smile") line(g, [[282, my - 4], [300, my + 10], [318, my - 4]], 6);
  else if (f === "flat") line(g, [[286, my + 2], [314, my + 2]], 6, INK2, false);
  else if (f === "sad") line(g, [[284, my + 8], [300, my - 4], [316, my + 8]], 6);
  else if (f === "worried") line(g, [[282, my + 6], [292, my - 2], [306, my + 4], [318, my - 2]], 5.5);
  else if (f === "smug") line(g, [[282, my + 4], [300, my + 8], [320, my - 6]], 6);
  else {
    if (f === "grin") {
      mouth.moveTo(274, my - 6);
      mouth.bezierCurveTo(280, my + 34, 320, my + 34, 326, my - 6);
      mouth.quadraticCurveTo(300, my, 274, my - 6);
    } else if (f === "open") mouth.ellipse(300, my + 6, 18, 22, 0, 0, Math.PI * 2);
    else mouth.ellipse(300, my + 4, 9, 11, 0, 0, Math.PI * 2);
    ink(g, mouth, "#7a2a38", 5);
    g.save(); g.clip(mouth);
    if (f === "grin") { g.fillStyle = "#ffffff"; g.fillRect(270, my - 10, 60, 12); }
    g.fillStyle = "#e86e78"; g.beginPath(); g.ellipse(300, my + 26, 16, 10, 0, 0, Math.PI * 2); g.fill();
    g.restore();
    g.lineWidth = 5; g.strokeStyle = INK2; g.stroke(mouth);
  }
}

// ------------------------------------------------------------------ 팔·손·다리
function arm(g: G, C: Cast, F: Frame, sd: number, deg: number, bend: number, sleeveC: string, shortSleeve: boolean) {
  const sx = 300 + sd * (C.sw - 30), sy = F.shY + 52; // 어깨 관절은 몸통 안쪽 (소매가 어깨 위로 솟지 않게)
  const ua = C.kid ? 92 : 128, fa = C.kid ? 86 : 118;
  const a = (deg * Math.PI) / 180;
  const el: P = [sx + sd * Math.sin(a) * ua, sy + Math.cos(a) * ua];
  const b = ((deg - bend) * Math.PI) / 180;
  const wr: P = [el[0] + sd * Math.sin(b) * fa, el[1] + Math.cos(b) * fa];
  const w1 = C.kid ? 44 : 48, w2 = C.kid ? 38 : 40;
  const seg = (p0: P, p1: P, c: string, w: number) => {
    g.lineCap = "round";
    g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]);
    g.strokeStyle = INK2; g.lineWidth = w + OUT * 2; g.stroke();
    g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]);
    g.strokeStyle = c; g.lineWidth = w; g.stroke();
  };
  // 아랫팔 먼저(바깥선), 그다음 윗팔이 덮음
  seg(el, wr, shortSleeve ? C.skin : sleeveC, w2);
  seg([sx, sy], el, sleeveC, w1);
  if (shortSleeve) {
    // 소매 끝
    const mid: P = [sx + (el[0] - sx) * 0.62, sy + (el[1] - sy) * 0.62];
    seg([sx, sy], mid, sleeveC, w1 + 6);
    line(g, [[mid[0] - 24, mid[1] + 4], [mid[0], mid[1] + 10], [mid[0] + 24, mid[1] + 4]], 4);
  } else {
    // 팔꿈치 주름
    line(g, [[el[0] - sd * 10, el[1] - 6], [el[0] + sd * 4, el[1] + 2], [el[0] + sd * 14, el[1] - 2]], 4);
    // 소매 끝 커프
    const cf: P = [el[0] + (wr[0] - el[0]) * 0.88, el[1] + (wr[1] - el[1]) * 0.88];
    seg([el[0] + (wr[0] - el[0]) * 0.8, el[1] + (wr[1] - el[1]) * 0.8], cf, shade(sleeveC, 0.88), w2 + 4);
  }
  hand(g, C, wr, Math.atan2(wr[1] - el[1], wr[0] - el[0]), sd);
}

function hand(g: G, C: Cast, at: P, ang: number, sd: number) {
  const s = C.kid ? 0.85 : 1;
  g.save();
  g.translate(at[0], at[1]);
  g.rotate(ang - Math.PI / 2);
  g.scale(s, s);
  // 손바닥 + 네 손가락(둥근 끝) + 엄지
  const p = new Path2D();
  p.moveTo(-20, -6);
  p.bezierCurveTo(-26, 14, -24, 34, -16, 44);
  p.quadraticCurveTo(-12, 52, -6, 46);
  p.quadraticCurveTo(-2, 54, 4, 48);
  p.quadraticCurveTo(10, 54, 15, 45);
  p.quadraticCurveTo(22, 46, 22, 36);
  p.bezierCurveTo(24, 22, 22, 6, 18, -6);
  p.closePath();
  ink(g, p, C.skin, 7);
  // 손가락 사이 선
  [-6, 4].forEach((x) => line(g, [[x, 46], [x + 1, 34]], 3.5, INK2, false));
  // 엄지 (몸 바깥쪽 아닌 앞쪽으로)
  const t = new Path2D();
  t.ellipse(sd * -20, 14, 9, 17, sd * -0.5, 0, Math.PI * 2);
  ink(g, t, C.skin, 6);
  g.restore();
}

function legs(g: G, C: Cast, F: Frame, P: Pose2) {
  const gap = C.kid ? 34 : 42;
  const w = C.kid ? 46 : 54;
  [-1, 1].forEach((sd) => {
    const wk = P.walk !== undefined ? Math.sin(P.walk + (sd > 0 ? Math.PI : 0)) : 0;
    const hip: P = [300 + sd * gap, F.hipY - 10];
    const ankle: P = [300 + sd * (gap + 4) + wk * 36, F.footY - 34 - Math.max(0, wk) * 16];
    g.lineCap = "butt";
    g.beginPath(); g.moveTo(hip[0], hip[1]); g.lineTo(ankle[0], ankle[1]);
    g.strokeStyle = INK2; g.lineWidth = w + OUT * 2; g.stroke();
    g.beginPath(); g.moveTo(hip[0], hip[1]); g.lineTo(ankle[0], ankle[1]);
    g.strokeStyle = C.skirt ? C.skin : C.bottom; g.lineWidth = w; g.stroke();
    if (!C.skirt) line(g, [[ankle[0] - w / 2 + 4, ankle[1] - 4], [ankle[0], ankle[1] + 2], [ankle[0] + w / 2 - 4, ankle[1] - 4]], 4); // 바짓단
    // 신발: 앞코가 둥근 신, 밑창 선
    const sh = new Path2D();
    const fx = ankle[0] + sd * 10, fy = ankle[1] + 14;
    sh.moveTo(fx - 34, fy + 18);
    sh.bezierCurveTo(fx - 36, fy - 18, fx + 30, fy - 22, fx + 40, fy + 6);
    sh.quadraticCurveTo(fx + 44, fy + 20, fx + 30, fy + 22);
    sh.lineTo(fx - 30, fy + 22);
    sh.closePath();
    ink(g, sh, C.shoes, 7);
    line(g, [[fx - 32, fy + 12], [fx + 40, fy + 12]], 3.5, shade(C.shoes, 1.8), false);
  });
}

// ------------------------------------------------------------------ 몸통·옷
function torso(g: G, C: Cast, F: Frame) {
  const sw = C.sw, hw = C.hw, y0 = F.shY, y1 = F.hipY;
  const bl = C.belly ?? 0;
  const neckW = C.kid ? 30 : 34;
  const p = new Path2D();
  p.moveTo(300 - neckW, y0 - 4);
  p.quadraticCurveTo(300 - sw + 10, y0 + 2, 300 - sw, y0 + 46); // 어깨 경사
  p.bezierCurveTo(300 - sw - 4 - bl * 20, y0 + (y1 - y0) * 0.45, 300 - hw - bl * 26, y1 - 60, 300 - hw, y1);
  p.lineTo(300 + hw, y1);
  p.bezierCurveTo(300 + hw + bl * 26, y1 - 60, 300 + sw + 4 + bl * 20, y0 + (y1 - y0) * 0.45, 300 + sw, y0 + 46);
  p.quadraticCurveTo(300 + sw - 10, y0 + 2, 300 + neckW, y0 - 4);
  p.closePath();
  if (C.skirt) {
    // A라인 치마: 허리에서 무릎 아래까지
    const s = new Path2D();
    const sy = y1 - 40, ey = F.hipY + (F.footY - F.hipY) * 0.62;
    s.moveTo(300 - hw + 6, sy);
    s.lineTo(300 + hw - 6, sy);
    s.quadraticCurveTo(300 + hw + 30, ey - 40, 300 + hw + 44, ey);
    s.quadraticCurveTo(300, ey + 16, 300 - hw - 44, ey);
    s.quadraticCurveTo(300 - hw - 30, ey - 40, 300 - hw + 6, sy);
    s.closePath();
    ink(g, s, C.bottom);
    shadeRight(g, s, C.bottom, 340, 0.84);
    g.lineWidth = OUT; g.strokeStyle = INK2; g.stroke(s);
    [-30, 22].forEach((x) => line(g, [[300 + x, sy + 30], [300 + x * 1.5, ey - 6]], 4, INK2, false)); // 주름
  }
  ink(g, p, C.top);
  shadeRight(g, p, C.top, 350, 0.84);
  g.lineWidth = OUT; g.strokeStyle = INK2; g.stroke(p);
  const mid = (y0 + y1) / 2;
  // 옷 디테일
  if (C.outfit === "tee") {
    line(g, [[300 - neckW + 2, y0 - 2], [300, y0 + 26], [300 + neckW - 2, y0 - 2]], 5);
    // 가로 줄무늬 두 줄 (옷이 '옷'으로 읽히게)
    g.save(); g.clip(p); g.fillStyle = C.accent; [mid - 18, mid + 22].forEach((y) => g.fillRect(200, y, 200, 14)); g.restore();
  } else if (C.outfit === "blouse") {
    const col = new Path2D();
    col.moveTo(300, y0 + 34); col.lineTo(300 - neckW - 20, y0 + 6); col.lineTo(300 - neckW + 2, y0 - 6); col.closePath();
    col.moveTo(300, y0 + 34); col.lineTo(300 + neckW + 20, y0 + 6); col.lineTo(300 + neckW - 2, y0 - 6); col.closePath();
    ink(g, col, C.accent, 5);
    [0, 1, 2].forEach((i) => { g.fillStyle = C.accent; g.beginPath(); g.arc(300, y0 + 60 + i * 44, 6, 0, Math.PI * 2); g.fill(); g.lineWidth = 3; g.strokeStyle = INK2; g.stroke(); });
  } else if (C.outfit === "cardigan") {
    // 안에 입은 옷이 보이는 V 앞섶 + 단추
    const inner = new Path2D();
    inner.moveTo(300 - neckW, y0 - 2); inner.lineTo(300 + neckW, y0 - 2); inner.lineTo(300 + 22, y1); inner.lineTo(300 - 22, y1); inner.closePath();
    ink(g, inner, C.accent, 5);
    line(g, [[300 - neckW, y0], [300 - 20, y1]], 5, INK2, false); line(g, [[300 + neckW, y0], [300 + 20, y1]], 5, INK2, false);
    [0, 1, 2].forEach((i) => { g.fillStyle = shade(C.top, 0.7); g.beginPath(); g.arc(300 - 30, y0 + 70 + i * 50, 7, 0, Math.PI * 2); g.fill(); });
    [-1, 1].forEach((sd) => { g.fillStyle = shade(C.top, 0.9); g.beginPath(); g.roundRect(300 + sd * 70 - 26, mid + 20, 52, 40, 8); g.fill(); g.lineWidth = 4; g.strokeStyle = INK2; g.stroke(); }); // 주머니
  } else if (C.outfit === "suit") {
    const shirt = new Path2D();
    shirt.moveTo(300 - neckW, y0 - 2); shirt.lineTo(300 + neckW, y0 - 2); shirt.lineTo(300, y0 + 120); shirt.closePath();
    ink(g, shirt, "#f4f2ee", 5);
    const tie = new Path2D();
    tie.moveTo(300 - 10, y0 + 8); tie.lineTo(300 + 10, y0 + 8); tie.lineTo(300 + 16, y0 + 96); tie.lineTo(300, y0 + 116); tie.lineTo(300 - 16, y0 + 96); tie.closePath();
    ink(g, tie, C.accent, 5);
    // 라펠
    [-1, 1].forEach((sd) => {
      const l = new Path2D();
      l.moveTo(300 + sd * neckW, y0 - 2); l.lineTo(300 + sd * (neckW + 34), y0 + 40); l.lineTo(300 + sd * 20, y0 + 70); l.lineTo(300, y0 + 124); l.lineTo(300 + sd * 4, y0 + 30); l.closePath();
      ink(g, l, shade(C.top, 0.88), 5);
    });
    [0, 1].forEach((i) => { g.fillStyle = INK2; g.beginPath(); g.arc(300 + 12, y0 + 150 + i * 46, 6, 0, Math.PI * 2); g.fill(); });
  } else if (C.outfit === "sweater") {
    line(g, [[300 - neckW, y0 + 2], [300, y0 + 16], [300 + neckW, y0 + 2]], 5);
    for (let i = 0; i < 3; i++) line(g, [[300 - C.hw + 12, y1 - 14 - i * 10], [300 + C.hw - 12, y1 - 14 - i * 10]], 3, shade(C.top, 0.7), false); // 밑단 골지
  }
}

function neck(g: G, C: Cast, F: Frame) {
  const w = C.kid ? 26 : 30;
  const p = new Path2D();
  p.moveTo(300 - w, F.chin - 30); p.lineTo(300 - w, F.shY + 10); p.lineTo(300 + w, F.shY + 10); p.lineTo(300 + w, F.chin - 30); p.closePath();
  ink(g, p, C.skin, 7);
  // 턱 밑 그림자
  g.fillStyle = shade(C.skin, 0.8);
  g.beginPath(); g.ellipse(300, F.chin - 4, w + 2, 16, 0, 0, Math.PI); g.fill();
}

// ------------------------------------------------------------------ 한 장 그리기
export function drawCast(g: G, C: Cast, P: Pose2 = {}) {
  g.clearRect(0, 0, 600, 1000);
  const F = frameOf(C);
  const sleeve = C.top;
  const shortSleeve = C.outfit === "tee";
  hairBack(g, C, F);
  legs(g, C, F, P);
  // 뒤쪽 팔(오른쪽)이 몸 뒤로 가지 않게: 몸통 → 팔 순서
  neck(g, C, F);
  torso(g, C, F);
  arm(g, C, F, -1, P.armL ?? 12, P.bendL ?? 10, sleeve, shortSleeve);
  arm(g, C, F, 1, P.armR ?? 12, P.bendR ?? 10, sleeve, shortSleeve);
  ears(g, C, F);
  const hp = headShape(C, F);
  ink(g, hp, C.skin);
  shadeRight(g, hp, C.skin, 300 + C.headR * 0.62, 0.9);
  g.lineWidth = OUT; g.strokeStyle = INK2; g.stroke(hp);
  face(g, C, F, P);
  hairFront(g, C, F);
}

// ------------------------------------------------------------------ 기본 등장인물
export const KID2: Cast = { skin: "#f6d3b5", hair: "kidBob", hairC: "#2a2026", top: "#ef6f5e", accent: "#ffd23a", bottom: "#3b4a7a", shoes: "#f4f0e8", outfit: "tee", H: 560, headR: 118, headH: 236, sw: 92, hw: 74, jaw: 0, kid: true, browW: 6 };
export const MOM2: Cast = { skin: "#f4d0b0", hair: "momLong", hairC: "#5a3424", top: "#f2eee6", accent: "#c86b8a", bottom: "#c86b8a", shoes: "#8a5a3a", outfit: "blouse", skirt: true, H: 880, headR: 104, headH: 226, sw: 104, hw: 84, jaw: 0.15, browW: 5 };
export const DAD2: Cast = { skin: "#e8c09c", hair: "dadShort", hairC: "#1e1a1c", top: "#2f6f8f", accent: "#2f6f8f", bottom: "#4a4a52", shoes: "#3a2c26", outfit: "sweater", H: 930, headR: 108, headH: 232, sw: 122, hw: 94, belly: 0.3, jaw: 0.65, glasses: true, browW: 8 };
export const GRAN2: Cast = { skin: "#eac4a2", hair: "granPerm", hairC: "#cdc8cc", top: "#8a6a9a", accent: "#f2e6d8", bottom: "#4a4658", shoes: "#3a3030", outfit: "cardigan", skirt: true, H: 800, headR: 104, headH: 218, sw: 112, hw: 100, belly: 0.5, jaw: 0.1, glasses: true, wrinkles: true, browW: 5 };
export const BOSS2: Cast = { skin: "#e6bc96", hair: "bossSide", hairC: "#3a3236", top: "#2b3558", accent: "#b8323a", bottom: "#2b3558", shoes: "#1e1a1c", outfit: "suit", H: 920, headR: 112, headH: 236, sw: 128, hw: 104, belly: 0.7, jaw: 0.45, mustache: true, wrinkles: true, browW: 9 };
