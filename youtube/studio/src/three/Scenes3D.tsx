// EP01 3D 장면 모음: 4 표지판, 死 붓글씨, 병원, 층 안내판, 엘리베이터 로비.
// 각 장면은 t(컷 진행 0~1)와 m(변형)만 받는다. 카메라·조명은 장면 안에서 정한다.
import { useLoader, useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useVideoConfig } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { brushedTex, canvasTex, clamp, rng } from "./kit";
import { Panel3D, PanelMode } from "./Panel3D";


export type Spec3D =
  | { k: "panel"; m: PanelMode }
  | { k: "sign4"; m: "in" | "sa" }
  | { k: "death"; m: "soft" | "snap" }
  | { k: "hospital" }
  | { k: "directory" }
  | { k: "lobby"; m: "wait" | "display" | "next" };

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const ease = Easing.inOut(Easing.cubic);

const Env: React.FC<{ strength?: number }> = ({ strength = 0.04 }) => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), strength).texture;
  }, [gl, scene, strength]);
  return null;
};

// 카메라: [시작 위치, 끝 위치, 시작 시선, 끝 시선]
// z: 시선점에서 카메라까지 거리를 몇 배로 (세로 화면이라 좌우가 좁아서 넉넉히 뺀다)
const Cam: React.FC<{ c: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3]; t: number; e?: (x: number) => number; z?: number }> = ({ c, t, e = ease, z = 1 }) => {
  const { camera } = useThree();
  const k = e(t);
  const target = c[2].clone().lerp(c[3], k);
  const pos = c[0].clone().lerp(c[1], k);
  camera.position.copy(target.clone().add(pos.sub(target).multiplyScalar(z)));
  camera.lookAt(target);
  return null;
};

const Stage: React.FC<{ bg: string; exposure?: number; fov?: number; children: React.ReactNode }> = ({ bg, exposure = 1, fov = 34, children }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: bg }}>
      <ThreeCanvas width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }} camera={{ fov, near: 0.05, far: 200 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: exposure }}>
        {children}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// 회반죽 벽 무늬
const plasterTex = (base: string, seed: number) => {
  const r = rng(seed);
  return canvasTex(512, 512, (g) => {
    g.fillStyle = base;
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2500; i++) {
      g.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
      const s = 1 + r() * 3;
      g.fillRect(r() * 512, r() * 512, s, s);
    }
  });
};

const textTex = (text: string, o: { w?: number; h?: number; bg?: string; fg: string; font: string; y?: number }) =>
  canvasTex(o.w ?? 512, o.h ?? 512, (g) => {
    const w = o.w ?? 512;
    const h = o.h ?? 512;
    if (o.bg) {
      g.fillStyle = o.bg;
      g.fillRect(0, 0, w, h);
    }
    g.fillStyle = o.fg;
    g.font = o.font;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, w / 2, o.y ?? h / 2 + h * 0.04);
  });

export const Tree: React.FC<{ p: [number, number]; s?: number; leaf?: string }> = ({ p, s = 1, leaf = "#86b86e" }) => (
  <group position={[p[0], 0, p[1]]} scale={s}>
    <mesh position={[0, 0.3, 0]} castShadow>
      <cylinderGeometry args={[0.06, 0.08, 0.6]} />
      <meshStandardMaterial color="#8a6a4a" />
    </mesh>
    <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
      <icosahedronGeometry args={[0.5, 1]} />
      <meshStandardMaterial color={leaf} flatShading />
    </mesh>
  </group>
);

