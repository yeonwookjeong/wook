// EP05 "한국 나이가 줄어든 날" — 신생아실(Fable) 화풍으로 만든 전편.
//  잉크 외곽선 3D 세계 + 2D 카드 인물, 영화식 조명·안개·블룸·피사계심도.
//  모든 박자는 t(0→1)에 맞춘다 (영어/스페인어 음성 길이가 다름).
import { ThreeCanvas } from "@remotion/three";
import { loadFont } from "@remotion/google-fonts/NotoSansKR";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { Mode05, Words05 } from "../../ep05/Scene05";
import { PEN_KO } from "../../three/mini";
import { drawAgeCard, drawCalendar, drawNewspaper, drawShelf, drawSign, drawTag } from "../cards05";
import { CamSet, Card, InkBall, InkBox, InkCyl, Person, V3, glowTex, lerp3, painted, popIn, rng, seg, sstep } from "../kit";
import { GUY2, HIM, INK, Look, ME, Pose, RIVAL, canvasTexture } from "../toonkr";
import { BABIES, Bassinet, Clock, Glow, Post, StringTube, drawBabyX, drawBeam, drawClockFace, drawFoil, drawGlass, drawNameTag, drawNight, drawSign as drawNurserySign, drawSpark } from "./NurseryFable";

const { fontFamily } = loadFont();
const F = `"${fontFamily}", Arial, sans-serif`;
type G = CanvasRenderingContext2D;

// 컷 길이(초, 영어 기준) — 숨쉬기·흔들림 같은 잔움직임 속도에만 쓴다
const DUR: Record<Mode05, number> = { baby: 4.2, dec31: 3.6, jan1: 4.9, three: 6.3, law: 8.6, except: 5.4, end: 1.8 };
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
/** t=a 에서 톡 튀어나오기 */
const pop = (t: number, a: number, d = 0.07) => popIn(t, a, a + d);
/** t=a 직후 잠깐 커졌다 돌아오는 펄스 (0→1→0) */
const pulse = (t: number, a: number, d = 0.08) => { const x = (t - a) / d; return x <= 0 || x >= 1 ? 0 : Math.sin(x * Math.PI); };

// ---------------------------------------------------------------- 그림
const drawTagLock = (g: G, n: string, c: string) => {
  drawTag(g, n, F, c);
};
/** 자물쇠 (바뀌지 않는 숫자), 120x140 */
const drawLock = (g: G) => {
  g.clearRect(0, 0, 120, 140);
  g.translate(-110, 12);
  g.lineJoin = "round"; g.lineCap = "round";
  g.strokeStyle = INK; g.lineWidth = 9;
  g.beginPath(); g.arc(170, 40, 20, Math.PI, 0); g.lineTo(190, 58); g.moveTo(150, 40); g.lineTo(150, 58); g.lineWidth = 13; g.stroke();
  g.beginPath(); g.roundRect(134, 54, 72, 58, 12); g.fillStyle = "#e2343a"; g.fill(); g.lineWidth = 8; g.stroke();
  g.fillStyle = "#fff"; g.beginPath(); g.arc(170, 82, 9, 0, Math.PI * 2); g.fill();
};
const drawHelmet = (g: G) => {
  g.clearRect(0, 0, 300, 220);
  g.lineJoin = "round";
  g.beginPath(); g.ellipse(150, 142, 136, 108, 0, Math.PI, Math.PI * 2); g.closePath();
  const gr = g.createLinearGradient(0, 30, 0, 150); gr.addColorStop(0, "#7c9a58"); gr.addColorStop(1, "#56703f");
  g.fillStyle = gr; g.fill(); g.lineWidth = 12; g.strokeStyle = INK; g.stroke();
  g.fillStyle = "rgba(60,80,40,0.55)";
  [[90, 90, 30, 16], [190, 70, 34, 18], [150, 118, 26, 12], [226, 116, 22, 12]].forEach(([x, y, a, b]) => { g.beginPath(); g.ellipse(x, y, a, b, 0.3, 0, Math.PI * 2); g.fill(); });
  g.beginPath(); g.roundRect(8, 132, 284, 30, 14); g.fillStyle = "#4d6638"; g.fill(); g.stroke();
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
  g.setLineDash([70, 400]); g.beginPath(); g.arc(188, 150, 88, Math.PI * 1.15, Math.PI * 0.5); g.lineWidth = 12; g.strokeStyle = "rgba(255,255,255,0.8)"; g.stroke(); g.setLineDash([]);
};
const drawRoundBalloon = (g: G, c: string) => {
  g.clearRect(0, 0, 200, 300);
  g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(100, 196); g.bezierCurveTo(86, 230, 114, 256, 100, 292); g.stroke();
  g.beginPath(); g.ellipse(100, 108, 76, 90, 0, 0, Math.PI * 2); g.fillStyle = c; g.fill(); g.lineWidth = 10; g.stroke();
  g.fillStyle = "rgba(255,255,255,0.6)"; g.beginPath(); g.ellipse(72, 70, 12, 26, 0.5, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(90, 196); g.lineTo(110, 196); g.lineTo(100, 210); g.closePath(); g.fillStyle = c; g.fill(); g.lineWidth = 6; g.stroke();
};
/** 도시 실루엣 (투명 바탕) */
const drawSkyline = (g: G, c: string, seed: number, lit: number, hMax = 300) => {
  const r = rng(seed);
  g.clearRect(0, 0, 1024, 512);
  let x = -10;
  while (x < 1024) {
    const w = 60 + r() * 90, h = 110 + r() * hMax;
    g.fillStyle = c; g.fillRect(x, 512 - h, w, h);
    if (r() > 0.7) g.fillRect(x + w * 0.4, 512 - h - 40, 6, 40);
    for (let yy = 512 - h + 16; yy < 500; yy += 26) for (let xx = x + 10; xx < x + w - 14; xx += 20) if (r() < lit) { g.fillStyle = "rgba(255,226,160,0.9)"; g.fillRect(xx, yy, 9, 12); g.fillStyle = c; }
    x += w + 2;
  }
};
const drawDawn = (g: G) => {
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, "#5a6fc0"); gr.addColorStop(0.4, "#b48fc8"); gr.addColorStop(0.68, "#ffb48c"); gr.addColorStop(0.86, "#ffe0a8"); gr.addColorStop(1, "#fff0cc");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  const r = rng(5);
  for (let k = 0; k < 9; k++) {
    const x = r() * 1024, y = 120 + r() * 230, w = 120 + r() * 200;
    const cg = g.createLinearGradient(0, y - 14, 0, y + 14);
    cg.addColorStop(0, "rgba(255,240,230,0)"); cg.addColorStop(0.5, "rgba(255,220,210,0.55)"); cg.addColorStop(1, "rgba(255,180,160,0)");
    g.fillStyle = cg; g.beginPath(); g.ellipse(x, y, w, 14, 0, 0, Math.PI * 2); g.fill();
  }
};
const drawDaySky = (g: G) => {
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, "#5e9fe0"); gr.addColorStop(0.7, "#bfe0f6"); gr.addColorStop(1, "#eef7fb");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  const r = rng(9);
  g.fillStyle = "rgba(255,255,255,0.9)";
  for (let k = 0; k < 6; k++) { const x = r() * 1024, y = 90 + r() * 220; for (let q = 0; q < 5; q++) { g.beginPath(); g.ellipse(x + (q - 2) * 34, y + (q % 2) * 10, 44, 26, 0, 0, Math.PI * 2); g.fill(); } }
};

