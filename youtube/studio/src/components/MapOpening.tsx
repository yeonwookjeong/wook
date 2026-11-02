import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { geoBounds, geoGraticule10, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import land10m from "world-atlas/land-10m.json";
import land50m from "world-atlas/land-50m.json";

// 채널 시그니처 오프닝: 중립 지도 → 그 편의 그림풍 지도로 바뀌며 → 서울로 쑥 들어간다 (약 2초)
// 국경선은 그리지 않는다(땅 덩어리만). 정치적으로 읽히는 요소를 피하려는 것.

export type MapVariant = "old" | "modern";

const W = 1080;
const H = 1920;
const SEOUL: [number, number] = [126.98, 37.57];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type LandFC = GeoJSON.FeatureCollection<GeoJSON.MultiPolygon | GeoJSON.Polygon>;
const toFC = (t: unknown) => {
  const topo = t as Topology<{ land: GeometryCollection }>;
  return feature(topo, topo.objects.land) as unknown as LandFC;
};

// 한반도 주변 땅만 남긴다. 남극처럼 투영에서 무한히 커지는 덩어리가 끼면 바다까지 땅으로 칠해진다.
const near = (poly: GeoJSON.Position[][]) => {
  const [[x0, y0], [x1, y1]] = geoBounds({ type: "Polygon", coordinates: poly });
  const wraps = x0 > x1; // 날짜변경선을 넘는 덩어리(유라시아)
  return y0 > -55 && (wraps || (x1 > 105 && x0 < 150)) && y1 > 22 && y0 < 52;
};
const nearLand = (fc: LandFC): GeoJSON.Feature<GeoJSON.MultiPolygon> => ({
  type: "Feature",
  properties: {},
  geometry: {
    type: "MultiPolygon",
    coordinates: fc.features.flatMap((f) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates)).filter(near),
  },
});
const LAND = nearLand(toFC(land10m));
const LAND_BRUSH = nearLand(toFC(land50m));

// 한반도가 화면 폭의 약 60%를 차지하는 투영
const projection = geoMercator().center([127.6, 36.4]).scale(6400).translate([W / 2, H * 0.47]);
const path = geoPath(projection);
const LAND_D = path(LAND) ?? "";
const BRUSH_D = path(LAND_BRUSH) ?? "";
const GRID_D = path(geoGraticule10()) ?? "";
const [SX, SY] = projection(SEOUL) as [number, number];

type LL = [number, number];
const proj = (pts: LL[]) => pts.map((p) => projection(p) as [number, number]);
const toD = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

// 옛 지도(수묵 붓 그림 느낌)용 큰 강. 좌표는 상징 표현용 근사치.
const RIVERS = [
  [[126.55, 37.73], [126.85, 37.58], [127.05, 37.53], [127.3, 37.55], [127.55, 37.6], [127.7, 37.45], [128.0, 37.25], [128.35, 37.2], [128.65, 37.35]],
  [[128.95, 35.08], [128.75, 35.35], [128.45, 35.7], [128.35, 36.05], [128.3, 36.4], [128.55, 36.6], [128.75, 36.9], [129.0, 37.1]],
  [[126.65, 36.0], [127.0, 36.25], [127.35, 36.45], [127.55, 36.2], [127.65, 35.95]],
].map((r) => toD(proj(r as LL[])));

const SEA_STROKES = [
  [[124.2, 37.2], [124.9, 37.0], [125.5, 37.15]],
  [[123.9, 36.1], [124.7, 35.95], [125.4, 36.05]],
  [[124.5, 34.9], [125.2, 34.75], [125.8, 34.85]],
  [[130.2, 37.9], [130.9, 37.75], [131.4, 37.85]],
  [[129.9, 36.6], [130.6, 36.45], [131.2, 36.55]],
  [[127.0, 33.9], [127.8, 33.75], [128.5, 33.85]],
].map((r) => toD(proj(r as LL[])));
const [KX, KY] = projection([127.6, 38.4]) as [number, number]; // 한반도 가운데(주변 땅을 흐리게 할 기준)

