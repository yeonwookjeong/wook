// EP01 앞 4문장(약 11초)을 새 화풍(현대 민화)으로 다시 만든 시험판.
// 원본 EP01과 같은 컷 순서·같은 음성·같은 자막·같은 효과음. 그림만 Gemini 부품(public/m01) + 코드.
//   0 aerial  단지 전경으로 날아 들어감        → complex.png
//   1 reveal  한 동 정면 → 문이 열리듯 단면     → tower.png / cutaway.png
//   2 ride1   1·2·3 층 판에 차례로 불           → cutaway.png
//   3 ride2   4번째 판이 F, 옆에 "?"            → cutaway.png
//   4 four    하늘에 한지 카드 "4"가 떨어짐     → sky.png
//   5 sa      카드가 뒤집혀 "사"
//   6 death1  다시 뒤집혀 "死", 하늘이 어두워짐
//   7 death2  死로 바짝 다가가며 쿵, 위에 "4 = 사 = 死", 붉은 먹이 번짐
import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadNotoSans } from "@remotion/google-fonts/NotoSansKR";
import { loadFont as loadHahmlet } from "@remotion/google-fonts/Hahmlet";
import vo from "../ep01/vo.json";

const { fontFamily: sans } = loadNotoSans();
const { fontFamily: serif } = loadHahmlet();
const FPS = 30;
const INK = "#2a1c24";
const YELLOW = "#ffd23a";
const RED = "#c8322a";
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const src = (n: string) => staticFile(`m01/${n}.png`);

// ---------------------------------------------------------------- 컷 (원본 EP01과 같은 순서·자막·효과음)
type Cap = { text: string; hl?: boolean }[];
type Shot = { mode: string; sent: number; caps: Cap[]; sfx?: { name: string; at?: number; vol?: number }[] };
const SHOTS: Shot[] = [
  { mode: "aerial", sent: 0, caps: [[{ text: "In" }, { text: "Korea,", hl: true }]], sfx: [{ name: "ding", at: 0.05, vol: 0.35 }] },
  { mode: "reveal", sent: 1, caps: [[{ text: "this elevator" }], [{ text: "is hiding" }, { text: "a floor.", hl: true }]], sfx: [{ name: "glitch", at: 0.15, vol: 0.25 }, { name: "whoosh", at: 0.95, vol: 0.3 }] },
  { mode: "ride1", sent: 2, caps: [[{ text: "Look:" }], [{ text: "1, 2, 3…" }]] },
  { mode: "ride2", sent: 2, caps: [[{ text: "F.", hl: true }], [{ text: "Where's" }, { text: "4?", hl: true }]], sfx: [{ name: "pop", at: 0.5, vol: 0.35 }] },
  { mode: "four", sent: 3, caps: [[{ text: "In Korean," }], [{ text: "four", hl: true }]], sfx: [{ name: "buzz", vol: 0.2 }, { name: "thud", at: 0.25, vol: 0.3 }] },
  { mode: "sa", sent: 3, caps: [[{ text: "is read" }], [{ text: '"sa,"', hl: true }]], sfx: [{ name: "pop", at: 0.1, vol: 0.4 }] },
  { mode: "death1", sent: 3, caps: [[{ text: "the same" }], [{ text: "sound as" }]], sfx: [{ name: "whoosh", at: 0.05, vol: 0.25 }] },
  { mode: "death2", sent: 3, caps: [[{ text: "the Chinese" }], [{ text: "character" }], [{ text: "for" }, { text: "death.", hl: true }]], sfx: [{ name: "thud", vol: 0.6 }] },
];
type Vo = { sentences: { id: number; file: string; sec: number }[] };
const TAIL = 0.1;
const capLen = (sh: Shot) => sh.caps.flat().reduce((a, x) => a + x.text.length, 0);
const FRAMES = SHOTS.map((sh) => {
  const v = (vo as Vo).sentences.find((x) => x.id === sh.sent)!;
  const group = SHOTS.filter((x) => x.sent === sh.sent);
  const total = group.reduce((a, x) => a + capLen(x), 0);
  return Math.round(((v.sec * capLen(sh)) / total + (group[group.length - 1] === sh ? TAIL : 0)) * FPS);
});
const STARTS = FRAMES.map((_, i) => FRAMES.slice(0, i).reduce((a, f) => a + f, 0));
export const EP01M_TOTAL = FRAMES.reduce((a, f) => a + f, 0);