// ---------------------------------------------------------------- 공용 부품
const useTagTex = () => {
  const cache = useMemo(() => new Map<string, THREE.Texture>(), []);
  return (n: string | number, c = "#ffd23a", lock = false) => {
    const key = `${n}|${c}|${lock}`;
    let t = cache.get(key);
    if (!t) { t = canvasTexture(220, 200, (g) => (lock ? drawTagLock(g, String(n), c) : drawTag(g, String(n), F, c))); cache.set(key, t); }
    return t;
  };
};
const TW = 0.264, TH = 0.24; // 머리 위 숫자표 크기
/** 사람 + 머리 위 숫자표 + 발밑 그림자 */
const Guy: React.FC<{ look: Look; pose: Pose; feet: V3; cam: V3; s?: number; bob?: number; flipX?: boolean; tint?: string; tag?: THREE.Texture; tagS?: number; tagRot?: number; shadow?: number; badge?: THREE.Texture; badgeS?: number }> = ({ look, pose, feet, cam, s = 1, bob = 0, flipX, tint, tag, tagS = 1, tagRot = 0, shadow = 0.3, badge, badgeS = 0 }) => (
  <group>
    {shadow > 0 && (
      <mesh position={[feet[0], feet[1] + 0.016, feet[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.5, 1]}>
        <circleGeometry args={[0.2 * s, 24]} />
        <meshBasicMaterial color="#1a0f18" transparent opacity={shadow} depthWrite={false} />
      </mesh>
    )}
    <Person look={look} pose={pose} feet={feet} cam={cam} scale={s} bob={bob} flipX={flipX} tint={tint} />
    {tag && <Card tex={tag} at={[feet[0], feet[1] + s * 0.87 + 0.15 + bob, feet[2] + 0.02]} w={TW} h={TH} cam={cam} scale={tagS} rotZ={tagRot} tint="#ffffff" />}
    {badge && badgeS > 0.01 && <Card tex={badge} at={[feet[0] + 0.15, feet[1] + s * 0.87 + 0.25 + bob, feet[2] + 0.04]} w={0.12} h={0.14} cam={cam} scale={badgeS} rotZ={-0.15} tint="#ffffff" />}
  </group>
);
/** 벽 등에 붙이는 그림판 (알파 테스트) */
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
const Sky: React.FC<{ tex: THREE.Texture; z: number; w?: number; h?: number; y?: number; k?: number }> = ({ tex, z, w = 30, h = 15, y = 5, k = 1 }) => {
  const col = useMemo(() => new THREE.Color("#fff").multiplyScalar(k), [k]);
  return (
    <mesh position={[0, y, z]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} color={col} toneMapped={false} fog={false} />
    </mesh>
  );
};
const Floor: React.FC<{ tex: THREE.Texture; size?: number; rough?: number; z?: number }> = ({ tex, size = 12, rough = 0.5, z = 0 }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, z]} receiveShadow>
    <planeGeometry args={[size, size]} />
    <meshStandardMaterial map={tex} roughness={rough} metalness={0.02} />
  </mesh>
);
const tiles = (base: string, a: string, b: string, line: string, rep: number, seed = 5) => {
  const t = painted(1024, 1024, base, (g) => {
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? a : b; g.fillRect(i * 128, j * 128, 128, 128); }
    g.strokeStyle = line; g.lineWidth = 3;
    for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 1024); g.moveTo(0, i * 128); g.lineTo(1024, i * 128); g.stroke(); }
  }, seed);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep);
  return t;
};

// ================================================================ 1. 신생아실 (baby · dec31 · jan1)
const GZ = -2.0;
const OUR: V3 = [0, 0, 0.3];
const OS = 1.22;
const ROWS: V3[] = [[-1.26, 0, -1.3], [-0.42, 0, -1.3], [0.42, 0, -1.3], [1.26, 0, -1.3], [-1.55, 0, -0.55], [-0.56, 0, -0.55], [0.74, 0, -0.5], [1.6, 0, -0.55]];

