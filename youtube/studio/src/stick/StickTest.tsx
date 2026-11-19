// 먹선 졸라맨 시험: EP04 문장 1~3 (신발 선물 → 운동화가 혼자 걸어감 → 신고 떠남). 배경은 사람 없는 공원 그림.
import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadNotoSans } from "@remotion/google-fonts/NotoSansKR";
import { CAPS, EP04 } from "../ep04/Ep04";
import { INK, Look, Pose, ShoeArt, Stick, stand, walk } from "./Stick";

const { fontFamily: sans } = loadNotoSans();
const FPS = 30;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const b = EP04.en;
const S0 = b.starts[1];
export const STICK_TEST_FRAMES = b.starts[4] - S0;
const SH = b.frames[1], WK = b.frames[2], AW = b.frames[3];
const MAN: Look = { kind: "man", accent: "#3e8e7e" };
const WOMAN: Look = { kind: "woman", accent: "#e2574c" };
const FLOOR = 1640;
const SNEAK = "#f6f3ea";

// 선물 상자 (먹선)
export const GiftBox: React.FC<{ x: number; y: number; open: number; s?: number }> = ({ x, y, open, s = 1 }) => (
  <svg width={140 * s} height={160 * s} viewBox="-70 -110 140 160" style={{ position: "absolute", left: x - 70 * s, top: y - 110 * s, overflow: "visible" }}>
    <g stroke={INK} strokeWidth={6} strokeLinejoin="round">
      <rect x={-50} y={-40} width={100} height={78} rx={6} fill="#f2c14e" />
      <rect x={-8} y={-40} width={16} height={78} fill="#3e8e7e" />
      <g transform={`translate(0,${-open * 230}) rotate(${open * 25})`} opacity={1 - open}>
        <rect x={-56} y={-56} width={112} height={20} rx={5} fill="#f2c14e" />
        <rect x={-8} y={-56} width={16} height={20} fill="#3e8e7e" />
        <path d="M0,-56 q-28,-26 -30,-6 q8,10 30,6 q28,-26 30,-6 q-8,10 -30,6" fill="#3e8e7e" />
      </g>
    </g>
  </svg>
);
const Shoe = ShoeArt;
export const Sneakers: React.FC<{ x: number; y: number; s?: number; hop?: number; flip?: boolean }> = ({ x, y, s = 1, hop = 0, flip }) => (
  <svg width={180 * s} height={80 * s} viewBox="-30 -20 180 80" style={{ position: "absolute", left: x - 90 * s, top: y - 70 * s, overflow: "visible", transform: flip ? "scaleX(-1)" : undefined }}>
    {[0, 1].map((k) => {
      const ph = Math.sin(hop + k * Math.PI);
      return (
        <g key={k} transform={`translate(${k ? 22 : -18},${(k ? 4 : 0) - Math.max(0, ph) * 24}) rotate(${-ph * 8} 60 44)`}>
          <Shoe />
        </g>
      );
    })}
  </svg>
);

const Caption: React.FC<{ cap: { text: string; hl?: boolean }[] }> = ({ cap }) => {
  const f = useCurrentFrame();
  const pop = spring({ frame: f, fps: FPS, config: { damping: 12, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 300, display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: "0 22px", textAlign: "center", transform: `scale(${0.85 + 0.15 * pop})` }}>
      {cap.map((x, i) => <span key={i} style={{ fontFamily: sans, fontWeight: 900, fontSize: 86, lineHeight: 1.15, textAlign: "center", color: x.hl ? "#ffd23a" : "#fff", WebkitTextStroke: `14px ${INK}`, paintOrder: "stroke fill" }}>{x.text}</span>)}
    </div>
  );
};

