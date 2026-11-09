// EP02 "빨간 이름" 모형 세상 v2: 대본에 맞춘 장소 세 곳 (EP01 아파트 단지는 쓰지 않는다)
//   교실(시험지 이름 칸) → 해 질 녘 한옥 마을(만장 행렬, 사당 위패) → 교실로 돌아와 번짐 → 은행 창구(도장)
// 각 장소는 디오라마 판 위에 올린 모형. 카메라는 한 곡선을 따라 장소 사이를 날아간다.
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useVideoConfig } from "remotion";
import * as THREE from "three";
import { Person } from "../three/World";
import { canvasTex, clamp } from "../three/kit";

export type Mode02 = "pen" | "red" | "curse" | "dark" | "banners" | "tablets" | "bleed" | "light" | "stamp" | "calm" | "end";
export const ORDER02: Mode02[] = ["pen", "red", "curse", "dark", "banners", "tablets", "bleed", "light", "stamp", "calm", "end"];
export type Words02 = { stop: string; bank: string; contract: string; lang: "en" | "es" };

const CJK = '"WenQuanYi Zen Hei", Arial';
const INK = "#d61f1f";

// ---------- 장소 좌표 ----------
const PAPER = new THREE.Vector3(0, 0.578, 1.6); // 교실 맨 앞 가운데 책상 위 시험지
const SHRINE = new THREE.Vector3(-18, 0, -15); // 사당
const ROAD_Z = -9.5; // 만장 행렬이 지나가는 길
const COUNTER_Y = 1.0;
const DOC = new THREE.Vector3(12.6, COUNTER_Y + 0.004, 3.25); // 창구 위 계약서
const SEAL = new THREE.Vector3(12.68, COUNTER_Y + 0.008, 3.3);

// ---------- 카메라 ----------
// 컷마다 자기 경로(2~3점). 같은 장소 안에서는 앞 컷 끝 = 다음 컷 시작이라 이어지고,
// 장소가 바뀌는 컷(banners, bleed)은 Ep02.tsx 에서 겹쳐 흐리게 넘긴다.
type Key = { p: THREE.Vector3; t: THREE.Vector3 };
const K = (px: number, py: number, pz: number, tx: number, ty: number, tz: number): Key => ({ p: new THREE.Vector3(px, py, pz), t: new THREE.Vector3(tx, ty, tz) });
const PT = { x: 0, y: 0.58, z: 1.58 };
const paths = (lang: "en" | "es"): Record<Mode02, Key[]> => {
  const C1 = K(0.6, 1.35, 2.65, 0.45, 0.68, 1.7);
  const C2 = K(1.6, 1.75, 3.95, 0.6, 0.78, 1.4);
  const D2 = K(1.2, 3.6, 6.8, 0, 0.7, 0);
  const B2 = K(-13.6, 2.6, -5.1, -17.6, 1.5, ROAD_Z);
  const S1 = K(12.98, 1.55, 4.15, 12.68, 1.0, 3.3);
  const S2 = K(13.05, 1.6, 4.3, 12.66, 1.0, 3.3);
  const W2 = K(16, 3.2, 9.5, 12.4, 1.1, 3.2);
  return {
    pen: [lang === "es" ? K(-0.3, 1.12, 2.28, PT.x, PT.y, PT.z) : K(0.28, 1.18, 2.3, PT.x, PT.y, PT.z), K(0.12, 1.1, 2.18, PT.x, PT.y, PT.z - 0.03)],
    red: [K(0.12, 1.1, 2.18, PT.x, PT.y, PT.z - 0.03), K(0.08, 1.2, 2.22, PT.x, PT.y, PT.z - 0.02)],
    curse: [K(0.08, 1.2, 2.22, PT.x, PT.y, PT.z - 0.02), C1, C2],
    dark: [C2, D2],
    banners: [K(-12.4, 3.1, -3.6, -17, 1.4, ROAD_Z), B2],
    tablets: [K(-18, 1.65, -11.7, -18, 1.1, -15.3), K(-18, 1.35, -12.5, -18, 1.1, -15.3)],
    bleed: [K(0.32, 1.35, 2.42, PT.x, PT.y, PT.z), K(0.14, 1.08, 2.1, PT.x, PT.y, PT.z)],
    light: [K(0.14, 1.08, 2.1, PT.x, PT.y, PT.z), K(6, 5.5, 9.5, 8, 1.5, 3), K(13.4, 1.95, 5.2, 12.66, 1.0, 3.3)],
    stamp: [K(13.4, 1.95, 5.2, 12.66, 1.0, 3.3), S1, S2],
    calm: [S2, W2],
    end: [W2, K(13.6, 2.0, 6.0, 12.6, 1.12, 3.35), K(12.74, 1.5, 4.5, 12.6, 1.12, 3.4)],
  };
};

const Rig: React.FC<{ mode: Mode02; t: number; lang: "en" | "es" }> = ({ mode, t, lang }) => {
  const { camera } = useThree();
  const curves = useMemo(() => {
    const all = paths(lang);
    const out = {} as Record<Mode02, [THREE.CatmullRomCurve3, THREE.CatmullRomCurve3]>;
    ORDER02.forEach((m) => {
      out[m] = [new THREE.CatmullRomCurve3(all[m].map((x) => x.p), false, "centripetal"), new THREE.CatmullRomCurve3(all[m].map((x) => x.t), false, "centripetal")];
    });
    return out;
  }, [lang]);
  const u = Easing.inOut(Easing.cubic)(Math.min(1, Math.max(0, t)));
  camera.position.copy(curves[mode][0].getPoint(u));
  camera.lookAt(curves[mode][1].getPoint(u));
  return null;
};

