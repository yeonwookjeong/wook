import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadHahmlet } from "@remotion/google-fonts/Hahmlet";
import { loadFont as loadNotoSans } from "@remotion/google-fonts/NotoSansKR";
import { BrushStrokes } from "./BrushStrokes";

const { fontFamily: serif } = loadHahmlet();
const { fontFamily: sans } = loadNotoSans();

// 과거 파트 색: 한지 + 먹 + 일월오봉도 (youtube/decisions.md)
const C = {
  hanji: "#f1e6cf",
  ink: "#211b17",
  sun: "#c8352a",
  seal: "#b3261e",
  sealText: "#f6e9d6",
  peak1: "#2f5d7c",
  peak2: "#3d6656",
  peak3: "#6f8f6a",
  gold: "#d9a43a",
};

// 화면 글자는 그림에 새기지 않고 props로 받는다 (언어 교체용)
export type WordCardProps = {
  label: string;
  strokes: string[]; // 700×700 좌표의 획순 경로
  romanization: string;
  meanings: { hanja: string; gloss: string; accent?: boolean }[];
  seal: string[]; // 세로로 쓰는 인장 글자
};

export const wordCardDefaults: WordCardProps = {
  label: "KOREAN WORD · 01",
  // 사: ㅅ 왼쪽 획 → ㅅ 오른쪽 획 → ㅏ 세로획 → ㅏ 가로획
  strokes: [
    "M 262 118 C 250 250 190 430 78 572",
    "M 222 318 C 268 410 330 500 398 566",
    "M 506 92 C 512 260 512 450 504 642",
    "M 512 356 C 560 352 600 348 646 344",
  ],
  romanization: "sa",
  meanings: [
    { hanja: "四", gloss: "four" },
    { hanja: "死", gloss: "death", accent: true },
  ],
  seal: ["이", "야", "기"],
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 일월오봉도에서 가져온 다섯 봉우리 (화면 아래 장식)
const Peaks: React.FC<{ rise: number }> = ({ rise }) => (
  <svg width={1080} height={520} viewBox="0 0 1080 520" style={{ position: "absolute", left: 0, bottom: 0, transform: `translateY(${(1 - rise) * 160}px)` }}>
    <path d="M -20 520 L 120 250 L 250 520 Z" fill={C.peak3} />
    <path d="M 860 520 L 980 240 L 1110 520 Z" fill={C.peak3} />
    <path d="M 120 520 L 300 170 L 470 520 Z" fill={C.peak2} />
    <path d="M 620 520 L 790 160 L 960 520 Z" fill={C.peak2} />
    <path d="M 330 520 L 540 60 L 750 520 Z" fill={C.peak1} />
    {/* 봉우리 금선 */}
    <path d="M 540 60 L 470 214 M 540 60 L 610 214" stroke={C.gold} strokeWidth={10} strokeLinecap="round" fill="none" />
    <path d="M 300 170 L 248 270 M 790 160 L 842 262" stroke={C.gold} strokeWidth={8} strokeLinecap="round" fill="none" />
    {/* 물결 띠 */}
    <path d="M 0 470 Q 90 440 180 470 T 360 470 T 540 470 T 720 470 T 900 470 T 1080 470 L 1080 520 L 0 520 Z" fill={C.peak1} />
  </svg>
);

export const WordCard: React.FC<WordCardProps> = ({ label, strokes, romanization, meanings, seal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sunIn = spring({ frame, fps, config: { damping: 18 } });
  const peaksIn = spring({ frame: frame - 4, fps, config: { damping: 16 } });
  const labelIn = interpolate(frame, [6, 20], [0, 1], clamp);
  const romanIn = interpolate(frame, [62, 78], [0, 1], clamp);
  const sealIn = spring({ frame: frame - 128, fps, config: { damping: 9, stiffness: 200 } });

  return (
    <AbsoluteFill style={{ backgroundColor: C.hanji, color: C.ink }}>
      {/* 한지 결 */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }} aria-hidden>
        <filter id="hanji">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.09" numOctaves={3} seed={11} />
          <feColorMatrix values="0 0 0 0 0.36  0 0 0 0 0.28  0 0 0 0 0.18  0 0 0 0.09 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hanji)" />
      </svg>

      <Peaks rise={peaksIn} />

      {/* 위 라벨 */}
      <div style={{ position: "absolute", top: 230, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 22, opacity: labelIn }}>
        <span style={{ width: 70, height: 2, background: C.ink }} />
        <span style={{ fontFamily: sans, fontWeight: 700, fontSize: 30, letterSpacing: "0.32em" }}>{label}</span>
        <span style={{ width: 70, height: 2, background: C.ink }} />
      </div>

      {/* 붉은 해 + 붓 글자 */}
      <div style={{ position: "absolute", top: 330, left: 190, width: 700, height: 700 }}>
        <div
          style={{
            position: "absolute",
            left: 330,
            top: 30,
            width: 340,
            height: 340,
            borderRadius: "50%",
            background: C.sun,
            opacity: 0.92,
            transform: `scale(${sunIn})`,
          }}
        />
        <div style={{ position: "absolute", inset: 0 }}>
          <BrushStrokes strokes={strokes} start={14} perStroke={11} gap={3} size={700} weight={70} color={C.ink} />
        </div>
        {/* 낙관: 글씨 오른쪽 아래에 쾅 */}
        <div
          style={{
            position: "absolute",
            right: -40,
            bottom: 10,
            width: 96,
            padding: "14px 0",
            background: C.seal,
            color: C.sealText,
            outline: `3px solid ${C.sealText}`,
            outlineOffset: -10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontFamily: serif,
            fontWeight: 800,
            fontSize: 44,
            lineHeight: 1.15,
            opacity: frame < 128 ? 0 : 1,
            transform: `scale(${interpolate(sealIn, [0, 1], [1.9, 1])}) rotate(${interpolate(sealIn, [0, 1], [-14, -3])}deg)`,
          }}
        >
          {seal.map((ch) => (
            <span key={ch}>{ch}</span>
          ))}
        </div>
      </div>

      {/* 로마자 */}
      <div style={{ position: "absolute", top: 1050, left: 0, right: 0, textAlign: "center", fontFamily: serif, fontWeight: 600, fontSize: 104, opacity: romanIn, transform: `translateY(${(1 - romanIn) * 24}px)` }}>
        {romanization}
      </div>

      {/* 뜻: 한자 + 영어 */}
      <div style={{ position: "absolute", top: 1210, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 36 }}>
        {meanings.map((m, i) => {
          const o = spring({ frame: frame - (88 + i * 18), fps, config: { damping: 14 } });
          return (
            <div
              key={m.hanja}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "16px 34px",
                background: m.accent ? C.ink : "rgba(255,255,255,0.55)",
                color: m.accent ? C.hanji : C.ink,
                border: `3px solid ${C.ink}`,
                opacity: o,
                transform: `translateY(${(1 - o) * 30}px)`,
              }}
            >
              <span style={{ fontFamily: serif, fontWeight: 800, fontSize: 64, color: m.accent ? "#ff8a7a" : C.ink }}>{m.hanja}</span>
              <span style={{ fontFamily: sans, fontWeight: 700, fontSize: 50 }}>{m.gloss}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
