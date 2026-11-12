// EP04 새 화풍: 3D 세계(잉크 외곽선, 칠한 질감) + 2D 캐릭터·소품 카드
//  세트 3곳: 서울 쇼핑 거리(낮) → 치킨집(밤) → 덕수궁 돌담길(가을 해 질 녘)
//  컷(mode)과 t(0..1)는 ep04/Scene04 와 같다. 장면 박자는 영어 자막 글자 수 비율로 맞춤.
import { AbsoluteFill, Easing, interpolate, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import * as THREE from "three";
import type { Mode04, Words04 } from "../ep04/Scene04";
import { PEN_KO } from "../three/mini";
import { drawBubble, drawCoin, drawCrack, drawGift, drawGinkgo, drawHanok, drawHeart, drawLeaf, drawNumCard, drawPaper, drawQ, drawRain, drawSneakers, drawStamp } from "./cards";
import { Blob, bez, CamSet, camAt, Card, CK, glowTex, InkBall, InkBox, InkCyl, painted, Person, popIn, rng, seg, Stool, V3, handAt } from "./kit";
import { canvasTexture, drawBaram, drawBasket, drawWing, GUY2, HIM, Look, ME, Pose, RIVAL } from "./toonkr";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SANS = '"Noto Sans KR", Arial, sans-serif';
const ME_NEW: Look = { ...ME, shoes: "#ffffff" };
const FOLK: Look[] = [
  { skin: "#f2cfae", hair: "long", hairC: "#2a1e1a", top: "#7b5ac9", bottom: "#33364a", shoes: "#f4efe6" },
  { skin: "#e9c39f", hair: "short", hairC: "#231c1c", top: "#d98a2b", bottom: "#3b3f52", shoes: "#2b2b30" },
  { skin: "#f4d3b6", hair: "bob", hairC: "#4a2f22", top: "#3f9a7a", bottom: "#2d2d3a", shoes: "#c23b5a" },
  { skin: "#e6be98", hair: "short", hairC: "#1e1a1c", top: "#9a3b4a", bottom: "#38363f", shoes: "#f4efe6", glasses: true },
];

// ---------- 공용 소품 텍스처 ----------
const useProps = (lang: "en" | "es") =>
  useMemo(() => {
    const wingIcon = (g: CanvasRenderingContext2D) => { const c = document.createElement("canvas"); c.width = 400; c.height = 300; drawWing(c.getContext("2d")!); g.drawImage(c, 0, 20, 300, 225); };
    const shoeIcon = (g: CanvasRenderingContext2D) => { const c = document.createElement("canvas"); c.width = 400; c.height = 260; drawSneakers(c.getContext("2d")!); g.drawImage(c, 0, 40, 300, 195); };
    const wallIcon = (g: CanvasRenderingContext2D) => {
      g.fillStyle = "#b9ae9c"; g.strokeStyle = "#2b1a22"; g.lineWidth = 10;
      g.fillRect(10, 110, 280, 130); g.strokeRect(10, 110, 280, 130);
      g.fillStyle = "#3b3e44"; g.beginPath(); g.moveTo(0, 115); g.lineTo(150, 60); g.lineTo(300, 115); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = "rgba(43,26,34,0.5)"; g.lineWidth = 6;
      for (let y = 150; y < 240; y += 40) { g.beginPath(); g.moveTo(14, y); g.lineTo(286, y); g.stroke(); }
    };
    const qIcon = (g: CanvasRenderingContext2D) => { g.font = "900 230px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 18; g.strokeStyle = "#2b1a22"; g.strokeText("?", 150, 150); g.fillStyle = "#ffd23a"; g.fillText("?", 150, 150); };
    const T = (w: number, h: number, d: (g: CanvasRenderingContext2D) => void) => canvasTexture(w, h, d);
    return {
      n1: T(420, 520, (g) => drawNumCard(g, 1, shoeIcon, SANS)),
      n2: T(420, 520, (g) => drawNumCard(g, 2, wingIcon, SANS)),
      n3q: T(420, 520, (g) => drawNumCard(g, 3, qIcon, SANS)),
      n3: T(420, 520, (g) => drawNumCard(g, 3, wallIcon, SANS)),
      shoes: T(400, 260, drawSneakers),
      giftC: T(400, 400, (g) => drawGift(g, 0)),
      giftO: T(400, 400, (g) => drawGift(g, 1)),
      coin: T(300, 300, (g) => drawCoin(g, SANS)),
      stamp: T(400, 400, (g) => drawStamp(g, SANS, lang === "es" ? "VENDIDO" : "SOLD")),
      q: T(300, 360, (g) => drawQ(g, SANS)),
      rain: [0, 1, 2, 3].map((k) => T(400, 300, (g) => drawRain(g, k / 4))),
      haha: T(500, 300, (g) => drawBubble(g, lang === "es" ? "JAJA" : "HAHA", SANS)),
      story: T(500, 300, (g) => drawBubble(g, "!?", SANS, "#2b1a22")),
      heart: T(300, 280, drawHeart),
      crack: T(200, 700, drawCrack),
      paper: T(300, 380, (g) => drawPaper(g, SANS, lang === "es" ? "DIVORCIO" : "DIVORCE")),
      leaf: T(120, 120, drawLeaf),
      wing: T(400, 300, (g) => drawWing(g)),
      basket: T(600, 400, drawBasket),
      wind: T(600, 600, (g) => drawBaram(g, "wind", PEN_KO)),
      heartB: T(600, 600, (g) => drawBaram(g, "heart", PEN_KO)),
      glow: glowTex(),
    };
  }, [lang]);
type Props = ReturnType<typeof useProps>;

const signTex = (s: string, bg: string, fg = "#ffffff", w = 512, h = 160, font = PEN_KO, size = 110) =>
  canvasTexture(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#2b1a22"; g.lineWidth = 12; g.strokeRect(6, 6, w - 12, h - 12);
    g.font = `bold ${size}px ${font}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = fg; g.fillText(s, w / 2, h / 2 + 6);
  });

// =====================================================================
// 1. 서울 쇼핑 거리 (intro, shoes, walk, away, coin)
// =====================================================================
const STREET_CAM: Record<string, CK[]> = {
  intro: [{ u: 0, p: [0, 1.15, 3.2], t: [0, 0.92, 0.6] }, { u: 1, p: [0, 1.12, 2.95], t: [0, 0.9, 0.6] }],
  shoes: [{ u: 0, p: [0.05, 1.02, 3.0], t: [0, 0.75, 0.6] }, { u: 1, p: [0.05, 1.0, 2.8], t: [0, 0.74, 0.6] }],
  walk: [{ u: 0, p: [0.2, 0.42, 2.0], t: [0.2, 0.18, 0.7] }, { u: 1, p: [1.1, 0.48, 2.2], t: [1.2, 0.22, 0.4] }],
  away: [{ u: 0, p: [0.1, 1.2, 3.9], t: [0.1, 0.68, 0.5] }, { u: 0.6, p: [-0.15, 1.2, 4.0], t: [-0.15, 0.68, 0.5] }, { u: 1, p: [0.3, 1.12, 3.1], t: [0.35, 0.75, 0.5] }],
  coin: [{ u: 0, p: [0, 1.1, 3.15], t: [0, 0.8, 0.6] }, { u: 1, p: [0, 1.08, 2.9], t: [0, 0.8, 0.6] }],
};

const Street: React.FC<{ mode: Mode04; t: number; P: Props }> = ({ mode, t, P }) => {
  const i = (m: Mode04) => mode === m;
  const walkX = -0.1 + 1.6 * seg(t, 0.05, 1);
  const walkZ = 0.9 - 0.7 * seg(t, 0.45, 1);
  const cam = mode === "walk" ? { p: [walkX + 0.3, 0.55, walkZ + 1.45] as V3, t: [walkX + 0.05, 0.2, walkZ] as V3 } : camAt(STREET_CAM[mode], t);
  const C = cam.p;
  const tex = useMemo(() => {
    const pave = painted(1024, 1024, "#d8cdbb", (g) => {
      g.strokeStyle = "rgba(90,70,50,0.45)"; g.lineWidth = 4;
      for (let k = 0; k <= 16; k++) { g.beginPath(); g.moveTo(k * 64, 0); g.lineTo(k * 64, 1024); g.stroke(); g.beginPath(); g.moveTo(0, k * 64 + (k % 2) * 32); g.lineTo(1024, k * 64 + (k % 2) * 32); g.stroke(); }
    }, 7);
    pave.wrapS = pave.wrapT = THREE.RepeatWrapping; pave.repeat.set(4, 3);
    return {
      pave,
      wallA: painted(512, 512, "#f3dcc2", undefined, 2),
      wallB: painted(512, 512, "#e6eef3", undefined, 4),
      wallC: painted(512, 512, "#f6dbe3", undefined, 6),
      sShoe: signTex("신발", "#c8231f"),
      sCafe: signTex("카페", "#2f5d8a"),
      sFlower: signTex("꽃집", "#d0577e"),
      win: canvasTexture(256, 256, (g) => { const gr = g.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, "#cfe8f6"); gr.addColorStop(1, "#8fbad6"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); g.fillStyle = "rgba(255,255,255,0.6)"; g.beginPath(); g.moveTo(30, 230); g.lineTo(120, 20); g.lineTo(160, 20); g.lineTo(70, 230); g.fill(); }),
    };
  }, []);

  // 둘 위치 (손 잡기: 가까이)
  const HER0: V3 = [-0.24, 0, 0.6];
  const HE0: V3 = [0.24, 0, 0.6];
  const blink = (k: number) => Math.floor(t * 60 + k * 13) % 23 === 0;

  // --- 동작 ---
  let her: Pose = { armL: 12, armR: 55, look: 0.4, mouth: "smile", blink: blink(0) };
  let him: Pose = { armL: 55, armR: 12, look: -0.4, mouth: "smile", blink: blink(1) };
  let herAt = HER0, himAt = HE0, herLook: Look = ME;
  let herBob = 0, himBob = 0;
  const extra: React.ReactNode[] = [];

  if (i("intro")) {
    // 시작부터 번호 카드 3장이 차례로 튀어나옴, "Number three" 에서 3번 카드가 커짐
    const big3 = seg(t, 0.56, 0.68);
    const pops = [popIn(t, 0.04, 0.16), popIn(t, 0.14, 0.26), popIn(t, 0.24, 0.36)];
    const texs = [P.n1, P.n2, P.n3q];
    texs.forEach((tx, k) => extra.push(<Card key={`n${k}`} tex={tx} at={[-0.27 + k * 0.27, 1.38 + (k === 2 ? 0.05 * big3 : 0), 0.7]} w={0.24} h={0.3} cam={C} scale={pops[k] * (k === 2 ? 1 + 0.3 * big3 : 1)} opacity={k === 2 ? 1 : 1 - 0.45 * big3} />));
    her = { ...her, mouth: t > 0.6 ? "o" : "smile", brow: t > 0.6 ? 0.8 : 0 };
    him = { ...him, mouth: t > 0.6 ? "o" : "grin", brow: t > 0.6 ? 0.8 : 0 };
  }
  if (i("shoes")) {
    // 남자가 선물 상자를 내밀고 → 열리면 운동화가 튀어나옴, 여자가 좋아함
    const open = seg(t, 0.4, 0.6);
    her = { armL: 12, armR: 20, look: 0.5, mouth: t > 0.6 ? "grin" : "smile", brow: t > 0.55 ? 0.6 : 0, blink: blink(0) };
    him = { armL: 12, armR: 70, look: -0.5, mouth: "smile", blink: blink(1) };
    herAt = [-0.34, 0, 0.6]; himAt = [0.32, 0, 0.6];
    const hand = handAt(him, 1, himAt, true);
    extra.push(<Card key="gift" tex={open > 0.5 ? P.giftO : P.giftC} at={[hand[0] - 0.05, hand[1] + 0.02, hand[2] + 0.04]} w={0.3} h={0.3} cam={C} scale={popIn(t, 0.0, 0.15)} />);
    extra.push(<Card key="sh" tex={P.shoes} at={[hand[0] - 0.05, hand[1] + 0.12 + 0.18 * seg(t, 0.5, 0.75), hand[2] + 0.05]} w={0.34} h={0.22} cam={C} scale={popIn(t, 0.5, 0.7)} />);
    extra.push(<Card key="n1" tex={P.n1} at={[0.0, 1.32, 0.55]} w={0.24} h={0.3} cam={C} scale={popIn(t, 0.0, 0.18) * (1 - seg(t, 0.85, 1))} />);
  }
  if (i("walk")) {
    // 운동화 한 켤레가 혼자 깡충깡충 걸어 멀어짐 ("Including away")
    const x = walkX;
    const z = walkZ;
    const hop = Math.abs(Math.sin(t * 22)) * 0.06;
    extra.push(<Card key="sh" tex={P.shoes} at={[x, 0.13 + hop, z]} w={0.36} h={0.23} cam={C} rotZ={Math.sin(t * 22) * 0.08} />);
    extra.push(<Blob key="b" at={[x, 0, z]} r={0.16} />);
    herAt = [-0.6, 0, 0.0]; himAt = [-0.15, 0, 0.0];
  }
  if (i("away")) {
    // 남자가 운동화를 건넴 → 여자가 신고 걸어서 떠남, 혼자 남은 남자 위로 비구름
    const give = seg(t, 0.14, 0.34);
    const leave = seg(t, 0.55, 1);
    him = { armL: 12, armR: give < 1 ? 70 : 20, look: -0.6, mouth: t > 0.72 ? "sad" : "smile", brow: t > 0.72 ? -0.6 : 0, blink: blink(1) };
    herLook = t > 0.4 ? ME_NEW : ME;
    her = { armL: 15, armR: 25, look: leave > 0.05 ? -0.6 : 0.5, mouth: leave > 0.05 ? "smug" : "grin", walk: leave > 0.02 ? t * 40 : undefined };
    himAt = [0.45, 0, 0.55];
    herAt = [-0.3 - 1.9 * leave, 0, 0.55 - 0.4 * leave];
    herBob = leave > 0.02 ? Math.abs(Math.sin(t * 20)) * 0.03 : 0;
    const hand = handAt(him, 1, himAt, true);
    if (t < 0.36) extra.push(<Card key="sh" tex={P.shoes} at={[hand[0] + (herAt[0] + 0.2 - hand[0]) * give, hand[1] + 0.05 + 0.12 * Math.sin(give * Math.PI), hand[2] + 0.04]} w={0.3} h={0.2} cam={C} />);
    const rain = popIn(t, 0.7, 0.82);
    extra.push(<Card key="rain" tex={P.rain[Math.floor(t * 40) % 4]} at={[himAt[0], 1.22, himAt[2] + 0.02]} w={0.42} h={0.32} cam={C} scale={rain} />);
  }
  if (i("coin")) {
    // (옛날, 세피아) 남자가 운동화를 주면 여자가 동전을 건넴 → "SOLD" 도장 → (지금, 색) 둘 다 웃음
    const coin = seg(t, 0.28, 0.42);
    const now = t > 0.75;
    herAt = [-0.3, 0, 0.6]; himAt = [0.3, 0, 0.6];
    him = { armL: 12, armR: t < 0.25 ? 65 : t > 0.38 && t < 0.5 ? 60 : 20, look: -0.5, mouth: now ? "grin" : "smile", blink: blink(1) };
    her = { armL: 12, armR: t > 0.26 && t < 0.42 ? 65 : 20, look: 0.5, mouth: now ? "grin" : "smile", blink: blink(0) };
    if (t > 0.3) herLook = ME_NEW;
    if (now) { herBob = Math.abs(Math.sin(t * 50)) * 0.02; himBob = Math.abs(Math.sin(t * 50 + 1)) * 0.02; }
    const hh = handAt(him, 1, himAt, true);
    const sh = handAt(her, 1, herAt);
    if (t < 0.27) extra.push(<Card key="sh" tex={P.shoes} at={[hh[0] - 0.02, hh[1] + 0.05, hh[2] + 0.04]} w={0.26} h={0.17} cam={C} scale={popIn(t, 0.04, 0.12)} />);
    if (t > 0.26 && t < 0.75) {
      const at: V3 = [sh[0] + (hh[0] - sh[0]) * coin, sh[1] + 0.06 + 0.2 * Math.sin(coin * Math.PI), sh[2] + 0.05];
      extra.push(<Card key="coin" tex={P.coin} at={at} w={0.14} h={0.14} cam={C} sx={Math.abs(Math.cos(coin * Math.PI * 3))} />);
    }
    extra.push(<Card key="stamp" tex={P.stamp} at={[0, 1.22, 0.7]} w={0.42} h={0.42} cam={C} scale={popIn(t, 0.46, 0.54) * (1 - seg(t, 0.72, 0.78))} />);
    extra.push(<Card key="haha" tex={P.haha} at={[0.05, 1.28, 0.7]} w={0.46} h={0.28} cam={C} scale={popIn(t, 0.8, 0.88)} rotZ={-0.06} />);
  }

  return (
    <>
      <CamSet p={cam.p} t={cam.t} />
      <hemisphereLight args={["#b8d2f2", "#8a6a50", 0.95]} />
      <directionalLight position={[3, 6, 5]} intensity={2.3} color="#fff1dc" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0006} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
      <ambientLight intensity={0.15} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial map={tex.pave} roughness={0.95} />
      </mesh>
      {/* 가게 셋 */}
      {[
        { x: -2.1, wall: tex.wallA, sign: tex.sShoe, aw: "#c8231f" },
        { x: 0.0, wall: tex.wallB, sign: tex.sCafe, aw: "#2f5d8a" },
        { x: 2.1, wall: tex.wallC, sign: tex.sFlower, aw: "#d0577e" },
      ].map((s, k) => (
        <group key={k}>
          <InkBox p={[s.x, 1.5, -1.6]} s={[2.04, 3.0, 0.9]} c="#ffffff" map={s.wall} round={0.01} />
          <InkBox p={[s.x, 1.32, -1.0]} s={[1.9, 0.06, 0.55]} c={s.aw} r={[0.32, 0, 0]} />
          <InkBox p={[s.x, 0.72, -1.13]} s={[1.5, 0.95, 0.04]} c="#ffffff" map={tex.win} e="#9fc8e0" />
          <mesh position={[s.x, 2.15, -1.13]}><planeGeometry args={[1.1, 0.34]} /><meshBasicMaterial map={s.sign} toneMapped={false} /></mesh>
        </group>
      ))}
      {/* 신발 가게 진열: 운동화 카드 */}
      {[-2.5, -2.1, -1.7].map((x) => <Card key={x} tex={P.shoes} at={[x, 0.55, -1.08]} w={0.3} h={0.19} cam={C} />)}
      {/* 가로수, 벤치, 가로등 */}
      {[-3.3, 3.3].map((x) => (
        <group key={x}>
          <InkCyl p={[x, 0.7, -0.6]} r={0.06} r2={0.08} h={1.4} c="#6b4a32" />
          <InkBall p={[x, 1.65, -0.6]} r={0.55} c="#6fae55" />
          <InkBall p={[x + 0.3, 1.45, -0.45]} r={0.35} c="#5f9c48" />
        </group>
      ))}
      <InkBox p={[2.75, 0.25, -0.55]} s={[0.9, 0.06, 0.3]} c="#8a5a3a" />
      <InkBox p={[2.75, 0.45, -0.68]} s={[0.9, 0.3, 0.05]} c="#8a5a3a" />
      {[2.4, 3.1].map((x) => <InkBox key={x} p={[x, 0.11, -0.55]} s={[0.05, 0.22, 0.28]} c="#3b3e44" />)}
      <InkCyl p={[-1.05, 1.2, -0.7]} r={0.03} h={2.4} c="#3b3e44" />
      <InkBall p={[-1.05, 2.42, -0.7]} r={0.1} c="#fff2c8" th={0.01} />
      {/* 사람 */}
      {!i("walk") && (
        <>
          <Person look={herLook} pose={her} feet={herAt} cam={C} bob={herBob} />
          <Person look={HIM} pose={him} feet={himAt} cam={C} flipX bob={himBob} />
          <Blob at={herAt} />
          <Blob at={himAt} />
        </>
      )}
      {/* 지나가는 사람들 (뒤쪽) */}
      {i("intro") &&
        [0, 1].map((k) => {
          const x = -3 + ((t * 0.9 + k * 0.5) % 1) * 6;
          return <Person key={k} look={FOLK[k]} pose={{ walk: t * 30 + k, armL: 15, armR: 15, mouth: "smile", look: 0.6 }} feet={[x, 0, -0.35]} cam={C} scale={0.95} />;
        })}
      {extra}
    </>
  );
};

// =====================================================================
// 2. 치킨집 (chicken, fly, plate)
// =====================================================================
const TOP = 0.5;
const SEAT = 0.2;
const S_HER: V3 = [-0.55, SEAT, 0];
const S_HE: V3 = [0.55, SEAT, 0];
const RV0: V3 = [-1.82, SEAT, -1.45];
const G2: V3 = [-1.08, SEAT, -1.45];
const WIN: V3 = [-1.3, 1.5, -2.38];
const MORE: { at: V3; look: Look; flip?: boolean }[] = [
  { at: [1.35, SEAT, -1.5], look: FOLK[0] },
  { at: [2.05, SEAT, -1.5], look: FOLK[1], flip: true },
  { at: [2.3, SEAT, -0.4], look: FOLK[2] },
  { at: [3.0, SEAT, -0.4], look: FOLK[3], flip: true },
];
const SHOP_CAM: Record<string, CK[]> = {
  chicken: [{ u: 0, p: [0, 0.98, 0.95], t: [0, 0.62, -0.05] }, { u: 0.25, p: [0, 1.0, 1.05], t: [0, 0.64, -0.05] }, { u: 1, p: [0, 1.25, 3.6], t: [0, 0.8, 0] }],
  fly: [
    { u: 0, p: [0, 1.25, 3.7], t: [0, 0.8, 0] },
    { u: 0.36, p: [0, 1.22, 3.5], t: [0, 0.8, 0] },
    { u: 0.48, p: [0.32, 1.22, 3.05], t: [0.42, 0.95, 0] },
    { u: 0.62, p: [0.34, 1.24, 2.95], t: [0.42, 0.98, 0] },
    { u: 0.78, p: [0.2, 1.45, 4.2], t: [-0.4, 1.12, -0.9] },
    { u: 1, p: [0.05, 1.55, 4.5], t: [-0.75, 1.22, -1.6] },
  ],
  plate: [
    { u: 0, p: [0.5, 2.3, 5.9], t: [0.2, 0.75, -0.7] },
    { u: 0.44, p: [0.45, 2.15, 5.5], t: [0.2, 0.75, -0.7] },
    { u: 0.5, p: [0, 1.25, 3.2], t: [0, 0.75, 0] },
    { u: 1, p: [0, 1.2, 2.9], t: [0, 0.75, 0] },
  ],
};

const Shop: React.FC<{ mode: Mode04; t: number; P: Props }> = ({ mode, t, P }) => {
  const i = (m: Mode04) => mode === m;
  const cam = camAt(SHOP_CAM[mode], t);
  const C = cam.p;
  const tex = useMemo(() => {
    const floor = painted(1024, 1024, "#b07a4a", (g) => {
      g.strokeStyle = "rgba(60,30,15,0.55)"; g.lineWidth = 5;
      for (let y = 0; y <= 1024; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
      for (let y = 0; y < 1024; y += 128) for (let x = ((y / 128) % 2) * 170; x < 1024; x += 340) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 128); g.stroke(); }
    }, 5);
    floor.wrapS = floor.wrapT = THREE.RepeatWrapping; floor.repeat.set(3, 3);
    const night = canvasTexture(512, 400, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 400); gr.addColorStop(0, "#1b2350"); gr.addColorStop(1, "#45467e"); g.fillStyle = gr; g.fillRect(0, 0, 512, 400);
      const r = rng(4);
      [[0, 150, 130], [120, 90, 110], [235, 170, 140], [370, 110, 142]].forEach(([x, top, w]) => {
        g.fillStyle = "#14183a"; g.fillRect(x, top, w, 400 - top);
        for (let k = 0; k < 14; k++) { g.fillStyle = r() > 0.4 ? "#ffd58a" : "#2a3060"; g.fillRect(x + 10 + (k % 4) * 28, top + 16 + Math.floor(k / 4) * 40, 16, 22); }
      });
      g.fillStyle = "#ffb04a"; g.beginPath(); g.arc(440, 60, 14, 0, 7); g.fill();
    });
    const sign = canvasTexture(512, 200, (g) => { g.font = `bold 150px ${PEN_KO}`; g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = "#ff7a2a"; g.shadowBlur = 30; g.fillStyle = "#ffe0a0"; g.fillText("치킨", 256, 105); });
    const menu = canvasTexture(512, 384, (g) => {
      g.fillStyle = "#2f3a33"; g.fillRect(0, 0, 512, 384); g.strokeStyle = "#c9a76a"; g.lineWidth = 14; g.strokeRect(7, 7, 498, 370);
      g.fillStyle = "#fff6dc"; g.textBaseline = "middle"; g.font = `64px ${PEN_KO}`; g.textAlign = "center"; g.fillText("메뉴", 256, 60); g.font = `50px ${PEN_KO}`;
      [["후라이드", "18,000"], ["양념", "19,000"], ["반반", "19,000"], ["치맥 세트", "23,000"]].forEach(([a, b], k) => { g.textAlign = "left"; g.fillText(a, 44, 136 + k * 62); g.textAlign = "right"; g.fillText(b, 470, 136 + k * 62); });
    });
    return { floor, wall: painted(1024, 512, "#f1dfbf", undefined, 9), wood: painted(1024, 256, "#8a5232", (g) => { g.strokeStyle = "rgba(40,20,10,0.5)"; g.lineWidth = 4; for (let x = 0; x < 1024; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); } }, 11), night, sign, menu };
  }, []);

  // fly 컷은 시험본 프레임 번호 그대로 (음성 7.4초 = 222프레임, 앞 6프레임 여유)
  const f = i("fly") ? 6 + t * 222 : -1;
  const blinkF = (k: number) => Math.floor(t * 70 + k * 11) % 26 === 0;
  const reach = i("fly") ? seg(f, 95, 122) - seg(f, 128, 140) : 0;
  const sprout = i("fly") ? interpolate(f, [141, 156], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) }) : 0;
  const rise = i("fly") ? seg(f, 162, 240) : 0;
  const rRise = i("fly") ? seg(f, 172, 240) : 0;
  const he = rise > 0 ? bez(S_HE, [0.25, 1.5, -0.7], [WIN[0] + 0.15, 1.05, -2.2], rise) : S_HE;
  const rv = rRise > 0 ? bez(RV0, [-2.0, 1.2, -1.7], [WIN[0] - 0.2, 1.0, -2.2], rRise) : RV0;
  const slideA = i("plate") ? seg(t, 0.6, 0.72) : 0;
  const slideB = i("plate") ? seg(t, 0.72, 0.84) : 0;

  const herPose: Pose = i("fly")
    ? { legs: "sit", armL: 14, armR: 30 + 58 * reach, look: f > 196 ? -0.8 : 0.7, mouth: f > 196 ? "open" : f > 165 ? "o" : "smile", brow: f > 165 ? 1 : 0, blink: f < 165 && blinkF(0) }
    : i("plate")
      ? { legs: "sit", armL: 14, armR: t > 0.58 ? 45 : 30, look: t > 0.58 ? -0.6 : 0.6, mouth: t > 0.58 ? "smug" : "smile", blink: blinkF(0) }
      : { legs: "sit", armL: 14, armR: 30, look: 0.7, mouth: "grin", blink: blinkF(0) };
  const hisPose: Pose = i("fly")
    ? { legs: rise > 0.02 ? "fly" : "sit", armL: f > 122 && f < 141 ? 60 : 30, armR: rise > 0.02 ? 120 : 14, look: -0.7, mouth: f > 141 ? "smug" : f > 122 ? "grin" : "smile", wings: sprout, flap: f * 0.9, blink: f < 140 && blinkF(1) }
    : i("plate")
      ? { legs: "sit", armL: 30, armR: 14, look: 0.9, mouth: "smile", blink: blinkF(1) }
      : { legs: "sit", armL: 30, armR: 14, look: -0.7, mouth: "grin", blink: blinkF(1) };
  const rivPose: Pose = { legs: rRise > 0.02 ? "fly" : "sit", armL: rRise > 0.02 ? 120 : 20, armR: 20, look: 0.8, mouth: f > 150 ? "smug" : "smile", wings: i("fly") ? interpolate(f, [150, 166], [0, 1], clamp) : 0, flap: f * 0.9 + 1, blink: blinkF(2) };
  const g2Pose: Pose = { legs: "sit", armL: 30, armR: 14, look: -0.8, mouth: f > 196 ? "open" : "smile", brow: f > 196 ? 1 : 0, blink: blinkF(3) };

  const herHand = handAt(herPose, 1, S_HER);
  const hisHand = handAt(hisPose, -1, S_HE, true);
  const pass = seg(f, 116, 128);
  const wingAt: V3 | null = !i("fly") || f < 95 || f >= 143 ? null : f < 116 ? herHand : f < 128 ? [herHand[0] + (hisHand[0] - herHand[0]) * pass, herHand[1] + (hisHand[1] - herHand[1]) * pass + 0.12 * Math.sin(pass * Math.PI), herHand[2]] : hisHand;
  const bIn = i("fly") ? interpolate(f, [26, 36], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) }) * interpolate(f, [86, 94], [1, 0], clamp) : 0;
  const flip = interpolate(f, [56, 66], [0, 1], clamp);

  return (
    <>
      <CamSet p={cam.p} t={cam.t} />
      <hemisphereLight args={["#7d8fd0", "#5a3a2a", 0.75]} />
      <ambientLight intensity={0.18} color="#8090d0" />
      <pointLight position={[0, 1.85, 0.1]} intensity={5.5} distance={7} decay={1.3} color="#ffb870" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.006} shadow-normalBias={0.03} />
      <pointLight position={[-1.65, 1.85, -1.35]} intensity={3.2} distance={5} decay={1.3} color="#ffb870" />
      <pointLight position={[1.7, 1.85, -0.5]} intensity={3.2} distance={5} decay={1.3} color="#ffb870" />
      <directionalLight position={[1.5, 3, 4]} intensity={0.45} color="#ffe6cc" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[10, 8]} /><meshStandardMaterial map={tex.floor} roughness={0.9} /></mesh>
      <InkBox p={[0, 2.2, -2.5]} s={[10, 4.4, 0.2]} c="#ffffff" map={tex.wall} round={0.005} />
      <InkBox p={[0, 0.45, -2.37]} s={[10, 0.9, 0.06]} c="#ffffff" map={tex.wood} round={0.01} />
      <InkBox p={[0, 0.92, -2.33]} s={[10, 0.06, 0.1]} c="#5e3420" />
      <InkBox p={[-3.3, 2.2, 0]} s={[0.2, 4.4, 6]} c="#e9d3ae" map={tex.wall} round={0.005} />
      <InkBox p={[WIN[0], WIN[1], -2.42]} s={[1.5, 1.15, 0.08]} c="#6b4430" />
      <mesh position={[WIN[0], WIN[1], -2.37]}><planeGeometry args={[1.32, 0.98]} /><meshBasicMaterial map={tex.night} toneMapped={false} /></mesh>
      <InkBox p={[WIN[0], WIN[1], -2.36]} s={[0.05, 1.0, 0.03]} c="#6b4430" />
      <mesh position={[0.95, 1.72, -2.38]}><planeGeometry args={[0.95, 0.37]} /><meshBasicMaterial map={tex.sign} transparent toneMapped={false} /></mesh>
      <mesh position={[0.95, 1.72, -2.37]}><planeGeometry args={[1.8, 1.0]} /><meshBasicMaterial map={P.glow} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.55} toneMapped={false} /></mesh>
      <InkBox p={[2.35, 1.45, -2.36]} s={[1.2, 0.9, 0.04]} c="#ffffff" map={tex.menu} round={0.01} />
      {[[0, 0.1], [-1.65, -1.35], [1.7, -0.5]].map(([x, z], k) => (
        <group key={k}>
          <mesh position={[x, 2.6, z]}><cylinderGeometry args={[0.006, 0.006, 0.8, 6]} /><meshBasicMaterial color="#2b1a22" /></mesh>
          <InkCyl p={[x, 2.12, z]} r={0.05} r2={0.22} h={0.16} c="#2f5a4a" />
          <mesh position={[x, 2.02, z]}><sphereGeometry args={[0.06, 16, 12]} /><meshBasicMaterial color="#fff2c8" toneMapped={false} /></mesh>
          <Card tex={P.glow} at={[x, 2.0, z + 0.05]} w={0.9} h={0.9} cam={C} tint="#ffffff" additive />
        </group>
      ))}
      {/* 다른 식탁들 */}
      {[[-1.45, -1.45, RV0, G2], [1.7, -1.5, MORE[0].at, MORE[1].at], [2.65, -0.4, MORE[2].at, MORE[3].at]].map(([x, z, a, b], k) => (
        <group key={k}>
          <InkBox p={[x as number, TOP - 0.025, z as number]} s={[0.55, 0.05, 0.62]} c="#c98f5a" />
          <InkBox p={[x as number, (TOP - 0.07) / 2, z as number]} s={[0.12, TOP - 0.07, 0.12]} c="#6a4a32" />
          <Card tex={P.basket} at={[x as number, TOP + 0.13, z as number]} w={0.33} h={0.22} cam={C} />
          <Stool x={(a as V3)[0]} z={(a as V3)[2] - 0.1} />
          <Stool x={(b as V3)[0]} z={(b as V3)[2] - 0.1} />
        </group>
      ))}
      {MORE.map((m, k) => <Person key={k} look={m.look} pose={{ legs: "sit", armL: 25, armR: 25, look: m.flip ? -0.6 : 0.6, mouth: k % 2 ? "grin" : "smile", blink: blinkF(4 + k) }} feet={m.at} cam={C} flipX={m.flip} />)}
      {/* 우리 식탁 */}
      <InkBox p={[0, TOP - 0.025, 0]} s={[0.66, 0.05, 0.72]} c="#d39a62" />
      <InkBox p={[0, (TOP - 0.07) / 2, 0]} s={[0.14, TOP - 0.07, 0.14]} c="#6a4a32" />
      <InkCyl p={[0, 0.02, 0]} r={0.26} h={0.04} c="#6a4a32" />
      <Stool x={S_HER[0]} z={-0.1} />
      <Stool x={S_HE[0]} z={rise > 0.02 ? 0 : -0.1} />
      {[-0.19, 0.19].map((x) => <InkCyl key={x} p={[x, TOP + 0.022, 0.2]} r={0.11} r2={0.09} h={0.02} c="#ffffff" th={0.006} />)}
      {[-0.24, 0.24].map((x) => (
        <group key={x}>
          <InkCyl p={[x, TOP + 0.095, -0.18]} r={0.045} h={0.16} c="#f2b13a" th={0.006} />
          <InkCyl p={[x, TOP + 0.19, -0.18]} r={0.047} h={0.03} c="#fffaf0" th={0.006} />
        </group>
      ))}
      <Card tex={P.basket} at={[0, TOP + 0.16, -0.05]} w={0.42} h={0.28} cam={C} />
      {/* 사람 */}
      <Person look={RIVAL} pose={rivPose} feet={rv} cam={C} />
      <Person look={GUY2} pose={g2Pose} feet={G2} cam={C} flipX />
      <Person look={ME} pose={herPose} feet={S_HER} cam={C} />
      <Person look={HIM} pose={hisPose} feet={he} cam={C} flipX />
      {wingAt && <Card tex={P.wing} at={[wingAt[0], wingAt[1] + 0.04, wingAt[2] + 0.02]} w={0.32} h={0.24} cam={C} rotZ={-0.3 + 0.6 * pass} />}
      {/* chicken: 큰 날개 카드로 시작 + 2번 카드 */}
      {i("chicken") && <Card tex={P.wing} at={[0, 0.78, 0.2]} w={0.36} h={0.27} cam={C} scale={1 - seg(t, 0.3, 0.55)} rotZ={-0.15} />}
      {i("chicken") && <Card tex={P.n2} at={[0, 1.42, 0.1]} w={0.32} h={0.4} cam={C} scale={popIn(t, 0.4, 0.6)} />}
      {/* fly: 바람 카드 */}
      {i("fly") && <Card tex={flip < 0.5 ? P.wind : P.heartB} at={[0, 1.38, 0.1]} w={0.52} h={0.52} cam={C} scale={bIn} sx={Math.abs(Math.cos(flip * Math.PI))} />}
      {/* plate: 날개가 조용히 여자 접시로 */}
      {i("plate") && [slideA, slideB].map((s, k) => s > 0 && (
        <Card key={k} tex={P.wing} at={[-0.19 * s + (k ? 0.04 : -0.04) * s, TOP + 0.14 - 0.06 * s + 0.12 * Math.sin(s * Math.PI), -0.05 + 0.25 * s]} w={0.2} h={0.15} cam={C} />
      ))}
    </>
  );
};

// =====================================================================
// 3. 덕수궁 돌담길 (wall, split, court, gone, end)
// =====================================================================
const WALL_CAM: Record<string, CK[]> = {
  wall: [{ u: 0, p: [3.0, 1.9, 4.2], t: [0.3, 0.95, -0.5] }, { u: 1, p: [2.5, 1.75, 3.8], t: [0.1, 0.9, -0.4] }],
  split: [{ u: 0, p: [0.2, 1.12, 3.2], t: [0.1, 0.78, 0.2] }, { u: 1, p: [0.0, 1.12, 3.4], t: [0.0, 0.78, 0.2] }],
  court: [
    { u: 0, p: [0.0, 1.1, 2.6], t: [0.0, 0.9, 0.0] },
    { u: 0.15, p: [0.0, 1.1, 2.5], t: [0.0, 0.9, 0.0] },
    { u: 0.4, p: [-1.4, 2.2, 5.6], t: [-2.2, 1.3, -1.6] },
    { u: 1, p: [-1.6, 2.0, 5.0], t: [-2.3, 1.2, -1.4] },
  ],
  gone: [{ u: 0, p: [-1.6, 2.0, 5.0], t: [-2.3, 1.2, -1.4] }, { u: 1, p: [-0.6, 1.6, 4.0], t: [-0.9, 1.05, -0.6] }],
  end: [
    { u: 0, p: [1.6, 1.6, 4.4], t: [0.0, 0.85, -0.2] },
    { u: 0.55, p: [0.9, 1.35, 3.4], t: [0.0, 0.8, 0.2] },
    { u: 1, p: [0.1, 1.18, 2.85], t: [0.0, 0.95, 0.35] },
  ],
};

const Wall: React.FC<{ mode: Mode04; t: number; P: Props; court: string }> = ({ mode, t, P, court }) => {
  const i = (m: Mode04) => mode === m;
  const cam = camAt(WALL_CAM[mode], t);
  const C = cam.p;
  const tex = useMemo(() => {
    // 돌담: 아래는 큰 돌, 위로 갈수록 작은 돌. 크기·색이 제각각, 밝은 회반죽 줄눈
    const stones = painted(1024, 512, "#8f8576", (g, r) => {
      const pal = ["#b9ad97", "#a99d8a", "#c4b8a2", "#9d917f", "#b1a48c", "#cfc3ad"];
      let y = 0;
      const rows = [92, 84, 76, 66, 58, 50, 44, 42];
      rows.forEach((rh) => {
        let x = -r() * 60;
        while (x < 1024) {
          const w = rh * (1.1 + r() * 1.3);
          g.fillStyle = pal[Math.floor(r() * pal.length)];
          g.strokeStyle = "rgba(43,26,34,0.8)"; g.lineWidth = 5;
          g.beginPath(); g.roundRect(x + 4, y + 4, w - 8, rh - 8, Math.min(18, rh * 0.3)); g.fill(); g.stroke();
          g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 4;
          g.beginPath(); g.moveTo(x + 12, y + 10); g.lineTo(x + w - 16, y + 10); g.stroke();
          g.strokeStyle = "rgba(60,40,30,0.25)"; g.lineWidth = 6;
          g.beginPath(); g.moveTo(x + 10, y + rh - 10); g.lineTo(x + w - 12, y + rh - 10); g.stroke();
          x += w;
        }
        y += rh;
      });
    }, 12);
    stones.wrapS = THREE.RepeatWrapping; stones.repeat.set(5, 1);
    const tiles = painted(512, 128, "#55585e", (g) => {
      for (let x = 0; x < 512; x += 32) { g.fillStyle = "#3e4147"; g.fillRect(x, 0, 12, 128); g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(x + 14, 0, 6, 128); }
    }, 16);
    tiles.wrapS = THREE.RepeatWrapping; tiles.repeat.set(24, 1);
    const ginkgo = [1, 2, 3].map((k) => canvasTexture(600, 900, (g) => drawGinkgo(g, k)));
    const hanok = canvasTexture(1200, 600, drawHanok);
    const road = painted(1024, 512, "#d9c9a6", (g) => {
      g.strokeStyle = "rgba(90,70,50,0.35)"; g.lineWidth = 4;
      for (let y = 0; y < 512; y += 64) for (let x = (y / 64) % 2 ? 0 : 60; x < 1024; x += 120) { g.beginPath(); g.roundRect(x, y + 4, 112, 56, 12); g.stroke(); }
    }, 14);
    road.wrapS = road.wrapT = THREE.RepeatWrapping; road.repeat.set(3, 1);
    const grass = painted(512, 512, "#b7a253", undefined, 15);
    const sign = canvasTexture(640, 128, (g) => { g.fillStyle = "#3b3e44"; g.fillRect(0, 0, 640, 128); g.strokeStyle = "#2b1a22"; g.lineWidth = 10; g.strokeRect(5, 5, 630, 118); g.font = `bold ${court.length > 14 ? 50 : 64}px ${SANS}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#ffffff"; g.fillText(court, 320, 68); });
    return { stones, road, grass, sign, tiles, ginkgo, hanok };
  }, [court]);
  const r = useMemo(() => { const g = rng(21); return Array.from({ length: 26 }, () => ({ x: (g() - 0.5) * 7, z: (g() - 0.5) * 3, o: g(), s: 0.6 + g() * 0.6 })); }, []);

  const blink = (k: number) => Math.floor(t * 60 + k * 13) % 23 === 0;
  const extra: React.ReactNode[] = [];
  // 법원: court 에서 솟아오르고, gone 에서 사라짐
  const courtH = i("court") ? seg(t, 0.15, 0.32) : i("gone") ? 1 - 0.85 * seg(t, 0.1, 0.6) : 0;
  const past = i("court") ? seg(t, 0.12, 0.2) : i("gone") ? 1 - seg(t, 0.5, 0.65) : 0;

  // 우리 커플
  let her: Pose = { armL: 12, armR: 50, look: 0.4, mouth: "smile", blink: blink(0) };
  let him: Pose = { armL: 50, armR: 12, look: -0.4, mouth: "smile", blink: blink(1) };
  let herAt: V3 = [-0.2, 0, 0.35], himAt: V3 = [0.2, 0, 0.35];
  let showUs = false;
  let bob = 0;
  if (i("split")) {
    showUs = true;
    const walk = 1 - seg(t, 0.0, 0.62);
    const apart = seg(t, 0.68, 0.85);
    const base = -0.05 + 0.35 * walk;
    herAt = [base - 0.2 - 0.18 * apart, 0, 0.35];
    himAt = [base + 0.2 + 0.18 * apart, 0, 0.35];
    const walking = t < 0.62;
    her = { armL: 12, armR: apart > 0.05 ? 15 : 50, look: apart > 0.05 ? 0.6 : 0.4, mouth: t > 0.66 ? (t > 0.85 ? "sad" : "open") : "smile", brow: t > 0.66 ? 0.8 : 0, walk: walking ? t * 40 : undefined, blink: blink(0) };
    him = { armL: apart > 0.05 ? 15 : 50, armR: 12, look: apart > 0.05 ? -0.6 : -0.4, mouth: t > 0.66 ? (t > 0.85 ? "sad" : "open") : "smile", brow: t > 0.66 ? 0.8 : 0, walk: walking ? t * 40 + Math.PI : undefined, blink: blink(1) };
    bob = walking ? Math.abs(Math.sin(t * 20)) * 0.025 : 0;
    extra.push(<Card key="crack" tex={P.crack} at={[base, 0.75, 0.4]} w={0.16} h={0.56} cam={C} scale={popIn(t, 0.64, 0.72)} />);
  }
  if (i("end")) {
    showUs = true;
    const tight = seg(t, 0.62, 0.78);
    const walk = 1 - seg(t, 0.0, 0.6);
    const base = 0.0 + 0.9 * walk;
    herAt = [base - 0.2 + 0.05 * tight, 0, 0.35 + 0.3 * (1 - walk)];
    himAt = [base + 0.2 - 0.05 * tight, 0, 0.35 + 0.3 * (1 - walk)];
    const walking = t < 0.6;
    her = { armL: 12, armR: 50, look: 0.5, mouth: t > 0.62 ? "grin" : "smile", blush: tight, walk: walking ? t * 40 : undefined, blink: blink(0) };
    him = { armL: 50, armR: 12, look: -0.5, mouth: t > 0.62 ? "grin" : "smile", blush: tight, walk: walking ? t * 40 + Math.PI : undefined, blink: blink(1) };
    bob = walking ? Math.abs(Math.sin(t * 20)) * 0.025 : 0;
    extra.push(<Card key="h" tex={P.heart} at={[base, 1.12 + 0.1 * tight, herAt[2] + 0.02]} w={0.22} h={0.2} cam={C} scale={popIn(t, 0.66, 0.74) * (1 - seg(t, 0.8, 0.84))} />);
    // 마지막: 세 장 카드 다시 + 물음표
    [P.n1, P.n2, P.n3].forEach((tx, k) => extra.push(<Card key={`n${k}`} tex={tx} at={[-0.25 + k * 0.25, 1.32, herAt[2] - 0.15]} w={0.21} h={0.26} cam={C} scale={popIn(t, 0.8 + k * 0.04, 0.88 + k * 0.04)} rotZ={(k - 1) * 0.08} />));
  }
  if (i("wall")) extra.push(<Card key="n3" tex={P.n3} at={[0.6, 1.95, -0.4]} w={0.5} h={0.62} cam={C} scale={popIn(t, 0.04, 0.2)} />);
  if (i("court")) {
    extra.push(<Card key="q" tex={P.q} at={[0, 1.15, 0.3]} w={0.36} h={0.43} cam={C} scale={popIn(t, 0.0, 0.08) * (1 - seg(t, 0.14, 0.2))} />);
  }
  if (i("gone")) extra.push(<Card key="st" tex={P.story} at={[-1.0, 1.3 + 0.04 * Math.sin(t * 9), -0.2]} w={0.9} h={0.54} cam={C} scale={popIn(t, 0.4, 0.52)} />);

  // 걷는 다른 커플들
  const walkers: React.ReactNode[] = [];
  const grim = i("court") && t > 0.4;
  if (i("wall") || i("end") || grim) {
    [0, 1].forEach((k) => {
      const dir = grim ? -1 : 1;
      const u = grim ? seg(t, 0.4, 1) : (t * 0.35 + k * 0.5) % 1;
      const x = grim ? 0.6 - 2.4 * u - k * 0.9 : i("wall") ? -1.6 + 3.0 * u : -3.0 + 6.0 * u;
      const z = grim ? 0.45 + k * 0.4 : i("end") ? -0.4 : -0.05 + k * 0.5;
      const pa: Pose = { armL: grim ? 15 : 12, armR: grim ? 15 : 50, look: dir * 0.6, mouth: grim ? "flat" : "smile", walk: t * 34 + k };
      const pb: Pose = { armL: grim ? 15 : 50, armR: 12, look: dir * 0.6, mouth: grim ? "sad" : "smile", walk: t * 34 + k + Math.PI };
      const gap = grim ? 0.3 : 0.2;
      walkers.push(<Person key={`a${k}`} look={FOLK[k * 2]} pose={pa} feet={[x - gap, 0, z]} cam={C} bob={Math.abs(Math.sin(t * 18 + k)) * 0.02} />);
      walkers.push(<Person key={`b${k}`} look={FOLK[k * 2 + 1]} pose={pb} feet={[x + gap, 0, z]} cam={C} flipX bob={Math.abs(Math.sin(t * 18 + k + 1)) * 0.02} />);
      walkers.push(<Blob key={`s${k}`} at={[x, 0, z]} r={0.32} />);
      if (grim) walkers.push(<Card key={`p${k}`} tex={P.paper} at={[x - gap + 0.17, 0.5, z + 0.04]} w={0.14} h={0.18} cam={C} />);
    });
  }

  return (
    <>
      <CamSet p={cam.p} t={cam.t} />
      <hemisphereLight args={["#b9a6e8", "#7a5a4a", 0.85]} />
      <directionalLight position={[3, 4, 5]} intensity={2.6} color="#ffc98a" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0006} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} />
      <ambientLight intensity={0.12} color="#9a8ad0" />
      {/* 길, 풀밭 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0.4]} receiveShadow><planeGeometry args={[16, 1.9]} /><meshStandardMaterial map={tex.road} roughness={0.95} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[16, 12]} /><meshStandardMaterial map={tex.grass} roughness={1} /></mesh>
      {/* 돌담 + 기와 지붕(양쪽으로 기울어진 판 + 용마루) */}
      <InkBox p={[0, 0.7, -0.9]} s={[18, 1.4, 0.5]} c="#ffffff" map={tex.stones} round={0.03} />
      <InkBox p={[0, 1.44, -0.9]} s={[18.2, 0.08, 0.62]} c="#6a6e75" round={0.02} />
      <InkBox p={[0, 1.55, -0.73]} s={[18.4, 0.04, 0.42]} c="#ffffff" map={tex.tiles} r={[0.42, 0, 0]} round={0.01} />
      <InkBox p={[0, 1.55, -1.07]} s={[18.4, 0.04, 0.42]} c="#ffffff" map={tex.tiles} r={[-0.42, 0, 0]} round={0.01} />
      <InkBox p={[0, 1.66, -0.9]} s={[18.4, 0.08, 0.1]} c="#3b3e44" round={0.03} />
      {/* 담 너머 궁궐 (처마가 휜 한옥 지붕 그림) */}
      <Card tex={tex.hanok} at={[1.6, 2.0, -3.6]} w={3.8} h={1.9} cam={[C[0] * 0.2, C[1], C[2]]} tint="#f2e6dc" />
      <Card tex={tex.hanok} at={[-3.4, 1.85, -4.4]} w={3.0} h={1.5} cam={[C[0] * 0.2, C[1], C[2]]} tint="#e6d8d0" />
      {/* 은행나무 (그림 나무), 옛날식 가로등 */}
      {[[-4.6, -0.35, 0], [-0.7, -0.4, 1], [2.6, -0.35, 2], [5.0, -0.4, 0]].map(([x, z, k]) => (
        <Card key={x} tex={tex.ginkgo[k]} at={[x, 1.45, z]} w={1.9} h={2.85} cam={C} />
      ))}
      {[-3.2, 0.9, 4.0].map((x) => (
        <group key={x}>
          <InkCyl p={[x, 0.9, -0.55]} r={0.035} h={1.8} c="#2f3a33" />
          <InkBox p={[x, 1.86, -0.55]} s={[0.16, 0.2, 0.16]} c="#fff1c8" e="#ffd98a" round={0.02} />
          <InkBox p={[x, 1.98, -0.55]} s={[0.22, 0.04, 0.22]} c="#2f3a33" round={0.01} />
        </group>
      ))}
      {/* 떨어지는 은행잎 */}
      {r.map((l, k) => {
        const f = (t * (i("end") || i("wall") ? 0.9 : 0.6) + l.o) % 1;
        return <Card key={k} tex={P.leaf} at={[l.x + Math.sin(f * 6 + k) * 0.25, 2.4 - f * 2.4, 0.6 + l.z * 0.5]} w={0.08 * l.s} h={0.08 * l.s} cam={C} rotZ={f * 8 + k} />;
      })}
      {/* 옛 가정법원 */}
      {courtH > 0.01 && (
        <group position={[-2.6, 0, -2.6]} scale={[1, courtH, 1]}>
          <InkBox p={[0, 1.7, 0]} s={[3.0, 3.4, 1.6]} c="#c9c2b4" />
          <InkBox p={[0, 3.5, 0.05]} s={[3.4, 0.22, 1.9]} c="#4b4f56" />
          {[-1.05, -0.35, 0.35, 1.05].map((x) => <InkBox key={x} p={[x, 2.8, 0.82]} s={[0.36, 0.5, 0.03]} c="#5d7a92" />)}
          {[-1.1, -0.37, 0.37, 1.1].map((x) => <InkBox key={`c${x}`} p={[x, 1.2, 0.86]} s={[0.17, 2.4, 0.17]} c="#ece6da" />)}
          <mesh position={[0, 2.25, 0.97]}><planeGeometry args={[2.2, 0.44]} /><meshBasicMaterial map={tex.sign} toneMapped={false} /></mesh>
        </group>
      )}
      {walkers}
      {showUs && (
        <>
          <Person look={ME} pose={her} feet={herAt} cam={C} bob={bob} />
          <Person look={HIM} pose={him} feet={himAt} cam={C} flipX bob={bob} />
          <Blob at={[(herAt[0] + himAt[0]) / 2, 0, herAt[2]]} r={0.36} />
        </>
      )}
      {extra}
      {/* 과거 장면은 살짝 바랜 색 (CSS 필터는 바깥에서) */}
      {past > 0 && null}
    </>
  );
};

