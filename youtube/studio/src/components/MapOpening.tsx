import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { geoBounds, geoGraticule10, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import land10m from "world-atlas/land-10m.json";

// 채널 시그니처 오프닝: 중립 지도 → 그 편의 그림풍 지도로 바뀌며 → 서울로 쑥 들어간다 (약 2초)
// 국경선은 그리지 않는다(땅 덩어리만). 정치적으로 읽히는 요소를 피하려는 것.

export type MapVariant = "old" | "modern";

const W = 1080;
const H = 1920;
const SEOUL: [number, number] = [126.98, 37.57];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const topo = land10m as unknown as Topology<{ land: GeometryCollection }>;
const LAND_ALL = feature(topo, topo.objects.land) as unknown as GeoJSON.FeatureCollection<GeoJSON.MultiPolygon | GeoJSON.Polygon>;

// 한반도 주변 땅만 남긴다. 남극처럼 투영에서 무한히 커지는 덩어리가 끼면 바다까지 땅으로 칠해진다.
const near = (poly: GeoJSON.Position[][]) => {
  const [[x0, y0], [x1, y1]] = geoBounds({ type: "Polygon", coordinates: poly });
  const wraps = x0 > x1; // 날짜변경선을 넘는 덩어리(유라시아)
  return y0 > -55 && (wraps || (x1 > 105 && x0 < 150)) && y1 > 22 && y0 < 52;
};
const LAND: GeoJSON.Feature<GeoJSON.MultiPolygon> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "MultiPolygon",
    coordinates: LAND_ALL.features.flatMap((f) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates)).filter(near),
  },
};

// 한반도가 화면 폭의 약 60%를 차지하는 투영
const projection = geoMercator().center([127.6, 36.4]).scale(6400).translate([W / 2, H * 0.47]);
const path = geoPath(projection);
const LAND_D = path(LAND) ?? "";
const GRID_D = path(geoGraticule10()) ?? "";
const [SX, SY] = projection(SEOUL) as [number, number];

type LL = [number, number];
const proj = (pts: LL[]) => pts.map((p) => projection(p) as [number, number]);
const toD = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

// 옛 지도(대동여지도·해동지도 느낌)용: 백두대간 산줄기와 큰 강. 좌표는 상징 표현용 근사치.
const RIDGE = proj([
  [128.08, 42.0], [128.0, 41.4], [127.7, 40.9], [127.4, 40.4], [127.3, 39.8], [127.5, 39.2], [127.9, 38.8], [128.15, 38.55],
  [128.47, 38.12], [128.6, 37.75], [128.9, 37.25], [128.75, 37.0], [128.45, 36.95], [128.0, 36.7], [127.85, 36.45],
  [127.75, 36.0], [127.73, 35.6], [127.73, 35.34],
]);
const RIVERS = [
  [[126.55, 37.73], [126.85, 37.58], [127.05, 37.53], [127.3, 37.55], [127.55, 37.6], [127.7, 37.45], [128.0, 37.25], [128.35, 37.2], [128.65, 37.35]],
  [[128.95, 35.08], [128.75, 35.35], [128.45, 35.7], [128.35, 36.05], [128.3, 36.4], [128.55, 36.6], [128.75, 36.9], [129.0, 37.1]],
  [[126.65, 36.0], [127.0, 36.25], [127.35, 36.45], [127.55, 36.2], [127.65, 35.95]],
  [[125.2, 38.7], [125.75, 39.0], [126.2, 39.4], [126.7, 39.8]],
  [[124.4, 40.05], [125.2, 40.4], [126.0, 40.9], [126.8, 41.4], [127.6, 41.5], [128.1, 41.9]],
  [[128.1, 42.0], [128.9, 42.35], [129.6, 42.45], [130.3, 42.6], [130.65, 42.3]],
].map((r) => toD(proj(r as LL[])));
const RIDGE_D = toD(RIDGE);