const PAL = {
  neutral: { sea: "#e8e7e2", land: "#c7c6c0" },
  modern: { sea: "#141f31", land: "#1c2a44", line: "#ff3d8b", grid: "#2de2e6" },
  old: { paper: "#e9dcbf", land: "#f4ead3", ink: "#1b1714", seal: "#b3261e" },
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
          {/* 붓선: 큰 흔들림 + 가장자리 거칠기 + 갈필(먹이 끊긴 틈) */}
          <filter id="mo-brush" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={2} seed={5} result="wob" />
            <feDisplacementMap in="SourceGraphic" in2="wob" scale={9} result="w1" />
            <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves={2} seed={8} result="edge" />
            <feDisplacementMap in="w1" in2="edge" scale={4} result="w2" />
            <feTurbulence type="fractalNoise" baseFrequency="0.9 0.05" numOctaves={2} seed={12} result="bristle" />
            <feComponentTransfer in="bristle" result="gaps">
              <feFuncA type="discrete" tableValues="0 1 1 1 1 1" />
            </feComponentTransfer>
            <feComposite in="w2" in2="gaps" operator="in" />
          </filter>
          <filter id="mo-brush2" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={2} seed={21} result="wob" />
            <feDisplacementMap in="SourceGraphic" in2="wob" scale={6} result="w1" />
            <feTurbulence type="fractalNoise" baseFrequency="0.05 0.8" numOctaves={2} seed={3} result="bristle" />
            <feComponentTransfer in="bristle" result="gaps">
              <feFuncA type="discrete" tableValues="0 0 1 1 1" />
            </feComponentTransfer>
            <feComposite in="w1" in2="gaps" operator="in" />
          </filter>
          <filter id="mo-wash" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="16" result="b" />
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={3} seed={9} result="n" />
            <feDisplacementMap in="b" in2="n" scale={30} />
          </filter>
          <filter id="mo-dry" x="-20%" y="-50%" width="140%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8 0.03" numOctaves={2} seed={31} result="streak" />
            <feComponentTransfer in="streak" result="gaps">
              <feFuncA type="discrete" tableValues="0 0 1 1" />
            </feComponentTransfer>
            <feComposite in="SourceGraphic" in2="gaps" operator="in" />
          </filter>
          <clipPath id="mo-landclip">
            <path d={BRUSH_D} />
          </clipPath>
          {/* 붓 누르는 힘: 큰 얼룩 노이즈로 선의 진하기를 바꾼다 */}
          <filter id="mo-pressure-n" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves={2} seed={14} />
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.6 -0.25" />
          </filter>
          <mask id="mo-pressure" maskUnits="userSpaceOnUse" x={-W} y={-H} width={W * 3} height={H * 3}>
            <rect x={-W} y={-H} width={W * 3} height={H * 3} filter="url(#mo-pressure-n)" />
          </mask>
          <filter id="mo-seawash" x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="14" result="b" />
            <feTurbulence type="fractalNoise" baseFrequency="0.03 0.5" numOctaves={2} seed={33} result="streak" />
            <feComponentTransfer in="streak" result="gaps">
              <feFuncA type="table" tableValues="0.2 1" />
            </feComponentTransfer>
            <feComposite in="b" in2="gaps" operator="in" />
          </filter>
          <filter id="mo-fiber">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.35" numOctaves={3} seed={41} />
            <feColorMatrix values="0 0 0 0 0.4  0 0 0 0 0.32  0 0 0 0 0.2  0 0 0 0.18 -0.02" />
          </filter>
          <filter id="mo-stain">
            <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves={3} seed={17} />
            <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0 0.16  0 0 0 0.55 -0.12" />
          </filter>
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
            {/* 한지 바탕 */}
            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill={o.paper} />
            <rect x={-W} y={-H} width={W * 3} height={H * 3} filter="url(#mo-fiber)" />
            {/* 바다: 옅은 먹물을 물에 푼 듯한 띠 몇 개 */}
            <g filter="url(#mo-seawash)" opacity={0.16}>
              {SEA_STROKES.map((d, i) => (
                <path key={i} d={d} fill="none" stroke={o.ink} strokeWidth={46 + (i % 3) * 14} strokeLinecap="round" />
              ))}
            </g>
            {/* 땅 */}
            <path d={BRUSH_D} fill={o.land} />
            {/* 땅 안쪽 먹 번짐: 해안에서 안으로 스며드는 옅은 먹 */}
            <g clipPath="url(#mo-landclip)">
              <path d={BRUSH_D} fill="none" stroke={o.ink} strokeWidth={70} opacity={0.14} filter="url(#mo-wash)" />
            </g>
            {/* 해안 붓선: 먹을 듬뿍 찍은 곳과 마른 곳이 번갈아 보이도록 */}
            <g mask="url(#mo-pressure)">
              <g filter="url(#mo-brush)">
                <path d={BRUSH_D} fill="none" stroke={o.ink} strokeWidth={9} strokeLinejoin="round" />
              </g>
            </g>
            <g filter="url(#mo-brush2)" opacity={0.8}>
              <path d={BRUSH_D} fill="none" stroke={o.ink} strokeWidth={3} strokeLinejoin="round" />
            </g>
            {/* 강: 가늘고 옅은 붓선 */}
            <g filter="url(#mo-brush2)" opacity={0.4}>
              {RIVERS.map((d, i) => (
                <path key={i} d={d} fill="none" stroke={o.ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </g>
            {/* 한반도 밖은 한지 속으로 흐리게 */}
            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="url(#mo-focus)" />
            <rect x={-W} y={-H} width={W * 3} height={H * 3} filter="url(#mo-stain)" opacity={0.35} />
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
            <circle r={9} fill={o.ink} filter="url(#mo-brush2)" />
            <g transform="translate(34 -34) rotate(-5)">
              <rect x={-20} y={-20} width={40} height={40} fill={o.seal} />
              <rect x={-14} y={-14} width={28} height={28} fill="none" stroke="#f6e9d6" strokeWidth={2.5} />
            </g>
          </g>
        )}
      </svg>
      {variant === "old" && (
        <AbsoluteFill style={{ opacity: style * interpolate(frame, [40, 50], [1, 0], clamp), background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(60,45,30,0.35) 100%)" }} />
      )}
      {/* 쑥 들어갈 때 번쩍: 요즘 편은 네온빛, 옛 편은 한지빛 */}
      <AbsoluteFill style={{ backgroundColor: variant === "modern" ? "#ff3d8b" : "#f6ecd6", opacity: flash * 0.85 }} />
    </AbsoluteFill>
  );
};
