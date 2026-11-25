// EP05 "한국 나이가 줄어든 날" 졸라맨판. 설계도: youtube/scripts/ep05_treatment.md
// 구조: 풍선 하나의 일생 (아기 풍선 "1" → … → 시청자 풍선 "?"). 배경은 민화풍 그림, 사람·풍선·달력·신문은 코드.
import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadNotoSans } from "@remotion/google-fonts/NotoSansKR";
import { loadFont as loadHahmlet } from "@remotion/google-fonts/Hahmlet";
import { EP05 } from "../ep05/Ep05";
import { INK, Look, Stick, stand } from "./Stick";
import { CB, cbAt, Cam, Caption, chunk, CloudWipe, Stage, Stamp } from "./Ep04Stick";

const { fontFamily: sans } = loadNotoSans();
const { fontFamily: serif } = loadHahmlet();
const FPS = 30;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
type Lang = "en" | "es";
type Cap = { text: string; hl?: boolean }[];
type Fx = [string, number, number];
const KX = 1080 / 572, KY = 1920 / 1024;
const H = 520;

// ---------------------------------------------------------------- 공용 그림
// 풍선: 값이 바뀌는 프레임(changeAt)에 통 튀며 숫자가 바뀜
const Balloon: React.FC<{ x: number; y: number; anchorY: number; v: string; f: number; changeAt?: number; prev?: string; color?: string; s?: number; shake?: number; appearAt?: number }> = ({ x, y, anchorY, v, f, changeAt = -999, prev, color = "#f2c14e", s = 1, shake = 0, appearAt = -999 }) => {
  if (f < appearAt) return null;
  const app = appearAt > -999 ? spring({ frame: f - appearAt, fps: FPS, config: { damping: 9, stiffness: 200 } }) : 1;
  const changed = f >= changeAt;
  const pop = changed && changeAt > -999 ? spring({ frame: f - changeAt, fps: FPS, from: 1.35, to: 1, config: { damping: 7, stiffness: 260 } }) : 1;
  const txt = changed || !prev ? v : prev;
  const sway = Math.sin(f * 0.07 + x * 0.01) * 6 + shake;
  const R = 70 * s;
  return (
    <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d={`M${x + sway},${y + R * 1.15} Q${x + sway * 0.5 + 12},${(y + anchorY) / 2} ${x},${anchorY}`} stroke={INK} strokeWidth={3} fill="none" />
      <g transform={`translate(${x + sway},${y}) scale(${app * pop})`}>
        <ellipse rx={R} ry={R * 1.12} fill={color} stroke={INK} strokeWidth={6} />
        <path d={`M${-8},${R * 1.1} l8,${12} l8,-12 z`} fill={color} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <ellipse cx={-R * 0.4} cy={-R * 0.45} rx={R * 0.16} ry={R * 0.26} fill="#fffaf0" opacity={0.7} />
        <text y={R * 0.28} textAnchor="middle" fontFamily={serif} fontWeight={900} fontSize={txt.length > 2 ? R * 0.62 : R * 0.9} fill={INK}>{txt}</text>
      </g>
    </svg>
  );
};
// 강보에 싸인 아기 (침대 위에 누움)
const Baby: React.FC<{ x: number; y: number; s?: number; wiggle?: number }> = ({ x, y, s = 1, wiggle = 0 }) => (
  <svg width={1} height={1} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
    <g transform={`scale(${s}) rotate(${wiggle})`} stroke={INK} strokeWidth={5}>
      <ellipse cx={22} cy={0} rx={52} ry={26} fill="#f3d6d6" />
      <path d="M0,-18 Q22,-6 6,20" fill="none" strokeWidth={3} />
      <circle cx={-44} cy={-6} r={26} fill="#f6efe0" />
      <path d="M-58,-26 q8,-10 16,-2" fill="none" strokeWidth={3.5} />
    </g>
  </svg>
);
// 벽 달력 종이 (달력 틀 안에 꼭 맞게), 바뀔 때 위로 넘어감
const CAL = { x: 113 * KX, y: 355 * KY, w: 112 * KX, h: 80 * KY };
const Calendar: React.FC<{ a: string; b?: string; f: number; flipAt?: number }> = ({ a, b, f, flipAt = 99999 }) => {
  const p = interpolate(f, [flipAt, flipAt + 10], [0, 1], cl);
  const page = (txt: string, red: boolean) => (
    <div style={{ position: "absolute", inset: 0, background: "#fbf7ee", border: `5px solid ${INK}`, display: "flex", flexDirection: "column" }}>
      <div style={{ height: "28%", background: red ? "#e2574c" : "#26386b", borderBottom: `4px solid ${INK}` }} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontWeight: 900, fontSize: Math.min(CAL.h * 0.42, (CAL.w - 30) / (txt.length * 0.62)), color: INK, whiteSpace: "nowrap" }}>{txt}</div>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: CAL.x + 4, top: CAL.y + 4, width: CAL.w - 8, height: CAL.h - 8, perspective: 600, overflow: "hidden" }}>
      {b && p > 0 && page(b, true)}
      {p < 1 && <div style={{ position: "absolute", inset: 0, transform: `translateY(${-p * 100}%) rotate(${-p * 8}deg)`, transformOrigin: "50% 0" }}>{page(a, false)}</div>}
    </div>
  );
};
// 창밖 불꽃
const WIN = { x0: 250 * KX, x1: 568 * KX, y0: 262 * KY, y1: 470 * KY };
const Fireworks: React.FC<{ f: number; at: number[] }> = ({ f, at }) => (
  <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    <defs><clipPath id="win5"><rect x={WIN.x0} y={WIN.y0} width={WIN.x1 - WIN.x0} height={WIN.y1 - WIN.y0} /></clipPath></defs>
    <g clipPath="url(#win5)">
      {at.map((t0, i) => {
        const a = f - t0;
        if (a < 0 || a > 28) return null;
        const k = a / 28;
        const cx = lerp(WIN.x0, WIN.x1, [0.3, 0.7, 0.5][i % 3]), cy = lerp(WIN.y0, WIN.y1, [0.35, 0.3, 0.45][i % 3]);
        const col = ["#f2c14e", "#e2574c", "#9fd8c8"][i % 3];
        return Array.from({ length: 12 }, (_, j) => {
          const ang = (j / 12) * Math.PI * 2, r1 = 20 + 90 * ease(k), r0 = r1 * 0.55;
          return <line key={`${i}-${j}`} x1={cx + Math.cos(ang) * r0} y1={cy + Math.sin(ang) * r0} x2={cx + Math.cos(ang) * r1} y2={cy + Math.sin(ang) * r1} stroke={col} strokeWidth={6} strokeLinecap="round" opacity={1 - k} />;
        });
      })}
    </g>
  </svg>
);
// 신문 1면 (하늘에서 떨어짐)
const Newspaper: React.FC<{ f: number; at: number; outAt: number; lang: Lang }> = ({ f, at, outAt, lang }) => {
  if (f < at) return null;
  const d = spring({ frame: f - at, fps: FPS, config: { damping: 12, stiffness: 160 } });
  const out = ease(interpolate(f, [outAt, outAt + 14], [0, 1], cl));
  return (
    <div style={{ position: "absolute", left: 140, top: 560 + (1 - d) * -1200 + out * -1400, width: 800, height: 620, transform: `rotate(${(1 - d) * -12 - 3 + out * 20}deg)` }}>
      <div style={{ position: "absolute", inset: 0, background: "#f4efe2", border: `10px solid ${INK}`, boxShadow: "14px 16px 0 rgba(42,28,36,0.25)" }} />
      <div style={{ position: "absolute", left: 40, right: 40, top: 30, height: 60, borderBottom: `6px solid ${INK}`, fontFamily: serif, fontWeight: 900, fontSize: 46, color: INK, textAlign: "center" }}>{lang === "es" ? "EL DIARIO" : "THE DAILY"}</div>
      <div style={{ position: "absolute", left: 40, right: 40, top: 120, fontFamily: sans, fontWeight: 900, fontSize: 96, color: INK, textAlign: "center", lineHeight: 1.05 }}>{lang === "es" ? "EDAD NUEVA" : "AGE RESET"}</div>
      <div style={{ position: "absolute", left: 40, right: 40, top: 240, fontFamily: serif, fontWeight: 900, fontSize: 120, color: "#c8322a", textAlign: "center" }}>2023.6</div>
      {[0, 1, 2, 3].map((k) => <div key={k} style={{ position: "absolute", left: 60, right: 60, top: 420 + k * 40, height: 14, background: "#c9bfae", borderRadius: 7 }} />)}
    </div>
  );
};

