// 미니어처 모형 세상 공용 부품 (EP02에서 다듬은 것, EP03부터 공용)
//  - 둥근 모서리 상자, 디오라마 판, 떠 있는 판(말풍선·?), 세로 글씨 무늬
//  - 컷마다 2~3점 카메라 경로 + 망원(24°) 보정
//  - 화면 틀: 하늘 그라데이션, 채도·대비 올림, 틸트시프트(위아래 흐림), 가장자리 어둡게
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { AbsoluteFill, Easing, useVideoConfig } from "remotion";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { canvasTex } from "./kit";

export const CJK = '"WenQuanYi Zen Hei", Arial';
export const PEN_KO = '"Nanum Pen", "WenQuanYi Zen Hei"';
export const BRUSH_HANJA = '"LXGW WenKai TC", "WenQuanYi Zen Hei"';

// ---------- 카메라 ----------
export type Key = { p: THREE.Vector3; t: THREE.Vector3 };
export const K = (px: number, py: number, pz: number, tx: number, ty: number, tz: number): Key => ({ p: new THREE.Vector3(px, py, pz), t: new THREE.Vector3(tx, ty, tz) });
export const FOV = 24;
const TELE = Math.tan((34 / 2) * (Math.PI / 180)) / Math.tan((FOV / 2) * (Math.PI / 180));

/** 컷(mode)마다 자기 경로를 따라 움직이는 카메라. 경로 좌표는 34° 화각 기준으로 적고, 24° 망원으로 뒤로 물려 같은 크기로 보이게 한다. */
export function Rig<M extends string>({ paths, mode, t }: { paths: Record<M, Key[]>; mode: M; t: number }) {
  const { camera } = useThree();
  const curves = useMemo(() => {
    const out = {} as Record<string, [THREE.CatmullRomCurve3, THREE.CatmullRomCurve3]>;
    (Object.keys(paths) as M[]).forEach((m) => {
      const ks = paths[m];
      out[m] = [new THREE.CatmullRomCurve3(ks.map((x) => x.p), false, "centripetal"), new THREE.CatmullRomCurve3(ks.map((x) => x.t), false, "centripetal")];
    });
    return out;
  }, [paths]);
  const u = Easing.inOut(Easing.cubic)(Math.min(1, Math.max(0, t)));
  const tgt = curves[mode][1].getPoint(u);
  const pos = curves[mode][0].getPoint(u).sub(tgt).multiplyScalar(TELE).add(tgt);
  camera.position.copy(pos);
  camera.lookAt(tgt);
  return null;
}

