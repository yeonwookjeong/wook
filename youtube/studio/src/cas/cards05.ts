// EP05 "한국 나이가 줄어든 날" 새 화풍 소품 카드 (모두 잉크 외곽선)
import { INK } from "./toonkr";

type G = CanvasRenderingContext2D;
type P2 = [number, number];

const path = (g: G, pts: P2[], close = true) => {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  if (close) g.closePath();
};
const inkFill = (g: G, draw: () => void, c: string, ol = 12) => {
  draw();
  g.fillStyle = c;
  g.fill();
  if (ol) {
    g.lineWidth = ol;
    g.strokeStyle = INK;
    g.lineJoin = "round";
    g.stroke();
  }
};
const rr = (g: G, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
};
const txt = (g: G, s: string, x: number, y: number, size: number, font: string, c = INK, stroke = 0, weight = "bold") => {
  g.font = `${weight} ${size}px ${font}`;
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
/** 글자 폭이 w를 넘지 않게 크기를 줄인다 */
const fit = (g: G, s: string, size: number, w: number, font: string) => {
  let k = size;
  g.font = `bold ${k}px ${font}`;
  while (g.measureText(s).width > w && k > 10) {
    k -= 2;
    g.font = `bold ${k}px ${font}`;
  }
  return k;
};

/** 포대기에 싸인 아기 (자는 얼굴), 400x400 */
export function drawBaby(g: G, awake = false) {
  g.clearRect(0, 0, 400, 400);
  // 포대기
  inkFill(g, () => { g.beginPath(); g.ellipse(200, 250, 130, 120, 0, 0, Math.PI * 2); }, "#f7d6e0");
  inkFill(g, () => { path(g, [[90, 210], [200, 280], [310, 210], [300, 300], [200, 350], [100, 300]]); }, "#f2bfcf", 10);
  // 머리
  inkFill(g, () => { g.beginPath(); g.ellipse(200, 165, 88, 80, 0, 0, Math.PI * 2); }, "#ffe0c8");
  // 모자
  inkFill(g, () => { g.beginPath(); g.ellipse(200, 120, 92, 56, 0, Math.PI, Math.PI * 2); g.closePath(); }, "#9fd0f0", 10);
  // 얼굴
  g.strokeStyle = INK; g.lineWidth = 8; g.lineCap = "round";
  if (awake) {
    g.fillStyle = INK; [168, 232].forEach((x) => { g.beginPath(); g.ellipse(x, 170, 9, 13, 0, 0, Math.PI * 2); g.fill(); });
    g.beginPath(); g.arc(200, 198, 14, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  } else {
    [168, 232].forEach((x) => { g.beginPath(); g.arc(x, 168, 14, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); });
    g.beginPath(); g.arc(200, 204, 7, 0, Math.PI * 2); g.stroke();
  }
  g.globalAlpha = 0.45; g.fillStyle = "#ff8a8a";
  [148, 252].forEach((x) => { g.beginPath(); g.arc(x, 192, 16, 0, Math.PI * 2); g.fill(); });
  g.globalAlpha = 1;
}

/** 숫자 풍선 (호일 풍선), 300x520 */
export function drawBalloon(g: G, n: string, font: string, color = "#ff5a6e") {
  g.clearRect(0, 0, 300, 520);
  // 줄
  g.strokeStyle = INK; g.lineWidth = 5;
  g.beginPath(); g.moveTo(150, 360); g.bezierCurveTo(120, 420, 180, 460, 150, 515); g.stroke();
  // 숫자 모양 풍선
  g.font = `900 360px ${font}`;
  g.textAlign = "center"; g.textBaseline = "middle";
  g.lineJoin = "round";
  g.lineWidth = 34; g.strokeStyle = INK; g.strokeText(n, 150, 200);
  g.lineWidth = 18; g.strokeStyle = color; g.strokeText(n, 150, 200);
  g.fillStyle = color; g.fillText(n, 150, 200);
  // 반짝임
  g.globalAlpha = 0.6; g.fillStyle = "#ffffff";
  g.beginPath(); g.ellipse(118, 110, 14, 34, -0.4, 0, Math.PI * 2); g.fill();
  g.globalAlpha = 1;
  // 묶는 매듭
  inkFill(g, () => { path(g, [[138, 352], [162, 352], [156, 372], [144, 372]]); }, color, 6);
}

/** 한 장짜리 달력 (월 띠 + 큰 날짜), 400x480 */
export function drawCalendar(g: G, month: string, day: string, font: string, red = false) {
  g.clearRect(0, 0, 400, 480);
  inkFill(g, () => rr(g, 20, 40, 360, 420, 26), "#fffaf0", 14);
  inkFill(g, () => rr(g, 20, 40, 360, 110, 26), red ? "#e2343a" : "#3b6fb6", 0);
  g.lineWidth = 14; g.strokeStyle = INK; rr(g, 20, 40, 360, 420, 26); g.stroke();
  g.beginPath(); g.moveTo(20, 150); g.lineTo(380, 150); g.stroke();
  [120, 280].forEach((x) => inkFill(g, () => rr(g, x - 12, 14, 24, 60, 12), "#9aa0a8", 8));
  txt(g, month, 200, 96, fit(g, month, 72, 320, font), font, "#ffffff");
  txt(g, day, 200, 305, day.length > 1 ? 230 : 260, font, red ? "#e2343a" : INK);
}

/** 불꽃, 400x400 */
export function drawFirework(g: G, color = "#ffd23a") {
  g.clearRect(0, 0, 400, 400);
  g.lineCap = "round";
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    const r0 = 40, r1 = 170;
    g.strokeStyle = INK; g.lineWidth = 22;
    g.beginPath(); g.moveTo(200 + Math.cos(a) * r0, 200 + Math.sin(a) * r0); g.lineTo(200 + Math.cos(a) * r1, 200 + Math.sin(a) * r1); g.stroke();
    g.strokeStyle = k % 2 ? color : "#ffffff"; g.lineWidth = 10;
    g.beginPath(); g.moveTo(200 + Math.cos(a) * r0, 200 + Math.sin(a) * r0); g.lineTo(200 + Math.cos(a) * r1, 200 + Math.sin(a) * r1); g.stroke();
    g.fillStyle = color; g.beginPath(); g.arc(200 + Math.cos(a) * (r1 + 16), 200 + Math.sin(a) * (r1 + 16), 9, 0, Math.PI * 2); g.fill();
  }
}

/** 나이 카드 (이름 띠 + 큰 숫자), 360x440 */
export function drawAgeCard(g: G, label: string, n: string, color: string, font: string) {
  g.clearRect(0, 0, 360, 440);
  inkFill(g, () => rr(g, 16, 16, 328, 408, 34), "#fffaf0", 14);
  inkFill(g, () => rr(g, 40, 40, 280, 96, 22), color, 10);
  txt(g, label, 180, 90, fit(g, label, 54, 250, font), font, "#ffffff");
  txt(g, n, 180, 290, 220, font, INK);
}

/** 신문 1면, 600x440 */
export function drawNewspaper(g: G, head: string, date: string, font: string) {
  g.clearRect(0, 0, 600, 440);
  inkFill(g, () => path(g, [[20, 30], [580, 14], [586, 420], [26, 430]]), "#f7f2e4", 14);
  txt(g, "THE DAILY", 300, 70, 40, font, INK);
  g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); g.moveTo(50, 100); g.lineTo(552, 92); g.stroke();
  txt(g, date, 300, 124, 30, font, "#6a6058");
  txt(g, head, 300, 200, fit(g, head, 84, 500, font), font, "#c8231f");
  g.strokeStyle = "#b9b0a0"; g.lineWidth = 8;
  for (let y = 270; y < 400; y += 30) {
    g.beginPath(); g.moveTo(60, y); g.lineTo(290, y - 2); g.stroke();
    g.beginPath(); g.moveTo(320, y - 2); g.lineTo(546, y - 4); g.stroke();
  }
}

