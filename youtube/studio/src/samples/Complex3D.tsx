// 3D 설명 장면 샘플 v2 (6초): 아파트 단지 위에서 103동으로 다가감 → 4층이 빨갛게 빛남 → 빠짐 → F 층이 들어옴.
// 목표: "신비한 건축사전"급 모형 느낌(부드러운 그림자, 구석 음영, 단지·도로·나무)을 코드로 내는지 확인.
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";

export const COMPLEX_FRAMES = 180;
const FLOORS = 15;
const H = 0.62; // 층 높이
const W = 5.2; // 건물 가로
const D = 1.9; // 건물 깊이
const RED = new THREE.Color("#e8322b");
const WALL = "#f2ece3";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------- 캔버스 무늬 ----------
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// 앞면: 큰 거실 창 4칸 + 층간 띠
const useFrontTex = () =>
  useMemo(
    () =>
      canvasTex(1024, 128, (g) => {
        g.fillStyle = WALL;
        g.fillRect(0, 0, 1024, 128);
        for (let i = 0; i < 4; i++) {
          const x = 40 + i * 248;
          g.fillStyle = "#7f97a6";
          g.fillRect(x, 22, 200, 84);
          g.fillStyle = "#a9c4d4";
          g.fillRect(x + 6, 28, 92, 72);
          g.fillRect(x + 102, 28, 92, 72);
          g.fillStyle = "rgba(255,255,255,0.35)";
          g.fillRect(x + 10, 30, 30, 68);
        }
        g.fillStyle = "#ddd3c5";
        g.fillRect(0, 118, 1024, 10);
      }),
    [],
  );

// 옆면: 작은 창 + 층 번호 판
function useSideTex(label: string, red: boolean) {
  return useMemo(
    () =>
      canvasTex(256, 128, (g) => {
        g.fillStyle = WALL;
        g.fillRect(0, 0, 256, 128);
        g.fillStyle = "#a9c4d4";
        g.fillRect(150, 34, 56, 56);
        g.fillStyle = "#ddd3c5";
        g.fillRect(0, 118, 256, 10);
        g.fillStyle = red ? "#e8322b" : "#3b3f46";
        g.beginPath();
        g.roundRect(26, 24, 92, 80, 14);
        g.fill();
        g.fillStyle = "#fff";
        g.font = "bold 62px Arial";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(label, 72, 66);
      }),
    [label, red],
  );
}

const useDongTex = (n: string) =>
  useMemo(
    () =>
      canvasTex(512, 256, (g) => {
        g.fillStyle = WALL;
        g.fillRect(0, 0, 512, 256);
        g.fillStyle = "#4a5a6a";
        g.font = "bold 170px Arial";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(n, 256, 136);
      }),
    [n],
  );

// ---------- 층 하나 ----------
const Floor: React.FC<{ y: number; label?: string; glow?: number; offset?: THREE.Vector3; opacity?: number; redPlate?: boolean }> = ({ y, label, glow = 0, offset, opacity = 1, redPlate = false }) => {
  const front = useFrontTex();
  const side = useSideTex(label ?? "", redPlate);
  const tint = new THREE.Color(WALL).lerp(RED, glow * 0.85);
  const white = new THREE.Color("#ffffff").lerp(RED, glow * 0.7);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(W + 0.08, H + 0.04, D + 0.7)), []);
  const t = opacity < 1;
  const m = { transparent: t, opacity, emissive: RED, emissiveIntensity: glow * 0.3 };
  return (
    <group position={[offset?.x ?? 0, y + H / 2, offset?.z ?? 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[W, H * 0.985, D]} />
        <meshStandardMaterial attach="material-0" map={label ? side : undefined} color={label ? white : tint} {...m} />
        <meshStandardMaterial attach="material-1" color={tint} {...m} />
        <meshStandardMaterial attach="material-2" color={tint} {...m} />
        <meshStandardMaterial attach="material-3" color={tint} {...m} />
        <meshStandardMaterial attach="material-4" map={front} color={white} {...m} />
        <meshStandardMaterial attach="material-5" color={tint} {...m} />
      </mesh>
      {/* 발코니 바닥 + 유리 난간 */}
      <mesh position={[0, -H / 2 + 0.04, D / 2 + 0.3]} castShadow receiveShadow>
        <boxGeometry args={[W - 0.2, 0.07, 0.6]} />
        <meshStandardMaterial color={tint} {...m} />
      </mesh>
      <mesh position={[0, -H / 2 + 0.2, D / 2 + 0.59]}>
        <boxGeometry args={[W - 0.2, 0.26, 0.03]} />
        <meshStandardMaterial color={glow > 0.01 ? "#f08a84" : "#cfe3ec"} transparent opacity={0.55 * opacity} roughness={0.1} metalness={0.1} />
      </mesh>
      {glow > 0.01 && (
        <lineSegments geometry={edges} position={[0, 0, 0.35]}>
          <lineBasicMaterial color={RED} transparent opacity={glow * opacity} />
        </lineSegments>
      )}
    </group>
  );
};

