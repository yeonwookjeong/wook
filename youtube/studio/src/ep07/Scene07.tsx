// EP07 "고개를 돌리고 마시는 나라" 모형 세상: 밤 포장마차 한 곳, 카메라와 사람만 바뀐다
import { useMemo } from "react";
import { Easing, interpolate } from "remotion";
import * as THREE from "three";
import { Person } from "../three/World";
import { canvasTex, clamp } from "../three/kit";
import { Box, CJK, K, Key, MiniFrame, MiniLights, qTex, Rig, SKY, Slab, Sprite } from "../three/mini";

export type Mode07 = "glass" | "turn" | "receive" | "pour" | "self" | "friends" | "end";
export const ORDER07: Mode07[] = ["glass", "turn", "receive", "pour", "self", "friends", "end"];
export type Words07 = { lang: "en" | "es"; turn: string; hands: string; self: string };

const pop = Easing.out(Easing.back(1.6));
const ease = Easing.inOut(Easing.cubic);
const r01 = (t: number, a: number, b: number, e = ease) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: e });

const TOP = 0.5; // 테이블 높이
const SKIN = "#f0c9a6";

const paths = (lang: "en" | "es"): Record<Mode07, Key[]> => ({
  glass: [lang === "es" ? K(-0.9, 1.2, 2.4, 0, 0.75, 0) : K(0.9, 1.2, 2.4, 0, 0.75, 0), K(0.5, 1.05, 1.8, 0, 0.78, 0)],
  turn: [K(0.5, 1.05, 1.8, 0, 0.78, 0), K(1.6, 1.4, 2.8, 0.1, 0.8, 0)],
  receive: [K(1.0, 1.0, 1.4, 0.15, 0.62, 0), K(0.7, 0.95, 1.2, 0.15, 0.62, 0)],
  pour: [K(-1.0, 1.0, 1.4, -0.15, 0.62, 0), K(-0.7, 0.95, 1.2, -0.15, 0.62, 0)],
  self: [K(0.3, 1.5, 2.6, 0, 0.7, 0), K(-0.3, 1.4, 2.4, 0, 0.7, 0)],
  friends: [K(-2.2, 1.9, 4.0, -1.8, 0.8, 0), K(-1.6, 1.7, 3.4, -1.4, 0.8, 0)],
  end: [K(-1.6, 1.7, 3.4, -1.4, 0.8, 0), K(0.2, 1.7, 3.6, 0, 1.0, 0)],
});

const Glass: React.FC<{ p: [number, number, number]; tilt?: number; full?: number }> = ({ p, tilt = 0, full = 1 }) => (
  <group position={p} rotation={[0, 0, tilt]}>
    <mesh position={[0, 0.035, 0]}>
      <cylinderGeometry args={[0.028, 0.022, 0.07, 14, 1, true]} />
      <meshStandardMaterial color="#e9f4f8" transparent opacity={0.45} side={THREE.DoubleSide} />
    </mesh>
    {full > 0.02 && (
      <mesh position={[0, 0.03 * full, 0]}>
        <cylinderGeometry args={[0.025, 0.021, 0.06 * full, 14]} />
        <meshStandardMaterial color="#eef6f2" transparent opacity={0.7} />
      </mesh>
    )}
  </group>
);

