// 코노라마 2D 캐릭터·소품 카드 (캔버스에 그려서 3D 세계에 세우는 판)
// 우리 고유 디자인: 2.5등신, 둥근 머리 + 한국식 머리 모양, 동그란 손(벙어리장갑), 볼터치, 짙은 갈색 잉크 선.
// 설계 공간 600 x 1000 (발바닥 y = 975). 화풍 참고: claude-animated-shorts 의 "3D 세계 위 2D 캐릭터" 방식 (MIT).
import * as THREE from "three";

export const INK = "#2b1a22";
const OL = 12;
type P2 = [number, number];

export type Hair = "bob" | "short" | "long";
export type Look = { skin: string; hair: Hair; hairC: string; top: string; bottom: string; shoes: string; glasses?: boolean };
export type Mouth = "smile" | "grin" | "open" | "o" | "smug" | "flat" | "sad";
export type Pose = {
  armL?: number; // 도(°): 0 = 아래로, 90 = 옆으로 수평 (화면 왼쪽 팔)
  armR?: number; // 화면 오른쪽 팔
  mouth?: Mouth;
  blink?: boolean;
  look?: number; // 눈동자 좌우 -1..1
  brow?: number; // 눈썹: + 놀람, - 찡그림
  wings?: number; // 등 날개 0..1
  flap?: number; // 날갯짓 각도(라디안)
  legs?: "stand" | "fly" | "sit";
  walk?: number; // 걸음 위상(라디안): 다리가 번갈아 앞뒤로
  blush?: number; // 볼 빨개짐 0..1
};

export const ME: Look = { skin: "#f6d3b5", hair: "bob", hairC: "#231a1e", top: "#ef6f5e", bottom: "#3b4a7a", shoes: "#8a5a3a" };
export const HIM: Look = { skin: "#efc9a6", hair: "short", hairC: "#1e1a1c", top: "#2f6f8f", bottom: "#38363f", shoes: "#2b2b30", glasses: true };
export const RIVAL: Look = { skin: "#f4d0b0", hair: "long", hairC: "#5a3424", top: "#c23b5a", bottom: "#2d2d3a", shoes: "#c23b5a" };
export const GUY2: Look = { skin: "#e8c09c", hair: "short", hairC: "#2b2220", top: "#6a8a3a", bottom: "#3b3f52", shoes: "#4a3426" };

const shade = (c: string, k: number) => {
  const n = parseInt(c.slice(1), 16);
  const ch = (v: number) => Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
};
const ell = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = 360, n = 48): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
};
const rrect = (x: number, y: number, w: number, h: number, r: number): P2[] => {
  const out: P2[] = [];
  const corner = (cx: number, cy: number, a0: number) => ell(cx, cy, r, r, a0, a0 + 90, 8).forEach((p) => out.push(p));
  corner(x + w - r, y + r, -90);
  corner(x + w - r, y + h - r, 0);
  corner(x + r, y + h - r, 90);
  corner(x + r, y + r, 180);
  return out;
};

class Pen {
  constructor(public g: CanvasRenderingContext2D) {}
  path(pts: P2[], close = true) {
    const g = this.g;
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    if (close) g.closePath();
  }
  fill(pts: P2[], c: string, ol = OL) {
    const g = this.g;
    this.path(pts);
    g.fillStyle = c;
    g.fill();
    if (ol) {
      g.lineWidth = ol;
      g.strokeStyle = INK;
      g.lineJoin = "round";
      g.stroke();
    }
  }
  /** 위→아래 그라데이션 (아래쪽이 살짝 어두움: 위에서 오는 가게 조명) */
  fillGrad(pts: P2[], c: string, y0: number, y1: number, ol = OL) {
    const g = this.g;
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, c);
    gr.addColorStop(1, shade(c, 0.78));
    this.path(pts);
    g.fillStyle = gr;
    g.fill();
    if (ol) {
      g.lineWidth = ol;
      g.strokeStyle = INK;
      g.lineJoin = "round";
      g.stroke();
    }
  }
  limb(a: P2, b: P2, c: string, w: number) {
    const g = this.g;
    g.lineCap = "round";
    this.path([a, b], false);
    g.strokeStyle = INK;
    g.lineWidth = w + OL * 1.6;
    g.stroke();
    this.path([a, b], false);
    g.strokeStyle = c;
    g.lineWidth = w;
    g.stroke();
  }
  stroke(pts: P2[], w: number, c = INK) {
    const g = this.g;
    g.lineCap = "round";
    g.lineJoin = "round";
    this.path(pts, false);
    g.strokeStyle = c;
    g.lineWidth = w;
    g.stroke();
  }
  dot(x: number, y: number, r: number, c = INK) {
    const g = this.g;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fillStyle = c;
    g.fill();
  }
}

