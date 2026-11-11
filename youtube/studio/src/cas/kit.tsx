// 새 화풍 공용 부품: 잉크 외곽선 3D 상자·원기둥, 칠한 질감, 카메라를 향한 2D 카드, 사람 카드
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { canvasTexture, drawChar, handUV, INK, Look, Pose } from "./toonkr";

export type V3 = [number, number, number];
export const sstep = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * t * (t * (t * 6 - 15) + 10); };
export const seg = (x: number, a: number, b: number) => sstep((x - a) / (b - a));
export const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const bez = (a: V3, b: V3, c: V3, t: number): V3 => lerp3(lerp3(a, b, t), lerp3(b, c, t), t);
export const popIn = (x: number, a: number, b: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  const c = 2.2;
  return t === 0 ? 0 : 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

// ---------- 잉크 외곽선 ----------
const inkCache = new Map<number, THREE.Material>();
export const inkMat = (th: number) => {
  if (!inkCache.has(th)) {
    const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>\ntransformed += normalize(normal) * ${th.toFixed(4)};`);
    };
    m.customProgramCacheKey = () => `ink${th}`;
    inkCache.set(th, m);
  }
  return inkCache.get(th)!;
};

export const InkBox: React.FC<{ p: V3; s: V3; c: string; map?: THREE.Texture; r?: V3; th?: number; e?: string; round?: number; opacity?: number }> = ({ p, s, c, map, r, th = 0.012, e, round = 0.02, opacity = 1 }) => {
  const geo = useMemo(() => new RoundedBoxGeometry(s[0], s[1], s[2], 3, Math.min(round, Math.min(...s) * 0.45)), [s[0], s[1], s[2], round]);
  if (opacity <= 0.01) return null;
  return (
    <group position={p} rotation={r}>
      <mesh geometry={geo} castShadow={opacity > 0.9} receiveShadow>
        <meshStandardMaterial color={c} map={map} roughness={0.85} emissive={e ?? "#000"} emissiveIntensity={e ? 1 : 0} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      {opacity > 0.6 && <mesh geometry={geo} material={inkMat(th)} />}
    </group>
  );
};

export const InkCyl: React.FC<{ p: V3; r: number; r2?: number; h: number; c: string; th?: number; e?: string; seg?: number }> = ({ p, r, r2, h, c, th = 0.01, e, seg: sg = 32 }) => {
  const geo = useMemo(() => new THREE.CylinderGeometry(r, r2 ?? r, h, sg), [r, r2, h, sg]);
  return (
    <group position={p}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color={c} roughness={0.7} emissive={e ?? "#000"} emissiveIntensity={e ? 1 : 0} />
      </mesh>
      <mesh geometry={geo} material={inkMat(th)} />
    </group>
  );
};

/** 잉크 외곽선 공 (은행나무 잎 덩어리 등) */
export const InkBall: React.FC<{ p: V3; r: number; c: string; th?: number; detail?: number }> = ({ p, r, c, th = 0.015, detail = 1 }) => {
  const geo = useMemo(() => new THREE.IcosahedronGeometry(r, detail), [r, detail]);
  return (
    <group position={p}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color={c} roughness={0.9} flatShading />
      </mesh>
      <mesh geometry={geo} material={inkMat(th)} />
    </group>
  );
};

// ---------- 칠한 질감 ----------
export const rng = (s: number) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
export const painted = (w: number, h: number, base: string, draw?: (g: CanvasRenderingContext2D, r: () => number) => void, seed = 3) =>
  canvasTexture(w, h, (g) => {
    const r = rng(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let k = 0; k < 900; k++) {
      g.globalAlpha = 0.025 + r() * 0.035;
      g.fillStyle = r() > 0.5 ? "#ffffff" : "#000000";
      g.beginPath();
      g.ellipse(r() * w, r() * h, 4 + r() * 16, 2 + r() * 6, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    draw?.(g, r);
  });

export const glowTex = (c = "255,190,110") =>
  canvasTexture(256, 256, (g) => {
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, `rgba(${c},0.9)`);
    gr.addColorStop(0.35, `rgba(${c},0.35)`);
    gr.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 256);
  });

// ---------- 카메라 ----------
export type CK = { u: number; p: V3; t: V3 };
/** 키 사이를 부드럽게(smootherstep) 잇는다 */
export const camAt = (keys: CK[], u: number): { p: V3; t: V3 } => {
  let i = 0;
  while (i < keys.length - 2 && u > keys[i + 1].u) i++;
  const a = keys[i], b = keys[i + 1] ?? keys[i];
  const k = b.u > a.u ? seg(u, a.u, b.u) : 1;
  return { p: lerp3(a.p, b.p, k), t: lerp3(a.t, b.t, k) };
};
export const CamSet: React.FC<{ p: V3; t: V3; fov?: number; roll?: number }> = ({ p, t, fov = 38, roll = 0 }) => {
  const { camera } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  cam.position.set(...p);
  cam.lookAt(...t);
  if (roll) cam.rotateZ(roll);
  return null;
};

// ---------- 카드 ----------
export const Card: React.FC<{ tex: THREE.Texture; at: V3; w: number; h: number; cam: V3; scale?: number; sx?: number; rotZ?: number; flipX?: boolean; tint?: string; opacity?: number; additive?: boolean }> = ({ tex, at, w, h, cam, scale = 1, sx = 1, rotZ = 0, flipX, tint = "#fff4e8", opacity = 1, additive }) => {
  if (scale < 0.01 || opacity < 0.01) return null;
  const yaw = Math.atan2(cam[0] - at[0], cam[2] - at[2]);
  return (
    <group position={at} rotation={[0, yaw, 0]}>
      <mesh rotation={[0, 0, rotZ]} scale={[(flipX ? -1 : 1) * scale * Math.max(0.02, sx), scale, 1]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} transparent alphaTest={additive ? 0 : 0.4} color={tint} toneMapped={false} side={THREE.DoubleSide} opacity={opacity} blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending} depthWrite={!additive} />
      </mesh>
    </group>
  );
};

/** 그림 함수로 만든 카드 (deps 가 바뀔 때만 다시 그림) */
export const useTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, deps: unknown[]) =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => canvasTexture(w, h, draw), deps);

export const H = 1.0; // 사람 카드 높이
// 같은 모습은 한 번만 그린다 (걸음·날갯짓은 8단계로 끊어서 재사용)
const texCache = new Map<string, THREE.Texture>();
export const qa = (x: number | undefined, step: number) => (x === undefined ? undefined : Math.round(x / step) * step);
const charTex = (look: Look, pose: Pose) => {
  const p: Pose = { ...pose, walk: qa(pose.walk, Math.PI / 4), flap: qa(pose.flap, Math.PI / 4), armL: qa(pose.armL, 5), armR: qa(pose.armR, 5), wings: qa(pose.wings, 0.1), look: qa(pose.look, 0.2), blush: qa(pose.blush, 0.25) };
  const key = JSON.stringify([look, p]);
  let t = texCache.get(key);
  if (!t) {
    if (texCache.size > 400) {
      const first = texCache.keys().next().value as string;
      texCache.get(first)?.dispose();
      texCache.delete(first);
    }
    t = canvasTexture(600, 1000, (g) => drawChar(g, look, p));
    texCache.set(key, t);
  }
  return t;
};
export const Person: React.FC<{ look: Look; pose: Pose; feet: V3; cam: V3; flipX?: boolean; tint?: string; scale?: number; bob?: number }> = ({ look, pose, feet, cam, flipX, tint, scale = 1, bob = 0 }) => {
  const tex = charTex(look, pose);
  return <Card tex={tex} at={[feet[0], feet[1] + (H / 2) * scale + bob, feet[2]]} w={0.6 * H} h={H} cam={cam} flipX={flipX} tint={tint} scale={scale} />;
};
/** 접촉 그림자 (발밑 어두운 타원) */
export const Blob: React.FC<{ at: V3; r?: number; o?: number }> = ({ at, r = 0.22, o = 0.35 }) => (
  <mesh position={[at[0], 0.006, at[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.55, 1]}>
    <circleGeometry args={[r, 24]} />
    <meshBasicMaterial color="#1a0f18" transparent opacity={o} depthWrite={false} />
  </mesh>
);
export const handAt = (pose: Pose, side: 1 | -1, feet: V3, flipX = false): V3 => {
  const [u, v] = handUV(pose, side);
  const uu = flipX ? 1 - u : u;
  return [feet[0] + (uu - 0.5) * 0.6 * H, feet[1] + (1 - v) * H, feet[2] + 0.03];
};

/** 동그란 스테인리스 의자 */
export const Stool: React.FC<{ x: number; z: number }> = ({ x, z }) => (
  <group>
    <InkCyl p={[x, 0.33, z]} r={0.15} h={0.05} c="#c23b3b" th={0.008} />
    {[0, 2.1, 4.2].map((a) => <InkCyl key={a} p={[x + Math.cos(a) * 0.1, 0.155, z + Math.sin(a) * 0.1]} r={0.014} h={0.31} c="#b9bec6" th={0.006} />)}
  </group>
);
