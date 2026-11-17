// EP04 새 화풍(현대 민화) 조립 시험. 대본·음성·자막·효과음 타이밍은 기존 EP04를 그대로 쓴다.
// 그림은 Gemini로 뽑은 부품(public/m04): 배경판 6장 + 커플 포즈 14개 + 민화 구름 2개.
// 화면 규칙: 자막은 위쪽 하늘 자리(top 330), 사람은 아래쪽 바닥 위에.
import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadNotoSans } from "@remotion/google-fonts/NotoSansKR";
import { CAPS, EP04, SHOTS } from "../ep04/Ep04";

const { fontFamily: sans } = loadNotoSans();
const FPS = 30;
const INK = "#2a1c24";
const YELLOW = "#ffd23a";
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type Lang = "en" | "es";
type Cap = { text: string; hl?: boolean }[];
const src = (n: string) => staticFile(`m04/${n}.png`);

// ---------------------------------------------------------------- 사람 부품
// 원본 높이(px). 같은 사람은 같은 배율로 키워야 포즈마다 키가 안 바뀐다.
const SRC_H: Record<string, number> = {
  man_01: 257, man_02: 255, man_03: 254, man_04: 253, man_05: 251, man_06: 248, man_07: 251,
  woman_01: 308, woman_02: 304, woman_03: 306, woman_04: 301, woman_05: 302, woman_06: 298, woman_07: 302,
  c80_01: 481, c80_02: 496, c80_03: 492, c80_04: 476,
  cw_01: 401, cw_02: 410, cw_03: 406, cw_04: 400, fly_01: 263, fly_02: 285, fly_03: 271,
};
const MAN_K = 640 / 257; // 남자 키 640px
const WOMAN_K = 610 / 308; // 여자 키 610px
const P: React.FC<{ pose: string; x: number; floor: number; s?: number; flip?: boolean; bob?: number; o?: number; pop?: number; rot?: number }> = ({ pose, x, floor, s = 1, flip, bob = 0, o = 1, pop = 1, rot = 0 }) => {
  // 시트마다 그린 크기가 달라서 시트별 배율 (서 있는 키 기준: 남자 640, 여자 610)
  const K: Record<string, number> = { c80_02: 640 / 496, c80_03: 640 / 496, c80_01: 610 / 481, c80_04: 610 / 481, cw_02: 640 / 410, cw_03: 640 / 410, cw_01: 610 / 401, cw_04: 610 / 401, fly_01: 640 / 256, fly_02: 640 / 256, fly_03: 640 / 256 };
  const k = K[pose] ?? (pose.startsWith("man") ? MAN_K : WOMAN_K);
  const h = SRC_H[pose] * k * s;
  const fr = useCurrentFrame();
  const breathe = 1 + 0.014 * Math.sin(fr * 0.16 + x * 0.01);
  const sway = 1.2 * Math.sin(fr * 0.09 + x * 0.02);
  const squash = 1;
  return (
    <div style={{ position: "absolute", left: x, top: floor - h - bob, height: h, transform: `translateX(-50%) scale(${pop * squash}, ${pop * breathe * (2 - squash)}) rotate(${rot + sway}deg)`, transformOrigin: "50% 100%", opacity: o }}>
      {/* 발밑 그림자 */}
      <div style={{ position: "absolute", left: "50%", bottom: -10 + bob, width: h * 0.42, height: h * 0.05, transform: "translateX(-50%)", borderRadius: "50%", background: "rgba(70,40,25,0.28)", filter: "blur(4px)", opacity: Math.max(0, 1 - bob / 120) }} />
      <Img src={src(pose)} style={{ height: h, transform: flip ? "scaleX(-1)" : undefined, display: "block" }} />
    </div>
  );
};