const HX = 300;
const HY = 330; // 머리 중심
const HRX = 172;
const HRY = 160;

function drawWings(p: Pen, s: number, flap: number) {
  if (s <= 0.01) return;
  [-1, 1].forEach((sd) => {
    const g = p.g;
    g.save();
    g.translate(HX + sd * 60, 560);
    g.rotate(sd * (0.35 + 0.35 * Math.sin(flap)));
    g.scale(sd * s, s);
    // 깃털 날개: 어깨에서 바깥 위로, 아래쪽은 물결
    const pts: P2[] = [[0, 0], [60, -120], [170, -190], [270, -200], [250, -140], [285, -110], [240, -60], [265, -20], [200, 10], [210, 50], [120, 50], [40, 40]];
    p.fill(pts, "#ffffff");
    p.stroke([[90, -60], [200, -120]], 6, "#d9d4e4");
    p.stroke([[80, -10], [190, -40]], 6, "#d9d4e4");
    g.restore();
  });
}

function drawHairBack(p: Pen, L: Look) {
  if (L.hair === "bob") p.fill([...ell(HX, HY - 10, HRX + 26, HRY + 22, 180, 360), [HX + HRX + 26, HY + 150], [HX - HRX - 26, HY + 150]], L.hairC);
  if (L.hair === "long") p.fill([...ell(HX, HY - 10, HRX + 28, HRY + 24, 180, 360), [HX + HRX + 40, HY + 300], [HX - HRX - 40, HY + 300]], L.hairC);
}

function drawHairFront(p: Pen, L: Look) {
  if (L.hair === "short") {
    // 짧은 머리 + 옆 가르마
    const pts: P2[] = [...ell(HX, HY - 6, HRX + 10, HRY + 12, 185, 355), [HX + HRX - 10, HY - 40], [HX + 60, HY - 95], [HX - 40, HY - 70], [HX - HRX + 4, HY - 20]];
    p.fill(pts, L.hairC);
  } else {
    // 앞머리(뱅): 일자
    const top = ell(HX, HY - 10, HRX + 22, HRY + 20, 182, 358);
    const pts: P2[] = [...top, [HX + HRX + 10, HY - 10], [HX + HRX - 30, HY - 60], [HX - HRX + 30, HY - 60], [HX - HRX - 10, HY - 10]];
    p.fill(pts, L.hairC);
    p.stroke([[HX - 60, HY - 150], [HX - 20, HY - 70]], 7, shade(L.hairC, 1.8));
  }
}

function drawFace(p: Pen, L: Look, P: Pose) {
  const lk = (P.look ?? 0) * 10;
  const ey = HY + 20;
  const brow = P.brow ?? 0;
  // 볼터치
  p.g.globalAlpha = 0.35 + 0.45 * (P.blush ?? 0);
  p.dot(HX - 100, ey + 60, 26 + 10 * (P.blush ?? 0), "#ff8a8a");
  p.dot(HX + 100, ey + 60, 26 + 10 * (P.blush ?? 0), "#ff8a8a");
  p.g.globalAlpha = 1;
  // 눈
  [-1, 1].forEach((sd) => {
    const ex = HX + sd * 62;
    if (P.blink) p.stroke(ell(ex, ey + 4, 22, 10, 200, 340, 12), 9);
    else p.fill(ell(ex + lk, ey, 15, 24), INK, 0);
    // 눈썹
    p.stroke([[ex - 22, ey - 52 - brow * 14 + sd * brow * 4], [ex + 22, ey - 52 - brow * 14 - sd * brow * 4]], 9);
  });
  if (L.glasses) {
    [-1, 1].forEach((sd) => p.stroke(ell(HX + sd * 62, ey, 40, 36), 8, "#3a2f36"));
    p.stroke([[HX - 22, ey - 4], [HX + 22, ey - 4]], 8, "#3a2f36");
  }
  // 입
  const my = HY + 100;
  const m = P.mouth ?? "smile";
  if (m === "smile") p.stroke(ell(HX, my - 18, 30, 22, 25, 155, 16), 9);
  if (m === "flat") p.stroke([[HX - 22, my], [HX + 22, my]], 9);
  if (m === "sad") p.stroke(ell(HX, my + 26, 28, 20, 205, 335, 16), 9);
  if (m === "smug") p.stroke([[HX - 28, my + 2], [HX + 4, my + 4], [HX + 30, my - 10]], 9);
  if (m === "o") p.fill(ell(HX, my, 13, 16), "#6a2230", 7);
  if (m === "grin") {
    p.fill([...ell(HX, my - 10, 42, 34, 0, 180, 20)], "#6a2230", 8);
    p.fill([[HX - 30, my - 10], [HX + 30, my - 10], [HX + 26, my + 2], [HX - 26, my + 2]], "#ffffff", 0);
  }
  if (m === "open") {
    p.fill(ell(HX, my + 6, 32, 40), "#6a2230", 8);
    p.fill(ell(HX, my + 30, 20, 12, 180, 360, 12), "#e86e78", 0);
  }
}