// =====================================================================
const SKIES: Record<string, string> = {
  street: "linear-gradient(#7fb6ea 0%, #b9dcf5 50%, #eef6fb 85%)",
  shop: "#1b2350",
  wall: "linear-gradient(#f2a97a 0%, #f8cf98 45%, #fde9c6 85%)",
};

export const SceneCas04: React.FC<{ mode: Mode04; t: number; words: Words04 }> = ({ mode, t, words }) => {
  const { width, height } = useVideoConfig();
  const P = useProps(words.lang);
  const set = ["intro", "shoes", "walk", "away", "coin"].includes(mode) ? "street" : ["chicken", "fly", "plate"].includes(mode) ? "shop" : "wall";
  // 옛날 장면: 동전(앞부분), 법원(가운데)
  const sepia = mode === "coin" ? 0.75 * (1 - seg(t, 0.72, 0.78)) : mode === "court" ? 0.45 * seg(t, 0.12, 0.2) : mode === "gone" ? 0.45 * (1 - seg(t, 0.5, 0.65)) : 0;
  return (
    <AbsoluteFill style={{ background: SKIES[set] }}>
      <AbsoluteFill style={{ filter: `saturate(1.12) contrast(1.05) sepia(${sepia.toFixed(3)})` }}>
        <ThreeCanvas width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }} camera={{ fov: 38, near: 0.05, far: 80 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}>
          {set === "street" && <Street mode={mode} t={t} P={P} />}
          {set === "shop" && <Shop mode={mode} t={t} P={P} />}
          {set === "wall" && <Wall mode={mode} t={t} P={P} court={words.court} />}
        </ThreeCanvas>
      </AbsoluteFill>
      {sepia > 0.05 && <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(60,40,20,0.55) 100%)", opacity: sepia / 0.75 }} />}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 58%, rgba(10,8,30,0.35) 100%)" }} />
    </AbsoluteFill>
  );
};
