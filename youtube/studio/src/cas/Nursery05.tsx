// EP05 화질 비교용: 신생아실 (12월 31일 밤). fx=false → 지금 방식(A), fx=true → 안개·초점 흐림·빛 번짐·색 보정(B)
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Bloom, DepthOfField, EffectComposer, HueSaturation, Vignette } from "@react-three/postprocessing";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadFont } from "@remotion/google-fonts/NotoSansKR";
import { PEN_KO } from "../three/mini";
import { drawBaby, drawBalloon } from "./cards05";
import { Blob, CamSet, camAt, Card, CK, glowTex, InkBox, InkCyl, painted, Person } from "./kit";
import { canvasTexture, HIM, ME } from "./toonkr";

const { fontFamily } = loadFont();
const SANS = `"${fontFamily}", Arial, sans-serif`;
type V3 = [number, number, number];

const CAM: CK[] = [
  { u: 0, p: [0.15, 1.7, 3.2], t: [0, 1.05, -0.7] },
  { u: 1, p: [0.05, 1.5, 1.45], t: [0.05, 1.08, -0.7] },
];
const OUR: V3 = [0, 0, -0.7]; // 우리 아기 침대
const BEDS: V3[] = [[-0.85, 0, -0.9], [0.85, 0, -0.9], [-0.45, 0, -1.8], [0.45, 0, -1.8], [-1.3, 0, -1.8], [1.3, 0, -1.8]];

