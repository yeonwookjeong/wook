import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

// 판화풍 일월오봉도 배경 (세로 1080×1920)
// 원칙: 면은 색판으로 찍고 종이색 칼선을 새긴다. 색판은 먹판과 몇 px 어긋나게 찍어 목판 느낌을 낸다.
// 일본풍(큰 붉은 원 하나+뾰족 산, 반원 비늘 물결)으로 읽히지 않게: 해와 달 한 쌍, 둥근 다섯 봉우리, 끝이 말리는 물결.

const P = {
  paper: "#efe4cc",
  paperDeep: "#e6d8bb",
  ink: "#1f1a16",
  sun: "#c8102e",
  moon: "#f2ebd8",
  gold: "#c9a227",
  indigo: "#1f3a5f",
  peakFar: "#5f7d68",
  peakMid: "#2f5a50",
  peakTop: "#24476a",
  ridge: "#e8dcc0",
  trunk: "#8b3a1f",
  pine: "#3f6b4f",
  needle: "#1e4d3a",
};

const W = 1080;
const H = 1920;
const BASE = 1250; // 산 밑선
const SEA = 1520; // 물 시작
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Peak = { x: number; top: number; w: number; fill: string };

// 뒤에서 앞으로. 가운데가 가장 높다.
const PEAKS: Peak[] = [
  { x: 120, top: 900, w: 270, fill: P.peakFar },
  { x: 960, top: 910, w: 270, fill: P.peakFar },
  { x: 300, top: 790, w: 290, fill: P.peakMid },
  { x: 780, top: 800, w: 290, fill: P.peakMid },
  { x: 540, top: 690, w: 310, fill: P.peakTop },
];

// 종 모양 봉우리: 어깨가 둥글고 꼭대기가 뭉툭하다
const bell = (p: Peak, s = 1) => {
  const h = (BASE - p.top) * s;
  const top = BASE - h;
  const hw = (p.w / 2) * (0.55 + 0.45 * s);
  return `M ${p.x - hw} ${BASE} C ${p.x - hw * 0.95} ${top + h * 0.35} ${p.x - hw * 0.45} ${top} ${p.x} ${top} C ${p.x + hw * 0.45} ${top} ${p.x + hw * 0.95} ${top + h * 0.35} ${p.x + hw} ${BASE} Z`;
};

// 해와 달
const Orb: React.FC<{ x: number; y: number; r: number; fill: string; ring: string; misreg: { x: number; y: number } }> = ({ x, y, r, fill, ring, misreg }) => (
  <g filter="url(#print)">
    <circle cx={x + misreg.x} cy={y + misreg.y} r={r} fill={fill} />
    <circle cx={x} cy={y} r={r} fill="none" stroke={ring} strokeWidth={6} />
    <circle cx={x} cy={y} r={r + 14} fill="none" stroke={P.ink} strokeWidth={2} opacity={0.5} />
  </g>
);

// 영지 모양 구름: 통통한 덩어리 + 안쪽 말림
const Cloud: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#print)">
    <path
      d="M -150 30 C -190 -10 -150 -70 -95 -48 C -85 -100 -10 -110 10 -62 C 40 -112 120 -96 118 -40 C 170 -48 190 20 140 34 Z"
      fill={P.ridge}
      stroke={P.ink}
      strokeWidth={7}
      strokeLinejoin="round"
    />
    <path d="M -95 -48 c -10 22 18 34 30 16 c 6 -10 -6 -18 -12 -10" fill="none" stroke={P.ink} strokeWidth={5} strokeLinecap="round" />
    <path d="M 10 -62 c -12 26 22 38 34 18 c 6 -10 -6 -18 -12 -10" fill="none" stroke={P.ink} strokeWidth={5} strokeLinecap="round" />
    <path d="M 118 -40 c -14 18 6 36 22 24" fill="none" stroke={P.ink} strokeWidth={5} strokeLinecap="round" />
  </g>
);