// ---------------------------------------------------------------- 좌표 (그림 원본 픽셀 → 화면)
// 세로로 긴 건물 그림(254x1024)은 화면 높이에 맞춰 가운데에 세운다 (배율 1.875, 폭 476)
const TK = 1920 / 1024;
const TX = (1080 - 254 * TK) / 2;
const towerPt = (x: number, y: number) => [TX + x * TK, y * TK] as const;
// 판 위치(그림에서 잰 값). 아래가 1층.
const TOWER_PLATES = [867, 825, 783, 741, 699, 657, 615, 574, 531, 489, 447, 404, 361, 319, 276].map((y) => towerPt(204, y));
const CUT_PLATES = [902, 853, 805, 755, 701, 647, 593, 541, 486, 430, 370, 292, 236, 178].map((y) => towerPt(15, y));
const TOWER_PLATE_W = 16 * TK;
const CUT_PLATE_W = 16 * TK;
const label = (i: number) => (i === 3 ? "F" : `${i + 1}`);

// 카메라: 그림 좌표 (fx, fy)를 화면 가운데에 두고 z배
const clampF = (f: number, z: number, half: number, size: number) => Math.min(size - half / z, Math.max(half / z, f));
const camIn = (fx: number, fy: number, z: number) => cam(clampF(fx, z, 540, 1080), clampF(fy, z, 960, 1920), z);
const cam = (fx: number, fy: number, z: number, dx = 0, dy = 0): React.CSSProperties => ({ transform: `translate(${540 - fx * z + dx}px, ${960 - fy * z + dy}px) scale(${z})`, transformOrigin: "0 0" });

// ---------------------------------------------------------------- 작은 생명: 먹선 새 떼 (날갯짓)
const Birds: React.FC<{ f: number; y: number; dir?: 1 | -1; n?: number; s?: number }> = ({ f, y, dir = 1, n = 3, s = 1 }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const x = dir > 0 ? -120 + f * 7 * s + i * 70 : 1200 - f * 7 * s - i * 70;
      const yy = y + i * 34 + Math.sin(f * 0.12 + i) * 10;
      const w = Math.sin(f * 0.5 + i * 1.3);
      return (
        <svg key={i} width={60 * s} height={30 * s} viewBox="0 0 60 30" style={{ position: "absolute", left: x, top: yy, overflow: "visible" }}>
          <path d={`M2 ${14 - w * 9} Q16 ${4 - w * 6} 30 16 Q44 ${4 - w * 6} 58 ${14 - w * 9}`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
        </svg>
      );
    })}
  </>
);

// 층 판: 숫자 + 불
const Plates: React.FC<{ pts: readonly (readonly [number, number])[]; w: number; lit: (i: number) => number; fColor?: number; boxed?: boolean }> = ({ pts, w, lit, fColor = 0, boxed }) => (
  <>
    {pts.map(([x, y], i) => {
      const L = lit(i);
      const isF = i === 3;
      const bg = isF && fColor > 0 ? `rgba(240,140,40,${0.35 + 0.6 * fColor})` : L > 0.02 ? `rgba(255,214,90,${0.85 * L + (boxed ? 0.15 : 0)})` : boxed ? "#f6efe0" : "transparent";
      return (
        <div key={i} style={{ position: "absolute", left: x - w / 2, top: y - w / 2, width: w, height: w, display: "flex", alignItems: "center", justifyContent: "center", background: bg, boxShadow: L > 0.05 || (isF && fColor > 0) ? `0 0 ${18 * Math.max(L, fColor)}px rgba(255,200,80,${0.9 * Math.max(L, fColor)})` : undefined, borderRadius: 3, border: boxed ? `3px solid ${INK}` : undefined, boxSizing: "border-box" }}>
          <span style={{ fontFamily: sans, fontWeight: 900, fontSize: w * 0.62, color: INK, lineHeight: 1 }}>{label(i)}</span>
        </div>
      );
    })}
  </>
);

