// "모형 세상": EP01 전체가 한 아파트 단지 안에서 벌어진다 (F층 빠지는 장면과 같은 그림체).
// 1단계 장면: aerial(단지 하늘에서) → reveal(103동 앞벽이 사라지며 엘리베이터 통로) → ride1(1·2·3) → ride2(F, ?)
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { D, Floor, FLOORS, Ground, H, Tower, Tree, W } from "../samples/Complex3D";
import { canvasTex, clamp } from "./kit";

export type WorldMode = "aerial" | "reveal" | "ride1" | "ride2";

type Key = { p: THREE.Vector3; t: THREE.Vector3 };
const K = (px: number, py: number, pz: number, tx: number, ty: number, tz: number): Key => ({ p: new THREE.Vector3(px, py, pz), t: new THREE.Vector3(tx, ty, tz) });
// 컷이 바뀌어도 카메라가 끊기지 않게, 앞 컷의 끝 = 다음 컷의 시작
const CAM: Record<WorldMode, [Key, Key]> = {
  aerial: [K(26, 30, 34, 0, 4, -3), K(14, 9, 17, 0, 3.4, 0)],
  reveal: [K(14, 9, 17, 0, 3.4, 0), K(4.2, 3.0, 10.5, 0, 1.9, 0)],
  ride1: [K(4.2, 3.0, 10.5, 0, 1.9, 0), K(3.0, 1.9, 8.6, 0, 1.25, 0)],
  ride2: [K(3.0, 1.9, 8.6, 0, 1.25, 0), K(1.9, 2.7, 6.4, 0, 2.05, 0)],
};

const CameraRig: React.FC<{ mode: WorldMode; t: number }> = ({ mode, t }) => {
  const { camera } = useThree();
  const [a, b] = CAM[mode];
  const k = Easing.inOut(Easing.cubic)(t);
  camera.position.copy(a.p.clone().lerp(b.p, k));
  camera.lookAt(a.t.clone().lerp(b.t, k));
  return null;
};

const LABELS = Array.from({ length: FLOORS }, (_, i) => (i + 1 === 4 ? "F" : String(i + 1)));

// 층 번호 판 (엘리베이터 통로 옆, 불이 켜질 수 있음)
function plateTex(label: string, lit: boolean) {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = lit ? (label === "F" ? "#ff8a1f" : "#ffd27a") : "#3b3f46";
    g.beginPath();
    g.roundRect(14, 14, 228, 228, 40);
    g.fill();
    g.fillStyle = lit ? "#2a1a0a" : "#e9e6df";
    g.font = "bold 170px Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(label, 128, 140);
  });
}

const Plate: React.FC<{ y: number; label: string; lit: number }> = ({ y, label, lit }) => {
  const off = useMemo(() => plateTex(label, false), [label]);
  const on = useMemo(() => plateTex(label, true), [label]);
  return (
    <group position={[-0.62, y + H * 0.55, D / 2 - 0.25]}>
      <mesh>
        <planeGeometry args={[0.3, 0.3]} />
        <meshBasicMaterial map={lit > 0.5 ? on : off} toneMapped={false} />
      </mesh>
      {lit > 0.5 && <pointLight position={[0, 0, 0.3]} color={label === "F" ? "#ff8a1f" : "#ffd27a"} intensity={0.6} distance={1.4} />}
    </group>
  );
};

