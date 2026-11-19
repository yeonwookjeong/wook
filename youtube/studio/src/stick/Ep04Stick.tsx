// EP04 완성판: 민화풍 배경(그림) + 먹선 졸라맨(코드). 대본·음성·자막 타이밍은 EP04와 같다.
// 장면은 대본 문장마다, 자막 덩어리(chunk) 박자에 맞춰 움직이고, 효과음도 그 사건에 맞춘다.
import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadNotoSans } from "@remotion/google-fonts/NotoSansKR";
import { loadFont as loadHahmlet } from "@remotion/google-fonts/Hahmlet";
import { CAPS, EP04, SHOTS } from "../ep04/Ep04";
import { INK, Look, Pose, Stick, stand, walk } from "./Stick";
import { GiftBox, Sneakers } from "./StickTest";

const { fontFamily: sans } = loadNotoSans();
const { fontFamily: serif } = loadHahmlet();
const FPS = 30;
const YELLOW = "#ffd23a";
const RED = "#c8322a";
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
type Lang = "en" | "es";
type Cap = { text: string; hl?: boolean }[];
type Fx = [string, number, number];

const MAN: Look = { kind: "man", accent: "#3e8e7e" };
const WOMAN: Look = { kind: "woman", accent: "#e2574c" };
const MAN80: Look = { kind: "man", accent: "#8a6a4a" };
const WOMAN80: Look = { kind: "woman", accent: "#6a6a8a" };
const H = 520;
const SNEAK = "#f6f3ea";

// ---------------------------------------------------------------- 공용 그림
type Cam = { z: number; fx: number; fy: number };
const camStyle = (c: Cam): React.CSSProperties => {
  const cx = Math.min(1080 - 540 / c.z, Math.max(540 / c.z, c.fx));
  const cy = Math.min(1920 - 960 / c.z, Math.max(960 / c.z, c.fy));
  return { transform: `translate(${540 - cx * c.z}px, ${960 - cy * c.z}px) scale(${c.z})`, transformOrigin: "0 0" };
};
const Stage: React.FC<{ bg: string; cam: Cam; gray?: number; children?: React.ReactNode; ui?: React.ReactNode }> = ({ bg, cam, gray = 0, children, ui }) => (
  <AbsoluteFill style={{ background: "#f3ead8" }}>
    <AbsoluteFill style={{ ...camStyle(cam), filter: gray ? `grayscale(${gray}) sepia(${0.15 * gray}) contrast(1.04)` : undefined }}>
      <Img src={staticFile(bg)} style={{ width: 1080, height: 1920 }} />
      {children}
    </AbsoluteFill>
    {ui}
  </AbsoluteFill>
);

