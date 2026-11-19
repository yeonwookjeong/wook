// 먹선 졸라맨: 코드로 그리는 사람. 배경·물건은 민화풍 그림, 사람은 붓 먹선.
// 관절 각도(도)로 자세를 정한다. 0 = 아래로 곧게. 화면 오른쪽(+x)을 보는 기준이고 flip으로 뒤집는다.
import React from "react";

export const INK = "#2a1c24";
export type Pose = {
  lean?: number; // 몸통 기울기
  head?: number; // 고개
  armL?: [number, number]; // [어깨, 팔꿈치] 뒤쪽 팔
  armR?: [number, number]; // 앞쪽 팔
  legL?: [number, number]; // [엉덩이, 무릎] 뒤쪽 다리
  legR?: [number, number];
  bob?: number; // 몸 들썩임(px, 위로 +)
  face?: "smile" | "o" | "flat" | "sad" | "laugh" | "back";
};
export type Look = { accent: string; kind: "man" | "woman" | "old"; shoes?: string };

const D = Math.PI / 180;
const seg = (x: number, y: number, a: number, len: number): [number, number] => [x + Math.sin(a * D) * len, y + Math.cos(a * D) * len];

// 운동화 한 짝 (옆모습, 120 x 53, 오른쪽이 앞코)
export const ShoeArt: React.FC = () => (
  <g stroke={INK} strokeWidth={4.5} strokeLinejoin="round" strokeLinecap="round">
    <path d="M6,40 C4,26 8,12 22,9 L40,8 C48,8 52,13 58,19 C72,25 96,28 108,34 C116,38 117,42 114,44 L8,44 Z" fill="#f6f3ea" />
    <path d="M20,9 C26,5 36,5 40,8" fill="#3a2c34" />
    <path d="M30,38 C46,34 60,28 78,26" stroke="#3e8e7e" strokeWidth={7} fill="none" />
    <path d="M48,13 l8,-5 M54,18 l8,-5 M60,22 l8,-5" strokeWidth={3.5} />
    <path d="M92,30 C96,34 98,38 98,44" strokeWidth={3} fill="none" />
    <path d="M7,10 L16,10 L16,30 L7,30" fill="#3e8e7e" strokeWidth={3.5} />
    <rect x={2} y={42} width={116} height={11} rx={5.5} fill="#ece4d4" />
    <path d="M8,50 L112,50" strokeWidth={2.5} stroke="#a89a88" />
  </g>
);

// 크기(키 h 기준 비율)
const R = { head: 0.15, torso: 0.27, uArm: 0.15, fArm: 0.14, uLeg: 0.17, lLeg: 0.17 };

