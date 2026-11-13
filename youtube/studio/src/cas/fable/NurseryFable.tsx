// 시험 장면: 12월 31일 밤 신생아실. 유리창 너머 부모, 앞줄 우리 아기 + 숫자 "1" 호일 풍선.
// 화풍은 그대로(잉크 외곽선 3D + 2D 카드), 조명·대기·후처리(블룸·피사계심도·비네트)만 영화처럼.
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import { BloomEffect, BrightnessContrastEffect, DepthOfFieldEffect, EffectComposer, EffectPass, HueSaturationEffect, RenderPass, SMAAEffect, SMAAPreset, ToneMappingEffect, ToneMappingMode, VignetteEffect } from "postprocessing";
import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { CamSet, InkBox, InkCyl, Person, V3, glowTex, lerp3, painted, rng, sstep } from "../kit";
import { HIM, INK, ME, Pose, canvasTexture } from "../toonkr";
import { drawCalendar } from "../cards05";
import { PEN_KO } from "../../three/mini";

type G = CanvasRenderingContext2D;

// ---------------------------------------------------------------- 그림 (캔버스)
/** 포대기 아기 (설계 400x400). 색을 바꿀 수 있고 음영이 조금 더 들어간다 */
const drawBabyX = (g: G, k: number, wrap: string, wrap2: string, hat: string, awake: boolean) => {
  g.save();
  g.scale(k, k);
  g.clearRect(0, 0, 400, 400);
  g.lineJoin = "round";
  g.lineCap = "round";
  const ink = (w = 12) => { g.lineWidth = w; g.strokeStyle = INK; g.stroke(); };
  // 포대기
  g.beginPath(); g.ellipse(200, 256, 132, 118, 0, 0, Math.PI * 2);
  const gr = g.createLinearGradient(0, 150, 0, 380);
  gr.addColorStop(0, wrap); gr.addColorStop(1, wrap2);
  g.fillStyle = gr; g.fill(); ink();
  // 포대기 접힌 깃
  g.beginPath(); g.moveTo(84, 214); g.quadraticCurveTo(190, 250, 232, 330); g.quadraticCurveTo(150, 372, 96, 316); g.closePath();
  g.fillStyle = wrap2; g.fill(); ink(9);
  g.beginPath(); g.moveTo(316, 214); g.quadraticCurveTo(250, 250, 196, 300); ink(9);
  // 별 무늬
  g.fillStyle = "rgba(255,255,255,0.75)";
  [[150, 300, 9], [262, 290, 8], [215, 346, 7], [290, 330, 6], [120, 262, 6]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); });
  // 머리
  g.beginPath(); g.ellipse(200, 168, 90, 82, 0, 0, Math.PI * 2);
  const hg = g.createRadialGradient(180, 140, 10, 200, 168, 100);
  hg.addColorStop(0, "#ffe9d6"); hg.addColorStop(1, "#fbd2b6");
  g.fillStyle = hg; g.fill(); ink();
  // 모자
  g.beginPath(); g.ellipse(200, 128, 94, 62, 0, Math.PI, Math.PI * 2); g.quadraticCurveTo(200, 150, 106, 128); g.closePath();
  g.fillStyle = hat; g.fill(); ink(10);
  g.beginPath(); g.moveTo(112, 118); g.quadraticCurveTo(200, 140, 288, 118);
  g.lineWidth = 16; g.strokeStyle = "rgba(255,255,255,0.55)"; g.stroke();
  g.beginPath(); g.arc(200, 62, 20, 0, Math.PI * 2); g.fillStyle = "#ffffff"; g.fill(); ink(8);
  // 얼굴
  g.strokeStyle = INK; g.lineWidth = 8;
  if (awake) {
    g.fillStyle = INK;
    [166, 234].forEach((x) => { g.beginPath(); g.ellipse(x, 176, 9, 13, 0, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = "#fff";
    [169, 237].forEach((x) => { g.beginPath(); g.arc(x, 171, 3.5, 0, Math.PI * 2); g.fill(); });
    g.beginPath(); g.arc(200, 200, 13, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  } else {
    [166, 234].forEach((x) => { g.beginPath(); g.arc(x, 172, 15, 0.12 * Math.PI, 0.88 * Math.PI); g.stroke(); });
    g.beginPath(); g.arc(200, 204, 9, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
  }
  g.globalAlpha = 0.5; g.fillStyle = "#ff8a8a";
  [144, 256].forEach((x) => { g.beginPath(); g.ellipse(x, 198, 18, 13, 0, 0, Math.PI * 2); g.fill(); });
  g.globalAlpha = 1;
  g.restore();
};

/** 숫자 1 호일 풍선 (600x900) */
const drawFoilOne = (g: G) => {
  g.clearRect(0, 0, 600, 900);
  g.lineJoin = "round"; g.lineCap = "round";
  const shape = () => {
    g.beginPath();
    g.moveTo(300, 150); g.lineTo(372, 150); g.lineTo(372, 690); g.lineTo(262, 690); g.lineTo(262, 330); g.lineTo(196, 372); g.lineTo(158, 300);
    g.closePath();
  };
  // 잉크 외곽
  shape(); g.lineWidth = 150; g.strokeStyle = INK; g.stroke();
  // 본체
  const body = g.createLinearGradient(120, 0, 480, 0);
  body.addColorStop(0, "#c2182f"); body.addColorStop(0.35, "#ff3b4e"); body.addColorStop(0.62, "#ff5a66"); body.addColorStop(1, "#b3122a");
  shape(); g.lineWidth = 116; g.strokeStyle = body; g.stroke(); g.fillStyle = body; g.fill();
  // 아래쪽 그늘
  g.save();
  shape(); g.lineWidth = 116; g.stroke(); g.clip();
  const sh = g.createLinearGradient(0, 80, 0, 780);
  sh.addColorStop(0, "rgba(255,190,170,0.28)"); sh.addColorStop(0.45, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(90,0,30,0.45)");
  g.fillStyle = sh; g.fillRect(0, 0, 600, 900);
  g.restore();
  // 가장자리 솔기 (호일 주름)
  shape(); g.lineWidth = 104; g.strokeStyle = "rgba(120,0,25,0.0)"; g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.22)"; g.lineWidth = 3;
  for (let k = 0; k < 26; k++) {
    const y = 170 + k * 21;
    g.beginPath(); g.moveTo(210, y); g.lineTo(224, y + 5); g.stroke();
    g.beginPath(); g.moveTo(424, y); g.lineTo(410, y + 5); g.stroke();
  }
  // 광택
  g.strokeStyle = "rgba(255,255,255,0.85)"; g.lineWidth = 26;
  g.beginPath(); g.moveTo(286, 190); g.lineTo(286, 300); g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.5)"; g.lineWidth = 16;
  g.beginPath(); g.moveTo(286, 350); g.lineTo(286, 560); g.stroke();
  g.beginPath(); g.moveTo(196, 300); g.lineTo(238, 262); g.stroke();
  g.fillStyle = "rgba(255,255,255,0.9)";
  g.beginPath(); g.ellipse(396, 204, 9, 20, 0.2, 0, Math.PI * 2); g.fill();
  // 매듭
  g.beginPath(); g.moveTo(296, 742); g.lineTo(338, 742); g.lineTo(350, 800); g.lineTo(284, 800); g.closePath();
  g.fillStyle = "#d21f37"; g.fill(); g.lineWidth = 12; g.strokeStyle = INK; g.stroke();
};

/** 벽시계 문자판 (512) */
const drawClockFace = (g: G) => {
  g.clearRect(0, 0, 512, 512);
  g.beginPath(); g.arc(256, 256, 250, 0, Math.PI * 2);
  const gr = g.createRadialGradient(220, 200, 20, 256, 256, 260);
  gr.addColorStop(0, "#fffdf6"); gr.addColorStop(1, "#efe6d6");
  g.fillStyle = gr; g.fill();
  g.strokeStyle = INK; g.lineCap = "round";
  for (let k = 0; k < 60; k++) {
    const a = (k / 60) * Math.PI * 2, big = k % 5 === 0;
    g.lineWidth = big ? 12 : 4;
    const r0 = big ? 196 : 212;
    g.beginPath(); g.moveTo(256 + Math.sin(a) * r0, 256 - Math.cos(a) * r0); g.lineTo(256 + Math.sin(a) * 228, 256 - Math.cos(a) * 228); g.stroke();
  }
  g.fillStyle = INK; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `bold 78px ${PEN_KO}`;
  ([[12, 0], [3, 90], [6, 180], [9, 270]] as const).forEach(([n, d]) => {
    const a = (d * Math.PI) / 180;
    g.fillText(String(n), 256 + Math.sin(a) * 150, 256 - Math.cos(a) * 150 + 4);
  });
};

/** 신생아실 간판 (1024x300) */
const drawSign = (g: G) => {
  g.clearRect(0, 0, 1024, 300);
  const gr = g.createLinearGradient(0, 0, 0, 300);
  gr.addColorStop(0, "#ffe9c9"); gr.addColorStop(1, "#ffcf9a");
  g.fillStyle = gr; g.beginPath(); g.roundRect(8, 8, 1008, 284, 60); g.fill();
  g.lineWidth = 16; g.strokeStyle = INK; g.stroke();
  // 하트
  const heart = (x: number, y: number, s: number, c: string) => {
    g.beginPath(); g.moveTo(x, y + s * 0.9);
    g.bezierCurveTo(x - s * 1.5, y - s * 0.2, x - s * 0.6, y - s * 1.2, x, y - s * 0.35);
    g.bezierCurveTo(x + s * 0.6, y - s * 1.2, x + s * 1.5, y - s * 0.2, x, y + s * 0.9);
    g.fillStyle = c; g.fill(); g.lineWidth = 9; g.strokeStyle = INK; g.stroke();
  };
  heart(120, 150, 52, "#ff6f7f");
  heart(904, 150, 52, "#6fb8ff");
  g.font = `bold 230px ${PEN_KO}`; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineJoin = "round"; g.fillStyle = "#3a2430";
  g.fillText("신생아실", 512, 150);
};

/** 유리 반사 줄무늬 */
const drawGlass = (g: G) => {
  g.clearRect(0, 0, 1024, 512);
  const base = g.createLinearGradient(0, 0, 0, 512);
  base.addColorStop(0, "rgba(150,190,255,0.20)"); base.addColorStop(0.5, "rgba(150,190,255,0.03)"); base.addColorStop(1, "rgba(150,190,255,0.10)");
  g.fillStyle = base; g.fillRect(0, 0, 1024, 512);
  const streak = (x: number, w: number, a: number) => {
    const gr = g.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(x + 200, 0); g.lineTo(x + 200 + w, 0); g.lineTo(x + w, 512); g.lineTo(x, 512); g.closePath(); g.fill();
  };
  streak(-80, 150, 0.2); streak(110, 50, 0.14); streak(620, 190, 0.18); streak(850, 40, 0.12);
};

/** 복도 창밖: 밤하늘 + 도시 불빛 */
const drawNight = (g: G) => {
  const r = rng(11);
  const sky = g.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, "#0b1238"); sky.addColorStop(0.7, "#27245e"); sky.addColorStop(1, "#6a3a78");
  g.fillStyle = sky; g.fillRect(0, 0, 1024, 512);
  for (let k = 0; k < 90; k++) { g.globalAlpha = 0.3 + r() * 0.7; g.fillStyle = "#fff"; g.beginPath(); g.arc(r() * 1024, r() * 330, 0.8 + r() * 1.8, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1;
  // 건물 실루엣 + 창 불빛
  let x = 0;
  while (x < 1024) {
    const w = 50 + r() * 70, h = 90 + r() * 170;
    g.fillStyle = "#141636"; g.fillRect(x, 512 - h, w, h);
    for (let yy = 512 - h + 12; yy < 500; yy += 20) for (let xx = x + 8; xx < x + w - 10; xx += 16) if (r() > 0.55) { g.fillStyle = r() > 0.4 ? "#ffd68a" : "#9fe0ff"; g.fillRect(xx, yy, 8, 10); }
    x += w + 4;
  }
};

/** 불꽃 (잉크 없이 빛으로만) */
const drawSpark = (g: G, c: string) => {
  g.clearRect(0, 0, 256, 256);
  g.lineCap = "round";
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2, r1 = k % 2 ? 112 : 88;
    const gr = g.createLinearGradient(128, 128, 128 + Math.cos(a) * r1, 128 + Math.sin(a) * r1);
    gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, c); gr.addColorStop(1, "#ffffff");
    g.strokeStyle = gr; g.lineWidth = 6;
    g.beginPath(); g.moveTo(128 + Math.cos(a) * 22, 128 + Math.sin(a) * 22); g.lineTo(128 + Math.cos(a) * r1, 128 + Math.sin(a) * r1); g.stroke();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(128 + Math.cos(a) * (r1 + 6), 128 + Math.sin(a) * (r1 + 6), 4.5, 0, Math.PI * 2); g.fill();
  }
};

/** 위에서 내려오는 빛기둥 */
const drawBeam = (g: G) => {
  g.clearRect(0, 0, 256, 512);
  for (let y = 0; y < 512; y += 2) {
    const v = y / 512, half = 26 + v * 100;
    const a = 0.75 * Math.pow(1 - v, 1.1) * Math.min(1, v * 8);
    const gr = g.createLinearGradient(128 - half, 0, 128 + half, 0);
    gr.addColorStop(0, "rgba(255,214,160,0)"); gr.addColorStop(0.5, `rgba(255,214,160,${a})`); gr.addColorStop(1, "rgba(255,214,160,0)");
    g.fillStyle = gr; g.fillRect(128 - half, y, half * 2, 2);
  }
};

const drawNameTag = (g: G, c: string, star: boolean) => {
  g.clearRect(0, 0, 256, 160);
  g.beginPath(); g.roundRect(8, 8, 240, 144, 26); g.fillStyle = "#fffaf0"; g.fill(); g.lineWidth = 12; g.strokeStyle = INK; g.stroke();
  g.fillStyle = c; g.beginPath(); g.roundRect(14, 14, 228, 46, [20, 20, 0, 0]); g.fill();
  g.strokeStyle = INK; g.lineWidth = 7; g.lineCap = "round";
  if (star) {
    g.fillStyle = "#ffcf3a"; g.beginPath();
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? 15 : 34; g.lineTo(128 + Math.cos(a) * rr, 104 + Math.sin(a) * rr); }
    g.closePath(); g.fill(); g.stroke();
  } else {
    g.beginPath(); g.moveTo(50, 90); g.lineTo(206, 90); g.moveTo(50, 122); g.lineTo(160, 122); g.stroke();
  }
};

// ---------------------------------------------------------------- 부품
const BABIES: { wrap: string; wrap2: string; hat: string; awake?: boolean; tag: string }[] = [
  { wrap: "#fbe3ea", wrap2: "#f4bccb", hat: "#9fd0f0", tag: "#ff8fa6" },
  { wrap: "#e2efff", wrap2: "#b7d3f7", hat: "#ffe08a", tag: "#6fb0f0" },
  { wrap: "#fff3cf", wrap2: "#f6dc94", hat: "#f7a8b8", awake: true, tag: "#ff8fa6" },
  { wrap: "#dff5ea", wrap2: "#aee2c8", hat: "#c9b6f2", tag: "#6fb0f0" },
];

/** 색을 1보다 크게 줄 수 있는 평면 (블룸용) */
const Glow: React.FC<{ tex: THREE.Texture; p: V3; w: number; h: number; k?: number; c?: string; o?: number; r?: V3; add?: boolean; scale?: number; order?: number; fog?: boolean }> = ({ tex, p, w, h, k = 1, c = "#ffffff", o = 1, r, add = true, scale = 1, order = 0, fog = false }) => {
  const col = useMemo(() => new THREE.Color(c).multiplyScalar(k), [c, k]);
  if (o < 0.005 || scale < 0.005) return null;
  return (
    <mesh position={p} rotation={r} scale={scale} renderOrder={order}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} color={col} transparent opacity={o} depthWrite={false} blending={add ? THREE.AdditiveBlending : THREE.NormalBlending} toneMapped={false} fog={fog} />
    </mesh>
  );
};