/** 머리 위 숫자표 (말풍선 꼬리), 220x200 */
export function drawTag(g: G, n: string, font: string, color = "#ffd23a") {
  g.clearRect(0, 0, 220, 200);
  inkFill(g, () => { rr(g, 20, 14, 180, 130, 34); }, color, 12);
  inkFill(g, () => path(g, [[90, 140], [110, 186], [130, 140]]), color, 0);
  g.strokeStyle = INK; g.lineWidth = 12; g.lineJoin = "round";
  g.beginPath(); g.moveTo(88, 144); g.lineTo(110, 186); g.lineTo(132, 144); g.stroke();
  txt(g, n, 110, 84, 110, font, INK);
}

/** 간판 (글자 판), 640x180 */
export function drawSign(g: G, s: string, bg: string, font: string, fg = "#ffffff") {
  g.clearRect(0, 0, 640, 180);
  inkFill(g, () => rr(g, 12, 12, 616, 156, 22), bg, 14);
  txt(g, s, 320, 94, fit(g, s, 96, 560, font), font, fg);
}

/** 술 진열대 (소주·맥주병), 600x420 */
export function drawShelf(g: G) {
  g.clearRect(0, 0, 600, 420);
  inkFill(g, () => rr(g, 20, 20, 560, 380, 18), "#e9eef2", 14);
  [150, 280].forEach((y) => inkFill(g, () => rr(g, 30, y, 540, 16, 6), "#9aa4ae", 8));
  const bottle = (x: number, base: number, c: string, h: number) => {
    inkFill(g, () => { g.beginPath(); g.roundRect(x - 20, base - h, 40, h, 10); }, c, 7);
    inkFill(g, () => { g.beginPath(); g.roundRect(x - 9, base - h - 34, 18, 38, 5); }, c, 7);
    inkFill(g, () => { g.beginPath(); g.roundRect(x - 16, base - h * 0.6, 32, h * 0.32, 4); }, "#ffffff", 4);
  };
  for (let k = 0; k < 9; k++) bottle(70 + k * 58, 148, "#3fae6a", 80); // 소주 (초록병)
  for (let k = 0; k < 9; k++) bottle(70 + k * 58, 278, "#b8742a", 86); // 맥주 (갈색병)
  for (let k = 0; k < 6; k++) bottle(100 + k * 80, 390, "#3fae6a", 80);
}