// ---------------- C: 벽의 "4" 표지판 + 화분 ----------------
const Sign4: React.FC<{ t: number; m: "in" | "sa" }> = ({ t, m }) => {
  const wall = useMemo(() => plasterTex("#efe4d4", 5), []);
  const steel = useMemo(() => brushedTex("#cfcac3", 9), []);
  const four = useMemo(() => textTex("4", { fg: "#2c2f33", font: "bold 400px Arial" }), []);
  const cam: Record<"in" | "sa", [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3]> = {
    in: [V(0.5, 0.25, 4.6), V(0.3, 0.3, 3.9), V(0, 0.1, 0), V(0, 0.15, 0)],
    sa: [V(0.3, 0.3, 3.9), V(0.2, 0.32, 3.5), V(0, 0.15, 0), V(0, 0.18, 0)],
  };
  return (
    <>
      <Env />
      <Cam c={cam[m]} t={t} z={1.35} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-3, 3, 4]} intensity={2.2} color="#ffd9b0" castShadow shadow-mapSize={[1024, 1024]} />
      <hemisphereLight args={["#fff2e0", "#d6c3a8", 0.5]} />
      <mesh receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial map={wall} roughness={0.95} />
      </mesh>
      {/* 표지판 */}
      <group position={[0, 0.55, 0.04]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.25, 1.25, 0.07]} />
          <meshStandardMaterial attach="material-0" map={steel} metalness={0.9} roughness={0.3} />
          <meshStandardMaterial attach="material-1" map={steel} metalness={0.9} roughness={0.3} />
          <meshStandardMaterial attach="material-2" map={steel} metalness={0.9} roughness={0.3} />
          <meshStandardMaterial attach="material-3" map={steel} metalness={0.9} roughness={0.3} />
          <meshStandardMaterial attach="material-4" map={steel} metalness={0.85} roughness={0.32} />
          <meshStandardMaterial attach="material-5" map={steel} metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.037]}>
          <planeGeometry args={[1.1, 1.1]} />
          <meshStandardMaterial map={four} transparent roughness={0.6} />
        </mesh>
        {[[-0.52, 0.52], [0.52, 0.52], [-0.52, -0.52], [0.52, -0.52]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
            <meshStandardMaterial color="#9b958d" metalness={1} roughness={0.25} />
          </mesh>
        ))}
      </group>
      {/* 선반과 화분 */}
      <mesh position={[0.2, -0.95, 0.25]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.08, 0.5]} />
        <meshStandardMaterial color="#c9b49a" roughness={0.7} />
      </mesh>
      <group position={[0.75, -0.91, 0.3]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.15, 0.4, 24]} />
          <meshStandardMaterial color="#c97b55" roughness={0.8} />
        </mesh>
        {[[0, 0.55, 0, 0.26], [-0.16, 0.48, 0.05, 0.2], [0.17, 0.5, -0.02, 0.21], [0.02, 0.72, -0.05, 0.18]].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <icosahedronGeometry args={[r, 1]} />
            <meshStandardMaterial color="#7fae67" flatShading />
          </mesh>
        ))}
        {[[-0.08, 0.72, 0.15], [0.12, 0.68, 0.16], [0.02, 0.85, 0.08], [-0.18, 0.6, 0.12], [0.2, 0.6, 0.1]].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]}>
            <icosahedronGeometry args={[0.07, 0]} />
            <meshStandardMaterial color="#f2a3b8" flatShading />
          </mesh>
        ))}
      </group>
    </>
  );
};

