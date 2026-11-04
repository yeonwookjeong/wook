import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
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

const [KX, KY] = projection([127.6, 38.4]) as [number, number]; // 한반도 가운데(주변 땅을 흐리게 할 기준)

const PAL = {
  neutral: { sea: "#e8e7e2", land: "#c7c6c0" },
  // 요즘 편: 배너 오른쪽의 부드러운 일러스트 그림체로 그린 "요즘 지도"(지도 앱처럼 바다는 바다색, 땅은 밝게, 핀 마커). 2026-11-04
  modern: { seaTop: "#6fb6e0", seaLow: "#9fd3ec", shallow: "#d3f0f5", land: "#f7f2e8", shade: "#7a9bb5", line: "#9cbfd3", pin: "#ff6b4a" },
  old: { paper: "#e9dcbf", land: "#f4ead3", ink: "#1b1714", seal: "#b3261e" },
};

export const MAP_OPENING_FRAMES = 45;

// 이미지 모델에 줄 밑그림: 오프닝 지도와 같은 투영, 2:3 비율로 넓게(가로 2160 × 세로 3240 영역)
export const MAP_REF_BOX = { x: -540, y: -660, w: 2160, h: 3240 };
// 받은 수묵 지도(old-map.png)를 밑그림에 맞춘 보정값. 자동 정합 결과: 배율 그대로, 아래로 6px(밑그림 1024폭 기준)
const OLD_MAP_SHIFT = { x: 0, y: (6 * MAP_REF_BOX.w) / 1024 };

export const MapRef: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
    <svg width={1024} height={1536} viewBox={`${MAP_REF_BOX.x} ${MAP_REF_BOX.y} ${MAP_REF_BOX.w} ${MAP_REF_BOX.h}`}>
      <path d={BRUSH_D} fill="#f2f2f2" stroke="#000" strokeWidth={5} strokeLinejoin="round" />
      <circle cx={SX} cy={SY} r={12} fill="#d00" />
    </svg>
  </AbsoluteFill>
);

export const MapOpening: React.FC<{ variant: MapVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  // 1.5초: 0~6 중립 지도, 6~21 그림풍으로 바뀜, 0~33 서울로 다가감, 33~45 쑥 들어감
  const style = interpolate(frame, [6, 21], [0, 1], clamp);
  const approach = interpolate(frame, [0, 33], [0.55, 2.2], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const plunge = interpolate(frame, [33, 45], [1, 14], { ...clamp, easing: Easing.in(Easing.exp) });
  const scale = approach * plunge;
  const blur = interpolate(frame, [36, 45], [0, 14], clamp);
  const flash = interpolate(frame, [39, 45], [0, 1], clamp);
  const bleedR = interpolate(frame, [4, 22], [0, 2600], { ...clamp, easing: Easing.in(Easing.quad) });
  const pin = interpolate(frame, [16, 24], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });

  // 서울을 화면 가운데로 끌어오면서 확대
  const tx = (W / 2 - SX) * interpolate(frame, [0, 33], [0, 1], clamp);
  const ty = (H * 0.45 - SY) * interpolate(frame, [0, 33], [0, 1], clamp);
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
          <linearGradient id="mo-sunset" gradientUnits="userSpaceOnUse" x1={0} y1={SY - 900} x2={0} y2={SY + 900}>
            <stop offset="0" stopColor={PAL.modern.seaTop} />
            <stop offset="1" stopColor={PAL.modern.seaLow} />
          </linearGradient>
          <radialGradient id="mo-sun" gradientUnits="userSpaceOnUse" cx={SX + 700} cy={SY - 900} r={1500}>
            <stop offset="0" stopColor="#ffd6a8" stopOpacity={0.45} />
            <stop offset="1" stopColor="#ffd6a8" stopOpacity={0} />
          </radialGradient>
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
          {/* 번짐 마스크: 가장자리가 울퉁불퉁한 원이 서울에서 커진다 */}
          <filter id="mo-bleed-edge" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={3} seed={7} />
            <feDisplacementMap in="SourceGraphic" scale={220} />
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <mask id="mo-bleed" maskUnits="userSpaceOnUse" x={-W * 2} y={-H * 2} width={W * 5} height={H * 5}>
            <circle cx={SX} cy={SY} r={bleedR} fill="#fff" filter="url(#mo-bleed-edge)" />
          </mask>
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
            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="url(#mo-sunset)" />
            {/* 얕은 바다: 해안을 따라 밝은 물빛 */}
            <path d={LAND_D} fill="none" stroke={m.shallow} strokeWidth={46} strokeLinejoin="round" opacity={0.85} filter="url(#mo-glow)" />
            {/* 땅 그림자: 살짝 떠 보이게 */}
            <path d={LAND_D} fill={m.shade} opacity={0.35} transform="translate(5 8)" filter="url(#mo-glow)" />
            <path d={LAND_D} fill={m.land} />
            <path d={LAND_D} fill="none" stroke={m.line} strokeWidth={2} vectorEffect="non-scaling-stroke" />
            {/* 배너처럼 오른쪽 위에서 들어오는 따뜻한 햇빛 */}
            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="url(#mo-sun)" />
          </g>
        ) : (
          <g>
            {/* 서울에서 먹이 번지듯 수묵 지도가 드러난다 */}
            <g mask="url(#mo-bleed)">
              <rect x={-W} y={-H} width={W * 3} height={H * 3} fill={o.paper} />
              <image
                href={staticFile("maps/old-map.png")}
                x={MAP_REF_BOX.x + OLD_MAP_SHIFT.x}
                y={MAP_REF_BOX.y + OLD_MAP_SHIFT.y}
                width={MAP_REF_BOX.w}
                height={MAP_REF_BOX.h}
                preserveAspectRatio="none"
              />
              <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="url(#mo-focus)" opacity={0.6} />
            </g>
          </g>
        )}

        {/* 서울 표시 */}
        {variant === "modern" ? (
          <g transform={`translate(${SX} ${SY}) scale(${pin})`}>
            {/* 지도 앱 핀: 끝이 서울을 찍는다 */}
            <ellipse cx={0} cy={2} rx={10} ry={4} fill="#000" opacity={0.18} />
            <path d="M0 0 C -6 -14 -22 -26 -22 -42 A 22 22 0 1 1 22 -42 C 22 -26 6 -14 0 0 Z" fill={m.pin} stroke="#ffffff" strokeWidth={3} />
            <circle cx={0} cy={-42} r={8} fill="#ffffff" />
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
        <AbsoluteFill style={{ opacity: style * interpolate(frame, [30, 37], [1, 0], clamp), background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(60,45,30,0.35) 100%)" }} />
      )}
      {/* 오프닝 소리: 확대되며 올라가는 상승음 → 서울 표시 '팅' → 쑥 들어가는 바람 (모든 편 공통) */}
      <Audio src={staticFile("sfx/riser.wav")} volume={0.35} />
      <Sequence from={16} layout="none">
        <Audio src={staticFile("sfx/chime.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={30} layout="none">
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.45} />
      </Sequence>
      {/* 쑥 들어갈 때 번쩍: 요즘 편은 노을빛, 옛 편은 한지빛 */}
      <AbsoluteFill style={{ backgroundColor: variant === "modern" ? "#eaf7fc" : "#f6ecd6", opacity: flash * 0.85 }} />
    </AbsoluteFill>
  );
};