const Bassinet: React.FC<{ at: V3; baby: THREE.Texture; cam: V3; tag: string }> = ({ at, baby, cam, tag }) => (
  <group>
    {/* 바퀴 달린 받침 */}
    <InkBox p={[at[0], 0.62, at[2]]} s={[0.5, 0.05, 0.32]} c="#e8eef3" />
    {[-0.2, 0.2].map((x) => <InkBox key={x} p={[at[0] + x, 0.31, at[2]]} s={[0.04, 0.62, 0.04]} c="#b9c2cc" />)}
    {[-0.2, 0.2].map((x) => <InkCyl key={`w${x}`} p={[at[0] + x, 0.03, at[2]]} r={0.03} h={0.04} c="#3b3e44" th={0.005} />)}
    {/* 투명 아기 바구니 (낮고 위가 열린 통) + 테두리선 */}
    <mesh position={[at[0], 0.73, at[2]]}>
      <boxGeometry args={[0.46, 0.16, 0.3]} />
      <meshPhysicalMaterial color="#dff3ff" transparent opacity={0.22} roughness={0.15} depthWrite={false} />
    </mesh>
    <lineSegments position={[at[0], 0.73, at[2]]}>
      <edgesGeometry args={[new THREE.BoxGeometry(0.46, 0.16, 0.3)]} />
      <lineBasicMaterial color="#2b1a22" />
    </lineSegments>
    <Card tex={baby} at={[at[0], 0.86, at[2] + 0.02]} w={0.3} h={0.3} cam={cam} />
    {/* 이름표 */}
    <Card tex={nameTag(tag)} at={[at[0] + 0.14, 0.72, at[2] + 0.17]} w={0.12} h={0.07} cam={cam} />
  </group>
);
const tagCache = new Map<string, THREE.Texture>();
const nameTag = (s: string) => {
  if (!tagCache.has(s)) tagCache.set(s, canvasTexture(240, 140, (g) => {
    g.fillStyle = "#fff6c8"; g.strokeStyle = "#2b1a22"; g.lineWidth = 10; g.beginPath(); g.roundRect(6, 6, 228, 128, 18); g.fill(); g.stroke();
    g.font = `bold 64px ${PEN_KO}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#2b1a22"; g.fillText(s, 120, 74);
  }));
  return tagCache.get(s)!;
};

/** 후처리 준비: 후처리 장치가 만들어진 뒤 한 번 더 그려야 첫 프레임이 검게 나오지 않는다 */
export const PostWarmUp: React.FC = () => {
  const { advance } = useThree();
  const frame = useCurrentFrame();
  useEffect(() => {
    const h = delayRender("후처리 준비");
    let n = 0;
    const tick = () => {
      advance(performance.now());
      if (++n < 2) setTimeout(tick, 0);
      else continueRender(h);
    };
    const id = setTimeout(tick, 0);
    return () => { clearTimeout(id); continueRender(h); };
  }, [advance, frame]);
  return null;
};

const Room: React.FC<{ t: number; fx: boolean }> = ({ t, fx }) => {
  const cam = camAt(CAM, t);
  const C = cam.p;
  const tex = useMemo(() => {
    const wall = painted(1024, 512, "#f6e3e8", (g) => {
      // 아기 방 벽지: 작은 별·구름
      g.fillStyle = "rgba(255,255,255,0.7)";
      for (let k = 0; k < 40; k++) { const x = (k * 97) % 1024, y = (k * 53) % 512; g.beginPath(); g.arc(x, y, 10, 0, Math.PI * 2); g.fill(); }
    }, 21);
    const hall = painted(1024, 512, "#d7dde6", undefined, 22);
    const floor = painted(1024, 1024, "#e9e2d6", (g) => {
      g.strokeStyle = "rgba(90,80,70,0.25)"; g.lineWidth = 4;
      for (let k = 0; k <= 8; k++) { g.beginPath(); g.moveTo(k * 128, 0); g.lineTo(k * 128, 1024); g.stroke(); g.beginPath(); g.moveTo(0, k * 128); g.lineTo(1024, k * 128); g.stroke(); }
    }, 23);
    floor.wrapS = floor.wrapT = THREE.RepeatWrapping; floor.repeat.set(3, 3);
    const sign = canvasTexture(640, 180, (g) => {
      g.fillStyle = "#3f9a7a"; g.strokeStyle = "#2b1a22"; g.lineWidth = 14; g.beginPath(); g.roundRect(8, 8, 624, 164, 26); g.fill(); g.stroke();
      g.font = `bold 120px ${PEN_KO}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#ffffff"; g.fillText("신생아실", 320, 96);
    });
    const clock = canvasTexture(300, 300, (g) => {
      g.fillStyle = "#ffffff"; g.strokeStyle = "#2b1a22"; g.lineWidth = 18; g.beginPath(); g.arc(150, 150, 130, 0, Math.PI * 2); g.fill(); g.stroke();
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.lineWidth = 8; g.beginPath(); g.moveTo(150 + Math.sin(a) * 100, 150 - Math.cos(a) * 100); g.lineTo(150 + Math.sin(a) * 118, 150 - Math.cos(a) * 118); g.stroke(); }
      const hand = (a: number, l: number, w: number) => { g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(150, 150); g.lineTo(150 + Math.sin(a) * l, 150 - Math.cos(a) * l); g.stroke(); };
      hand(-0.03, 70, 14); // 시침 거의 12시
      hand(-0.1, 104, 9); // 분침 59분
      g.font = `bold 44px ${SANS}`; g.textAlign = "center"; g.fillStyle = "#e2343a"; g.fillText("12/31", 150, 214);
    });
    return {
      wall, hall, floor, sign, clock,
      baby: canvasTexture(400, 400, (g) => drawBaby(g)),
      babyAwake: canvasTexture(400, 400, (g) => drawBaby(g, true)),
      balloon: canvasTexture(300, 520, (g) => drawBalloon(g, "1", SANS)),
      glow: glowTex("255,214,150"),
    };
  }, []);
  const bob = Math.sin(t * Math.PI * 2 * 1.2) * 0.02;
  // 후처리는 한 번만 만든다 (매 프레임 새로 만들면 화면이 검게 나옴)
  const post = useMemo(() => (
    <EffectComposer multisampling={4}>
      <DepthOfField target={[OUR[0], 1.0, OUR[2]]} focalLength={0.03} bokehScale={2.5} />
      <Bloom intensity={0.7} luminanceThreshold={0.75} luminanceSmoothing={0.3} mipmapBlur />
      <HueSaturation saturation={0.08} />
      <Vignette eskil={false} offset={0.3} darkness={0.4} />
    </EffectComposer>
  ), []);
  return (
    <>
      <CamSet p={cam.p} t={cam.t} fov={36} />
      {fx && <fog attach="fog" args={["#6a5a70", 5.5, 16]} />}
      <hemisphereLight args={["#b8c4f0", "#6a5a5a", fx ? 0.55 : 0.8]} />
      <ambientLight intensity={0.15} />
      {/* 신생아실 안: 따뜻한 천장 등 */}
      <pointLight position={[0, 2.1, -0.5]} intensity={fx ? 8 : 5} distance={6} decay={1.4} color="#ffd4a0" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.004} />
      {/* 복도: 푸른 밤빛 */}
      <pointLight position={[0.8, 2.0, 2.2]} intensity={fx ? 1.4 : 2.2} distance={5} decay={1.4} color="#9fb4ff" />
      {/* 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[8, 8]} /><meshStandardMaterial map={tex.floor} roughness={0.8} /></mesh>
      {/* 신생아실 벽 */}
      <InkBox p={[0, 1.4, -2.4]} s={[5, 2.8, 0.1]} c="#ffffff" map={tex.wall} round={0.005} />
      <InkBox p={[-2.4, 1.4, -1.2]} s={[0.1, 2.8, 2.4]} c="#ffffff" map={tex.wall} round={0.005} />
      <InkBox p={[2.4, 1.4, -1.2]} s={[0.1, 2.8, 2.4]} c="#ffffff" map={tex.wall} round={0.005} />
      <mesh position={[-1.1, 1.95, -2.33]}><planeGeometry args={[0.5, 0.5]} /><meshBasicMaterial map={tex.clock} transparent toneMapped={false} /></mesh>
      {/* 창(유리벽): 아래 벽 + 틀 + 유리 */}
      <InkBox p={[0, 0.35, 0.05]} s={[5, 0.7, 0.12]} c="#ffffff" map={tex.hall} round={0.01} />
      <InkBox p={[0, 0.72, 0.05]} s={[5, 0.06, 0.2]} c="#c9d2dc" />
      <InkBox p={[0, 2.62, 0.05]} s={[5, 0.36, 0.12]} c="#ffffff" map={tex.hall} round={0.01} />
      {[-1.6, 1.6].map((x) => <InkBox key={x} p={[x, 1.7, 0.05]} s={[0.08, 1.6, 0.12]} c="#c9d2dc" />)}
      <mesh position={[0, 1.7, 0.05]}><planeGeometry args={[5, 1.6]} /><meshPhysicalMaterial color="#cfe8ff" transparent opacity={0.1} roughness={0.05} depthWrite={false} /></mesh>
      <mesh position={[0, 2.62, 0.13]}><planeGeometry args={[1.2, 0.34]} /><meshBasicMaterial map={tex.sign} toneMapped={false} /></mesh>
      {/* 아기 침대들 */}
      {BEDS.map((b, k) => <Bassinet key={k} at={b} baby={tex.baby} cam={C} tag={["민준", "서연", "지호", "하은", "도윤", "수아"][k]} />)}
      <Bassinet at={OUR} baby={t > 0.55 ? tex.babyAwake : tex.baby} cam={C} tag="12.31" />
      {/* 우리 아기 풍선 "1" */}
      <mesh position={[OUR[0] + 0.2, 1.05, OUR[2]]}><cylinderGeometry args={[0.003, 0.003, 0.35, 4]} /><meshBasicMaterial color="#2b1a22" /></mesh>
      <Card tex={tex.balloon} at={[OUR[0] + 0.2, 1.42 + bob, OUR[2]]} w={0.3} h={0.52} cam={C} rotZ={Math.sin(t * 7) * 0.05} />
      {/* 천장 등 빛 */}
      <Card tex={tex.glow} at={[0, 2.1, -0.5]} w={0.6} h={0.6} cam={C} tint="#a08070" additive />
      {/* 복도의 부모 (유리 앞) */}
      <Person look={ME} pose={{ armL: 12, armR: 60, look: 0.2, mouth: t > 0.5 ? "grin" : "smile", blush: t > 0.5 ? 0.6 : 0, blink: Math.floor(t * 40) % 17 === 0 }} feet={[-0.48, 0, 0.55]} cam={C} />
      <Person look={HIM} pose={{ armL: 60, armR: 12, look: -0.2, mouth: "grin", blink: Math.floor(t * 40 + 5) % 19 === 0 }} feet={[0.48, 0, 0.55]} cam={C} flipX />
      <Blob at={[-0.48, 0, 0.55]} />
      <Blob at={[0.48, 0, 0.55]} />
      {fx && post}
      {fx && <PostWarmUp />}
    </>
  );
};

export const Nursery05: React.FC<{ fx?: boolean }> = ({ fx = false }) => {
  const f = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const t = f / (durationInFrames - 1);
  return (
    <AbsoluteFill style={{ background: "#2a2840" }}>
      <AbsoluteFill style={{ filter: fx ? "contrast(1.04)" : "saturate(1.12) contrast(1.05)" }}>
        <ThreeCanvas width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }} camera={{ fov: 36, near: 0.05, far: 60 }} gl={fx ? { antialias: false, stencil: false, toneMappingExposure: 1.1 } : { antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}>
          <Room t={t} fx={fx} />
        </ThreeCanvas>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