const Nursery: React.FC<{ mode: Mode05; t: number }> = ({ mode, t }) => {
  const T = t * DUR[mode];
  const jan = mode === "jan1", dec = mode === "dec31", est = mode === "baby";
  const tagTex = useTagTex();
  const tx = useMemo(() => {
    const floor = tiles("#cfd9e6", "rgba(255,255,255,0.22)", "rgba(120,150,190,0.16)", "rgba(60,70,110,0.25)", 2.5);
    const wallUp = canvasTexture(1536, 512, (g) => {
      const r = rng(8);
      const gr = g.createLinearGradient(0, 0, 0, 512);
      gr.addColorStop(0, "#5f86a8"); gr.addColorStop(0.55, "#9cc7c6"); gr.addColorStop(1, "#c6e3d6");
      g.fillStyle = gr; g.fillRect(0, 0, 1536, 512);
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
    return {
      floor, wallUp, wallLow,
      corridor: painted(512, 512, "#e9c9a0", undefined, 4),
      glass: canvasTexture(1024, 512, drawGlass),
      night: canvasTexture(1024, 512, drawNight),
      sign: canvasTexture(1024, 300, drawNurserySign),
      clock: canvasTexture(512, 512, drawClockFace),
      calDec: canvasTexture(400, 480, (g) => drawCalendar(g, "12월", "31", PEN_KO, false)),
      calJan: canvasTexture(400, 480, (g) => drawCalendar(g, "1월", "1", PEN_KO, true)),
      one: canvasTexture(600, 900, (g) => drawFoil(g, "1")),
      two: canvasTexture(600, 900, (g) => drawFoil(g, "2", "#ffb52e", "#d27a0a", "#ffd76a")),
      beam: canvasTexture(256, 512, drawBeam),
      warm: glowTex("255,196,130"),
      red: glowTex("255,90,100"),
      gold: glowTex("255,200,90"),
      white: glowTex("255,244,225"),
      sparks: ["#ffd23a", "#ff7fa8", "#7fe0ff", "#9cff9a"].map((c) => canvasTexture(256, 256, (g) => drawSpark(g, c))),
      babies: BABIES.map((b) => canvasTexture(400, 400, (g) => drawBabyX(g, 1, b.wrap, b.wrap2, b.hat, !!b.awake))),
      tags: BABIES.map((b) => canvasTexture(256, 160, (g) => drawNameTag(g, b.tag, false))),
      ourBaby: canvasTexture(1000, 1000, (g) => drawBabyX(g, 2.5, "#fff6f0", "#ffd3dc", "#ffd45c", false)),
      ourBabyAwake: canvasTexture(1000, 1000, (g) => drawBabyX(g, 2.5, "#fff6f0", "#ffd3dc", "#ffd45c", true)),
      ourTag: canvasTexture(256, 160, (g) => drawNameTag(g, "#ffd9a0", true)),
    };
  }, []);

  // ---- 박자
  const midnight = jan ? seg(t, 0.1, 0.13) : 0; // 자정
  const flip = jan ? seg(t, 0.13, 0.3) : 0; // 달력 넘김
  const twoAt = 0.81; // "Two."
  const isTwo = jan && t >= twoAt;
  const secs = est ? 86400 - 96 + T : dec ? 86400 - 46 + t * 30 : t < 0.12 ? 86400 - 8 + (t / 0.12) * 8 : 86400 + (t - 0.12) * DUR.jan1;
  const balS = est ? 0 : dec ? pop(t, 0.12, 0.1) : 1 + 0.35 * pulse(t, twoAt, 0.1) - 0.25 * pulse(t, twoAt - 0.04, 0.045);
  const cheer = jan ? seg(t, 0.12, 0.2) : 0;

  // ---- 카메라
  const k = sstep(t);
  let camP: V3, camT: V3, fov = 35;
  if (est) {
    camP = lerp3([0.0, 1.5, 3.9], [0.05, 1.2, 2.95], k * 0.92 + t * 0.08);
    camT = lerp3([0.0, 1.02, GZ], [0.02, 0.8, GZ], k);
    fov = 37 - 2 * k;
  } else if (dec) {
    camP = lerp3([-0.1, 1.12, 3.05], [0.0, 1.1, 2.82], k * 0.7 + t * 0.3);
    camT = [0.0, 0.76, GZ];
  } else {
    camP = lerp3([0.06, 1.1, 2.95], [0.02, 1.08, 2.68], k * 0.6 + t * 0.4);
    camT = [0.01, 0.78, GZ];
    fov = 35 - 1.6 * seg(t, twoAt, twoAt + 0.1);
  }
  const cam: V3 = [camP[0] + Math.sin(T * 0.7) * 0.005, camP[1] + Math.sin(T * 0.9 + 1) * 0.004, camP[2]];
  const dBaby = Math.hypot(cam[0] - OUR[0], cam[1] - 0.66, cam[2] - OUR[2]);
  const dGlass = Math.hypot(cam[0], cam[1] - 0.9, cam[2] - GZ);
  const rack = est ? seg(t, 0.25, 0.8) : 1;
  const focus = mix(dGlass * 0.92, dBaby, rack);
  const range = est ? mix(3.2, 2.2, rack) : 4.6;

  // ---- 부모
  const blinkA = Math.floor(T * 30) % 97 > 92, blinkB = (Math.floor(T * 30) + 40) % 113 > 108;
  const wave = Math.sin(T * 5.2);
  const mom: Pose = cheer > 0.5 ? { armL: 150 + wave * 8, armR: 150 - wave * 8, mouth: "open", blush: 0.8, brow: 0.6 } : { armL: 14, armR: 138 + wave * 9, mouth: "grin", blink: blinkA, look: 0.4, blush: 0.75 };
  const dad: Pose = cheer > 0.5 ? { armL: 152 - wave * 8, armR: 148 + wave * 8, mouth: "grin", blush: 0.5, brow: 0.6 } : { armL: 150, armR: 16, mouth: dec && t > 0.2 ? "grin" : "smile", blink: blinkB, look: -0.2, blush: 0.4 };
  const hop = cheer * 0.03;
  const bobM = Math.abs(Math.sin(T * (2.6 + cheer * 3))) * (0.014 + hop), bobD = Math.abs(Math.sin(T * (2.6 + cheer * 3) + 1.2)) * (0.008 + hop);

  // ---- 풍선
  const sway = Math.sin(T * 1.25) * 0.016 + Math.sin(T * 2.3 + 1) * 0.005;
  const tie: V3 = [OUR[0] + 0.27 * OS, (0.36 + 0.2) * OS, OUR[2] + 0.14 * OS];
  const bw = 0.31, bh = 0.465;
  const rise = dec ? 1 - sstep(clamp01((t - 0.12) / 0.14)) : 0;
  const bal: V3 = [OUR[0] + 0.25 + sway, 1.06 - rise * 0.3 + Math.sin(T * 1.7) * 0.008, OUR[2] + 0.06];
  const balRot = -0.07 + sway * 2.2;
  const knot: V3 = [bal[0] + Math.sin(balRot) * bh * 0.39 + 0.012, bal[1] - bh * 0.39, bal[2]];

  const breathe = (ph: number) => Math.sin(T * 2.1 + ph) * 0.004;
  const motes = useMemo(() => {
    const r = rng(23);
    return Array.from({ length: 22 }, () => ({ x: (r() - 0.5) * 0.95, y: r() * 1.3, z: (r() - 0.5) * 1.3, s: 0.006 + r() * 0.012, ph: r() * 6.28, sp: 0.3 + r() * 0.6 }));
  }, []);
  // 불꽃놀이: 자정부터 잇달아 터진다
  const fw = useMemo(() => {
    const r = rng(41);
    return Array.from({ length: 14 }, (_, i) => ({ x: -1.05 + r() * 2.1, y: 1.0 + r() * 0.26, t0: 0.12 + i * 0.062 + r() * 0.02, i: i % 4, s: 0.8 + r() * 0.7 }));
  }, []);
  const flash = jan ? fw.reduce((a, f) => a + pulse(t, f.t0, 0.1), 0) : 0;

  // 다른 아기들 숫자표: dec31 끝에 "1", jan1 중간에 "2"
  const others = ROWS.map((p, i) => {
    const a0 = 0.5 + i * 0.045;
    const s = est ? 0 : dec ? pop(t, a0, 0.08) : 1 + 0.4 * pulse(t, 0.46 + i * 0.012, 0.09);
    const n = jan && t > 0.5 + i * 0.012 ? 2 : 1;
    return { p, s, n };
  });

  return (
    <>
      <CamSet p={cam} t={camT} fov={fov} />
      <color attach="background" args={["#090c1f"]} />
      <fogExp2 attach="fog" args={["#10152f", 0.075]} />

      <hemisphereLight args={["#6f86d6", "#2a2238", 0.55]} />
      <directionalLight position={[-3, 4, 3]} intensity={0.55} color="#8fa6ff" />
      <spotLight position={[0.25, 2.9, 1.1]} angle={0.36} penumbra={0.95} intensity={46} decay={1.6} distance={7} color="#ffcf98" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0008} shadow-normalBias={0.02}>
        <object3D attach="target" position={[0, 0.3, 0.2]} />
      </spotLight>
      <pointLight position={[0, 1.95, -3.0]} intensity={5 + flash * 5} distance={5} decay={1.4} color="#ffc48a" />
      <pointLight position={[-1.3, 1.4, -1.1]} intensity={2.4} distance={4} decay={1.5} color="#6fd6e6" />
      <pointLight position={[1.4, 1.2, -0.6]} intensity={1.6 + flash * 2} distance={4} decay={1.5} color="#ff9ab8" />
      {balS > 0.3 && <pointLight position={[bal[0] - 0.1, bal[1] - 0.25, bal[2] + 0.15]} intensity={0.55} distance={1.2} decay={1.6} color={isTwo ? "#ffc060" : "#ff5a6a"} />}

      <Floor tex={tx.floor} size={9} rough={0.32} z={0.5} />
      <InkBox p={[0, 0.225, GZ]} s={[6, 0.45, 0.14]} c="#ffffff" map={tx.wallLow} th={0.01} />
      <InkBox p={[0, 2.35, GZ]} s={[6, 2.0, 0.14]} c="#ffffff" map={tx.wallUp} th={0.01} />
      <InkBox p={[-2.2, 0.9, GZ]} s={[1.6, 0.9, 0.14]} c="#bfe0d8" th={0.01} />
      <InkBox p={[2.2, 0.9, GZ]} s={[1.6, 0.9, 0.14]} c="#bfe0d8" th={0.01} />
      <InkBox p={[0, 0.46, GZ + 0.03]} s={[2.9, 0.05, 0.24]} c="#fff6ec" th={0.009} />
      <InkBox p={[0, 1.35, GZ + 0.02]} s={[2.9, 0.045, 0.2]} c="#fff6ec" th={0.009} />
      {[-0.98, 0.98].map((x) => <InkBox key={x} p={[x, 0.905, GZ + 0.02]} s={[0.04, 0.85, 0.16]} c="#fff6ec" th={0.008} />)}
      <Glow tex={tx.glass} p={[0, 0.905, GZ + 0.03]} w={2.86} h={0.86} o={0.5} order={5} />

      {/* 간판 · 시계 · 달력 */}
      <InkBox p={[0, 1.66, GZ + 0.1]} s={[0.68, 0.2, 0.06]} c="#5a3b3a" th={0.012} round={0.03} />
      <Glow tex={tx.sign} p={[0, 1.66, GZ + 0.15]} w={0.64} h={0.187} k={1.2} add={false} />
      <Glow tex={tx.warm} p={[0, 1.66, GZ + 0.085]} w={2.0} h={1.0} o={0.5} />
      <Clock at={[0.62, 1.68, GZ + 0.1]} secs={secs} face={tx.clock} R={0.175} />
      {midnight > 0 && <Glow tex={tx.gold} p={[0.62, 1.68, GZ + 0.2]} w={0.9} h={0.9} o={0.7 * pulse(t, 0.1, 0.16)} />}
      <group position={[-0.62, 1.68, GZ + 0.09]} rotation={[0, 0, 0.03]}>
        <Decal tex={jan ? tx.calJan : tx.calDec} p={[0, 0, 0]} w={0.3} h={0.36} tint={jan ? "#fff4ea" : "#e4dcea"} />
        {jan && flip < 1 && (
          <group position={[0, 0.15, 0.02]} rotation={[-flip * 2.4, 0, 0]}>
            <Decal tex={tx.calDec} p={[0, -0.15 + flip * 0.1, 0]} w={0.3} h={0.36} tint="#e4dcea" scale={1 - flip * 0.25} />
          </group>
        )}
      </group>
      {jan && <Glow tex={tx.gold} p={[-0.62, 1.68, GZ + 0.2]} w={0.9} h={0.9} o={0.6 * pulse(t, 0.2, 0.16)} />}

      {/* 복도 */}
      <mesh position={[0, 1.5, -4.3]}>
        <planeGeometry args={[8, 3.4]} />
        <meshStandardMaterial map={tx.corridor} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -3.2]}>
        <planeGeometry args={[8, 2.3]} />
        <meshStandardMaterial color="#b89a86" roughness={0.6} />
      </mesh>
      <InkBox p={[0, 1.02, -4.28]} s={[2.7, 0.74, 0.05]} c="#fff0dc" th={0.012} />
      <Glow tex={tx.night} p={[0, 1.02, -4.24]} w={2.56} h={0.62} k={1.25 + flash * 0.25} add={false} fog />
      {jan && fw.map((f, i) => {
        const a = (t - f.t0) / 0.2;
        if (a <= 0 || a >= 1) return null;
        const grow = 1 - Math.pow(1 - a, 3);
        return (
          <group key={i}>
            <Glow tex={tx.sparks[f.i]} p={[f.x, f.y - a * a * 0.03, -4.22]} w={0.42} h={0.42} scale={f.s * (0.25 + grow * 0.9)} o={Math.min(1, (1 - a) * 2.2)} k={2.6} />
            <Glow tex={tx.white} p={[f.x, f.y, -4.21]} w={0.8} h={0.8} o={0.5 * (1 - a) * (1 - a)} k={1.4} />
          </group>
        );
      })}
      {[-1.75, 1.75].map((x) => <Glow key={x} tex={tx.warm} p={[x, 1.55, -4.2]} w={1.5} h={1.5} o={0.7} k={1.3} />)}

      {/* 부모 (유리 너머) */}
      <Person look={ME} pose={mom} feet={[-0.5, -0.04, GZ - 0.42]} cam={cam} tint="#f0dccd" bob={bobM} scale={1.18} />
      <Person look={HIM} pose={dad} feet={[0.03, 0.0, GZ - 0.5]} cam={cam} tint="#ecd6c6" bob={bobD} scale={1.18} />

      {/* 아기 침대들 */}
      {ROWS.map((p, i) => (
        <Bassinet key={i} at={p} baby={tx.babies[i % 4]} tag={tx.tags[i % 4]} tint={i < 4 ? "#a2aede" : "#b4bde6"} breathe={breathe(i)} />
      ))}
      {others.map((o, i) => o.s > 0.01 && (
        <Card key={i} tex={tagTex(o.n, o.n === 2 ? "#ffd23a" : "#ffe9a8")} at={[o.p[0], 0.9 + Math.sin(T * 1.6 + i) * 0.008, o.p[2] + 0.02]} w={0.2} h={0.182} cam={cam} scale={o.s} tint={i < 4 ? "#c9cdea" : "#dcdcf0"} />
      ))}

      {/* 우리 아기 */}
      <Bassinet at={OUR} s={OS} baby={isTwo ? tx.ourBabyAwake : tx.ourBaby} tag={tx.ourTag} tint="#fff3e6" breathe={breathe(2.2) * 1.4} rim="#ffe7b8" />
      <Glow tex={tx.warm} p={[OUR[0], 0.012, OUR[2] + 0.05]} w={2.3} h={1.7} r={[-Math.PI / 2, 0, 0]} o={0.32} />
      <Glow tex={tx.white} p={[OUR[0], 0.72, OUR[2] - 0.2]} w={1.0} h={0.9} o={0.14} />

      {/* 풍선 */}
      {balS > 0.02 && (
        <>
          <StringTube a={tie} b={knot} sway={Math.round(sway * 400) / 400 + Math.round(rise * 50)} />
          <Glow tex={isTwo ? tx.gold : tx.red} p={[bal[0], bal[1] + 0.03, bal[2] - 0.03]} w={0.95} h={1.1} o={0.3 + 0.5 * pulse(t, twoAt, 0.14) * (jan ? 1 : 0) + 0.4 * (dec ? pulse(t, 0.12, 0.14) : 0)} />
          <group position={bal} rotation={[0, 0, balRot]} scale={balS}>
            <Decal tex={isTwo ? tx.two : tx.one} p={[0, 0, 0]} w={bw} h={bh} tint="#fff2ea" />
          </group>
        </>
      )}
      {/* "2" 로 바뀌는 순간 반짝임 */}
      {jan && [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (t - twoAt) / 0.14;
        if (a <= 0 || a >= 1) return null;
        const ang = (i / 8) * Math.PI * 2 + 0.3, r = 0.1 + a * 0.34;
        return <Glow key={i} tex={tx.sparks[i % 4]} p={[bal[0] + Math.cos(ang) * r, bal[1] + Math.sin(ang) * r * 1.2, bal[2] + 0.05]} w={0.12} h={0.12} o={1 - a} k={2.2} />;
      })}

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