/** 뒤로 살짝 누운 그림판 (아기) */
const Flat: React.FC<{ tex: THREE.Texture; p: V3; w: number; h: number; lean?: number; tint?: string; rz?: number }> = ({ tex, p, w, h, lean = 0, tint = "#ffffff", rz = 0 }) => (
  <group position={p} rotation={[-lean, 0, 0]}>
    <mesh rotation={[0, 0, rz]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} transparent alphaTest={0.4} color={tint} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  </group>
);

const acrylic = new THREE.MeshPhysicalMaterial({ color: "#cfeaff", transparent: true, opacity: 0.11, roughness: 0.08, metalness: 0, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });

/** 투명 아기 침대 + 수레 */
const Bassinet: React.FC<{ at: V3; s?: number; baby: THREE.Texture; tag: THREE.Texture; tint: string; breathe: number; rim?: string }> = ({ at, s = 1, baby, tag, tint, breathe, rim = "#f4f1ea" }) => {
  const W = 0.44, D = 0.28, Y = 0.36;
  return (
    <group position={at} scale={s}>
      {/* 수레 */}
      {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([a, b]) => (
        <group key={`${a}${b}`}>
          <InkCyl p={[a * (W / 2 - 0.02), Y / 2 + 0.02, b * (D / 2 - 0.02)]} r={0.011} h={Y - 0.04} c="#c9ced8" th={0.005} seg={10} />
          <InkCyl p={[a * (W / 2 - 0.02), 0.022, b * (D / 2 - 0.02)]} r={0.022} h={0.02} c="#3b3f52" th={0.005} seg={12} />
        </group>
      ))}
      <InkBox p={[0, 0.12, 0]} s={[W - 0.03, 0.02, D - 0.03]} c="#dfe6f0" th={0.006} round={0.008} />
      <InkBox p={[0, Y, 0]} s={[W + 0.03, 0.035, D + 0.03]} c={rim} th={0.007} round={0.012} />
      {/* 매트리스 */}
      <InkBox p={[0, Y + 0.04, 0]} s={[W - 0.05, 0.04, D - 0.05]} c="#ffffff" th={0.005} round={0.015} />
      {/* 아크릴 통 */}
      <mesh position={[0, Y + 0.105, 0]} material={acrylic} renderOrder={3}>
        <boxGeometry args={[W, 0.17, D]} />
      </mesh>
      {/* 테두리 */}
      <InkBox p={[0, Y + 0.195, D / 2]} s={[W + 0.012, 0.016, 0.016]} c={rim} th={0.005} round={0.006} />
      <InkBox p={[0, Y + 0.195, -D / 2]} s={[W + 0.012, 0.016, 0.016]} c={rim} th={0.005} round={0.006} />
      <InkBox p={[-W / 2, Y + 0.195, 0]} s={[0.016, 0.016, D]} c={rim} th={0.005} round={0.006} />
      <InkBox p={[W / 2, Y + 0.195, 0]} s={[0.016, 0.016, D]} c={rim} th={0.005} round={0.006} />
      {([-1, 1] as const).map((a) => <InkBox key={a} p={[a * (W / 2), Y + 0.105, D / 2]} s={[0.01, 0.17, 0.01]} c={rim} th={0.004} round={0.003} />)}
      {/* 아기 */}
      <Flat tex={baby} p={[0, Y + 0.185 + breathe, 0.0]} w={0.3} h={0.3} lean={0.5} tint={tint} />
      {/* 이름표 */}
      <Flat tex={tag} p={[-0.11, Y + 0.075, D / 2 + 0.018]} w={0.1} h={0.062} tint={tint} rz={-0.04} />
    </group>
  );
};

