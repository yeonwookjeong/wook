// EP04 v2: 같은 구도의 장면 그림(수정본)을 바꿔 끼우는 방식 (EP01 시험판과 같은 원리).
// 그림: public/m04v2 (Gemini, 572x1024). 무대 = 1080 x 1933 (배율 1080/572). 문장 0~7(앞부분)만.
import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadNotoSans } from "@remotion/google-fonts/NotoSansKR";
import { loadFont as loadHahmlet } from "@remotion/google-fonts/Hahmlet";
import { CAPS, EP04, SHOTS } from "../ep04/Ep04";

const { fontFamily: sans } = loadNotoSans();
const { fontFamily: serif } = loadHahmlet();
const FPS = 30;
const INK = "#2a1c24";
const YELLOW = "#ffd23a";
const RED = "#c8322a";
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
type Lang = "en" | "es";
type Cap = { text: string; hl?: boolean }[];
const img = (n: string) => staticFile(`m04v2/${n}.png`);

const K = 1080 / 572;
const SH = Math.round(1024 * K); // 1933
const P = (x: number, y: number) => [x * K, y * K] as const;

// 카메라: 무대 좌표 (fx, fy)를 화면 가운데에, z배. 무대 밖은 안 보이게 가둠
const cam = (fx: number, fy: number, z: number): React.CSSProperties => {
  const cx = Math.min(1080 - 540 / z, Math.max(540 / z, fx));
  const cy = Math.min(SH - 960 / z, Math.max(960 / z, fy));
  return { transform: `translate(${540 - cx * z}px, ${960 - cy * z}px) scale(${z})`, transformOrigin: "0 0" };
};

// 장면 그림 여러 장을 시간에 따라 바꿔 끼움. layers: [그림, 보이기 시작 t, 흑백 0..1]
type Layer = { n: string; at: number; gray?: number };
const Stage: React.FC<{ t: number; layers: Layer[]; fx: number; fy: number; z: number; fade?: number; children?: React.ReactNode; ui?: React.ReactNode }> = ({ t, layers, fx, fy, z, fade = 0.04, children, ui }) => (
  <AbsoluteFill style={{ background: "#f3ead8" }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: SH, ...cam(fx, fy, z) }}>
      {layers.map((L, i) => {
        const o = i === 0 ? 1 : interpolate(t, [L.at, L.at + fade], [0, 1], cl);
        if (o <= 0) return null;
        return <Img key={i} src={img(L.n)} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: SH, opacity: o, filter: L.gray ? `grayscale(${L.gray}) sepia(${0.15 * L.gray}) contrast(1.05)` : undefined }} />;
      })}
      {children}
    </div>
    {ui}
  </AbsoluteFill>
);

// 한지 번호 카드 (하늘에서 툭 떨어짐)
const NumCard: React.FC<{ n: string; x: number; y: number; f: number; at: number; s?: number; hl?: boolean }> = ({ n, x, y, f, at, s = 1, hl }) => {
  if (f < at) return null;
  const d = spring({ frame: f - at, fps: FPS, config: { damping: 10, stiffness: 160 } });
  return (
    <div style={{ position: "absolute", left: x - 85 * s, top: y - 100 * s + (1 - d) * -700, width: 170 * s, height: 200 * s, transform: `rotate(${(1 - d) * 18 - 4}deg)` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 20 * s, background: hl ? YELLOW : "#f6efe0", border: `${8 * s}px solid ${INK}`, boxShadow: `${8 * s}px ${10 * s}px 0 rgba(42,28,36,0.25)` }} />
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontWeight: 900, fontSize: 130 * s, color: INK, lineHeight: 1 }}>{n}</span>
    </div>
  );
};

// 붉은 도장 (쾅)
const Stamp: React.FC<{ word: string; x: number; y: number; f: number; at: number }> = ({ word, x, y, f, at }) => {
  if (f < at) return null;
  const k = spring({ frame: f - at, fps: FPS, from: 2.2, to: 1, config: { damping: 14, stiffness: 320 } });
  return (
    <div style={{ position: "absolute", left: x - 150, top: y - 150, width: 300, height: 300, transform: `scale(${k}) rotate(-12deg)`, opacity: Math.min(1, (f - at + 1) / 3) }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `14px solid ${RED}`, boxShadow: `inset 0 0 0 8px rgba(200,50,42,0.25)` }} />
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 900, fontSize: word.length > 5 ? 54 : 74, color: RED, letterSpacing: 2 }}>{word}</span>
    </div>
  );
};

// ---------------------------------------------------------------- 장면 (문장 0~7)
type SP = { t: number; f: number; dur: number; lang: Lang };
const [BOX_X, BOX_Y] = P(275, 735);
const [SNK_X, SNK_Y] = P(335, 712);
const [MAN_X, MAN_Y] = P(210, 640);
const [WING_X, WING_Y] = P(282, 585);