// ---------------------------------------------------------------- 장면
type SP = { f: number; dur: number; n: number; lang: Lang; cb: number[] };
// 아기 침대 매트리스 위치(가운데 x, 누운 높이)
const CRIBS = [160, 290, 420].map((x) => [x * KX, 572 * KY] as const);
const BALLOON_Y = 455 * KY - 40;

const S0: React.FC<SP> = ({ cb, f, dur, n }) => {
  // 첫 프레임부터 아기 풍선 "1" → "two years old"에서 "2"
  const c2 = cbAt(cb, 2);
  const [bx, by] = CRIBS[1];
  return (
    <Stage bg="m05/nursery.png" cam={{ z: lerp(1.15, 1.6, ease(f / dur)), fx: bx, fy: lerp(1000, 950, f / dur) }}>
      {CRIBS.map(([x, y], i) => <Baby key={i} x={x} y={y} s={0.8} wiggle={i === 1 ? Math.sin(f * 0.2) * 3 : 0} />)}
      <Balloon x={bx} y={BALLOON_Y} anchorY={by - 20} v="2" prev="1" f={f} changeAt={c2} />
    </Stage>
  );
};
const S1: React.FC<SP> = ({ cb, f, dur, n }) => {
  // "December 31st?" 달력 클로즈업 → "You're one" 아기 풍선 "1" 등장
  const c1 = cbAt(cb, 1), c2 = cbAt(cb, 2);
  const [bx, by] = CRIBS[1];
  const cam: Cam = f < c2 ? { z: f < c1 ? 1.4 : 2.6, fx: CAL.x + CAL.w / 2, fy: CAL.y + CAL.h / 2 + 40 } : { z: 1.6, fx: bx, fy: 950 };
  return (
    <Stage bg="m05/nursery.png" cam={cam}>
      <Calendar a="12/31" f={f} />
      <Baby x={bx} y={by} s={0.8} wiggle={Math.sin(f * 0.6) * 6} />
      <Balloon x={bx} y={BALLOON_Y} anchorY={by - 20} v="1" f={f} appearAt={c2 + 4} />
    </Stage>
  );
};
const S2: React.FC<SP> = ({ cb, f, dur, n }) => {
  // 불꽃 → 달력 1/1 → 모든 아기 풍선 +1 → "Two."
  const c1 = cbAt(cb, 1), c2 = cbAt(cb, 2), c4 = cbAt(cb, 4);
  const cam: Cam = f < c1 ? { z: 1.3, fx: (WIN.x0 + WIN.x1) / 2, fy: 900 } : f < c2 ? { z: 2.6, fx: CAL.x + CAL.w / 2, fy: CAL.y + CAL.h / 2 + 40 } : f < c4 ? { z: 1.05, fx: 540, fy: 1000 } : { z: 1.9, fx: CRIBS[1][0], fy: 920 };
  const sh = f >= c4 && f < c4 + 8 ? Math.sin((f - c4) * 2.5) * 8 : 0;
  return (
    <Stage bg="m05/nursery.png" cam={{ ...cam, fx: cam.fx + sh }}>
      <Fireworks f={f} at={[2, 10, 18, c2 + 4]} />
      <Calendar a="12/31" b="1/1" f={f} flipAt={c1 + 4} />
      {CRIBS.map(([x, y], i) => (
        <React.Fragment key={i}>
          <Baby x={x} y={y} s={0.8} />
          <Balloon x={x} y={BALLOON_Y + (i === 1 ? 0 : 30)} anchorY={y - 20} v="2" prev="1" f={f} appearAt={i === 1 ? -999 : c2} changeAt={c2 + 10 + i * 4} color={["#9fd8c8", "#f2c14e", "#f4a9a0"][i]} s={i === 1 ? 1 : 0.8} />
        </React.Fragment>
      ))}
    </Stage>
  );
};
// 거실: 어른 머리 위 풍선이 세 개로 (한국 나이 · 연 나이 · 만 나이)
const KY_T = 716 * KY;
const AGES: Record<Lang, string[]> = { en: ["KOREAN", "YEAR", "INT'L"], es: ["COREANA", "POR AÑO", "INTERNAC."] };
const S3: React.FC<SP> = ({ cb, f, dur, n, lang }) => {
  const c = (k: number) => cbAt(cb, k);
  const vals = ["26", "25", "24"], cols = ["#f2c14e", "#9fd8c8", "#f4a9a0"];
  const at = [6, c(1) + 4, c(2) + 4];
  const bounce = f >= c(4) ? Math.abs(Math.sin((f - c(4)) * 0.4)) * 14 * Math.max(0, 1 - (f - c(4)) / 30) : 0;
  return (
    <Stage bg="m04v2/home_table.png" cam={{ z: lerp(1.3, 1.38, ease(f / dur)), fx: 540, fy: 1150 }}>
      <Stick id="a5" look={{ kind: "man", accent: "#3e8e7e" }} pose={{ ...stand(f), armR: f >= c(3) ? [-150, -20] : [-6, 4] }} x={540} floor={1470} h={H * 0.95} />
      <Img src={staticFile("m04v2/home_table.png")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, clipPath: `inset(${KY_T}px 0 0 0)` }} />
      {[0, 1, 2].map((i) => (
        <React.Fragment key={i}>
          <Balloon x={330 + i * 210} y={930 - bounce} anchorY={1110} v={vals[i]} f={f} appearAt={at[i]} color={cols[i]} s={0.85} />
          {f >= at[i] && <div style={{ position: "absolute", left: 330 + i * 210 - 95, top: 1015 - bounce, width: 190, textAlign: "center", fontFamily: sans, fontWeight: 900, fontSize: 28, color: INK, background: "#f6efe0", border: `4px solid ${INK}`, borderRadius: 12, padding: "2px 0" }}>{AGES[lang][i]}</div>}
        </React.Fragment>
      ))}
    </Stage>
  );
};
// 공원: 사람들 머리 위 풍선
const F_PARK = 1640;
const CROWD = [
  { x: 150, from: "34", to: "33", look: { kind: "man", accent: "#26386b" } as Look, h: 0.92 },
  { x: 345, from: "27", to: "25", look: { kind: "woman", accent: "#e2574c" } as Look, h: 0.9 },
  { x: 540, from: "61", to: "60", look: { kind: "old", accent: "#8a6a4a" } as Look, h: 0.86 },
  { x: 735, from: "19", to: "18", look: { kind: "man", accent: "#f2c14e" } as Look, h: 0.84 },
  { x: 930, from: "45", to: "44", look: { kind: "woman", accent: "#3e8e7e" } as Look, h: 0.9 },
];
const S4: React.FC<SP> = ({ cb, f, dur, n, lang }) => {
  // 신문 쾅 → 날아가며 공원 사람들 → "Overnight"부터 풍선 숫자가 차례로 줄어듦
  const c = (k: number) => cbAt(cb, k);
  const drop = n >= 6 ? c(4) : c(3);
  return (
    <Stage bg="m04/park.png" cam={{ z: lerp(1.05, 1.15, ease(f / dur)), fx: 540, fy: 1300 }} gray={0}
      ui={<Newspaper f={f} at={0} outAt={c(3) - 6} lang={lang} />}>
      {CROWD.map((p, i) => (
        <React.Fragment key={i}>
          <Stick id={`p5${i}`} look={p.look} pose={f >= drop + 6 + i * 5 ? { ...stand(f + i * 7), armR: [-140, -10], bob: Math.abs(Math.sin((f + i) * 0.5)) * 6 } : stand(f + i * 7)} x={p.x} floor={F_PARK} h={H * p.h * 0.8} flip={i > 2} />
          <Balloon x={p.x} y={F_PARK - H * p.h * 0.8 * 1.05 - 120} anchorY={F_PARK - H * p.h * 0.8 * 0.95} v={p.to} prev={p.from} f={f} changeAt={drop + 6 + i * 5} color={["#f2c14e", "#f4a9a0", "#9fd8c8", "#f2c14e", "#f4a9a0"][i]} s={0.75} />
        </React.Fragment>
      ))}
    </Stage>
  );
};
const S5: React.FC<SP> = ({ cb, f, dur, n, lang }) => {
  // 군대 정문: 풍선이 줄어들려다 그대로(흔들림) → 편의점도 그대로 → BY YEAR 도장
  const c = (k: number) => cbAt(cb, k);
  const store = f >= c(2);
  const tryAt = store ? c(2) + 10 : c(1);
  const shake = f >= tryAt && f < tryAt + 18 ? Math.sin((f - tryAt) * 1.6) * 14 * (1 - (f - tryAt) / 18) : 0;
  const look: Look = store ? { kind: "man", accent: "#e2574c" } : { kind: "man", accent: "#6b7a3a" };
  const x = store ? 300 : 260, floor = store ? 1560 : 1560;
  return (
    <Stage bg={store ? "m05/store.png" : "m05/army.png"} cam={{ z: 1.25, fx: 420, fy: 1250 }}
      ui={<Stamp word={lang === "es" ? "POR AÑO" : "BY YEAR"} x={760} y={900} f={f} at={c(3) + 4} />}>
      <Stick id="x5" look={look} pose={store ? { ...stand(f), armR: [-60, -30] } : { ...stand(f), armL: [0, 0], armR: [0, 0] }} x={x} floor={floor} h={H * 0.9} />
      <Balloon x={x} y={floor - H * 0.9 * 1.05 - 120} anchorY={floor - H * 0.9 * 0.95} v={store ? "19" : "21"} f={f} shake={shake} s={0.8} />
    </Stage>
  );
};
const S6: React.FC<SP> = ({ cb, f }) => {
  // 빈자리에 "?" 풍선이 내려옴 — 시청자의 풍선
  const d = spring({ frame: f - 2, fps: FPS, config: { damping: 11, stiffness: 120 } });
  return (
    <Stage bg="m04/park.png" cam={{ z: 1.1, fx: 540, fy: 1250 }}>
      <Balloon x={540} y={lerp(-300, 1000, d)} anchorY={lerp(-300, 1000, d) + 420} v="?" f={f} s={1.8} />
    </Stage>
  );
};

