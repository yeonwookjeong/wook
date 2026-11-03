import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadHahmlet } from "@remotion/google-fonts/Hahmlet";

const { fontFamily: serif } = loadHahmlet();

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

export const Banner: React.FC<{ showSafe?: boolean; tagline?: string }> = ({ showSafe, tagline = "The stories behind Korea, old and new" }) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Img src={staticFile("brand/banner-art.png")} style={{ width: W, height: H, objectFit: "cover" }} />
    {/* 이름·로고 없이 내용 한 줄만. 글자색도 그림처럼 왼쪽 먹빛 → 오른쪽 노을빛으로 물든다 */}
    <div style={{ position: "absolute", left: SAFE.x, width: SAFE.w, top: SAFE.y + 40, display: "flex", justifyContent: "center" }}>
      <span
        style={{
          fontFamily: serif,
          fontWeight: 700,
          fontSize: 74,
          whiteSpace: "nowrap",
          letterSpacing: "0.01em",
          backgroundImage: "linear-gradient(90deg, #2b2420 0%, #2b2420 47%, #fffaf2 55%, #ffffff 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          filter: "drop-shadow(0 2px 3px rgba(60,35,20,0.45)) drop-shadow(0 0 18px rgba(120,70,40,0.35))",
        }}
      >
        {tagline}
      </span>
    </div>
    {showSafe && <div style={{ position: "absolute", left: SAFE.x, top: SAFE.y, width: SAFE.w, height: SAFE.h, border: "6px dashed #ff2a2a" }} />}
  </AbsoluteFill>
);