// 한지 카드 (4 → 사 → 死). flip 0..1: 0.5에서 뒷면으로 바뀜
const Card: React.FC<{ a: string; b: string; flip: number; s: number; red?: number; y?: number }> = ({ a, b, flip, s, red = 0, y = 0 }) => {
  const face = flip < 0.5 ? a : b;
  const sx = Math.abs(Math.cos(flip * Math.PI));
  const isRed = face === "死";
  return (
    <div style={{ position: "absolute", left: 540 - 210, top: 760 - 230 + y, width: 420, height: 460, transform: `scale(${s * Math.max(0.02, sx)}, ${s})`, transformOrigin: "50% 50%" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 26, background: isRed ? `linear-gradient(#f4e4d2, #ead2bc)` : "#f6efe0", border: `10px solid ${INK}`, boxShadow: "10px 14px 0 rgba(42,28,36,0.28)" }} />
      <div style={{ position: "absolute", inset: 18, borderRadius: 16, border: `4px solid ${isRed ? "rgba(200,50,42,0.5)" : "rgba(42,28,36,0.25)"}` }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: serif, fontWeight: 900, fontSize: face === "4" ? 300 : 260, lineHeight: 1, color: isRed ? RED : INK, textShadow: isRed ? `0 0 ${30 * red}px rgba(200,40,30,${0.6 * red})` : undefined }}>{face}</span>
      </div>
    </div>
  );
};

// 붉은 먹 번짐 (死 뒤)
const InkBloom: React.FC<{ p: number }> = ({ p }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    <defs>
      <filter id="rough"><feTurbulence baseFrequency="0.02" numOctaves={3} seed={4} /><feDisplacementMap in="SourceGraphic" scale={60} /></filter>
    </defs>
    <g filter="url(#rough)" opacity={0.85}>
      <circle cx={540} cy={770} r={80 + 520 * ease(p)} fill="#7e1d1a" opacity={0.55} />
      <circle cx={540} cy={770} r={40 + 360 * ease(p)} fill="#a82822" opacity={0.6} />
    </g>
  </svg>
);

// ---------------------------------------------------------------- 장면
type SP = { t: number; f: number; dur: number };

const Aerial: React.FC<SP> = ({ t, f }) => {
  // 단지 위에서 앞 동으로 쑥 날아 들어감 (원본: 1.6 → 1.15, 첫 프레임 강하게)
  const k = ease(t);
  return (
    <AbsoluteFill style={{ background: "#f4b99a" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, ...camIn(lerp(560, 440, k), lerp(1100, 1350, k), lerp(1.05, 1.45, k)) }}>
        <Img src={src("complex")} style={{ width: 1080, height: 1920 }} />
      </div>
      <Birds f={f + 20} y={360} />
    </AbsoluteFill>
  );
};

// ---- 정면/단면 한 쌍 (같은 구도, 단면은 층 판에 맞춰 정렬해 둠). 무대 좌표 1080 x 2282
const SK = 1080 / 459;
const sx = (x: number) => (x - 24) * SK;
const sy = (y: number) => (y - 28) * SK;
const FLOORS = [285, 329, 372, 416, 459, 502, 546, 589, 631, 674, 716, 759, 801, 844, 886]; // 판 y (위층 → 1층)
const PLATES = FLOORS.slice().reverse().map((y) => [sx(368.5), sy(y)] as const); // 1층부터
const BX0 = sx(125), BX1 = sx(387);
const ROOF = sy(200);
const strips = (() => {
  const r: [number, number][] = [[ROOF, sy(FLOORS[0] - 21.5)]];
  FLOORS.forEach((y) => r.push([sy(y - 21.5), sy(y + 21.5)]));
  return r;
})();
const STAGE_H = 2282;
const stageCam = (fx: number, fy: number, z: number): React.CSSProperties => cam(Math.min(1080 - 540 / z, Math.max(540 / z, fx)), Math.min(STAGE_H - 960 / z, Math.max(960 / z, fy)), z);

