// 게임식 캐릭터 리그: 부품(머리·몸통·팔·다리) PNG를 관절 위치에서 돌려 움직인다.
// 설계 원칙(character-rigging 스킬 지침): 런타임 코드는 공용, 캐릭터마다 데이터 묶음 하나.
// 좌표는 원본 그림 픽셀 기준. 몸통 좌상단 = (0,0).
import React from "react";
import { Img, staticFile } from "remotion";

type V2 = [number, number];
export type RigPart = { src: string; w: number; h: number; pivot: V2; at: V2; layer: number; sy?: number };
export type RigData = {
  id: string;
  heads: Record<string, string>; // 표정 이름 → 파일
  head: { w: number; h: number; pivot: V2; at: V2 };
  torso: { src: string; w: number; h: number };
  armL: RigPart;
  armR: RigPart;
  legL: RigPart;
  legR: RigPart;
  footY: number; // 몸통 좌표에서 발바닥 높이 (다리를 펴고 섰을 때)
};

export const MAN: RigData = {
  id: "man",
  heads: { calm: "head_calm", blink: "head_blink", talk: "head_talk", o: "head_o", laugh: "head_laugh", side: "head_side" },
  head: { w: 132, h: 133, pivot: [66, 122], at: [77, 26] },
  torso: { src: "torso", w: 157, h: 169 },
  armL: { src: "arm_l", w: 62, h: 184, pivot: [37, 16], at: [34, 46], layer: 5 },
  armR: { src: "arm_r", w: 62, h: 184, pivot: [24, 16], at: [123, 46], layer: 5 },
  legL: { src: "leg_l", w: 85, h: 214, pivot: [45, 16], at: [58, 150], layer: 1, sy: 0.8 },
  legR: { src: "leg_r", w: 85, h: 214, pivot: [38, 16], at: [98, 150], layer: 1, sy: 0.8 },
  footY: 150 + (214 - 16) * 0.8,
};

// 한 프레임의 자세: 각도(도), 표정, 몸 들썩임
export type RigPose = { armL?: number; armR?: number; legL?: number; legR?: number; head?: number; face?: string; bob?: number; lean?: number };

const PartImg: React.FC<{ rig: RigData; p: RigPart; rot: number }> = ({ rig, p, rot }) => (
  <div style={{ position: "absolute", left: p.at[0] - p.pivot[0], top: p.at[1] - p.pivot[1], width: p.w, height: p.h, transform: `rotate(${rot}deg) scaleY(${p.sy ?? 1})`, transformOrigin: `${p.pivot[0]}px ${p.pivot[1]}px`, zIndex: p.layer }}>
    <Img src={staticFile(`rig/${rig.id}/${p.src}.png`)} style={{ width: p.w, height: p.h, display: "block" }} />
  </div>
);

/** x: 화면 가로 위치(발 가운데), floor: 발바닥 높이, height: 화면에서의 키(px), flip: 오른쪽을 보게 */
export const Rig: React.FC<{ rig: RigData; pose: RigPose; x: number; floor: number; height: number; flip?: boolean; shadow?: boolean }> = ({ rig, pose, x, floor, height, flip, shadow = true }) => {
  const top = rig.head.at[1] - rig.head.pivot[1]; // 머리 꼭대기(음수)
  const full = rig.footY - top;
  const s = height / full;
  const bob = pose.bob ?? 0;
  const face = rig.heads[pose.face ?? "calm"] ?? rig.heads.calm;
  const H = rig.head;
  return (
    <div style={{ position: "absolute", left: x, top: floor, width: 0, height: 0 }}>
      {shadow && <div style={{ position: "absolute", left: -height * 0.17, top: -height * 0.025, width: height * 0.34, height: height * 0.05, borderRadius: "50%", background: "rgba(70,40,25,0.28)", filter: "blur(4px)" }} />}
      <div style={{ position: "absolute", left: 0, top: 0, transform: `scale(${flip ? -s : s}, ${s}) translate(${-rig.torso.w / 2}px, ${-rig.footY - bob}px)`, transformOrigin: "0 0" }}>
        <div style={{ position: "relative", width: rig.torso.w, height: rig.torso.h, transform: `rotate(${pose.lean ?? 0}deg)`, transformOrigin: `${rig.torso.w / 2}px ${rig.footY}px` }}>
          <PartImg rig={rig} p={rig.legL} rot={pose.legL ?? 0} />
          <PartImg rig={rig} p={rig.legR} rot={pose.legR ?? 0} />
          <PartImg rig={rig} p={rig.armL} rot={pose.armL ?? 0} />
          <PartImg rig={rig} p={rig.armR} rot={pose.armR ?? 0} />
          <Img src={staticFile(`rig/${rig.id}/${rig.torso.src}.png`)} style={{ position: "absolute", left: 0, top: 0, width: rig.torso.w, height: rig.torso.h, zIndex: 10 }} />
          <div style={{ position: "absolute", left: H.at[0] - H.pivot[0], top: H.at[1] - H.pivot[1], width: H.w, height: H.h, transform: `rotate(${pose.head ?? 0}deg)`, transformOrigin: `${H.pivot[0]}px ${H.pivot[1]}px`, zIndex: 20 }}>
            <Img src={staticFile(`rig/${rig.id}/${face}.png`)} style={{ width: H.w, height: H.h, display: "block" }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- 동작 모음 (프레임 → 자세)
export const walk = (f: number, speed = 0.32): RigPose => {
  const p = Math.sin(f * speed);
  return { legL: 22 * p, legR: -22 * p, armL: -16 * p, armR: 16 * p, bob: Math.abs(Math.cos(f * speed)) * 8, head: 2 * p };
};
export const idle = (f: number): RigPose => ({ armL: 2 * Math.sin(f * 0.08), armR: -2 * Math.sin(f * 0.08), bob: 1.5 * Math.sin(f * 0.1) });
export const wave = (f: number, k: number): RigPose => ({ ...idle(f), armR: -(150 * k) + 18 * Math.sin(f * 0.6) * k, head: -4 * k });
/** 깜빡임: 약 3초마다 4프레임 */
export const blinking = (f: number, seed = 0) => ((f + seed) % 90) < 4;
