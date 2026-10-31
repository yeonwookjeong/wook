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

const PAL = {
  neutral: { sea: "#e8e7e2", land: "#c7c6c0" },
  modern: { sea: "#141f31", land: "#1c2a44", line: "#ff3d8b", grid: "#2de2e6" },
  old: { sea: "#efe4cc", land: "#e0cfa8", ink: "#211b17", seal: "#b3261e", wave: "#2f5d7c" },
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
            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill={o.sea} />
            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="url(#mo-waves)" />
            <path d={LAND_D} fill={o.land} />
            <path d={LAND_D} fill="none" stroke={o.ink} strokeWidth={5} filter="url(#mo-ink)" vectorEffect="non-scaling-stroke" />
          </g>
        )}

        {/* 서울 표시 */}
        {variant === "modern" ? (
          <g transform={`translate(${SX} ${SY}) scale(${pin})`}>
            <circle r={34} fill="none" stroke={m.grid} strokeWidth={4} opacity={0.9} />
            <circle r={14} fill={m.line} />
          </g>
        ) : (
          <g transform={`translate(${SX} ${SY}) scale(${pin}) rotate(-6)`}>
            <rect x={-22} y={-22} width={44} height={44} fill={o.seal} />
            <rect x={-15} y={-15} width={30} height={30} fill="none" stroke="#f6e9d6" strokeWidth={3} />
          </g>
        )}
      </svg>
      {/* 쑥 들어갈 때 번쩍: 요즘 편은 네온빛, 옛 편은 한지빛 */}
      <AbsoluteFill style={{ backgroundColor: variant === "modern" ? "#ff3d8b" : "#f6ecd6", opacity: flash * 0.85 }} />
    </AbsoluteFill>
  );
};