// 벽이 층마다 떨어져 나감: open = 0..1 (위층부터 아래층으로)
const Building: React.FC<{ open: number; lit: (i: number) => number; fColor?: number; children?: React.ReactNode }> = ({ open, lit, fColor, children }) => {
  const n = strips.length;
  return (
    <>
      <Img src={src("stage_facade")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: STAGE_H }} />
      {strips.map(([y0, y1], i) => {
        const p = interpolate(open * (n + 4) - i, [0, 4], [0, 1], cl); // 이 층 벽이 앞으로 넘어가는 진행도 (층마다 겹쳐서 차례로)
        if (p <= 0) return null;
        const clip = `inset(${y0}px ${1080 - BX1}px ${STAGE_H - y1}px ${BX0}px)`;
        return (
          <React.Fragment key={i}>
            <Img src={src("stage_cutaway")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: STAGE_H, clipPath: clip }} />
            {p < 1 && (
              <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: STAGE_H, clipPath: clip, transform: `perspective(1400px) rotateX(${-88 * ease(p)}deg)`, transformOrigin: `540px ${y1}px`, filter: `brightness(${1 - 0.35 * p})` }}>
                <Img src={src("stage_facade")} style={{ width: 1080, height: STAGE_H }} />
              </div>
            )}
          </React.Fragment>
        );
      })}
      <Plates pts={PLATES} w={14 * SK} lit={lit} fColor={fColor} />
      {children}
    </>
  );
};

const Reveal: React.FC<SP> = ({ t }) => {
  // "this elevator": 지붕에서 아래로 훑어 내려옴 / "is hiding a floor": 위층부터 벽이 한 층씩 떨어져 나가며 안이 드러남
  const openAt = 0.45;
  const open = interpolate(t, [openAt, openAt + 0.45], [0, 1], cl);
  const fy = lerp(950, 1250, ease(Math.min(1, t / openAt)));
  return (
    <AbsoluteFill style={{ background: "#f4b99a" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: STAGE_H, ...stageCam(540, fy, lerp(1, 1.06, open)) }}>
        <Building open={open} lit={() => 0} />
      </div>
    </AbsoluteFill>
  );
};
const Ride1: React.FC<SP> = ({ t }) => {
  // 1층 → 3층으로 올라가며 판에 차례로 불 ("1, 2, 3…")
  const fy = lerp(PLATES[0][1], PLATES[2][1], ease(t));
  const lit = (i: number) => (i > 2 ? 0 : interpolate(t, [0.5 + i * 0.15, 0.56 + i * 0.15], [0, 1], cl));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: STAGE_H, ...stageCam(680, fy, 2.2) }}>
        <Building open={1} lit={lit} />
      </div>
    </AbsoluteFill>
  );
};
const Ride2: React.FC<SP> = ({ t, f, dur }) => {
  // 4번째 판 = F. 주황으로 깜빡이고, "Where's 4?"에서 물음표가 튀어나옴
  const [px, py] = PLATES[3];
  const z = lerp(3.2, 3.5, ease(t));
  const q = spring({ frame: f - Math.round(dur * 0.5), fps: FPS, config: { damping: 9, stiffness: 220 } });
  const blink = 0.6 + 0.4 * Math.abs(Math.sin(f * 0.35));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: STAGE_H, ...stageCam(px - 60, py, z) }}>
        <Building open={1} lit={(i) => (i < 3 ? 1 : 0)} fColor={blink}>
          {f >= Math.round(dur * 0.5) && (
            <div style={{ position: "absolute", left: px - 95, top: py - 70, width: 52, height: 60, transform: `scale(${q})`, transformOrigin: "100% 100%" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 16, background: YELLOW, border: `5px solid ${INK}` }} />
              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 900, fontSize: 44, color: INK }}>?</span>
            </div>
          )}
        </Building>
      </div>
    </AbsoluteFill>
  );
};