const Intro: React.FC<SP> = ({ t, f, dur }) => (
  <Stage t={t} layers={[{ n: "p01_gift", at: 0 }]} fx={540} fy={lerp(1150, 1250, ease(t))} z={lerp(1.0, 1.12, ease(t))} ui={[0, 1, 2].map((i) => <NumCard key={i} n={`${i + 1}`} x={330 + i * 210} y={640} f={f} at={Math.round(dur * (0.32 + i * 0.12))} hl={i === 2} />)} />
);
const Shoes: React.FC<SP> = ({ t, f }) => (
  // "Number one": 상자를 내밀고 → "shoes as a gift": 상자가 열리고 신발
  <Stage t={t} layers={[{ n: "p01_gift", at: 0 }, { n: "p02_open", at: 0.45 }]} fx={lerp(560, BOX_X + 20, ease(t))} fy={lerp(1250, BOX_Y - 40, ease(t))} z={lerp(1.15, 1.7, ease(t))} ui={<NumCard n="1" x={150} y={620} f={f} at={0} s={0.8} hl />} />
);
const Walk: React.FC<SP> = ({ t }) => (
  // "Shoes take you places. Including away.": 신발로 바짝 → 살짝 물러남
  <Stage t={t} layers={[{ n: "p02_open", at: 0 }]} fx={SNK_X} fy={SNK_Y} z={lerp(2.5, 2.1, ease(t))} />
);
const Away: React.FC<SP> = ({ t }) => (
  // 남자 얼굴 → 넓게: 신발 신고 멀리 걸어가는 여자
  <Stage t={t} layers={[{ n: "p03_leave", at: 0 }]} fx={lerp(MAN_X, 560, ease(t))} fy={lerp(MAN_Y, 1300, ease(t))} z={lerp(2.0, 1.1, ease(t))} />
);
const Coin: React.FC<SP> = ({ t, f, dur, lang }) => (
  // 80년대 흑백: 신발 ↔ 동전 → "SOLD" 도장 → 지금 커플 컬러로 웃음
  <Stage t={t} layers={[{ n: "p05_80s", at: 0, gray: 1 }, { n: "p06_80s_swap", at: 0.36, gray: 1 }, { n: "p04_laugh", at: 0.66 }]} fx={540} fy={lerp(1250, 1320, ease(t))} z={lerp(1.35, 1.2, ease(t))} fade={0.05} ui={t < 0.66 && <Stamp word={lang === "es" ? "VENDIDO" : "SOLD"} x={540} y={640} f={f} at={Math.round(dur * 0.47)} />} />
);
const Chicken: React.FC<SP> = ({ t, f }) => (
  // "Number two: chicken wings": 치킨집 → 건네는 날개로 다가감
  <Stage t={t} layers={[{ n: "c07_give", at: 0 }]} fx={lerp(540, WING_X, ease(t))} fy={lerp(1150, WING_Y, ease(t))} z={lerp(1.05, 2.2, ease(t))} ui={<NumCard n="2" x={930} y={620} f={f} at={0} s={0.8} hl />} />
);
// 자막 박자: "So feed your partner wings"에서 먹음 → "fly off"에서 떠오름
const FLY: Record<Lang, [number, number]> = { en: [0.5, 0.72], es: [0.43, 0.71] };
const Fly: React.FC<SP> = ({ t, lang }) => {
  const [bite, up] = FLY[lang];
  const u = ease(interpolate(t, [up, 1], [0, 1], cl));
  return (
    <Stage t={t} layers={[{ n: "c07_give", at: 0 }, { n: "c08_bite", at: bite }, { n: "c09_fly", at: up }]} fx={540} fy={lerp(1250, 1050, u)} z={lerp(1.2, 1.1, u)} fade={0.03} />
  );
};
// 가족 식탁: 날개가 아빠 접시에서 아들 접시로 슬그머니 미끄러짐 (천장은 화면 밖)
const [W0X, W0Y] = P(125, 780);
const [W1X, W1Y] = P(422, 778);
const Plate: React.FC<SP> = ({ t }) => {
  const m = ease(interpolate(t, [0.5, 0.85], [0, 1], cl));
  const x = lerp(W0X, W1X, m);
  const y = lerp(W0Y, W1Y, m) - Math.sin(m * Math.PI) * 70;
  return (
    <Stage t={t} layers={[{ n: "f10_nowing", at: 0 }]} fx={lerp(390, 640, m)} fy={1450} z={1.52}>
      <Img src={img("wing")} style={{ position: "absolute", left: x, top: y, width: 48 * K, transform: `rotate(${Math.sin(m * Math.PI) * -12}deg)` }} />
    </Stage>
  );
};

