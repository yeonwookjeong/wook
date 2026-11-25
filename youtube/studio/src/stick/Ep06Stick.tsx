// EP06 "외동인데 '우리 엄마'" 졸라맨판. 배경은 민화풍 그림(m06, m04v2), 사람·말풍선·꼬리표·간판 글씨는 코드.
// 장면은 자막 덩어리(chunk) 박자에 맞춰 움직이고, 효과음도 그 사건에 맞춘다.
import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadNotoSans } from "@remotion/google-fonts/NotoSansKR";
import { EP06, WORDS } from "../ep06/Ep06";
import { INK, Look, Pose, Stick, stand, walk } from "./Stick";
import { Caption, chunk, CloudWipe, NumCard, Stage } from "./Ep04Stick";

const { fontFamily: sans } = loadNotoSans();
const FPS = 30;
const YELLOW = "#ffd23a";
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
type Lang = "en" | "es";
type Cap = { text: string; hl?: boolean }[];
type Fx = [string, number, number];
const H = 520;
// m06 그림(768x1376) → 무대(1080x1920)
const X = (x: number) => (x * 1080) / 768;
const Y = (y: number) => (y * 1920) / 1376;

const KID: Look = { kind: "man", accent: "#f2c14e" };
const MOM: Look = { kind: "woman", accent: "#e2574c" };
const DAD: Look = { kind: "man", accent: "#26386b" };
const BOSS: Look = { kind: "old", accent: "#c8322a" };
const WORKERS: Look[] = [{ kind: "man", accent: "#3e8e7e" }, { kind: "woman", accent: "#f2c14e" }, { kind: "man", accent: "#9fd8c8" }, { kind: "woman", accent: "#26386b" }];