export const StickTest: React.FC = () => {
  const f = useCurrentFrame();
  // ---- 장면 1: 남자가 걸어 들어와 상자를 내밀고(앞 절반) → 여자가 열면 신발이 튀어나옴
  const f1 = f, f2 = f - SH, f3 = f - SH - WK;
  let man: Pose, woman: Pose, manX = 390, womX = 700, womFlip = true, womShoes = false, womScale = 1, womFloor = FLOOR, womO = 1;
  let box: React.ReactNode = null, shoes: React.ReactNode = null;
  let cam = { z: 1, fx: 540, fy: 1250 };
  if (f2 < 0) {
    const t = f1 / SH;
    const inT = Math.min(1, t / 0.35);
    manX = lerp(-120, 390, ease(inT));
    man = inT < 1 ? walk(f1) : { ...stand(f1), armR: [-75, -10], armL: [-60, -20], face: "smile" };
    const opened = interpolate(t, [0.55, 0.7], [0, 1], cl);
    woman = opened > 0.3 ? { ...stand(f1), armR: [-115, 10], armL: [-100, 0], face: "o", bob: 6 * Math.abs(Math.sin(f1 * 0.5)) } : { ...stand(f1), face: "smile" };
    const bx = inT < 1 ? manX + 130 : lerp(manX + 130, 545, interpolate(t, [0.38, 0.5], [0, 1], cl));
    box = <GiftBox x={bx} y={FLOOR - 200} open={opened} s={1.3} />;
    if (opened > 0.2) {
      const p = spring({ frame: f1 - Math.round(SH * 0.6), fps: FPS, config: { damping: 9, stiffness: 180 } });
      shoes = <Sneakers x={520} y={FLOOR - 300 - p * 150} s={1.4} />;
    }
    cam = { z: lerp(1.0, 1.25, ease(t)), fx: 560, fy: 1350 };
  } else if (f3 < 0) {
    // ---- 장면 2: "Shoes take you places." 여자가 바로 신고(쏙) 신나서 통통 걸어봄 → "Including away." 뒤돌아 길 쪽을 봄
    const t = f2 / WK;
    womShoes = true;
    const snap = spring({ frame: f2, fps: FPS, config: { damping: 8, stiffness: 240 } });
    const strut = interpolate(t, [0.15, 0.6], [0, 1], cl);
    const turned = t > 0.66;
    womX = 700 + Math.sin(strut * Math.PI) * 120;
    womFlip = !(strut > 0 && strut < 0.5);
    woman = turned ? { ...stand(f2), face: "back", head: -8 } : strut > 0 && strut < 1 ? { ...walk(f2, 0.45), armR: [-130, 0], armL: [-120, 0] } : { ...stand(f2), bob: (1 - snap) * -18 };
    man = { ...stand(f2), armR: [-40, -20] };
    cam = turned ? { z: 1.4, fx: 640, fy: 1350 } : { z: lerp(1.6, 1.3, ease(t)), fx: 700, fy: 1500 };
  } else {
    // ---- 장면 3: "The saying goes: give your partner shoes," 남자가 기대하며 다가감 → "and they'll use them" 신은 발 가까이 → "to walk away from you." 신은 채로 걸어가 버림
    const t = f3 / AW;
    womShoes = true;
    const go = interpolate(t, [0.6, 1], [0, 1], cl);
    womFlip = go <= 0;
    womX = lerp(700, 610, ease(go));
    womFloor = lerp(FLOOR, 1330, ease(go));
    womScale = lerp(1, 0.38, ease(go));
    womO = interpolate(t, [0.92, 1], [1, 0.0], cl);
    woman = go > 0 ? { ...walk(f3), face: "back" } : { ...stand(f3) };
    manX = go > 0 ? 390 : lerp(390, 470, ease(interpolate(t, [0, 0.3], [0, 1], cl)));
    man = go > 0.2 ? { armL: [2, 0], armR: [-2, 0], head: -6, lean: -3, bob: -4 } : { ...stand(f3), armR: [-70, -10] };
    cam = t < 0.3 ? { z: 1.2, fx: 560, fy: 1350 } : go <= 0 ? { z: 2.2, fx: 700, fy: FLOOR - 40 } : { z: lerp(1.35, 1.15, ease(go)), fx: lerp(640, 500, ease(go)), fy: lerp(1450, 1350, ease(go)) };
  }
  const H = 520;
  const caps = (CAPS.en as { text: string; hl?: boolean }[][][]).slice(1, 4);
  return (
    <AbsoluteFill style={{ background: "#f3ead8" }}>
      <AbsoluteFill style={{ transform: `translate(${540 - Math.min(1080 - 540 / cam.z, Math.max(540 / cam.z, cam.fx)) * cam.z}px, ${960 - Math.min(1920 - 960 / cam.z, Math.max(960 / cam.z, cam.fy)) * cam.z}px) scale(${cam.z})`, transformOrigin: "0 0" }}>
        <Img src={staticFile("m04/park.png")} style={{ width: 1080, height: 1920 }} />
        <Stick id="m" look={MAN} pose={man} x={manX} floor={FLOOR} h={H} />
        <div style={{ opacity: womO }}>
          <Stick id="w" look={{ ...WOMAN, shoes: womShoes ? SNEAK : undefined }} pose={woman} x={womX} floor={womFloor} h={H * womScale} flip={womFlip} />
        </div>
        {box}
        {shoes}
      </AbsoluteFill>
      {[SH, WK, AW].map((d, i) => {
        const st = [0, SH, SH + WK][i];
        const c = caps[i];
        const per = d / c.length;
        return c.map((cap, k) => (
          <Sequence key={`${i}-${k}`} from={Math.round(st + k * per)} durationInFrames={Math.round(per)} layout="none">
            <Caption cap={cap} />
          </Sequence>
        ));
      })}
      {[1, 2, 3].map((id, i) => (
        <Sequence key={id} from={[0, SH, SH + WK][i]} layout="none">
          <Audio src={staticFile(`ep04/vo_en/s${id}.wav`)} />
        </Sequence>
      ))}
      <Sequence from={Math.round(SH * 0.55)} layout="none"><Audio src={staticFile("sfx/pop.wav")} volume={0.45} /></Sequence>
      <Sequence from={SH + 2} layout="none"><Audio src={staticFile("sfx/pop.wav")} volume={0.5} /></Sequence>
            <Sequence from={SH + WK + Math.round(AW * 0.6)} layout="none"><Audio src={staticFile("sfx/whoosh.wav")} volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};