// 103동 속: 층 바닥, 뒷벽, 옆벽, 방 소품, 가운데 엘리베이터 통로와 엘리베이터 칸
const CutTower: React.FC<{ cab: number; litUpTo: number }> = ({ cab, litUpTo }) => {
  const inset = 0.04;
  const w = W - inset * 2;
  const d = D - inset * 2;
  const rooms = useMemo(() => ["#f3e3cc", "#efe0d0", "#f4e8d6", "#eadccb"], []);
  return (
    <group>
      {Array.from({ length: FLOORS }, (_, i) => {
        const y = i * H;
        const c = rooms[i % rooms.length];
        return (
          <group key={i} position={[0, y, 0]}>
            {/* 바닥판 */}
            <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
              <boxGeometry args={[w, 0.06, d]} />
              <meshStandardMaterial color="#d9cdbd" />
            </mesh>
            {/* 뒷벽 */}
            <mesh position={[0, H / 2, -d / 2 + 0.03]} receiveShadow>
              <boxGeometry args={[w, H, 0.06]} />
              <meshStandardMaterial color={c} />
            </mesh>
            {/* 왼쪽 방: 소파 + 화분 */}
            <mesh position={[-1.75, 0.16, -0.35]} castShadow>
              <boxGeometry args={[0.9, 0.2, 0.35]} />
              <meshStandardMaterial color={["#8a9bb0", "#b08a7a", "#7f9a7a"][i % 3]} />
            </mesh>
            <mesh position={[-1.75, 0.3, -0.5]} castShadow>
              <boxGeometry args={[0.9, 0.22, 0.08]} />
              <meshStandardMaterial color={["#7a8ba0", "#9d7a6a", "#6f8a6a"][i % 3]} />
            </mesh>
            <mesh position={[-2.25, 0.22, 0.2]} castShadow>
              <icosahedronGeometry args={[0.12, 0]} />
              <meshStandardMaterial color="#7fae67" flatShading />
            </mesh>
            {/* 오른쪽 방: 식탁 + 조명 */}
            <mesh position={[1.7, 0.2, -0.1]} castShadow>
              <boxGeometry args={[0.7, 0.04, 0.4]} />
              <meshStandardMaterial color="#b48a62" />
            </mesh>
            <mesh position={[1.7, 0.1, -0.1]}>
              <boxGeometry args={[0.05, 0.18, 0.05]} />
              <meshStandardMaterial color="#8c6a4a" />
            </mesh>
            <mesh position={[1.7, H - 0.12, -0.1]}>
              <sphereGeometry args={[0.06, 12, 8]} />
              <meshBasicMaterial color="#ffe2a8" toneMapped={false} />
            </mesh>
            {/* 엘리베이터 통로 벽(어둡게) */}
            <mesh position={[0, H / 2, -0.35]}>
              <boxGeometry args={[0.95, H, 0.05]} />
              <meshStandardMaterial color="#5a5550" />
            </mesh>
            {[-0.5, 0.5].map((x) => (
              <mesh key={x} position={[x, H / 2, 0.15]}>
                <boxGeometry args={[0.05, H, 1.0]} />
                <meshStandardMaterial color="#6a645d" />
              </mesh>
            ))}
            <Plate y={0} label={LABELS[i]} lit={i < litUpTo ? 1 : 0} />
          </group>
        );
      })}
      {/* 엘리베이터 칸 */}
      <group position={[0, cab * H + 0.06 + (H * 0.82) / 2, 0.1]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, H * 0.82, 0.75]} />
          <meshStandardMaterial color="#c9c3ba" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.38]}>
          <planeGeometry args={[0.6, H * 0.7]} />
          <meshStandardMaterial color="#fff3dd" emissive="#ffd9a0" emissiveIntensity={0.4} />
        </mesh>
      </group>
    </group>
  );
};

// 물음표 (3D 판)
const Question: React.FC<{ s: number; pos: [number, number, number] }> = ({ s, pos }) => {
  const tex = useMemo(
    () =>
      canvasTex(256, 256, (g) => {
        g.font = "900 220px Arial";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.lineWidth = 18;
        g.strokeStyle = "#1b1b1b";
        g.strokeText("?", 128, 140);
        g.fillStyle = "#ffd23a";
        g.fillText("?", 128, 140);
      }),
    [],
  );
  if (s < 0.01) return null;
  return (
    <mesh position={pos} scale={s} rotation={[0, 0.25, -0.12]}>
      <planeGeometry args={[0.7, 0.7]} />
      <meshBasicMaterial map={tex} transparent depthTest={false} toneMapped={false} />
    </mesh>
  );
};