// ================================================================ 2. 거실 생일상 (three · end)
const AGES: [keyof Words05, string, string][] = [["korean", "28", "#e2343a"], ["year", "27", "#3b6fb6"], ["intl", "26", "#2f9d7a"]];
const CW = 0.335, CH = 0.41;
const TX = 0.44, TZ = 0.42;
const Living: React.FC<{ mode: Mode05; t: number; w: Words05 }> = ({ mode, t, w }) => {
  const end = mode === "end";
  const T = t * DUR[mode];
  const tx = useMemo(() => {
    const floor = painted(1024, 1024, "#c99a68", (g) => {
      g.strokeStyle = "rgba(90,50,20,0.35)"; g.lineWidth = 4;
      for (let y = 0; y <= 1024; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
      for (let y = 0; y < 1024; y += 128) for (let x = (y / 128) % 2 ? 180 : 520; x < 1024; x += 680) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 128); g.stroke(); }
    }, 7);
    floor.wrapS = floor.wrapT = THREE.RepeatWrapping; floor.repeat.set(3, 3);
    const wall = canvasTexture(1024, 512, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 512);
      gr.addColorStop(0, "#3f6a78"); gr.addColorStop(0.5, "#6f9c9a"); gr.addColorStop(1, "#a9c8b8");
      g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
      g.fillStyle = "rgba(255,255,255,0.10)";
      for (let x = 0; x < 1024; x += 48) g.fillRect(x, 0, 6, 512);
    });
    const dusk = canvasTexture(256, 256, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, "#3a3f8a"); gr.addColorStop(0.6, "#c86a8a"); gr.addColorStop(1, "#ffb070");
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      g.fillStyle = "#2a2850"; [[0, 70], [50, 110], [110, 60], [170, 130], [220, 90]].forEach(([x, h]) => g.fillRect(x, 256 - h, 44, h));
    });
    return {
      floor, wall, dusk,
      cards: AGES.map(([key, n, c]) => canvasTexture(360, 440, (g) => drawAgeCard(g, w[key], n, c, F))),
      q: canvasTexture(400, 480, drawQ),
      warm: glowTex("255,196,130"), white: glowTex("255,244,225"), gold: glowTex("255,200,90"),
      glows: ["255,90,100", "110,160,255", "90,220,170"].map((c) => glowTex(c)),
      balloons: ["#ff8fa6", "#8fc8ff", "#ffd76a"].map((c) => canvasTexture(200, 300, (g) => drawRoundBalloon(g, c))),
      sparks: ["#ffd23a", "#ff7fa8", "#7fe0ff"].map((c) => canvasTexture(256, 256, (g) => drawSpark(g, c))),
    };
  }, [w]);

  const k = sstep(t);
  const cam: V3 = end ? lerp3([0, 1.14, 3.95], [0, 1.16, 3.5], k * 0.5 + t * 0.5) : lerp3([0, 1.1, 4.0], [0, 1.08, 3.42], k * 0.6 + t * 0.4);
  const camT: V3 = end ? [0, 1.17, 0] : [0, 1.02, 0];
  const S = 1.25;
  const AT = [0.19, 0.365, 0.54];
  // 카드 자리: three = 머리 둘레 반원, end = 한 줄 + 큰 물음표
  const slots: V3[] = end ? [[-0.34, 1.33, 0.14], [0, 1.33, 0.14], [0.34, 1.33, 0.14]] : [[-0.38, 1.3, 0.14], [0, 1.66, 0.14], [0.38, 1.3, 0.14]];
  const cs = end ? 0.86 : 1;
  const shown = AT.filter((a) => t >= a).length;
  const shrug = end ? 0 : seg(t, 0.72, 0.82);
  const pose: Pose = end
    ? { armL: 20, armR: 128 + Math.sin(T * 6) * 6, mouth: "grin", blush: 0.6, look: 0, brow: 0.4 }
    : shrug > 0.5
      ? { armL: 82, armR: 82, mouth: "flat", brow: 0.9, look: Math.sin(T * 3) * 0.6, blush: 0.3 }
      : { armL: 12, armR: shown > 0 ? 30 : 12, mouth: shown === 0 ? "smile" : "o", brow: shown * 0.3, look: [0, -0.9, 0, 0.9][shown], blush: 0.4, blink: Math.floor(T * 30) % 90 > 86 };
  const qS = end ? pop(t, 0.38, 0.2) : 0;
  const lights = useMemo(() => Array.from({ length: 13 }, (_, i) => ({ x: -1.5 + i * 0.25, y: 2.08 - Math.sin((i / 12) * Math.PI) * 0.16, c: ["#ffd76a", "#ff8fa6", "#8fe0ff", "#b8ff9a"][i % 4] })), []);

  return (
    <>
      <CamSet p={cam} t={camT} fov={35} />
      <color attach="background" args={["#1c1a2a"]} />
      <fogExp2 attach="fog" args={["#2a2438", 0.04]} />
      <hemisphereLight args={["#c8d0f0", "#5a3a30", end ? 0.8 : 0.6]} />
      <spotLight position={[0.6, 3.0, 1.8]} angle={0.5} penumbra={0.9} intensity={38} decay={1.6} distance={8} color="#ffd6a0" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0008} shadow-normalBias={0.02}>
        <object3D attach="target" position={[0, 0.5, 0]} />
      </spotLight>
      <pointLight position={[-0.95, 1.1, -0.9]} intensity={3.2} distance={4} decay={1.5} color="#ffb060" />
      <pointLight position={[1.3, 1.3, -0.4]} intensity={1.4} distance={4} decay={1.5} color="#ff8fb0" />
      <pointLight position={[TX, 0.85, TZ + 0.15]} intensity={1.1} distance={1.6} decay={1.6} color="#ffc070" />

      <Floor tex={tx.floor} size={9} rough={0.45} />
      <InkBox p={[0, 1.6, -1.6]} s={[7, 3.2, 0.12]} c="#ffffff" map={tx.wall} th={0.01} />
      <InkBox p={[0, 0.09, -1.52]} s={[7, 0.18, 0.05]} c="#fff0dc" th={0.008} />
      {/* 창 (해 질 녘) */}
      <InkBox p={[-1.05, 1.25, -1.53]} s={[0.78, 0.98, 0.06]} c="#fff0dc" th={0.01} />
      <Glow tex={tx.dusk} p={[-1.05, 1.25, -1.48]} w={0.66} h={0.86} k={1.15} add={false} fog />
      <InkBox p={[-1.05, 1.25, -1.46]} s={[0.03, 0.86, 0.02]} c="#fff0dc" th={0.006} />
      {/* 소파 */}
      <InkBox p={[1.0, 0.24, -1.05]} s={[1.3, 0.3, 0.6]} c="#e2806a" th={0.012} round={0.06} />
      <InkBox p={[1.0, 0.56, -1.3]} s={[1.3, 0.5, 0.18]} c="#e2806a" th={0.012} round={0.06} />
      <InkBox p={[0.72, 0.5, -1.12]} s={[0.3, 0.26, 0.1]} c="#ffcf6a" th={0.01} round={0.05} r={[0, 0, 0.2]} />
      {/* 스탠드 */}
      <InkCyl p={[-0.5, 0.55, -1.2]} r={0.012} h={1.1} c="#5a4638" th={0.006} seg={8} />
      <InkCyl p={[-0.5, 0.015, -1.2]} r={0.11} h={0.03} c="#5a4638" th={0.006} />
      <InkCyl p={[-0.5, 1.2, -1.2]} r={0.1} r2={0.17} h={0.24} c="#ffd9a0" th={0.01} e="#ff9a40" />
      <Glow tex={tx.warm} p={[-0.5, 1.2, -1.1]} w={1.5} h={1.5} o={0.55} />
      {/* 줄 전구 */}
      {lights.map((l, i) => (
        <group key={i}>
          <mesh position={[l.x, l.y, -1.5]}>
            <sphereGeometry args={[0.03, 10, 8]} />
            <meshBasicMaterial color={new THREE.Color(l.c).multiplyScalar(1.5 + 0.6 * Math.sin(T * 2 + i))} toneMapped={false} />
          </mesh>
          <Glow tex={tx.white} p={[l.x, l.y, -1.47]} w={0.3} h={0.3} o={0.35} />
        </group>
      ))}
      {/* 풍선 다발 */}
      {tx.balloons.map((b, i) => <Decal key={i} tex={b} p={[1.2 + (i - 1) * 0.17, 1.42 + (i % 2) * 0.12 + Math.sin(T * 1.3 + i) * 0.012, -1.2 + i * 0.03]} w={0.26} h={0.39} tint="#f0d8c8" r={[0, 0, (i - 1) * 0.16]} />)}

      {/* 생일상 (얼굴을 가리지 않게 옆으로) */}
      <InkCyl p={[TX, 0.36, TZ]} r={0.34} h={0.04} c="#8a5a3a" th={0.012} seg={40} />
      <InkCyl p={[TX, 0.165, TZ]} r={0.06} h={0.33} c="#6f452c" th={0.01} />
      <InkCyl p={[TX, 0.425, TZ]} r={0.15} h={0.09} c="#fff4e6" th={0.01} />
      <InkCyl p={[TX, 0.492, TZ]} r={0.152} h={0.045} c="#ff9db0" th={0.01} />
      {[-0.08, 0, 0.08].map((x, i) => (
        <group key={x}>
          <InkCyl p={[TX + x, 0.56, TZ + (i === 1 ? 0.05 : 0)]} r={0.011} h={0.09} c={["#8fc8ff", "#ffd76a", "#b8ff9a"][i]} th={0.005} seg={8} />
          <Glow tex={tx.gold} p={[TX + x, 0.635 + Math.sin(T * 9 + i) * 0.004, TZ + 0.02 + (i === 1 ? 0.05 : 0)]} w={0.09} h={0.12} o={0.95} k={2.2} />
        </group>
      ))}
      <InkCyl p={[TX - 0.23, 0.405, TZ + 0.06]} r={0.06} r2={0.04} h={0.045} c="#f4f1ea" th={0.008} />

      {/* 주인공 */}
      <Guy look={ME} pose={pose} feet={[0, 0, 0]} cam={cam} s={S} bob={Math.abs(Math.sin(T * 2.2)) * 0.008 + (end ? pulse(t, 0.38, 0.25) * 0.05 : 0)} />

      {/* 나이 카드 세 장 */}
      {tx.cards.map((c, i) => {
        const s = end ? 1 : pop(t, AT[i], 0.07);
        const p = slots[i];
        const y = p[1] + Math.sin(T * 1.8 + i * 2) * 0.012;
        const fl = end ? 0 : pulse(t, AT[i], 0.12);
        return (
          <group key={i}>
            <Glow tex={tx.glows[i]} p={[p[0], y, p[2] - 0.04]} w={0.9} h={0.9} o={(0.22 + 0.6 * fl) * Math.min(1, s)} />
            <Card tex={c} at={[p[0], y, p[2]]} w={CW} h={CH} cam={cam} scale={s * cs} rotZ={(i - 1) * -0.07 + Math.sin(T * 1.2 + i) * 0.02} tint="#fffaf2" />
          </group>
        );
      })}
      {/* 큰 물음표 */}
      {qS > 0.01 && (
        <>
          <Glow tex={tx.gold} p={[0, 1.82, 0.1]} w={1.5} h={1.5} o={0.55 * Math.min(1, qS)} />
          <Card tex={tx.q} at={[0, 1.82 + Math.sin(T * 3) * 0.01, 0.16]} w={0.42} h={0.5} cam={cam} scale={qS} rotZ={Math.sin(T * 4) * 0.05} tint="#ffffff" />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = clamp01((t - 0.38) / 0.4);
            const ang = (i / 6) * Math.PI * 2 + 0.5, r = 0.2 + a * 0.3;
            return <Glow key={i} tex={tx.sparks[i % 3]} p={[Math.cos(ang) * r, 1.82 + Math.sin(ang) * r, 0.2]} w={0.14} h={0.14} o={a > 0 ? 1 - a * 0.6 : 0} k={2.2} />;
          })}
        </>
      )}
      <Post focus={Math.hypot(cam[1] - 1.1, cam[2] - 0.1)} range={2.6} bloom={0.55} />
    </>
  );
};

