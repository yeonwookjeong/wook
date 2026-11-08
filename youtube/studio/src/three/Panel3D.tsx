// 엘리베이터 버튼판 3D. EP01의 버튼 컷들(시작 4 → F 뒤집힘 → 1,2,3 훑기 → F 클로즈업 ? → F 누름 → 끝)
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useVideoConfig } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { brushedTex, canvasTex, clamp } from "./kit";

export type PanelMode = "intro" | "flip" | "pan" | "close" | "press" | "end";

const GAP = 0.62;
const yOf = (n: number) => -1.55 + (n - 1) * GAP; // 1층 버튼 높이부터 위로
const Y4 = yOf(4);

function labelTex(text: string, lit: boolean, mirror = false) {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = lit ? "#fbe7cf" : "#e9e6df";
    g.fillRect(0, 0, 256, 256);
    // 원기둥 뚜껑의 무늬 좌표가 90도 돌아가 있어서 글자를 반대로 돌려 그린다
    g.translate(128, 128);
    g.rotate(-Math.PI / 2);
    if (mirror) g.scale(-1, 1);
    g.fillStyle = lit ? "#d2430a" : "#2f3237";
    g.font = "bold 150px Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 0, 10);
  });
}

const Env: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  }, [gl, scene]);
  return null;
};

const CameraRig: React.FC<{ pos: THREE.Vector3; target: THREE.Vector3 }> = ({ pos, target }) => {
  const { camera } = useThree();
  camera.position.copy(pos);
  camera.lookAt(target);
  return null;
};

// 버튼 하나: 크롬 테두리 + 숫자 면. flip은 0→1 동안 세로축으로 반 바퀴(앞 4, 뒤 F)
const Button: React.FC<{ n: number; front: string; back?: string; flip?: number; glow?: number; push?: number }> = ({ n, front, back, flip = 0, glow = 0, push = 0 }) => {
  const lit = glow > 0.05;
  const fTex = useMemo(() => labelTex(front, lit), [front, lit]);
  const bTex = useMemo(() => (back ? labelTex(back, true) : null), [back]);
  const warm = new THREE.Color("#ffd9a0");
  return (
    <group position={[0, yOf(n), 0.05 - push * 0.035]}>
      {/* 크롬 테두리 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.235, 0.245, 0.05, 48]} />
        <meshStandardMaterial color="#d9d9d9" metalness={1} roughness={0.18} />
      </mesh>
      {/* 숫자 면 (뒤집힘) */}
      <group position={[0, 0, 0.03]} rotation={[0, Math.PI * flip, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.19, 0.19, 0.03, 48]} />
          <meshStandardMaterial attach="material-0" color="#cfcac2" metalness={0.6} roughness={0.3} />
          <meshStandardMaterial attach="material-1" map={fTex} emissive={warm} emissiveIntensity={glow * 0.18} roughness={0.35} />
          <meshStandardMaterial attach="material-2" map={bTex ?? fTex} emissive={warm} emissiveIntensity={(back ? Math.max(glow, 0.6) : glow) * 0.18} roughness={0.35} />
        </mesh>
      </group>
      {lit && (
        <mesh position={[0, 0, 0.03]}>
          <torusGeometry args={[0.205, 0.014, 12, 64]} />
          <meshBasicMaterial color="#ff9a3c" toneMapped={false} transparent opacity={Math.min(1, glow)} />
        </mesh>
      )}
      {lit && <pointLight position={[0, 0, 0.25]} color="#ffcf8a" intensity={glow * 0.6} distance={0.9} />}
    </group>
  );
};

// 물음표 팻말 (F 옆)
const Question: React.FC<{ s: number }> = ({ s }) => {
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
  if (s <= 0.01) return null;
  return (
    <mesh position={[0.2, Y4 + 0.17, 0.25]} scale={s} rotation={[0, 0, -0.12]}>
      <planeGeometry args={[0.26, 0.26]} />
      <meshBasicMaterial map={tex} transparent depthTest={false} toneMapped={false} />
    </mesh>
  );
};