// ---------------- D: 死 붓글씨 종이 ----------------
const Death: React.FC<{ t: number; m: "soft" | "snap" }> = ({ t, m }) => {
  // 종이+死는 Ma Shan Zheng(OFL) 붓글씨로 미리 구운 그림 (렌더 중 글꼴 로딩이 불안정해서)
  const paper = useLoader(THREE.TextureLoader, staticFile("ep01/3d/paper-si.jpg"));
  paper.colorSpace = THREE.SRGBColorSpace;
  const wood = useMemo(() => {
    const r = rng(33);
    return canvasTex(512, 512, (g) => {
      for (let i = 0; i < 6; i++) {
        g.fillStyle = ["#4a3324", "#523928", "#47301f"][i % 3];
        g.fillRect(i * 86, 0, 86, 512);
        g.fillStyle = "rgba(0,0,0,0.35)";
        g.fillRect(i * 86, 0, 3, 512);
      }
      for (let i = 0; i < 400; i++) {
        g.strokeStyle = `rgba(0,0,0,${0.05 + r() * 0.08})`;
        g.beginPath();
        const x = r() * 512;
        g.moveTo(x, 0);
        g.bezierCurveTo(x + 6, 170, x - 6, 340, x + 3, 512);
        g.stroke();
      }
    });
  }, []);
  const cam: Record<"soft" | "snap", [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3]> = {
    soft: [V(0.3, 0.25, 5.0), V(0.15, 0.25, 4.3), V(0, -0.05, 0), V(0, -0.05, 0)],
    snap: [V(0.08, 0.3, 2.6), V(0.05, 0.3, 2.35), V(0, 0.05, 0), V(0, 0.05, 0)],
  };
  // 종이가 살짝 흔들림
  const sway = Math.sin(t * Math.PI * 1.5) * 0.03;
  return (
    <>
      <Cam c={cam[m]} t={t} e={m === "snap" ? Easing.out(Easing.cubic) : ease} z={m === "snap" ? 1.75 : 1.55} />
      <ambientLight intensity={0.3} />
      <spotLight position={[0.6, 3.2, 3]} angle={0.5} penumbra={0.9} intensity={40} color="#ffe0b8" castShadow shadow-mapSize={[1024, 1024]} />
      <mesh receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial map={wood} roughness={0.85} />
      </mesh>
      {/* 못과 끈 */}
      <mesh position={[0, 1.75, 0.05]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
      </mesh>
      <group position={[0, 1.75, 0.04]} rotation={[0, 0, sway]}>
        <mesh position={[0, -1.35, 0.03]} castShadow receiveShadow>
          <planeGeometry args={[1.65, 2.2, 1, 1]} />
          <meshStandardMaterial map={paper} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
        {[-0.55, 0.55].map((x) => (
          <mesh key={x} position={[x / 2, -0.12, 0.04]} rotation={[0, 0, x > 0 ? -1.1 : 1.1]}>
            <cylinderGeometry args={[0.006, 0.006, 0.62]} />
            <meshStandardMaterial color="#6b5a45" />
          </mesh>
        ))}
      </group>
    </>
  );
};

// ---------------- J: 병원 외관 ----------------
const Hospital: React.FC<{ t: number }> = ({ t }) => {
  const glass = useMemo(
    () =>
      canvasTex(1024, 512, (g) => {
        g.fillStyle = "#8fbfd8";
        g.fillRect(0, 0, 1024, 512);
        for (let x = 0; x <= 1024; x += 64) {
          g.fillStyle = "#f4f6f7";
          g.fillRect(x - 3, 0, 6, 512);
        }
        for (let y = 0; y <= 512; y += 102) {
          g.fillStyle = "#f4f6f7";
          g.fillRect(0, y - 5, 1024, 10);
        }
        g.fillStyle = "rgba(255,255,255,0.25)";
        for (let x = 0; x < 1024; x += 64) g.fillRect(x + 8, 10, 14, 480);
      }),
    [],
  );
  const panel = useMemo(
    () =>
      canvasTex(512, 1024, (g) => {
        g.fillStyle = "#f3f1ec";
        g.fillRect(0, 0, 512, 1024);
        for (let y = 40; y < 1024; y += 100)
          for (let x = 40; x < 512; x += 120) {
            g.fillStyle = "#9cc3d6";
            g.fillRect(x, y, 70, 56);
          }
      }),
    [],
  );
  const lot = useMemo(
    () =>
      canvasTex(1024, 1024, (g) => {
        g.fillStyle = "#c9ddb0";
        g.fillRect(0, 0, 1024, 1024);
        g.fillStyle = "#cfc9be";
        g.fillRect(0, 600, 1024, 140);
        g.fillStyle = "#e7e1d6";
        g.fillRect(0, 560, 1024, 40);
        g.strokeStyle = "#fff";
        g.lineWidth = 5;
        g.setLineDash([30, 24]);
        g.beginPath();
        g.moveTo(0, 670);
        g.lineTo(1024, 670);
        g.stroke();
      }),
    [],
  );
  return (
    <>
      <Env strength={0.02} />
      <Cam c={[V(6, 4, 16), V(4.5, 5, 13), V(-0.8, 3.0, 0), V(-0.8, 3.4, 0)]} t={t} z={1.5} />
      <hemisphereLight args={["#eaf4ff", "#b7c99a", 0.7]} />
      <directionalLight position={[10, 16, 12]} intensity={2.0} color="#fff4e6" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-6} shadow-normalBias={0.02} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial map={lot} />
      </mesh>
      {/* 본관(유리) */}
      <mesh position={[1.2, 1.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 3.8, 3.2]} />
        <meshStandardMaterial attach="material-0" color="#f3f1ec" />
        <meshStandardMaterial attach="material-1" color="#f3f1ec" />
        <meshStandardMaterial attach="material-2" color="#e9e6df" />
        <meshStandardMaterial attach="material-3" color="#f3f1ec" />
        <meshStandardMaterial attach="material-4" map={glass} metalness={0.3} roughness={0.15} />
        <meshStandardMaterial attach="material-5" color="#f3f1ec" />
      </mesh>
      {/* 탑(병동) */}
      <mesh position={[-3.4, 3.6, -0.3]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 7.2, 3]} />
        <meshStandardMaterial attach="material-0" map={panel} />
        <meshStandardMaterial attach="material-1" map={panel} />
        <meshStandardMaterial attach="material-2" color="#e9e6df" />
        <meshStandardMaterial attach="material-3" color="#e9e6df" />
        <meshStandardMaterial attach="material-4" map={panel} />
        <meshStandardMaterial attach="material-5" map={panel} />
      </mesh>
      {/* 십자 간판 */}
      <group position={[-3.4, 6.1, 1.25]}>
        <mesh>
          <boxGeometry args={[1.1, 1.1, 0.12]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0, 0.07]}>
          <boxGeometry args={[0.8, 0.26, 0.04]} />
          <meshStandardMaterial color="#1ba59a" emissive="#1ba59a" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.07]}>
          <boxGeometry args={[0.26, 0.8, 0.04]} />
          <meshStandardMaterial color="#1ba59a" emissive="#1ba59a" emissiveIntensity={0.3} />
        </mesh>
      </group>
      {/* 현관 차양 */}
      <mesh position={[1.4, 1.05, 2.3]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.14, 1.6]} />
        <meshStandardMaterial color="#f7f5f0" />
      </mesh>
      {[-0.1, 2.9].map((x) => (
        <mesh key={x} position={[x, 0.5, 2.95]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1]} />
          <meshStandardMaterial color="#d8d3ca" />
        </mesh>
      ))}
      {[[-6, 3.2], [-4.6, 4.2], [5.6, 3.4], [6.8, 2.2], [-1.6, 4.4], [3.9, 4.6], [8.5, -1], [-8, 0]].map((p, i) => (
        <Tree key={i} p={p as [number, number]} s={0.9 + (i % 3) * 0.12} />
      ))}
    </>
  );
};