const SCENES: Record<string, React.FC<SP>> = { intro: Intro, shoes: Shoes, walk: Walk, away: Away, coin: Coin, chicken: Chicken, fly: Fly, plate: Plate };
// 장소가 바뀌는 곳: 구름이 쓸고 지나감
const CLOUD_AT = new Set(["chicken", "plate"]);

const Caption: React.FC<{ cap: Cap }> = ({ cap }) => {
  const frame = useCurrentFrame();
  const pop = spring({ frame, fps: FPS, config: { damping: 12, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 300, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 22px", transform: `scale(${0.85 + 0.15 * pop})` }}>
      {cap.map((x, i) => (
        <span key={i} style={{ fontFamily: sans, fontWeight: 900, fontSize: 86, lineHeight: 1.15, textAlign: "center", color: x.hl ? YELLOW : "#fff", WebkitTextStroke: `14px ${INK}`, paintOrder: "stroke fill", textShadow: "0 6px 14px rgba(42,28,36,0.35)" }}>{x.text}</span>
      ))}
    </div>
  );
};
const CloudWipe: React.FC<{ p: number }> = ({ p }) => {
  const x = lerp(1300, -2300, p);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "#f3ead8", opacity: interpolate(p, [0.25, 0.5, 0.75], [0, 0.9, 0], cl) }} />
      {[
        { c: "cloud_03", y: 150, s: 3.2, dx: 0 },
        { c: "cloud_01", y: 560, s: 3.6, dx: 380 },
        { c: "cloud_03", y: 980, s: 3.4, dx: 120 },
        { c: "cloud_01", y: 1380, s: 3.8, dx: 460 },
      ].map((r, i) => <Img key={i} src={staticFile(`m04/${r.c}.png`)} style={{ position: "absolute", left: x + r.dx, top: r.y, height: (r.c === "cloud_03" ? 129 : 116) * r.s }} />)}
    </AbsoluteFill>
  );
};

const N = SHOTS.findIndex((s) => s.sent > 7);
const used = SHOTS.slice(0, N);
export const EP04V2_TOTAL = { en: EP04.en.starts[N], es: EP04.es.starts[N] };
const PRE = 18;

const ShotV: React.FC<{ i: number; lang: Lang }> = ({ i, lang }) => {
  const f0 = useCurrentFrame();
  const b = EP04[lang];
  const mode = used[i].mode;
  const pre = CLOUD_AT.has(mode) ? PRE : 0;
  const f = f0 - pre;
  const dur = b.frames[i];
  const S = SCENES[mode];
  const show = !pre || f0 >= pre * 0.55;
  return (
    <AbsoluteFill>
      {show && <S t={interpolate(f, [0, dur], [0, 1], cl)} f={Math.max(0, f)} dur={dur} lang={lang} />}
      {pre > 0 && f0 < pre * 1.3 && <CloudWipe p={f0 / (pre * 1.3)} />}
    </AbsoluteFill>
  );
};

export const Ep04V2: React.FC<{ lang?: Lang }> = ({ lang = "en" }) => {
  const b = EP04[lang];
  const caps = CAPS[lang] as Cap[][];
  return (
    <AbsoluteFill style={{ background: "#f3ead8" }}>
      {used.map((sh, i) => {
        const pre = CLOUD_AT.has(sh.mode) ? PRE : 0;
        return (
          <Sequence key={i} from={b.starts[i] - pre} durationInFrames={b.frames[i] + pre}>
            <ShotV i={i} lang={lang} />
            {(sh.sfx ?? []).map((fx, k) => (
              <Sequence key={k} from={pre + Math.round((fx.at ?? 0) * FPS)} layout="none">
                <Audio src={staticFile(`sfx/${fx.name}.wav`)} volume={fx.vol ?? 0.4} />
              </Sequence>
            ))}
          </Sequence>
        );
      })}
      {used.map((_, i) => {
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
      {b.VO.sentences.filter((v) => v.id <= 7).map((v) => (
        <Sequence key={v.id} from={b.starts[SHOTS.findIndex((x) => x.sent === v.id)]} layout="none">
          <Audio src={staticFile(v.file)} />
        </Sequence>
      ))}
      {/* 쿵 효과: 도장 */}
      <Sequence from={b.starts[used.findIndex((s) => s.mode === "coin")] + Math.round(b.frames[used.findIndex((s) => s.mode === "coin")] * 0.47)} layout="none">
        <Audio src={staticFile("sfx/thud.wav")} volume={0.45} />
      </Sequence>
    </AbsoluteFill>
  );
};
