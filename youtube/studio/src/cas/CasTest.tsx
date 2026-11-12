// 화풍 시험: "3D 세계 위 2D 캐릭터" (claude-animated-shorts 방식 참고, 캐릭터·장면은 우리 것)
// EP04 문장 6: "In Korean, the word for wind also means cheating. So feed your partner wings, and they might fly off with someone else."
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadNotoSans } from "@remotion/google-fonts/NotoSansKR";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { canvasTexture, drawBaram, drawBasket, drawChar, drawWing, handUV, HIM, GUY2, INK, Look, ME, Pose, RIVAL } from "./toonkr";
import { PEN_KO } from "../three/mini";

const { fontFamily: sans } = loadNotoSans();
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const YELLOW = "#ffd400";
type V3 = [number, number, number];
const sstep = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * t * (t * (t * 6 - 15) + 10); };
const seg = (f: number, a: number, b: number) => sstep((f - a) / (b - a));
const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const bez = (a: V3, b: V3, c: V3, t: number): V3 => lerp3(lerp3(a, b, t), lerp3(b, c, t), t);

// ---------- 잉크 외곽선 (뒷면을 법선 방향으로 부풀린 검은 껍질) ----------
const inkCache = new Map<number, THREE.Material>();
const inkMat = (th: number) => {
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

const InkBox: React.FC<{ p: V3; s: V3; c: string; map?: THREE.Texture; r?: V3; th?: number; e?: string; round?: number }> = ({ p, s, c, map, r, th = 0.012, e, round = 0.02 }) => {
  const geo = useMemo(() => new RoundedBoxGeometry(s[0], s[1], s[2], 3, Math.min(round, Math.min(...s) * 0.45)), [s[0], s[1], s[2], round]);
  return (
    <group position={p} rotation={r}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color={c} map={map} roughness={0.85} emissive={e ?? "#000"} emissiveIntensity={e ? 1 : 0} />
      </mesh>
      <mesh geometry={geo} material={inkMat(th)} />
    </group>
  );
};

const InkCyl: React.FC<{ p: V3; r: number; r2?: number; h: number; c: string; th?: number; e?: string }> = ({ p, r, r2, h, c, th = 0.01, e }) => {
  const geo = useMemo(() => new THREE.CylinderGeometry(r, r2 ?? r, h, 32), [r, r2, h]);
  return (
    <group position={p}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color={c} roughness={0.7} emissive={e ?? "#000"} emissiveIntensity={e ? 1 : 0} />
      </mesh>
      <mesh geometry={geo} material={inkMat(th)} />
    </group>
  );
};

// ---------- 손으로 칠한 질감 ----------
const rng = (s: number) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
const painted = (w: number, h: number, base: string, draw?: (g: CanvasRenderingContext2D, r: () => number) => void, seed = 3) =>
  canvasTexture(w, h, (g) => {
    const r = rng(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    // 붓 자국 얼룩
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

const glowTex = () =>
  canvasTexture(256, 256, (g) => {
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, "rgba(255,210,140,0.9)");
    gr.addColorStop(0.35, "rgba(255,170,90,0.35)");
    gr.addColorStop(1, "rgba(255,150,80,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 256);
  });

// ---------- 카메라 ----------
type CK = { f: number; p: V3; t: V3 };
const CAMS: CK[] = [
  { f: 0, p: [-0.3, 1.6, 5.2], t: [-0.5, 0.9, -0.6] },
  { f: 84, p: [-0.2, 1.5, 4.7], t: [-0.4, 0.9, -0.5] }, // 천천히 다가감
  { f: 108, p: [0, 1.28, 3.9], t: [0, 0.8, 0] }, // 둘이 마주 앉은 식탁으로
  { f: 138, p: [0, 1.25, 3.7], t: [0, 0.8, 0] },
  { f: 158, p: [0.32, 1.22, 3.05], t: [0.42, 0.95, 0] }, // 날개 돋는 남자
  { f: 176, p: [0.34, 1.24, 2.95], t: [0.42, 0.98, 0] },
  { f: 204, p: [0.2, 1.45, 4.2], t: [-0.4, 1.12, -0.9] }, // 창문 쪽으로 따라감
  { f: 246, p: [0.05, 1.55, 4.5], t: [-0.75, 1.22, -1.6] },
];
const camAt = (f: number): { p: V3; t: V3 } => {
  let i = 0;
  while (i < CAMS.length - 2 && f > CAMS[i + 1].f) i++;
  const a = CAMS[i], b = CAMS[i + 1];
  const u = seg(f, a.f, b.f);
  return { p: lerp3(a.p, b.p, u), t: lerp3(a.t, b.t, u) };
};
const CamSet: React.FC<{ p: V3; t: V3 }> = ({ p, t }) => {
  const { camera } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  if (cam.fov !== 38) { cam.fov = 38; cam.updateProjectionMatrix(); }
  cam.position.set(...p);
  cam.lookAt(...t);
  return null;
};

// ---------- 카드 (카메라를 향해 세운 판) ----------
const Card: React.FC<{ tex: THREE.Texture; at: V3; w: number; h: number; cam: V3; scale?: number; sx?: number; rotZ?: number; flipX?: boolean; tint?: string }> = ({ tex, at, w, h, cam, scale = 1, sx = 1, rotZ = 0, flipX, tint = "#fff4e8" }) => {
  if (scale < 0.01) return null;
  const yaw = Math.atan2(cam[0] - at[0], cam[2] - at[2]);
  return (
    <group position={at} rotation={[0, yaw, 0]}>
      <mesh rotation={[0, 0, rotZ]} scale={[(flipX ? -1 : 1) * scale * Math.max(0.02, sx), scale, 1]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} transparent alphaTest={0.4} color={tint} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const H = 1.0; // 캐릭터 카드 높이
const Person: React.FC<{ look: Look; pose: Pose; feet: V3; cam: V3; flipX?: boolean }> = ({ look, pose, feet, cam, flipX }) => {
  const key = JSON.stringify(pose);
  const tex = useMemo(() => canvasTexture(600, 1000, (g) => drawChar(g, look, pose)), [look, key]);
  return <Card tex={tex} at={[feet[0], feet[1] + H / 2, feet[2]]} w={0.6 * H} h={H} cam={cam} flipX={flipX} />;
};
/** 카드 위 손 위치 → 세계 좌표 (카메라를 거의 정면으로 보므로 x·y만 옮김) */
const handAt = (pose: Pose, side: 1 | -1, feet: V3, flipX = false): V3 => {
  const [u, v] = handUV(pose, side);
  const uu = flipX ? 1 - u : u;
  return [feet[0] + (uu - 0.5) * 0.6 * H, feet[1] + (1 - v) * H, feet[2] + 0.03];
};

/** 동그란 스테인리스 의자: 얇은 다리 셋 + 방석 */
const Stool: React.FC<{ x: number; z: number }> = ({ x, z }) => (
  <group>
    <InkCyl p={[x, 0.33, z]} r={0.15} h={0.05} c="#c23b3b" th={0.008} />
    {[0, 2.1, 4.2].map((a) => <InkCyl key={a} p={[x + Math.cos(a) * 0.1, 0.155, z + Math.sin(a) * 0.1]} r={0.014} h={0.31} c="#b9bec6" th={0.006} />)}
  </group>
);

// ---------- 장면 ----------
const SEAT = 0.2; // 의자에 앉은 카드 바닥 높이
const TOP = 0.5; // 식탁 윗면
const HER: V3 = [-0.55, SEAT, 0];
const HE0: V3 = [0.55, SEAT, 0];
const RV0: V3 = [-1.82, SEAT, -1.45];
const G2: V3 = [-1.08, SEAT, -1.45];
const WIN: V3 = [-1.3, 1.5, -2.38];

const Shop: React.FC<{ f: number }> = ({ f }) => {
  const cam = camAt(f);
  const C = cam.p;
  const tex = useMemo(() => {
    const floor = painted(1024, 1024, "#b07a4a", (g) => {
      g.strokeStyle = "rgba(60,30,15,0.55)";
      g.lineWidth = 5;
      for (let y = 0; y <= 1024; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
      for (let y = 0; y < 1024; y += 128) for (let x = ((y / 128) % 2) * 170; x < 1024; x += 340) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 128); g.stroke(); }
    }, 5);
    floor.wrapS = floor.wrapT = THREE.RepeatWrapping;
    floor.repeat.set(3, 3);
    const wall = painted(1024, 512, "#f1dfbf", undefined, 9);
    const wood = painted(1024, 256, "#8a5232", (g) => {
      g.strokeStyle = "rgba(40,20,10,0.5)";
      g.lineWidth = 4;
      for (let x = 0; x < 1024; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
    }, 11);
    const night = canvasTexture(512, 400, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 400);
      gr.addColorStop(0, "#1b2350"); gr.addColorStop(1, "#45467e");
      g.fillStyle = gr; g.fillRect(0, 0, 512, 400);
      const r = rng(4);
      [[0, 150, 130], [120, 90, 110], [235, 170, 140], [370, 110, 142]].forEach(([x, top, w]) => {
        g.fillStyle = "#14183a"; g.fillRect(x, top, w, 400 - top);
        for (let k = 0; k < 14; k++) { g.fillStyle = r() > 0.4 ? "#ffd58a" : "#2a3060"; g.fillRect(x + 10 + (k % 4) * 28, top + 16 + Math.floor(k / 4) * 40, 16, 22); }
      });
      g.fillStyle = "#ffb04a"; g.beginPath(); g.arc(440, 60, 14, 0, 7); g.fill();
    });
    const sign = canvasTexture(512, 200, (g) => {
      g.clearRect(0, 0, 512, 200);
      g.font = `bold 150px ${PEN_KO}`;
      g.textAlign = "center"; g.textBaseline = "middle";
      g.shadowColor = "#ff7a2a"; g.shadowBlur = 30;
      g.fillStyle = "#ffe0a0"; g.fillText("치킨", 256, 105);
    });
    const menu = canvasTexture(512, 384, (g) => {
      g.fillStyle = "#2f3a33"; g.fillRect(0, 0, 512, 384);
      g.strokeStyle = "#c9a76a"; g.lineWidth = 14; g.strokeRect(7, 7, 498, 370);
      g.fillStyle = "#fff6dc"; g.textBaseline = "middle";
      g.font = `64px ${PEN_KO}`; g.textAlign = "center"; g.fillText("메뉴", 256, 60);
      g.font = `50px ${PEN_KO}`;
      [["후라이드", "18,000"], ["양념", "19,000"], ["반반", "19,000"], ["치맥 세트", "23,000"]].forEach(([a, b], k) => {
        g.textAlign = "left"; g.fillText(a, 44, 136 + k * 62); g.textAlign = "right"; g.fillText(b, 470, 136 + k * 62);
      });
    });
    const basket = canvasTexture(600, 400, drawBasket);
    const wing = canvasTexture(400, 300, (g) => drawWing(g));
    const wind = canvasTexture(600, 600, (g) => drawBaram(g, "wind", PEN_KO));
    const heart = canvasTexture(600, 600, (g) => drawBaram(g, "heart", PEN_KO));
    return { floor, wall, wood, night, sign, menu, basket, wing, wind, heart, glow: glowTex() };
  }, []);

  // --- 동작 ---
  const reach = seg(f, 95, 122) - seg(f, 128, 140); // 여자 팔 뻗기
  const sprout = interpolate(f, [141, 156], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
  const rise = seg(f, 162, 240);
  const rRise = seg(f, 172, 240);
  const he = rise > 0 ? bez(HE0, [0.25, 1.5, -0.7], [WIN[0] + 0.15, 1.05, -2.2], rise) : HE0;
  const rv = rRise > 0 ? bez(RV0, [-2.0, 1.2, -1.7], [WIN[0] - 0.2, 1.0, -2.2], rRise) : RV0;
  const blink = (k: number) => (f + k * 37) % 70 < 4;
  const herPose: Pose = {
    legs: "sit", armL: 14, armR: 30 + 58 * reach, look: f > 196 ? -0.8 : 0.7,
    mouth: f > 196 ? "open" : f > 165 ? "o" : "smile", brow: f > 165 ? 1 : 0, blink: f < 165 && blink(0),
  };
  const hisPose: Pose = {
    legs: rise > 0.02 ? "fly" : "sit", armL: f > 122 && f < 141 ? 60 : 30, armR: rise > 0.02 ? 120 : 14, look: rise > 0.02 ? -0.7 : -0.7,
    mouth: f > 141 ? "smug" : f > 122 ? "grin" : "smile", wings: sprout, flap: f * 0.9, blink: f < 140 && blink(1),
  };
  const rivPose: Pose = { legs: rRise > 0.02 ? "fly" : "sit", armL: rRise > 0.02 ? 120 : 20, armR: 20, look: 0.8, mouth: f > 150 ? "smug" : "smile", wings: interpolate(f, [150, 166], [0, 1], clamp), flap: f * 0.9 + 1, blink: blink(2) };
  const g2Pose: Pose = { legs: "sit", armL: 30, armR: 14, look: -0.8, mouth: f > 196 ? "open" : "smile", brow: f > 196 ? 1 : 0, blink: blink(3) };

  // 날개 하나: 여자 손 → 남자 손 → (사라지고) 남자 등에 날개
  const herHand = handAt(herPose, 1, HER);
  const hisHand = handAt(hisPose, -1, HE0, true);
  const pass = seg(f, 116, 128);
  const wingAt: V3 | null = f < 95 || f >= 143 ? null : f < 116 ? herHand : f < 128 ? [herHand[0] + (hisHand[0] - herHand[0]) * pass, herHand[1] + (hisHand[1] - herHand[1]) * pass + 0.12 * Math.sin(pass * Math.PI), herHand[2]] : hisHand;

  // 바람 카드: 'wind'에서 등장, 'cheating'에서 뒤집힘
  const bIn = interpolate(f, [26, 36], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) }) * interpolate(f, [86, 94], [1, 0], clamp);
  const flip = interpolate(f, [56, 66], [0, 1], clamp);
  const bSide = flip < 0.5 ? tex.wind : tex.heart;
  const bScaleX = Math.abs(Math.cos(flip * Math.PI));

  return (
    <>
      <CamSet p={cam.p} t={cam.t} />
      {/* 빛: 파란 밤 그림자 + 따뜻한 전등 */}
      <hemisphereLight args={["#7d8fd0", "#5a3a2a", 0.75]} />
      <ambientLight intensity={0.18} color="#8090d0" />
      <pointLight position={[0, 1.85, 0.1]} intensity={5.5} distance={7} decay={1.3} color="#ffb870" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.002} />
      <pointLight position={[-1.65, 1.85, -1.35]} intensity={3.2} distance={5} decay={1.3} color="#ffb870" />
      <directionalLight position={[1.5, 3, 4]} intensity={0.45} color="#ffe6cc" />
      {/* 바닥·벽 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9, 7]} />
        <meshStandardMaterial map={tex.floor} roughness={0.9} />
      </mesh>
      <InkBox p={[0, 2.2, -2.5]} s={[9, 4.4, 0.2]} c="#ffffff" map={tex.wall} round={0.005} />
      <InkBox p={[0, 0.45, -2.37]} s={[9, 0.9, 0.06]} c="#ffffff" map={tex.wood} round={0.01} />
      <InkBox p={[0, 0.92, -2.33]} s={[9, 0.06, 0.1]} c="#5e3420" />
      <InkBox p={[-3.3, 2.2, 0]} s={[0.2, 4.4, 6]} c="#e9d3ae" map={tex.wall} round={0.005} />
      {/* 창문: 밤거리 */}
      <InkBox p={[WIN[0], WIN[1], -2.42]} s={[1.5, 1.15, 0.08]} c="#6b4430" />
      <mesh position={[WIN[0], WIN[1], -2.37]}>
        <planeGeometry args={[1.32, 0.98]} />
        <meshBasicMaterial map={tex.night} toneMapped={false} />
      </mesh>
      <InkBox p={[WIN[0], WIN[1], -2.36]} s={[0.05, 1.0, 0.03]} c="#6b4430" />
      {/* 네온 간판, 메뉴판 */}
      <mesh position={[0.95, 1.72, -2.38]}>
        <planeGeometry args={[0.95, 0.37]} />
        <meshBasicMaterial map={tex.sign} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0.95, 1.72, -2.37]}>
        <planeGeometry args={[1.8, 1.0]} />
        <meshBasicMaterial map={tex.glow} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.55} toneMapped={false} />
      </mesh>
      <InkBox p={[2.35, 1.45, -2.36]} s={[1.2, 0.9, 0.04]} c="#ffffff" map={tex.menu} round={0.01} />
      {/* 전등 */}
      {[[0, 0.1], [-1.65, -1.35]].map(([x, z], k) => (
        <group key={k}>
          <mesh position={[x, 2.6, z]}><cylinderGeometry args={[0.006, 0.006, 0.8, 6]} /><meshBasicMaterial color={INK} /></mesh>
          <InkCyl p={[x, 2.12, z]} r={0.05} r2={0.22} h={0.16} c="#2f5a4a" />
          <mesh position={[x, 2.02, z]}><sphereGeometry args={[0.06, 16, 12]} /><meshBasicMaterial color="#fff2c8" toneMapped={false} /></mesh>
          <Card tex={tex.glow} at={[x, 2.0, z + 0.05]} w={0.9} h={0.9} cam={C} tint="#ffffff" />
        </group>
      ))}
      {/* 뒤 손님 식탁 */}
      <group>
        <InkBox p={[-1.45, TOP - 0.025, -1.45]} s={[0.55, 0.05, 0.62]} c="#c98f5a" />
        <InkBox p={[-1.45, TOP / 2, -1.45]} s={[0.12, TOP, 0.12]} c="#6a4a32" />
        <Card tex={tex.basket} at={[-1.45, TOP + 0.1, -1.45]} w={0.33} h={0.22} cam={C} />
        {[RV0, G2].map((s, k) => <Stool key={k} x={s[0]} z={s[2] - 0.1} />)}
      </group>
      {/* 우리 식탁 */}
      <InkBox p={[0, TOP - 0.025, 0]} s={[0.66, 0.05, 0.72]} c="#d39a62" />
      <InkBox p={[0, (TOP - 0.07) / 2, 0]} s={[0.14, TOP - 0.07, 0.14]} c="#6a4a32" />
      <InkCyl p={[0, 0.02, 0]} r={0.26} h={0.04} c="#6a4a32" />
      {[HER, HE0].map((s, k) => (k === 1 && f > 162 ? <Stool key={k} x={s[0]} z={s[2]} /> : <Stool key={k} x={s[0]} z={s[2] - 0.1} />))}
      {[-0.19, 0.19].map((x) => <InkCyl key={x} p={[x, TOP + 0.01, 0.2]} r={0.11} r2={0.09} h={0.02} c="#ffffff" th={0.006} />)}
      {[-0.24, 0.24].map((x) => (
        <group key={x}>
          <InkCyl p={[x, TOP + 0.08, -0.18]} r={0.045} h={0.16} c="#f2b13a" th={0.006} />
          <InkCyl p={[x, TOP + 0.17, -0.18]} r={0.047} h={0.03} c="#fffaf0" th={0.006} />
        </group>
      ))}
      <Card tex={tex.basket} at={[0, TOP + 0.12, -0.05]} w={0.42} h={0.28} cam={C} />
      {/* 사람 */}
      <Person look={RIVAL} pose={rivPose} feet={rv} cam={C} />
      <Person look={GUY2} pose={g2Pose} feet={G2} cam={C} flipX />
      <Person look={ME} pose={herPose} feet={HER} cam={C} />
      <Person look={HIM} pose={hisPose} feet={he} cam={C} flipX />
      {wingAt && <Card tex={tex.wing} at={[wingAt[0], wingAt[1] + 0.04, wingAt[2] + 0.02]} w={0.32} h={0.24} cam={C} rotZ={-0.3 + 0.6 * pass} />}
      {/* 바람 카드 */}
      <Card tex={bSide} at={[0, 1.38, 0.1]} w={0.52} h={0.52} cam={C} scale={bIn} sx={bScaleX} />
    </>
  );
};