// ================================================================ 3-A. 신문 (law 앞부분)
const Desk: React.FC<{ u: number; w: Words05 }> = ({ u, w }) => {
  const tx = useMemo(() => {
    const wood = painted(1024, 1024, "#a86f42", (g, r) => {
      for (let k = 0; k < 60; k++) { g.strokeStyle = `rgba(70,35,10,${0.08 + r() * 0.12})`; g.lineWidth = 2 + r() * 5; const y = r() * 1024; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(300, y + r() * 30 - 15, 700, y + r() * 30 - 15, 1024, y); g.stroke(); }
      g.strokeStyle = "rgba(50,25,10,0.5)"; g.lineWidth = 6;
      [340, 690].forEach((y) => { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); });
    }, 3);
    return {
      wood,
      paper: canvasTexture(1200, 880, (g) => { g.scale(2, 2); drawNewspaper(g, w.news, w.lang === "es" ? "28 JUNIO 2023" : "JUNE 28, 2023", F); }),
      warm: glowTex("255,206,150"), white: glowTex("255,250,240"), dark: glowTex("20,8,0"),
      beam: canvasTexture(256, 512, drawBeam),
    };
  }, [w]);
  const land = sstep(clamp01(u / 0.1));
  const k = sstep(u);
  const whip = Math.pow(clamp01((u - 0.9) / 0.1), 2);
  const cam: V3 = lerp3([0, 2.75, 1.75], [0, 2.5, 1.5], k * 0.5 + u * 0.5);
  cam[1] += whip * 1.6;
  const PW = 1.12, PH = PW * (440 / 600);
  const y = 0.03 + (1 - land) * 0.9;
  const rz = -0.07 - (1 - land) * 0.5;
  const hit = pulse(u, 0.08, 0.1);
  return (
    <>
      <CamSet p={[cam[0] + hit * 0.01, cam[1] - hit * 0.03, cam[2]]} t={[0, 0, 0.16]} fov={35} />
      <color attach="background" args={["#4a2a18"]} />
      <hemisphereLight args={["#ffe6c8", "#6a4030", 0.9]} />
      <directionalLight position={[-2.5, 3, -1.5]} intensity={2.4} color="#ffd9a8" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0006} shadow-camera-left={-2} shadow-camera-right={2} shadow-camera-top={2} shadow-camera-bottom={-2} />
      <Floor tex={tx.wood} size={7} rough={0.5} />
      {/* 아침 햇살 줄기 */}
      <Glow tex={tx.beam} p={[-0.2, 0.02, -0.15]} w={2.2} h={3.6} r={[-Math.PI / 2, 0, 0.9]} o={0.3} />
      {/* 신문 그림자 + 신문 */}
      <Glow tex={tx.dark} p={[0.03, 0.012, 0.03]} w={PW * (1.5 + (1 - land))} h={PH * (1.7 + (1 - land))} r={[-Math.PI / 2, 0, rz]} o={0.75 * land} add={false} />
      <Decal tex={tx.paper} p={[0, y, 0]} w={PW} h={PH} r={[-Math.PI / 2, 0, rz]} tint="#fff6ea" scale={1 + (1 - land) * 0.5} />
      <Glow tex={tx.white} p={[0, 0.05, 0]} w={2.4} h={1.9} r={[-Math.PI / 2, 0, 0]} o={0.5 * hit} />
      {/* 커피잔 */}
      <InkCyl p={[-0.4, 0.012, -0.66]} r={0.15} h={0.02} c="#f4efe6" th={0.008} />
      <InkCyl p={[-0.4, 0.085, -0.66]} r={0.095} r2={0.075} h={0.13} c="#f4efe6" th={0.009} />
      <mesh position={[-0.4, 0.152, -0.66]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.082, 24]} />
        <meshBasicMaterial color="#5a3018" toneMapped={false} />
      </mesh>
      {[0, 1, 2].map((i) => { const a = (u * 3 + i / 3) % 1; return <Glow key={i} tex={tx.white} p={[-0.4 + Math.sin(a * 5 + i) * 0.03, 0.2 + a * 0.3, -0.66]} w={0.16} h={0.2} o={0.28 * Math.sin(a * Math.PI)} />; })}
      {/* 안경 · 펜 */}
      <InkBox p={[0.42, 0.02, -0.6]} s={[0.34, 0.02, 0.03]} c="#e2343a" th={0.007} r={[0, 0.5, 0]} round={0.008} />
      <Post focus={Math.hypot(cam[1], cam[2] - 0.1)} range={3} bloom={0.45} vig={0.7} />
    </>
  );
};