const SkyStage: React.FC<{ f: number; dark?: number; z?: number; children?: React.ReactNode; shake?: number }> = ({ f, dark = 0, z = 1, children, shake = 0 }) => (
  <AbsoluteFill style={{ background: "#2a1a2a" }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translate(${shake}px, ${shake * 0.5}px) scale(${z})`, transformOrigin: "540px 780px" }}>
      <Img src={src("sky")} style={{ position: "absolute", width: 1080, height: 1920, filter: `brightness(${1 - 0.55 * dark}) saturate(${1 + 0.2 * dark}) hue-rotate(${-18 * dark}deg)` }} />
      {dark < 0.5 && <Birds f={f + 40} y={420} n={3} s={0.9} />}
      {children}
    </div>
  </AbsoluteFill>
);
const Four: React.FC<SP> = ({ f }) => {
  const drop = spring({ frame: f, fps: FPS, config: { damping: 10, stiffness: 140 } });
  return (
    <SkyStage f={f} z={lerp(1, 1.08, Math.min(1, f / 40))}>
      <Card a="4" b="4" flip={0} s={1} y={(1 - drop) * -900} />
    </SkyStage>
  );
};
const Sa: React.FC<SP> = ({ f }) => {
  const flip = interpolate(f, [0, 8], [0, 1], cl);
  return (
    <SkyStage f={f} z={1.08 + 0.002 * f}>
      <Card a="4" b="사" flip={flip} s={1} />
    </SkyStage>
  );
};
const Death1: React.FC<SP> = ({ f, t }) => {
  const flip = interpolate(f, [0, 8], [0, 1], cl);
  return (
    <SkyStage f={f} dark={ease(t)} z={1.1}>
      <Card a="사" b="死" flip={flip} s={1} red={t} />
    </SkyStage>
  );
};
const Death2: React.FC<SP> = ({ f, t }) => {
  const sh = f < 10 ? Math.sin(f * 2.3) * 16 * (1 - f / 10) : 0;
  const chain = spring({ frame: f - 6, fps: FPS, config: { damping: 12, stiffness: 200 } });
  return (
    <AbsoluteFill>
      <SkyStage f={f} dark={1} z={lerp(1.3, 1.42, t)} shake={sh}>
        <InkBloom p={Math.min(1, f / 30)} />
        <Card a="死" b="死" flip={0} s={1} red={1} />
      </SkyStage>
      <div style={{ position: "absolute", left: 0, right: 0, top: 190, display: "flex", justifyContent: "center", transform: `scale(${chain})` }}>
        <span style={{ fontFamily: serif, fontWeight: 900, fontSize: 96, color: "#f6efe0", WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill" }}>
          4 = 사 = <span style={{ color: "#ff5a48" }}>死</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};

const SCENES: Record<string, React.FC<SP>> = { aerial: Aerial, reveal: Reveal, ride1: Ride1, ride2: Ride2, four: Four, sa: Sa, death1: Death1, death2: Death2 };

const Caption: React.FC<{ cap: Cap }> = ({ cap }) => {
  const frame = useCurrentFrame();
  const pop = spring({ frame, fps: FPS, config: { damping: 12, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1180, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 22px", transform: `scale(${0.85 + 0.15 * pop})` }}>
      {cap.map((x, i) => (
        <span key={i} style={{ fontFamily: sans, fontWeight: 900, fontSize: 96, lineHeight: 1.15, color: x.hl ? YELLOW : "#fff", WebkitTextStroke: `15px ${INK}`, paintOrder: "stroke fill", textShadow: "0 6px 14px rgba(42,28,36,0.35)" }}>{x.text}</span>
      ))}
    </div>
  );
};

const ShotView: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const dur = FRAMES[i];
  const S = SCENES[SHOTS[i].mode];
  const per = dur / SHOTS[i].caps.length;
  return (
    <AbsoluteFill>
      <S t={interpolate(f, [0, dur], [0, 1], cl)} f={f} dur={dur} />
      {SHOTS[i].caps.map((c, k) => (
        <Sequence key={k} from={Math.round(k * per)} durationInFrames={Math.round((k + 1) * per) - Math.round(k * per)} layout="none">
          <Caption cap={c} />
        </Sequence>
      ))}
      {(SHOTS[i].sfx ?? []).map((fx, k) => (
        <Sequence key={`s${k}`} from={Math.round((fx.at ?? 0) * FPS)} layout="none">
          <Audio src={staticFile(`sfx/${fx.name}.wav`)} volume={fx.vol ?? 0.4} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const Ep01M: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    {SHOTS.map((sh, i) => (
      <Sequence key={i} from={STARTS[i]} durationInFrames={FRAMES[i]}>
        <ShotView i={i} />
      </Sequence>
    ))}
    {(vo as Vo).sentences.filter((v) => v.id <= 3).map((v) => (
      <Sequence key={v.id} from={STARTS[SHOTS.findIndex((x) => x.sent === v.id)]} layout="none">
        <Audio src={staticFile(v.file)} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