/** 벽시계 */
const Clock: React.FC<{ at: V3; frame: number; face: THREE.Texture }> = ({ at, frame, face }) => {
  const R = 0.165;
  const sec = 50 + Math.floor(frame / 30);
  const tick = Math.min(1, ((frame % 30) / 30) * 6); // 초침이 톡 넘어간다
  const sA = ((sec - 1 + sstep(tick)) / 60) * Math.PI * 2;
  const mA = ((59 + sec / 60) / 60) * Math.PI * 2;
  const hA = ((11 + 59.8 / 60) / 12) * Math.PI * 2;
  const hand = (a: number, len: number, w: number, c: string, z: number, tail = 0) => (
    <group rotation={[0, 0, -a]} position={[0, 0, z]}>
      <mesh position={[0, (len - tail) / 2, 0]}>
        <boxGeometry args={[w, len + tail, 0.006]} />
        <meshBasicMaterial color={c} toneMapped={false} />
      </mesh>
    </group>
  );
  return (
    <group position={at}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <InkCyl p={[0, 0, 0]} r={R} h={0.05} c="#e2574c" th={0.012} seg={40} />
      </group>
      <mesh position={[0, 0, 0.042]}>
        <circleGeometry args={[R * 0.87, 40]} />
        <meshBasicMaterial map={face} color="#f2e9dc" toneMapped={false} />
      </mesh>
      {hand(hA, R * 0.42, 0.016, INK, 0.058)}
      {hand(mA, R * 0.66, 0.011, INK, 0.066)}
      {hand(sA, R * 0.72, 0.005, "#e2343a", 0.074, 0.03)}
      <mesh position={[0, 0, 0.08]}>
        <circleGeometry args={[0.012, 16]} />
        <meshBasicMaterial color="#e2343a" toneMapped={false} />
      </mesh>
    </group>
  );
};