// ================================================================ 3-B. 새벽 광장 (law 뒷부분)
const ELDER: Look = { skin: "#eac4a2", hair: "short", hairC: "#b9b6bd", top: "#8a6a9a", bottom: "#4a4658", shoes: "#3a3030", glasses: true };
const CROWD: { look: Look; x: number; z: number; y: number; from: number; to: number; s: number; flip?: boolean }[] = [
  { look: RIVAL, x: -0.74, z: -0.5, y: 0.4, from: 29, to: 27, s: 1 },
  { look: ELDER, x: 0.0, z: -0.55, y: 0.4, from: 61, to: 60, s: 1 },
  { look: GUY2, x: 0.74, z: -0.5, y: 0.4, from: 25, to: 24, s: 1, flip: true },
  { look: ME, x: -0.36, z: 0.5, y: 0, from: 28, to: 26, s: 1.04 },
  { look: HIM, x: 0.36, z: 0.46, y: 0, from: 33, to: 32, s: 1.04, flip: true },
];
const Plaza: React.FC<{ u: number; w: Words05 }> = ({ u }) => {
  const T = u * 6;
  const tagTex = useTagTex();
  const tx = useMemo(() => ({
    floor: tiles("#d8c4b4", "rgba(255,240,225,0.25)", "rgba(150,110,110,0.14)", "rgba(90,60,70,0.28)", 4, 12),
    sky: canvasTexture(1024, 512, drawDawn),
    far: canvasTexture(1024, 512, (g) => drawSkyline(g, "#a487b8", 3, 0.08, 230)),
    near: canvasTexture(1024, 512, (g) => drawSkyline(g, "#8068a4", 17, 0.2, 260)),
    sun: glowTex("255,236,190"), warm: glowTex("255,196,130"), mint: glowTex("130,255,200"),
    sparks: ["#ffd23a", "#9cffcf", "#ffffff"].map((c) => canvasTexture(256, 256, (g) => drawSpark(g, c))),
  }), []);
  const k = sstep(u);
  const settle = 1 - sstep(clamp01(u / 0.12));
  const cam: V3 = lerp3([0, 1.3, 5.5], [0, 1.24, 4.8], k * 0.55 + u * 0.45);
  cam[1] += settle * 0.9;
  // 숫자가 줄어드는 때: 뒷부분("Overnight… one or two years younger")
  const at = (i: number) => 0.52 + [1, 3, 0, 4, 2][i] * 0.05;
  return (
    <>
      <CamSet p={cam} t={[0, 1.02 + settle * 0.5, 0]} fov={35} />
      <color attach="background" args={["#f0b090"]} />
      <fogExp2 attach="fog" args={["#eeb096", 0.035]} />
      <hemisphereLight args={["#ffd0b0", "#6a5080", 0.95]} />
      <directionalLight position={[-3.5, 2.2, -4]} intensity={2.6} color="#ffc890" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0006} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} />
      <directionalLight position={[2, 3, 5]} intensity={0.5} color="#b0b8ff" />
      <Sky tex={tx.sky} z={-16} w={36} h={16} y={5.6} k={1.1} />
      <Glow tex={tx.sun} p={[-1.5, 1.75, -15.5]} w={9} h={9} o={0.95} k={1.5} />
      <Decal tex={tx.far} p={[0, 2.0, -13]} w={24} h={5.5} tint="#f6ccc4" />
      <Decal tex={tx.near} p={[0.8, 1.55, -10.5]} w={17} h={4.2} tint="#f0c8cc" />
      <Floor tex={tx.floor} size={18} rough={0.55} z={-3} />
      {/* 계단 단 */}
      <InkBox p={[0, 0.2, -0.95]} s={[5.2, 0.4, 1.5]} c="#e6d2c4" th={0.012} round={0.02} />
      <InkBox p={[0, 0.133, -0.08]} s={[5.2, 0.266, 0.26]} c="#ead6c8" th={0.01} round={0.02} />
      <InkBox p={[0, 0.066, 0.16]} s={[5.2, 0.132, 0.26]} c="#eedccf" th={0.01} round={0.02} />
      {/* 가로등 · 나무 */}
      {[-1.45, 1.45].map((x) => (
        <group key={x}>
          <InkCyl p={[x, 1.0, -1.3]} r={0.03} h={1.6} c="#3f3a52" th={0.008} seg={10} />
          <InkCyl p={[x, 1.86, -1.3]} r={0.1} r2={0.06} h={0.14} c="#3f3a52" th={0.008} />
          <mesh position={[x, 1.76, -1.3]}>
            <sphereGeometry args={[0.055, 12, 10]} />
            <meshBasicMaterial color={new THREE.Color("#ffe6b0").multiplyScalar(2.2)} toneMapped={false} />
          </mesh>
          <Glow tex={tx.warm} p={[x, 1.76, -1.25]} w={0.9} h={0.9} o={0.6} />
        </group>
      ))}
      {[-2.1, 2.1].map((x) => (
        <group key={x}>
          <InkCyl p={[x, 0.75, -2.2]} r={0.07} h={1.1} c="#6a4a3a" th={0.01} seg={10} />
          <InkBall p={[x, 1.7, -2.2]} r={0.55} c="#e8b84a" />
          <InkBall p={[x + 0.3, 1.4, -2.1]} r={0.35} c="#f0c85a" />
        </group>
      ))}
      {/* 사람들 */}
      {CROWD.map((c, i) => {
        const a = at(i);
        const done = u >= a;
        const jump = pulse(u, a, 0.07);
        const joy = seg(u, a, a + 0.03);
        const pose: Pose = done
          ? { armL: 140 + Math.sin(T * 6 + i) * 10, armR: 140 - Math.sin(T * 6 + i) * 10, mouth: i % 2 ? "grin" : "open", blush: 0.8, brow: 0.6 }
          : { armL: 12, armR: 12, mouth: u > a - 0.08 ? "o" : "smile", look: Math.sin(T * 0.8 + i * 2) * 0.5, blush: 0.3, blink: Math.floor(T * 30 + i * 17) % 80 > 76 };
        const feet: V3 = [c.x, c.y, c.z];
        const bob = jump * 0.09 + (done ? Math.abs(Math.sin(T * 5 + i)) * 0.018 : Math.abs(Math.sin(T * 1.6 + i)) * 0.005);
        return (
          <group key={i}>
            <Guy look={c.look} pose={pose} feet={feet} cam={cam} s={c.s} bob={bob} flipX={c.flip} tint="#ffeede" tag={tagTex(done ? c.to : c.from, done ? "#8ff0c0" : "#ffd23a")} tagS={1 + 0.5 * jump} tagRot={done ? 0 : Math.sin(T * 9 + i) * 0.1 * seg(u, a - 0.1, a)} shadow={0.28} />
            <Glow tex={tx.mint} p={[c.x, c.y + c.s * 0.87 + 0.15, c.z - 0.02]} w={0.8} h={0.8} o={0.75 * pulse(u, a, 0.12)} />
            {joy > 0 && joy < 1 && [0, 1, 2, 3, 4].map((q) => { const ang = (q / 5) * Math.PI * 2 + i; const r = 0.12 + joy * 0.2; return <Glow key={q} tex={tx.sparks[q % 3]} p={[c.x + Math.cos(ang) * r, c.y + c.s * 0.87 + 0.15 + Math.sin(ang) * r, c.z + 0.05]} w={0.1} h={0.1} o={1 - joy} k={2} />; })}
          </group>
        );
      })}
      <Post focus={Math.hypot(cam[1] - 0.8, cam[2])} range={4.2} bloom={0.6} vig={0.5} />
    </>
  );
};