const NumCard: React.FC<{ n: string; x: number; y: number; f: number; at: number; s?: number; hl?: boolean }> = ({ n, x, y, f, at, s = 1, hl }) => {
  if (f < at) return null;
  const d = spring({ frame: f - at, fps: FPS, config: { damping: 10, stiffness: 160 } });
  return (
    <div style={{ position: "absolute", left: x - 85 * s, top: y - 100 * s + (1 - d) * -700, width: 170 * s, height: 200 * s, transform: `rotate(${(1 - d) * 18 - 4}deg)` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 20 * s, background: hl ? YELLOW : "#f6efe0", border: `${8 * s}px solid ${INK}`, boxShadow: `${8 * s}px ${10 * s}px 0 rgba(42,28,36,0.25)` }} />
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: n.length > 1 ? sans : serif, fontWeight: 900, fontSize: (n.length > 1 ? 54 : 130) * s, color: INK, lineHeight: 1 }}>{n}</span>
    </div>
  );
};
const Stamp: React.FC<{ word: string; x: number; y: number; f: number; at: number }> = ({ word, x, y, f, at }) => {
  if (f < at) return null;
  const k = spring({ frame: f - at, fps: FPS, from: 2.2, to: 1, config: { damping: 14, stiffness: 320 } });
  return (
    <div style={{ position: "absolute", left: x - 150, top: y - 150, width: 300, height: 300, transform: `scale(${k}) rotate(-12deg)`, opacity: Math.min(1, (f - at + 1) / 3) }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `14px solid ${RED}` }} />
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 900, fontSize: word.length > 5 ? 52 : 74, color: RED }}>{word}</span>
    </div>
  );
};
const Coin: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <svg width={60 * s} height={60 * s} viewBox="-30 -30 60 60" style={{ position: "absolute", left: x - 30 * s, top: y - 30 * s, overflow: "visible" }}>
    <circle r={22} fill="#e8e4dc" stroke={INK} strokeWidth={5} />
    <circle r={13} fill="none" stroke="#a8a29a" strokeWidth={3} />
  </svg>
);
// 하트 (crack 0..1 이면 두 쪽으로 갈라져 벌어짐)
const Heart: React.FC<{ x: number; y: number; s: number; crack: number }> = ({ x, y, s, crack }) => {
  const half = (side: -1 | 1) => (
    <svg width={240} height={220} viewBox="0 0 240 220" style={{ position: "absolute", left: 0, top: 0, transform: `translate(${side * crack * 60}px, ${crack * 40}px) rotate(${side * crack * 16}deg)` }}>
      <defs>
        <clipPath id={`hh${side}`}>
          <path d={side < 0 ? "M0 0 L124 0 L104 60 L132 100 L108 150 L120 220 L0 220 Z" : "M124 0 L240 0 L240 220 L120 220 L108 150 L132 100 L104 60 Z"} />
        </clipPath>
      </defs>
      <path clipPath={`url(#hh${side})`} d="M120 205 C40 150 10 110 14 70 C18 30 52 12 82 14 C102 16 114 28 120 42 C126 28 138 16 158 14 C188 12 222 30 226 70 C230 110 200 150 120 205 Z" fill="#e2574c" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
    </svg>
  );
  return (
    <div style={{ position: "absolute", left: x - 120, top: y - 110, width: 240, height: 220, transform: `scale(${s})` }}>
      {half(-1)}
      {half(1)}
    </div>
  );
};
// 등 날개 한 쌍 (한 장을 좌우로 뒤집어 붙여 항상 대칭)
const BackWings: React.FC<{ x: number; y: number; s: number; flap: number }> = ({ x, y, s, flap }) => (
  <svg width={1} height={1} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
    {[-1, 1].map((sd) => (
      <g key={sd} transform={`scale(${sd * s}, ${s}) rotate(${-flap * 22})`}>
        <path d="M0 0 C10 -50 60 -90 130 -90 C110 -70 125 -62 105 -50 C122 -42 105 -30 88 -25 C98 -14 80 -6 66 -6 C66 6 40 10 26 6 C16 14 4 10 0 0 Z" fill="#fbf6ec" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M24 -10 C50 -30 80 -48 112 -66 M30 0 C54 -14 72 -20 92 -24" stroke="#c9bba4" strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
    ))}
  </svg>
);
// 낱말 카드 (WIND/바람 → 깨진 하트로 뒤집힘)
const WordCard: React.FC<{ word: string; ko: string; f: number; at: number; flipAt: number; hideAt: number }> = ({ word, ko, f, at, flipAt, hideAt }) => {
  if (f < at || f > hideAt + 8) return null;
  const inK = spring({ frame: f - at, fps: FPS, config: { damping: 11, stiffness: 200 } });
  const fl = interpolate(f, [flipAt, flipAt + 8], [0, 1], cl);
  const out = interpolate(f, [hideAt, hideAt + 8], [1, 0], cl);
  const sx = Math.abs(Math.cos(fl * Math.PI));
  const back = fl >= 0.5;
  return (
    <div style={{ position: "absolute", left: 540 - 200, top: 520, width: 400, height: 300, transform: `scale(${inK * out * Math.max(0.03, sx)}, ${inK * out})` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 26, background: "#f6efe0", border: `10px solid ${INK}`, boxShadow: "10px 12px 0 rgba(42,28,36,0.25)" }} />
      {back ? (
        <Heart x={200} y={150} s={0.85} crack={interpolate(f, [flipAt + 8, flipAt + 20], [0, 1], cl)} />
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <svg width={200} height={70} viewBox="0 0 200 70"><path d={`M10 25 C50 ${5 + Math.sin(f * 0.3) * 8} 90 45 140 20 S190 15 195 30 M20 50 C60 ${35 + Math.sin(f * 0.3 + 1) * 8} 110 65 170 45`} stroke="#3e8e7e" strokeWidth={8} fill="none" strokeLinecap="round" /></svg>
          <span style={{ fontFamily: sans, fontWeight: 900, fontSize: 70, color: INK, lineHeight: 1 }}>{word}</span>
          <span style={{ fontFamily: serif, fontWeight: 900, fontSize: 46, color: "#7a6a5a", lineHeight: 1.2 }}>{ko}</span>
        </div>
      )}
    </div>
  );
};
// 옛 가정법원 건물 (먹선)
const Court: React.FC<{ x: number; y: number; s: number; o: number; label: string }> = ({ x, y, s, o, label }) => (
  <svg width={1} height={1} style={{ position: "absolute", left: x, top: y, overflow: "visible", opacity: o }}>
    <g transform={`scale(${s})`} stroke={INK} strokeWidth={6} strokeLinejoin="round">
      <rect x={-170} y={-40} width={340} height={40} fill="#e8e0d0" />
      <rect x={-150} y={-230} width={300} height={190} fill="#efe7d8" />
      {[-110, -55, 0, 55, 110].map((cx) => <rect key={cx} x={cx - 14} y={-215} width={28} height={175} fill="#f6f0e4" />)}
      <rect x={-175} y={-275} width={350} height={45} fill="#ddd3c2" />
      <rect x={-120} y={-266} width={240} height={28} fill="#f6efe0" strokeWidth={4} />
      <text x={0} y={-245} textAnchor="middle" fontFamily={sans} fontWeight={900} fontSize={label.length > 14 ? 15 : 19} fill={INK} stroke="none">{label}</text>
      <rect x={-30} y={-110} width={60} height={70} fill="#6a5a4a" />
    </g>
  </svg>
);