// ---------- 무늬 ----------
const vertTex = (chars: string[], o: { w: number; h: number; bg: string; fg: string; size: number; pad?: number }) =>
  canvasTex(o.w, o.h, (g) => {
    g.fillStyle = o.bg;
    g.fillRect(0, 0, o.w, o.h);
    g.fillStyle = o.fg;
    g.font = `bold ${o.size}px ${CJK}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const pad = o.pad ?? 0;
    const step = (o.h - pad * 2) / chars.length;
    chars.forEach((c, k) => g.fillText(c, o.w / 2, pad + step * (k + 0.5)));
  });

const bubbleTex = (text: string) =>
  canvasTex(420, 260, (g) => {
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.roundRect(10, 10, 400, 180, 70);
    g.fill();
    g.beginPath();
    g.moveTo(120, 185);
    g.lineTo(90, 250);
    g.lineTo(180, 188);
    g.fill();
    g.lineWidth = 8;
    g.strokeStyle = "#1b1b1b";
    g.beginPath();
    g.roundRect(10, 10, 400, 180, 70);
    g.stroke();
    g.fillStyle = INK;
    g.font = "900 104px Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 210, 106);
  });

const qTex = () =>
  canvasTex(256, 256, (g) => {
    g.font = "900 220px Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineWidth = 18;
    g.strokeStyle = "#1b1b1b";
    g.strokeText("?", 128, 140);
    g.fillStyle = "#ffd23a";
    g.fillText("?", 128, 140);
  });

const Sprite: React.FC<{ tex: THREE.Texture; s: number; pos: [number, number, number]; size: [number, number]; ry?: number; rz?: number }> = ({ tex, s, pos, size, ry = 0, rz = 0 }) =>
  s < 0.01 ? null : (
    <mesh position={pos} scale={0.7 + 0.3 * s} rotation={[0, ry, rz]}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={tex} transparent opacity={Math.min(1, s)} depthTest={false} toneMapped={false} />
    </mesh>
  );

const Box: React.FC<{ p: [number, number, number]; s: [number, number, number]; c: string; e?: string; ei?: number; shadow?: boolean }> = ({ p, s, c, e, ei = 0.4, shadow = true }) => (
  <mesh position={p} castShadow={shadow} receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial color={c} emissive={e ?? "#000000"} emissiveIntensity={e ? ei : 0} />
  </mesh>
);

// 디오라마 판: 장소마다 하나 (모형 느낌)
const Slab: React.FC<{ c: [number, number]; size: [number, number]; top: string; side?: string }> = ({ c, size, top, side = "#8c7a64" }) => (
  <group position={[c[0], 0, c[1]]}>
    <Box p={[0, -0.15, 0]} s={[size[0] + 0.2, 0.3, size[1] + 0.2]} c={side} />
    <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color={top} />
    </mesh>
  </group>
);

// ---------- 1. 교실 ----------
const NAME = ["김", "민", "지"];
const NAME_TOP = 0.15; // 시험지 중심에서 이름 칸 위쪽 끝까지
const NAME_H = 0.33;

const Desk: React.FC<{ x: number; z: number; paper?: boolean; chair?: boolean }> = ({ x, z, paper = true, chair = true }) => (
  <group position={[x, 0, z]}>
    <Box p={[0, 0.55, 0]} s={[0.78, 0.04, 0.5]} c="#d8b98c" />
    {[-0.34, 0.34].map((dx) => (
      <Box key={dx} p={[dx, 0.27, 0]} s={[0.03, 0.54, 0.42]} c="#7d8288" shadow={false} />
    ))}
    {chair && (
      <>
        <Box p={[0, 0.3, 0.5]} s={[0.4, 0.035, 0.36]} c="#d8b98c" />
        <Box p={[0, 0.52, 0.68]} s={[0.4, 0.4, 0.03]} c="#d8b98c" />
        {[-0.17, 0.17].map((dx) => (
          <Box key={dx} p={[dx, 0.15, 0.5]} s={[0.025, 0.3, 0.3]} c="#7d8288" shadow={false} />
        ))}
      </>
    )}
    {paper && (
      <mesh position={[0.05, 0.574, 0]} rotation={[-Math.PI / 2, 0, 0.1]}>
        <planeGeometry args={[0.28, 0.38]} />
        <meshStandardMaterial color="#fbf8f1" />
      </mesh>
    )}
  </group>
);

const Classroom: React.FC<{ write: number; bleed: number; lights: number; stop: number; stopTex: THREE.Texture }> = ({ write, bleed, lights, stop, stopTex }) => {
  const board = useMemo(
    () =>
      canvasTex(1024, 400, (g) => {
        g.fillStyle = "#2f5a45";
        g.fillRect(0, 0, 1024, 400);
        g.strokeStyle = "#8a6a45";
        g.lineWidth = 24;
        g.strokeRect(0, 0, 1024, 400);
        g.fillStyle = "rgba(255,255,255,0.88)";
        g.font = `bold 120px ${CJK}`;
        g.textAlign = "center";
        g.fillText("시험", 330, 200);
        g.font = "bold 70px Arial";
        g.fillText("TEST", 330, 300);
        g.font = "52px Arial";
        g.textAlign = "left";
        g.fillText("1.  ____", 620, 140);
        g.fillText("2.  ____", 620, 220);
        g.fillText("3.  ____", 620, 300);
      }),
    [],
  );
  const paper = useMemo(
    () =>
      canvasTex(300, 410, (g) => {
        g.fillStyle = "#fbf8f1";
        g.fillRect(0, 0, 300, 410);
        g.fillStyle = "#333";
        g.font = `bold 26px ${CJK}`;
        g.textAlign = "left";
        g.fillText("이름 NAME", 18, 36);
        g.strokeStyle = "#bdb3a4";
        g.lineWidth = 3;
        g.strokeRect(18, 50, 104, 330);
        g.fillStyle = "#c9c0b2";
        for (let k = 0; k < 9; k++) g.fillRect(142, 64 + k * 36, k % 3 === 2 ? 90 : 140, 7);
      }),
    [],
  );
  const name = useMemo(() => vertTex(NAME, { w: 200, h: 600, bg: "rgba(0,0,0,0)", fg: INK, size: 170 }), []);
  const p = Math.max(0.001, write);
  name.repeat.set(1, p);
  name.offset.set(0, 1 - p);
  const blot = useMemo(
    () =>
      canvasTex(256, 256, (g) => {
        const r = g.createRadialGradient(128, 128, 10, 128, 128, 126);
        r.addColorStop(0, "rgba(180,15,20,0.85)");
        r.addColorStop(0.6, "rgba(180,15,20,0.45)");
        r.addColorStop(1, "rgba(180,15,20,0)");
        g.fillStyle = r;
        g.fillRect(0, 0, 256, 256);
      }),
    [],
  );
  // 이름 칸은 시험지 왼쪽 (종이 텍스처 18~122px / 300px 폭)
  const nameX = -0.14 + (70 / 300) * 0.34;
  const STUDENTS: { x: number; z: number; coat: string }[] = [
    { x: -1.2, z: -1.2, coat: "#4a6a8a" },
    { x: 0, z: -1.2, coat: "#c86b5a" },
    { x: 1.2, z: -1.2, coat: "#6f7d5c" },
    { x: -1.2, z: 0.2, coat: "#e0b04a" },
    { x: 0, z: 0.2, coat: "#8c5a8a" },
    { x: 1.2, z: 0.2, coat: "#3d4a63" },
    { x: -1.2, z: 1.6, coat: "#7a8fa8" },
  ];
  return (
    <group>
      <Slab c={[0, 0]} size={[6.6, 6]} top="#c8a77e" />
      {/* 마룻바닥 줄 */}
      {Array.from({ length: 11 }, (_, k) => (
        <mesh key={k} position={[-3 + k * 0.6, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.012, 6]} />
          <meshBasicMaterial color="#a88a64" />
        </mesh>
      ))}
      {/* 뒷벽 + 칠판 + 시계 */}
      <Box p={[0, 1.5, -3]} s={[6.6, 3, 0.15]} c="#efe6d4" />
      <Box p={[0, 0.45, -2.9]} s={[6.6, 0.9, 0.05]} c="#b9a283" />
      <mesh position={[0, 1.75, -2.92]}>
        <planeGeometry args={[3.6, 1.4]} />
        <meshStandardMaterial map={board} />
      </mesh>
      <mesh position={[2.55, 2.55, -2.92]}>
        <circleGeometry args={[0.2, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* 오른쪽 벽: 창문 */}
      <Box p={[3.3, 1.5, 0]} s={[0.15, 3, 6]} c="#efe6d4" />
      {[-1.8, 0, 1.8].map((z) => (
        <mesh key={z} position={[3.22, 1.7, z]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[1.3, 1.2]} />
          <meshStandardMaterial color="#bfe0f2" emissive="#dff2ff" emissiveIntensity={0.5 * lights} />
        </mesh>
      ))}
      {/* 교탁 */}
      <Box p={[0, 0.5, -2.2]} s={[1.2, 1.0, 0.55]} c="#a0764e" />
      {/* 천장 형광등 */}
      {[-1.5, 1.5].map((x) =>
        [-1, 1].map((z) => <Box key={`${x}${z}`} p={[x, 3.0, z]} s={[1.0, 0.05, 0.16]} c="#ffffff" e="#ffffff" ei={0.9 * lights} shadow={false} />),
      )}
      {/* 책상들과 학생들 */}
      {STUDENTS.map((s, k) => (
        <group key={k}>
          <Desk x={s.x} z={s.z} />
          <Person p={[s.x, 0.18, s.z + 0.5]} coat={s.coat} s={0.5} ry={Math.PI} sit />
        </group>
      ))}
      {/* 옆자리 학생: 이쪽을 돌아본다 */}
      <Desk x={1.2} z={1.6} />
      <Person p={[1.2, 0.18, 2.1]} coat="#d08a3a" s={0.5} ry={Math.PI + interpolate(stop, [0, 1], [0, -1.3], clamp)} sit />
      <Sprite tex={stopTex} s={stop} pos={[1.05, 1.15, 2.05]} size={[0.55, 0.34]} ry={0.2} />
      {/* 주인공 책상 + 시험지 + 빨간 이름 */}
      <Desk x={0} z={1.6} paper={false} chair={false} />
      <mesh position={PAPER} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.34, 0.46]} />
        <meshStandardMaterial map={paper} />
      </mesh>
      {bleed > 0 && (
        <mesh position={[PAPER.x + nameX, PAPER.y + 0.001, PAPER.z + 0.02]} rotation={[-Math.PI / 2, 0, 0]} scale={0.2 + 0.9 * bleed}>
          <planeGeometry args={[0.36, 0.5]} />
          <meshBasicMaterial map={blot} transparent opacity={0.9 * bleed} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      {write > 0.001 && (
        <mesh position={[PAPER.x + nameX, PAPER.y + 0.002, PAPER.z - NAME_TOP + (NAME_H * p) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, NAME_H * p]} />
          <meshBasicMaterial map={name} transparent toneMapped={false} />
        </mesh>
      )}
    </group>
  );
};

// 빨간 펜: 원점 = 펜촉, 실제 크기(약 0.3)
const Pen: React.FC<{ pos: THREE.Vector3; rot: [number, number, number]; drop: number }> = ({ pos, rot, drop }) => (
  <group position={pos}>
    <group rotation={rot} scale={0.2}>
      <mesh position={[0, 0.09, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.06, 0.18, 16]} />
        <meshStandardMaterial color="#d9d4cc" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.82, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 1.3, 20]} />
        <meshStandardMaterial color="#d8262b" roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.12, 20]} />
        <meshStandardMaterial color="#2b2b2b" />
      </mesh>
      <mesh position={[0.085, 1.2, 0]}>
        <boxGeometry args={[0.025, 0.35, 0.04]} />
        <meshStandardMaterial color="#c9c3ba" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
    {drop > 0 && (
      <mesh position={[0, -0.008 - 0.012 * drop, 0]} scale={[1, 1.25, 1]}>
        <sphereGeometry args={[0.009 * drop, 14, 10]} />
        <meshStandardMaterial color="#c4161c" roughness={0.15} />
      </mesh>
    )}
  </group>
);

// ---------- 2. 한옥 마을 ----------
const Hanok: React.FC<{ p: [number, number, number]; w: number; d: number; open?: boolean; ry?: number }> = ({ p, w, d, open, ry = 0 }) => {
  const doors = useMemo(
    () =>
      canvasTex(256, 256, (g) => {
        g.fillStyle = "#f3ead6";
        g.fillRect(0, 0, 256, 256);
        g.strokeStyle = "#7a5638";
        g.lineWidth = 6;
        for (let k = 0; k <= 8; k++) {
          g.beginPath();
          g.moveTo(k * 32, 0);
          g.lineTo(k * 32, 256);
          g.moveTo(0, k * 32);
          g.lineTo(256, k * 32);
          g.stroke();
        }
      }),
    [],
  );
  const H = 1.25;
  const a = 0.48;
  const half = d / 2 + 0.55;
  const len = half / Math.cos(a);
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Box p={[0, 0.15, 0]} s={[w + 0.5, 0.3, d + 0.5]} c="#a9a49a" />
      {[-w / 2, 0, w / 2].map((x) =>
        [-d / 2, d / 2].map((z) => open && x === 0 && z > 0 ? null : (
          <mesh key={`${x}${z}`} position={[x, 0.3 + H / 2, z]} castShadow>
            <cylinderGeometry args={[0.07, 0.08, H, 10]} />
            <meshStandardMaterial color="#7a5638" />
          </mesh>
        )),
      )}
      <Box p={[0, 0.3 + H / 2, -d / 2 + 0.03]} s={[w, H, 0.06]} c="#efe8d8" />
      <Box p={[-w / 2 + 0.03, 0.3 + H / 2, 0]} s={[0.06, H, d]} c="#efe8d8" />
      <Box p={[w / 2 - 0.03, 0.3 + H / 2, 0]} s={[0.06, H, d]} c="#efe8d8" />
      {!open && (
        <mesh position={[0, 0.3 + H / 2, d / 2 + 0.01]}>
          <planeGeometry args={[w - 0.1, H - 0.1]} />
          <meshStandardMaterial map={doors} />
        </mesh>
      )}
      <Box p={[0, 0.3 + H + 0.05, 0]} s={[w + 0.2, 0.1, d + 0.2]} c="#7a5638" />
      {/* 기와지붕: 앞뒤로 기운 판 두 장 + 용마루 */}
      {[-1, 1].map((sg) => (
        <mesh key={sg} position={[0, 0.3 + H + 0.1 + Math.sin(a) * len * 0.5, (sg * half) / 2]} rotation={[sg * a, 0, 0]} castShadow>
          <boxGeometry args={[w + 1.1, 0.12, len]} />
          <meshStandardMaterial color="#4b4f56" roughness={0.8} />
        </mesh>
      ))}
      <Box p={[0, 0.3 + H + 0.12 + Math.sin(a) * len, 0]} s={[w + 1.2, 0.16, 0.22]} c="#3b3e44" />
      {[-1, 1].map((sx) => (
        <Box key={sx} p={[(sx * (w + 1.15)) / 2, 0.3 + H + 0.32 + Math.sin(a) * len, 0]} s={[0.12, 0.25, 0.2]} c="#3b3e44" />
      ))}
    </group>
  );
};

const Pine: React.FC<{ p: [number, number]; s?: number }> = ({ p, s = 1 }) => (
  <group position={[p[0], 0, p[1]]} scale={s}>
    <mesh position={[0, 0.6, 0]} castShadow>
      <cylinderGeometry args={[0.07, 0.11, 1.2, 8]} />
      <meshStandardMaterial color="#6b4a32" />
    </mesh>
    {[0, 1, 2].map((k) => (
      <mesh key={k} position={[0, 1.15 + k * 0.42, 0]} castShadow>
        <coneGeometry args={[0.75 - k * 0.2, 0.7, 8]} />
        <meshStandardMaterial color={["#3f6b45", "#4a7a4f", "#55865a"][k]} flatShading />
      </mesh>
    ))}
  </group>
);

const BANNER_TEXT = [["故", "金", "公"], ["故", "李", "氏"], ["故", "朴", "公"], ["故", "崔", "氏"], ["故", "鄭", "公"]];
const CLOTH = ["#f6f1e6", "#f3e7c4", "#eef0f2", "#f6f1e6", "#efe3d2"];

const Procession: React.FC<{ move: number; raise: number }> = ({ move, raise }) => {
  const texs = useMemo(() => BANNER_TEXT.map((c, k) => vertTex(c, { w: 160, h: 560, bg: CLOTH[k], fg: INK, size: 120, pad: 40 })), []);
  const bier = useMemo(
    () =>
      canvasTex(256, 128, (g) => {
        const cs = ["#c62828", "#1f5fa8", "#f2b632", "#2e7d4f"];
        for (let k = 0; k < 8; k++) {
          g.fillStyle = cs[k % 4];
          g.fillRect(k * 32, 0, 32, 128);
        }
        g.fillStyle = "#f6f1e6";
        g.fillRect(0, 50, 256, 28);
      }),
    [],
  );
  const x0 = -21 + 3 * move;
  return (
    <group position={[x0, 0, ROAD_Z]}>
      {/* 만장 든 사람 다섯 */}
      {texs.map((tx, k) => {
        const r = interpolate(raise, [k * 0.1, k * 0.1 + 0.45], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
        const x = 4.5 - k * 0.9;
        const bob = Math.sin((move * 14 + k) * Math.PI) * 0.03;
        return (
          <group key={k} position={[x, bob, 0]}>
            <Person p={[0, 0, 0.18]} coat="#d9cfb8" s={0.62} ry={Math.PI / 2} />
            <group position={[0.12, -1.6 * (1 - r), 0]}>
              <mesh position={[0, 1.6, 0]} castShadow>
                <cylinderGeometry args={[0.03, 0.035, 3.2, 8]} />
                <meshStandardMaterial color="#b89a62" />
              </mesh>
              <mesh position={[0, 3.05, 0.02]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.018, 0.018, 0.75, 6]} />
                <meshStandardMaterial color="#b89a62" />
              </mesh>
              <mesh position={[0, 2.15, 0.04]} rotation={[0, 0.15, 0]} castShadow>
                <planeGeometry args={[0.66, 1.8]} />
                <meshStandardMaterial map={tx} side={THREE.DoubleSide} />
              </mesh>
            </group>
          </group>
        );
      })}
      {/* 상여와 메는 사람 넷 */}
      <group position={[-1.1, 0, 0]}>
        <Box p={[0, 0.95, 0]} s={[1.5, 0.45, 0.55]} c="#c62828" />
        <mesh position={[0, 0.95, 0.28]}>
          <planeGeometry args={[1.5, 0.45]} />
          <meshStandardMaterial map={bier} />
        </mesh>
        <Box p={[0, 1.25, 0]} s={[1.6, 0.1, 0.7]} c="#1f5fa8" />
        <Box p={[0, 1.38, 0]} s={[0.9, 0.18, 0.4]} c="#f2b632" />
        <Box p={[0, 0.7, 0]} s={[2.4, 0.06, 0.06]} c="#7a5638" />
        {[-0.95, 0.95].map((x) =>
          [-0.38, 0.38].map((z) => <Person key={`${x}${z}`} p={[x, 0, z]} coat="#d9cfb8" s={0.6} ry={Math.PI / 2} />),
        )}
      </group>
    </group>
  );
};

const TABLET_TEXT = [["故", "金", "公"], ["故", "李", "氏"], ["故", "朴", "公"]];
const Shrine: React.FC<{ candle: number }> = ({ candle }) => {
  const texs = useMemo(() => TABLET_TEXT.map((c) => vertTex(c, { w: 120, h: 380, bg: "#efe6d2", fg: INK, size: 90, pad: 30 })), []);
  return (
    <group position={SHRINE}>
      <Hanok p={[0, 0, 0]} w={3} d={2} open />
      {/* 제사상 */}
      <group position={[0, 0.3, -0.25]}>
        <Box p={[0, 0.42, 0]} s={[1.6, 0.06, 0.6]} c="#5a3a26" />
        {[-0.72, 0.72].map((x) => (
          <Box key={x} p={[x, 0.2, 0]} s={[0.07, 0.4, 0.5]} c="#4a2e1e" />
        ))}
        {texs.map((tx, k) => (
          <group key={k} position={[(k - 1) * 0.42, 0.45, -0.08]}>
            <Box p={[0, 0.04, 0]} s={[0.28, 0.08, 0.16]} c="#3b2416" />
            <Box p={[0, 0.38, 0]} s={[0.22, 0.62, 0.05]} c="#4a2c1a" />
            <mesh position={[0, 0.38, 0.026]}>
              <planeGeometry args={[0.16, 0.52]} />
              <meshStandardMaterial map={tx} />
            </mesh>
          </group>
        ))}
        {[-0.68, 0.68].map((x) => (
          <group key={x} position={[x, 0.45, 0.15]}>
            <mesh position={[0, 0.11, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.22, 12]} />
              <meshStandardMaterial color="#f4efe4" />
            </mesh>
            {candle > 0 && (
              <>
                <mesh position={[0, 0.25, 0]} scale={[1, 1.6, 1]}>
                  <sphereGeometry args={[0.024, 10, 8]} />
                  <meshBasicMaterial color="#ffb347" toneMapped={false} />
                </mesh>
                <pointLight position={[0, 0.32, 0.1]} color="#ff9a40" intensity={1.4 * candle} distance={2} />
              </>
            )}
          </group>
        ))}
      </group>
    </group>
  );
};

const Village: React.FC<{ move: number; raise: number; candle: number }> = ({ move, raise, candle }) => (
  <group>
    <Slab c={[-17, -11]} size={[16, 10]} top="#b8c28f" side="#7d6a52" />
    <mesh position={[-17, 0.006, ROAD_Z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[16, 1.4]} />
      <meshStandardMaterial color="#cdb68e" />
    </mesh>
    <Shrine candle={candle} />
    <Hanok p={[-12.5, 0, -14.2]} w={3.2} d={2} />
    <Hanok p={[-22.5, 0, -13.5]} w={2.6} d={1.8} ry={0.15} />
    {/* 돌담 */}
    {[-23, -20.6, -15.4, -13].map((x) => (
      <group key={x}>
        <Box p={[x, 0.35, -11.4]} s={[2.2, 0.7, 0.3]} c="#b0a796" />
        <Box p={[x, 0.75, -11.4]} s={[2.4, 0.1, 0.45]} c="#4b4f56" />
      </group>
    ))}
    {[[-24, -8], [-10.5, -7.8], [-20, -16.5], [-14.5, -16.8], [-9.8, -12.5], [-24.2, -15]].map(([x, z], k) => (
      <Pine key={k} p={[x, z]} s={0.9 + (k % 3) * 0.15} />
    ))}
    <Procession move={move} raise={raise} />
  </group>
);

// ---------- 3. 은행 창구 ----------
const Bank: React.FC<{ w: Words02; imprint: number }> = ({ w, imprint }) => {
  const sign = useMemo(
    () =>
      canvasTex(512, 140, (g) => {
        g.fillStyle = "#2f5d8a";
        g.fillRect(0, 0, 512, 140);
        g.fillStyle = "#fff";
        g.font = "900 88px Arial";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(w.bank, 256, 76);
      }),
    [w.bank],
  );
  const ticket = useMemo(
    () =>
      canvasTex(256, 110, (g) => {
        g.fillStyle = "#151515";
        g.fillRect(0, 0, 256, 110);
        g.fillStyle = "#ff3b2f";
        g.font = "bold 80px monospace";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText("0023", 128, 58);
      }),
    [],
  );
  const doc = useMemo(
    () =>
      canvasTex(300, 400, (g) => {
        g.fillStyle = "#fdfbf6";
        g.fillRect(0, 0, 300, 400);
        g.fillStyle = "#222";
        g.font = "900 38px Arial";
        g.textAlign = "center";
        g.fillText(w.contract, 150, 56);
        g.fillStyle = "#b9b2a6";
        for (let k = 0; k < 7; k++) g.fillRect(30, 92 + k * 30, k % 3 === 2 ? 150 : 240, 8);
        g.fillStyle = "#555";
        g.fillRect(130, 330, 140, 3);
      }),
    [w.contract],
  );
  const seal = useMemo(
    () =>
      canvasTex(256, 256, (g) => {
        g.strokeStyle = INK;
        g.lineWidth = 16;
        g.beginPath();
        g.arc(128, 128, 112, 0, Math.PI * 2);
        g.stroke();
        g.fillStyle = INK;
        g.font = `bold 62px ${CJK}`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        NAME.forEach((c, k) => g.fillText(c, 128, 62 + k * 66));
      }),
    [],
  );
  return (
    <group>
      <Slab c={[12.5, 4]} size={[8, 6.5]} top="#e4e1da" />
      {/* 바닥 타일 줄 */}
      {Array.from({ length: 9 }, (_, k) => (
        <mesh key={k} position={[8.5 + k * 1, 0.005, 4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.01, 6.5]} />
          <meshBasicMaterial color="#c9c5bd" />
        </mesh>
      ))}
      <Box p={[12.5, 1.5, 0.85]} s={[8, 3, 0.15]} c="#f2efe8" />
      <mesh position={[11, 2.5, 0.94]}>
        <planeGeometry args={[2.2, 0.6]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
      <mesh position={[14.6, 2.45, 0.94]}>
        <planeGeometry args={[1.0, 0.43]} />
        <meshBasicMaterial map={ticket} toneMapped={false} />
      </mesh>
      {/* 창구 */}
      <Box p={[12.5, COUNTER_Y / 2, 3.2]} s={[6, COUNTER_Y, 0.7]} c="#cfd8df" />
      <Box p={[12.5, COUNTER_Y - 0.02, 3.2]} s={[6.1, 0.04, 0.8]} c="#9aa7b2" />
      {[10.5, 12.5, 14.5].map((x) => (
        <mesh key={x} position={[x - 1, COUNTER_Y + 0.35, 2.95]}>
          <boxGeometry args={[0.02, 0.7, 0.4]} />
          <meshStandardMaterial color="#cfe6f2" transparent opacity={0.5} />
        </mesh>
      ))}
      {/* 직원과 손님 */}
      {[10.6, 12.6, 14.4].map((x, k) => (
        <Person key={x} p={[x, 0, 2.45]} coat={["#2f4a6a", "#2f4a6a", "#2f4a6a"][k]} s={0.75} ry={0} />
      ))}
      <Person p={[11.75, 0, 3.95]} coat="#c86b5a" s={0.75} ry={Math.PI} />
      <Person p={[10.6, 0, 3.95]} coat="#6f7d5c" s={0.75} ry={Math.PI} />
      {/* 기다리는 의자 */}
      {[10.2, 11.2, 12.2, 13.2, 14.2].map((x) => (
        <group key={x}>
          <Box p={[x, 0.32, 5.9]} s={[0.8, 0.06, 0.45]} c="#6c8fb0" />
          <Box p={[x, 0.55, 6.12]} s={[0.8, 0.45, 0.05]} c="#6c8fb0" />
        </group>
      ))}
      <Person p={[11.2, 0.05, 5.85]} coat="#8c5a8a" s={0.6} ry={Math.PI} sit />
      <Person p={[13.2, 0.05, 5.85]} coat="#e0b04a" s={0.6} ry={Math.PI} sit />
      {/* 계약서와 도장 자국 */}
      <mesh position={DOC} rotation={[-Math.PI / 2, 0, 0.08]} receiveShadow>
        <planeGeometry args={[0.3, 0.4]} />
        <meshStandardMaterial map={doc} />
      </mesh>
      {imprint > 0 && (
        <mesh position={SEAL} rotation={[-Math.PI / 2, 0, 0.08]}>
          <planeGeometry args={[0.1, 0.1]} />
          <meshBasicMaterial map={seal} transparent opacity={imprint} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
};

// 도장: 원점 = 바닥 가운데, 실제 크기
const Stamp: React.FC<{ pos: THREE.Vector3 }> = ({ pos }) => (
  <group position={pos} scale={0.26}>
    <mesh position={[0, 0.06, 0]} castShadow>
      <cylinderGeometry args={[0.19, 0.19, 0.12, 28]} />
      <meshStandardMaterial color="#e9dfcf" />
    </mesh>
    <mesh position={[0, 0.005, 0]}>
      <cylinderGeometry args={[0.18, 0.18, 0.01, 28]} />
      <meshStandardMaterial color="#c4161c" />
    </mesh>
    <mesh position={[0, 0.45, 0]} castShadow>
      <cylinderGeometry args={[0.14, 0.17, 0.66, 24]} />
      <meshStandardMaterial color="#8a5a34" roughness={0.5} />
    </mesh>
    <mesh position={[0, 0.86, 0]} castShadow>
      <sphereGeometry args={[0.16, 20, 14]} />
      <meshStandardMaterial color="#8a5a34" roughness={0.5} />
    </mesh>
  </group>
);

// ---------- 상태 ----------
export const state02 = (mode: Mode02, t: number) => {
  const i = (m: Mode02) => mode === m;
  const after = (m: Mode02) => ORDER02.indexOf(mode) > ORDER02.indexOf(m);
  const ease = Easing.inOut(Easing.cubic);
  const write = i("pen") ? 0 : i("red") ? interpolate(t, [0.05, 1], [0, 0.55], clamp) : i("curse") ? interpolate(t, [0, 0.45], [0.55, 1], { ...clamp, easing: Easing.out(Easing.quad) }) : 1;
  const dark = i("dark") ? interpolate(t, [0.1, 0.7], [0, 1], clamp) : i("banners") || i("tablets") || i("bleed") ? 1 : i("light") ? interpolate(t, [0, 0.5], [1, 0], clamp) : 0;
  const bleed = i("bleed") ? interpolate(t, [0.05, 0.95], [0, 1], clamp) : after("bleed") ? 1 : 0;
  const raise = i("banners") ? interpolate(t, [0, 0.8], [0, 1], clamp) : after("banners") ? 1 : 0;
  const move = i("dark") ? 0.4 * t : i("banners") ? 0.4 + 0.4 * t : i("tablets") ? 0.8 + 0.2 * t : after("tablets") ? 1 : 0;
  const stop = i("curse") ? interpolate(t, [0.45, 0.7], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) }) : i("dark") ? interpolate(t, [0, 0.3], [1, 0], clamp) : 0;
  const SLAM = 0.2;
  const top = COUNTER_Y + 0.55;
  const stampY = i("stamp")
    ? t < SLAM
      ? interpolate(t, [0, SLAM], [top, COUNTER_Y + 0.008], { ...clamp, easing: Easing.in(Easing.cubic) })
      : interpolate(t, [0.5, 0.8], [COUNTER_Y + 0.008, COUNTER_Y + 0.12], { ...clamp, easing: ease })
    : after("stamp")
      ? COUNTER_Y + 0.12
      : top;
  const imprint = i("stamp") ? (t >= SLAM ? 1 : 0) : after("stamp") ? 1 : 0;
  const fly = i("end") ? interpolate(t, [0, 0.45], [0, 1], { ...clamp, easing: ease }) : 0;
  const q = i("end") ? interpolate(t, [0.45, 0.65], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) }) : 0;
  return { write, dark, bleed, raise, move, stop, stampY, imprint, fly, q, slamAt: SLAM };
};

const Scene: React.FC<{ mode: Mode02; t: number; words: Words02 }> = ({ mode, t, words }) => {
  const s = state02(mode, t);
  const stopT = useMemo(() => bubbleTex(words.stop), [words.stop]);
  const q = useMemo(() => qTex(), []);
  // 펜: 교실 장면에서는 시험지 위, 마지막에는 은행 창구 위 도장 옆
  const nameX = PAPER.x - 0.14 + (70 / 300) * 0.34;
  const bob = Math.sin(t * Math.PI * 2) * 0.006;
  const writing = mode === "red" || (mode === "curse" && t < 0.45);
  const penHover = new THREE.Vector3(nameX, PAPER.y + 0.03 + bob, PAPER.z - NAME_TOP + 0.03);
  const penWrite = new THREE.Vector3(nameX + Math.sin(t * 40) * 0.025, PAPER.y + 0.004, PAPER.z - NAME_TOP + 0.03 + (NAME_H - 0.06) * s.write);
  const penRest = new THREE.Vector3(nameX + 0.16, PAPER.y + 0.006, PAPER.z + 0.08);
  let pen = mode === "pen" ? penHover : writing ? penWrite : penRest;
  let rot: [number, number, number] = [0.45, 0, -0.35];
  if (mode === "curse" && t >= 0.45) pen = penWrite.clone().lerp(penRest, interpolate(t, [0.45, 0.7], [0, 1], clamp));
  const resting = ["dark", "banners", "tablets", "bleed"].includes(mode) || (mode === "curse" && t >= 0.7);
  if (resting) rot = [Math.PI / 2, 0.4, 0];
  const inBank = ["light", "stamp", "calm", "end"].includes(mode);
  const penBankStart = new THREE.Vector3(12.35, COUNTER_Y + 0.35, 3.45);
  const penBankEnd = new THREE.Vector3(12.42, COUNTER_Y + 0.05, 3.42);
  if (inBank) {
    pen = mode === "end" ? penBankStart.clone().lerp(penBankEnd, s.fly) : new THREE.Vector3(0, -5, 0);
    rot = [0, 0, -0.15];
  }
  const drop = mode === "pen" ? interpolate(t, [0.25, 0.9], [0, 1], clamp) : 0;
  const stampHome = new THREE.Vector3(SEAL.x, s.stampY, SEAL.z);
  const stamp = mode === "end" ? stampHome.clone().lerp(new THREE.Vector3(12.78, COUNTER_Y + 0.005, 3.42), s.fly) : stampHome;
  const lights = 1 - s.dark;
  const sun = 2.3 * (1 - 0.7 * s.dark);
  return (
    <>
      <Rig mode={mode} t={t} lang={words.lang} />
      <hemisphereLight args={[new THREE.Color("#f4f7ff").lerp(new THREE.Color("#5a4a72"), s.dark), "#d9c6ab", 1.15 * (1 - 0.5 * s.dark)]} />
      <directionalLight position={[10, 18, 12]} intensity={sun} color={new THREE.Color("#fff4e2").lerp(new THREE.Color("#ff9a6a"), s.dark)} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={90} />
      <directionalLight position={[3, 5, 14]} intensity={1.2 * (1 - 0.5 * s.dark)} color="#ffeedd" />
      <ambientLight intensity={0.25} />
      {s.dark > 0 && <pointLight position={[PAPER.x, PAPER.y + 0.5, PAPER.z]} color="#ff2a1f" intensity={2.2 * s.dark * (0.5 + 0.5 * s.bleed)} distance={2.5} />}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]} receiveShadow>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#c9d6a8" />
      </mesh>
      <Classroom write={s.write} bleed={s.bleed} lights={lights} stop={s.stop} stopTex={stopT} />
      <Village move={s.move} raise={s.raise} candle={s.dark} />
      <Bank w={words} imprint={s.imprint} />
      <Pen pos={pen} rot={rot} drop={drop} />
      <Stamp pos={stamp} />
      <Sprite tex={q} s={s.q} pos={[12.6, COUNTER_Y + 0.33, 3.42]} size={[0.16, 0.16]} rz={-0.1} />
    </>
  );
};

// 하늘: 낮(교실·은행)은 맑은 파랑, 어두운 부분은 해 질 녘 보라
const SKY_DAY = "linear-gradient(#8fc3ec 0%, #c4e2f6 45%, #eef6fb 80%)";
const SKY_DUSK = "linear-gradient(#2b1d3a 0%, #5a3150 45%, #c46a4e 85%)";

export const Scene02: React.FC<{ mode: Mode02; t: number; words: Words02 }> = ({ mode, t, words }) => {
  const { width, height } = useVideoConfig();
  const { dark } = state02(mode, t);
  return (
    <AbsoluteFill style={{ background: SKY_DAY }}>
      <AbsoluteFill style={{ background: SKY_DUSK, opacity: dark }} />
      <ThreeCanvas width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }} camera={{ fov: 34, near: 0.05, far: 200 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}>
        <Scene mode={mode} t={t} words={words} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