// ---------------------------------------------------------------- 무대·카메라
const Stage: React.FC<{ bg: string; z?: number; fx?: number; fy?: number; children?: React.ReactNode; o?: number }> = ({ bg, z = 1, fx = 540, fy = 960, children, o = 1 }) => (
  <AbsoluteFill style={{ opacity: o }}>
    <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: `${fx}px ${fy}px` }}>
      <Img src={src(bg)} style={{ width: 1080, height: 1920 }} />
      {children}
    </AbsoluteFill>
  </AbsoluteFill>
);
const ease = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// 번호 배지 (1·2·3) 와 물음표
const Badge: React.FC<{ label: string; x: number; y: number; s: number; color?: string }> = ({ label, x, y, s, color = "#f3ede2" }) => (
  <div style={{ position: "absolute", left: x - 85, top: y - 85, width: 170, height: 170, borderRadius: "50%", background: color, border: `9px solid ${INK}`, transform: `scale(${s})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 0 rgba(42,28,36,0.25)" }}>
    <span style={{ fontFamily: sans, fontWeight: 900, fontSize: 100, color: INK, lineHeight: 1 }}>{label}</span>
  </div>
);
const popAt = (f: number, at: number) => spring({ frame: f - at, fps: FPS, config: { damping: 11, stiffness: 220 } });

// 하트 (깨지면 두 쪽이 벌어짐)
const Heart: React.FC<{ x: number; y: number; s: number; crack: number }> = ({ x, y, s, crack }) => {
  const half = (side: -1 | 1) => (
    <svg width={240} height={220} viewBox="0 0 240 220" style={{ position: "absolute", left: 0, top: 0, transform: `translate(${side * crack * 60}px, ${crack * 30}px) rotate(${side * crack * 14}deg)` }}>
      <defs>
        <clipPath id={`h${side}`}>
          <path d={side < 0 ? "M0 0 L124 0 L104 60 L132 100 L108 150 L120 220 L0 220 Z" : "M124 0 L240 0 L240 220 L120 220 L108 150 L132 100 L104 60 Z"} />
        </clipPath>
      </defs>
      <path clipPath={`url(#h${side})`} d="M120 205 C40 150 10 110 14 70 C18 30 52 12 82 14 C102 16 114 28 120 42 C126 28 138 16 158 14 C188 12 222 30 226 70 C230 110 200 150 120 205 Z" fill="#e2574c" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
    </svg>
  );
  return (
    <div style={{ position: "absolute", left: x - 120, top: y - 110, width: 240, height: 220, transform: `scale(${s})` }}>
      {half(-1)}
      {half(1)}
    </div>
  );
};

// 민화풍 날개 (코드 그림, 퍼덕임). 한 장을 그려 좌우로 뒤집어 붙인다 → 크기·높이·각도가 항상 대칭
const Wings: React.FC<{ x: number; y: number; flap: number; s?: number }> = ({ x, y, flap, s = 1 }) => {
  const wing = (side: -1 | 1) => (
    <div key={side} style={{ position: "absolute", left: side * 40, top: 0, transform: `scaleX(${side})` }}>
      <svg width={260} height={200} viewBox="0 0 260 200" style={{ position: "absolute", left: -10, top: -120, transform: `rotate(${-flap * 18}deg)`, transformOrigin: "10px 120px", overflow: "visible" }}>
        <path d="M10 120 C30 40 120 0 240 20 C210 40 230 50 200 64 C220 74 200 86 172 92 C186 104 160 112 138 114 C140 130 100 134 80 130 C60 150 30 148 10 120 Z" fill="#fbf6ec" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d="M50 110 C90 80 140 60 200 50 M60 124 C100 104 130 96 168 92" stroke="#c9bba4" strokeWidth={5} fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${s})` }}>
      {wing(-1)}
      {wing(1)}
    </div>
  );
};

// ---------------------------------------------------------------- 장면
type SceneProps = { t: number; f: number; dur: number; lang?: Lang };
const FLOOR_PARK = 1700;

const Intro: React.FC<SceneProps> = ({ t, f }) => {
  const w = ease(Math.min(1, t / 0.45));
  const walking = t < 0.45;
  const bob = walking ? Math.abs(Math.sin(f * 0.45)) * 12 : 0;
  return (
    <Stage bg="park" z={lerp(1, 1.08, t)} fy={1350}>
      <P pose={walking ? "man_02" : "man_04"} x={lerp(-150, 400, w)} floor={FLOOR_PARK} bob={bob} />
      <P pose={walking ? "woman_02" : "woman_01"} x={lerp(1230, 690, w)} floor={FLOOR_PARK} bob={bob} />
      {[0, 1, 2].map((i) => <Badge key={i} label={`${i + 1}`} x={300 + i * 240} y={900} s={popAt(f, 70 + i * 12)} color={i === 2 ? YELLOW : undefined} />)}
    </Stage>
  );
};
const Shoes: React.FC<SceneProps> = ({ t, f, dur }) => {
  const open = t > 0.5;
  return (
    <Stage bg="park" z={lerp(1.12, 1.2, t)} fy={1400}>
      <P pose="man_06" flip x={410} floor={FLOOR_PARK} />
      <P pose={open ? "woman_06" : "woman_01"} x={700} floor={FLOOR_PARK} pop={open ? 0.9 + 0.1 * popAt(f, Math.round(dur * 0.5)) : 1} />
    </Stage>
  );
};
const Walk: React.FC<SceneProps> = ({ t, f }) => (
  <Stage bg="park" z={1.12} fy={1400}>
    <P pose="man_05" x={380} floor={FLOOR_PARK} />
    <P pose="woman_02" flip x={lerp(700, 1300, ease(t))} floor={FLOOR_PARK} bob={Math.abs(Math.sin(f * 0.45)) * 12} />
  </Stage>
);
const Away: React.FC<SceneProps> = ({ t, f }) => (
  <Stage bg="park" z={1.1} fy={1400}>
    <P pose="woman_03" x={lerp(640, 600, t)} floor={lerp(FLOOR_PARK, 1470, ease(t))} s={lerp(1, 0.5, ease(t))} bob={Math.abs(Math.sin(f * 0.45)) * 10 * (1 - t)} o={1 - Math.max(0, (t - 0.85) / 0.15)} />
    <P pose="man_05" x={330} floor={FLOOR_PARK + 60} s={1.1} />
  </Stage>
);
// 몇십 년 전(1980년대): 같은 공원, 흑백. 신발을 받으면 동전을 건네 "산 것"으로 친다 → 지금 커플은 웃어넘김
const Coin: React.FC<SceneProps> = ({ t, f }) => {
  const swap = t > 0.33; // 동전과 신발이 오간 뒤
  const k = interpolate(t, [0.6, 0.68], [0, 1], cl);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, filter: "grayscale(1) sepia(0.12) contrast(1.05)" }}>
        <Stage bg="park" z={1.12} fy={1400}>
          <P pose={swap ? "c80_04" : "c80_01"} x={swap ? 420 : 400} floor={FLOOR_PARK} />
          <P pose={swap ? "c80_03" : "c80_02"} x={swap ? 690 : 700} floor={FLOOR_PARK} pop={swap ? 1 : 0.97 + 0.03 * Math.sin(f * 0.3)} />
        </Stage>
      </div>
      {k > 0 && (
        <Stage bg="park" z={1.1} fy={1400} o={k}>
          <P pose="man_04" x={400} floor={FLOOR_PARK} bob={Math.abs(Math.sin(f * 0.6)) * 6} />
          <P pose="woman_04" x={700} floor={FLOOR_PARK} bob={Math.abs(Math.sin(f * 0.6 + 1)) * 6} />
        </Stage>
      )}
    </>
  );
};
const Chicken: React.FC<SceneProps> = ({ t }) => <Stage bg="chicken_pub" z={lerp(1, 1.35, ease(t))} fx={540} fy={1350} />;
const FLOOR_PUB = 1830;
// 닭 날개를 건넴 → 먹음 → 놀람 → 등에 날개가 돋음 → 떠오름 → 뒤돌아 날아감, 여자는 빈손으로 멍하니
// 자막 박자에 맞춤: "So feed your partner wings"에서 건네고 먹음 → "fly off"에서 놀람·날개 돋음·떠오름 → "someone else"에서 날아감
const FLY_BEATS: Record<Lang, number[]> = { en: [0.5, 0.58, 0.667, 0.72, 0.78, 0.833], es: [0.43, 0.57, 0.71, 0.76, 0.81, 0.857] };
const Fly: React.FC<SceneProps> = ({ t, f, lang = "en" }) => {
  const B = FLY_BEATS[lang];
  const step = B.filter((b) => t >= b).length; // 0 = 그냥 앉아 있음
  const rise = ease(interpolate(t, [B[4], B[5]], [0, 1], cl));
  const away = ease(interpolate(t, [B[5], 1], [0, 1], cl));
  const man = ["man_01", "man_01", "cw_02", "cw_03", "fly_01", "fly_02", "fly_03"][step];
  const woman = step === 0 ? "woman_01" : step === 1 ? "cw_01" : step < 6 ? "woman_01" : "cw_04";
  const bob = step === 5 ? Math.sin(f * 0.5) * 14 : 0;
  return (
    <Stage bg="chicken_pub" z={1.08} fy={1500}>
      <P pose={woman} x={300} floor={FLOOR_PUB} />
      <P pose={man} x={lerp(770, 1000, away)} floor={FLOOR_PUB - rise * 260 - away * 900} bob={bob} s={1 - away * 0.45} />
    </Stage>
  );
};
const Plate: React.FC<SceneProps> = ({ t }) => {
  const k = ease(t);
  return <Stage bg="family_table" z={lerp(1.1, 1.55, k)} fx={lerp(540, 280, k)} fy={lerp(1450, 1510, k)} />;
};
const Wall: React.FC<SceneProps> = ({ t }) => <Stage bg="stonewall" z={lerp(1, 1.12, ease(t))} fx={560} fy={1450} />;
const FLOOR_WALL = 1760;
const Split: React.FC<SceneProps> = ({ t, f, dur }) => {
  const c = ease(Math.max(0, Math.min(1, (t - 0.55) / 0.3)));
  const bob = Math.abs(Math.sin(f * 0.45)) * 10 * (1 - c);
  return (
    <Stage bg="stonewall" z={1.12} fx={560} fy={1450}>
      <Heart x={540} y={1000} s={popAt(f, 6)} crack={c} />
      <P pose="man_02" x={lerp(450, 300, c)} floor={FLOOR_WALL} bob={bob} />
      <P pose={c > 0.2 ? "woman_02" : "woman_02"} flip={c < 0.2} x={lerp(640, 790, c)} floor={FLOOR_WALL} bob={bob} />
      {void dur}
    </Stage>
  );
};
const BW: React.CSSProperties = { filter: "grayscale(1) sepia(0.15) contrast(1.05)" };
const Court: React.FC<SceneProps> = ({ t }) => <div style={{ ...BW, position: "absolute", inset: 0 }}><Stage bg="stonewall_old" z={lerp(1.45, 1.6, t)} fx={760} fy={1450} /></div>;
const Gone: React.FC<SceneProps> = ({ t }) => {
  const k = interpolate(t, [0.25, 0.85], [0, 1], cl);
  return (
    <>
      <div style={{ ...BW, position: "absolute", inset: 0 }}><Stage bg="stonewall_old" z={1.6} fx={760} fy={1450} /></div>
      <Stage bg="stonewall" z={lerp(1.6, 1.15, ease(k))} fx={760} fy={1450} o={k} />
    </>
  );
};
const End: React.FC<SceneProps> = ({ t, f, dur }) => {
  const q = Math.round(dur * 0.78);
  return (
    <Stage bg="stonewall" z={lerp(1.15, 1.05, t)} fx={560} fy={1450}>
      <P pose="man_01" x={470} floor={FLOOR_WALL} bob={Math.abs(Math.sin(f * 0.2)) * 4} />
      <P pose="woman_01" x={615} floor={FLOOR_WALL} bob={Math.abs(Math.sin(f * 0.2 + 1)) * 4} />
      {[0, 1, 2].map((i) => <Badge key={i} label={`${i + 1}`} x={300 + i * 240} y={1000} s={popAt(f, q + i * 6)} />)}
      <Badge label="?" x={540} y={790} s={popAt(f, q + 24)} color={YELLOW} />
    </Stage>
  );
};

const SCENES: Record<string, React.FC<SceneProps>> = { intro: Intro, shoes: Shoes, walk: Walk, away: Away, coin: Coin, chicken: Chicken, fly: Fly, plate: Plate, wall: Wall, split: Split, court: Court, gone: Gone, end: End };
// 전환: cloud = 민화 구름이 화면을 쓸고 지나감(현대 장면 바뀔 때), old = 바랜 한지로 천천히 물듦(옛날로 갈 때)
const TRANS: Record<string, { kind: "cloud" | "old"; n: number }> = { coin: { kind: "old", n: 15 }, chicken: { kind: "cloud", n: 18 }, wall: { kind: "cloud", n: 18 }, court: { kind: "old", n: 15 } };

const CloudWipe: React.FC<{ p: number }> = ({ p }) => {
  // p 0→1: 구름 떼가 오른쪽에서 들어와 왼쪽으로 빠져나감
  const x = lerp(1300, -2300, p);
  const rows = [
    { c: "cloud_03", y: 150, s: 3.2, dx: 0 },
    { c: "cloud_01", y: 560, s: 3.6, dx: 380 },
    { c: "cloud_03", y: 980, s: 3.4, dx: 120 },
    { c: "cloud_01", y: 1380, s: 3.8, dx: 460 },
  ];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "#f3ead8", opacity: interpolate(p, [0.25, 0.5, 0.75], [0, 0.85, 0], cl) }} />
      {rows.map((r, i) => (
        <Img key={i} src={src(r.c)} style={{ position: "absolute", left: x + r.dx, top: r.y, height: (r.c === "cloud_03" ? 129 : 116) * r.s }} />
      ))}
    </AbsoluteFill>
  );
};

const Caption: React.FC<{ cap: Cap }> = ({ cap }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 330, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 22px", transform: `scale(${0.85 + 0.15 * pop})` }}>
      {cap.map((x, i) => (
        <span key={i} style={{ fontFamily: sans, fontWeight: 900, fontSize: 84, lineHeight: 1.15, textAlign: "center", color: x.hl ? YELLOW : "#fff", WebkitTextStroke: `14px ${INK}`, paintOrder: "stroke fill", textShadow: "0 6px 14px rgba(42,28,36,0.35)" }}>
          {x.text}
        </span>
      ))}
    </div>
  );
};
const CapTrack: React.FC<{ caps: Cap[]; dur: number }> = ({ caps, dur }) => {
  const per = dur / caps.length;
  return (
    <>
      {caps.map((c, i) => (
        <Sequence key={i} from={Math.round(i * per)} durationInFrames={Math.round((i + 1) * per) - Math.round(i * per)} layout="none">
          <Caption cap={c} />
        </Sequence>
      ))}
    </>
  );
};

const OUTDOOR = new Set(["intro", "shoes", "walk", "away", "coin", "wall", "split", "court", "gone", "end"]);
const ZOOMS = [1, 1.14, 1.04, 1.2, 1.08, 1.16];
const beatCam = (f: number, dur: number, caps: Cap[]) => {
  const n = Math.max(1, caps.length);
  const per = dur / n;
  const i = Math.min(n - 1, Math.max(0, Math.floor(f / per)));
  const into = f - i * per;
  const prevZ = i === 0 ? 1 : ZOOMS[(i - 1) % ZOOMS.length];
  const z = ZOOMS[i % ZOOMS.length];
  const k = interpolate(into, [0, 4], [0, 1], cl); // 4프레임 안에 바뀜: 컷처럼 느껴짐
  const hl = caps[i]?.some((w) => w.hl);
  const punch = hl ? 0.035 * Math.max(0, 1 - Math.abs(into - 3) / 6) : 0;
  return `scale(${lerp(prevZ, z, k) + punch})`;
};
const DriftClouds: React.FC<{ f: number }> = ({ f }) => (
  <>
    <Img src={src("cloud_01")} style={{ position: "absolute", top: 120, left: ((f * 1.6) % 1500) - 300, height: 150, opacity: 0.85 }} />
    <Img src={src("cloud_03")} style={{ position: "absolute", top: 420, left: 1200 - ((f * 1.1 + 600) % 1600), height: 130, opacity: 0.8 }} />
  </>
);
const ShotM: React.FC<{ mode: string; dur: number; pre: number; kind?: "cloud" | "old"; lang: Lang; caps: Cap[] }> = ({ mode, dur, pre, kind, lang, caps }) => {
  const f0 = useCurrentFrame();
  const f = f0 - pre;
  const t = interpolate(f, [0, dur], [0, 1], cl);
  const S = SCENES[mode];
  // cloud: 구름이 화면을 가린 한가운데서 새 장면으로 바뀜 / old: 겹쳐서 천천히 물듦
  const o = !pre ? 1 : kind === "cloud" ? (f0 < pre * 0.55 ? 0 : 1) : interpolate(f0, [0, pre], [0, 1], cl);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: o, transform: beatCam(f, dur, caps), transformOrigin: "540px 1450px" }}>
        <S t={t} f={Math.max(0, f)} dur={dur} lang={lang} />
        {OUTDOOR.has(mode) && <DriftClouds f={f0} />}
      </AbsoluteFill>
      {pre > 0 && kind === "cloud" && f0 < pre * 1.3 && <CloudWipe p={f0 / (pre * 1.3)} />}
    </AbsoluteFill>
  );
};

export const Ep04M: React.FC<{ lang?: Lang }> = ({ lang = "en" }) => {
  const b = EP04[lang];
  const caps = CAPS[lang] as Cap[][];
  const firstOf = (id: number) => SHOTS.findIndex((x) => x.sent === id);
  return (
    <AbsoluteFill style={{ backgroundColor: "#f3ead8" }}>
      {SHOTS.map((shot, i) => {
        const tr = TRANS[shot.mode];
        const pre = tr?.n ?? 0;
        return (
          <Sequence key={i} from={b.starts[i] - pre} durationInFrames={b.frames[i] + pre}>
            <ShotM mode={shot.mode} dur={b.frames[i]} pre={pre} kind={tr?.kind} lang={lang} caps={caps[i]} />
            {(shot.sfx ?? []).map((fx, k) => (
              <Sequence key={k} from={pre + Math.round((fx.at ?? 0) * FPS)} layout="none">
                <Audio src={staticFile(`sfx/${fx.name}.wav`)} volume={fx.vol ?? 0.4} />
              </Sequence>
            ))}
          </Sequence>
        );
      })}
      {SHOTS.map((_, i) => (
        <Sequence key={`c${i}`} from={b.starts[i]} durationInFrames={b.frames[i]} layout="none">
          <CapTrack caps={caps[i]} dur={b.frames[i]} />
        </Sequence>
      ))}
      {b.VO.sentences.map((v) => (
        <Sequence key={v.id} from={b.starts[firstOf(v.id)]} layout="none">
          <Audio src={staticFile(v.file)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
export const EP04M_TOTAL = { en: EP04.en.total, es: EP04.es.total };