// ================================================================ 4-A. 군부대 정문 (except 앞부분)
const SOLDIER: Look = { skin: "#eac4a2", hair: "short", hairC: "#1e1a1c", top: "#6b8a4c", bottom: "#56703f", shoes: "#2b2b30" };
const Gate: React.FC<{ u: number; w: Words05 }> = ({ u, w }) => {
  const T = u * 2.7;
  const tagTex = useTagTex();
  const tx = useMemo(() => ({
    floor: painted(1024, 1024, "#9a9aa0", (g) => { g.fillStyle = "rgba(255,230,120,0.75)"; g.fillRect(500, 0, 24, 1024); }, 6),
    sky: canvasTexture(1024, 512, drawDaySky),
    sign: canvasTexture(640, 180, (g) => drawSign(g, w.army, "#4d6a3a", F)),
    post: canvasTexture(640, 180, (g) => drawSign(g, "위병소", "#fff6e0", PEN_KO, INK)),
    helmet: canvasTexture(300, 220, drawHelmet),
    bar: canvasTexture(512, 64, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#ffffff" : "#e2343a"; g.fillRect(i * 64, 0, 64, 64); } }),
    brick: painted(512, 512, "#b8b0a0", (g) => { g.strokeStyle = "rgba(60,50,40,0.35)"; g.lineWidth = 4; for (let y = 0; y <= 512; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); for (let x = (y / 64) % 2 ? 0 : 64; x < 512; x += 128) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke(); } } }, 2),
    hills: canvasTexture(1024, 256, (g) => { g.clearRect(0, 0, 1024, 256); g.fillStyle = "#6f9a6a"; g.beginPath(); g.moveTo(0, 256); for (let x = 0; x <= 1024; x += 16) g.lineTo(x, 130 - Math.sin(x / 90) * 50 - Math.sin(x / 37) * 16); g.lineTo(1024, 256); g.closePath(); g.fill(); }),
    red: glowTex("255,70,70"), lock: canvasTexture(120, 140, drawLock),
  }), [w]);
  const k = sstep(u);
  const cam: V3 = lerp3([0, 1.2, 4.3], [0, 1.16, 3.62], k * 0.5 + u * 0.5);
  const deny = seg(u, 0.5, 0.6); // "삑" (buzz)
  const shake = Math.sin(u * 70) * 0.02 * (seg(u, 0.56, 0.62) - seg(u, 0.86, 0.95));
  const walk = 1 - sstep(clamp01(u / 0.3));
  const guard: V3 = [0.36 + shake, 0, -0.1];
  const GS = 1.06;
  const guyPose: Pose = walk > 0.02 ? { walk: u * 60, armL: 20, armR: 20, mouth: "grin", blush: 0.4 } : deny > 0.5 ? { armL: 12, armR: 12, mouth: "sad", brow: -0.4, look: 0.8 } : { armL: 12, armR: 40, mouth: "smile", look: 0.8, blush: 0.3 };
  const guardPose: Pose = deny > 0.3 ? { armL: 95, armR: 14, mouth: "flat", brow: -0.7, look: -0.8 } : { armL: 12, armR: 12, mouth: "flat", look: -0.6 };
  return (
    <>
      <CamSet p={cam} t={[0, 1.06, 0]} fov={35} />
      <color attach="background" args={["#bfe0f6"]} />
      <fogExp2 attach="fog" args={["#cfe6f4", 0.03]} />
      <hemisphereLight args={["#d8ecff", "#7a8a6a", 1.0]} />
      <directionalLight position={[3, 5, 4]} intensity={2.6} color="#fff2d8" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0006} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} />
      <Sky tex={tx.sky} z={-16} w={36} h={16} y={5.2} />
      <Decal tex={tx.hills} p={[0, 1.2, -11]} w={26} h={5} tint="#e8f2e8" />
      <Floor tex={tx.floor} size={18} rough={0.8} z={-3} />
      {/* 담장 */}
      {[-2.3, 2.3].map((x) => <InkBox key={x} p={[x, 0.55, -1.0]} s={[2.6, 1.1, 0.16]} c="#ffffff" map={tx.brick} th={0.012} />)}
      {/* 정문 기둥 + 현판 */}
      {[-0.9, 0.9].map((x) => (
        <group key={x}>
          <InkBox p={[x, 0.95, -1.0]} s={[0.34, 1.9, 0.34]} c="#ffffff" map={tx.brick} th={0.014} />
          <InkBox p={[x, 1.93, -1.0]} s={[0.42, 0.08, 0.42]} c="#56703f" th={0.012} />
        </group>
      ))}
      <InkBox p={[0, 1.72, -1.0]} s={[2.2, 0.36, 0.2]} c="#3f5a34" th={0.014} />
      <Decal tex={tx.sign} p={[0, 1.72, -0.88]} w={1.3} h={0.366} tint="#ffffff" />
      {/* 차단기 */}
      <InkCyl p={[-0.66, 0.3, -0.72]} r={0.05} h={0.6} c="#f2c230" th={0.01} />
      <group position={[0.0, 0.56, -0.72]}>
        <InkBox p={[0, 0, 0]} s={[1.36, 0.07, 0.05]} c="#ffffff" map={tx.bar} th={0.009} round={0.01} />
      </group>
      {/* 초소 */}
      <InkBox p={[1.42, 0.7, -0.45]} s={[0.6, 1.4, 0.6]} c="#7c9a58" th={0.014} />
      <InkBox p={[1.42, 1.44, -0.45]} s={[0.74, 0.08, 0.74]} c="#3f5a34" th={0.012} />
      <Decal tex={tx.post} p={[1.42, 1.16, -0.13]} w={0.46} h={0.13} />
      <InkBox p={[1.42, 0.82, -0.14]} s={[0.36, 0.3, 0.02]} c="#2a3a4a" th={0.008} />
      {/* 안쪽 막사 · 나무 */}
      <InkBox p={[-0.3, 0.6, -5]} s={[2.6, 1.2, 1.2]} c="#c8c2a8" th={0.016} />
      <InkBox p={[-0.3, 1.26, -5]} s={[2.8, 0.14, 1.4]} c="#56703f" th={0.016} />
      {[-2.0, 1.9].map((x) => (
        <group key={x}>
          <InkCyl p={[x, 0.9, -2.4]} r={0.08} h={1.0} c="#6a4a3a" th={0.01} seg={10} />
          <InkBall p={[x, 1.9, -2.4]} r={0.6} c="#5f9a58" />
        </group>
      ))}
      {/* 청년 (숫자표 20) */}
      <Guy look={GUY2} pose={guyPose} feet={[-0.34 - walk * 0.75, 0, 0.3]} cam={cam} s={1.06} bob={walk > 0.02 ? Math.abs(Math.sin(u * 60)) * 0.02 : 0} tag={tagTex(20)} badge={tx.lock} badgeS={pop(u, 0.5, 0.1)} tagS={1 + 0.45 * pulse(u, 0.5, 0.12)} tagRot={Math.sin(u * 90) * 0.12 * (seg(u, 0.32, 0.4) - seg(u, 0.5, 0.52))} />
      <Glow tex={tx.red} p={[-0.34, 1.07, 0.25]} w={0.9} h={0.9} o={0.7 * pulse(u, 0.5, 0.16)} />
      {/* 위병 */}
      <Guy look={SOLDIER} pose={guardPose} feet={guard} cam={cam} s={GS} />
      <Card tex={tx.helmet} at={[guard[0], guard[1] + (1 - 0.2315) * GS, guard[2] + 0.015]} w={0.366 * GS} h={0.268 * GS} cam={cam} />
      <Post focus={Math.hypot(cam[1] - 0.8, cam[2])} range={5} bloom={0.4} vig={0.45} />
    </>
  );
};