// ---------------------------------------------------------------- 장면
type SP = { f: number; dur: number; n: number; lang: Lang };
const chunk = (dur: number, n: number, k: number) => Math.round((dur * k) / n);
const F_PARK = 1640;

const S0: React.FC<SP> = ({ f, dur, n }) => {
  const c2 = chunk(dur, n, 2), c3 = chunk(dur, n, 3);
  const inT = ease(Math.min(1, f / Math.max(1, c2)));
  const walking = f < c2;
  return (
    <Stage bg="m04/park.png" cam={{ z: lerp(1.0, 1.12, f / dur), fx: 540, fy: 1250 }}
      ui={[0, 1, 2].map((i) => <NumCard key={i} n={`${i + 1}`} x={330 + i * 210} y={680} f={f} at={c2 + i * 7} hl={i === 2} s={i === 2 && f > c3 ? 1 + 0.15 * spring({ frame: f - c3, fps: FPS, config: { damping: 9 } }) : 1} />)}>
      <Stick id="m0" look={MAN} pose={walking ? walk(f) : stand(f)} x={lerp(-150, 430, inT)} floor={F_PARK} h={H} />
      <Stick id="w0" look={WOMAN} pose={walking ? walk(f + 7) : stand(f + 5)} x={lerp(1230, 660, inT)} floor={F_PARK} h={H} flip />
    </Stage>
  );
};
const S1: React.FC<SP> = ({ f, dur }) => {
  // "Number one: shoes as a gift." 남자가 상자를 내밀고 → 상자가 열리며 운동화
  const t = f / dur;
  const opened = interpolate(t, [0.55, 0.7], [0, 1], cl);
  const p = spring({ frame: f - Math.round(dur * 0.6), fps: FPS, config: { damping: 9, stiffness: 180 } });
  return (
    <Stage bg="m04/park.png" cam={{ z: lerp(1.05, 1.3, ease(t)), fx: 560, fy: 1350 }} ui={<NumCard n="1" x={150} y={640} f={f} at={0} s={0.8} hl />}>
      <Stick id="m1" look={MAN} pose={{ ...stand(f), armR: [-75, -10], armL: [-60, -20] }} x={430} floor={F_PARK} h={H} />
      <Stick id="w1" look={WOMAN} pose={opened > 0.3 ? { ...stand(f), armR: [-115, 10], armL: [-100, 0], bob: 6 * Math.abs(Math.sin(f * 0.5)) } : stand(f)} x={680} floor={F_PARK} h={H} flip />
      <GiftBox x={560} y={F_PARK - 200} open={opened} s={1.3} />
      {opened > 0.2 && <Sneakers x={560} y={F_PARK - 300 - p * 150} s={1.4} />}
    </Stage>
  );
};
const S2: React.FC<SP> = ({ f, dur, n }) => {
  // "Shoes take you places." 받자마자 신고 신나서 걸어 봄 → "Including away." 뒤돌아 길 쪽
  const t = f / dur;
  const turnAt = chunk(dur, n, Math.max(1, n - 1));
  const snap = spring({ frame: f, fps: FPS, config: { damping: 8, stiffness: 240 } });
  const strut = interpolate(f, [dur * 0.12, turnAt - 4], [0, 1], cl);
  const turned = f >= turnAt;
  const x = 680 + Math.sin(strut * Math.PI) * 120;
  const pose: Pose = turned ? { ...stand(f), face: "back" } : strut > 0 && strut < 1 ? { ...walk(f, 0.45), armR: [-130, 0], armL: [-120, 0] } : { ...stand(f), bob: (1 - snap) * -18 };
  return (
    <Stage bg="m04/park.png" cam={turned ? { z: 1.4, fx: 620, fy: 1350 } : { z: lerp(1.6, 1.35, ease(t)), fx: 680, fy: 1480 }}>
      <Stick id="m2" look={MAN} pose={{ ...stand(f), armR: [-40, -20] }} x={430} floor={F_PARK} h={H} />
      <Stick id="w2" look={{ ...WOMAN, shoes: SNEAK }} pose={pose} x={x} floor={F_PARK} h={H} flip={!(strut > 0 && strut < 0.5)} />
    </Stage>
  );
};
const S3: React.FC<SP> = ({ f, dur, n }) => {
  // "give your partner shoes," 남자 다가감 → "and they'll use them" 신은 발 → "to walk away from you." 신은 채 떠남
  const goAt = chunk(dur, n, Math.max(1, n - 2));
  const footAt = chunk(dur, n, Math.max(1, n - 3));
  const go = interpolate(f, [goAt, dur], [0, 1], cl);
  const g = ease(go);
  const cam: Cam = f < footAt ? { z: 1.2, fx: 560, fy: 1350 } : go <= 0 ? { z: 2.1, fx: 680, fy: F_PARK - 60 } : { z: lerp(1.35, 1.15, g), fx: lerp(640, 500, g), fy: lerp(1450, 1350, g) };
  return (
    <Stage bg="m04/park.png" cam={cam}>
      <Stick id="m3" look={MAN} pose={go > 0.2 ? { armL: [2, 0], armR: [-2, 0], head: -6, lean: -3, bob: -4 } : { ...stand(f), armR: [-70, -10] }} x={go > 0 ? 430 : lerp(430, 500, ease(Math.min(1, f / Math.max(1, footAt))))} floor={F_PARK} h={H} />
      <div style={{ opacity: interpolate(go, [0.9, 1], [1, 0], cl) }}>
        <Stick id="w3" look={{ ...WOMAN, shoes: SNEAK }} pose={go > 0 ? { ...walk(f), face: "back" } : stand(f)} x={lerp(680, 610, g)} floor={lerp(F_PARK, 1330, g)} h={H * lerp(1, 0.38, g)} flip={go <= 0} />
      </div>
    </Stage>
  );
};
const S4: React.FC<SP> = ({ f, dur, n, lang }) => {
  // 80년대(흑백): 여자가 신발을 내밀고 → "a coin" 남자가 동전 → 서로 바꿔 쥠 → SOLD 쾅 → "Today…" 컬러로 지금 커플 웃음
  const cCoin = chunk(dur, n, 2), cSwap = chunk(dur, n, 3), cStamp = chunk(dur, n, 4), cNow = chunk(dur, n, n - 2);
  const sw = ease(interpolate(f, [cSwap, cSwap + 12], [0, 1], cl));
  const now = f >= cNow;
  if (now) {
    const g = f - cNow;
    const laugh: Pose = { armL: [-25, -120], armR: [-25, -120], lean: -6 + 3 * Math.sin(g * 0.9), bob: Math.abs(Math.sin(g * 0.9)) * 10 };
    return (
      <Stage bg="m04/park.png" cam={{ z: 1.3, fx: 560, fy: 1350 }}>
        <Stick id="m4n" look={MAN} pose={laugh} x={430} floor={F_PARK} h={H} />
        <Stick id="w4n" look={{ ...WOMAN, shoes: SNEAK }} pose={{ ...laugh, armR: [-150, -40] }} x={680} floor={F_PARK} h={H} flip />
      </Stage>
    );
  }
  const shoeX = lerp(600, 480, sw), coinX = lerp(500, 610, sw);
  return (
    <Stage bg="m04/park.png" cam={{ z: lerp(1.3, 1.45, f / cNow), fx: 555, fy: 1380 }} gray={1}
      ui={<Stamp word={lang === "es" ? "VENDIDO" : "SOLD"} x={540} y={680} f={f} at={cStamp} />}>
      <Stick id="m4" look={MAN80} pose={{ ...stand(f), armR: f >= cCoin ? [-80, -10] : [-8, 6] }} x={430} floor={F_PARK} h={H} />
      <Stick id="w4" look={WOMAN80} pose={{ ...stand(f), armR: [-80, -10] }} x={680} floor={F_PARK} h={H} flip />
      <Sneakers x={shoeX} y={F_PARK - 290} s={1.25} />
      {f >= cCoin && <Coin x={coinX} y={F_PARK - 330} s={1.2} />}
    </Stage>
  );
};
const F_PUB = 1790;
const S5: React.FC<SP> = ({ f, dur }) => (
  <Stage bg="m04/chicken_pub.png" cam={{ z: lerp(1.05, 1.25, ease(f / dur)), fx: 540, fy: 1450 }} ui={<NumCard n="2" x={930} y={640} f={f} at={0} s={0.8} hl />}>
    <Stick id="m5" look={MAN} pose={stand(f)} x={880} floor={F_PUB} h={H} flip />
    <Stick id="w5" look={WOMAN} pose={stand(f + 9)} x={200} floor={F_PUB} h={H} />
  </Stage>
);
// 바람 카드 → 날개 건넴 → 먹음 → 등에 날개 → 날아감
const FLYK: Record<Lang, { wind: number; cheat: number; feed: number; sprout: number }> = { en: { wind: 1, cheat: 2, feed: 3, sprout: 4 }, es: { wind: 1, cheat: 2, feed: 3, sprout: 5 } };
const S6: React.FC<SP> = ({ f, dur, n, lang }) => {
  const K = FLYK[lang];
  const cW = chunk(dur, n, K.wind), cC = chunk(dur, n, K.cheat), cF = chunk(dur, n, K.feed), cS = chunk(dur, n, K.sprout);
  const give = ease(interpolate(f, [cF, cF + 16], [0, 1], cl));
  const eat = f >= cF + 20;
  const lift = ease(interpolate(f, [cS + 10, dur], [0, 1], cl));
  const sprout = spring({ frame: f - cS, fps: FPS, config: { damping: 9, stiffness: 200 } });
  const manX = lerp(880, 760, lift), manFloor = F_PUB - lift * 620;
  const shoulderY = manFloor - 0.572 * H;
  const wingX = lerp(320, 770, give), wingY = lerp(F_PUB - 330, F_PUB - 430, give);
  return (
    <Stage bg="m04/chicken_pub.png" cam={{ z: 1.08, fx: 540, fy: 1450 }}
      ui={<WordCard word={lang === "es" ? "VIENTO" : "WIND"} ko="바람" f={f} at={cW} flipAt={cC} hideAt={cF - 4} />}>
      <Stick id="w6" look={WOMAN} pose={lift > 0.1 ? { ...stand(f), armR: [-100, -20], head: -10 } : give > 0 && give < 1 ? { ...stand(f), armR: [-80, -5] } : stand(f + 9)} x={200} floor={F_PUB} h={H} />
      {f >= cS && <BackWings x={manX} y={shoulderY + 20} s={sprout * 1.15} flap={lift > 0 ? Math.sin(f * 0.9) : Math.sin(f * 0.3) * 0.3} />}
      <Stick id="m6" look={MAN} pose={lift > 0 ? { armL: [40, 40], armR: [-40, -40], legL: [10, -30], legR: [-10, -20] } : eat ? { ...stand(f), armR: [-150, -40], head: 6 } : stand(f)} x={manX} floor={manFloor} h={H} flip />
      {f >= cF && !eat && <Img src={staticFile("m04v2/wing.png")} style={{ position: "absolute", left: wingX - 50, top: wingY - 28, width: 100 }} />}
    </Stage>
  );
};
// 가족 식탁(그림 속 가족) — 날개가 아빠 접시에서 아들 접시로 슬그머니
const K572 = 1080 / 572;
const S7: React.FC<SP> = ({ f, dur, n }) => {
  const a = chunk(dur, n, Math.max(1, n - 2)), b = chunk(dur, n, n - 1);
  const m = ease(interpolate(f, [a, b], [0, 1], cl));
  const x = lerp(125 * K572, 422 * K572, m), y = lerp(780 * K572, 778 * K572, m) - Math.sin(m * Math.PI) * 70;
  return (
    <Stage bg="m04v2/f10_nowing.png" cam={{ z: 1.52, fx: lerp(390, 640, m), fy: 1450 }}>
      <Img src={staticFile("m04v2/wing.png")} style={{ position: "absolute", left: x, top: y, width: 48 * K572, transform: `rotate(${Math.sin(m * Math.PI) * -12}deg)` }} />
    </Stage>
  );
};
const F_WALL = 1610;
const S8: React.FC<SP> = ({ f, dur }) => (
  <Stage bg="m04/stonewall.png" cam={{ z: lerp(1.25, 1.05, ease(f / dur)), fx: lerp(380, 540, ease(f / dur)), fy: 1250 }} ui={<NumCard n="3" x={150} y={640} f={f} at={0} s={0.8} hl />} />
);
// 손잡고 걷기 (남자 x, 여자 x+190, 두 손이 가운데서 만남)
const Couple: React.FC<{ f: number; x: number; floor: number; h: number; gap?: number; apart?: number; id: string }> = ({ f, x, floor, h, gap = 190, apart = 0, id }) => {
  const hold = apart <= 0;
  const w = walk(f, 0.3);
  return (
    <>
      <Stick id={`${id}m`} look={MAN} pose={{ ...w, armR: hold ? [55, 0] : w.armR }} x={x - apart * 160} floor={floor} h={h} />
      <Stick id={`${id}w`} look={WOMAN} pose={{ ...walk(f + 4, 0.3), armR: hold ? [55, 0] : walk(f + 4, 0.3).armR }} x={x + gap * (h / H) + apart * 160} floor={floor} h={h} flip={!hold} />
    </>
  );
};
const S9: React.FC<SP> = ({ f, dur, n }) => {
  const cB = chunk(dur, n, n - 1);
  const crack = ease(interpolate(f, [cB, cB + 10], [0, 1], cl));
  const apart = ease(interpolate(f, [cB + 6, dur], [0, 1], cl));
  return (
    <Stage bg="m04/stonewall.png" cam={{ z: 1.2, fx: 540, fy: 1300 }}>
      <Heart x={545} y={F_WALL - 640} s={spring({ frame: f - 4, fps: FPS, config: { damping: 10 } })} crack={crack} />
      <Couple id="c9" f={f} x={lerp(380, 450, f / dur)} floor={F_WALL} h={H} apart={apart} />
    </Stage>
  );
};
const COURT_X = 640, COURT_Y = 1330;
const S10: React.FC<SP> = ({ f, dur, n, lang }) => {
  // 흑백: 길 끝에 가정법원이 솟아오르고, 시무룩한 부부들이 그쪽으로 걸어감
  const cCourt = chunk(dur, n, 2);
  const rise = spring({ frame: f - cCourt + 4, fps: FPS, config: { damping: 12, stiffness: 120 } });
  const walkT = interpolate(f, [0, dur], [0, 1], cl);
  return (
    <Stage bg="m04/stonewall.png" gray={1} cam={{ z: lerp(1.3, 1.5, ease(walkT)), fx: lerp(580, COURT_X, walkT), fy: lerp(1450, 1380, walkT) }}>
      <Court x={COURT_X} y={COURT_Y} s={0.75 * rise} o={Math.min(1, rise * 1.5)} label={lang === "es" ? "TRIBUNAL DE FAMILIA" : "FAMILY COURT"} />
      {[0, 1].map((k) => {
        const p = interpolate(f, [0, dur], [k * 0.15, 0.45 + k * 0.15], cl);
        const fl = lerp(1700 + k * 40, 1420, p), sc = lerp(1, 0.35, p);
        const x0 = lerp(420 + k * 120, 600, p);
        return (
          <React.Fragment key={k}>
            <Stick id={`c10m${k}`} look={MAN80} pose={{ ...walk(f + k * 9, 0.22), face: "back", head: 8 }} x={x0} floor={fl} h={H * 0.8 * sc} />
            <Stick id={`c10w${k}`} look={WOMAN80} pose={{ ...walk(f + k * 9 + 5, 0.22), face: "back", head: -8 }} x={x0 + 170 * sc} floor={fl} h={H * 0.8 * sc} />
          </React.Fragment>
        );
      })}
    </Stage>
  );
};
const S11: React.FC<SP> = ({ f, dur, n, lang }) => {
  // "The court moved away long ago." 법원이 먹물처럼 흩어짐 → "The story stayed." 컬러로
  const gone = ease(interpolate(f, [0, chunk(dur, n, 2)], [0, 1], cl));
  const col = interpolate(f, [chunk(dur, n, 2), chunk(dur, n, 2) + 14], [1, 0], cl);
  return (
    <Stage bg="m04/stonewall.png" gray={col} cam={{ z: lerp(1.5, 1.2, ease(f / dur)), fx: lerp(COURT_X, 560, ease(f / dur)), fy: lerp(1380, 1300, ease(f / dur)) }}>
      <div style={{ filter: `blur(${gone * 14}px)`, transform: `translateY(${gone * -60}px)` }}>
        <Court x={COURT_X} y={COURT_Y} s={0.75} o={1 - gone} label={lang === "es" ? "TRIBUNAL DE FAMILIA" : "FAMILY COURT"} />
      </div>
    </Stage>
  );
};
const S12: React.FC<SP> = ({ f, dur, n }) => {
  // 손을 꼭 잡고 다가오는 커플 → "Which one would you risk?" 카드 1·2·3 + ?
  const q = chunk(dur, n, n - 1);
  const p = ease(interpolate(f, [0, q], [0, 1], cl));
  const h = H * lerp(0.6, 1.05, p), fl = lerp(1440, 1700, p);
  return (
    <Stage bg="m04/stonewall.png" cam={{ z: 1.15, fx: 540, fy: 1350 }}
      ui={<>
        {[0, 1, 2].map((i) => <NumCard key={i} n={`${i + 1}`} x={330 + i * 210} y={760} f={f} at={q + i * 5} />)}
        <NumCard n="?" x={540} y={520} f={f} at={q + 18} hl />
      </>}>
      <Couple id="c12" f={f} x={lerp(470, 445, p)} floor={fl} h={h} gap={150} />
      {f > 4 && f < q && <Heart x={540} y={fl - h * 1.25} s={0.35 + 0.05 * Math.sin(f * 0.25)} crack={0} />}
    </Stage>
  );
};

