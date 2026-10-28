import { interpolate, useCurrentFrame } from "remotion";

// 붓 획 그리기: 획 하나하나를 실제 획순대로 긋는다.
// strokes는 글자마다 직접 그린 SVG 경로(size×size 좌표). 쇼츠 1편에 단어 하나라 손으로 그려도 부담이 적다.
export type BrushStrokesProps = {
  strokes: string[];
  start: number; // 첫 획 시작 프레임
  perStroke: number; // 획당 프레임
  gap?: number; // 획 사이 쉬는 프레임 (붓을 떼는 시간)
  size: number;
  weight: number; // 획 굵기
  color?: string;
  seed?: number;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const BrushStrokes: React.FC<BrushStrokesProps> = ({
  strokes,
  start,
  perStroke,
  gap = 3,
  size,
  weight,
  color = "#211b17",
  seed = 3,
}) => {
  const frame = useCurrentFrame();
  const id = `bs-${seed}`;
  const end = start + strokes.length * (perStroke + gap);
  const bleed = interpolate(frame, [end, end + 20], [0, 1], clamp);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      <defs>
        {/* 획 가장자리를 붓처럼 거칠게 */}
        <filter id={`${id}-rough`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves={3} seed={seed} />
          <feDisplacementMap in="SourceGraphic" scale={weight * 0.28} />
        </filter>
        <filter id={`${id}-bleed`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={3 + bleed * 9} />
        </filter>
      </defs>

      {/* 다 쓴 뒤 한지에 번지는 먹 */}
      <g opacity={0.22 * bleed} filter={`url(#${id}-bleed)`}>
        {strokes.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={color} strokeWidth={weight * 1.15} strokeLinecap="round" />
        ))}
      </g>

      <g filter={`url(#${id}-rough)`}>
        {strokes.map((d, i) => {
          const s = start + i * (perStroke + gap);
          // 처음엔 빠르게 긋고 끝에서 살짝 머무는 붓 속도
          const p = interpolate(frame, [s, s + perStroke], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 2.2) });
          return (
            <path
              key={i}
              d={d}
              pathLength={1}
              fill="none"
              stroke={color}
              strokeWidth={weight}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="1 1"
              strokeDashoffset={1 - p}
              opacity={p > 0 ? 1 : 0}
            />
          );
        })}
      </g>
    </svg>
  );
};