// ---------- 모양 ----------
// 깜빡임 방지 규칙: 면 위에 붙이는 판(글씨·창문·현수막)은 면에서 최소 1.5cm 띄운다. 망원 카메라는 깊이 구분이 약하다 (EP02 창구, EP03 일력에서 깜빡였음)
export const Box: React.FC<{ p: [number, number, number]; s: [number, number, number]; c: string; e?: string; ei?: number; shadow?: boolean; r?: [number, number, number]; map?: THREE.Texture; opacity?: number }> = ({ p, s, c, e, ei = 0.4, shadow = true, r, map, opacity = 1 }) => {
  const geo = useMemo(() => new RoundedBoxGeometry(s[0], s[1], s[2], 2, Math.min(0.03, Math.min(...s) * 0.3)), [s[0], s[1], s[2]]);
  return (
    <mesh position={p} rotation={r} castShadow={shadow} receiveShadow geometry={geo}>
      <meshStandardMaterial color={c} map={map} emissive={e ?? "#000000"} emissiveIntensity={e ? ei : 0} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
};

/** 디오라마 판: 장소마다 하나 */
export const Slab: React.FC<{ c: [number, number]; size: [number, number]; top: string; side?: string; map?: THREE.Texture }> = ({ c, size, top, side = "#8c7a64", map }) => (
  <group position={[c[0], 0, c[1]]}>
    <Box p={[0, -0.15, 0]} s={[size[0] + 0.2, 0.3, size[1] + 0.2]} c={side} />
    <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color={top} map={map} />
    </mesh>
  </group>
);

/** 화면을 향해 떠 있는 판 (말풍선, ?, 꼬리표) */
export const Sprite: React.FC<{ tex: THREE.Texture; s: number; pos: [number, number, number]; size: [number, number]; ry?: number; rz?: number }> = ({ tex, s, pos, size, ry = 0, rz = 0 }) =>
  s < 0.01 ? null : (
    <mesh position={pos} scale={0.7 + 0.3 * s} rotation={[0, ry, rz]}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={tex} transparent opacity={Math.min(1, s)} depthTest={false} toneMapped={false} />
    </mesh>
  );

// ---------- 무늬 ----------
export const qTex = () =>
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

export const glyphTex = (text: string, o: { bg: string; fg: string; size?: number; font?: string; w?: number; h?: number }) =>
  canvasTex(o.w ?? 256, o.h ?? 256, (g) => {
    const W = o.w ?? 256;
    const H = o.h ?? 256;
    g.fillStyle = o.bg;
    g.fillRect(0, 0, W, H);
    g.fillStyle = o.fg;
    g.font = `bold ${o.size ?? 180}px ${o.font ?? CJK}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, W / 2, H / 2 + (o.size ?? 180) * 0.06);
  });

// ---------- 조명 ----------
/** 높은 해 + 약한 하늘빛 (탁자 위 모형 조명). dusk 0~1 이면 해 질 녘 색으로 */
export const MiniLights: React.FC<{ dusk?: number; dim?: number }> = ({ dusk = 0, dim = 0 }) => {
  const sun = 3.1 * (1 - 0.6 * dim);
  return (
    <>
      <hemisphereLight args={[new THREE.Color("#bcd4ea").lerp(new THREE.Color("#e3a27a"), dusk).lerp(new THREE.Color("#5a4a72"), dim), "#8a7a64", 0.85 * (1 - 0.45 * dim)]} />
      <directionalLight position={[9, 21 - 9 * dusk, 10]} intensity={sun} color={new THREE.Color("#fff4e2").lerp(new THREE.Color("#ffb06a"), dusk)} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} shadow-camera-far={120} />
      <directionalLight position={[3, 5, 14]} intensity={0.55 * (1 - 0.5 * dim)} color="#ffeedd" />
      <ambientLight intensity={0.15} />
    </>
  );
};

// ---------- 화면 틀 ----------
export const SKY = {
  day: "linear-gradient(#8fc3ec 0%, #c4e2f6 45%, #eef6fb 80%)",
  dusk: "linear-gradient(#f2a46b 0%, #f7c58d 45%, #fbe3c0 85%)",
  night: "linear-gradient(#2b1d3a 0%, #5a3150 45%, #c46a4e 85%)",
};

/** 하늘 + 3D + 틸트시프트. sky2/mix 로 두 하늘을 섞는다 */
export const MiniFrame: React.FC<{ sky: string; sky2?: string; mix?: number; filter?: string; children: React.ReactNode }> = ({ sky, sky2, mix = 0, filter = "", children }) => {
  const { width, height } = useVideoConfig();
  const band = (side: "top" | "bottom"): React.CSSProperties => ({
    position: "absolute",
    left: 0,
    right: 0,
    [side]: 0,
    height: side === "top" ? "30%" : "36%",
    backdropFilter: "blur(7px)",
    WebkitBackdropFilter: "blur(7px)",
    maskImage: `linear-gradient(to ${side === "top" ? "bottom" : "top"}, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0) 100%)`,
    WebkitMaskImage: `linear-gradient(to ${side === "top" ? "bottom" : "top"}, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0) 100%)`,
  });
  return (
    <AbsoluteFill style={{ background: sky }}>
      {sky2 && mix > 0 && <AbsoluteFill style={{ background: sky2, opacity: mix }} />}
      <AbsoluteFill style={{ filter: `saturate(1.18) contrast(1.1) ${filter}` }}>
        <ThreeCanvas width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }} camera={{ fov: FOV, near: 0.2, far: 300 }} gl={{ antialias: true, logarithmicDepthBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}>
          {children}
        </ThreeCanvas>
      </AbsoluteFill>
      <div style={band("top")} />
      <div style={band("bottom")} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 55%, rgba(20,10,20,0.28) 100%)" }} />
    </AbsoluteFill>
  );
};
