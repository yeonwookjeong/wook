// EP06 "'나' 대신 '우리'" — Fable 화풍 (SceneFable05 와 같은 조명·후처리 방식).
//  모든 박자는 t(0→1) 에 맞춘다. 글자는 전부 words 또는 한국어 간판.
import { ThreeCanvas } from "@remotion/three";
import { loadFont } from "@remotion/google-fonts/NotoSansKR";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, useVideoConfig } from "remotion";
import * as THREE from "three";
import { CamSet, Card, InkBall, InkBox, InkCyl, Person, V3, glowTex, inkMat, lerp3, painted, popIn, rng, seg, sstep } from "../kit";
import { GUY2, HIM, INK, Look, ME, Pose, RIVAL, canvasTexture } from "../toonkr";
import { Glow, Post, drawBeam, drawSpark } from "./NurseryFable";

export type Mode06F = "onlychild" | "ours" | "group" | "company" | "everywhere" | "end";
export type Words06F = { lang: "en" | "es"; my: string; our: string; myMom: string; ourMom: string; house: string; school: string; country: string; myCo: string; ourCo: string; boss: string };
export const ORDER06F: Mode06F[] = ["onlychild", "ours", "group", "company", "everywhere", "end"];

const { fontFamily } = loadFont();
const F = `"${fontFamily}", Arial, sans-serif`;
type G = CanvasRenderingContext2D;
const DUR: Record<Mode06F, number> = { onlychild: 3.6, ours: 3.6, group: 4.9, company: 4.2, everywhere: 2.1, end: 2.4 };
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const pop = (t: number, a: number, d = 0.07) => popIn(t, a, a + d);
const pulse = (t: number, a: number, d = 0.08) => { const x = (t - a) / d; return x <= 0 || x >= 1 ? 0 : Math.sin(x * Math.PI); };