// ---------------------------------------------------------------- 공용 그림
// 말풍선 (꼬리는 아래쪽 tail 위치를 가리킴). crack 0..1 이면 쩍 갈라지며 사라짐
const Bubble: React.FC<{ text: string; x: number; y: number; f: number; at: number; tailX?: number; tailY?: number; color?: string; crack?: number; s?: number }> = ({ text, x, y, f, at, tailX, tailY, color = "#f6efe0", crack = 0, s = 1 }) => {
  if (f < at) return null;
  const k = spring({ frame: f - at, fps: FPS, config: { damping: 10, stiffness: 220 } }) * s;
  const fs = Math.min(54, 430 / (text.length * 0.62));
  const w = Math.max(260, text.length * fs * 0.62 + 80), h = 120;
  const tx = tailX ?? x, ty = tailY ?? y + 140;
  const half = (side: -1 | 1) => (
    <g transform={`translate(${side * crack * 50},${crack * 60}) rotate(${side * crack * 10} ${x} ${y})`} opacity={1 - crack * 0.8}>
      <g clipPath={`url(#bh${side}${at})`}>
        <path d={`M${x - w / 2 + 30},${y - h / 2} h${w - 60} a30,30 0 0 1 30,30 v${h - 60} a30,30 0 0 1 -30,30 H${x + 24} L${tx},${ty} L${x - 6},${y + h / 2} H${x - w / 2 + 30} a30,30 0 0 1 -30,-30 v${-(h - 60)} a30,30 0 0 1 30,-30 z`} fill={color} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <text x={x} y={y + 18} textAnchor="middle" fontFamily={sans} fontWeight={900} fontSize={fs} fill={INK}>{text}</text>
      </g>
    </g>
  );
  return (
    <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <clipPath id={`bh-1${at}`}><path d={`M${x - 2000},${y - 1000} L${x + 6},${y - 1000} L${x - 14},${y - 10} L${x + 10},${y + 20} L${x - 4},${y + 1000} L${x - 2000},${y + 1000} Z`} /></clipPath>
        <clipPath id={`bh1${at}`}><path d={`M${x + 2000},${y - 1000} L${x + 6},${y - 1000} L${x - 14},${y - 10} L${x + 10},${y + 20} L${x - 4},${y + 1000} L${x + 2000},${y + 1000} Z`} /></clipPath>
      </defs>
      <g transform={`translate(${x},${y}) scale(${k}) translate(${-x},${-y})`}>
        {crack > 0 ? <>{half(-1)}{half(1)}</> : (
          <>
            <path d={`M${x - w / 2 + 30},${y - h / 2} h${w - 60} a30,30 0 0 1 30,30 v${h - 60} a30,30 0 0 1 -30,30 H${x + 24} L${tx},${ty} L${x - 6},${y + h / 2} H${x - w / 2 + 30} a30,30 0 0 1 -30,-30 v${-(h - 60)} a30,30 0 0 1 30,-30 z`} fill={color} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
            <text x={x} y={y + 18} textAnchor="middle" fontFamily={sans} fontWeight={900} fontSize={fs} fill={INK}>{text}</text>
          </>
        )}
      </g>
    </svg>
  );
};
// 꼬리표 (끈으로 물건에 매달림)
const Tag: React.FC<{ text: string; x: number; y: number; f: number; at: number; s?: number }> = ({ text, x, y, f, at, s = 1 }) => {
  if (f < at) return null;
  const k = spring({ frame: f - at, fps: FPS, config: { damping: 9, stiffness: 220 } }) * s;
  const sw = Math.sin((f - at) * 0.15) * 4 * Math.max(0, 1 - (f - at) / 60);
  const fs = text.length > 11 ? 32 : 40;
  const w = Math.max(200, text.length * fs * 0.72 + 50);
  const cx = Math.min(1060 - w / 2, Math.max(20 + w / 2, x));
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: y, width: w, transform: `scale(${k}) rotate(${sw}deg)`, transformOrigin: "50% -40px" }}>
      <div style={{ position: "absolute", left: x - cx + w / 2 - 2, top: -40, width: 4, height: 40, background: INK }} />
      <div style={{ background: YELLOW, border: `7px solid ${INK}`, borderRadius: 14, padding: "8px 0", textAlign: "center", fontFamily: sans, fontWeight: 900, fontSize: fs, color: INK, boxShadow: "6px 8px 0 rgba(42,28,36,0.25)" }}>{text}</div>
    </div>
  );
};
// 책상 명패 글씨
const PlateText: React.FC<{ text: string; f: number; at: number }> = ({ text, f, at }) => (
  <div style={{ position: "absolute", left: X(236), top: Y(810), width: X(310) - X(236), height: Y(830) - Y(810), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 900, fontSize: 26, color: INK, opacity: f >= at ? 1 : 0, transform: `scale(${f >= at ? spring({ frame: f - at, fps: FPS, config: { damping: 9 } }) : 0})` }}>{text}</div>
);
// 간판 글씨 (세로 간판에 '우리○○'가 켜짐)
const SIGNS = [
  { x0: 40, x1: 130, y0: 297, y1: 545, txt: "우리약국" },
  { x0: 178, x1: 238, y0: 485, y1: 630, txt: "우리분식" },
  { x0: 534, x1: 594, y0: 484, y1: 662, txt: "우리마트" },
  { x0: 470, x1: 512, y0: 622, y1: 728, txt: "우리집" },
];
const SignText: React.FC<{ i: number; f: number; at: number }> = ({ i, f, at }) => {
  const S = SIGNS[i];
  const on = f >= at;
  const k = on ? spring({ frame: f - at, fps: FPS, config: { damping: 12 } }) : 0;
  const w = X(S.x1) - X(S.x0), h = Y(S.y1) - Y(S.y0);
  const fs = Math.min(w * 0.7, (h * 0.86) / S.txt.length);
  return (
    <div style={{ position: "absolute", left: X(S.x0), top: Y(S.y0), width: w, height: h, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: on ? `rgba(255,236,170,${0.85 * k})` : "transparent", boxShadow: on ? `0 0 ${30 * k}px rgba(255,210,90,${0.9 * k})` : undefined }}>
      {on && S.txt.split("").map((c, j) => <span key={j} style={{ fontFamily: sans, fontWeight: 900, fontSize: fs, lineHeight: 1.02, color: j < 2 ? "#c8322a" : INK, opacity: k }}>{c}</span>)}
    </div>
  );
};

