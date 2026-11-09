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

// 2026-11-06 배치 변경: 모든 기기에서 보이는 띠(1546×423) 안에 한옥 전체가 들어오도록 그림을 키우고 올린다.
// 한옥(원본 그림 기준 x 694~975, y 453~664)을 띠 가운데에 두고, 한 줄 소개는 한옥 양옆에 두 줄씩 놓는다.
// 왼쪽(옛, 수묵) = 먹빛 "The stories / behind", 오른쪽(요즘, 노을) = 흰색 "Korea, / old and new"
const ZOOM = 1.24;
const ORIGIN = { x: 1280, y: 855 }; // 확대 기준점 = 한옥 중심(배너 좌표)
const SHIFT_Y = SAFE.y + SAFE.h / 2 - ORIGIN.y; // 한옥 중심을 띠 가운데로
const HANOK = { left: 1012, right: 1545 }; // 확대 후 한옥 좌우 끝(배너 좌표)
const PAD = 34;

// 스페인어 채널(Konorama Español)은 같은 그림에 글자만 바꾼다. 문장이 길어 글자를 조금 줄인다.
const TEXT = {
  en: { left: ["The stories", "behind"], right: ["Korea,", "old and new"], size: 66 },
  es: { left: ["Las historias", "detrás de"], right: ["Corea,", "antigua y actual"], size: 56 },
};

export const Banner: React.FC<{ showSafe?: boolean; lang?: "en" | "es" }> = ({ showSafe, lang = "en" }) => {
  const T = TEXT[lang];
  const font = {
    fontFamily: serif,
    fontWeight: 700,
    fontSize: T.size,
    lineHeight: 1.12,
    whiteSpace: "nowrap" as const,
    position: "absolute" as const,
    top: SAFE.y + SAFE.h / 2,
    transform: "translateY(-50%)",
  };
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Img
        src={staticFile("brand/banner-art.png")}
        style={{
          width: W,
          height: H,
          objectFit: "cover",
          transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px`,
          transform: `translateY(${SHIFT_Y}px) scale(${ZOOM})`,
        }}
      />
      <div style={{ ...font, right: W - HANOK.left + PAD, textAlign: "right", color: "#2b2420", textShadow: "0 0 16px rgba(255,246,230,0.95), 0 0 4px rgba(255,246,230,0.9)" }}>
        {T.left[0]}
        <br />
        {T.left[1]}
      </div>
      <div style={{ ...font, left: HANOK.right + PAD, textAlign: "left", color: "#ffffff", textShadow: "0 2px 5px rgba(70,35,25,0.6), 0 0 22px rgba(110,55,40,0.5)" }}>
        {T.right[0]}
        <br />
        {T.right[1]}
      </div>
      {showSafe && <div style={{ position: "absolute", left: SAFE.x, top: SAFE.y, width: SAFE.w, height: SAFE.h, border: "6px dashed #ff2a2a" }} />}
    </AbsoluteFill>
  );
};