// 건물 발밑 부드러운 어둠 (구석 음영 대신)
const useAoTex = () =>
  useMemo(
    () =>
      canvasTex(256, 256, (g) => {
        const gr = g.createRadialGradient(128, 128, 30, 128, 128, 128);
        gr.addColorStop(0, "rgba(60,40,30,0.45)");
        gr.addColorStop(1, "rgba(60,40,30,0)");
        g.fillStyle = gr;
        g.fillRect(0, 0, 256, 256);
      }),
    [],
  );

// ---------- 동 하나 (움직이지 않는 건물) ----------
const Tower: React.FC<{ pos: [number, number, number]; dong: string; floors?: number; children?: React.ReactNode; skip?: number; labeled?: boolean }> = ({ pos, dong, floors = FLOORS, children, skip, labeled }) => {
  const dongTex = useDongTex(dong);
  return (
    <group position={pos}>
      {Array.from({ length: floors }, (_, i) => (i + 1 === skip ? null : <Floor key={i} y={i * H} label={labeled && i + 1 <= 12 ? String(i + 1) : undefined} />))}
      {children}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.3]}>
        <planeGeometry args={[W + 2.4, D + 2.8]} />
        <meshBasicMaterial map={useAoTex()} transparent depthWrite={false} />
      </mesh>
      {/* 필로티 아래 그림자 띠 + 옥상 */}
      <mesh position={[0, floors * H + 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[W + 0.2, 0.3, D + 0.3]} />
        <meshStandardMaterial color="#d9d0c3" />
      </mesh>
      <mesh position={[W / 2 - 1.1, floors * H + 0.7, 0]} castShadow>
        <boxGeometry args={[1.2, 0.8, 1.2]} />
        <meshStandardMaterial color="#e4dccf" />
      </mesh>
      {/* 옆벽 동 번호 */}
      <mesh position={[W / 2 + 0.006, (floors - 2) * H, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[D * 0.95, D * 0.475]} />
        <meshStandardMaterial map={dongTex} />
      </mesh>
    </group>
  );
};

const Tree: React.FC<{ p: [number, number]; s?: number }> = ({ p, s = 1 }) => (
  <group position={[p[0], 0, p[1]]} scale={s}>
    <mesh position={[0, 0.3, 0]} castShadow>
      <cylinderGeometry args={[0.06, 0.08, 0.6]} />
      <meshStandardMaterial color="#8a6a4a" />
    </mesh>
    <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
      <icosahedronGeometry args={[0.5, 1]} />
      <meshStandardMaterial color="#86b86e" flatShading />
    </mesh>
  </group>
);

// 단지 바닥: 잔디, 도로, 주차선, 보도
const Ground: React.FC = () => {
  const lot = useMemo(
    () =>
      canvasTex(1024, 1024, (g) => {
        g.fillStyle = "#c9ddb0";
        g.fillRect(0, 0, 1024, 1024);
        g.fillStyle = "#b9b4ab"; // 단지 안 도로
        g.fillRect(0, 600, 1024, 90);
        g.fillRect(470, 0, 80, 1024);
        g.strokeStyle = "#f4f1ea";
        g.lineWidth = 4;
        g.setLineDash([26, 22]);
        g.beginPath();
        g.moveTo(0, 645);
        g.lineTo(1024, 645);
        g.moveTo(510, 0);
        g.lineTo(510, 1024);
        g.stroke();
        g.setLineDash([]);
        g.fillStyle = "#d3cfc7"; // 주차장
        g.fillRect(600, 700, 330, 120);
        g.strokeStyle = "#ffffff";
        g.lineWidth = 3;
        for (let i = 0; i <= 11; i++) {
          g.beginPath();
          g.moveTo(600 + i * 30, 700);
          g.lineTo(600 + i * 30, 750);
          g.stroke();
        }
        g.fillStyle = "#e6e0d6"; // 보도
        g.fillRect(0, 580, 1024, 20);
        g.fillRect(0, 690, 1024, 20);
      }),
    [],
  );
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial map={lot} />
      </mesh>
    </>
  );
};