/** 풍선 줄 */
const StringTube: React.FC<{ a: V3; b: V3; sway: number }> = ({ a, b, sway }) => {
  const geo = useMemo(() => {
    const mid: V3 = [(a[0] + b[0]) / 2 + 0.035 + sway * 0.5, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const q: V3 = [a[0] * 0.75 + b[0] * 0.25 - 0.02, a[1] * 0.75 + b[1] * 0.25, a[2]];
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(...a), new THREE.Vector3(...q), new THREE.Vector3(...mid), new THREE.Vector3(...b)]);
    return new THREE.TubeGeometry(curve, 24, 0.0035, 5);
  }, [a[0], a[1], a[2], b[0], b[1], b[2], sway]);
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial color="#fff2e0" toneMapped={false} />
    </mesh>
  );
};

// ---------------------------------------------------------------- 후처리
// @react-three/postprocessing 의 <EffectComposer> 는 패스를 effect 에서 붙여서 Remotion 의 첫 advance 때 빈 화면이 나온다.
// 그래서 postprocessing 을 직접 조립한다 (렌더 중에 동기적으로 완성).
const MSAA = 4;
const Post: React.FC<{ focus: number; range: number }> = ({ focus, range }) => {
  const { gl, scene, camera, size } = useThree();
  const fx = useMemo(() => {
    const composer = new EffectComposer(gl, { frameBufferType: THREE.HalfFloatType, multisampling: MSAA });
    const dof = new DepthOfFieldEffect(camera, { worldFocusDistance: 3, worldFocusRange: 3, bokehScale: 3.4, resolutionScale: 0.5 });
    const bloom = new BloomEffect({ mipmapBlur: true, intensity: 0.6, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, radius: 0.72 });
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL });
    const hue = new HueSaturationEffect({ saturation: 0.12 });
    const bc = new BrightnessContrastEffect({ brightness: 0, contrast: 0.08 });
    const vig = new VignetteEffect({ offset: 0.28, darkness: 0.62 });
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new EffectPass(camera, dof));
    composer.addPass(new EffectPass(camera, bloom, tone, hue, bc, vig));
    if (!MSAA) composer.addPass(new EffectPass(camera, new SMAAEffect({ preset: SMAAPreset.HIGH })));
    return { composer, dof, w: 0, h: 0 };
  }, [gl, scene, camera]);
  fx.dof.cocMaterial.worldFocusDistance = focus;
  fx.dof.cocMaterial.worldFocusRange = range;
  useFrame(() => {
    if (fx.w !== size.width || fx.h !== size.height) { fx.composer.setSize(size.width, size.height, false); fx.w = size.width; fx.h = size.height; }
    fx.composer.render(1 / 30);
  }, 1);
  return null;
};