// ================================================================ 4-B. 편의점 술 진열대 (except 뒷부분)
const CLERK: Look = { skin: "#efc9a6", hair: "short", hairC: "#3a2a22", top: "#2f9d7a", bottom: "#38363f", shoes: "#2b2b30" };
const Store: React.FC<{ u: number; w: Words05 }> = ({ u, w }) => {
  const T = u * 2.7;
  const tagTex = useTagTex();
  const tx = useMemo(() => ({
    floor: tiles("#e8edf2", "rgba(255,255,255,0.3)", "rgba(120,140,170,0.12)", "rgba(80,90,120,0.22)", 4, 14),
    shelf: canvasTexture(1200, 840, (g) => { g.scale(2, 2); drawShelf(g); }),
    sign: canvasTexture(640, 180, (g) => drawSign(g, w.store, "#1f8f6f", F)),
    cool: glowTex("170,225,255"), red: glowTex("255,70,70"), white: glowTex("255,255,255"), lock: canvasTexture(120, 140, drawLock),
  }), [w]);
  const k = sstep(u);
  const cam: V3 = lerp3([0.05, 1.14, 3.95], [0, 1.1, 3.35], k * 0.5 + u * 0.5);
  const deny = seg(u, 0.3, 0.4);
  const shake = Math.sin(u * 70) * 0.02 * (seg(u, 0.36, 0.42) - seg(u, 0.75, 0.85));
  const reach = seg(u, 0.05, 0.25) * (1 - deny);
  const custPose: Pose = deny > 0.5 ? { armL: 12, armR: 12, mouth: "sad", brow: -0.3, look: 0.7 } : { armL: 12, armR: 20 + reach * 110, mouth: "grin", look: 0.5, blush: 0.4 };
  const clerkPose: Pose = deny > 0.3 ? { armL: 100, armR: 14, mouth: "flat", brow: -0.6, look: -0.8 } : { armL: 12, armR: 12, mouth: "smile", look: -0.6 };
  const boxes = useMemo(() => { const r = rng(31); return Array.from({ length: 24 }, (_, i) => ({ sx: i % 2 ? 1 : -1, row: Math.floor(i / 2) % 4, col: Math.floor(i / 8), c: ["#ff8a5a", "#ffd23a", "#6fb8ff", "#ff7fa8", "#9ad86a", "#c9a0ff"][Math.floor(r() * 6)], h: 0.12 + r() * 0.08 })); }, []);
  return (
    <>
      <CamSet p={cam} t={[0, 1.08, 0]} fov={35} />
      <color attach="background" args={["#c8d6e4"]} />
      <fogExp2 attach="fog" args={["#d4e2f0", 0.03]} />
      <hemisphereLight args={["#eef6ff", "#8a90a0", 1.05]} />
      <directionalLight position={[1.5, 4, 3.5]} intensity={1.7} color="#f4f8ff" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0006} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} />
      <pointLight position={[0, 1.0, -0.2]} intensity={2.2} distance={3} decay={1.5} color="#a8e0ff" />
      <Floor tex={tx.floor} size={12} rough={0.3} />
      <InkBox p={[0, 1.6, -1.1]} s={[7, 3.2, 0.12]} c="#eef2f6" th={0.01} />
      {/* 술 냉장고 */}
      <InkBox p={[0, 0.99, -0.9]} s={[1.66, 1.34, 0.34]} c="#dfe6ee" th={0.016} round={0.03} />
      <Decal tex={tx.shelf} p={[0, 0.99, -0.71]} w={1.5} h={1.05} k={1.12} />
      <Glow tex={tx.cool} p={[0, 0.99, -0.68]} w={2.6} h={2.0} o={0.32} />
      <InkBox p={[0, 0.3, -0.86]} s={[1.66, 0.1, 0.38]} c="#aab4c0" th={0.012} />
      {/* 간판 */}
      <InkBox p={[0, 1.93, -0.95]} s={[1.42, 0.44, 0.1]} c="#14664f" th={0.014} round={0.03} />
      <Decal tex={tx.sign} p={[0, 1.93, -0.88]} w={1.3} h={0.366} k={1.18} />
      <Glow tex={tx.white} p={[0, 1.93, -0.84]} w={2.4} h={1.0} o={0.22} />
      {/* 양옆 과자 선반 */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <InkBox p={[sx * 1.45, 0.8, -0.6]} s={[0.9, 1.6, 0.4]} c="#f4f6f8" th={0.014} />
          {[0.35, 0.7, 1.05, 1.4].map((y) => <InkBox key={y} p={[sx * 1.45, y, -0.38]} s={[0.92, 0.03, 0.12]} c="#c0c8d2" th={0.008} />)}
        </group>
      ))}
      {boxes.map((b, i) => <InkBox key={i} p={[b.sx * (1.12 + b.col * 0.26), 0.365 + b.row * 0.35 + b.h / 2, -0.36]} s={[0.2, b.h, 0.08]} c={b.c} th={0.008} round={0.01} />)}
      {/* 천장등 */}
      {[-0.9, 0.9].map((x) => (
        <group key={x}>
          <mesh position={[x, 2.75, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.9, 0.12]} />
            <meshBasicMaterial color={new THREE.Color("#ffffff").multiplyScalar(2.2)} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* 손님 (숫자표 19) · 점원 */}
      <Guy look={RIVAL} pose={custPose} feet={[-0.36, 0, 0.2]} cam={cam} s={1.06} tag={tagTex(19)} badge={tx.lock} badgeS={pop(u, 0.3, 0.1)} tagS={1 + 0.45 * pulse(u, 0.3, 0.12)} tagRot={Math.sin(u * 90) * 0.12 * (seg(u, 0.16, 0.24) - seg(u, 0.3, 0.32))} bob={Math.abs(Math.sin(T * 2)) * 0.005} />
      <Glow tex={tx.red} p={[-0.36, 1.27, 0.15]} w={0.9} h={0.9} o={0.7 * pulse(u, 0.3, 0.16)} />
      <Guy look={CLERK} pose={clerkPose} feet={[0.38 + shake, 0, 0.1]} cam={cam} s={1.06} flipX />
      <Post focus={Math.hypot(cam[1] - 0.8, cam[2])} range={4.5} bloom={0.5} vig={0.45} />
    </>
  );
};

// ================================================================ 무대
const BG: Record<string, string> = { nursery: "#090c1f", living: "#1c1a2a", desk: "#4a2a18", plaza: "#f0b090", gate: "#bfe0f6", store: "#c8d6e4" };
const GRADE: Record<string, string> = {
  nursery: "linear-gradient(180deg, rgba(40,60,140,0.10) 0%, rgba(0,0,0,0) 45%, rgba(255,150,80,0.07) 100%)",
  living: "linear-gradient(180deg, rgba(255,150,60,0.08) 0%, rgba(0,0,0,0) 50%, rgba(120,40,60,0.08) 100%)",
  desk: "linear-gradient(180deg, rgba(255,190,110,0.08) 0%, rgba(0,0,0,0) 60%)",
  plaza: "linear-gradient(180deg, rgba(90,90,200,0.08) 0%, rgba(0,0,0,0) 45%, rgba(255,150,90,0.08) 100%)",
  gate: "linear-gradient(180deg, rgba(120,180,255,0.05) 0%, rgba(0,0,0,0) 60%)",
  store: "linear-gradient(180deg, rgba(150,210,255,0.06) 0%, rgba(0,0,0,0) 60%)",
};
const LAW_CUT = 0.29, EXC_CUT = 0.5;

const useFontReady = (sample: string) => {
  const [ok, setOk] = useState(false);
  const [handle] = useState(() => delayRender("SceneFable05 글꼴"));
  useEffect(() => {
    let live = true;
    const fin = () => { if (live) setOk(true); };
    Promise.all([document.fonts.load(`bold 80px ${F}`, sample), document.fonts.load(`bold 80px ${PEN_KO}`, "신생아실 12월")]).then(fin, fin);
    const id = setTimeout(fin, 6000);
    return () => { live = false; clearTimeout(id); };
  }, [sample]);
  useEffect(() => { if (ok) continueRender(handle); }, [ok, handle]);
  return ok;
};

export const SceneFable05: React.FC<{ mode: Mode05; t: number; words: Words05 }> = ({ mode, t, words }) => {
  const { width, height } = useVideoConfig();
  const ok = useFontReady(`${words.korean}${words.year}${words.intl}${words.news}${words.army}${words.store} THE DAILY JUNE JUNIO 0123456789,&`);
  const set = mode === "baby" || mode === "dec31" || mode === "jan1" ? "nursery" : mode === "three" || mode === "end" ? "living" : mode === "law" ? (t < LAW_CUT ? "desk" : "plaza") : t < EXC_CUT ? "gate" : "store";
  return (
    <AbsoluteFill style={{ background: BG[set] }}>
      {ok && (
        <ThreeCanvas key={set === "desk" || set === "plaza" ? "law" : set === "gate" || set === "store" ? "exc" : set} width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }} camera={{ fov: 35, near: 0.05, far: 60 }} gl={{ antialias: false, toneMapping: THREE.NoToneMapping }}>
          {set === "nursery" && <Nursery mode={mode} t={t} />}
          {set === "living" && <Living mode={mode} t={t} w={words} />}
          {set === "desk" && <Desk u={t / LAW_CUT} w={words} />}
          {set === "plaza" && <Plaza u={(t - LAW_CUT) / (1 - LAW_CUT)} w={words} />}
          {set === "gate" && <Gate u={t / EXC_CUT} w={words} />}
          {set === "store" && <Store u={(t - EXC_CUT) / (1 - EXC_CUT)} w={words} />}
        </ThreeCanvas>
      )}
      <AbsoluteFill style={{ background: GRADE[set], mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};