/** 캐릭터 한 장 그리기 */
export function drawChar(g: CanvasRenderingContext2D, L: Look, P: Pose) {
  const p = new Pen(g);
  g.clearRect(0, 0, 600, 1000);
  drawWings(p, P.wings ?? 0, P.flap ?? 0);
  // 다리
  const fly = P.legs === "fly";
  const sit = P.legs === "sit";
  const legC = L.bottom;
  [-1, 1].forEach((sd) => {
    const x = HX + sd * 52;
    const wk = P.walk !== undefined ? Math.sin(P.walk + (sd > 0 ? Math.PI : 0)) : 0;
    const foot: P2 = fly ? [x + sd * 30, 905] : sit ? [x + sd * 8, 860] : [x + wk * 46, 935 - Math.max(0, wk) * 22];
    p.limb([x, 760], foot, legC, 66);
    p.fill(ell(foot[0] + sd * 14, foot[1] + 22, 50, 26), L.shoes, 10);
  });
  // 몸통
  const body = rrect(HX - 118, 470, 236, 300, 90);
  p.fillGrad(body, L.top, 470, 770);
  // 팔
  const arm = (sd: number, deg: number) => {
    const sh: P2 = [HX + sd * 104, 540];
    const a = (deg * Math.PI) / 180;
    const len = 170;
    const hand: P2 = [sh[0] + sd * Math.sin(a) * len, sh[1] + Math.cos(a) * len];
    p.limb(sh, hand, L.top, 56);
    p.fill(ell(hand[0], hand[1], 36, 34), L.skin, 10);
  };
  arm(-1, P.armL ?? 12);
  arm(1, P.armR ?? 12);
  // 머리
  drawHairBack(p, L);
  p.fill([[HX - 40, 470], [HX + 40, 470], [HX + 40, 500], [HX - 40, 500]], shade(L.skin, 0.9), 0);
  const head = ell(HX, HY, HRX, HRY);
  p.fillGrad(head, L.skin, HY - HRY, HY + HRY);
  drawHairFront(p, L);
  drawFace(p, L, P);
}

/** 오른손(화면 오른쪽) 위치를 카드 좌표(0..1)로: 소품을 손에 붙일 때 */
export function handUV(P: Pose, side: 1 | -1): [number, number] {
  const deg = (side === 1 ? P.armR : P.armL) ?? 12;
  const a = (deg * Math.PI) / 180;
  const x = HX + side * 104 + side * Math.sin(a) * 170;
  const y = 540 + Math.cos(a) * 170;
  return [x / 600, y / 1000];
}

// ---------- 소품 카드 ----------
/** 후라이드 치킨 날개: 펼친 새 날개 실루엣. 봉(왼쪽 아래 둥근 곤봉 + 뼈 마디) → 날개살(넓적한 판) → 날개 끝(뾰족).
 *  매끈한 잉크 외곽, 황금색 튀김옷, 위쪽 광택, 바삭한 결 */
