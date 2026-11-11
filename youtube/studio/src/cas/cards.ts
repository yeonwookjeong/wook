// EP04 새 화풍 소품 카드 (모두 잉크 외곽선, 캔버스에 그림)
import { INK } from "./toonkr";

type G = CanvasRenderingContext2D;
type P2 = [number, number];

const path = (g: G, pts: P2[], close = true) => {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  if (close) g.closePath();
};
const fillInk = (g: G, pts: P2[], c: string, ol = 12) => {
  path(g, pts);
  g.fillStyle = c;
  g.fill();
  if (ol) {
    g.lineWidth = ol;
    g.strokeStyle = INK;
    g.lineJoin = "round";
    g.stroke();
  }
};
const ell = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = 360, n = 40): P2[] => {
  const o: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return o;
};
const rrect = (x: number, y: number, w: number, h: number, r: number): P2[] => {
  const o: P2[] = [];
  const c = (cx: number, cy: number, a0: number) => ell(cx, cy, r, r, a0, a0 + 90, 8).forEach((p) => o.push(p));
  c(x + w - r, y + r, -90);
  c(x + w - r, y + h - r, 0);
  c(x + r, y + h - r, 90);
  c(x + r, y + r, 180);
  return o;
};
const text = (g: G, s: string, x: number, y: number, size: number, font: string, c = INK, stroke = 0) => {
  g.font = `bold ${size}px ${font}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  if (stroke) {
    g.lineWidth = stroke;
    g.strokeStyle = INK;
    g.lineJoin = "round";
    g.strokeText(s, x, y);
  }
  g.fillStyle = c;
  g.fillText(s, x, y);
};

/** 운동화 한 켤레 (옆모습 두 짝), 400x260 */
export function drawSneakers(g: G) {
  g.clearRect(0, 0, 400, 260);
  const shoe = (dx: number, dy: number, k: number) => {
    g.save();
    g.translate(dx, dy);
    g.scale(k, k);
    fillInk(g, [[20, 150], [30, 95], [90, 80], [140, 40], [190, 45], [220, 95], [330, 120], [345, 150], [330, 175], [30, 175]], "#ffffff");
    fillInk(g, [[20, 165], [345, 160], [340, 185], [25, 190]], "#e9e2d4", 10);
    fillInk(g, [[120, 95], [230, 110], [225, 130], [115, 118]], "#e63b3b", 8);
    g.lineWidth = 7;
    g.strokeStyle = INK;
    [[140, 60, 175, 68], [135, 75, 180, 82]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
    g.restore();
  };
  shoe(40, 50, 0.95);
  shoe(10, 10, 0.95);
}

/** 선물 상자: open 0..1 이면 뚜껑이 들림, 400x400 */
export function drawGift(g: G, open: number) {
  g.clearRect(0, 0, 400, 400);
  fillInk(g, rrect(60, 200, 280, 180, 16), "#3d6fb6");
  fillInk(g, [[180, 200], [220, 200], [220, 380], [180, 380]], "#f2c14e", 8);
  g.save();
  g.translate(200, 200 - 90 * open);
  g.rotate(-0.5 * open);
  fillInk(g, rrect(-155, -50, 310, 60, 14), "#4b82cc");
  fillInk(g, [[-20, -50], [20, -50], [20, 10], [-20, 10]], "#f2c14e", 8);
  fillInk(g, ell(-38, -70, 40, 26), "#f2c14e", 8);
  fillInk(g, ell(38, -70, 40, 26), "#f2c14e", 8);
  g.restore();
}

/** 동전 (100), 300x300 */
export function drawCoin(g: G, font: string) {
  g.clearRect(0, 0, 300, 300);
  fillInk(g, ell(150, 150, 130, 130), "#d9dce2", 14);
  fillInk(g, ell(150, 150, 100, 100), "#c3c7cf", 6);
  text(g, "100", 150, 156, 92, font, "#6f737a");
  g.globalAlpha = 0.5;
  fillInk(g, ell(105, 95, 26, 12, 0, 360), "#ffffff", 0);
  g.globalAlpha = 1;
}

/** 도장 "구매" (산 것), 400x400 */
export function drawStamp(g: G, font: string, label: string) {
  g.clearRect(0, 0, 400, 400);
  g.save();
  g.translate(200, 200);
  g.rotate(-0.18);
  g.lineWidth = 22;
  g.strokeStyle = "#d6303a";
  g.beginPath();
  g.ellipse(0, 0, 165, 130, 0, 0, Math.PI * 2);
  g.stroke();
  text(g, label, 0, 6, label.length > 4 ? 64 : 110, font, "#d6303a");
  g.restore();
}

/** 번호 카드 (1/2/3) 위에 그림, 420x520 */
export function drawNumCard(g: G, n: number, icon: (g: G) => void, font: string) {
  g.clearRect(0, 0, 420, 520);
  fillInk(g, rrect(20, 20, 380, 480, 40), "#fffaf0", 14);
  text(g, String(n), 210, 120, 150, font, "#e2343a", 0);
  g.save();
  g.translate(60, 220);
  icon(g);
  g.restore();
}

/** 물음표, 300x360 */
export function drawQ(g: G, font: string) {
  g.clearRect(0, 0, 300, 360);
  text(g, "?", 150, 190, 330, font, "#ffd23a", 26);
}

/** 비구름, 400x300 */
export function drawRain(g: G, phase: number) {
  g.clearRect(0, 0, 400, 300);
  g.strokeStyle = "#7fb4e8";
  g.lineWidth = 9;
  g.lineCap = "round";
  for (let k = 0; k < 9; k++) {
    const x = 80 + k * 30;
    const y = 150 + (((phase * 120 + k * 37) % 120));
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x - 6, y + 26);
    g.stroke();
  }
  fillInk(g, [...ell(140, 110, 80, 62), ...ell(230, 90, 90, 72), ...ell(300, 125, 60, 48)], "#8d95a3", 0);
  [[140, 110, 80, 62], [230, 90, 90, 72], [300, 125, 60, 48]].forEach(([x, y, a, b]) => fillInk(g, ell(x, y, a, b), "#8d95a3", 12));
  fillInk(g, rrect(80, 110, 270, 70, 34), "#8d95a3", 0);
}

/** 말풍선 글자 (HAHA, !, 하하 등), 500x300 */
export function drawBubble(g: G, s: string, font: string, c = "#e2343a") {
  g.clearRect(0, 0, 500, 300);
  fillInk(g, [...ell(250, 135, 225, 115, 0, 360), ], "#ffffff", 12);
  fillInk(g, [[150, 230], [120, 290], [205, 240]], "#ffffff", 0);
  g.lineWidth = 12; g.strokeStyle = INK; path(g, [[160, 238], [120, 290], [200, 246]], false); g.stroke();
  text(g, s, 250, 140, s.length > 3 ? 110 : 150, font, c);
}

/** 하트 (터지는 연출용), 300x280 */
export function drawHeart(g: G) {
  g.clearRect(0, 0, 300, 280);
  const pts: P2[] = [];
  for (let i = 0; i <= 50; i++) {
    const t = (i / 50) * Math.PI * 2;
    pts.push([150 + 16 * Math.pow(Math.sin(t), 3) * 8, 130 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 8]);
  }
  fillInk(g, pts, "#ff5a6e", 12);
}

/** 갈라짐 번개선, 200x700 */
export function drawCrack(g: G) {
  g.clearRect(0, 0, 200, 700);
  const pts: P2[] = [[100, 0], [70, 120], [130, 230], [60, 360], [125, 480], [80, 600], [100, 700]];
  g.lineCap = "round"; g.lineJoin = "round";
  g.strokeStyle = INK; g.lineWidth = 34; path(g, pts, false); g.stroke();
  g.strokeStyle = "#ffffff"; g.lineWidth = 16; path(g, pts, false); g.stroke();
}

/** 서류(이혼 서류) 한 장, 300x380 */
export function drawPaper(g: G, font: string, title: string) {
  g.clearRect(0, 0, 300, 380);
  fillInk(g, [[30, 20], [270, 20], [270, 360], [30, 360]], "#fbf8f0", 10);
  text(g, title, 150, 80, title.length > 6 ? 30 : 52, font);
  g.strokeStyle = "#b9b2a4"; g.lineWidth = 8;
  for (let y = 140; y < 330; y += 36) { g.beginPath(); g.moveTo(60, y); g.lineTo(240, y); g.stroke(); }
}

/** 은행잎, 120x120 */
export function drawLeaf(g: G) {
  g.clearRect(0, 0, 120, 120);
  const pts: P2[] = [[60, 110], [56, 70]];
  for (let i = 0; i <= 20; i++) {
    const a = Math.PI * (1.15 + (0.7 * i) / 20);
    pts.push([60 + Math.cos(a) * 52, 70 + Math.sin(a) * 52]);
  }
  pts.push([64, 70]);
  fillInk(g, pts, "#f5c531", 6);
}