const SCENES = [S0, S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12];
const CLOUD = new Set([5, 7, 8]);
const PRE = 18;

// 효과음: 이 화면의 사건에 맞춤
const sfxOf = (i: number, dur: number, n: number, lang: Lang): Fx[] => {
  const c = (k: number) => chunk(dur, n, k);
  switch (i) {
    case 0: return [0, 1, 2].map((k) => ["pop", c(2) + k * 7 + 5, 0.4] as Fx);
    case 1: return [["pop", 5, 0.4], ["ding", Math.round(dur * 0.55), 0.35]];
    case 2: return [["pop", 2, 0.45], ["whoosh", c(Math.max(1, n - 1)), 0.35]];
    case 3: return [["whoosh", c(Math.max(1, n - 2)), 0.45]];
    case 4: return [["glitch", 0, 0.2], ["ding", c(2), 0.35], ["whoosh", c(3), 0.3], ["thud", c(4) + 3, 0.55], ["chime", c(n - 2), 0.3]];
    case 5: return [["pop", 5, 0.4]];
    case 6: { const K = FLYK[lang]; return [["pop", c(K.wind), 0.35], ["glitch", c(K.cheat), 0.3], ["pop", c(K.feed) + 20, 0.4], ["chime", c(K.sprout), 0.3], ["whoosh", c(K.sprout) + 10, 0.55]]; }
    case 7: return [["pop", c(Math.max(1, n - 2)), 0.3], ["ding", c(n - 1), 0.3]];
    case 8: return [["pop", 5, 0.4]];
    case 9: return [["pop", 6, 0.3], ["thud", c(n - 1), 0.5]];
    case 10: return [["glitch", 0, 0.2], ["thud", c(2) + 4, 0.45]];
    case 11: return [["whoosh", 4, 0.35], ["chime", c(2), 0.3]];
    case 12: return [0, 1, 2].map((k) => ["pop", c(n - 1) + k * 5 + 5, 0.4] as Fx).concat([["ding", c(n - 1) + 23, 0.4]]);
    default: return [];
  }
};

