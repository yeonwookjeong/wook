import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadHahmlet } from "@remotion/google-fonts/Hahmlet";
import { loadFont as loadNotoSans } from "@remotion/google-fonts/NotoSansKR";
import { BrushReveal } from "./BrushReveal";

const { fontFamily: serif } = loadHahmlet();
const { fontFamily: sans } = loadNotoSans();

// 채널 공통 색 (youtube/decisions.md)
const C = {
  hanji: "#f3ead8",
  ink: "#211b17",
  seal: "#b3261e",
  sealText: "#f6e9d6",
  inkSoft: "#62564c",
};

// 화면 글자는 그림에 새기지 않고 props로 받는다 (언어 교체용)
export type WordCardProps = {
  word: string;
  romanization: string;
  lines: string[];
  seal: string;
};

export const wordCardDefaults: WordCardProps = {
  word: "사",
  romanization: "sa",
  lines: ["四 = four", "死 = death"],
  seal: "이야기",
};

export const WordCard: React.FC<WordCardProps> = ({ word, romanization, lines, seal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const romanIn = interpolate(frame, [58, 76], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sealIn = spring({ frame: frame - 120, fps, config: { damping: 9, stiffness: 180 } });

  return (
    <AbsoluteFill style={{ backgroundColor: C.hanji, color: C.ink, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 48, border: `6px solid ${C.ink}` }} />
      <div style={{ position: "absolute", inset: 66, border: `2px solid ${C.ink}` }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <BrushReveal text={word} start={8} duration={42} width={760} height={600} fontSize={900} bands={3} />
        <div style={{ fontFamily: serif, fontWeight: 600, fontSize: 110, opacity: romanIn, transform: `translateY(${(1 - romanIn) * 30}px)` }}>
          {romanization}
        </div>
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          {lines.map((line, i) => {
            const start = 85 + i * 20;
            const o = interpolate(frame, [start, start + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={line} style={{ fontFamily: sans, fontWeight: 700, fontSize: 72, color: i === lines.length - 1 ? C.seal : C.ink, opacity: o }}>
                {line}
              </div>
            );
          })}
        </div>
      </div>

      {/* 주홍 인장: 크게 떨어졌다가 쾅 찍힘 */}
      <div
        style={{
          position: "absolute",
          right: 130,
          bottom: 200,
          width: 220,
          height: 220,
          backgroundColor: C.seal,
          color: C.sealText,
          display: "grid",
          placeItems: "center",
          fontFamily: serif,
          fontWeight: 800,
          fontSize: 64,
          opacity: frame < 120 ? 0 : 1,
          transform: `scale(${interpolate(sealIn, [0, 1], [1.8, 1])}) rotate(${interpolate(sealIn, [0, 1], [-12, -4])}deg)`,
        }}
      >
        {seal}
      </div>

      <div style={{ position: "absolute", bottom: 110, fontFamily: sans, fontSize: 32, color: C.inkSoft }}>
        렌더링 시험 · Korea, Word by Word
      </div>
    </AbsoluteFill>
  );
};