// ---------------- G: 4층 없는 층 안내판 ----------------
const Directory: React.FC<{ t: number }> = ({ t }) => {
  const wall = useMemo(() => plasterTex("#ece8e1", 8), []);
  const rows = [6, 5, 3, 2, 1];
  const badge = useMemo(() => Object.fromEntries(rows.map((n) => [n, textTex(String(n), { w: 256, h: 256, bg: "#1f6f8b", fg: "#ffffff", font: "bold 190px Arial" })])), []); // eslint-disable-line react-hooks/exhaustive-deps
  const gap = useMemo(
    () =>
      canvasTex(512, 128, (g) => {
        g.strokeStyle = "#ff2a2a";
        g.lineWidth = 10;
        g.setLineDash([26, 18]);
        g.strokeRect(8, 8, 496, 112);
      }),
    [],
  );
  const open = interpolate(t, [0.2, 0.45], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const H = 0.36;
  return (
    <>
      <Env />
      <Cam c={[V(0.7, 0.1, 4.2), V(0.35, 0.05, 3.5), V(0, -0.45, 0), V(0, -0.4, 0)]} t={t} z={2.1} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 3, 4]} intensity={2} color="#fff6ea" castShadow shadow-mapSize={[1024, 1024]} />
      <mesh receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial map={wall} roughness={0.9} />
      </mesh>
      {/* 안내판 */}
      <mesh position={[0, 0.1, 0.04]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 2.3, 0.06]} />
        <meshStandardMaterial color="#fbfaf7" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.08, 0.075]}>
        <boxGeometry args={[1.6, 0.14, 0.01]} />
        <meshStandardMaterial color="#1f6f8b" />
      </mesh>
      {rows.map((n, i) => {
        const y = 0.75 - i * H - (n <= 3 ? open * H : 0);
        return (
          <group key={n} position={[0, y, 0.08]}>
            <mesh position={[-0.55, 0, 0]}>
              <planeGeometry args={[0.28, 0.28]} />
              <meshStandardMaterial map={badge[n]} roughness={0.5} />
            </mesh>
            <mesh position={[0.12, 0.05, 0]}>
              <planeGeometry args={[0.85, 0.06]} />
              <meshStandardMaterial color="#9aa3aa" />
            </mesh>
            <mesh position={[0.02, -0.06, 0]}>
              <planeGeometry args={[0.65, 0.05]} />
              <meshStandardMaterial color="#c3c9ce" />
            </mesh>
          </group>
        );
      })}
      {open > 0.02 && (
        <mesh position={[0, 0.75 - 2 * H, 0.085]} scale={[open, open, 1]}>
          <planeGeometry args={[1.4, 0.32]} />
          <meshBasicMaterial map={gap} transparent toneMapped={false} />
        </mesh>
      )}
    </>
  );
};