const Scene: React.FC<{ mode: PanelMode; t: number }> = ({ mode, t }) => {
  const ease = Easing.inOut(Easing.cubic);
  const e = ease(t);
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  // 모드별 카메라 (시작→끝)
  const cams: Record<PanelMode, [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3]> = {
    intro: [V(0.35, Y4 - 0.1, 2.6), V(0.45, Y4 - 0.1, 3.1), V(0, Y4 - 0.25, 0), V(0, Y4 - 0.25, 0)],
    flip: [V(0.45, Y4 - 0.1, 3.1), V(0.9, Y4 - 0.4, 5.2), V(0, Y4 - 0.25, 0), V(0, Y4 - 0.6, 0)],
    pan: [V(0.7, yOf(1), 3.2), V(0.7, Y4, 3.2), V(0, yOf(1) - 0.25, 0), V(0, Y4 - 0.25, 0)],
    close: [V(0.6, Y4, 3.0), V(0.3, Y4, 1.9), V(0, Y4 - 0.25, 0), V(0, Y4 - 0.2, 0)],
    press: [V(1.6, Y4 + 0.3, 2.4), V(1.4, Y4 + 0.2, 2.0), V(0, Y4 - 0.2, 0), V(0, Y4 - 0.2, 0)],
    end: [V(0.5, Y4 - 0.1, 3.2), V(0.35, Y4 - 0.1, 2.6), V(0, Y4 - 0.25, 0), V(0, Y4 - 0.25, 0)],
  };
  const [p0, p1, t0, t1] = cams[mode];
  const pos = p0.clone().lerp(p1, mode === "flip" ? Easing.out(Easing.cubic)(t) : e);
  const target = t0.clone().lerp(t1, mode === "flip" ? Easing.out(Easing.cubic)(t) : e);

  const flip = mode === "intro" ? 0 : mode === "flip" ? interpolate(t, [0.08, 0.42], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) }) : 1;
  const glow4 = mode === "intro" ? 0.35 + 0.25 * Math.sin(t * Math.PI * 2) : mode === "press" ? interpolate(t, [0.3, 0.45], [0.6, 1.4], clamp) : mode === "end" ? 0.5 : 0.6;
  const push = mode === "press" ? interpolate(t, [0.25, 0.35, 0.6], [0, 1, 0.4], clamp) : 0;
  const q = mode === "close" ? interpolate(t, [0.35, 0.55], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) }) : 0;
  const steel = useMemo(() => brushedTex("#a39b90", 3), []);
  const plate = useMemo(() => brushedTex("#d3cec6", 11), []);

  return (
    <>
      <Env />
      <CameraRig pos={pos} target={target} />
      <ambientLight intensity={0.25} />
      <spotLight position={[0.8, 3.5, 2.5]} angle={0.7} penumbra={0.8} intensity={6} color="#ffe2bf" castShadow />
      <directionalLight position={[-2, 1, 3]} intensity={0.5} color="#ffd2a6" />
      {/* 엘리베이터 벽 */}
      <mesh position={[0, 0, -0.02]} receiveShadow>
        <planeGeometry args={[8, 10]} />
        <meshStandardMaterial map={steel} metalness={0.75} roughness={0.38} envMapIntensity={0.7} />
      </mesh>
      {/* 문 틈과 문짝 (넓은 화면에서 엘리베이터로 읽히게) */}
      <mesh position={[-1.15, 0, -0.01]}>
        <planeGeometry args={[0.04, 10]} />
        <meshStandardMaterial color="#2b2723" />
      </mesh>
      <mesh position={[-2.6, 0, -0.015]}>
        <planeGeometry args={[2.9, 10]} />
        <meshStandardMaterial map={plate} metalness={0.8} roughness={0.3} color="#e8e2d8" />
      </mesh>
      {/* 버튼판 */}
      <mesh position={[0, -0.05, 0.0]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 4.3, 0.04]} />
        <meshStandardMaterial color="#26282c" metalness={0.4} roughness={0.22} />
      </mesh>
      {/* 판 위 작은 화면(층 표시) */}
      <mesh position={[0, yOf(6) + 0.62, 0.03]}>
        <boxGeometry args={[0.6, 0.3, 0.02]} />
        <meshStandardMaterial color="#141414" roughness={0.2} />
      </mesh>
      {[1, 2, 3, 5, 6].map((n) => (
        <Button key={n} n={n} front={String(n)} />
      ))}
      <Button n={4} front="4" back="F" flip={flip} glow={glow4} push={push} />
      <Question s={q} />
    </>
  );
};

export const Panel3D: React.FC<{ mode: PanelMode; t: number }> = ({ mode, t }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#2a2622" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 34, near: 0.05, far: 50 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.9 }}>
        <Scene mode={mode} t={t} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// 미리보기용: 여섯 모드를 1초씩
import { useCurrentFrame } from "remotion";
const MODES: PanelMode[] = ["intro", "flip", "pan", "close", "press", "end"];
export const PANEL_TEST_FRAMES = 30 * MODES.length;
export const PanelTest: React.FC = () => {
  const f = useCurrentFrame();
  const i = Math.min(MODES.length - 1, Math.floor(f / 30));
  return <Panel3D mode={MODES[i]} t={(f % 30) / 29} />;
};