// ---------------------------------------------------------------- 장면
type SP = { f: number; dur: number; n: number; lang: Lang };
const T_TOP = 716 * (1920 / 1024); // 거실 식탁 윗선
const TableFront: React.FC = () => <Img src={staticFile("m04v2/home_table.png")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, clipPath: `inset(${T_TOP}px 0 0 0)` }} />;

const S0: React.FC<SP> = ({ f, dur, n, lang }) => {
  // "You're an only child." 아이 혼자(엄마 옆) → "But in Korea," MY MOM 말풍선 → "our mom." 쩍 갈라지고 OUR MOM
  const W = WORDS[lang];
  const c1 = chunk(dur, n, 1), c2 = chunk(dur, n, 2);
  const crack = ease(interpolate(f, [c2, c2 + 8], [0, 1], cl));
  return (
    <Stage bg="m04v2/home_table.png" cam={{ z: lerp(1.35, 1.45, f / dur), fx: 560, fy: 1150 }}>
      <Stick id="m0" look={MOM} pose={stand(f + 5)} x={680} floor={1500} h={H} flip />
      <Stick id="k0" look={KID} pose={f >= c2 + 6 ? { ...stand(f), armR: [-150, -20], bob: Math.abs(Math.sin(f * 0.5)) * 6 } : stand(f)} x={430} floor={1520} h={H * 0.7} />
      <TableFront />
      {f < c2 + 10 && <Bubble text={W.myMom} x={430} y={1000} f={f} at={c1} tailX={430} tailY={1130} color="#e8e4dc" crack={crack} />}
      <Bubble text={W.ourMom} x={470} y={1000} f={f} at={c2 + 6} tailX={430} tailY={1130} color={YELLOW} />
    </Stage>
  );
};
const S1: React.FC<SP> = ({ f, dur, n, lang }) => {
  // 집 → 학교 → 동네 전체(나라)에 OUR 꼬리표, 마지막 "our, not my"
  const W = WORDS[lang];
  const c = (k: number) => chunk(dur, n, k);
  const cam = f < c(1) ? { z: 1.5, fx: X(170), fy: Y(780) } : f < c(2) ? { z: 1.5, fx: X(640), fy: Y(780) } : { z: lerp(1.1, 1.0, ease((f - c(2)) / Math.max(1, dur - c(2)))), fx: 540, fy: 1100 };
  return (
    <Stage bg="m06/street.png" cam={cam} ui={f >= c(3) ? (
      <>
        <NumCard n={W.my} x={360} y={1500} f={f} at={c(3)} s={0.9} />
        <NumCard n={W.our} x={720} y={1500} f={f} at={c(3) + 6} s={0.9} hl />
        {f >= c(3) + 4 && <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}><path d="M290,1420 L430,1580 M430,1420 L290,1580" stroke="#c8322a" strokeWidth={16} strokeLinecap="round" opacity={Math.min(1, (f - c(3) - 4) / 4)} /></svg>}
      </>) : undefined}>
      <Tag text={W.house} x={X(180)} y={Y(700)} f={f} at={6} />
      <Tag text={W.school} x={X(640)} y={Y(760)} f={f} at={c(1) + 4} />
      {f >= c(2) && <div style={{ position: "absolute", left: 540 - 260, top: 560, width: 520, transform: `scale(${spring({ frame: f - c(2), fps: FPS, config: { damping: 10 } })})`, background: YELLOW, border: `9px solid ${INK}`, borderRadius: 20, textAlign: "center", fontFamily: sans, fontWeight: 900, fontSize: 60, color: INK, padding: "10px 0", boxShadow: "8px 10px 0 rgba(42,28,36,0.25)" }}>{W.country}</div>}
    </Stage>
  );
};
const S2: React.FC<SP> = ({ f, dur, n, lang }) => {
  // 가족이 하나씩 들어와 둥글게 모임 → "ours" 위에 OUR → "our mom" 말풍선
  const W = WORDS[lang];
  const c = (k: number) => chunk(dur, n, k);
  const inK = (k: number, from: number, to: number) => lerp(from, to, ease(interpolate(f, [k, k + 18], [0, 1], cl)));
  const ring = interpolate(f, [c(3), c(3) + 14], [0, 1], cl);
  return (
    <Stage bg="m04v2/home_table.png" cam={{ z: 1.3, fx: 560, fy: 1150 }}>
      <Stick id="d2" look={DAD} pose={f < c(1) + 18 && f > c(1) ? walk(f) : stand(f + 3)} x={inK(c(1), -150, 300)} floor={1500} h={H} />
      <Stick id="m2" look={MOM} pose={f >= c(4) + 4 ? { ...stand(f), armR: [-140, -10], armL: [-140, -10] } : stand(f + 5)} x={560} floor={1500} h={H} />
      <Stick id="k2" look={KID} pose={f < c(2) + 18 && f > c(2) ? walk(f) : stand(f)} x={inK(c(2), 1230, 800)} floor={1520} h={H * 0.7} flip />
      <TableFront />
      {ring > 0 && <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}><ellipse cx={560} cy={1150} rx={380 * ring} ry={260 * ring} fill="none" stroke={YELLOW} strokeWidth={14} strokeDasharray="30 18" opacity={0.9} /></svg>}
      <Tag text={W.our} x={560} y={780} f={f} at={c(2) + 6} s={1.2} />
      <Bubble text={W.ourMom} x={760} y={880} f={f} at={c(4)} tailX={640} tailY={980} color={YELLOW} s={0.9} />
    </Stage>
  );
};
const CO_CUT = 2; // 자막 덩어리 2("Our company")부터 사무실
const S3: React.FC<SP> = ({ f, dur, n, lang }) => {
  const W = WORDS[lang];
  const c = (k: number) => chunk(dur, n, k);
  if (f < c(CO_CUT)) {
    // 사장실: 명패 BOSS, 사장이 "MY COMPANY"
    const boss: Pose = { ...stand(f), armR: [-120, -30], armL: [-30, -110], lean: -4 };
    return (
      <Stage bg="m06/boss_office.png" cam={{ z: lerp(1.25, 1.45, f / c(CO_CUT)), fx: 520, fy: 1120 }}>
        <Stick id="b3" look={BOSS} pose={boss} x={X(390)} floor={1330} h={H * 0.95} />
        <Img src={staticFile("m06/boss_office.png")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, clipPath: `inset(${Y(772)}px 0 0 0)` }} />
        <PlateText text={W.boss} f={f} at={4} />
        <Bubble text={W.myCo} x={X(390)} y={850} f={f} at={6} tailX={X(390) + 20} tailY={930} color="#e8e4dc" />
      </Stage>
    );
  }
  const g = f - c(CO_CUT);
  return (
    <Stage bg="m06/open_office.png" cam={{ z: 1.2, fx: 540, fy: 1300 }}>
      {WORKERS.map((lk, i) => (
        <Stick key={i} id={`w3${i}`} look={lk} pose={g > 6 + i * 3 ? { ...stand(f + i * 7), armR: [-150, -10], bob: Math.abs(Math.sin((f + i * 3) * 0.5)) * 6 } : stand(f + i * 7)} x={220 + i * 215} floor={1640} h={H * 0.85} flip={i % 2 === 1} />
      ))}
      <Bubble text={W.ourCo} x={540} y={900} f={g} at={2} tailX={540} tailY={1080} color={YELLOW} />
    </Stage>
  );
};
const S4: React.FC<SP> = ({ f, dur, n }) => {
  // 상점가 간판에 '우리○○'가 차례로 켜짐, 사람이 걸어 지나감
  const c1 = chunk(dur, n, 1);
  return (
    <Stage bg="m06/shop_street.png" cam={{ z: lerp(1.2, 1.05, ease(f / dur)), fx: 540, fy: lerp(950, 1050, f / dur) }}>
      {SIGNS.map((_, i) => <SignText key={i} i={i} f={f} at={4 + i * Math.max(5, Math.round((c1 + 6) / 4))} />)}
      <Stick id="p4" look={KID} pose={walk(f)} x={lerp(300, 700, f / dur)} floor={1720} h={H * 0.7} />
    </Stage>
  );
};
const S5: React.FC<SP> = ({ f, dur, n, lang }) => {
  // MY / OUR 카드 사이 물음표, 아이가 둘을 번갈아 봄
  const W = WORDS[lang];
  const c1 = chunk(dur, n, 1);
  return (
    <Stage bg="m04/park.png" cam={{ z: 1.15, fx: 540, fy: 1300 }}
      ui={<>
        <NumCard n={W.my} x={290} y={760} f={f} at={2} s={0.9} />
        <NumCard n={W.our} x={790} y={760} f={f} at={8} s={0.9} hl />
        <NumCard n="?" x={540} y={600} f={f} at={c1 + 4} s={0.9} />
      </>}>
      <Stick id="k5" look={KID} pose={{ ...stand(f), head: Math.sin(f * 0.15) * 14 }} x={540} floor={1640} h={H * 0.8} flip={Math.sin(f * 0.15) < 0} />
    </Stage>
  );
};