// ---------------------------------------------------------------- 그림
const fit = (g: G, s: string, size: number, w: number, weight = "900") => {
  let k = size;
  g.font = `${weight} ${k}px ${F}`;
  while (g.measureText(s).width > w && k > 12) { k -= 2; g.font = `${weight} ${k}px ${F}`; }
  return k;
};
const text = (g: G, s: string, x: number, y: number, size: number, w: number, c: string) => {
  const k = fit(g, s, size, w);
  g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = c;
  g.fillText(s, x, y + k * 0.04);
};
/** 길면 두 줄로 나눠 크게 쓴다 */
const text2 = (g: G, s: string, x: number, y: number, size: number, w: number, c: string, lineH: number) => {
  const one = fit(g, s, size, w);
  const sp = s.split(" ");
  if (one >= size * 0.72 || sp.length < 2) return text(g, s, x, y, size, w, c);
  let best = 1, bd = 1e9;
  for (let i = 1; i < sp.length; i++) { const d = Math.abs(sp.slice(0, i).join(" ").length - sp.slice(i).join(" ").length); if (d < bd) { bd = d; best = i; } }
  const a = sp.slice(0, best).join(" "), b = sp.slice(best).join(" ");
  const k = Math.min(fit(g, a, size * 0.8, w), fit(g, b, size * 0.8, w), lineH);
  text(g, a, x, y - k * 0.56, k, w, c);
  text(g, b, x, y + k * 0.56, k, w, c);
};
/** 말풍선 (640x380, 꼬리 아래) */
const drawBubble = (g: G, s: string, bg: string, fg: string, crack = false) => {
  g.clearRect(0, 0, 640, 380);
  g.lineJoin = "round"; g.lineCap = "round";
  g.beginPath(); g.moveTo(280, 262); g.lineTo(318, 352); g.lineTo(372, 262); g.closePath();
  g.fillStyle = bg; g.fill(); g.lineWidth = 14; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.roundRect(24, 24, 592, 246, 70); g.fillStyle = bg; g.fill(); g.stroke();
  g.fillStyle = bg; g.fillRect(288, 250, 76, 26);
  text2(g, s, 320, 148, 120, 510, fg, 100);
  if (crack) {
    g.strokeStyle = INK; g.lineWidth = 9;
    g.beginPath(); g.moveTo(300, 22); g.lineTo(340, 80); g.lineTo(296, 132); g.lineTo(352, 190); g.lineTo(310, 236); g.lineTo(330, 272); g.stroke();
    g.lineWidth = 6;
    g.beginPath(); g.moveTo(340, 80); g.lineTo(410, 96); g.moveTo(296, 132); g.lineTo(220, 150); g.moveTo(352, 190); g.lineTo(430, 214); g.stroke();
  }
};
/** 꼬리표 (600x220, 꼬리 아래) */
const drawTagLabel = (g: G, s: string, bg: string, fg = "#ffffff") => {
  g.clearRect(0, 0, 600, 220);
  g.lineJoin = "round";
  g.beginPath(); g.moveTo(270, 150); g.lineTo(300, 204); g.lineTo(330, 150); g.closePath();
  g.fillStyle = bg; g.fill(); g.lineWidth = 12; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.roundRect(20, 20, 560, 136, 40); g.fillStyle = bg; g.fill(); g.stroke();
  g.fillStyle = bg; g.fillRect(278, 140, 44, 22);
  text(g, s, 300, 88, 84, 500, fg);
};
/** 큰 낱말 카드 (480x320). cross = 빨간 가위표 */
const drawWord = (g: G, s: string, bg: string, fg: string, cross = false) => {
  g.clearRect(0, 0, 480, 320);
  g.lineJoin = "round"; g.lineCap = "round";
  g.beginPath(); g.roundRect(22, 22, 436, 276, 44); g.fillStyle = bg; g.fill(); g.lineWidth = 16; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.roundRect(44, 44, 392, 232, 28); g.lineWidth = 6; g.strokeStyle = "rgba(255,255,255,0.55)"; g.stroke();
  text(g, s, 240, 160, 170, 360, fg);
  if (cross) {
    [[20, INK], [10, "#e2343a"]].forEach(([w, c]) => {
      g.lineWidth = w as number; g.strokeStyle = c as string;
      g.beginPath(); g.moveTo(70, 70); g.lineTo(410, 250); g.moveTo(410, 70); g.lineTo(70, 250); g.stroke();
    });
  }
};
const drawQ = (g: G) => {
  g.clearRect(0, 0, 400, 480);
  g.lineJoin = "round"; g.lineCap = "round";
  const path = () => { g.beginPath(); g.arc(200, 160, 88, Math.PI * 1.05, Math.PI * 0.5); g.lineTo(200, 300); };
  path(); g.lineWidth = 92; g.strokeStyle = INK; g.stroke();
  const gr = g.createLinearGradient(0, 60, 0, 420); gr.addColorStop(0, "#fff0a0"); gr.addColorStop(1, "#ffb02e");
  path(); g.lineWidth = 62; g.strokeStyle = gr; g.stroke();
  g.beginPath(); g.arc(200, 400, 38, 0, Math.PI * 2); g.fillStyle = INK; g.fill();
  g.beginPath(); g.arc(200, 400, 24, 0, Math.PI * 2); g.fillStyle = gr; g.fill();
};
/** 명패 (520x170) */
const drawPlate = (g: G, s: string) => {
  g.clearRect(0, 0, 520, 170);
  g.lineJoin = "round";
  g.beginPath(); g.moveTo(40, 150); g.lineTo(70, 24); g.lineTo(450, 24); g.lineTo(480, 150); g.closePath();
  const gr = g.createLinearGradient(0, 20, 0, 150); gr.addColorStop(0, "#ffe9a0"); gr.addColorStop(1, "#d99a2a");
  g.fillStyle = gr; g.fill(); g.lineWidth = 12; g.strokeStyle = INK; g.stroke();
  text(g, s, 260, 88, 92, 330, "#3a2410");
};
/** 한반도 지도 표지 (400x520): 국기 대신 중립적인 나라 그림 */
const drawKoreaMap = (g: G) => {
  g.clearRect(0, 0, 400, 520);
  g.lineJoin = "round";
  g.beginPath(); g.roundRect(20, 20, 360, 480, 46);
  const sea = g.createLinearGradient(0, 20, 0, 500); sea.addColorStop(0, "#bfe6ff"); sea.addColorStop(1, "#8fc8f4");
  g.fillStyle = sea; g.fill(); g.lineWidth = 14; g.strokeStyle = INK; g.stroke();
  const P: [number, number][] = [[178, 62], [214, 54], [250, 74], [286, 60], [300, 84], [276, 112], [252, 138], [240, 168], [262, 190], [280, 226], [296, 268], [304, 318], [292, 368], [264, 404], [226, 420], [190, 432], [166, 414], [152, 376], [160, 336], [148, 300], [128, 276], [142, 240], [120, 214], [102, 204], [118, 172], [98, 140], [126, 124], [150, 96]];
  g.beginPath(); P.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
  const land = g.createLinearGradient(0, 60, 0, 430); land.addColorStop(0, "#9be08a"); land.addColorStop(1, "#58b86a");
  g.fillStyle = land; g.fill(); g.lineWidth = 11; g.stroke();
  g.beginPath(); g.ellipse(176, 462, 24, 11, 0, 0, Math.PI * 2); g.fillStyle = "#58b86a"; g.fill(); g.lineWidth = 8; g.stroke();
  // 하트 핀
  const x = 214, y = 250, s = 30;
  g.beginPath(); g.moveTo(x, y + s * 0.9);
  g.bezierCurveTo(x - s * 1.5, y - s * 0.2, x - s * 0.6, y - s * 1.2, x, y - s * 0.35);
  g.bezierCurveTo(x + s * 0.6, y - s * 1.2, x + s * 1.5, y - s * 0.2, x, y + s * 0.9);
  g.fillStyle = "#ff6f7f"; g.fill(); g.lineWidth = 8; g.stroke();
};
const drawHouseFront = (g: G) => {
  g.clearRect(0, 0, 400, 280);
  g.lineJoin = "round"; g.strokeStyle = INK; g.lineWidth = 10;
  g.beginPath(); g.roundRect(160, 110, 80, 160, 10); g.fillStyle = "#b86a3a"; g.fill(); g.stroke();
  g.beginPath(); g.arc(224, 196, 7, 0, Math.PI * 2); g.fillStyle = "#ffd76a"; g.fill();
  [[40, 90], [280, 90]].forEach(([x, y]) => {
    g.beginPath(); g.roundRect(x, y, 80, 80, 8); g.fillStyle = "#ffe9a0"; g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x + 40, y); g.lineTo(x + 40, y + 80); g.moveTo(x, y + 40); g.lineTo(x + 80, y + 40); g.lineWidth = 7; g.stroke(); g.lineWidth = 10;
  });
};
const drawSchoolFront = (g: G) => {
  g.clearRect(0, 0, 800, 400);
  g.lineJoin = "round"; g.strokeStyle = INK; g.lineWidth = 9;
  for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) {
    if (r === 1 && (c === 2 || c === 3)) continue;
    g.beginPath(); g.roundRect(46 + c * 122, 96 + r * 136, 86, 86, 8); g.fillStyle = "#bfe6ff"; g.fill(); g.stroke();
  }
  g.beginPath(); g.roundRect(320, 226, 160, 166, 10); g.fillStyle = "#6f8fb0"; g.fill(); g.stroke();
  g.beginPath(); g.moveTo(400, 226); g.lineTo(400, 392); g.stroke();
  g.beginPath(); g.roundRect(300, 16, 200, 64, 14); g.fillStyle = "#fff6e0"; g.fill(); g.stroke();
  g.font = `900 46px ${F}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = INK; g.fillText("학교", 400, 50);
};
const drawClockMini = (g: G) => {
  g.clearRect(0, 0, 128, 128);
  g.beginPath(); g.arc(64, 64, 54, 0, Math.PI * 2); g.fillStyle = "#fffaf0"; g.fill(); g.lineWidth = 10; g.strokeStyle = INK; g.stroke();
  g.lineCap = "round"; g.lineWidth = 8; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 30); g.moveTo(64, 64); g.lineTo(88, 72); g.stroke();
};
/** 한국식 간판 (가로 640x200 / 세로 220x640) */
const drawShopSign = (g: G, s: string, bg: string, fg: string, vertical = false, icon?: "cross") => {
  const W = vertical ? 220 : 640, H = vertical ? 640 : 200;
  g.clearRect(0, 0, W, H);
  g.lineJoin = "round";
  g.beginPath(); g.roundRect(16, 16, W - 32, H - 32, 26); g.fillStyle = bg; g.fill(); g.lineWidth = 14; g.strokeStyle = INK; g.stroke();
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
  if (vertical) {
    const ch = [...s.replace(/ /g, "")];
    const size = Math.min(130, (H - 90) / ch.length);
    g.font = `900 ${size}px ${F}`;
    ch.forEach((c, i) => g.fillText(c, W / 2, 60 + size * 0.5 + i * ((H - 120) / ch.length)));
  } else {
    const tx0 = icon ? 110 : 0;
    const k = fit(g, s, 120, W - 90 - tx0);
    g.fillText(s, W / 2 + tx0 / 2, H / 2 + k * 0.04);
    if (icon === "cross") { g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(48, 56, 88, 88, 16); g.fill(); g.fillStyle = "#1f9d6f"; g.fillRect(80, 68, 24, 64); g.fillRect(60, 88, 64, 24); }
  }
};
const drawSkyline = (g: G, c: string, seed: number, lit: number, hMax = 300) => {
  const r = rng(seed);
  g.clearRect(0, 0, 1024, 512);
  let x = -10;
  while (x < 1024) {
    const w = 60 + r() * 90, h = 110 + r() * hMax;
    g.fillStyle = c; g.fillRect(x, 512 - h, w, h);
    for (let yy = 512 - h + 16; yy < 500; yy += 26) for (let xx = x + 10; xx < x + w - 14; xx += 20) if (r() < lit) { g.fillStyle = "rgba(255,226,160,0.9)"; g.fillRect(xx, yy, 9, 12); g.fillStyle = c; }
    x += w + 2;
  }
};
const drawSky = (g: G, stops: [number, string][], clouds = 0) => {
  const gr = g.createLinearGradient(0, 0, 0, 512);
  stops.forEach(([a, c]) => gr.addColorStop(a, c));
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  const r = rng(9);
  g.fillStyle = "rgba(255,255,255,0.9)";
  for (let k = 0; k < clouds; k++) { const x = r() * 1024, y = 90 + r() * 220; for (let q = 0; q < 5; q++) { g.beginPath(); g.ellipse(x + (q - 2) * 34, y + (q % 2) * 10, 44, 26, 0, 0, Math.PI * 2); g.fill(); } }
};
/** 가족사진 액자: 엄마와 아이 둘뿐 */
const drawPhoto = (g: G) => {
  g.clearRect(0, 0, 300, 240);
  g.lineJoin = "round";
  g.beginPath(); g.roundRect(14, 14, 272, 212, 14); g.fillStyle = "#8a5a3a"; g.fill(); g.lineWidth = 10; g.strokeStyle = INK; g.stroke();
  g.fillStyle = "#ffe9c9"; g.fillRect(36, 36, 228, 168);
  const head = (x: number, y: number, r: number, hair: string, top: string) => {
    g.fillStyle = top; g.beginPath(); g.roundRect(x - r * 0.8, y + r * 0.7, r * 1.6, 204 - (y + r * 0.7), 12); g.fill(); g.lineWidth = 6; g.stroke();
    g.fillStyle = hair; g.beginPath(); g.arc(x, y - 4, r + 7, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#f6d3b5"; g.beginPath(); g.arc(x, y + 4, r, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.arc(x, y + 8, r * 0.4, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  };
  head(118, 104, 34, "#5a3424", "#c86b8a");
  head(192, 132, 26, "#231a1e", "#ef6f5e");
};

// ---------------------------------------------------------------- 공용 부품
const Guy: React.FC<{ look: Look; pose: Pose; feet: V3; cam: V3; s?: number; bob?: number; flipX?: boolean; tint?: string; shadow?: number }> = ({ look, pose, feet, cam, s = 1, bob = 0, flipX, tint, shadow = 0.3 }) => (
  <group>
    {shadow > 0 && (
      <mesh position={[feet[0], feet[1] + 0.016, feet[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.5, 1]}>
        <circleGeometry args={[0.2 * s, 24]} />
        <meshBasicMaterial color="#1a0f18" transparent opacity={shadow} depthWrite={false} />
      </mesh>
    )}
    <Person look={look} pose={pose} feet={feet} cam={cam} scale={s} bob={bob} flipX={flipX} tint={tint} />
  </group>
);
const Decal: React.FC<{ tex: THREE.Texture; p: V3; w: number; h: number; r?: V3; tint?: string; k?: number; scale?: number }> = ({ tex, p, w, h, r, tint = "#ffffff", k = 1, scale = 1 }) => {
  const col = useMemo(() => new THREE.Color(tint).multiplyScalar(k), [tint, k]);
  if (scale < 0.01) return null;
  return (
    <mesh position={p} rotation={r} scale={scale}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} transparent alphaTest={0.4} color={col} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
};
const Sky: React.FC<{ tex: THREE.Texture; z: number; w?: number; h?: number; y?: number; k?: number }> = ({ tex, z, w = 36, h = 16, y = 5.4, k = 1 }) => {
  const col = useMemo(() => new THREE.Color("#fff").multiplyScalar(k), [k]);
  return (
    <mesh position={[0, y, z]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} color={col} toneMapped={false} fog={false} />
    </mesh>
  );
};
const Floor: React.FC<{ tex?: THREE.Texture; c?: string; size?: number; rough?: number; z?: number }> = ({ tex, c = "#ffffff", size = 12, rough = 0.5, z = 0 }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, z]} receiveShadow>
    <planeGeometry args={[size, size]} />
    <meshStandardMaterial map={tex} color={c} roughness={rough} metalness={0.02} />
  </mesh>
);
const woodFloor = () => {
  const floor = painted(1024, 1024, "#c99a68", (g) => {
    g.strokeStyle = "rgba(90,50,20,0.35)"; g.lineWidth = 4;
    for (let y = 0; y <= 1024; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
    for (let y = 0; y < 1024; y += 128) for (let x = (y / 128) % 2 ? 180 : 520; x < 1024; x += 680) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 128); g.stroke(); }
  }, 7);
  floor.wrapS = floor.wrapT = THREE.RepeatWrapping; floor.repeat.set(3, 3);
  return floor;
};
const tealWall = () => canvasTexture(1024, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, "#3f6a78"); gr.addColorStop(0.5, "#6f9c9a"); gr.addColorStop(1, "#a9c8b8");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = "rgba(255,255,255,0.10)";
  for (let x = 0; x < 1024; x += 48) g.fillRect(x, 0, 6, 512);
});
/** 삼각 지붕 (x 방향으로 긴 삼각기둥) */
const Roof: React.FC<{ p: V3; r: number; len: number; c: string; flat?: number }> = ({ p, r, len, c, flat = 0.7 }) => {
  const geo = useMemo(() => new THREE.CylinderGeometry(r, r, len, 3), [r, len]);
  return (
    <group position={p} scale={[1, flat, 1]} rotation={[-Math.PI / 2, 0, 0]}>
      <group rotation={[0, 0, Math.PI / 2]}>
        <mesh geometry={geo} castShadow>
          <meshStandardMaterial color={c} roughness={0.8} />
        </mesh>
        <mesh geometry={geo} material={inkMat(0.014)} />
      </group>
    </group>
  );
};
/** 거실 (onlychild · group · end 공용) */
const LivingRoom: React.FC<{ tx: { floor: THREE.Texture; wall: THREE.Texture; warm: THREE.Texture; white: THREE.Texture; photo: THREE.Texture }; T: number; bright?: number; sofaX?: number }> = ({ tx, T, bright = 0.6, sofaX = 1.0 }) => (
  <>
    <color attach="background" args={["#1c1a2a"]} />
    <fogExp2 attach="fog" args={["#2a2438", 0.04]} />
    <hemisphereLight args={["#c8d0f0", "#5a3a30", bright]} />
    <spotLight position={[0.6, 3.0, 1.8]} angle={0.55} penumbra={0.9} intensity={40} decay={1.6} distance={8} color="#ffd6a0" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0008} shadow-normalBias={0.02}>
      <object3D attach="target" position={[0, 0.5, 0]} />
    </spotLight>
    <pointLight position={[-0.95, 1.1, -0.9]} intensity={3.2} distance={4} decay={1.5} color="#ffb060" />
    <pointLight position={[1.3, 1.3, -0.4]} intensity={1.4} distance={4} decay={1.5} color="#ff8fb0" />
    <Floor tex={tx.floor} size={9} rough={0.45} />
    <InkBox p={[0, 1.6, -1.6]} s={[7, 3.2, 0.12]} c="#ffffff" map={tx.wall} th={0.01} />
    <InkBox p={[0, 0.09, -1.52]} s={[7, 0.18, 0.05]} c="#fff0dc" th={0.008} />
    <InkBox p={[sofaX, 0.24, -1.05]} s={[1.3, 0.3, 0.6]} c="#e2806a" th={0.012} round={0.06} />
    <InkBox p={[sofaX, 0.56, -1.3]} s={[1.3, 0.5, 0.18]} c="#e2806a" th={0.012} round={0.06} />
    <InkBox p={[sofaX - 0.3, 0.5, -1.12]} s={[0.3, 0.26, 0.1]} c="#ffcf6a" th={0.01} round={0.05} r={[0, 0, 0.2]} />
    <InkCyl p={[-0.95, 0.55, -1.2]} r={0.012} h={1.1} c="#5a4638" th={0.006} seg={8} />
    <InkCyl p={[-0.95, 0.015, -1.2]} r={0.11} h={0.03} c="#5a4638" th={0.006} />
    <InkCyl p={[-0.95, 1.2, -1.2]} r={0.1} r2={0.17} h={0.24} c="#ffd9a0" th={0.01} e="#ff9a40" />
    <Glow tex={tx.warm} p={[-0.95, 1.2, -1.1]} w={1.5} h={1.5} o={0.55} />
    <Decal tex={tx.photo} p={[-0.42, 1.02, -1.52]} w={0.36} h={0.288} tint="#e8d8c8" />
    {Array.from({ length: 13 }, (_, i) => {
      const x = -1.5 + i * 0.25, y = 2.3 - Math.sin((i / 12) * Math.PI) * 0.14;
      return (
        <group key={i}>
          <mesh position={[x, y, -1.5]}>
            <sphereGeometry args={[0.028, 10, 8]} />
            <meshBasicMaterial color={new THREE.Color(["#ffd76a", "#ff8fa6", "#8fe0ff", "#b8ff9a"][i % 4]).multiplyScalar(1.5 + 0.5 * Math.sin(T * 2 + i))} toneMapped={false} />
          </mesh>
          <Glow tex={tx.white} p={[x, y, -1.47]} w={0.28} h={0.28} o={0.3} />
        </group>
      );
    })}
  </>
);
const useRoomTex = () => useMemo(() => ({ floor: woodFloor(), wall: tealWall(), warm: glowTex("255,196,130"), white: glowTex("255,244,225"), gold: glowTex("255,200,90"), photo: canvasTexture(300, 240, drawPhoto), sparks: ["#ffd23a", "#ff7fa8", "#7fe0ff"].map((c) => canvasTexture(256, 256, (g) => drawSpark(g, c))) }), []);

const MOM: Look = { skin: "#f4d0b0", hair: "long", hairC: "#5a3424", top: "#c86b8a", bottom: "#4a4a6a", shoes: "#8a5a3a" };
const GRAN: Look = { skin: "#eac4a2", hair: "bob", hairC: "#c4c0c8", top: "#8a6a9a", bottom: "#4a4658", shoes: "#3a3030", glasses: true };
const SUIT: Look = { ...ME, top: "#2b3558", bottom: "#2b3558", shoes: "#1e1a1c" };
const BW = 0.6, BH = 0.356; // 말풍선
const RED = "#e2343a", BLUE = "#3b6fb6", GOLD = "#ffb52e", GREY = "#b9bcc8";

// ================================================================ 0. 외동 + 엄마
const OnlyChild: React.FC<{ t: number; w: Words06F }> = ({ t, w }) => {
  const T = t * DUR.onlychild;
  const room = useRoomTex();
  const tx = useMemo(() => ({
    my: canvasTexture(640, 380, (g) => drawBubble(g, w.myMom, "#ffffff", INK)),
    myCrack: canvasTexture(640, 380, (g) => drawBubble(g, w.myMom, "#e9e4ea", "#8a8490", true)),
    our: canvasTexture(640, 380, (g) => drawBubble(g, w.ourMom, "#ffd23a", INK)),
    red: glowTex("255,80,90"), cyan: glowTex("90,220,255"),
  }), [w]);
  const k = sstep(t);
  const cam: V3 = lerp3([0, 1.08, 4.05], [0, 1.05, 3.45], k * 0.6 + t * 0.4);
  const crack = t >= 0.62, gone = t >= 0.7, ours = t >= 0.72;
  const jit = crack && !gone ? Math.sin(t * 900) * 0.022 : 0;
  const bx = 0.2, by = 1.5;
  const sMy = gone ? 0 : pop(t, 0.12, 0.1) * (crack ? 1 - 0.5 * clamp01((t - 0.66) / 0.04) : 1);
  const sOur = pop(t, 0.72, 0.09);
  const kid: Pose = ours ? { armL: 20, armR: 60, mouth: "o", brow: 0.9, look: 0.9 } : { armL: 14, armR: t > 0.1 ? 112 : 14, mouth: "grin", look: 0.9, blush: 0.6, blink: Math.floor(T * 30) % 80 > 76 };
  const mom: Pose = ours ? { armL: 24, armR: 14, mouth: "grin", blush: 0.7, look: -0.6 } : { armL: 14, armR: 14, mouth: "smile", blush: 0.5, look: -0.6, blink: Math.floor(T * 30 + 30) % 90 > 86 };
  return (
    <>
      <CamSet p={cam} t={[0, 0.88, 0]} fov={35} />
      <LivingRoom tx={room} T={T} sofaX={1.15} />
      {/* 아이 물건은 하나씩뿐: 작은 의자 하나, 공 하나 */}
      <InkBox p={[-0.92, 0.15, 0.1]} s={[0.26, 0.04, 0.26]} c="#6fb8ff" th={0.008} />
      {[[-0.11, -0.11], [0.11, -0.11], [-0.11, 0.11], [0.11, 0.11]].map(([a, b], i) => <InkCyl key={i} p={[-0.92 + a, 0.065, 0.1 + b]} r={0.014} h={0.13} c="#fff0dc" th={0.005} seg={8} />)}
      <InkBox p={[-0.92, 0.31, -0.02]} s={[0.26, 0.28, 0.03]} c="#6fb8ff" th={0.008} />
      <InkBall p={[0.85, 0.09, 0.45]} r={0.09} c="#ffd23a" th={0.008} detail={2} />
      <Guy look={ME} pose={kid} feet={[-0.3, 0, 0.15]} cam={cam} s={0.86} bob={Math.abs(Math.sin(T * 2.4)) * 0.008 + pulse(t, 0.72, 0.1) * 0.03} />
      <Guy look={MOM} pose={mom} feet={[0.26, 0, -0.05]} cam={cam} s={1.2} bob={Math.abs(Math.sin(T * 2 + 1)) * 0.005} />
      {/* 말풍선: MY MOM → 깨짐 → OUR MOM */}
      {sMy > 0.01 && (
        <>
          {crack && <Card tex={tx.myCrack} at={[bx + jit * 2, by, 0.0]} w={BW} h={BH} cam={cam} tint="#ff6a7a" opacity={0.5} scale={sMy} />}
          {crack && <Card tex={tx.myCrack} at={[bx - jit * 2, by + jit, 0.01]} w={BW} h={BH} cam={cam} tint="#6ae0ff" opacity={0.5} scale={sMy} />}
          <Card tex={crack ? tx.myCrack : tx.my} at={[bx + jit, by + Math.sin(T * 2) * 0.008 - jit * 0.5, 0.02]} w={BW} h={BH} cam={cam} scale={sMy} rotZ={jit * 2} tint="#ffffff" />
        </>
      )}
      {t >= 0.68 && t < 0.86 && [0, 1, 2, 3, 4, 5, 6].map((i) => {
        const a = (t - 0.68) / 0.18, ang = (i / 7) * Math.PI * 2 + 0.4, r = 0.1 + a * 0.42;
        return <Glow key={i} tex={room.sparks[i % 3]} p={[bx + Math.cos(ang) * r, by + Math.sin(ang) * r * 0.7, 0.08]} w={0.13} h={0.13} o={1 - a} k={2.2} />;
      })}
      {sOur > 0.01 && (
        <>
          <Glow tex={room.gold} p={[bx, by, -0.05]} w={1.5} h={1.2} o={0.4 + 0.5 * pulse(t, 0.72, 0.14)} />
          <Card tex={tx.our} at={[bx, by + Math.sin(T * 2) * 0.008, 0.03]} w={BW} h={BH} cam={cam} scale={sOur * 1.06} rotZ={Math.sin(T * 3) * 0.02} tint="#ffffff" />
        </>
      )}
      <Post focus={Math.hypot(cam[1] - 0.9, cam[2])} range={2.8} bloom={0.55} />
    </>
  );
};

// ================================================================ 1. 우리 집 · 우리 학교 · 우리나라
const Ours: React.FC<{ t: number; w: Words06F }> = ({ t, w }) => {
  const T = t * DUR.ours;
  const tx = useMemo(() => ({
    sky: canvasTexture(1024, 512, (g) => drawSky(g, [[0, "#5e9fe0"], [0.7, "#bfe0f6"], [1, "#eef7fb"]], 6)),
    grass: painted(512, 512, "#8fd07a", undefined, 4),
    house: canvasTexture(400, 280, drawHouseFront),
    school: canvasTexture(800, 400, drawSchoolFront),
    clock: canvasTexture(128, 128, drawClockMini),
    map: canvasTexture(400, 520, drawKoreaMap),
    tags: [w.house, w.school, w.country].map((s, i) => canvasTexture(600, 220, (g) => drawTagLabel(g, s, [RED, BLUE, "#2f9d7a"][i]))),
    my: canvasTexture(480, 320, (g) => drawWord(g, w.my, "#eef0f6", "#4a4c5a", true)),
    our: canvasTexture(480, 320, (g) => drawWord(g, w.our, "#ffd23a", INK)),
    gold: glowTex("255,210,110"), white: glowTex("255,250,240"),
    sparks: ["#ffd23a", "#ff7fa8", "#7fe0ff"].map((c) => canvasTexture(256, 256, (g) => drawSpark(g, c))),
  }), [w]);
  const k = sstep(t);
  const cam: V3 = lerp3([0, 1.5, 5.1], [0, 1.45, 4.6], k * 0.5 + t * 0.5);
  const AT = [0.08, 0.25, 0.42];
  const item = (i: number) => pop(t, AT[i] - 0.05, 0.08);
  const big = pop(t, 0.74, 0.08), cross = pop(t, 0.7, 0.06);
  const dimK = 1 - 0.45 * seg(t, 0.68, 0.78);
  const TW = 0.52, TH = 0.19;
  return (
    <>
      <CamSet p={cam} t={[0, 1.18, -0.6]} fov={35} />
      <color attach="background" args={["#bfe0f6"]} />
      <fogExp2 attach="fog" args={["#cfe6f4", 0.025]} />
      <hemisphereLight args={["#d8ecff", "#7a9a6a", 1.0 * dimK]} />
      <directionalLight position={[3, 5, 4]} intensity={2.6 * dimK} color="#fff2d8" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0006} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} />
      <Sky tex={tx.sky} z={-16} k={dimK} />
      {/* 계단식 언덕 */}
      <Floor c="#7cc46a" size={20} rough={0.9} />
      <InkBox p={[0, 0.25, 0.45]} s={[6, 0.5, 1.0]} c="#8fd07a" th={0.014} round={0.05} />
      <InkBox p={[0, 0.45, -0.35]} s={[6, 0.9, 0.8]} c="#84c872" th={0.014} round={0.05} />
      <InkBox p={[0, 0.65, -1.25]} s={[6, 1.3, 1.2]} c="#78be68" th={0.014} round={0.05} />
      {[[-1.35, 0.5, 0.5, 0.26], [1.25, 0.9, -0.4, 0.3], [1.2, 1.3, -1.3, 0.34], [-1.3, 1.3, -1.3, 0.32]].map(([x, y, z, r], i) => (
        <group key={i}>
          <InkCyl p={[x, y + 0.14, z]} r={0.04} h={0.28} c="#6a4a3a" th={0.008} seg={8} />
          <InkBall p={[x, y + 0.28 + r * 0.8, z]} r={r} c={i % 2 ? "#5fae58" : "#6cba5e"} />
        </group>
      ))}
      {/* 집 */}
      <group position={[-0.36, 0.5, 0.45]} scale={item(0) * 0.8}>
        <InkBox p={[0, 0.2, 0]} s={[0.62, 0.4, 0.46]} c="#fff0d8" th={0.014} />
        <Roof p={[0, 0.4 + 0.11, 0]} r={0.33} len={0.74} c="#e2574c" />
        <Decal tex={tx.house} p={[0, 0.2, 0.246]} w={0.56} h={0.39} />
        <InkBox p={[0.18, 0.62, -0.05]} s={[0.08, 0.2, 0.08]} c="#b86a3a" th={0.008} />
      </group>
      {/* 학교 */}
      <group position={[0.3, 0.9, -0.3]} scale={item(1) * 0.7}>
        <InkBox p={[0, 0.27, 0]} s={[1.04, 0.54, 0.4]} c="#ffe2b0" th={0.014} />
        <InkBox p={[0, 0.57, 0]} s={[1.1, 0.06, 0.46]} c="#6f8fb0" th={0.012} />
        <InkBox p={[0, 0.72, 0]} s={[0.26, 0.26, 0.3]} c="#ffe2b0" th={0.012} />
        <Roof p={[0, 0.9, 0]} r={0.16} len={0.3} c="#6f8fb0" />
        <Decal tex={tx.school} p={[0, 0.27, 0.217]} w={1.0} h={0.5} />
        <Decal tex={tx.clock} p={[0, 0.72, 0.167]} w={0.16} h={0.16} />
      </group>
      {/* 나라: 한반도 지도 표지 */}
      <group position={[-0.32, 1.3, -1.0]} scale={item(2) * 0.8}>
        <InkCyl p={[0, 0.12, -0.03]} r={0.03} h={0.24} c="#6a4a3a" th={0.008} seg={8} />
        <Decal tex={tx.map} p={[0, 0.58, 0]} w={0.62} h={0.806} />
      </group>
      {/* OUR 꼬리표: 각자 바로 옆에 */}
      {([[0.3, 0.86, 0.5], [0.36, 1.8, -0.25], [-0.32, 2.2, -0.95]] as V3[]).map((p, i) => {
        const s = pop(t, AT[i], 0.07);
        return (
          <group key={i}>
            <Glow tex={tx.gold} p={[p[0], p[1], p[2] - 0.03]} w={1.0} h={0.7} o={0.6 * pulse(t, AT[i], 0.14)} />
            <Card tex={tx.tags[i]} at={[p[0], p[1] + Math.sin(T * 2 + i) * 0.008, p[2]]} w={TW * (1 + i * 0.08)} h={TH * (1 + i * 0.08)} cam={cam} scale={s} rotZ={(i - 1) * 0.04} tint={dimK < 0.8 ? "#c8c8d4" : "#ffffff"} />
          </group>
        );
      })}
      {/* 큰 OUR / 가위표 MY */}
      {cross > 0.01 && <Card tex={tx.my} at={[0, 1.78, 1.5]} w={0.4} h={0.267} cam={cam} scale={cross} rotZ={-0.08} tint="#ffffff" />}
      {big > 0.01 && (
        <>
          <Glow tex={tx.gold} p={[0, 1.3, 1.42]} w={1.6} h={1.3} o={0.5 + 0.4 * pulse(t, 0.74, 0.14)} />
          <Card tex={tx.our} at={[0, 1.3 + Math.sin(T * 2.4) * 0.008, 1.5]} w={0.62} h={0.413} cam={cam} scale={big} rotZ={0.03} tint="#ffffff" />
          {[0, 1, 2, 3, 4, 5].map((i) => { const a = clamp01((t - 0.74) / 0.2), ang = (i / 6) * Math.PI * 2 + 0.5, r = 0.2 + a * 0.25; return a < 1 ? <Glow key={i} tex={tx.sparks[i % 3]} p={[Math.cos(ang) * r * 1.3, 1.3 + Math.sin(ang) * r, 1.55]} w={0.1} h={0.1} o={1 - a} k={2.2} /> : null; })}
        </>
      )}
      <Post focus={big > 0.5 ? Math.hypot(cam[1] - 1.3, cam[2] - 1.5) : 4.9} range={big > 0.5 ? 2.2 : 6} bloom={0.4} vig={0.45} />
    </>
  );
};

// ================================================================ 2. 가족이 둥글게
const FAMILY: { look: Look; x: number; z: number; s: number; from: V3; flip?: boolean }[] = [
  { look: MOM, x: 0.0, z: -0.42, s: 1.16, from: [1.4, 0, -0.8] },
  { look: HIM, x: -0.5, z: -0.02, s: 1.14, from: [-1.6, 0, -0.3] },
  { look: GRAN, x: 0.5, z: -0.02, s: 1.02, from: [1.7, 0, 0.3], flip: true },
  { look: ME, x: -0.06, z: 0.46, s: 0.84, from: [-1.2, 0, 1.3] },
];
const Group: React.FC<{ t: number; w: Words06F }> = ({ t, w }) => {
  const T = t * DUR.group;
  const room = useRoomTex();
  const tx = useMemo(() => ({
    our: canvasTexture(600, 220, (g) => drawTagLabel(g, w.our, GOLD, INK)),
    ourMom: canvasTexture(640, 380, (g) => drawBubble(g, w.ourMom, "#ffd23a", INK)),
    ring: canvasTexture(512, 512, (g) => { g.clearRect(0, 0, 512, 512); g.beginPath(); g.arc(256, 256, 226, 0, Math.PI * 2); g.lineWidth = 26; g.strokeStyle = "#fff0a0"; g.stroke(); g.lineWidth = 8; g.strokeStyle = "#ffffff"; g.stroke(); }),
  }), [w]);
  const k = sstep(t);
  const cam: V3 = lerp3([0, 2.0, 4.6], [0, 1.9, 4.0], k * 0.55 + t * 0.45);
  const ring = seg(t, 0.4, 0.55);
  const label = pop(t, 0.55, 0.07) * (1 - seg(t, 0.76, 0.8));
  const momOn = pop(t, 0.8, 0.07);
  return (
    <>
      <CamSet p={cam} t={[0, 0.84, -0.1]} fov={35} />
      <LivingRoom tx={room} T={T} bright={0.7} sofaX={1.35} />
      {/* 바닥의 빛 고리 */}
      {ring > 0.01 && (
        <>
          <Glow tex={tx.ring} p={[0, 0.03, 0.02]} w={1.75 * (0.6 + 0.4 * ring)} h={1.75 * (0.6 + 0.4 * ring)} r={[-Math.PI / 2, 0, T * 0.4]} o={ring} k={1.8 + 1.5 * pulse(t, 0.55, 0.12)} />
          <Glow tex={room.gold} p={[0, 0.025, 0.02]} w={2.6} h={2.6} r={[-Math.PI / 2, 0, 0]} o={0.45 * ring} />
        </>
      )}
      {FAMILY.map((f, i) => {
        const a = sstep(clamp01((t - i * 0.04) / 0.3));
        const feet = lerp3(f.from, [f.x, 0, f.z], a);
        const walking = a < 0.98;
        const isMom = i === 0;
        const happy = t > 0.55;
        const pose: Pose = walking
          ? { walk: T * 9 + i, armL: 20, armR: 20, mouth: "smile" }
          : momOn > 0.5 && isMom
            ? { armL: 130, armR: 130, mouth: "grin", blush: 0.9 }
            : momOn > 0.5
              ? { armL: f.x < 0 ? 14 : 100, armR: f.x < 0 ? 100 : i === 3 ? 120 : 14, mouth: "grin", blush: 0.6, look: f.x < -0.1 ? 0.9 : f.x > 0.1 ? -0.9 : 0 }
              : { armL: happy ? 50 : 14, armR: happy ? 50 : 14, mouth: happy ? "grin" : "smile", blush: 0.5, blink: Math.floor(T * 30 + i * 23) % 85 > 81 };
        return <Guy key={i} look={f.look} pose={pose} feet={feet} cam={cam} s={f.s} flipX={walking ? f.from[0] > 0 : f.flip} bob={walking ? Math.abs(Math.sin(T * 9 + i)) * 0.02 : Math.abs(Math.sin(T * 2.2 + i)) * 0.006 + (isMom ? pulse(t, 0.8, 0.1) * 0.05 : 0)} />;
      })}
      {label > 0.01 && (
        <>
          <Glow tex={room.gold} p={[0, 1.62, -0.45]} w={1.4} h={1.0} o={0.5 * Math.min(1, label)} />
          <Card tex={tx.our} at={[0, 1.62 + Math.sin(T * 2) * 0.01, -0.4]} w={0.66} h={0.242} cam={cam} scale={label} tint="#ffffff" />
        </>
      )}
      {momOn > 0.01 && (
        <>
          <Glow tex={room.gold} p={[0, 1.66, -0.47]} w={1.6} h={1.2} o={0.45 + 0.4 * pulse(t, 0.8, 0.14)} />
          <Card tex={tx.ourMom} at={[0, 1.68 + Math.sin(T * 2) * 0.008, -0.4]} w={BW * 1.05} h={BH * 1.05} cam={cam} scale={momOn} tint="#ffffff" />
          {[0, 1, 2, 3, 4, 5].map((i) => { const a = clamp01((t - 0.8) / 0.18), ang = (i / 6) * Math.PI * 2 + 0.3, r = 0.25 + a * 0.25; return a < 1 ? <Glow key={i} tex={room.sparks[i % 3]} p={[Math.cos(ang) * r * 1.4, 1.68 + Math.sin(ang) * r * 0.8, -0.34]} w={0.11} h={0.11} o={1 - a} k={2.2} /> : null; })}
        </>
      )}
      <Post focus={Math.hypot(cam[1] - 0.8, cam[2])} range={3.4} bloom={0.55} />
    </>
  );
};

// ================================================================ 3-A. MY COMPANY = 사장님
const Boss: React.FC<{ u: number; w: Words06F }> = ({ u, w }) => {
  const T = u * 2.1;
  const tx = useMemo(() => ({
    floor: painted(512, 512, "#5a3a3a", undefined, 3),
    sky: canvasTexture(1024, 512, (g) => { drawSky(g, [[0, "#3a4a9a"], [0.6, "#e08a8a"], [1, "#ffcf90"]]); }),
    city: canvasTexture(1024, 512, (g) => drawSkyline(g, "#3a3560", 7, 0.3, 260)),
    label: canvasTexture(640, 380, (g) => drawBubble(g, w.myCo, "#ffffff", INK)),
    plate: canvasTexture(520, 170, (g) => drawPlate(g, w.boss)),
    gold: glowTex("255,200,90"), warm: glowTex("255,196,130"),
    sparks: ["#ffd23a", "#ffffff"].map((c) => canvasTexture(256, 256, (g) => drawSpark(g, c))),
  }), [w]);
  const k = sstep(u);
  const cam: V3 = lerp3([0, 1.12, 3.95], [0, 1.1, 3.4], k * 0.5 + u * 0.5);
  const lab = pop(u, 0.2, 0.14);
  const pose: Pose = { armL: 38, armR: 38, mouth: "smug", brow: -0.3, legs: "sit", blush: 0.3, look: Math.sin(T * 1.5) * 0.3 };
  return (
    <>
      <CamSet p={cam} t={[0, 0.92, 0]} fov={35} />
      <color attach="background" args={["#241828"]} />
      <fogExp2 attach="fog" args={["#2a1c30", 0.04]} />
      <hemisphereLight args={["#d8c8f0", "#5a3a30", 0.65]} />
      <spotLight position={[0.8, 3.0, 2.0]} angle={0.5} penumbra={0.9} intensity={42} decay={1.6} distance={8} color="#ffd6a0" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0008} shadow-normalBias={0.02}>
        <object3D attach="target" position={[0, 0.6, 0]} />
      </spotLight>
      <pointLight position={[-1.2, 1.4, -0.6]} intensity={2.4} distance={4} decay={1.5} color="#ff9a70" />
      <Floor tex={tx.floor} size={9} rough={0.35} />
      {/* 통유리 창 + 도시 */}
      <Sky tex={tx.sky} z={-9} w={22} h={10} y={3.2} />
      <Decal tex={tx.city} p={[0, 1.2, -7]} w={14} h={4.6} tint="#d8b8c8" />
      <InkBox p={[0, 0.2, -1.6]} s={[7, 0.4, 0.14]} c="#4a3440" th={0.012} />
      <InkBox p={[0, 2.75, -1.6]} s={[7, 0.5, 0.14]} c="#4a3440" th={0.012} />
      {[-1.5, -0.5, 0.5, 1.5].map((x) => <InkBox key={x} p={[x, 1.45, -1.6]} s={[0.07, 2.1, 0.1]} c="#4a3440" th={0.01} />)}
      {/* 사장 의자 */}
      <InkBox p={[0, 0.98, -0.22]} s={[0.82, 1.5, 0.14]} c="#7a2a34" th={0.016} round={0.07} />
      <InkBox p={[0, 0.3, -0.05]} s={[0.7, 0.14, 0.5]} c="#7a2a34" th={0.014} round={0.05} />
      {[-0.4, 0.4].map((x) => <InkBox key={x} p={[x, 0.55, -0.05]} s={[0.09, 0.09, 0.44]} c="#4a1820" th={0.01} round={0.03} />)}
      <InkCyl p={[0, 0.12, -0.05]} r={0.05} h={0.24} c="#3a3a44" th={0.008} />
      {/* 주인공 (정장) */}
      <Guy look={SUIT} pose={pose} feet={[0, 0.36, 0]} cam={cam} s={1.25} shadow={0} bob={Math.sin(T * 2) * 0.004} />
      {/* 큰 책상 + 명패 */}
      <InkBox p={[0, 0.64, 0.62]} s={[1.9, 0.07, 0.7]} c="#6a4028" th={0.014} round={0.02} />
      <InkBox p={[0, 0.3, 0.9]} s={[1.8, 0.6, 0.08]} c="#5a3420" th={0.014} round={0.02} />
      <InkBox p={[0, 0.69, 0.84]} s={[0.5, 0.03, 0.1]} c="#3a2410" th={0.008} round={0.01} />
      <Decal tex={tx.plate} p={[0, 0.775, 0.86]} w={0.46} h={0.15} r={[-0.25, 0, 0]} k={1.1} />
      <Glow tex={tx.gold} p={[0, 0.78, 0.9]} w={0.9} h={0.5} o={0.35} />
      <InkCyl p={[-0.62, 0.74, 0.62]} r={0.05} r2={0.04} h={0.11} c="#f4efe6" th={0.008} />
      <InkBox p={[0.62, 0.69, 0.6]} s={[0.3, 0.025, 0.22]} c="#c8ccd6" th={0.008} round={0.008} />
      {/* MY COMPANY */}
      {lab > 0.01 && (
        <>
          <Glow tex={tx.warm} p={[0, 1.78, 0.05]} w={1.4} h={1.0} o={0.35 + 0.4 * pulse(u, 0.2, 0.2)} />
          <Card tex={tx.label} at={[0, 1.8 + Math.sin(T * 2) * 0.008, 0.1]} w={BW * 1.08} h={BH * 1.08} cam={cam} scale={lab} tint="#ffffff" />
        </>
      )}
      {[0, 1, 2].map((i) => <Glow key={i} tex={tx.sparks[i % 2]} p={[[-0.33, 0.33, 0.3][i], [0.86, 0.9, 0.7][i], 0.95]} w={0.09} h={0.09} o={0.5 + 0.5 * Math.sin(T * 5 + i * 2)} k={2} />)}
      <Post focus={Math.hypot(cam[1] - 0.9, cam[2])} range={2.8} bloom={0.55} />
    </>
  );
};

// ================================================================ 3-B. OUR COMPANY = 동료들 사이
const DESKS: { look: Look; x: number; z: number; flip?: boolean }[] = [
  { look: HIM, x: -0.52, z: -0.85 },
  { look: RIVAL, x: 0.52, z: -0.85, flip: true },
  { look: SUIT, x: 0.0, z: 0.1 },
];
const Office: React.FC<{ u: number; w: Words06F }> = ({ u, w }) => {
  const T = u * 2.1;
  const tx = useMemo(() => ({
    floor: painted(512, 512, "#c8d0dc", undefined, 3),
    label: canvasTexture(640, 380, (g) => drawBubble(g, w.ourCo, "#ffd23a", INK)),
    screen: canvasTexture(128, 96, (g) => { g.fillStyle = "#dff2ff"; g.fillRect(0, 0, 128, 96); g.fillStyle = "#6fb0f0"; [14, 34, 54].forEach((y, i) => g.fillRect(12, y, 60 + i * 16, 10)); }),
    gold: glowTex("255,210,110"), cool: glowTex("190,225,255"),
    sparks: ["#ffd23a", "#ff7fa8", "#7fe0ff"].map((c) => canvasTexture(256, 256, (g) => drawSpark(g, c))),
  }), [w]);
  const k = sstep(u);
  const cam: V3 = lerp3([0, 1.62, 4.25], [0, 1.56, 3.7], k * 0.5 + u * 0.5);
  const lab = pop(u, 0.2, 0.14);
  return (
    <>
      <CamSet p={cam} t={[0, 0.98, -0.2]} fov={35} />
      <color attach="background" args={["#cfdcea"]} />
      <fogExp2 attach="fog" args={["#d8e4f0", 0.03]} />
      <hemisphereLight args={["#f4f8ff", "#8a90a0", 1.0]} />
      <directionalLight position={[2, 4.5, 3.5]} intensity={1.9} color="#fff6e6" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0006} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} />
      <Floor tex={tx.floor} size={12} rough={0.4} />
      <InkBox p={[0, 1.6, -2.0]} s={[7, 3.2, 0.12]} c="#eef2f6" th={0.01} />
      {[-1.2, 0, 1.2].map((x) => <InkBox key={x} p={[x, 1.55, -1.93]} s={[0.9, 0.9, 0.04]} c="#bfe6ff" th={0.012} e="#6fa8d8" />)}
      <InkCyl p={[1.5, 0.2, -1.5]} r={0.14} r2={0.1} h={0.4} c="#e8a070" th={0.01} />
      <InkBall p={[1.5, 0.75, -1.5]} r={0.34} c="#5fae58" />
      {/* 책상마다 한 사람 */}
      {DESKS.map((d, i) => {
        const me = i === 2;
        const pose: Pose = me
          ? { armL: lab > 0.5 ? 135 : 30, armR: 30, mouth: "grin", blush: 0.7, legs: "sit" }
          : { armL: i === 0 ? 20 : 120, armR: i === 0 ? 120 + Math.sin(T * 6) * 8 : 20, mouth: i === 0 ? "grin" : "smile", blush: 0.5, look: i === 0 ? 0.7 : -0.7, legs: "sit", blink: Math.floor(T * 30 + i * 31) % 70 > 66 };
        const sx = i === 0 ? 0.36 : -0.36;
        return (
          <group key={i}>
            <Guy look={d.look} pose={pose} feet={[d.x, 0.1, d.z]} cam={cam} s={me ? 1.12 : 1.04} flipX={d.flip} shadow={0} bob={Math.abs(Math.sin(T * 2.4 + i)) * 0.006} />
            <InkBox p={[d.x + (me ? 0 : sx * 0.3), 0.46, d.z + 0.36]} s={[me ? 1.0 : 0.86, 0.05, 0.42]} c="#f2e2c8" th={0.012} round={0.015} />
            {[-1, 1].map((q) => <InkBox key={q} p={[d.x + (me ? 0 : sx * 0.3) + q * (me ? 0.44 : 0.37), 0.22, d.z + 0.36]} s={[0.05, 0.44, 0.36]} c="#c8ccd6" th={0.01} />)}
            {/* 모니터는 얼굴을 가리지 않게 옆으로 */}
            <group position={[d.x + (me ? 0.34 : sx * 1.05), 0.49, d.z + 0.34]} rotation={[0, me ? -0.5 : -sx * 1.2, 0]}>
              <InkBox p={[0, 0.16, 0]} s={[0.26, 0.19, 0.025]} c="#3a3f52" th={0.008} round={0.008} />
              <InkBox p={[0, 0.03, 0]} s={[0.04, 0.08, 0.025]} c="#3a3f52" th={0.006} round={0.004} />
              <Decal tex={tx.screen} p={[0, 0.16, -0.03]} w={0.22} h={0.15} k={1.3} />
            </group>
            <InkCyl p={[d.x + (me ? -0.36 : -sx * 0.1), 0.52, d.z + 0.4]} r={0.035} r2={0.03} h={0.07} c={["#ff8fa6", "#8fc8ff", "#ffd76a"][i]} th={0.006} />
          </group>
        );
      })}
      {/* OUR COMPANY */}
      {lab > 0.01 && (
        <>
          <Glow tex={tx.gold} p={[0, 2.0, -0.5]} w={1.6} h={1.2} o={0.4 + 0.4 * pulse(u, 0.2, 0.2)} />
          <Card tex={tx.label} at={[0, 2.02 + Math.sin(T * 2) * 0.008, -0.45]} w={BW * 1.2} h={BH * 1.2} cam={cam} scale={lab} tint="#ffffff" />
          {[0, 1, 2, 3, 4, 5].map((i) => { const a = clamp01((u - 0.2) / 0.3), ang = (i / 6) * Math.PI * 2 + 0.3, r = 0.3 + a * 0.25; return a < 1 ? <Glow key={i} tex={tx.sparks[i % 3]} p={[Math.cos(ang) * r * 1.4, 2.02 + Math.sin(ang) * r * 0.7, -0.4]} w={0.11} h={0.11} o={1 - a} k={2.2} /> : null; })}
        </>
      )}
      <Post focus={Math.hypot(cam[1] - 0.9, cam[2])} range={4.2} bloom={0.45} vig={0.45} />
    </>
  );
};

// ================================================================ 4. 거리 간판마다 "우리"
const SIGNS: { s: string; bg: string; fg: string; p: V3; w: number; h: number; at: number; v?: boolean; icon?: "cross" }[] = [
  { s: "우리 집밥", bg: "#ff8a3a", fg: "#ffffff", p: [-0.31, 1.5, 0.3], w: 0.5, h: 0.156, at: 0.02 },
  { s: "우리 약국", bg: "#1f9d6f", fg: "#ffffff", p: [0.36, 1.34, -0.4], w: 0.58, h: 0.181, at: 0.3, icon: "cross" },
  { s: "우리 마트", bg: "#e2343a", fg: "#fff6c8", p: [-0.3, 2.08, -1.4], w: 0.66, h: 0.206, at: 0.6 },
  { s: "우리 분식", bg: "#ffd23a", fg: INK, p: [0.52, 1.85, -1.6], w: 0.24, h: 0.7, at: 0.6, v: true },
  { s: "우리 꽃집", bg: "#ff7fa8", fg: "#ffffff", p: [-0.1, 2.75, -4.2], w: 1.1, h: 0.344, at: 0.78 },
];
const Street: React.FC<{ t: number }> = ({ t }) => {
  const T = t * DUR.everywhere;
  const tx = useMemo(() => ({
    floor: painted(512, 512, "#5a5670", (g) => { g.fillStyle = "rgba(255,255,255,0.5)"; for (let y = 0; y < 512; y += 128) g.fillRect(246, y, 20, 70); }, 6),
    sky: canvasTexture(1024, 512, (g) => drawSky(g, [[0, "#2a2f7a"], [0.5, "#8a5aa8"], [0.8, "#ff9a7a"], [1, "#ffd9a0"]])),
    city: canvasTexture(1024, 512, (g) => drawSkyline(g, "#3a3468", 21, 0.3, 240)),
    wallA: painted(512, 512, "#8a7a9a", (g) => { g.fillStyle = "rgba(255,226,160,0.85)"; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) if ((r + c) % 3) g.fillRect(60 + c * 150, 40 + r * 120, 80, 70); }, 2),
    wallB: painted(512, 512, "#9a8a80", (g) => { g.fillStyle = "rgba(255,226,160,0.85)"; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) if ((r * 2 + c) % 3) g.fillRect(60 + c * 150, 40 + r * 120, 80, 70); }, 8),
    signs: SIGNS.map((s) => canvasTexture(s.v ? 220 : 640, s.v ? 640 : 200, (g) => drawShopSign(g, s.s, s.bg, s.fg, s.v, s.icon))),
    glows: SIGNS.map((s) => { const n = parseInt(s.bg.slice(1), 16); return glowTex(`${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`); }),
    warm: glowTex("255,196,130"),
  }), []);
  const k = sstep(t);
  const cam: V3 = lerp3([0, 1.0, 4.5], [0, 1.0, 3.85], k * 0.5 + t * 0.5);
  const walk: Pose = { walk: T * 7, armL: 25, armR: 25, mouth: t > 0.3 ? "o" : "smile", brow: t > 0.3 ? 0.8 : 0, look: Math.sin(T * 4) * 0.9, blush: 0.5 };
  return (
    <>
      <CamSet p={cam} t={[0, 1.0, -1.5]} fov={35} />
      <color attach="background" args={["#3a2f6a"]} />
      <fogExp2 attach="fog" args={["#4a3a78", 0.05]} />
      <hemisphereLight args={["#8a8fe0", "#4a3050", 0.75]} />
      <directionalLight position={[-2, 2.5, -4]} intensity={1.6} color="#ffb080" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0006} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} />
      <Sky tex={tx.sky} z={-18} y={5.2} />
      <Decal tex={tx.city} p={[0, 2.0, -12]} w={20} h={5.5} tint="#c8a8d0" />
      <Floor tex={tx.floor} size={16} rough={0.35} z={-3} />
      {/* 양쪽 건물 */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <InkBox p={[sx * 1.75, 1.6, 0.4]} s={[1.6, 3.2, 1.7]} c="#ffffff" map={sx < 0 ? tx.wallA : tx.wallB} th={0.016} />
          <InkBox p={[sx * 1.85, 2.0, -1.6]} s={[1.6, 4.0, 2.0]} c="#ffffff" map={sx < 0 ? tx.wallB : tx.wallA} th={0.016} />
          <InkBox p={[sx * 1.95, 1.5, -3.8]} s={[1.6, 3.0, 2.0]} c="#ffffff" map={sx < 0 ? tx.wallA : tx.wallB} th={0.016} />
          <InkBox p={[sx * 0.98, 0.06, -1.5]} s={[0.3, 0.12, 7]} c="#8a84a0" th={0.01} />
        </group>
      ))}
      <InkBox p={[0, 1.1, -5.4]} s={[2.6, 2.2, 1.0]} c="#7a6a90" th={0.016} />
      {/* 간판 */}
      {SIGNS.map((s, i) => {
        const on = seg(t, s.at, s.at + 0.03);
        const fl = pulse(t, s.at, 0.14);
        const sx = Math.sign(s.p[0]);
        return (
          <group key={i} position={s.p}>
            {sx !== 0 && <InkBox p={[sx * (s.w / 2 + 0.35), s.h * 0.2, -0.04]} s={[0.7, 0.035, 0.035]} c="#2a2438" th={0.008} round={0.008} />}
            <InkBox p={[0, 0, -0.04]} s={[s.w + 0.04, s.h + 0.04, 0.05]} c="#2a2438" th={0.012} round={0.02} />
            <Decal tex={tx.signs[i]} p={[0, 0, 0.005]} w={s.w} h={s.h} k={0.32 + on * (1.0 + 0.5 * fl)} scale={1 + 0.1 * fl} />
            <Glow tex={tx.glows[i]} p={[0, 0, 0.06]} w={s.w * 2.2} h={Math.max(s.h, 0.4) * 2.6} o={on * (0.4 + 0.5 * fl)} />
          </group>
        );
      })}
      {/* 가로등 */}
      {[-0.92, 0.92].map((x, i) => (
        <group key={x}>
          <InkCyl p={[x, 0.9, -2.6 - i * 1.2]} r={0.025} h={1.6} c="#2a2438" th={0.008} seg={8} />
          <mesh position={[x, 1.74, -2.6 - i * 1.2]}>
            <sphereGeometry args={[0.06, 12, 10]} />
            <meshBasicMaterial color={new THREE.Color("#ffe6b0").multiplyScalar(2.2)} toneMapped={false} />
          </mesh>
          <Glow tex={tx.warm} p={[x, 1.74, -2.55 - i * 1.2]} w={0.9} h={0.9} o={0.6} />
        </group>
      ))}
      <Guy look={ME} pose={walk} feet={[-0.04, 0, 0.95 - t * 0.35]} cam={cam} s={1.25} bob={Math.abs(Math.sin(T * 7)) * 0.02} tint="#f0dcd8" />
      <Post focus={Math.hypot(cam[1] - 1.2, cam[2] - 0.3)} range={5} bloom={0.75} vig={0.6} />
    </>
  );
};

// ================================================================ 5. MY 냐 OUR 냐
const End: React.FC<{ t: number; w: Words06F }> = ({ t, w }) => {
  const T = t * DUR.end;
  const room = useRoomTex();
  const tx = useMemo(() => ({
    my: canvasTexture(480, 320, (g) => drawWord(g, w.my, "#8fc8ff", INK)),
    our: canvasTexture(480, 320, (g) => drawWord(g, w.our, "#ffd23a", INK)),
    q: canvasTexture(400, 480, drawQ),
    blue: glowTex("110,170,255"),
  }), [w]);
  const k = sstep(t);
  const cam: V3 = lerp3([0, 1.14, 4.0], [0, 1.16, 3.5], k * 0.5 + t * 0.5);
  const sL = pop(t, 0.08, 0.1), sR = pop(t, 0.2, 0.1), q = pop(t, 0.5, 0.12);
  const pose: Pose = t < 0.5 ? { armL: 60, armR: 60, mouth: "o", brow: 0.6, look: Math.sin(T * 5) * 0.9 } : { armL: 84, armR: 84, mouth: "grin", brow: 0.8, blush: 0.6 };
  const CWd = 0.43, CHt = 0.287;
  return (
    <>
      <CamSet p={cam} t={[0, 1.17, 0]} fov={35} />
      <LivingRoom tx={room} T={T} bright={0.8} sofaX={1.25} />
      <Guy look={ME} pose={pose} feet={[0, 0, 0]} cam={cam} s={1.25} bob={Math.abs(Math.sin(T * 2.2)) * 0.008 + pulse(t, 0.5, 0.2) * 0.04} />
      <Glow tex={tx.blue} p={[-0.3, 1.44, 0.1]} w={0.9} h={0.8} o={0.3 * Math.min(1, sL)} />
      <Card tex={tx.my} at={[-0.3, 1.44 + Math.sin(T * 2) * 0.012, 0.16]} w={CWd} h={CHt} cam={cam} scale={sL} rotZ={0.07 + Math.sin(T * 1.5) * 0.02} tint="#ffffff" />
      <Glow tex={room.gold} p={[0.3, 1.44, 0.1]} w={0.9} h={0.8} o={0.3 * Math.min(1, sR)} />
      <Card tex={tx.our} at={[0.3, 1.44 + Math.sin(T * 2 + 2) * 0.012, 0.16]} w={CWd} h={CHt} cam={cam} scale={sR} rotZ={-0.07 + Math.sin(T * 1.5 + 1) * 0.02} tint="#ffffff" />
      {q > 0.01 && (
        <>
          <Glow tex={room.gold} p={[0, 1.88, 0.1]} w={1.4} h={1.4} o={0.5 * Math.min(1, q)} />
          <Card tex={tx.q} at={[0, 1.88 + Math.sin(T * 3) * 0.01, 0.18]} w={0.38} h={0.456} cam={cam} scale={q} rotZ={Math.sin(T * 4) * 0.05} tint="#ffffff" />
          {[0, 1, 2, 3, 4, 5].map((i) => { const a = clamp01((t - 0.5) / 0.35), ang = (i / 6) * Math.PI * 2 + 0.5, r = 0.22 + a * 0.26; return <Glow key={i} tex={room.sparks[i % 3]} p={[Math.cos(ang) * r, 1.88 + Math.sin(ang) * r, 0.22]} w={0.12} h={0.12} o={1 - a * 0.7} k={2.2} />; })}
        </>
      )}
      <Post focus={Math.hypot(cam[1] - 1.1, cam[2] - 0.1)} range={2.6} bloom={0.55} />
    </>
  );
};

// ================================================================ 무대
const BG: Record<string, string> = { room: "#1c1a2a", ours: "#bfe0f6", boss: "#241828", office: "#cfdcea", street: "#3a2f6a" };
const GRADE: Record<string, string> = {
  room: "linear-gradient(180deg, rgba(255,150,60,0.08) 0%, rgba(0,0,0,0) 50%, rgba(120,40,60,0.08) 100%)",
  ours: "linear-gradient(180deg, rgba(120,180,255,0.05) 0%, rgba(0,0,0,0) 60%)",
  boss: "linear-gradient(180deg, rgba(120,80,200,0.08) 0%, rgba(0,0,0,0) 50%, rgba(255,150,80,0.08) 100%)",
  office: "linear-gradient(180deg, rgba(150,210,255,0.06) 0%, rgba(0,0,0,0) 60%)",
  street: "linear-gradient(180deg, rgba(60,60,200,0.10) 0%, rgba(0,0,0,0) 45%, rgba(255,120,90,0.08) 100%)",
};
const CO_CUT = 0.5;
const useFontReady = (sample: string) => {
  const [ok, setOk] = useState(false);
  const [handle] = useState(() => delayRender("SceneFable06 글꼴"));
  useEffect(() => {
    let live = true;
    const fin = () => { if (live) setOk(true); };
    Promise.all([document.fonts.load(`900 80px ${F}`, sample), document.fonts.load(`bold 80px ${F}`, sample)]).then(fin, fin);
    const id = setTimeout(fin, 6000);
    return () => { live = false; clearTimeout(id); };
  }, [sample]);
  useEffect(() => { if (ok) continueRender(handle); }, [ok, handle]);
  return ok;
};

export const SceneFable06: React.FC<{ mode: Mode06F; t: number; words: Words06F }> = ({ mode, t, words }) => {
  const { width, height } = useVideoConfig();
  const ok = useFontReady(`${Object.values(words).join(" ")} 우리 집밥 약국 마트 분식 꽃집 학교`);
  const set = mode === "onlychild" || mode === "group" || mode === "end" ? "room" : mode === "ours" ? "ours" : mode === "company" ? (t < CO_CUT ? "boss" : "office") : "street";
  return (
    <AbsoluteFill style={{ background: BG[set] }}>
      {ok && (
        <ThreeCanvas key={mode} width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }} camera={{ fov: 35, near: 0.05, far: 60 }} gl={{ antialias: false, toneMapping: THREE.NoToneMapping }}>
          {mode === "onlychild" && <OnlyChild t={t} w={words} />}
          {mode === "ours" && <Ours t={t} w={words} />}
          {mode === "group" && <Group t={t} w={words} />}
          {set === "boss" && <Boss u={t / CO_CUT} w={words} />}
          {set === "office" && <Office u={(t - CO_CUT) / (1 - CO_CUT)} w={words} />}
          {mode === "everywhere" && <Street t={t} />}
          {mode === "end" && <End t={t} w={words} />}
        </ThreeCanvas>
      )}
      <AbsoluteFill style={{ background: GRADE[set], mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};