// ---------------- H: 엘리베이터 로비와 사람들 ----------------
const Person: React.FC<{ p: [number, number]; coat: string; hair?: string; h?: number }> = ({ p, coat, hair = "#2b211c", h = 1 }) => (
  <group position={[p[0], 0, p[1]]} scale={h}>
    <mesh position={[0, 0.75, 0]} castShadow>
      <capsuleGeometry args={[0.2, 0.75, 6, 16]} />
      <meshStandardMaterial color={coat} roughness={0.8} />
    </mesh>
    <mesh position={[0, 1.48, 0]} castShadow>
      <sphereGeometry args={[0.16, 24, 16]} />
      <meshStandardMaterial color="#f0c9a6" roughness={0.7} />
    </mesh>
    <mesh position={[0, 1.52, -0.02]} scale={[1.05, 0.95, 1.05]}>
      <sphereGeometry args={[0.165, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
      <meshStandardMaterial color={hair} roughness={0.9} />
    </mesh>
  </group>
);

const Lobby: React.FC<{ t: number; m: "wait" | "display" | "next" }> = ({ t, m }) => {
  const wall = useMemo(() => plasterTex("#e9dfd1", 12), []);
  const steel = useMemo(() => {
    const tx = brushedTex("#bdb7ae", 4);
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.repeat.set(4, 1); // 문짝이 커서 결을 촘촘하게
    return tx;
  }, []);
  const tile = useMemo(
    () =>
      canvasTex(512, 512, (g) => {
        g.fillStyle = "#d9d2c6";
        g.fillRect(0, 0, 512, 512);
        g.strokeStyle = "#c6bdaf";
        g.lineWidth = 3;
        for (let i = 0; i <= 512; i += 128) {
          g.beginPath();
          g.moveTo(i, 0);
          g.lineTo(i, 512);
          g.moveTo(0, i);
          g.lineTo(512, i);
          g.stroke();
        }
      }),
    [],
  );
  tile.wrapS = tile.wrapT = THREE.RepeatWrapping;
  tile.repeat.set(6, 6);
  const glow = m === "wait" ? interpolate(t, [0.15, 0.3], [0.4, 1], clamp) : 1;
  const ind = useMemo(
    () =>
      canvasTex(512, 256, (g) => {
        g.fillStyle = "#0d0d0f";
        g.fillRect(0, 0, 512, 256);
        g.fillStyle = "#ff8a1f";
        g.font = "bold 200px Arial";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText("F", 300, 140);
        g.beginPath();
        g.moveTo(120, 70);
        g.lineTo(170, 150);
        g.lineTo(70, 150);
        g.closePath();
        g.fill();
      }),
    [],
  );
  const cams: Record<"wait" | "display" | "next", [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3]> = {
    wait: [V(0.9, 2.3, 5.4), V(0.6, 2.4, 4.4), V(0, 1.45, 0), V(0, 1.65, 0)],
    display: [V(0.15, 2.5, 1.9), V(0.1, 2.5, 1.55), V(0, 2.25, 0), V(0, 2.28, 0)],
    next: [V(0.2, 2.35, 2.4), V(0.7, 1.7, 5.2), V(0, 2.1, 0), V(0, 1.65, 0)],
  };
  return (
    <>
      <Env />
      <Cam c={cams[m]} t={t} z={m === "display" ? 1.5 : 1.4} />
      <ambientLight intensity={0.35} />
      <spotLight position={[0, 4.2, 3]} angle={0.8} penumbra={0.9} intensity={18} color="#ffe6c8" castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-3, 3, 5]} intensity={0.6} color="#ffd8b0" />
      <mesh receiveShadow>
        <planeGeometry args={[14, 8]} />
        <meshStandardMaterial map={wall} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial map={tile} roughness={0.35} metalness={0.1} />
      </mesh>
      {/* 문틀과 문 두 짝 */}
      <mesh position={[0, 1.15, 0.03]} castShadow receiveShadow>
        <boxGeometry args={[2.1, 2.3, 0.06]} />
        <meshStandardMaterial map={steel} metalness={0.85} roughness={0.3} color="#cfc9c0" />
      </mesh>
      {[-0.46, 0.46].map((x) => (
        <mesh key={x} position={[x, 1.08, 0.07]} receiveShadow>
          <boxGeometry args={[0.9, 2.1, 0.03]} />
          <meshStandardMaterial map={steel} metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
      {/* 층 표시기 */}
      <mesh position={[0, 2.5, 0.06]}>
        <boxGeometry args={[0.7, 0.36, 0.05]} />
        <meshStandardMaterial color="#1a1a1c" metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.5, 0.09]}>
        <planeGeometry args={[0.62, 0.3]} />
        <meshBasicMaterial map={ind} toneMapped={false} color={new THREE.Color(glow, glow, glow)} />
      </mesh>
      <pointLight position={[0, 2.5, 0.4]} color="#ff9a3c" intensity={0.5 * glow} distance={1.5} />
      {/* 호출 버튼 */}
      <mesh position={[1.35, 1.1, 0.05]}>
        <boxGeometry args={[0.18, 0.36, 0.03]} />
        <meshStandardMaterial map={steel} metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[1.35, 1.17, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.02, 24]} />
        <meshStandardMaterial color="#fff2dd" emissive="#ffb347" emissiveIntensity={0.6} />
      </mesh>
      {/* 기다리는 사람들 (뒷모습) */}
      <Person p={[-0.75, 1.9]} coat="#3d4a63" />
      <Person p={[0.15, 2.4]} coat="#c9b38f" hair="#1d1714" h={0.95} />
      <Person p={[0.95, 1.7]} coat="#6f7d5c" hair="#3a2a20" h={1.03} />
    </>
  );
};