// 산줄기를 따라 일정 간격으로 산 봉우리(∧)를 찍는다
const PEAKS: [number, number][] = (() => {
  const out: [number, number][] = [];
  let carry = 0;
  const step = 30;
  for (let i = 1; i < RIDGE.length; i++) {
    const [x0, y0] = RIDGE[i - 1];
    const [x1, y1] = RIDGE[i];
    const len = Math.hypot(x1 - x0, y1 - y0);
    let t = step - carry;
    while (t <= len) {
      out.push([x0 + ((x1 - x0) * t) / len, y0 + ((y1 - y0) * t) / len]);
      t += step;
    }
    carry = (carry + len) % step;
  }
  return out;
})();
const [KX, KY] = projection([127.6, 38.4]) as [number, number]; // 한반도 가운데(주변 땅을 흐리게 할 기준)

const PAL = {
  neutral: { sea: "#e8e7e2", land: "#c7c6c0" },
  modern: { sea: "#141f31", land: "#1c2a44", line: "#ff3d8b", grid: "#2de2e6" },
  old: { sea: "#d9dfc8", land: "#ecdcb6", paper: "#efe4cc", ink: "#211b17", seal: "#b3261e", wave: "#3e6b6b", mountain: "#5f7d5c", river: "#4d7a86" },
};

export const MAP_OPENING_FRAMES = 60;