// 소나무: S자로 굽은 붉은 줄기 + 납작한 솔잎 덩어리, 덩어리마다 짧은 바늘 다발
type Crown = { cx: number; cy: number; w: number };
const Pine: React.FC<{ x: number; scale: number; crowns: Crown[]; trunk: string }> = ({ x, scale, crowns, trunk }) => (
  <g transform={`translate(${x} ${BASE + 30}) scale(${scale})`} filter="url(#print)">
    <path d={trunk} fill={P.trunk} stroke={P.ink} strokeWidth={6} strokeLinejoin="round" />
    {crowns.map((c, i) => {
      const hw = c.w / 2;
      const d = `M ${c.cx - hw} ${c.cy} C ${c.cx - hw} ${c.cy - 40} ${c.cx - hw * 0.5} ${c.cy - 56} ${c.cx - hw * 0.2} ${c.cy - 44} C ${c.cx - hw * 0.05} ${c.cy - 70} ${c.cx + hw * 0.35} ${c.cy - 66} ${c.cx + hw * 0.45} ${c.cy - 42} C ${c.cx + hw * 0.8} ${c.cy - 54} ${c.cx + hw} ${c.cy - 30} ${c.cx + hw} ${c.cy} Z`;
      const bundles = Math.max(5, Math.round(c.w / 34));
      return (
        <g key={i}>
          <path d={d} fill={P.pine} stroke={P.ink} strokeWidth={6} strokeLinejoin="round" />
          {Array.from({ length: bundles }).map((_, j) => {
            const bx = c.cx - hw * 0.78 + (j / (bundles - 1)) * hw * 1.56;
            const by = c.cy - 14 - (j % 2) * 12;
            return (
              <g key={j}>
                {[-28, -12, 4, 20].map((a) => (
                  <line
                    key={a}
                    x1={bx}
                    y1={by}
                    x2={bx + Math.sin((a * Math.PI) / 180) * 22}
                    y2={by - Math.cos((a * Math.PI) / 180) * 22}
                    stroke={P.needle}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                ))}
              </g>
            );
          })}
        </g>
      );
    })}
  </g>
);

// 물결: 끝이 동그랗게 말리는 파도를 줄마다 엇갈려 쌓는다
const Waves: React.FC<{ frame: number }> = ({ frame }) => {
  const rows = 5;
  const rowH = 76;
  const uw = 200;
  return (
    <g filter="url(#print)">
      <rect x={0} y={SEA} width={W} height={H - SEA} fill={P.indigo} />
      {Array.from({ length: rows }).map((_, r) => {
        const y = SEA + 70 + r * rowH;
        const shift = ((frame * (0.5 + r * 0.15) + (r % 2) * uw * 0.5) % uw) - uw;
        const n = Math.ceil(W / uw) + 3;
        return (
          <g key={r}>
            {Array.from({ length: n }).map((_, i) => {
              const x = shift + i * uw;
              // 완만하게 올라가 꼭대기에서 앞으로 말려 들어가는 선
              const crest = `M ${x} ${y} C ${x + 60} ${y - 6} ${x + 100} ${y - 44} ${x + 140} ${y - 50} C ${x + 172} ${y - 54} ${x + 186} ${y - 30} ${x + 168} ${y - 20} C ${x + 154} ${y - 12} ${x + 142} ${y - 26} ${x + 152} ${y - 32}`;
              const back = `M ${x + 140} ${y - 50} C ${x + 160} ${y - 30} ${x + 178} ${y - 6} ${x + uw} ${y}`;
              return (
                <g key={i}>
                  <path d={`${crest}`} fill="none" stroke={P.paper} strokeWidth={4} strokeLinecap="round" />
                  <path d={back} fill="none" stroke={P.paper} strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
                  <circle cx={x + 120} cy={y - 62} r={4} fill={P.paper} />
                </g>
              );
            })}
          </g>
        );
      })}
      <line x1={0} y1={SEA} x2={W} y2={SEA} stroke={P.ink} strokeWidth={7} />
    </g>
  );
};