const CameraRig: React.FC<{ pos: THREE.Vector3; target: THREE.Vector3 }> = ({ pos, target }) => {
  const { camera } = useThree();
  camera.position.copy(pos);
  camera.lookAt(target);
  return null;
};

// p: 장면 진행 0~1, split: 앞 컷(접근+빨간 강조)이 끝나는 지점. 에피소드에서 컷 둘에 걸쳐 이어 쓸 수 있게.
const Scene: React.FC<{ p: number; split: number }> = ({ p, split }) => {
  const a = p / split; // 앞 컷 진행
  const b = (p - split) / (1 - split); // 뒤 컷 진행
  const k = interpolate(a, [0, 0.62], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const drift = interpolate(p, [split * 0.62, 1], [0, 1], clamp);
  const start = new THREE.Vector3(24, 26, 30);
  const end = new THREE.Vector3(15 - drift * 2.4, 7.2 - drift * 0.6, 17 + drift * 0.8);
  const pos = start.clone().lerp(end, k);
  const target = new THREE.Vector3(0, 5, -3).lerp(new THREE.Vector3(0.4, 0.9, 0), k);

  const glow = interpolate(a, [0.6, 0.75, 0.87, 1], [0, 1, 0.7, 1], clamp);
  const out = interpolate(b, [0.04, 0.34], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const inn = interpolate(b, [0.42, 0.72], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.3)) });
  const fGlow = interpolate(b, [0.66, 0.78, 1], [0, 0.8, 0.45], clamp);
  // 화면에서 옆으로 빠지는 방향 (카메라 시선과 수직)
  const dir = new THREE.Vector3(0.75, 0, -0.66);
  const y4 = 3 * H;

  return (
    <>
      <CameraRig pos={pos} target={target} />
      <hemisphereLight args={["#fff1e0", "#a8c08f", 1.1]} />
      <directionalLight
        position={[14, 20, 9]}
        intensity={2.4}
        color="#ffe1c2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-camera-far={80}
      />
      <Ground />
      {/* 주인공 103동 (4층만 따로 움직임) */}
      <Tower pos={[0, 0, 0]} dong="103" skip={4} labeled>
        <Floor y={y4} label="4" glow={glow} offset={dir.clone().multiplyScalar(out * 9)} opacity={1 - out} />
        {inn > 0 && <Floor y={y4} label="F" redPlate glow={fGlow} offset={dir.clone().multiplyScalar((1 - inn) * -9)} opacity={Math.min(1, inn * 1.6)} />}
      </Tower>
      <Tower pos={[-8, 0, -6]} dong="101" />
      <Tower pos={[8.5, 0, -7]} dong="102" floors={13} />
      <Tower pos={[-1, 0, -15]} dong="104" floors={17} />
      <Tower pos={[-15, 0, -14]} dong="105" floors={12} />
      {[
        [-4.5, 3.2], [4.6, 3.4], [-6.5, 2.1], [6.8, 2.6], [-2.6, 4.2], [2.2, 4.4], [-10.5, -2], [-12, 1], [11.5, -2.5], [12.5, 0.8],
        [-4.2, -10], [3.5, -11], [6, -11.5], [-9, -10.5], [14, -9], [-18, -8], [17, -13], [9, 6], [-9, 6.5], [0.5, 6.8],
        [-14, 5], [15, 5.5], [-6, -2.6], [5.5, -3],
      ].map((p, i) => (
        <Tree key={i} p={p as [number, number]} s={0.85 + ((i * 7) % 5) * 0.08} />
      ))}
    </>
  );
};

export const Complex3D: React.FC<{ p?: number; split?: number }> = ({ p, split = 0.48 }) => {
  const { width, height } = useVideoConfig();
  const f = useCurrentFrame();
  const prog = p ?? f / (COMPLEX_FRAMES - 1);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#f3b98f 0%, #f8d7bd 40%, #fbeadb 75%)" }}>
      <ThreeCanvas width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }} camera={{ fov: 34, near: 0.5, far: 200 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}>
        <Scene p={prog} split={split} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
