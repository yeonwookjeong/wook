import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadHahmlet } from "@remotion/google-fonts/Hahmlet";
import { loadFont as loadNotoSans } from "@remotion/google-fonts/NotoSansKR";

const { fontFamily: serif } = loadHahmlet();
const { fontFamily: sans } = loadNotoSans();

// 채널 배너 2560×1440. 휴대폰에서는 가운데 1546×423만 보이므로 이름·로고는 그 안에.
const W = 2560;
const H = 1440;
const SAFE = { w: 1546, h: 423, x: (2560 - 1546) / 2, y: (1440 - 423) / 2 };

// 태극 문양: 위 빨강, 아래 파랑 (태극기의 사괘는 넣지 않는다)
export const Taegeuk: React.FC<{ size: number }> = ({ size }) => {
  const r = size / 2;
  return (
    <svg width={size} height={size} viewBox={`${-r} ${-r} ${size} ${size}`}>
      <circle r={r} fill="#0047a0" />
      <path d={`M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0 A ${r / 2} ${r / 2} 0 0 1 0 0 A ${r / 2} ${r / 2} 0 0 0 ${-r} 0 Z`} fill="#cd2e3a" />
      <circle r={r} fill="none" stroke="#fff" strokeWidth={size * 0.04} />
    </svg>
  );
};

export const Banner: React.FC<{ showSafe?: boolean; tagline?: string }> = ({ showSafe, tagline = "Why Koreans do what they do." }) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Img src={staticFile("brand/banner-art.png")} style={{ width: W, height: H, objectFit: "cover" }} />
    {/* 이름 아래를 살짝 어둡게 해서 글자가 그림에 묻히지 않게 */}
    <div style={{ position: "absolute", left: 0, right: 0, top: SAFE.y + 200, height: 260, background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0) 100%)" }} />
    <div style={{ position: "absolute", left: SAFE.x, width: SAFE.w, top: SAFE.y + 215, height: 190, display: "flex", alignItems: "center", justifyContent: "center", gap: 34 }}>
      <Taegeuk size={118} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <span style={{ fontFamily: serif, fontWeight: 800, fontSize: 124, lineHeight: 1, letterSpacing: "0.06em", color: "#fff", textShadow: "0 4px 18px rgba(0,0,0,0.6)" }}>KONORAMA</span>
        <span style={{ fontFamily: sans, fontWeight: 700, fontSize: 46, letterSpacing: "0.02em", color: "#fff", marginTop: 12, textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}>{tagline}</span>
      </div>
    </div>
    {showSafe && <div style={{ position: "absolute", left: SAFE.x, top: SAFE.y, width: SAFE.w, height: SAFE.h, border: "6px dashed #ff2a2a" }} />}
  </AbsoluteFill>
);