export const Stick: React.FC<{ look: Look; pose: Pose; x: number; floor: number; h: number; flip?: boolean; id: string; children?: React.ReactNode }> = ({ look, pose, x, floor, h, flip, id }) => {
  const s = (k: number) => k * h;
  const legLen = s(R.uLeg + R.lLeg);
  const hipY = floor - legLen + (pose.bob ?? 0) * -1;
  const hip: [number, number] = [0, hipY - floor];
  const lean = pose.lean ?? 0;
  const neck = seg(hip[0], hip[1], 180 + lean, s(R.torso));
  const shoulder = seg(hip[0], hip[1], 180 + lean, s(R.torso) * 0.86);
  const headA = 180 + lean + (pose.head ?? 0);
  const hc = seg(neck[0], neck[1], headA, s(R.head) * 1.05);
  const limb = (o: [number, number], [a, b]: [number, number], l1: number, l2: number) => {
    const j = seg(o[0], o[1], a, l1);
    const e = seg(j[0], j[1], a + b, l2);
    return { j, e, d: `M${o[0]},${o[1]} L${j[0]},${j[1]} L${e[0]},${e[1]}` };
  };
  const legL = limb(hip, pose.legL ?? [0, 0], s(R.uLeg), s(R.lLeg));
  const legR = limb(hip, pose.legR ?? [0, 0], s(R.uLeg), s(R.lLeg));
  const armL = limb(shoulder, pose.armL ?? [8, -6], s(R.uArm), s(R.fArm));
  const armR = limb(shoulder, pose.armR ?? [-8, 6], s(R.uArm), s(R.fArm));
  const w = Math.max(5, s(0.024));
  const hr = s(R.head);
  const face = pose.face ?? "smile";
  const foot = (e: [number, number]) =>
    look.shoes ? (
      <g transform={`translate(${e[0] - s(0.045)},${e[1] - s(0.06)}) scale(${s(0.15) / 120})`}>
        <ShoeArt />
      </g>
    ) : (
      <path d={`M${e[0] - s(0.01)},${e[1]} l${s(0.055)},0`} stroke={INK} strokeWidth={w} strokeLinecap="round" />
    );
  const W = h * 1.4;
  return (
    <svg width={W} height={h * 1.35} viewBox={`${-W / 2} ${-h * 1.25} ${W} ${h * 1.35}`} style={{ position: "absolute", left: x - W / 2, top: floor - h * 1.25, overflow: "visible", transform: flip ? "scaleX(-1)" : undefined }}>
      <defs>
        <filter id={`brush-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={3} />
          <feDisplacementMap in="SourceGraphic" scale={Math.max(2, h * 0.006)} />
        </filter>
      </defs>
      {/* 발밑 그림자 */}
      <ellipse cx={0} cy={0} rx={s(0.16)} ry={s(0.025)} fill="rgba(70,40,25,0.25)" />
      <g strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* 뒤쪽 팔·다리는 조금 옅게 */}
        <g opacity={0.75}>
          <path d={armL.d} stroke={INK} strokeWidth={w} />
          <path d={legL.d} stroke={INK} strokeWidth={w} />
          {foot(legL.e)}
        </g>
        {/* 치마 (여자) */}
        {look.kind === "woman" && (
          <path d={`M${hip[0] - s(0.015)},${hip[1] - s(0.07)} L${hip[0] - s(0.11)},${hip[1] + s(0.16)} Q${hip[0]},${hip[1] + s(0.19)} ${hip[0] + s(0.11)},${hip[1] + s(0.16)} L${hip[0] + s(0.015)},${hip[1] - s(0.07)} Z`} fill={look.accent} stroke={INK} strokeWidth={w * 0.7} transform={`rotate(${lean * 0.6} ${hip[0]} ${hip[1]})`} />
        )}
        <path d={`M${hip[0]},${hip[1]} L${neck[0]},${neck[1]}`} stroke={INK} strokeWidth={w * 1.15} />
        {/* 목도리 (남자) / 회색 모자는 머리에서 */}
        {look.kind !== "woman" && (
          <path d={`M${neck[0] - s(0.045)},${neck[1] + s(0.01)} Q${neck[0]},${neck[1] + s(0.04)} ${neck[0] + s(0.045)},${neck[1] + s(0.01)} M${neck[0] + s(0.02)},${neck[1] + s(0.02)} l${s(0.015)},${s(0.07)}`} stroke={look.accent} strokeWidth={w * 1.3} />
        )}
        <path d={legR.d} stroke={INK} strokeWidth={w} />
        {foot(legR.e)}
        <path d={armR.d} stroke={INK} strokeWidth={w} />
        {/* 손 */}
        {[armL.e, armR.e].map((e, k) => <circle key={k} cx={e[0]} cy={e[1]} r={hr * 0.2} fill="#f6efe0" stroke={INK} strokeWidth={w * 0.7} opacity={k ? 1 : 0.85} />)}
        {/* 머리: 정면 얼굴 (가운데 정렬) */}
        <g transform={`rotate(${-(pose.head ?? 0) - lean} ${hc[0]} ${hc[1]})`}>
          {look.kind === "woman" && (
            // 단발: 머리 뒤로 살짝 크게, 턱선까지
            <rect x={hc[0] - hr * 1.12} y={hc[1] - hr * 1.1} width={hr * 2.24} height={hr * 1.95} rx={hr * 0.95} fill={INK} stroke="none" />
          )}
          <circle cx={hc[0]} cy={hc[1]} r={hr} fill="#f6efe0" stroke={INK} strokeWidth={w} />
          {look.kind === "woman" ? (
            <>
              {/* 앞머리: 이마를 덮는 둥근 머리 */}
              <path d={`M${hc[0] - hr},${hc[1] - hr * 0.05} A${hr},${hr} 0 0 1 ${hc[0] + hr},${hc[1] - hr * 0.05} Q${hc[0] + hr * 0.55},${hc[1] - hr * 0.42} ${hc[0]},${hc[1] - hr * 0.4} Q${hc[0] - hr * 0.55},${hc[1] - hr * 0.42} ${hc[0] - hr},${hc[1] - hr * 0.05} Z`} fill={INK} stroke={INK} strokeWidth={w * 0.5} />
              <circle cx={hc[0] + hr * 0.6} cy={hc[1] - hr * 0.6} r={hr * 0.2} fill={look.accent} stroke={INK} strokeWidth={w * 0.45} />
            </>
          ) : (
            // 짧은 머리: 정수리 몇 가닥
            <path d={`M${hc[0] - hr * 0.55},${hc[1] - hr * 0.8} q${hr * 0.1},${-hr * 0.45} ${hr * 0.35},${-hr * 0.3} M${hc[0] - hr * 0.1},${hc[1] - hr * 0.98} q${hr * 0.12},${-hr * 0.48} ${hr * 0.38},${-hr * 0.2} M${hc[0] + hr * 0.35},${hc[1] - hr * 0.88} q${hr * 0.15},${-hr * 0.35} ${hr * 0.38},${-hr * 0.05}`} stroke={look.kind === "old" ? "#7a7276" : INK} strokeWidth={w * 0.85} />
          )}
          {face === "back" && look.kind === "woman" && <circle cx={hc[0]} cy={hc[1]} r={hr * 1.02} fill={INK} stroke="none" />}
        </g>
      </g>
    </svg>
  );
};

// ---- 동작
export const walk = (f: number, speed = 0.3): Pose => {
  const p = f * speed;
  const sw = Math.sin(p);
  const kneeL = Math.max(0, Math.sin(p + Math.PI * 0.5)) * 38;
  const kneeR = Math.max(0, Math.sin(p - Math.PI * 0.5)) * 38;
  return {
    legL: [-26 * sw, -kneeL],
    legR: [26 * sw, -kneeR],
    armL: [24 * sw, 18],
    armR: [-24 * sw, 18],
    bob: Math.abs(Math.cos(p)) * 7,
    lean: 4,
  };
};
export const stand = (f: number): Pose => ({ armL: [6, -4], armR: [-6, 4], bob: 1.2 * Math.sin(f * 0.1), lean: 0 });
