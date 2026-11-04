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

// 한 줄 소개를 배너의 그림풍 경계(가운데)에서 띄어쓰기로 나눈다: 왼쪽은 먹빛(옛), 오른쪽은 노을빛 흰색(요즘)
const SPLIT_X = W / 2;
const GAP = 22;

export const Banner: React.FC<{ showSafe?: boolean; left?: string; right?: string }> = ({
  showSafe,
  left = "The stories behind",
  right = "Korea, old and new",
}) => {
  const font = { fontFamily: serif, fontWeight: 700, fontSize: 70, whiteSpace: "nowrap" as const, position: "absolute" as const, top: SAFE.y + 40 };
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Img src={staticFile("brand/banner-art.png")} style={{ width: W, height: H, objectFit: "cover" }} />
      <span style={{ ...font, right: W - SPLIT_X + GAP, color: "#2b2420", textShadow: "0 0 14px rgba(255,246,230,0.85)" }}>{left}</span>
      <span
        style={{
          ...font,
          left: SPLIT_X + GAP,
          color: "#ffffff",
          textShadow: "0 2px 4px rgba(70,35,25,0.55), 0 0 20px rgba(110,55,40,0.45)",
        }}
      >
        {right}
      </span>
      {showSafe && <div style={{ position: "absolute", left: SAFE.x, top: SAFE.y, width: SAFE.w, height: SAFE.h, border: "6px dashed #ff2a2a" }} />}
    </AbsoluteFill>
  );
};
