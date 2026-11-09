// "모형 세상": EP01 전체가 한 아파트 단지 안에서 벌어진다 (F층 빠지는 장면과 같은 그림체).
// 모드 = 컷. 앞 컷 카메라 끝 = 다음 컷 카메라 시작이라 컷이 바뀌어도 한 번에 이어진다.
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { D, Floor, FLOORS, Ground, H, Tower, Tree, W } from "../samples/Complex3D";
import { canvasTex, clamp } from "./kit";

export type WorldMode =
  | "aerial" | "reveal" | "ride1" | "ride2"
  | "four" | "sa" | "death1" | "death2"
  | "swapA" | "swapB"
  | "hosp1" | "hosp2"
  | "life1" | "life2" | "life3"
  | "out1" | "out2";

type Key = { p: THREE.Vector3; t: THREE.Vector3 };
const K = (px: number, py: number, pz: number, tx: number, ty: number, tz: number): Key => ({ p: new THREE.Vector3(px, py, pz), t: new THREE.Vector3(tx, ty, tz) });
const A0 = K(26, 30, 34, 0, 4, -3);
const A1 = K(14, 9, 17, 0, 3.4, 0);
const R1 = K(4.2, 3.0, 10.5, 0, 1.9, 0);
const RD1 = K(3.0, 1.9, 8.6, 0, 1.25, 0);
const RD2 = K(1.9, 2.7, 6.4, 0, 2.05, 0);
const F1 = K(7.5, 8.2, 16, 0, 10.4, 0);
const F2 = K(6, 9.6, 13.5, 0, 10.9, 0);
const F3 = K(4.8, 10.6, 11.5, 0, 11.2, 0);
const F4 = K(3.4, 11.2, 8.4, 0, 11.4, 0);
const S1 = K(23, 21, 27, 0, 2.5, -4);
const S2 = K(20, 16, 23, 0, 2.5, -4);
const H1 = K(24, 9, 20, 13, 4.3, 3);
const H2 = K(21, 6.5, 16, 13, 3.7, 3);
const L1 = K(3.4, 3.1, 8.6, 0, 2.15, 0);
const L2 = K(1.9, 2.6, 5.8, 0.7, 2.15, 0);
const L3 = K(2.0, 2.45, 4.9, 1.7, 2.1, 0);
const O1 = K(11, 9, 17, 0, 3.6, 0);
const CAM: Record<WorldMode, [Key, Key]> = {
  aerial: [A0, A1], reveal: [A1, R1], ride1: [R1, RD1], ride2: [RD1, RD2],
  four: [RD2, F1], sa: [F1, F2], death1: [F2, F3], death2: [F3, F4],
  swapA: [F4, S1], swapB: [S1, S2],
  hosp1: [S2, H1], hosp2: [H1, H2],
  life1: [H2, L1], life2: [L1, L2], life3: [L2, L3],
  out1: [L3, O1], out2: [O1, A0],
};

// 카메라: 모든 컷의 기준점을 지나는 곡선 하나 (Catmull-Rom). 컷 경계에서 멈췄다 출발하지 않고 이어서 흐른다.
const ORDER: WorldMode[] = ["aerial", "reveal", "ride1", "ride2", "four", "sa", "death1", "death2", "swapA", "swapB", "hosp1", "hosp2", "life1", "life2", "life3", "out1", "out2"];
const PTS = [...ORDER.map((m) => CAM[m][0]), CAM.out2[1]];
const POS = new THREE.CatmullRomCurve3(PTS.map((k) => k.p), false, "centripetal");
const TGT = new THREE.CatmullRomCurve3(PTS.map((k) => k.t), false, "centripetal");

const CameraRig: React.FC<{ mode: WorldMode; t: number }> = ({ mode, t }) => {
  const { camera } = useThree();
  const idx = ORDER.indexOf(mode);
  // 맨 처음만 천천히 출발, 맨 끝만 천천히 도착 (반복 재생 이음새)
  const tt = idx === 0 ? Easing.in(Easing.quad)(t) * 0.5 + t * 0.5 : idx === ORDER.length - 1 ? Easing.out(Easing.quad)(t) * 0.5 + t * 0.5 : t;
  const u = (idx + tt) / ORDER.length;
  camera.position.copy(POS.getPoint(u));
  camera.lookAt(TGT.getPoint(u));
  return null;
};

