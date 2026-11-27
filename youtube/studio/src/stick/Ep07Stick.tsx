// EP07 "고개를 돌리고 마시는 나라" 졸라맨판. 배경: 포장마차(m07/pocha), 고깃집 회식(m07/bbq).
// 손은 reachArm(IK)으로 잔·병에 정확히 닿게 한다. 장면 사건·자막·효과음은 실제 음성 경계(chunks.json)에 맞춘다.
import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadNotoSans } from "@remotion/google-fonts/NotoSansKR";
import { EP07 } from "../ep07/Ep07";
import { INK, Look, Pose, reachArm, reachPoint, Stick, stand, walk } from "./Stick";
import { CB, cbAt, Caption, CloudWipe, NumCard, Stage, Stamp } from "./Ep04Stick";

const { fontFamily: sans } = loadNotoSans();
const FPS = 30;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
type Lang = "en" | "es";
type Cap = { text: string; hl?: boolean }[];
type Fx = [string, number, number];
const H = 520;
const X = (x: number) => (x * 1080) / 768;
const Y = (y: number) => (y * 1920) / 1376;

const ME: Look = { kind: "man", accent: "#3e8e7e" };
const ELDER: Look = { kind: "old", accent: "#8a6a4a" };
const BOSS: Look = { kind: "man", accent: "#c8322a" };
const NEW: Look = { kind: "woman", accent: "#26386b" };
const FRIENDS: Look[] = [{ kind: "man", accent: "#f2c14e" }, { kind: "woman", accent: "#e2574c" }];

// ---------------------------------------------------------------- 소품 (상표 없음)
const Glass: React.FC<{ x: number; y: number; fill?: number; rot?: number; s?: number }> = ({ x, y, fill = 0, rot = 0, s = 1 }) => (
  <svg width={1} height={1} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
    <g transform={`rotate(${rot}) scale(${s})`}>
      <path d="M-17,-40 L17,-40 L13,0 L-13,0 Z" fill="#eef6f4" fillOpacity={0.75} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      {fill > 0 && <path d={`M${-13 - 4 * fill},${-36 * fill} L${13 + 4 * fill},${-36 * fill} L13,-3 L-13,-3 Z`} fill="#cfe9ef" />}
      <path d="M-13,0 L13,0" stroke={INK} strokeWidth={7} />
    </g>
  </svg>
);
// 병: (x,y)는 병목 끝. rot 0 = 똑바로, 120쯤이면 따르는 각도
const Bottle: React.FC<{ x: number; y: number; rot?: number; s?: number }> = ({ x, y, rot = 0, s = 1 }) => (
  <svg width={1} height={1} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
    <g transform={`rotate(${rot}) scale(${s})`}>
      <path d="M-9,0 L9,0 L9,30 Q26,44 26,66 L26,170 Q26,180 16,180 L-16,180 Q-26,180 -26,170 L-26,66 Q-26,44 -9,30 Z" fill="#5fae7a" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <rect x={-11} y={-6} width={22} height={10} rx={3} fill="#3e8e5e" stroke={INK} strokeWidth={4} />
      <rect x={-20} y={92} width={40} height={50} rx={6} fill="#f6efe0" stroke={INK} strokeWidth={3.5} />
      <path d="M-14,60 L-14,150" stroke="#c9efd6" strokeWidth={6} strokeLinecap="round" opacity={0.7} />
    </g>
  </svg>
);
const Stream: React.FC<{ x0: number; y0: number; x1: number; y1: number; on: boolean }> = ({ x0, y0, x1, y1, on }) =>
  on ? <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}><path d={`M${x0},${y0} Q${x0 + 6},${(y0 + y1) / 2} ${x1},${y1}`} stroke="#bfe3ea" strokeWidth={7} fill="none" strokeLinecap="round" /></svg> : null;