const SCENES = [S0, S1, S2, S3, S4, S5, S6];
const CLOUD = new Set([3, 4, 6]);
const PRE = 18;
const sfxOf = (i: number, dur: number, n: number, cb: number[] = []): Fx[] => {
  const c = (k: number) => cbAt(cb, k);
  switch (i) {
    case 0: return [["pop", c(2), 0.45]];
    case 1: return [["thud", c(1), 0.4], ["pop", c(2) + 4, 0.45]];
    case 2: return [["pop", 4, 0.35], ["pop", 12, 0.3], ["pop", 20, 0.3], ["whoosh", c(1) + 4, 0.4], ["pop", c(2) + 6, 0.4], ["pop", c(2) + 10, 0.4], ["pop", c(2) + 14, 0.4], ["thud", c(4), 0.5]];
    case 3: return [["pop", 6, 0.4], ["pop", c(1) + 4, 0.4], ["pop", c(2) + 4, 0.4], ["ding", c(4), 0.4]];
    case 4: { const d = n >= 6 ? c(4) : c(3); return [["thud", 6, 0.5], ["whoosh", c(3) - 6, 0.4], ...[0, 1, 2, 3, 4].map((k) => ["pop", d + 6 + k * 5, 0.35] as Fx)]; }
    case 5: return [["glitch", 0, 0.25], ["buzz", c(1), 0.25], ["whoosh", c(2), 0.4], ["buzz", c(2) + 10, 0.25], ["thud", c(3) + 6, 0.55]];
    case 6: return [["ding", 14, 0.4]];
    default: return [];
  }
};

