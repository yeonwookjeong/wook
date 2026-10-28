import { interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadBrush } from "@remotion/google-fonts/NanumBrushScript";
import { loadFont as loadHahmlet } from "@remotion/google-fonts/Hahmlet";

const { fontFamily: brushFont } = loadBrush();
const { fontFamily: serifFont } = loadHahmlet();

// 붓 획 리빌: 글자를 왼쪽 획부터 위→아래로 써 내려가듯 드러내고, 다 쓰면 먹이 번진다.
// 진짜 획순이 아니라 "세로 띠 N개"를 차례로 여는 근사치다. 한글 대부분이 왼쪽→오른쪽 순이라 자연스럽게 보인다.
export type BrushRevealProps = {
  text: string;
  start: number; // 시작 프레임
  duration: number; // 다 쓰는 데 걸리는 프레임
  width: number;
  height: number;
  fontSize: number;
  color?: string;
  bands?: number; // 띠 개수 (보통 글자당 2~3)
  font?: "brush" | "serif";
  seed?: number; // 번짐 무늬를 글자마다 다르게
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const BrushReveal: React.FC<BrushRevealProps> = ({
  text,
  start,
  duration,
  width,
  height,
  fontSize,
  color = "#211b17",
  bands = 3,
  font = "brush",
  seed = 7,
}) => {
  const frame = useCurrentFrame();
  const id = `br-${seed}-${text.length}`;
  const per = duration / bands;
  const end = start + duration;

  // 다 쓴 뒤 먹 번짐 (뒤쪽 흐린 글자가 퍼짐)
  const bleed = interpolate(frame, [end, end + 25], [0, 1], clamp);
  // 띠 가장자리 거칠기: 쓰는 동안 조금씩 움직여 붓 질감처럼
  const rough = interpolate(frame, [start, end], [26, 14], clamp);

  const bandW = width / bands;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <defs>
        <filter id={`${id}-rough`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={seed + Math.floor(frame / 3)} />
          <feDisplacementMap in="SourceGraphic" scale={rough} />
        </filter>
        <filter id={`${id}-bleed`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={2 + bleed * 10} />
        </filter>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
          <g filter={`url(#${id}-rough)`}>
            {Array.from({ length: bands }).map((_, i) => {
              const p = interpolate(frame, [start + i * per, start + (i + 1) * per], [0, 1], clamp);
              return (
                <rect
                  key={i}
                  x={i * bandW - 20}
                  y={-40}
                  width={bandW + 40}
                  height={(height + 80) * p}
                  fill="white"
                  transform={`rotate(${i % 2 === 0 ? -6 : 5} ${i * bandW + bandW / 2} ${height / 2})`}
                />
              );
            })}
          </g>
        </mask>
      </defs>

      {/* 번지는 먹 */}
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={font === "brush" ? brushFont : serifFont}
        fontWeight={font === "brush" ? 400 : 900}
        fontSize={fontSize}
        fill={color}
        opacity={0.28 * bleed}
        filter={`url(#${id}-bleed)`}
      >
        {text}
      </text>

      {/* 본 글자 */}
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={font === "brush" ? brushFont : serifFont}
        fontWeight={font === "brush" ? 400 : 900}
        fontSize={fontSize}
        fill={color}
        stroke={color}
        strokeWidth={font === "brush" ? fontSize * 0.018 : 0}
        strokeLinejoin="round"
        mask={`url(#${id}-mask)`}
      >
        {text}
      </text>

      {/* 먹 튄 자국: 띠 하나가 끝날 때마다 하나씩 */}
      {Array.from({ length: bands }).map((_, i) => {
        const t = start + (i + 1) * per;
        const s = interpolate(frame, [t - 2, t + 4], [0, 1], clamp);
        const cx = i * bandW + bandW * (i % 2 === 0 ? 0.85 : 0.2);
        const cy = height * (0.74 + (i % 3) * 0.05);
        return <circle key={i} cx={cx} cy={cy} r={(6 + (i % 2) * 5) * s} fill={color} opacity={0.85} />;
      })}
    </svg>
  );
};