// ---------- 글자 판 ----------
function glyphTex(text: string, o: { bg: string; fg: string; size?: number; font?: string; round?: boolean }) {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = o.bg;
    if (o.round) {
      g.beginPath();
      g.roundRect(14, 14, 228, 228, 40);
      g.fill();
    } else g.fillRect(0, 0, 256, 256);
    g.fillStyle = o.fg;
    g.font = `bold ${o.size ?? 170}px ${o.font ?? "Arial"}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 128, 140);
  });
}

const LABELS = Array.from({ length: FLOORS }, (_, i) => (i + 1 === 4 ? "F" : String(i + 1)));

const Plate: React.FC<{ label: string; lit: boolean }> = ({ label, lit }) => {
  const off = useMemo(() => glyphTex(label, { bg: "#3b3f46", fg: "#e9e6df", round: true }), [label]);
  const on = useMemo(() => glyphTex(label, { bg: label === "F" ? "#ff8a1f" : "#ffd27a", fg: "#2a1a0a", round: true }), [label]);
  return (
    <group position={[-0.62, H * 0.55, D / 2 - 0.25]}>
      <mesh>
        <planeGeometry args={[0.3, 0.3]} />
        <meshBasicMaterial map={lit ? on : off} toneMapped={false} />
      </mesh>
      {lit && <pointLight position={[0, 0, 0.3]} color={label === "F" ? "#ff8a1f" : "#ffd27a"} intensity={0.6} distance={1.4} />}
    </group>
  );
};

// 인형 같은 사람 (얼굴 없음)
export const Person: React.FC<{ p: [number, number, number]; coat: string; s?: number; ry?: number; sit?: boolean }> = ({ p, coat, s = 0.32, ry = 0, sit }) => (
  <group position={p} scale={s} rotation={[0, ry, 0]}>
    <mesh position={[0, sit ? 0.55 : 0.75, 0]} castShadow>
      <capsuleGeometry args={[0.2, sit ? 0.45 : 0.75, 6, 12]} />
      <meshStandardMaterial color={coat} roughness={0.8} />
    </mesh>
    <mesh position={[0, sit ? 1.1 : 1.48, 0]} castShadow>
      <sphereGeometry args={[0.17, 16, 12]} />
      <meshStandardMaterial color="#f0c9a6" roughness={0.7} />
    </mesh>
    <mesh position={[0, sit ? 1.14 : 1.52, -0.02]}>
      <sphereGeometry args={[0.175, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
      <meshStandardMaterial color="#2b211c" roughness={0.9} />
    </mesh>
  </group>
);

// ---------- 103동 속 (방·엘리베이터 통로·층 번호) ----------
const Room: React.FC<{ i: number }> = ({ i }) => {
  const kind = i % 3;
  const sofa = ["#8a9bb0", "#b08a7a", "#7f9a7a"][i % 3];
  return (
    <>
      {/* 왼쪽 방 */}
      {kind === 0 && (
        <>
          <mesh position={[-1.75, 0.16, -0.35]} castShadow>
            <boxGeometry args={[0.9, 0.2, 0.35]} />
            <meshStandardMaterial color={sofa} />
          </mesh>
          <mesh position={[-1.75, 0.3, -0.5]} castShadow>
            <boxGeometry args={[0.9, 0.22, 0.08]} />
            <meshStandardMaterial color={sofa} />
          </mesh>
          <mesh position={[-1.75, 0.32, -0.62]}>
            <boxGeometry args={[0.6, 0.32, 0.03]} />
            <meshStandardMaterial color="#202326" emissive="#4a6a8a" emissiveIntensity={0.25} />
          </mesh>
        </>
      )}
      {kind === 1 && (
        <>
          <mesh position={[-1.8, 0.13, -0.3]} castShadow>
            <boxGeometry args={[0.95, 0.14, 0.6]} />
            <meshStandardMaterial color="#f4efe6" />
          </mesh>
          <mesh position={[-1.8, 0.2, -0.05]} castShadow>
            <boxGeometry args={[0.95, 0.05, 0.25]} />
            <meshStandardMaterial color="#c9a3a3" />
          </mesh>
          <mesh position={[-1.8, 0.3, -0.62]}>
            <boxGeometry args={[0.95, 0.4, 0.05]} />
            <meshStandardMaterial color="#a07c5c" />
          </mesh>
        </>
      )}
      {kind === 2 && (
        <>
          <mesh position={[-1.9, 0.25, -0.45]} castShadow>
            <boxGeometry args={[0.7, 0.42, 0.25]} />
            <meshStandardMaterial color="#b48a62" />
          </mesh>
          <mesh position={[-1.45, 0.2, 0.0]} castShadow>
            <cylinderGeometry args={[0.1, 0.08, 0.2, 12]} />
            <meshStandardMaterial color="#c97b55" />
          </mesh>
          <mesh position={[-1.45, 0.36, 0.0]} castShadow>
            <icosahedronGeometry args={[0.13, 0]} />
            <meshStandardMaterial color="#7fae67" flatShading />
          </mesh>
        </>
      )}
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
    </>
  );
};

const CutTower: React.FC<{ cab: number; litUpTo: number }> = ({ cab, litUpTo }) => {
  const inset = 0.04;
  const w = W - inset * 2;
  const d = D - inset * 2;
  const walls = ["#f3e3cc", "#efe0d0", "#f4e8d6", "#eadccb"];
  return (
    <group>
      {Array.from({ length: FLOORS }, (_, i) => (
        <group key={i} position={[0, i * H, 0]}>
          <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
            <boxGeometry args={[w, 0.06, d]} />
            <meshStandardMaterial color="#d9cdbd" />
          </mesh>
          <mesh position={[0, H / 2, -d / 2 + 0.03]} receiveShadow>
            <boxGeometry args={[w, H, 0.06]} />
            <meshStandardMaterial color={walls[i % walls.length]} />
          </mesh>
          <Room i={i} />
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
          <Plate label={LABELS[i]} lit={i < litUpTo} />
        </group>
      ))}
      {/* F층(4층) 가족: 식탁에 둘, 소파 앞에 하나 */}
      <group position={[0, 3 * H + 0.06, 0]}>
        <Person p={[1.42, 0, 0.12]} coat="#c86b5a" s={0.4} ry={0.8} sit />
        <Person p={[1.98, 0, 0.12]} coat="#4a6a8a" s={0.4} ry={-0.8} sit />
        <Person p={[-1.5, 0, 0.15]} coat="#e0b04a" s={0.3} ry={0.4} />
      </group>
      {/* 다른 층 사람들 */}
      <Person p={[1.6, 0.06 + 6 * H, 0.15]} coat="#6f7d5c" s={0.3} ry={-0.5} />
      <Person p={[-1.6, 0.06 + 1 * H, 0.2]} coat="#8c5a8a" s={0.3} ry={0.6} />
      <Person p={[1.8, 0.06 + 9 * H, 0.1]} coat="#3d4a63" s={0.3} ry={-0.3} sit />
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

// ---------- 떠 있는 판: ? , 4/사/死 블록, "F = 4th floor" 꼬리표, 말풍선 ----------
const Sprite: React.FC<{ tex: THREE.Texture; s: number; pos: [number, number, number]; size: [number, number]; rz?: number }> = ({ tex, s, pos, size, rz = 0 }) =>
  s < 0.01 ? null : (
    <mesh position={pos} scale={0.7 + 0.3 * s} rotation={[0, 0.3, rz]}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={tex} transparent opacity={Math.min(1, s)} depthTest={false} toneMapped={false} />
    </mesh>
  );

const useQ = () =>
  useMemo(
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

const tagTex = (text: string, w = 640) =>
  canvasTex(w, 160, (g) => {
    g.fillStyle = "#ffd23a";
    g.beginPath();
    g.roundRect(8, 8, w - 16, 144, 30);
    g.fill();
    g.lineWidth = 8;
    g.strokeStyle = "#1b1b1b";
    g.stroke();
    g.fillStyle = "#1b1b1b";
    g.font = "900 84px Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, w / 2, 86);
  });

const bubbleTex = () =>
  canvasTex(320, 220, (g) => {
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.roundRect(10, 10, 300, 150, 60);
    g.fill();
    g.beginPath();
    g.moveTo(90, 155);
    g.lineTo(70, 210);
    g.lineTo(140, 158);
    g.fill();
    g.fillStyle = "#333";
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      g.arc(105 + k * 55, 85, 16, 0, Math.PI * 2);
      g.fill();
    }
  });

// 옥상 위 큰 블록: 앞면 4 → 반 바퀴(뒷면 사) → 다시 반 바퀴(앞면이 死로 바뀌어 있음)
const Block: React.FC<{ show: number; spin: number; death: boolean }> = ({ show, spin, death }) => {
  const cjk = '"WenQuanYi Zen Hei", Arial';
  const t4 = useMemo(() => glyphTex("4", { bg: "#f2ece3", fg: "#2c2f33", size: 200 }), []);
  const tsa = useMemo(() => glyphTex("사", { bg: "#f2ece3", fg: "#2c2f33", size: 180, font: cjk }), []);
  const tsi = useMemo(() => glyphTex("死", { bg: "#241414", fg: "#e8322b", size: 190, font: cjk }), []);
  if (show < 0.01) return null;
  const side = death ? "#3a1c1c" : "#ddd3c5";
  const op = { transparent: show < 1, opacity: show };
  return (
    <group position={[0, FLOORS * H + 0.6 + 1.3 * show, 0]} scale={0.8 + 0.2 * show} rotation={[0, Math.PI * spin, 0]}>
      <mesh castShadow>
        <boxGeometry args={[2.2, 2.2, 0.45]} />
        <meshStandardMaterial attach="material-0" color={side} {...op} />
        <meshStandardMaterial attach="material-1" color={side} {...op} />
        <meshStandardMaterial attach="material-2" color={side} {...op} />
        <meshStandardMaterial attach="material-3" color={side} {...op} />
        <meshStandardMaterial attach="material-4" map={death ? tsi : t4} emissive={death ? "#5a0a0a" : "#000000"} emissiveIntensity={0.6} {...op} />
        <meshStandardMaterial attach="material-5" map={tsa} {...op} />
      </mesh>
    </group>
  );
};

// ---------- 병원 (단지 오른쪽) ----------
const HOSP = new THREE.Vector3(13, 0, 3);
const HFLOORS = 9;
const Hospital: React.FC<{ glow: number; out: number; drop: number }> = ({ glow, out, drop }) => {
  const cross = "#1ba59a";
  return (
    <group position={HOSP}>
      {Array.from({ length: HFLOORS }, (_, i) => {
        const n = i + 1;
        if (n === 4) return <Floor key={n} y={3 * H} label="4" glow={glow} offset={new THREE.Vector3(out * 7, 0, out * 3)} opacity={1 - out} />;
        const y = (n > 4 ? i - drop : i) * H;
        return <Floor key={n} y={y} label={String(n)} />;
      })}
      <group position={[0, (HFLOORS - drop) * H, 0]}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[W + 0.2, 0.3, D + 0.3]} />
          <meshStandardMaterial color="#e6e2da" />
        </mesh>
        <group position={[-1.2, 1.0, 0.4]}>
          <mesh>
            <boxGeometry args={[1.3, 1.3, 0.14]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0, 0.08]}>
            <boxGeometry args={[0.95, 0.3, 0.04]} />
            <meshStandardMaterial color={cross} emissive={cross} emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.08]}>
            <boxGeometry args={[0.3, 0.95, 0.04]} />
            <meshStandardMaterial color={cross} emissive={cross} emissiveIntensity={0.3} />
          </mesh>
        </group>
      </group>
      {/* 1층 현관 차양(청록) */}
      <mesh position={[0, 0.7, D / 2 + 0.5]} castShadow>
        <boxGeometry args={[2.4, 0.1, 1]} />
        <meshStandardMaterial color={cross} />
      </mesh>
    </group>
  );
};

const TREES: [number, number][] = [
  [-4.5, 3.2], [4.6, 3.4], [-6.5, 2.1], [6.8, 2.6], [-10.5, -2], [-12, 1], [11.5, -2.5], [9, 6], [-9, 6.5],
  [-4.2, -10], [3.5, -11], [6, -11.5], [-9, -10.5], [14, -9], [-18, -8], [17, -13], [-14, 5], [17.5, 6.5], [-6, -2.6], [5.5, -3],
];

// 다른 동들: 4층만 따로 그려서 동시에 바꿀 수 있게
const OTHERS: { pos: [number, number, number]; dong: string; floors: number }[] = [
  { pos: [-8, 0, -6], dong: "101", floors: 15 },
  { pos: [8.5, 0, -7], dong: "102", floors: 13 },
  { pos: [-1, 0, -15], dong: "104", floors: 17 },
  { pos: [-15, 0, -14], dong: "105", floors: 12 },
];

const Scene: React.FC<{ mode: WorldMode; t: number; tag: string }> = ({ mode, t, tag }) => {
  const q = useQ();
  const tagT = useMemo(() => tagTex(tag), [tag]);
  const bub = useMemo(() => bubbleTex(), []);
  const i = (m: WorldMode) => mode === m;
  const ease = Easing.inOut(Easing.cubic);
  // 103동 앞벽: 앞으로 빠짐(0=제자리, 1=빠져서 사라짐)
  const slide =
    i("aerial") ? 0 : i("reveal") ? interpolate(t, [0.3, 0.85], [0, 1], { ...clamp, easing: ease }) : i("ride1") || i("ride2") ? 1 : i("four") ? interpolate(t, [0.1, 0.7], [1, 0], { ...clamp, easing: ease }) : i("life1") ? interpolate(t, [0, 0.3], [0, 1], { ...clamp, easing: ease }) : i("life2") || i("life3") ? 1 : i("out1") ? interpolate(t, [0.2, 0.8], [1, 0], { ...clamp, easing: ease }) : 0;
  const cab = i("ride1") ? interpolate(t, [0.05, 0.95], [0, 2], clamp) : i("ride2") ? interpolate(t, [0, 0.4], [2, 3], { ...clamp, easing: Easing.out(Easing.cubic) }) : i("life1") || i("life2") || i("life3") ? 3 : 0;
  const litUpTo = i("ride1") ? Math.floor(cab + 0.5) + 1 : i("ride2") ? (t > 0.38 ? 4 : 3) : i("reveal") ? (t > 0.85 ? 1 : 0) : i("life1") || i("life2") || i("life3") ? 4 : 0;
  const qS = i("ride2") ? interpolate(t, [0.45, 0.7], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
  // 4 → 사 → 死 블록
  const blockShow = i("four") ? interpolate(t, [0.3, 0.85], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : i("sa") || i("death1") || i("death2") ? 1 : i("swapA") ? interpolate(t, [0, 0.45], [1, 0], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
  const spin = i("sa") ? interpolate(t, [0.05, 0.5], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : i("death1") ? interpolate(t, [0.4, 0.85], [1, 2], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : i("death2") || i("swapA") ? 2 : 0;
  const death = i("death1") || i("death2") || i("swapA");
  // 하늘 어둡기 (死)
  const dark = i("death1") ? interpolate(t, [0.45, 0.9], [0, 1], clamp) : i("death2") ? 1 : i("swapA") ? interpolate(t, [0, 0.5], [1, 0], clamp) : 0;
  // 모든 동 4층: 빨갛게 → 빠짐 → F
  const swapGlow = i("swapA") ? interpolate(t, [0.4, 0.6, 0.75, 0.9], [0, 1, 0.7, 1], clamp) : i("swapB") ? 1 : 0;
  const swapped = i("swapB") || i("hosp1") || i("hosp2") || i("life1") || i("life2") || i("life3") || i("out1") || i("out2");
  // 병원
  const hGlow = i("hosp2") ? interpolate(t, [0.05, 0.2], [0, 1], clamp) : 0;
  const hOut = i("hosp2") ? interpolate(t, [0.25, 0.5], [0, 1], { ...clamp, easing: ease }) : 0;
  const hDrop = i("hosp2") ? interpolate(t, [0.45, 0.8], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : 0;
  // F층 꼬리표, 말풍선
  const tagS = i("life2") ? interpolate(t, [0.12, 0.4], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
  const bubS = i("life3") ? interpolate(t, [0.15, 0.45], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
  // 마지막: F 판들이 은은하게
  const fGlowAll = i("out1") || i("out2") ? 0.5 : swapped ? 0.35 : 0;

  const dir = new THREE.Vector3(0.75, 0, -0.66);
  const swapOffset = (k: number) => {
    // 동마다 조금씩 늦게
    if (!i("swapB")) return { out: 0, inn: swapped ? 1 : 0 };
    const tt = t - k * 0.06;
    return {
      out: interpolate(tt, [0.0, 0.3], [0, 1], { ...clamp, easing: ease }),
      inn: interpolate(tt, [0.35, 0.65], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.3)) }),
    };
  };
  const sun = 2.4 * (1 - 0.65 * dark);

  const fourth = (k: number) => {
    const { out, inn } = swapOffset(k);
    const showOld = !swapped || (i("swapB") && out < 1);
    return (
      <>
        {showOld && <Floor y={3 * H} label="4" glow={swapGlow} offset={dir.clone().multiplyScalar(out * 9)} opacity={1 - out} />}
        {swapped && inn > 0 && <Floor y={3 * H} label="F" redPlate glow={i("swapB") ? 0.5 * (1 - t) + fGlowAll : fGlowAll} offset={dir.clone().multiplyScalar((1 - inn) * -9)} opacity={Math.min(1, inn * 1.6)} />}
      </>
    );
  };

  return (
    <>
      <CameraRig mode={mode} t={t} />
      <hemisphereLight args={[dark > 0 ? new THREE.Color("#fff1e0").lerp(new THREE.Color("#6a5a7a"), dark) : "#fff1e0", "#d9c6ab", 1.1 * (1 - 0.5 * dark)]} />
      <directionalLight position={[14, 20, 9]} intensity={sun} color="#ffe1c2" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02} shadow-camera-left={-26} shadow-camera-right={26} shadow-camera-top={26} shadow-camera-bottom={-26} shadow-camera-far={90} />
      <directionalLight position={[3, 5, 14]} intensity={1.3 * (1 - 0.5 * dark)} color="#ffe6c8" />
      <ambientLight intensity={0.25} />
      {dark > 0 && <pointLight position={[0, FLOORS * H + 2, 3]} color="#ff3a2a" intensity={6 * dark} distance={12} />}
      <Ground />

      {/* 103동 */}
      <CutTower cab={cab} litUpTo={litUpTo} />
      {slide < 0.999 &&
        Array.from({ length: FLOORS }, (_, k) =>
          k === 3 ? null : <Floor key={k} y={k * H} label={k + 1 <= 12 ? String(k + 1) : undefined} offset={new THREE.Vector3(slide * 11, 0, slide * 1.5)} opacity={1 - slide} />,
        )}
      {slide < 0.999 && <group position={[slide * 11, 0, slide * 1.5]}>{fourth(0)}</group>}
      <mesh position={[0, FLOORS * H + 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[W + 0.2, 0.3, D + 0.3]} />
        <meshStandardMaterial color="#d9d0c3" />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[(sx * W) / 2, (FLOORS * H) / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.06, FLOORS * H, D]} />
          <meshStandardMaterial color="#efe7dc" />
        </mesh>
      ))}

      {/* 다른 동들 */}
      {OTHERS.map((o, k) => (
        <Tower key={o.dong} pos={o.pos} dong={o.dong} floors={o.floors} skip={4}>
          {fourth(k + 1)}
        </Tower>
      ))}
      <Hospital glow={hGlow} out={hOut} drop={hDrop} />
      {TREES.map((p, k) => (
        <Tree key={k} p={p} s={0.85 + ((k * 7) % 5) * 0.08} />
      ))}

      <Block show={blockShow} spin={spin} death={death} />
      <Sprite tex={q} s={qS} pos={[0.55, 3 * H + 0.45, 1.3]} size={[0.7, 0.7]} rz={-0.12} />
      <Sprite tex={tagT} s={tagS} pos={[0.75, 3 * H + 0.95, 1.2]} size={[1.1, 0.28]} />
      <Sprite tex={bub} s={bubS} pos={[1.7, 3 * H + 0.8, 0.6]} size={[0.5, 0.34]} />
    </>
  );
};

const sky = (dark: number) => (dark > 0.5 ? "linear-gradient(#2a1a2a 0%, #4a2a33 45%, #6a3a3a 80%)" : "linear-gradient(#f3b98f 0%, #f8d7bd 40%, #fbeadb 75%)");

export const World: React.FC<{ mode: WorldMode; t: number; tag?: string }> = ({ mode, t, tag = "F = 4th floor" }) => {
  const { width, height } = useVideoConfig();
  const dark = mode === "death1" ? interpolate(t, [0.45, 0.9], [0, 1], clamp) : mode === "death2" ? 1 : mode === "swapA" ? interpolate(t, [0, 0.5], [1, 0], clamp) : 0;
  return (
    <AbsoluteFill style={{ background: sky(0) }}>
      <AbsoluteFill style={{ background: sky(1), opacity: dark }} />
      <ThreeCanvas width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }} camera={{ fov: 34, near: 0.3, far: 200 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}>
        <Scene mode={mode} t={t} tag={tag} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// 미리보기: 모든 모드를 이어서 (각 1초)
export const WORLD_MODES: WorldMode[] = ["aerial", "reveal", "ride1", "ride2", "four", "sa", "death1", "death2", "swapA", "swapB", "hosp1", "hosp2", "life1", "life2", "life3", "out1", "out2"];
const SEG = 30;
export const WORLD_TEST_FRAMES = SEG * WORLD_MODES.length;
export const WorldTest: React.FC = () => {
  const f = useCurrentFrame();
  const k = Math.min(WORLD_MODES.length - 1, Math.floor(f / SEG));
  return <World mode={WORLD_MODES[k]} t={(f % SEG) / (SEG - 1)} />;
};