/** 초록 병: 원점 = 병 바닥 */
const Bottle: React.FC<{ p: [number, number, number]; tilt?: number; ry?: number }> = ({ p, tilt = 0, ry = 0 }) => (
  <group position={p} rotation={[0, ry, tilt]}>
    <mesh position={[0, 0.09, 0]} castShadow>
      <cylinderGeometry args={[0.04, 0.042, 0.18, 16]} />
      <meshStandardMaterial color="#2f9b5a" transparent opacity={0.85} roughness={0.2} />
    </mesh>
    <mesh position={[0, 0.21, 0]}>
      <cylinderGeometry args={[0.015, 0.04, 0.07, 12]} />
      <meshStandardMaterial color="#2f9b5a" transparent opacity={0.85} roughness={0.2} />
    </mesh>
    <mesh position={[0, 0.09, 0.041]}>
      <planeGeometry args={[0.05, 0.06]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  </group>
);

const Hand: React.FC<{ p: [number, number, number] }> = ({ p }) => (
  <mesh position={p}>
    <sphereGeometry args={[0.028, 12, 10]} />
    <meshStandardMaterial color={SKIN} />
  </mesh>
);

const Stream: React.FC<{ from: [number, number, number]; to: [number, number, number]; on: number }> = ({ from, to, on }) => {
  if (on <= 0.01) return null;
  const mid: [number, number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
  const len = Math.hypot(from[0] - to[0], from[1] - to[1], from[2] - to[2]);
  return (
    <mesh position={mid}>
      <cylinderGeometry args={[0.004, 0.004, len, 6]} />
      <meshStandardMaterial color="#eaf6f0" transparent opacity={0.8 * on} />
    </mesh>
  );
};

const Tent: React.FC = () => {
  const sign = useMemo(
    () =>
      canvasTex(512, 128, (g) => {
        g.fillStyle = "#e8743b";
        g.fillRect(0, 0, 512, 128);
        g.fillStyle = "#ffffff";
        g.font = `bold 80px ${CJK}`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText("포장마차", 256, 70);
      }),
    [],
  );
  return (
    <group>
      <Slab c={[0, 0]} size={[7, 5]} top="#6f6a63" />
      {/* 주황 천막 */}
      <Box p={[-0.8, 1.6, -1.6]} s={[5.5, 3.2, 0.06]} c="#e8743b" opacity={0.92} />
      <Box p={[-0.8, 3.2, 0]} s={[5.6, 0.06, 3.4]} c="#e8743b" opacity={0.9} />
      <mesh position={[-0.8, 2.7, -1.56]}>
        <planeGeometry args={[2.4, 0.6]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
      {/* 백열등 */}
      {[-2, 0.2].map((x) => (
        <group key={x} position={[x, 2.6, 0]}>
          <mesh><sphereGeometry args={[0.06, 12, 10]} /><meshBasicMaterial color="#ffd58a" toneMapped={false} /></mesh>
          <pointLight color="#ffb35a" intensity={3} distance={4} />
        </group>
      ))}
      {/* 테이블 두 개 */}
      {[0, -1.8].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Box p={[0, TOP, 0]} s={[0.9, 0.04, 0.6]} c="#c9cdd2" />
          {[[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]].map(([a, b], k) => <Box key={k} p={[a, TOP / 2, b]} s={[0.04, TOP, 0.04]} c="#8a8f96" />)}
          <mesh position={[0, TOP + 0.03, 0]}><cylinderGeometry args={[0.1, 0.1, 0.03, 20]} /><meshStandardMaterial color="#c86b3a" /></mesh>
        </group>
      ))}
    </group>
  );
};

export const Scene07: React.FC<{ mode: Mode07; t: number; words: Words07 }> = ({ mode, t, words }) => {
  const P = useMemo(() => paths(words.lang), [words.lang]);
  const i = (m: Mode07) => mode === m;
  const q = useMemo(() => qTex(), []);
  const icons = useMemo(
    () =>
      [words.turn, words.hands, words.self].map((x) =>
        canvasTex(512, 140, (g) => {
          g.fillStyle = "#ffffff";
          g.beginPath();
          g.roundRect(6, 6, 500, 128, 30);
          g.fill();
          g.fillStyle = "#c8231f";
          g.font = `900 ${x.length > 14 ? 44 : 56}px Arial Black, Arial`;
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText(x, 256, 74);
        }),
      ),
    [words.turn, words.hands, words.self],
  );
  // 고개 돌리기: 오른쪽 사람(젊은이)이 왼쪽 윗사람을 등지듯 옆으로
  const turn = i("glass") ? r01(t, 0.6, 0.85) : i("turn") ? 1 - r01(t, 0.8, 1) * 0 : 0;
  const drink = i("turn") ? r01(t, 0.2, 0.5) - r01(t, 0.7, 0.9) : 0;
  const pourIn = i("receive") ? r01(t, 0.2, 0.4) - r01(t, 0.75, 0.9) : 0;
  const pourOut = i("pour") ? r01(t, 0.2, 0.4) - r01(t, 0.75, 0.9) : 0;
  const reach = i("self") ? r01(t, 0.1, 0.35) : 0;
  const grab = i("self") ? r01(t, 0.4, 0.6) : 0;
  const cheers = i("friends") ? r01(t, 0.05, 0.25, pop) - r01(t, 0.3, 0.4) : 0;
  const arrive = i("friends") ? r01(t, 0.45, 0.6) : 0;
  const allTurn = i("friends") ? r01(t, 0.65, 0.8) : 0;
  const tableA = !i("friends");
  const yRy = -Math.PI / 2 + (i("glass") || i("turn") ? turn * 1.2 : 0);
  return (
    <MiniFrame sky={SKY.night}>
      <Rig paths={P} mode={mode} t={t} />
      <MiniLights dim={0.6} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color="#4a4a52" />
      </mesh>
      <Tent />
      {/* 테이블 A: 윗사람(왼쪽, 정장)과 젊은이(오른쪽) */}
      <Person p={[-0.6, 0.08, 0]} coat="#3b3e44" s={0.6} ry={Math.PI / 2} sit />
      <Person p={[0.6, 0.08, 0]} coat="#4a6a8a" s={0.6} ry={yRy} sit />
      <Bottle p={[-0.1, TOP + 0.02, -0.15]} tilt={pourIn > 0 ? -1.6 * pourIn : 0} />
      <Glass p={[0.32, TOP + 0.02 + (drink > 0 ? 0.25 * drink : 0), 0.05]} tilt={drink * 1.2} full={1 - drink * 0.8} />
      <Glass p={[-0.32, TOP + 0.02, 0.05]} />
      {(i("receive") || i("pour")) && (
        <>
          {/* 두 손: 받는 잔 / 따르는 병 */}
          <Hand p={[0.36, TOP + 0.06, 0.08]} />
          <Hand p={[0.28, TOP + 0.04, 0.02]} />
          {i("receive") && <Bottle p={[0.12, TOP + 0.12, 0.05]} tilt={1.4 * pourIn} ry={0} />}
          {i("receive") && <Stream from={[0.3, TOP + 0.2, 0.05]} to={[0.32, TOP + 0.08, 0.05]} on={pourIn} />}
          {i("pour") && <Bottle p={[-0.12, TOP + 0.12, 0.05]} tilt={-1.4 * pourOut} />}
          {i("pour") && <Stream from={[-0.3, TOP + 0.2, 0.05]} to={[-0.32, TOP + 0.08, 0.05]} on={pourOut} />}
          {i("pour") && (
            <>
              <Hand p={[-0.08, TOP + 0.16, 0.08]} />
              <Hand p={[-0.14, TOP + 0.1, 0.12]} />
            </>
          )}
        </>
      )}
      {i("self") && (
        <>
          <Bottle p={[0.32 - 0.5 * reach * (1 - grab), TOP + 0.02 + 0.15 * reach, 0.0]} tilt={reach * (1 - grab) * 0.6} />
          {grab > 0.3 && <Bottle p={[-0.1 + 0.25 * grab, TOP + 0.15, -0.05]} tilt={-1.3 * grab} />}
          <Sprite tex={icons[2]} s={r01(t, 0.6, 0.75, pop)} pos={[0, 1.25, 0]} size={[1.0, 0.27]} />
        </>
      )}
      {tableA && i("turn") && <Sprite tex={icons[0]} s={r01(t, 0.55, 0.7, pop)} pos={[0.2, 1.3, 0]} size={[1.0, 0.27]} />}
      {(i("receive") || i("pour")) && <Sprite tex={icons[1]} s={r01(t, 0.05, 0.2, pop)} pos={[0, 0.95, 0]} size={[0.6, 0.16]} />}
      {/* 테이블 B: 친구들 → 새 사람이 오면 모두 고개 돌림 */}
      {[[-2.3, 0], [-1.3, 0], [-1.8, -0.45]].map(([x, z], k) => (
        <Person key={k} p={[x, 0.08, z]} coat={["#c86b5a", "#e0b04a", "#6f7d5c"][k]} s={0.58} ry={(k === 0 ? Math.PI / 2 : k === 1 ? -Math.PI / 2 : 0) + allTurn * 1.2 * (k === 2 ? -1 : 1)} sit />
      ))}
      {i("friends") && (
        <>
          {[[-1.95, -0.05], [-1.65, -0.05], [-1.8, -0.2]].map(([x, z], k) => <Glass key={k} p={[x + (cheers > 0 ? (k === 0 ? 0.08 : k === 1 ? -0.08 : 0) * cheers : 0), TOP + 0.02 + 0.12 * Math.max(0, cheers), z + (k === 2 ? 0.08 * Math.max(0, cheers) : 0)]} />)}
          <Person p={[-1.8, 0, 1.6 - 1.1 * arrive]} coat="#8c5a8a" s={0.62} ry={Math.PI} />
        </>
      )}
      {i("end") &&
        icons.map((tex, k) => <Sprite key={k} tex={tex} s={r01(t, 0.1 + k * 0.15, 0.25 + k * 0.15, pop)} pos={[-0.9 + k * 0.9, 1.6 - (k % 2) * 0.25, 0.4]} size={[0.85, 0.23]} />)}
      {i("end") && <Sprite tex={q} s={r01(t, 0.6, 0.75, pop)} pos={[0, 1.1, 0.5]} size={[0.3, 0.3]} />}
    </MiniFrame>
  );
};
