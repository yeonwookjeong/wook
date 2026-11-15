// 후보 B: 완전 2D 플랫 일러스트 거실 (EP06 '그래서 우리 엄마' 장면)
// 원칙: 빛은 왼쪽 위 창문 하나 → 모든 그림자는 오른쪽 아래로. 장식은 이유가 있을 때만.
// 깊이는 겹친 판과 공기 원근(멀수록 채도·대비 낮게)으로.
import React, { useEffect, useRef, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { Cast, DAD2, GRAN2, INK2, KID2, MOM2, Pose2, drawCast } from "../cas/toonkr2";

type G = CanvasRenderingContext2D;
const W = 1080, H = 1920;
const FONT = "'Noto Sans KR', sans-serif";

const rr = (g: G, x: number, y: number, w: number, h: number, r: number, fill: string, line = 8) => {
  g.beginPath(); g.roundRect(x, y, w, h, r); g.fillStyle = fill; g.fill();
  if (line) { g.lineWidth = line; g.strokeStyle = INK2; g.lineJoin = "round"; g.stroke(); }
};
const grain = (g: G, a = 0.05) => {
  const img = g.getImageData(0, 0, W, H), d = img.data;
  let s = 7;
  for (let i = 0; i < d.length; i += 4) { s = (s * 16807) % 2147483647; const n = ((s / 2147483647) - 0.5) * 255 * a; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
};

function room(g: G) {
  const floorY = 1160;
  // 벽: 따뜻한 세이지 그린 + 아주 옅은 세로 무늬
  g.fillStyle = "#9fb89a"; g.fillRect(0, 0, W, floorY);
  g.fillStyle = "rgba(255,255,255,0.07)";
  for (let x = 20; x < W; x += 64) g.fillRect(x, 0, 18, floorY);
  // 창문 (왼쪽 위 빛의 출처) + 커튼
  rr(g, 70, 470, 300, 380, 14, "#f8e8c4", 9);
  g.fillStyle = "#ffd98a"; g.fillRect(84, 484, 272, 352);
  g.strokeStyle = INK2; g.lineWidth = 7; g.beginPath(); g.moveTo(220, 476); g.lineTo(220, 844); g.moveTo(76, 660); g.lineTo(364, 660); g.stroke();
  [[30, 90], [330, 90]].forEach(([x, w]) => { g.beginPath(); g.moveTo(x, 440); g.quadraticCurveTo(x + w / 2, 660, x + (x < 200 ? 10 : w - 10), 900); g.lineTo(x + (x < 200 ? -20 : w + 20), 900); g.quadraticCurveTo(x + w / 2 - 20, 660, x, 440); g.fillStyle = "#e07b5f"; g.fill(); g.lineWidth = 7; g.stroke(); });
  rr(g, 10, 426, 430, 26, 13, "#7a4a32", 6);
  // 액자 (가족사진)
  rr(g, 760, 520, 220, 170, 10, "#8a5a3a", 8);
  rr(g, 782, 542, 176, 126, 6, "#f4e6c8", 5);
  [[840, "#c86b8a"], [900, "#ef6f5e"]].forEach(([x, c]) => { g.fillStyle = c as string; g.beginPath(); g.ellipse(x as number, 640, 24, 30, 0, Math.PI, 0); g.fill(); g.fillStyle = "#f4d0b0"; g.beginPath(); g.arc(x as number, 598, 18, 0, Math.PI * 2); g.fill(); });
  // 걸레받이
  g.fillStyle = "#f2e6d4"; g.fillRect(0, floorY - 40, W, 40); g.strokeStyle = INK2; g.lineWidth = 7; g.beginPath(); g.moveTo(0, floorY - 40); g.lineTo(W, floorY - 40); g.stroke();
  // 마루: 원근감 있는 판자 줄
  const fl = g.createLinearGradient(0, floorY, 0, H);
  fl.addColorStop(0, "#c98f5c"); fl.addColorStop(1, "#b0784a");
  g.fillStyle = fl; g.fillRect(0, floorY, W, H - floorY);
  g.strokeStyle = "rgba(90,50,24,0.35)"; g.lineWidth = 4;
  for (let i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(540 + i * 70, floorY); g.lineTo(540 + i * 210, H); g.stroke(); }
  g.beginPath(); g.moveTo(0, floorY); g.lineTo(W, floorY); g.lineWidth = 7; g.strokeStyle = INK2; g.stroke();
  // 창문에서 바닥으로 떨어지는 빛 (사다리꼴, 아주 옅게)
  g.fillStyle = "rgba(255,232,170,0.22)";
  g.beginPath(); g.moveTo(84, floorY); g.lineTo(356, floorY); g.lineTo(640, H); g.lineTo(220, H); g.closePath(); g.fill();
  // 소파 (오른쪽 뒤) + 긴 그림자
  g.fillStyle = "rgba(60,30,20,0.18)"; g.beginPath(); g.ellipse(950, 1170, 200, 26, 0, 0, Math.PI * 2); g.fill();
  rr(g, 800, 880, 340, 200, 40, "#d9704f", 9);
  rr(g, 780, 980, 370, 170, 36, "#e8805e", 9);
  // 스탠드 조명 (왼쪽)
  g.strokeStyle = INK2; g.lineWidth = 12; g.beginPath(); g.moveTo(470, 820); g.lineTo(470, 1150); g.stroke();
  g.lineWidth = 8; g.beginPath(); g.moveTo(470, 820); g.lineTo(470, 1150); g.strokeStyle = "#6a4a3a"; g.stroke();
  g.beginPath(); g.moveTo(400, 820); g.lineTo(540, 820); g.lineTo(510, 710); g.lineTo(430, 710); g.closePath(); g.fillStyle = "#f8e2b0"; g.fill(); g.lineWidth = 8; g.strokeStyle = INK2; g.stroke();
  rr(g, 420, 1142, 100, 18, 9, "#6a4a3a", 6);
}

const person = (g: G, C: Cast, P: Pose2, cx: number, footY: number, s: number) => {
  // 접촉 그림자: 빛이 왼쪽 위라 오른쪽으로 살짝 길게
  g.fillStyle = "rgba(50,24,14,0.28)";
  g.beginPath(); g.ellipse(cx + 34 * s, footY, 150 * s, 24 * s, 0, 0, Math.PI * 2); g.fill();
  const c = document.createElement("canvas"); c.width = 600; c.height = 1000;
  drawCast(c.getContext("2d")!, C, P);
  g.drawImage(c, cx - 300 * s, footY - 975 * s, 600 * s, 1000 * s);
};

function bubble(g: G, text: string, cx: number, cy: number) {
  g.font = `900 92px ${FONT}`;
  const w = g.measureText(text).width + 110, h = 150;
  g.save(); g.translate(6, 8); g.fillStyle = "rgba(40,20,20,0.25)"; g.beginPath(); g.roundRect(cx - w / 2, cy - h / 2, w, h, 40); g.fill(); g.restore();
  g.beginPath(); g.roundRect(cx - w / 2, cy - h / 2, w, h, 40);
  g.moveTo(cx - 26, cy + h / 2); g.lineTo(cx, cy + h / 2 + 46); g.lineTo(cx + 26, cy + h / 2);
  g.fillStyle = "#ffd23a"; g.fill(); g.lineWidth = 10; g.strokeStyle = INK2; g.lineJoin = "round"; g.stroke();
  g.fillStyle = INK2; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, cx, cy + 6);
}

export const SceneB: React.FC<{ ourMom: string }> = ({ ourMom }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [h] = useState(() => delayRender());
  useEffect(() => {
    const run = async () => {
      try { await document.fonts.load(`900 92px ${FONT}`, ourMom); } catch { /* 글꼴이 없어도 그림은 그림 */ }
      const g = ref.current!.getContext("2d")!;
      room(g);
      // 가족: 뒤(엄마) → 양옆(아빠, 할머니) → 앞(아이)
      person(g, MOM2, { face: "grin", armL: 150, armR: 150, bendL: 0, bendR: 0, blush: 0.8 }, 540, 1230, 0.92);
      person(g, DAD2, { face: "grin", armR: 105, bendR: -35, look: 0.9 }, 215, 1300, 0.9);
      person(g, GRAN2, { face: "grin", armL: 105, bendL: -35, look: -0.9 }, 870, 1300, 0.9);
      person(g, KID2, { face: "grin", armR: 135, bendR: -10, blush: 0.6 }, 540, 1420, 1.0);
      bubble(g, ourMom, 540, 250);
      grain(g, 0.045);
      continueRender(h);
    };
    run();
  }, [h, ourMom]);
  return <canvas ref={ref} width={W} height={H} />;
};