const CAPS: { from: number; to: number; words: { t: string; hl?: boolean }[] }[] = [
  { from: 6, to: 26, words: [{ t: "In Korean," }] },
  { from: 26, to: 58, words: [{ t: "the word for" }, { t: "wind", hl: true }] },
  { from: 58, to: 92, words: [{ t: "also means" }, { t: "cheating.", hl: true }] },
  { from: 92, to: 142, words: [{ t: "So feed your partner" }, { t: "wings,", hl: true }] },
  { from: 142, to: 180, words: [{ t: "and they might" }, { t: "fly off", hl: true }] },
  { from: 180, to: 246, words: [{ t: "with someone else." }] },
];

const Caption: React.FC<{ words: { t: string; hl?: boolean }[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1500, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 22px", transform: `scale(${0.85 + 0.15 * pop})` }}>
      {words.map((x, i) => (
        <span key={i} style={{ fontFamily: sans, fontWeight: 900, fontSize: 88, lineHeight: 1.15, textAlign: "center", color: x.hl ? YELLOW : "#fff", WebkitTextStroke: "14px #000", paintOrder: "stroke fill", textShadow: "0 6px 18px rgba(0,0,0,0.55)" }}>
          {x.t}
        </span>
      ))}
    </div>
  );
};

export const CAS_TEST_FRAMES = 246;
export const CasTest: React.FC<{ still?: number }> = ({ still }) => {
  const f0 = useCurrentFrame();
  const f = still ?? f0;
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#1b2350" }}>
      <AbsoluteFill style={{ filter: "saturate(1.12) contrast(1.05)" }}>
        <ThreeCanvas width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }} camera={{ fov: 38, near: 0.05, far: 60 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}>
          <Shop f={f} />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(10,8,30,0.45) 100%)" }} />
      {CAPS.map((c, i) => (
        <Sequence key={i} from={c.from} durationInFrames={c.to - c.from} layout="none">
          <Caption words={c.words} />
        </Sequence>
      ))}
      <Sequence from={6} layout="none">
        <Audio src={staticFile("ep04/vo_en/s6.wav")} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const CasTestCheck: React.FC = () => {
  const f = useCurrentFrame();
  const pick = [10, 40, 75, 110, 130, 150, 175, 200, 225, 245];
  return <CasTest still={pick[f % pick.length]} />;
};