// ---------------------------------------------------------------- 장면
const GZ = -2.0; // 유리벽
const OUR: V3 = [0, 0, 0.3];
const OS = 1.22; // 우리 아기 침대 크기

const World: React.FC<{ frame: number }> = ({ frame }) => {
  const u = frame / 179;
  const T = frame / 30;

  // 질감
  const tx = useMemo(() => {
    const floor = painted(1024, 1024, "#cfd9e6", (g) => {
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
        g.fillStyle = (i + j) % 2 ? "rgba(255,255,255,0.22)" : "rgba(120,150,190,0.16)";
        g.fillRect(i * 128, j * 128, 128, 128);
      }
      g.strokeStyle = "rgba(60,70,110,0.25)"; g.lineWidth = 3;
      for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 1024); g.moveTo(0, i * 128); g.lineTo(1024, i * 128); g.stroke(); }
    }, 5);
    floor.wrapS = floor.wrapT = THREE.RepeatWrapping; floor.repeat.set(2.5, 2.5);
    const wallUp = canvasTexture(1536, 512, (g) => {
      const r = rng(8);
      const gr = g.createLinearGradient(0, 0, 0, 512);
      gr.addColorStop(0, "#5f86a8"); gr.addColorStop(0.55, "#9cc7c6"); gr.addColorStop(1, "#c6e3d6");
      g.fillStyle = gr; g.fillRect(0, 0, 1536, 512);
      // 별·달 벽 스티커
      for (let k = 0; k < 26; k++) {
        const x = r() * 1536, y = 20 + r() * 330, s = 7 + r() * 11;
        g.fillStyle = r() > 0.5 ? "rgba(255,240,190,0.85)" : "rgba(255,255,255,0.7)";
        g.beginPath();
        for (let q = 0; q < 10; q++) { const a = (q / 10) * Math.PI * 2 - Math.PI / 2, rr = q % 2 ? s * 0.45 : s; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
        g.closePath(); g.fill();
      }
      g.fillStyle = "#fff6ec"; g.fillRect(0, 486, 1536, 26);
    });
    const wallLow = canvasTexture(1024, 128, (g) => {
      g.fillStyle = "#f0c2c0"; g.fillRect(0, 0, 1024, 128);
      g.fillStyle = "rgba(255,255,255,0.3)";
      for (let x = 0; x < 1024; x += 40) g.fillRect(x, 0, 20, 128);
    });
    const corridor = painted(512, 512, "#e9c9a0", undefined, 4);
    return {
      floor, wallUp, wallLow, corridor,
      glass: canvasTexture(1024, 512, drawGlass),
      night: canvasTexture(1024, 512, drawNight),
      sign: canvasTexture(1024, 300, drawSign),
      clock: canvasTexture(512, 512, drawClockFace),
      cal: canvasTexture(400, 480, (g) => drawCalendar(g, "12월", "31", PEN_KO, true)),
      one: canvasTexture(600, 900, drawFoilOne),
      beam: canvasTexture(256, 512, drawBeam),
      warm: glowTex("255,196,130"),
      cool: glowTex("140,200,255"),
      red: glowTex("255,90,100"),
      white: glowTex("255,244,225"),
      sparks: ["#ffd23a", "#ff7fa8", "#7fe0ff"].map((c) => canvasTexture(256, 256, (g) => drawSpark(g, c))),
      babies: BABIES.map((b) => canvasTexture(400, 400, (g) => drawBabyX(g, 1, b.wrap, b.wrap2, b.hat, !!b.awake))),
      tags: BABIES.map((b) => canvasTexture(256, 160, (g) => drawNameTag(g, b.tag, false))),
      ourBaby: canvasTexture(1000, 1000, (g) => drawBabyX(g, 2.5, "#fff6f0", "#ffd3dc", "#ffd45c", false)),
      ourTag: canvasTexture(256, 160, (g) => drawNameTag(g, "#ff5a6e", true)),
    };
  }, []);

  // 카메라: 넓게 시작해서 우리 아기로 천천히 밀고 들어간다 (끝에서도 아주 조금 계속 움직임)
  const k = sstep(Math.min(1, u * 1.04)) * 0.94 + u * 0.06;
  const camP = lerp3([0.0, 1.42, 3.7], [0.11, 1.06, 2.32], k);
  const camT = lerp3([0.02, 1.0, GZ], [0.11, 0.87, 0.3], sstep(Math.min(1, u * 1.15)));
  const cam: V3 = [camP[0] + Math.sin(T * 0.7) * 0.006, camP[1] + Math.sin(T * 0.9 + 1) * 0.004, camP[2]];
  const fov = 37 - 3 * k;

  // 초점: 유리창(부모) → 우리 아기
  const dBaby = Math.hypot(cam[0] - OUR[0], cam[1] - 0.62, cam[2] - OUR[2]);
  const dGlass = Math.hypot(cam[0], cam[1] - 0.9, cam[2] - GZ);
  const rack = sstep((u - 0.18) / 0.5);
  const focus = dGlass * 0.92 + (dBaby - dGlass * 0.92) * rack;
  const range = 3.0 - 2.1 * rack;

  // 부모
  const blinkA = frame % 97 > 92, blinkB = (frame + 40) % 113 > 108;
  const wave = Math.sin(T * 5.2);
  const mom: Pose = { armL: 14, armR: 138 + wave * 9, mouth: "grin", blink: blinkA, look: 0.4, blush: 0.75, brow: 0.3 };
  const dad: Pose = { armL: 150, armR: 16, mouth: u > 0.45 ? "grin" : "smile", blink: blinkB, look: -0.2, blush: 0.4, brow: 0.5 };
  const bobM = Math.abs(Math.sin(T * 2.6)) * 0.014, bobD = Math.abs(Math.sin(T * 2.6 + 1.2)) * 0.008;

  // 풍선
  const sway = Math.sin(T * 1.25) * 0.016 + Math.sin(T * 2.3 + 1) * 0.005;
  const tie: V3 = [OUR[0] + 0.27 * OS, (0.36 + 0.2) * OS, OUR[2] + 0.14 * OS];
  const bal: V3 = [OUR[0] + 0.25 + sway, 1.1 + Math.sin(T * 1.7) * 0.008, OUR[2] + 0.06];
  const balRot = -0.07 + sway * 2.2;
  const bw = 0.34, bh = 0.51;
  const knot: V3 = [bal[0] + Math.sin(balRot) * bh * 0.37 + 0.012, bal[1] - bh * 0.37, bal[2]];

  const breathe = (ph: number) => Math.sin(T * 2.1 + ph) * 0.004;
  const dim = "#a2aede";

  // 먼지 (빛기둥 안)
  const motes = useMemo(() => {
    const r = rng(23);
    return Array.from({ length: 34 }, () => ({ x: (r() - 0.5) * 0.95, y: 0.45 + r() * 1.25, z: (r() - 0.5) * 1.3, s: 0.006 + r() * 0.012, ph: r() * 6.28, sp: 0.3 + r() * 0.6 }));
  }, []);

  // 불꽃놀이
  const fw = [
    { x: -0.62, y: 1.16, t0: 0.4, i: 0 },
    { x: 0.5, y: 1.2, t0: 1.9, i: 1 },
    { x: -0.2, y: 1.25, t0: 3.3, i: 2 },
    { x: 0.82, y: 1.12, t0: 4.5, i: 0 },
    { x: -0.9, y: 1.22, t0: 5.0, i: 1 },
  ];

  return (
    <>
      <CamSet p={cam} t={camT} fov={fov} />
      <color attach="background" args={["#090c1f"]} />
      <fogExp2 attach="fog" args={["#10152f", 0.075]} />

      {/* ---------- 조명 ---------- */}
      <hemisphereLight args={["#6f86d6", "#2a2238", 0.55]} />
      <directionalLight position={[-3, 4, 3]} intensity={0.55} color="#8fa6ff" />
      <spotLight position={[0.25, 2.9, 1.1]} angle={0.36} penumbra={0.95} intensity={46} decay={1.6} distance={7} color="#ffcf98" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0008} shadow-normalBias={0.02}>
        <object3D attach="target" position={[0, 0.3, 0.2]} />
      </spotLight>
      <pointLight position={[0, 1.95, -3.0]} intensity={5} distance={5} decay={1.4} color="#ffc48a" />
      <pointLight position={[-1.3, 1.4, -1.1]} intensity={2.4} distance={4} decay={1.5} color="#6fd6e6" />
      <pointLight position={[1.4, 1.2, -0.6]} intensity={1.6} distance={4} decay={1.5} color="#ff9ab8" />
      <pointLight position={[bal[0] - 0.1, bal[1] - 0.25, bal[2] + 0.15]} intensity={0.55} distance={1.2} decay={1.6} color="#ff5a6a" />

      {/* ---------- 신생아실 ---------- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.5]} receiveShadow>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial map={tx.floor} roughness={0.32} metalness={0.05} />
      </mesh>
      {/* 유리벽: 아래 · 위 · 양옆 */}
      <InkBox p={[0, 0.225, GZ]} s={[6, 0.45, 0.14]} c="#ffffff" map={tx.wallLow} th={0.01} />
      <InkBox p={[0, 2.35, GZ]} s={[6, 2.0, 0.14]} c="#ffffff" map={tx.wallUp} th={0.01} />
      <InkBox p={[-2.2, 0.9, GZ]} s={[1.6, 0.9, 0.14]} c="#bfe0d8" th={0.01} />
      <InkBox p={[2.2, 0.9, GZ]} s={[1.6, 0.9, 0.14]} c="#bfe0d8" th={0.01} />
      {/* 창틀 */}
      <InkBox p={[0, 0.46, GZ + 0.03]} s={[2.9, 0.05, 0.24]} c="#fff6ec" th={0.009} />
      <InkBox p={[0, 1.35, GZ + 0.02]} s={[2.9, 0.045, 0.2]} c="#fff6ec" th={0.009} />
      {[-0.98, 0.98].map((x) => <InkBox key={x} p={[x, 0.905, GZ + 0.02]} s={[0.04, 0.85, 0.16]} c="#fff6ec" th={0.008} />)}
      {/* 유리 */}
      <Glow tex={tx.glass} p={[0, 0.905, GZ + 0.03]} w={2.86} h={0.86} o={0.55} k={1} order={5} />

      {/* 간판 · 시계 · 달력 */}
      <InkBox p={[-0.02, 1.66, GZ + 0.1]} s={[0.84, 0.25, 0.06]} c="#5a3b3a" th={0.012} round={0.03} />
      <Glow tex={tx.sign} p={[-0.02, 1.66, GZ + 0.15]} w={0.8} h={0.234} k={1.22} add={false} />
      <Glow tex={tx.warm} p={[-0.02, 1.66, GZ + 0.085]} w={2.2} h={1.1} o={0.5} />
      <Clock at={[0.66, 1.7, GZ + 0.1]} frame={frame} face={tx.clock} />
      <group position={[-0.66, 1.7, GZ + 0.09]} rotation={[0, 0, 0.03]}>
        <mesh>
          <planeGeometry args={[0.27, 0.324]} />
          <meshBasicMaterial map={tx.cal} transparent alphaTest={0.4} color="#d9d2e2" toneMapped={false} />
        </mesh>
      </group>

      {/* ---------- 복도 ---------- */}
      <mesh position={[0, 1.5, -4.3]}>
        <planeGeometry args={[8, 3.4]} />
        <meshStandardMaterial map={tx.corridor} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -3.2]}>
        <planeGeometry args={[8, 2.3]} />
        <meshStandardMaterial color="#b89a86" roughness={0.6} />
      </mesh>
      {/* 복도 창 (밤하늘) */}
      <InkBox p={[0, 1.02, -4.28]} s={[2.7, 0.74, 0.05]} c="#fff0dc" th={0.012} />
      <Glow tex={tx.night} p={[0, 1.02, -4.24]} w={2.56} h={0.62} k={1.25} add={false} fog />
      {fw.map((f, i) => {
        const a = (T - f.t0) / 1.25;
        if (a <= 0 || a >= 1) return null;
        const grow = 1 - Math.pow(1 - a, 3);
        return (
          <group key={i}>
            <Glow tex={tx.sparks[f.i]} p={[f.x, f.y - a * a * 0.03, -4.22]} w={0.36} h={0.36} scale={0.25 + grow * 0.9} o={Math.min(1, (1 - a) * 2.2)} k={2.4} />
            <Glow tex={tx.white} p={[f.x, f.y, -4.21]} w={0.7} h={0.7} o={0.45 * (1 - a) * (1 - a)} k={1.4} />
          </group>
        );
      })}
      {/* 복도 벽등 */}
      {[-1.75, 1.75].map((x) => (
        <group key={x}>
          <Glow tex={tx.warm} p={[x, 1.55, -4.2]} w={1.5} h={1.5} o={0.7} k={1.3} />
        </group>
      ))}

      {/* 부모 (유리 너머) */}
      <Person look={ME} pose={mom} feet={[-0.46, 0.0, GZ - 0.42]} cam={cam} tint="#f0dccd" bob={bobM} />
      <Person look={HIM} pose={dad} feet={[0.1, 0.06, GZ - 0.5]} cam={cam} tint="#ecd6c6" bob={bobD} />

      {/* ---------- 아기 침대들 ---------- */}
      {[-1.26, -0.42, 0.42, 1.26].map((x, i) => (
        <Bassinet key={`a${i}`} at={[x, 0, -1.3]} baby={tx.babies[i % 4]} tag={tx.tags[i % 4]} tint={dim} breathe={breathe(i)} />
      ))}
      {[-1.05, -0.02, 1.02].map((x, i) => (
        <Bassinet key={`b${i}`} at={[x - 0.5, 0, -0.55]} baby={tx.babies[(i + 2) % 4]} tag={tx.tags[(i + 2) % 4]} tint="#b4bde6" breathe={breathe(i + 4)} />
      ))}
      <Bassinet at={[0.72, 0, -0.5]} baby={tx.babies[1]} tag={tx.tags[1]} tint="#b4bde6" breathe={breathe(9)} />

      {/* 우리 아기 */}
      <Bassinet at={OUR} s={OS} baby={tx.ourBaby} tag={tx.ourTag} tint="#fff3e6" breathe={breathe(2.2) * 1.4} rim="#ffe7b8" />
      <Glow tex={tx.warm} p={[OUR[0], 0.012, OUR[2] + 0.05]} w={2.3} h={1.7} r={[-Math.PI / 2, 0, 0]} o={0.32} />
      <Glow tex={tx.white} p={[OUR[0], 0.72, OUR[2] - 0.2]} w={1.0} h={0.9} o={0.14} />

      {/* 풍선 */}
      <StringTube a={tie} b={knot} sway={Math.round(sway * 400) / 400} />
      <Glow tex={tx.red} p={[bal[0], bal[1] + 0.03, bal[2] - 0.03]} w={0.95} h={1.1} o={0.3} />
      <group position={bal} rotation={[0, 0, balRot]}>
        <mesh>
          <planeGeometry args={[bw, bh]} />
          <meshBasicMaterial map={tx.one} transparent alphaTest={0.4} color="#fff2ea" toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 전등 */}
      {([[0.06, 1.95, 0.0, 1], [-0.62, 2.06, -1.0, 0.5], [0.7, 2.06, -1.0, 0.5]] as const).map(([x, y, z, pw], i) => (
        <group key={i}>
          <mesh position={[x, y + 0.6, z]}>
            <cylinderGeometry args={[0.006, 0.006, 1.1, 6]} />
            <meshBasicMaterial color={INK} />
          </mesh>
          <InkCyl p={[x, y, z]} r={0.05} r2={0.15} h={0.11} c="#f2b65a" th={0.009} seg={28} />
          <mesh position={[x, y - 0.06, z]}>
            <sphereGeometry args={[0.045, 16, 12]} />
            <meshBasicMaterial color={new THREE.Color("#ffe2b0").multiplyScalar(1.2 + 1.6 * pw)} toneMapped={false} />
          </mesh>
          <Glow tex={tx.warm} p={[x, y - 0.06, z + 0.02]} w={0.9} h={0.9} o={0.35 + 0.35 * pw} />
        </group>
      ))}
      {/* 빛기둥 + 먼지 */}
      <Glow tex={tx.beam} p={[OUR[0] + 0.06, 1.2, OUR[2] - 0.3]} w={1.25} h={1.5} o={0.2} order={2} />
      {motes.map((m, i) => {
        const y = 0.4 + ((m.y + T * 0.02 * m.sp) % 1.3);
        const tw = 0.45 + 0.55 * Math.sin(T * 1.3 * m.sp + m.ph);
        return <Glow key={i} tex={tx.white} p={[OUR[0] + m.x + Math.sin(T * 0.4 * m.sp + m.ph) * 0.03, y, OUR[2] + m.z]} w={m.s * 2.4} h={m.s * 2.4} o={0.5 * tw} k={1.6} order={7} />;
      })}

      <Post focus={focus} range={range} />
    </>
  );
};

export const NurseryFable: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#090c1f" }}>
      <ThreeCanvas width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }} camera={{ fov: 37, near: 0.05, far: 40 }} gl={{ antialias: false, toneMapping: THREE.NoToneMapping }}>
        <World frame={frame} />
      </ThreeCanvas>
      {/* 아주 옅은 따뜻한/차가운 색 입히기 */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(40,60,140,0.10) 0%, rgba(0,0,0,0) 45%, rgba(255,150,80,0.07) 100%)", mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};