// 고개 홱 돌릴 때 속도선
const Swish: React.FC<{ x: number; y: number; f: number; at: number; dir: 1 | -1 }> = ({ x, y, f, at, dir }) => {
  const a = f - at;
  if (a < 0 || a > 10) return null;
  return (
    <svg width={1} height={1} style={{ position: "absolute", left: x, top: y, overflow: "visible", opacity: 1 - a / 10 }}>
      {[-30, 0, 30].map((dy, i) => <path key={i} d={`M${dir * 20},${dy} q${dir * 30},-10 ${dir * 60},0`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />)}
    </svg>
  );
};
// "짠" 별
const Clink: React.FC<{ x: number; y: number; f: number; at: number }> = ({ x, y, f, at }) => {
  const a = f - at;
  if (a < 0 || a > 16) return null;
  const k = a / 16;
  return (
    <svg width={1} height={1} style={{ position: "absolute", left: x, top: y, overflow: "visible", opacity: 1 - k }}>
      {Array.from({ length: 8 }, (_, i) => { const t = (i / 8) * Math.PI * 2, r0 = 20 + 30 * k, r1 = 40 + 40 * k; return <line key={i} x1={Math.cos(t) * r0} y1={Math.sin(t) * r0} x2={Math.cos(t) * r1} y2={Math.sin(t) * r1} stroke="#f2c14e" strokeWidth={7} strokeLinecap="round" />; })}
    </svg>
  );
};

// ---------------------------------------------------------------- 사람 + 손 위치
type P = { look: Look; x: number; floor: number; flip?: boolean; base: Pose; hR?: [number, number]; hL?: [number, number]; id: string; h?: number };
const Person: React.FC<P> = ({ look, x, floor, flip, base, hR, hL, id, h = H }) => {
  const pose: Pose = { ...base };
  if (hR) pose.armR = reachArm(base, x, floor, h, flip, hR[0], hR[1]);
  if (hL) pose.armL = reachArm(base, x, floor, h, flip, hL[0], hL[1]);
  return <Stick id={id} look={look} pose={pose} x={x} floor={floor} h={h} flip={flip} />;
};
// 입 높이(잔을 대는 곳): 머리 중심에서 조금 아래
// 머리 중심 = 발에서 0.77h 위, 반지름 0.15h. 입은 머리 아래쪽 앞
const mouthOf = (x: number, floor: number, h: number, flip?: boolean, out = 0.1) => [x + (flip ? -1 : 1) * out * h, floor - h * 0.7] as [number, number];

// ---------------------------------------------------------------- 장면
type SP = { f: number; dur: number; n: number; lang: Lang; cb: number[] };
// 포장마차 자리: 왼쪽 = 나, 오른쪽 = 상대. 식탁 윗면 y≈1311
const PL = { x: 250, floor: 1640 }, PR = { x: 830, floor: 1640 };
const TABLE_Y = Y(945);
const G_ME: [number, number] = [430, TABLE_Y + 6];
const G_THEM: [number, number] = [650, TABLE_Y + 6];

// 나: 잔을 들어 마시는 동작. turn=true면 상대 반대쪽으로 몸을 돌려 손으로 가리고 마심
const Drinker: React.FC<{ f: number; lift: number; turn: boolean; at: number; id: string; x?: number; floor?: number }> = ({ f, lift, turn, at, id, x = PL.x, floor = PL.floor }) => {
  const flip = turn; // 기본은 오른쪽(상대)을 봄. 돌면 왼쪽을 봄
  const m = mouthOf(x, floor, H, flip, 0.14);
  const g: [number, number] = [lerp(G_ME[0], m[0], ease(lift)), lerp(G_ME[1], m[1] + 30, ease(lift))];
  const base: Pose = { ...stand(f), head: turn ? -14 * ease(lift) : 0, lean: turn ? -4 : 0 };
  return (
    <>
      <Person id={id} look={ME} x={x} floor={floor} flip={flip} base={base} hR={[g[0], g[1] - 18]} hL={turn ? [m[0] + (flip ? 30 : -30), m[1] + 10] : undefined} />
      <Glass x={g[0]} y={g[1]} rot={lift * (flip ? 60 : -60)} fill={1 - ease(Math.max(0, lift - 0.6) / 0.4)} />
      {turn && <Swish x={x} y={floor - H * 1.0} f={f} at={at} dir={-1} />}
    </>
  );
};

const S0: React.FC<SP> = ({ cb, f }) => {
  // "In Korea, at a drinking table," 마주 앉음 → "don't let them" 잔을 드는데 멈칫 → "see you drink." 홱 돌려 가리고 마심
  const c = (k: number) => cbAt(cb, k);
  const lift = interpolate(f, [c(2), c(2) + 8], [0, 0.45], cl) + interpolate(f, [c(3), c(3) + 10], [0, 0.55], cl);
  const turn = f >= c(3);
  return (
    <Stage bg="m07/pocha.png" cam={{ z: lerp(1.15, 1.35, f / (cb[cb.length - 1] || 1)), fx: 540, fy: 1330 }}>
      <Person id="e0" look={ELDER} x={PR.x} floor={PR.floor} flip base={stand(f + 5)} hR={[G_THEM[0], G_THEM[1] - 18]} />
      <Glass x={G_THEM[0]} y={G_THEM[1]} fill={1} />
      <Drinker f={f} lift={lift} turn={turn} at={c(3)} id="m0" />
    </Stage>
  );
};
const S1: React.FC<SP> = ({ cb, f }) => {
  // "With someone older," 어르신 / "your boss," 회식 자리 사장 / "someone you've just met," 처음 본 사람 / "turn your head away" 홱
  const c = (k: number) => cbAt(cb, k);
  const who = f < c(1) ? 0 : f < c(2) ? 1 : 2;
  const turnAt = c(3);
  const lift = interpolate(f, [turnAt - 6, turnAt + 10], [0, 1], cl);
  const turn = f >= turnAt;
  if (who === 1 && !turn) {
    return (
      <Stage bg="m07/bbq.png" cam={{ z: 1.45, fx: 540, fy: 1330 }}>
        <Person id="b1" look={BOSS} x={850} floor={1600} flip base={stand(f)} hR={[700, 1470]} />
        <Glass x={700} y={1488} fill={1} />
        <Person id="m1b" look={ME} x={240} floor={1600} base={stand(f + 3)} hR={[400, 1470]} />
        <Glass x={400} y={1488} fill={1} />
      </Stage>
    );
  }
  const other = who === 0 ? ELDER : who === 2 || turn ? NEW : ELDER;
  return (
    <Stage bg="m07/pocha.png" cam={{ z: 1.25, fx: 540, fy: 1330 }}>
      <Person id={`o1${who}`} look={other} x={PR.x} floor={PR.floor} flip base={stand(f + 5)} hR={[G_THEM[0], G_THEM[1] - 18]} />
      <Glass x={G_THEM[0]} y={G_THEM[1]} fill={1} />
      <Drinker f={f} lift={turn ? lift : 0} turn={turn} at={turnAt} id="m1" />
    </Stage>
  );
};
// 따르기: 병을 든 사람(pourer)이 잔(cup) 위로 기울임. twoHands면 다른 손으로 병 아래를 받침
const PourScene: React.FC<{ f: number; dur: number; meGives: boolean; tiltAt: number }> = ({ f, dur, meGives, tiltAt }) => {
  const tilt = ease(interpolate(f, [tiltAt, tiltAt + 10], [0, 1], cl));
  const fillK = interpolate(f, [tiltAt + 10, dur - 6], [0, 1], cl);
  const cup: [number, number] = meGives ? [610, TABLE_Y - 70] : [470, TABLE_Y - 70];
  const pourerX = meGives ? PL.x + 60 : PR.x - 60;
  const pourerFlip = !meGives;
  const dir = meGives ? 1 : -1;
  // 병목이 잔 위에 오도록
  const neck: [number, number] = [cup[0] - dir * 30, cup[1] - 70];
  const rot = dir * lerp(20, 115, tilt);
  const bodyMid: [number, number] = [neck[0] - dir * Math.sin((rot * Math.PI) / 180) * 120 * -1, neck[1] + Math.cos((rot * Math.PI) / 180) * 120];
  const butt: [number, number] = [neck[0] + Math.sin((-rot * Math.PI) / 180) * 170, neck[1] + Math.cos((rot * Math.PI) / 180) * 170];
  const receiverX = meGives ? PR.x - 40 : PL.x + 40;
  const recFlip = meGives;
  return (
    <Stage bg="m07/pocha.png" cam={{ z: 1.35, fx: 540, fy: TABLE_Y - 120 }}>
      <Person id="po" look={meGives ? ME : ELDER} x={pourerX} floor={PL.floor} flip={pourerFlip} base={stand(f)} hR={bodyMid} hL={meGives ? butt : butt} />
      <Person id="re" look={meGives ? ELDER : ME} x={receiverX} floor={PL.floor} flip={recFlip} base={stand(f + 4)} hR={[cup[0] + (recFlip ? 14 : -14), cup[1] - 20]} hL={[cup[0] + (recFlip ? -16 : 16), cup[1] + 4]} />
      <Glass x={cup[0]} y={cup[1]} fill={fillK} />
      <Bottle x={neck[0]} y={neck[1]} rot={rot} />
      <Stream x0={neck[0] + dir * Math.sin((rot * Math.PI) / 180) * -2} y0={neck[1]} x1={cup[0]} y1={cup[1] - 30} on={tilt > 0.95 && fillK < 1} />
    </Stage>
  );
};
const S2: React.FC<SP> = ({ cb, f, dur }) => <PourScene f={f} dur={dur} meGives={false} tiltAt={cbAt(cb, 1)} />;
const S3: React.FC<SP> = ({ cb, f, dur }) => <PourScene f={f} dur={dur} meGives tiltAt={cbAt(cb, 1) - 10} />;
const S4: React.FC<SP> = ({ cb, f, lang }) => {
  // "One more rule:" 내가 병을 들어 내 잔으로 → "never fill your own glass." 멈춤 + NO 도장 → "Someone else fills it" 상대가 병을 가져가 내 잔 채움 → "you fill theirs" 내가 채움 + 짠
  const c = (k: number) => cbAt(cb, k);
  const phase = f < c(2) ? 0 : f < c(3) ? 1 : 2;
  const bottleMine = phase === 0;
  const tilt0 = phase === 0 ? ease(interpolate(f, [6, c(1) - 4], [0, 0.45], cl)) : 0;
  // 두 사람을 식탁 가까이 붙여 앉혀 병을 실제로 손에 쥘 수 있게 함
  const meX = 380, elX = 700;
  const myCup: [number, number] = [460, TABLE_Y + 6], theirCup: [number, number] = [620, TABLE_Y + 6];
  let neck: [number, number], rot: number, holder: "me" | "them";
  if (bottleMine) { neck = [lerp(520, 485, tilt0), lerp(TABLE_Y - 170, TABLE_Y - 110, tilt0)]; rot = -lerp(0, 100, tilt0); holder = "me"; }
  else if (phase === 1) { neck = [485, TABLE_Y - 110]; rot = -110; holder = "them"; }
  else { neck = [595, TABLE_Y - 110]; rot = 110; holder = "me"; }
  const r = (rot * Math.PI) / 180;
  const GD = 62; // 병목 끝에서 손잡는 곳까지
  const want: [number, number] = [neck[0] - Math.sin(r) * GD, neck[1] + Math.cos(r) * GD];
  const meBase = stand(f), elBase = stand(f + 5);
  // 팔이 못 닿으면 손이 닿는 곳으로 병을 옮겨 항상 손에 붙어 있게
  const got = holder === "me" ? reachPoint(meBase, meX, PL.floor, H, false, want[0], want[1]) : reachPoint(elBase, elX, PR.floor, H, true, want[0], want[1]);
  neck = [neck[0] + got[0] - want[0], neck[1] + got[1] - want[1]];
  const grip = got;
  const fillMine = phase === 1 ? interpolate(f, [c(2) + 6, c(3) - 4], [0, 1], cl) : phase === 2 ? 1 : 0.1;
  const fillTheirs = phase === 2 ? interpolate(f, [c(3) + 6, cb[cb.length - 1] - 10], [0, 1], cl) : 0.1;
  const clinkAt = cb[cb.length - 1] - 10;
  return (
    <Stage bg="m07/pocha.png" cam={{ z: 1.5, fx: 540, fy: TABLE_Y - 40 }}
      ui={phase === 0 && f >= c(1) ? <Stamp word={lang === "es" ? "¡NO!" : "NO!"} x={540} y={760} f={f} at={c(1) + 2} /> : undefined}>
      <Person id="m4" look={ME} x={meX} floor={PL.floor} base={meBase} hR={holder === "me" ? grip : [myCup[0], myCup[1] - 18]} />
      <Person id="e4" look={ELDER} x={elX} floor={PR.floor} flip base={elBase} hR={holder === "them" ? grip : [theirCup[0], theirCup[1] - 18]} />
      <Glass x={myCup[0]} y={myCup[1]} fill={fillMine} />
      <Glass x={theirCup[0]} y={theirCup[1]} fill={fillTheirs} />
      <Bottle x={neck[0]} y={neck[1]} rot={rot} s={0.85} />
      <Stream x0={neck[0]} y0={neck[1]} x1={phase === 2 ? theirCup[0] : myCup[0]} y1={myCup[1] - 30} on={(phase === 1 && fillMine < 1) || (phase === 2 && fillTheirs < 1)} />
      <Clink x={540} y={TABLE_Y - 60} f={f} at={clinkAt} />
    </Stage>
  );
};
const S5: React.FC<SP> = ({ cb, f }) => {
  // 친구 셋이 편하게 짠 → "But the first drink with someone new?" 새 사람 등장 → "Head turns." 셋 다 홱
  const c = (k: number) => cbAt(cb, k);
  const comeIn = ease(interpolate(f, [c(2), c(3)], [0, 1], cl));
  const turnAt = c(4);
  const turned = f >= turnAt;
  const seats = [200, 420, 880];
  const flips = [false, false, true];
  const looks = [ME, FRIENDS[0], FRIENDS[1]];
  const cheers = f < c(2);
  return (
    <Stage bg="m07/pocha.png" cam={{ z: 1.1, fx: 540, fy: 1300 }}>
      {seats.map((x, i) => {
        const flip = turned ? !flips[i] : flips[i];
        const m = mouthOf(x, PL.floor, H * 0.95, flip, 0.14);
        const hand: [number, number] = cheers ? [540 + (i - 1) * 24, TABLE_Y - 150 + Math.sin(f * 0.4 + i) * 6] : turned ? [m[0], m[1] + 30] : [x + (flips[i] ? -150 : 150), TABLE_Y];
        return (
          <React.Fragment key={i}>
            <Person id={`f5${i}`} look={looks[i]} x={x} floor={PL.floor} flip={flip} base={stand(f + i * 4)} hR={hand} hL={turned ? [m[0] + (flip ? 30 : -30), m[1] + 10] : undefined} h={H * 0.95} />
            <Glass x={hand[0]} y={hand[1] + 18} fill={0.8} rot={turned ? (flip ? 50 : -50) : 0} />
            {turned && <Swish x={x} y={PL.floor - H} f={f} at={turnAt} dir={flip ? -1 : 1} />}
          </React.Fragment>
        );
      })}
      <Clink x={540} y={TABLE_Y - 170} f={f} at={10} />
      {comeIn > 0 && <Person id="n5" look={NEW} x={lerp(1250, 660, comeIn)} floor={PL.floor - 60} flip base={comeIn < 1 ? walk(f) : stand(f)} h={H * 0.9} />}
    </Stage>
  );
};
const S6: React.FC<SP> = ({ cb, f, lang }) => {
  // 규칙 카드 세 장 + 물음표
  const L = lang === "es" ? ["GIRA", "2 MANOS", "NO TU VASO"] : ["TURN", "2 HANDS", "NOT YOURS"];
  return (
    <Stage bg="m07/pocha.png" cam={{ z: 1.0, fx: 540, fy: 1100 }}
      ui={<>
        {[0, 1, 2].map((i) => <NumCard key={i} n={L[i]} x={210 + i * 330} y={880} f={f} at={2 + i * 6} s={0.72} hl={i === 1} />)}
        <NumCard n="?" x={540} y={600} f={f} at={cbAt(cb, 1) + 4} s={0.9} hl />
      </>}>
      <Person id="m6" look={ME} x={540} floor={1700} base={{ ...stand(f), head: Math.sin(f * 0.15) * 12 }} />
    </Stage>
  );
};

const SCENES = [S0, S1, S2, S3, S4, S5, S6];
const CLOUD = new Set([2, 5]);
const PRE = 18;
const sfxOf = (i: number, cb: number[]): Fx[] => {
  const c = (k: number) => cbAt(cb, k);
  switch (i) {
    case 0: return [["ding", 4, 0.3], ["whoosh", c(3), 0.45]];
    case 1: return [["pop", c(1), 0.35], ["pop", c(2), 0.35], ["whoosh", c(3), 0.5]];
    case 2: return [["ding", c(1) + 10, 0.25], ["pop", c(2), 0.4]];
    case 3: return [["ding", c(1), 0.25], ["pop", c(1) + 4, 0.4]];
    case 4: return [["thud", c(1) + 4, 0.5], ["whoosh", c(2), 0.35], ["ding", cb[cb.length - 1] - 10, 0.45]];
    case 5: return [["ding", 10, 0.45], ["pop", c(3) - 4, 0.3], ["whoosh", c(4), 0.55]];
    case 6: return [["pop", 7, 0.35], ["pop", 13, 0.35], ["pop", 19, 0.35], ["ding", c(1) + 9, 0.45]];
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
      {(!pre || f0 >= pre * 0.55) && <S cb={CB.ep07[lang][i]} f={Math.max(0, f)} dur={EP07[lang].frames[i]} n={n} lang={lang} />}
      {pre > 0 && f0 < pre * 1.3 && <CloudWipe p={f0 / (pre * 1.3)} />}
    </AbsoluteFill>
  );
};
export const Ep07Stick: React.FC<{ lang?: Lang }> = ({ lang = "en" }) => {
  const b = EP07[lang];
  const caps = b.caps as Cap[][];
  return (
    <AbsoluteFill style={{ background: "#f3ead8" }}>
      {caps.map((_, i) => {
        const pre = CLOUD.has(i) ? PRE : 0;
        return (
          <Sequence key={i} from={b.starts[i] - pre} durationInFrames={b.frames[i] + pre}>
            <ShotS i={i} lang={lang} n={caps[i].length} />
            {pre > 0 && <Sequence from={0} layout="none"><Audio src={staticFile("sfx/whoosh.wav")} volume={0.4} /></Sequence>}
            {sfxOf(i, CB.ep07[lang][i]).map(([name, fr, vol], k) => (
              <Sequence key={k} from={pre + fr} layout="none"><Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} /></Sequence>
            ))}
          </Sequence>
        );
      })}
      {caps.map((cs, i) => (
        <Sequence key={`c${i}`} from={b.starts[i]} durationInFrames={b.frames[i]} layout="none">
          {cs.map((c, k) => (
            <Sequence key={k} from={CB.ep07[lang][i][k]} durationInFrames={CB.ep07[lang][i][k + 1] - CB.ep07[lang][i][k]} layout="none"><Caption cap={c} /></Sequence>
          ))}
        </Sequence>
      ))}
      {b.VO.sentences.map((v, i) => (
        <Sequence key={v.id} from={b.starts[i]} layout="none"><Audio src={staticFile(v.file)} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
void sans; void spring; void X;