export const MapOpening: React.FC<{ variant: MapVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  // 0~10 중립 지도, 8~28 그림풍으로 바뀜, 0~44 서울로 다가감, 44~60 쑥 들어감
  const style = interpolate(frame, [8, 28], [0, 1], clamp);
  const approach = interpolate(frame, [0, 44], [0.55, 2.2], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const plunge = interpolate(frame, [44, 60], [1, 14], { ...clamp, easing: Easing.in(Easing.exp) });
  const scale = approach * plunge;
  const blur = interpolate(frame, [48, 60], [0, 14], clamp);
  const flash = interpolate(frame, [52, 60], [0, 1], clamp);
  const pin = interpolate(frame, [22, 32], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });

  // 서울을 화면 가운데로 끌어오면서 확대
  const tx = (W / 2 - SX) * interpolate(frame, [0, 44], [0, 1], clamp);
  const ty = (H * 0.45 - SY) * interpolate(frame, [0, 44], [0, 1], clamp);
  const camera = `translate(${tx}px, ${ty}px) scale(${scale})`;

  const m = PAL.modern;
  const o = PAL.old;

  return (
    <AbsoluteFill style={{ backgroundColor: PAL.neutral.sea, overflow: "hidden" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", transformOrigin: `${SX}px ${SY}px`, transform: camera, filter: `blur(${blur}px)` }}>
        <defs>
          <filter id="mo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id="mo-ink" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={1} seed={3} />
            <feDisplacementMap in="SourceGraphic" scale={4} />
          </filter>
          <radialGradient id="mo-focus" gradientUnits="userSpaceOnUse" cx={KX} cy={KY} r={760}>
            <stop offset="0.55" stopColor={PAL.old.paper} stopOpacity={0} />
            <stop offset="1" stopColor={PAL.old.paper} stopOpacity={0.88} />
          </radialGradient>
          <filter id="mo-stain">
            <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves={3} seed={17} />
            <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0 0.16  0 0 0 0.55 -0.12" />
          </filter>
          {/* 옛 편 바다: 끝이 말리는 물결 무늬 */}
          <pattern id="mo-waves" width="120" height="60" patternUnits="userSpaceOnUse">
            <path d="M 0 40 C 30 38 50 18 74 16 C 92 14 100 28 90 34 C 82 38 76 30 82 26" fill="none" stroke={o.wave} strokeWidth="3" strokeLinecap="round" opacity="0.55" />
          </pattern>
        </defs>

        {/* 중립 */}
        <rect x={-W} y={-H} width={W * 3} height={H * 3} fill={PAL.neutral.sea} />
        <path d={LAND_D} fill={PAL.neutral.land} />

        {variant === "modern" ? (
          <g opacity={style}>
            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill={m.sea} />
            <path d={GRID_D} fill="none" stroke={m.grid} strokeWidth={1.5} opacity={0.25} vectorEffect="non-scaling-stroke" />
            <path d={LAND_D} fill={m.land} />
            <path d={LAND_D} fill="none" stroke={m.line} strokeWidth={10} opacity={0.7} filter="url(#mo-glow)" />
            <path d={LAND_D} fill="none" stroke={m.line} strokeWidth={3} vectorEffect="non-scaling-stroke" />
          </g>
        ) : (
          <g opacity={style}>
            {/* 바다: 옅은 청록 물빛 + 물결 */}
            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill={o.sea} />
            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="url(#mo-waves)" />
            <path d={LAND_D} fill={o.land} />
            {/* 강: 먹선 두 줄 사이를 물빛으로 비운 목판 지도식 */}
            {RIVERS.map((d, i) => (
              <g key={i} filter="url(#mo-ink)">
                <path d={d} fill="none" stroke={o.ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
                <path d={d} fill="none" stroke={o.river} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ))}
            {/* 백두대간: 초록 산 띠 + 줄지어 선 봉우리 */}
            <path d={RIDGE_D} fill="none" stroke={o.mountain} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" opacity={0.45} />
            {PEAKS.map(([x, y], i) => (
              <path
                key={i}
                d={`M ${x - 11} ${y + 7} L ${x - 2} ${y - 13 - (i % 3) * 3} L ${x + 3} ${y - 4} L ${x + 7} ${y - 10} L ${x + 12} ${y + 7} Z`}
                fill={o.mountain}
                stroke={o.ink}
                strokeWidth={2.2}
                strokeLinejoin="round"
                filter="url(#mo-ink)"
              />
            ))}
            {/* 해안선 먹선 */}
            <path d={LAND_D} fill="none" stroke={o.ink} strokeWidth={4} filter="url(#mo-ink)" vectorEffect="non-scaling-stroke" />
            {/* 한반도 밖은 한지 속으로 흐리게: 옛 지도처럼 우리 땅에 시선을 모은다 */}
            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="url(#mo-focus)" />
            {/* 종이 얼룩 */}
            <rect x={-W} y={-H} width={W * 3} height={H * 3} filter="url(#mo-stain)" opacity={0.5} />
          </g>
        )}

        {/* 서울 표시 */}
        {variant === "modern" ? (
          <g transform={`translate(${SX} ${SY}) scale(${pin})`}>
            <circle r={34} fill="none" stroke={m.grid} strokeWidth={4} opacity={0.9} />
            <circle r={14} fill={m.line} />
          </g>
        ) : (
          <g transform={`translate(${SX} ${SY}) scale(${pin})`}>
            <circle r={20} fill={PAL.old.paper} stroke={o.ink} strokeWidth={4} />
            <circle r={11} fill="none" stroke={o.ink} strokeWidth={2.5} />
            <g transform="translate(30 -30) rotate(-6)">
              <rect x={-16} y={-16} width={32} height={32} fill={o.seal} />
              <rect x={-11} y={-11} width={22} height={22} fill="none" stroke="#f6e9d6" strokeWidth={2.5} />
            </g>
          </g>
        )}
      </svg>
      {variant === "old" && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: style * interpolate(frame, [40, 50], [1, 0], clamp) }}>
          <rect x={40} y={40} width={W - 80} height={H - 80} fill="none" stroke={o.ink} strokeWidth={12} />
          <rect x={60} y={60} width={W - 120} height={H - 120} fill="none" stroke={o.ink} strokeWidth={3} />
        </svg>
      )}
      {/* 쑥 들어갈 때 번쩍: 요즘 편은 네온빛, 옛 편은 한지빛 */}
      <AbsoluteFill style={{ backgroundColor: variant === "modern" ? "#ff3d8b" : "#f6ecd6", opacity: flash * 0.85 }} />
    </AbsoluteFill>
  );
};
