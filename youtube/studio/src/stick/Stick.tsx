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
      <path d={`M${e[0] - s(0.03)},${e[1] - s(0.012)} q${s(0.04)},${-s(0.03)} ${s(0.085)},${s(0.004)} q${s(0.012)},${s(0.016)} ${-s(0.004)},${s(0.022)} l${-s(0.08)},0 z`} fill={look.shoes} stroke={INK} strokeWidth={w * 0.55} strokeLinejoin="round" />
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
      <g filter={`url(#brush-${id})`} strokeLinecap="round" strokeLinejoin="round" fill="none">
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
        {/* 머리 */}
        <g transform={`rotate(${-(pose.head ?? 0) - lean} ${hc[0]} ${hc[1]})`}>
          {look.kind === "woman" && <path d={`M${hc[0] - hr * 1.02},${hc[1] + hr * 0.1} Q${hc[0] - hr * 1.15},${hc[1] + hr * 1.3} ${hc[0] - hr * 0.55},${hc[1] + hr * 1.25}`} stroke={INK} strokeWidth={w * 2.2} />}
          <circle cx={hc[0]} cy={hc[1]} r={hr} fill="#f6efe0" stroke={INK} strokeWidth={w} />
          {/* 머리카락: 정수리 덮개 + 앞머리 */}
          <path d={`M${hc[0] - hr * 0.98},${hc[1] - hr * 0.2} A${hr},${hr} 0 0 1 ${hc[0] + hr * 0.98},${hc[1] - hr * 0.2} Q${hc[0] + hr * 0.5},${hc[1] - hr * 0.42} ${hc[0] + hr * 0.1},${hc[1] - hr * 0.3} Q${hc[0] - hr * 0.5},${hc[1] - hr * 0.45} ${hc[0] - hr * 0.98},${hc[1] - hr * 0.2} Z`} fill={look.kind === "old" ? "#7a7276" : INK} stroke={INK} strokeWidth={w * 0.6} />
          {look.kind === "woman" && <circle cx={hc[0] + hr * 0.55} cy={hc[1] - hr * 0.55} r={hr * 0.2} fill={look.accent} stroke={INK} strokeWidth={w * 0.5} />}
          {face !== "back" && (
            <>
              {face === "laugh" ? (
                <>
                  <path d={`M${hc[0] + hr * 0.05},${hc[1] + hr * 0.08} q${hr * 0.12},${-hr * 0.14} ${hr * 0.24},0`} stroke={INK} strokeWidth={w * 0.5} />
                  <path d={`M${hc[0] + hr * 0.45},${hc[1] + hr * 0.08} q${hr * 0.12},${-hr * 0.14} ${hr * 0.24},0`} stroke={INK} strokeWidth={w * 0.5} />
                </>
              ) : (
                <>
                  <circle cx={hc[0] + hr * 0.17} cy={hc[1] + hr * 0.12} r={hr * 0.08} fill={INK} stroke="none" />
                  <circle cx={hc[0] + hr * 0.57} cy={hc[1] + hr * 0.12} r={hr * 0.08} fill={INK} stroke="none" />
                </>
              )}
              <circle cx={hc[0] + hr * 0.75} cy={hc[1] + hr * 0.42} r={hr * 0.13} fill="#ff9a8a" stroke="none" opacity={0.6} />
              {face === "o" && <ellipse cx={hc[0] + hr * 0.4} cy={hc[1] + hr * 0.52} rx={hr * 0.1} ry={hr * 0.14} fill={INK} stroke="none" />}
              {face === "flat" && <path d={`M${hc[0] + hr * 0.28},${hc[1] + hr * 0.5} l${hr * 0.25},0`} stroke={INK} strokeWidth={w * 0.5} />}
              {face === "sad" && <path d={`M${hc[0] + hr * 0.25},${hc[1] + hr * 0.6} q${hr * 0.15},${-hr * 0.15} ${hr * 0.3},0`} stroke={INK} strokeWidth={w * 0.5} />}
              {(face === "smile" || face === "laugh") && <path d={`M${hc[0] + hr * 0.22},${hc[1] + hr * 0.42} q${hr * 0.18},${hr * (face === "laugh" ? 0.3 : 0.18)} ${hr * 0.36},0`} stroke={INK} strokeWidth={w * 0.5} fill={face === "laugh" ? "#7a2a38" : "none"} />}
            </>
          )}
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