const SCENES = [S0, S1, S2, S3, S4, S5];
const CLOUD = new Set([1, 2, 3, 4, 5]);
const PRE = 18;
const sfxOf = (i: number, dur: number, n: number): Fx[] => {
  const c = (k: number) => chunk(dur, n, k);
  switch (i) {
    case 0: return [["pop", c(1), 0.4], ["glitch", c(2), 0.35], ["pop", c(2) + 6, 0.45]];
    case 1: return [["pop", 8, 0.4], ["pop", c(1) + 6, 0.4], ["chime", c(2), 0.35], ["pop", c(3) + 5, 0.4], ["thud", c(3) + 8, 0.4], ["pop", c(3) + 11, 0.4]];
    case 2: return [["whoosh", c(1), 0.3], ["whoosh", c(2), 0.3], ["pop", c(2) + 8, 0.4], ["chime", c(3), 0.35], ["pop", c(4), 0.45]];
    case 3: return [["pop", 4, 0.35], ["pop", 8, 0.4], ["whoosh", c(CO_CUT), 0.4], ["pop", c(CO_CUT) + 4, 0.45]];
    case 4: return [0, 1, 2, 3].map((k) => ["ding", 4 + k * Math.max(5, Math.round((c(1) + 6) / 4)), 0.3] as Fx);
    case 5: return [["pop", 7, 0.4], ["pop", 13, 0.4], ["ding", c(1) + 9, 0.4]];
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
      {(!pre || f0 >= pre * 0.55) && <S f={Math.max(0, f)} dur={EP06[lang].frames[i]} n={n} lang={lang} />}
      {pre > 0 && f0 < pre * 1.3 && <CloudWipe p={f0 / (pre * 1.3)} />}
    </AbsoluteFill>
  );
};
export const Ep06Stick: React.FC<{ lang?: Lang }> = ({ lang = "en" }) => {
  const b = EP06[lang];
  const caps = b.caps as Cap[][];
  return (
    <AbsoluteFill style={{ background: "#f3ead8" }}>
      {caps.map((_, i) => {
        const pre = CLOUD.has(i) ? PRE : 0;
        return (
          <Sequence key={i} from={b.starts[i] - pre} durationInFrames={b.frames[i] + pre}>
            <ShotS i={i} lang={lang} n={caps[i].length} />
            {pre > 0 && <Sequence from={0} layout="none"><Audio src={staticFile("sfx/whoosh.wav")} volume={0.4} /></Sequence>}
            {sfxOf(i, b.frames[i], caps[i].length).map(([name, fr, vol], k) => (
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
              <Sequence key={k} from={Math.round(k * per)} durationInFrames={Math.round((k + 1) * per) - Math.round(k * per)} layout="none"><Caption cap={c} /></Sequence>
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
