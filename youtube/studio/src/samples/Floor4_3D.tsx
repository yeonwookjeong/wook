// 3D 설명 장면 샘플: 아파트 4층이 빨갛게 빛나고 빠진 뒤, F 층이 들어온다 (4초).
// 신비한 건축사전식 "모형 + 빨간 강조" 느낌을 무료로(코드로) 낼 수 있는지 보는 시험용.
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

export const FLOOR4_FRAMES = 120;
const FLOORS = 8;
const H = 1; // 층 높이
const W = 4.2;
const D = 3;
const RED = new THREE.Color("#e8322b");

// 창문 줄무늬 + 층 번호 판을 캔버스로 그려 벽 무늬로 쓴다
function useFloorTexture(label: string) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const g = c.getContext("2d")!;
    g.fillStyle = "#f1e8dc";
    g.fillRect(0, 0, 512, 128);
    g.fillStyle = "#9fc3d9";
    for (let i = 0; i < 5; i++) g.fillRect(150 + i * 70, 34, 48, 58);
    g.fillStyle = "#d9cbb8";
    g.fillRect(0, 118, 512, 10); // 층 사이 띠
    // 번호 판
    g.fillStyle = label === "F" ? "#e8322b" : "#3b3f46";
    g.beginPath();
    g.roundRect(22, 22, 96, 78, 14);
    g.fill();
    g.fillStyle = "#ffffff";
    g.font = "bold 64px Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(label, 70, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [label]);
}

const Floor: React.FC<{ y: number; label: string; x?: number; glow?: number; opacity?: number }> = ({ y, label, x = 0, glow = 0, opacity = 1 }) => {
  const tex = useFloorTexture(label);
  const side = useMemo(() => new THREE.Color("#e6dccd"), []);
  const color = side.clone().lerp(RED, glow * 0.85);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(W + 0.06, H + 0.06, D + 0.06)), []);
  return (
    <group position={[x, y + H / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[W, H * 0.98, D]} />
        {/* 앞·뒤·옆 면 순서: +x, -x, +y, -y, +z(앞), -z */}
        <meshStandardMaterial attach="material-0" color={color} transparent opacity={opacity} />
        <meshStandardMaterial attach="material-1" color={color} transparent opacity={opacity} />
        <meshStandardMaterial attach="material-2" color={color} transparent opacity={opacity} />
        <meshStandardMaterial attach="material-3" color={color} transparent opacity={opacity} />
        <meshStandardMaterial attach="material-4" map={tex} color={new THREE.Color("#ffffff").lerp(RED, glow * 0.75)} emissive={RED} emissiveIntensity={glow * 0.35} transparent opacity={opacity} />
        <meshStandardMaterial attach="material-5" color={color} transparent opacity={opacity} />
      </mesh>
      {glow > 0.01 && (
        <lineSegments geometry={edges}>
          <lineBasicMaterial color={RED} transparent opacity={glow * opacity} />
        </lineSegments>
      )}
    </group>
  );
};

const Tree: React.FC<{ p: [number, number] ; s?: number }> = ({ p, s = 1 }) => (
  <group position={[p[0], 0, p[1]]} scale={s}>
    <mesh position={[0, 0.35, 0]} castShadow>
      <cylinderGeometry args={[0.08, 0.1, 0.7]} />
      <meshStandardMaterial color="#8a6a4a" />
    </mesh>
    <mesh position={[0, 1.05, 0]} castShadow>
      <sphereGeometry args={[0.55, 16, 12]} />
      <meshStandardMaterial color="#7fb36a" />
    </mesh>
  </group>
);

const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const ease = Easing.inOut(Easing.cubic);
  const glow = interpolate(f, [18, 32, 40, 46], [0, 1, 0.75, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = interpolate(f, [50, 72], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const inn = interpolate(f, [78, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.4)) });
  const fGlow = interpolate(f, [96, 104, 120], [0, 1, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // 카메라: 비스듬히 위에서 천천히 돈다, 끝으로 갈수록 4층 쪽으로 살짝 다가감
  const ang = interpolate(f, [0, FLOOR4_FRAMES], [0.55, 0.95]);
  const r = interpolate(f, [0, FLOOR4_FRAMES], [26, 22], { easing: Easing.inOut(Easing.quad) });
  const camY = interpolate(f, [0, FLOOR4_FRAMES], [13, 10]);
  const target = new THREE.Vector3(0, 4.2, 0);
  return (
    <>
      <CameraRig pos={[Math.sin(ang) * r, camY, Math.cos(ang) * r]} target={target} />
      <ambientLight intensity={0.9} />
      <hemisphereLight args={["#fff3e0", "#9bbf8a", 0.6]} />
      <directionalLight position={[8, 14, 6]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={12} shadow-camera-bottom={-4} />
      {/* 땅 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[9, 48]} />
        <meshStandardMaterial color="#cfe3b4" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[W + 1.6, D + 1.6]} />
        <meshStandardMaterial color="#d8d2c6" />
      </mesh>
      {[[-4.2, 2.6], [4.1, 2.2], [-3.6, -2.8], [3.8, -2.4], [-5.2, 0.2], [5.6, 0.6]].map((p, i) => (
        <Tree key={i} p={p as [number, number]} s={0.9 + (i % 3) * 0.15} />
      ))}
      {Array.from({ length: FLOORS }, (_, i) => {
        const n = i + 1;
        if (n === 4) {
          return (
            <group key={n}>
              {/* 원래 4층: 빨갛게 → 오른쪽으로 빠지며 사라짐 */}
              <Floor y={i * H} label="4" glow={glow} x={out * 7} opacity={1 - out} />
              {/* F 층: 왼쪽에서 들어옴 */}
              {inn > 0 && <Floor y={i * H} label="F" x={(1 - inn) * -7} glow={fGlow * 0.5} opacity={Math.min(1, inn * 1.5)} />}
            </group>
          );
        }
        return <Floor key={n} y={i * H} label={String(n)} />;
      })}
      {/* 지붕 */}
      <mesh position={[0, FLOORS * H + 0.12, 0]} castShadow>
        <boxGeometry args={[W + 0.3, 0.24, D + 0.3]} />
        <meshStandardMaterial color="#cbbfae" />
      </mesh>
    </>
  );
};

const CameraRig: React.FC<{ pos: [number, number, number]; target: THREE.Vector3 }> = ({ pos, target }) => {
  const { camera } = useThree();
  camera.position.set(...pos);
  camera.lookAt(target);
  return null;
};

export const Floor4_3D: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#f6c9a8 0%, #fbe6cf 45%, #eef3f7 100%)" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 32, position: [14, 13, 20] }} gl={{ antialias: true }}>
        <Scene />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