export const Scene3D: React.FC<{ spec: Spec3D; t: number }> = ({ spec, t }) => {
  if (spec.k === "panel") return <Panel3D mode={spec.m} t={t} />;
  const bg: Record<string, string> = { sign4: "#efe4d4", death: "#1a120c", hospital: "linear-gradient(#8ec8f2 0%, #cfe8fb 55%, #eef7fd 100%)", directory: "#ece8e1", lobby: "#e9dfd1" };
  return (
    <Stage bg={bg[spec.k]} exposure={spec.k === "death" ? 1.1 : 1}>
      {spec.k === "sign4" && <Sign4 t={t} m={spec.m} />}
      {spec.k === "death" && <Death t={t} m={spec.m} />}
      {spec.k === "hospital" && <Hospital t={t} />}
      {spec.k === "directory" && <Directory t={t} />}
      {spec.k === "lobby" && <Lobby t={t} m={spec.m} />}
    </Stage>
  );
};

// 미리보기: 장면별 1초
import { useCurrentFrame } from "remotion";
const TESTS: Spec3D[] = [
  { k: "sign4", m: "in" },
  { k: "death", m: "soft" },
  { k: "death", m: "snap" },
  { k: "hospital" },
  { k: "directory" },
  { k: "lobby", m: "wait" },
  { k: "lobby", m: "display" },
  { k: "lobby", m: "next" },
];
export const SCENES_TEST_FRAMES = 30 * TESTS.length;
export const ScenesTest: React.FC = () => {
  const f = useCurrentFrame();
  const i = Math.min(TESTS.length - 1, Math.floor(f / 30));
  return <Scene3D spec={TESTS[i]} t={(f % 30) / 29} />;
};