const ShotS: React.FC<{ i: number; lang: Lang; n: number }> = ({ i, lang, n }) => {
  const f0 = useCurrentFrame();
  const pre = CLOUD.has(i) ? PRE : 0;
  const f = f0 - pre;
  const S = SCENES[i];
  return (
    <AbsoluteFill>
      {(!pre || f0 >= pre * 0.55) && <S cb={CB.ep05[lang][i]} f={Math.max(0, f)} dur={EP05[lang].frames[i]} n={n} lang={lang} />}
      {pre > 0 && f0 < pre * 1.3 && <CloudWipe p={f0 / (pre * 1.3)} />}
    </AbsoluteFill>
  );
};
export const Ep05Stick: React.FC<{ lang?: Lang }> = ({ lang = "en" }) => {
  const b = EP05[lang];
  const caps = b.caps as Cap[][];
  return (
    <AbsoluteFill style={{ background: "#f3ead8" }}>
      {caps.map((_, i) => {
        const pre = CLOUD.has(i) ? PRE : 0;
        return (
          <Sequence key={i} from={b.starts[i] - pre} durationInFrames={b.frames[i] + pre}>
            <ShotS i={i} lang={lang} n={caps[i].length} />
            {pre > 0 && <Sequence from={0} layout="none"><Audio src={staticFile("sfx/whoosh.wav")} volume={0.45} /></Sequence>}
            {sfxOf(i, b.frames[i], caps[i].length, CB.ep05[lang][i]).map(([name, fr, vol], k) => (
              <Sequence key={k} from={pre + fr} layout="none"><Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} /></Sequence>
            ))}
          </Sequence>
        );
      })}
      {caps.map((cs, i) => {
        const per = b.frames[i] / cs.length;
        return (
          <Sequence key={`c${i}`} from={b.starts[i]} durationInFrames={b.frames[i]} layout="none">
            {cs.map((c, k) => (
              <Sequence key={k} from={CB.ep05[lang][i][k]} durationInFrames={CB.ep05[lang][i][k + 1] - CB.ep05[lang][i][k]} layout="none"><Caption cap={c} /></Sequence>
            ))}
          </Sequence>
        );
      })}
      {b.VO.sentences.map((v, i) => (
        <Sequence key={v.id} from={b.starts[i]} layout="none"><Audio src={staticFile(v.file)} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