export const WoodcutIrworobong: React.FC = () => {
  const frame = useCurrentFrame();
  const rise = interpolate(frame, [0, 45], [90, 0], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const drift = frame * 0.3;
  const misreg = { x: 5, y: 4 };

  return (
    <AbsoluteFill style={{ backgroundColor: P.paper }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <filter id="print" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={4} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={3.5} />
          </filter>
          <filter id="paper">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.12" numOctaves={3} seed={9} />
            <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.17  0 0 0 0.16 0" />
          </filter>
          <filter id="dry">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={4} seed={21} />
            <feColorMatrix values="0 0 0 0 0.94  0 0 0 0 0.89  0 0 0 0 0.8  0 0 0 -2.4 1.25" />
          </filter>
          <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={P.paper} stopOpacity={0} />
            <stop offset="0.25" stopColor={P.paper} stopOpacity={0.85} />
            <stop offset="1" stopColor={P.paper} stopOpacity={0.9} />
          </linearGradient>
          <clipPath id="frame">
            <rect x={44} y={44} width={W - 88} height={H - 88} />
          </clipPath>
        </defs>

        <g clipPath="url(#frame)">
          {/* 하늘 나뭇결 */}
          {Array.from({ length: 32 }).map((_, i) => {
            const y = 90 + i * 34;
            return (
              <path
                key={i}
                d={`M 0 ${y} C 270 ${y - 8 + (i % 3) * 5} 540 ${y + 10} 810 ${y - 4} S 1080 ${y + 6} 1080 ${y}`}
                fill="none"
                stroke={P.ink}
                strokeWidth={1.4}
                opacity={0.1}
              />
            );
          })}

          {/* 해(오른쪽)와 달(왼쪽) */}
          <g transform={`translate(0 ${rise})`}>
            <Orb x={300} y={560} r={92} fill={P.moon} ring={P.gold} misreg={misreg} />
            <Orb x={780} y={560} r={95} fill={P.sun} ring={P.ink} misreg={misreg} />
          </g>

          <Cloud x={190 + drift} y={330} s={0.8} />
          <Cloud x={860 - drift * 0.7} y={300} s={0.65} />

          {/* 다섯 봉우리: 색판 + 칼선 겹 능선 + 산마루 띠 + 먹 윤곽 */}
          {PEAKS.map((p, i) => (
            <g key={i} filter="url(#print)">
              <g transform={`translate(${misreg.x} ${misreg.y})`}>
                <path d={bell(p)} fill={p.fill} />
                {[0.8, 0.62, 0.44].map((s) => (
                  <path key={s} d={bell(p, s)} fill="none" stroke={P.ridge} strokeWidth={3} opacity={0.55} />
                ))}
              </g>
              <path d={bell(p)} fill="none" stroke={P.ink} strokeWidth={6} strokeLinejoin="round" />
            </g>
          ))}

          {/* 소나무: 좌우를 다르게 */}
          <Pine
            x={110}
            scale={1}
            trunk="M -30 0 C -10 -120 -80 -220 -30 -340 C 0 -420 -40 -500 -10 -560 L 22 -556 C -6 -494 32 -420 4 -336 C -40 -220 22 -120 26 0 Z"
            crowns={[
              { cx: -10, cy: -540, w: 220 },
              { cx: 60, cy: -420, w: 250 },
              { cx: -50, cy: -300, w: 200 },
            ]}
          />
          <Pine
            x={975}
            scale={0.82}
            trunk="M -24 0 C 0 -100 50 -180 10 -300 C -14 -380 20 -440 0 -500 L 30 -500 C 50 -436 18 -380 40 -300 C 76 -180 26 -100 28 0 Z"
            crowns={[
              { cx: 10, cy: -480, w: 210 },
              { cx: -60, cy: -360, w: 230 },
            ]}
          />

          {/* 자막 자리: 산 밑동부터 물 위까지 안개 띠 */}
          <rect x={0} y={1150} width={W} height={SEA - 1150} fill="url(#fog)" />
          {[1330, 1380, 1430, 1480].map((y, i) => (
            <path key={y} d={`M ${60 + i * 40} ${y} C 300 ${y - 10} 700 ${y + 10} ${1020 - i * 40} ${y}`} fill="none" stroke={P.ink} strokeWidth={1.5} opacity={0.12} />
          ))}

          <Waves frame={frame} />

          <rect width={W} height={H} filter="url(#paper)" />
          <rect width={W} height={H} filter="url(#dry)" opacity={0.18} />
        </g>

        <rect x={44} y={44} width={W - 88} height={H - 88} fill="none" stroke={P.ink} strokeWidth={10} filter="url(#print)" />
        <rect x={62} y={62} width={W - 124} height={H - 124} fill="none" stroke={P.ink} strokeWidth={3} filter="url(#print)" />
      </svg>
    </AbsoluteFill>
  );
};