const Caption: React.FC<{ cap: Cap }> = ({ cap }) => {
  const frame = useCurrentFrame();
  const pop = spring({ frame, fps: FPS, config: { damping: 12, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 300, display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: "0 22px", textAlign: "center", transform: `scale(${0.85 + 0.15 * pop})` }}>
      {cap.map((x, i) => <span key={i} style={{ fontFamily: sans, fontWeight: 900, fontSize: 86, lineHeight: 1.15, textAlign: "center", color: x.hl ? YELLOW : "#fff", WebkitTextStroke: `14px ${INK}`, paintOrder: "stroke fill", textShadow: "0 6px 14px rgba(42,28,36,0.35)" }}>{x.text}</span>)}
    </div>
  );
};
const CloudWipe: React.FC<{ p: number }> = ({ p }) => {
  const x = lerp(1300, -2300, p);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "#f3ead8", opacity: interpolate(p, [0.25, 0.5, 0.75], [0, 0.9, 0], cl) }} />
      {[{ c: "cloud_03", y: 150, s: 3.2, dx: 0 }, { c: "cloud_01", y: 560, s: 3.6, dx: 380 }, { c: "cloud_03", y: 980, s: 3.4, dx: 120 }, { c: "cloud_01", y: 1380, s: 3.8, dx: 460 }].map((r, i) => (
        <Img key={i} src={staticFile(`m04/${r.c}.png`)} style={{ position: "absolute", left: x + r.dx, top: r.y, height: (r.c === "cloud_03" ? 129 : 116) * r.s }} />
      ))}
    </AbsoluteFill>
  );
};
const ShotS: React.FC<{ i: number; lang: Lang; n: number }> = ({ i, lang, n }) => {
  const f0 = useCurrentFrame();
  const pre = CLOUD.has(i) ? PRE : 0;
  const f = f0 - pre;
  const dur = EP04[lang].frames[i];
  const S = SCENES[i];
  return (
    <AbsoluteFill>
      {(!pre || f0 >= pre * 0.55) && <S f={Math.max(0, f)} dur={dur} n={n} lang={lang} />}
      {pre > 0 && f0 < pre * 1.3 && <CloudWipe p={f0 / (pre * 1.3)} />}
    </AbsoluteFill>
  );
};