export function drawWing(g: CanvasRenderingContext2D, w = 400, h = 300) {
  g.clearRect(0, 0, w, h);
  g.save();
  g.scale(w / 400, h / 300);
  // 회전한 날개 끝이 캔버스 밖으로 잘리지 않게: 가운데 기준으로 줄이고 살짝 아래로
  g.translate(200, 160); g.rotate(-0.28); g.scale(0.82, 0.82); g.translate(-210, -150);
  // 한눈에 '날개'로 읽히게: 새 날개 모양(위는 둥근 앞날개, 아래는 깃털처럼 물결) + 노릇한 튀김 색 + 어깨 뼈 마디
  const shape = new Path2D();
  shape.moveTo(70, 200);
  shape.bezierCurveTo(70, 120, 170, 60, 300, 50); // 위쪽 둥근 앞날개
  shape.bezierCurveTo(345, 46, 380, 56, 388, 74); // 날개 끝
  shape.bezierCurveTo(360, 92, 352, 108, 360, 124); // 깃 1
  shape.bezierCurveTo(320, 128, 306, 142, 312, 162); // 깃 2
  shape.bezierCurveTo(268, 162, 252, 178, 256, 200); // 깃 3
  shape.bezierCurveTo(212, 198, 194, 214, 196, 236); // 깃 4
  shape.bezierCurveTo(150, 236, 120, 246, 104, 250);
  shape.bezierCurveTo(80, 246, 70, 226, 70, 200);
  shape.closePath();
  g.beginPath(); g.arc(70, 222, 17, 0, Math.PI * 2); g.fillStyle = "#f6ecd8"; g.fill(); g.lineWidth = 9; g.strokeStyle = INK; g.stroke();
  const gr = g.createLinearGradient(0, 50, 0, 250);
  gr.addColorStop(0, "#f7c25a");
  gr.addColorStop(0.55, "#e0902c");
  gr.addColorStop(1, "#b5621a");
  g.fillStyle = gr;
  g.fill(shape);
  g.save();
  g.clip(shape);
  const r = (k: number) => { const x = Math.sin(k * 91.7) * 43758.5; return x - Math.floor(x); };
  for (let k = 0; k < 60; k++) {
    const x = 50 + r(k) * 320, y = 50 + r(k + 50) * 200;
    g.strokeStyle = k % 2 ? "rgba(140,62,8,0.45)" : "rgba(255,226,150,0.6)";
    g.lineWidth = 4; g.lineCap = "round";
    g.beginPath(); g.arc(x, y, 7 + r(k + 9) * 6, Math.PI * 1.1, Math.PI * 1.8); g.stroke();
  }
  g.fillStyle = "rgba(255,248,215,0.55)";
  g.beginPath(); g.ellipse(170, 108, 70, 12, -0.4, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(300, 66, 30, 7, -0.15, 0, Math.PI * 2); g.fill();
  g.restore();
  g.lineWidth = 10; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(shape);
  g.lineWidth = 7; g.lineCap = "round";
  g.beginPath(); g.moveTo(150, 175); g.quadraticCurveTo(230, 125, 330, 95); g.stroke();
  g.restore();
}

/** 치킨 바구니 (앞에서 본 모습) + 날개 여러 개 */
export function drawBasket(g: CanvasRenderingContext2D) {
  const p = new Pen(g);
  g.clearRect(0, 0, 600, 400);
  // 날개들 (바구니 뒤로 쌓임)
  const off = document.createElement("canvas");
  off.width = 400;
  off.height = 300;
  drawWing(off.getContext("2d")!);
  [[60, 40, -0.3], [200, 20, 0.2], [130, 0, 0.05], [260, 50, 0.4], [20, 80, -0.1]].forEach(([x, y, r]) => {
    g.save();
    g.translate(x + 140, y + 110);
    g.rotate(r);
    g.drawImage(off, -140, -105, 280, 210);
    g.restore();
  });
  // 바구니 + 종이
  p.fill([[40, 200], [560, 200], [520, 380], [80, 380]], "#c98a4a");
  p.fill([[60, 190], [540, 190], [560, 215], [40, 215]], "#f4efe2", 10);
  g.globalAlpha = 0.35;
  for (let x = 90; x < 520; x += 40) p.stroke([[x, 225], [x + 10, 370]], 6, "#7a4a22");
  g.globalAlpha = 1;
}

/** "바람" 간판 카드: 앞면 = 바람(wind) 소용돌이, 뒷면 = 깨진 하트 */
export function drawBaram(g: CanvasRenderingContext2D, which: "wind" | "heart", font: string) {
  const p = new Pen(g);
  g.clearRect(0, 0, 600, 600);
  p.fill(rrect(30, 30, 540, 540, 70), "#fffaf0", 14);
  g.fillStyle = INK;
  g.font = `bold 190px ${font}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("바람", 300, 200);
  if (which === "wind") {
    // 소용돌이 바람 3줄
    [[150, 380, 1], [210, 450, 0.8], [130, 500, 0.6]].forEach(([x, y, s]) => {
      const pts: P2[] = [];
      for (let i = 0; i <= 30; i++) pts.push([x + i * 10 * s, y + Math.sin(i / 4) * 6]);
      const r = 30 * s;
      for (let i = 0; i <= 20; i++) {
        const a = -Math.PI / 2 + (i / 20) * Math.PI * 1.6;
        pts.push([x + 300 * s + Math.cos(a) * r, y - r + Math.sin(a) * r]);
      }
      p.stroke(pts, 16, "#4a8fd0");
    });
  } else {
    // 깨진 하트
    const heart = (dx: number, rot: number, half: -1 | 1) => {
      g.save();
      g.translate(300 + dx, 430);
      g.rotate(rot);
      const pts: P2[] = [];
      for (let i = 0; i <= 40; i++) {
        const t = (i / 40) * Math.PI * 2;
        pts.push([16 * Math.pow(Math.sin(t), 3) * 7, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 7]);
      }
      g.beginPath();
      g.rect(half === -1 ? -200 : 0, -200, 200, 400);
      g.clip();
      p.fill(pts, "#e2414f");
      g.restore();
    };
    heart(-14, -0.12, -1);
    heart(14, 0.12, 1);
    p.stroke([[300, 330], [285, 380], [312, 420], [292, 470], [300, 520]], 10);
  }
}

export const canvasTexture = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};