const Scene: React.FC<{ mode: WorldMode; t: number }> = ({ mode, t }) => {
  // 앞벽 투명도: reveal 동안 사라짐
  const facade = mode === "aerial" ? 1 : mode === "reveal" ? interpolate(t, [0.3, 0.85], [1, 0.08], clamp) : 0.08;
  // 엘리베이터 칸 위치(층 번호 0부터)와 불 켜진 층 수
  const cab = mode === "ride1" ? interpolate(t, [0.05, 0.95], [0, 2], clamp) : mode === "ride2" ? interpolate(t, [0, 0.4], [2, 3], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
  const litUpTo = mode === "ride1" ? Math.floor(cab + 0.5) + 1 : mode === "ride2" ? (t > 0.38 ? 4 : 3) : mode === "reveal" ? (t > 0.85 ? 1 : 0) : 0;
  const q = mode === "ride2" ? interpolate(t, [0.5, 0.68], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) }) : 0;
  const y4 = 3 * H;
  return (
    <>
      <CameraRig mode={mode} t={t} />
      <hemisphereLight args={["#fff1e0", "#d9c6ab", 1.1]} />
      <directionalLight position={[14, 20, 9]} intensity={2.4} color="#ffe1c2" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={22} shadow-camera-bottom={-22} shadow-camera-far={80} />
      {/* 앞쪽에서 비추는 따뜻한 보조광: 단면 속 방이 어둡지 않게 */}
      <directionalLight position={[3, 5, 14]} intensity={1.3} color="#ffe6c8" />
      <ambientLight intensity={0.25} />
      <Ground />
      {/* 103동: 속(통로·방)은 늘 있고, 앞벽이 서서히 투명해진다 */}
      <group>
        <CutTower cab={cab} litUpTo={litUpTo} />
        {facade > 0.09 &&
          Array.from({ length: FLOORS }, (_, i) => <Floor key={i} y={i * H} label={i + 1 <= 12 ? String(i + 1) : undefined} opacity={facade} />)}
        {/* 옥상 */}
        <mesh position={[0, FLOORS * H + 0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[W + 0.2, 0.3, D + 0.3]} />
          <meshStandardMaterial color="#d9d0c3" />
        </mesh>
        {/* 옆벽은 그대로 (단면처럼 보이게) */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[(sx * W) / 2, (FLOORS * H) / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.06, FLOORS * H, D]} />
            <meshStandardMaterial color="#efe7dc" />
          </mesh>
        ))}
      </group>
      <Question s={q} pos={[0.55, y4 + 0.45, 1.3]} />
      <Tower pos={[-8, 0, -6]} dong="101" />
      <Tower pos={[8.5, 0, -7]} dong="102" floors={13} />
      <Tower pos={[-1, 0, -15]} dong="104" floors={17} />
      <Tower pos={[-15, 0, -14]} dong="105" floors={12} />
      {[
        [-4.5, 3.2], [4.6, 3.4], [-6.5, 2.1], [6.8, 2.6], [-2.6, 4.2], [2.2, 4.4], [-10.5, -2], [-12, 1], [11.5, -2.5], [12.5, 0.8],
        [-4.2, -10], [3.5, -11], [6, -11.5], [-9, -10.5], [14, -9], [-18, -8], [17, -13], [9, 6], [-9, 6.5], [0.5, 6.8],
        [-14, 5], [15, 5.5], [-6, -2.6], [5.5, -3],
      ]
        .filter(([x, z]) => !(Math.abs(x) < 3.5 && z > 0)) // 103동 앞 나무는 빼서 단면을 가리지 않게
        .map((p, i) => (
        <Tree key={i} p={p as [number, number]} s={0.85 + ((i * 7) % 5) * 0.08} />
      ))}
    </>
  );
};

export const World: React.FC<{ mode: WorldMode; t: number }> = ({ mode, t }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#f3b98f 0%, #f8d7bd 40%, #fbeadb 75%)" }}>
      <ThreeCanvas width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }} camera={{ fov: 34, near: 0.3, far: 200 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}>
        <Scene mode={mode} t={t} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// 미리보기: 네 모드를 이어서 (각 1.5초)
const MODES: WorldMode[] = ["aerial", "reveal", "ride1", "ride2"];
const SEG = 45;
export const WORLD_TEST_FRAMES = SEG * MODES.length;
export const WorldTest: React.FC = () => {
  const f = useCurrentFrame();
  const i = Math.min(MODES.length - 1, Math.floor(f / SEG));
  return <World mode={MODES[i]} t={(f % SEG) / (SEG - 1)} />;
};