export const Ep04Stick: React.FC<{ lang?: Lang }> = ({ lang = "en" }) => {
  const b = EP04[lang];
  const caps = CAPS[lang] as Cap[][];
  return (
    <AbsoluteFill style={{ background: "#f3ead8" }}>
      {SHOTS.map((_, i) => {
        const pre = CLOUD.has(i) ? PRE : 0;
        return (
          <Sequence key={i} from={b.starts[i] - pre} durationInFrames={b.frames[i] + pre}>
            <ShotS i={i} lang={lang} n={caps[i].length} />
            {pre > 0 && <Sequence from={0} layout="none"><Audio src={staticFile("sfx/whoosh.wav")} volume={0.45} /></Sequence>}
            {sfxOf(i, b.frames[i], caps[i].length, lang).map(([name, fr, vol], k) => (
              <Sequence key={k} from={pre + fr} layout="none">
                <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
              </Sequence>
            ))}
          </Sequence>
        );
      })}
      {SHOTS.map((_, i) => {
        const per = b.frames[i] / caps[i].length;
        return (
          <Sequence key={`c${i}`} from={b.starts[i]} durationInFrames={b.frames[i]} layout="none">
            {caps[i].map((c, k) => (
              <Sequence key={k} from={Math.round(k * per)} durationInFrames={Math.round((k + 1) * per) - Math.round(k * per)} layout="none">
                <Caption cap={c} />
              </Sequence>
            ))}
          </Sequence>
        );
      })}
      {b.VO.sentences.map((v) => (
        <Sequence key={v.id} from={b.starts[SHOTS.findIndex((x) => x.sent === v.id)]} layout="none">
          <Audio src={staticFile(v.file)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
