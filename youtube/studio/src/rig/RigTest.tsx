// 리그 시험: 공원에 걸어 들어와 → 옆을 봤다가 → 손 흔들고 웃고 → 음성에 맞춰 말하기. 발걸음마다 먼지(효과 층).
import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { MAN, Rig, RigPose, blinking, idle, walk, wave } from "./Rig";
import mouth from "./mouth_s0.json";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (t: number) => t * t * (3 - 2 * t);
const WALK_END = 75;
const TALK_AT = 140;
const SPEED = 0.32;
const FLOOR = 1690;

// 먼지: 발이 바닥을 칠 때(다리 각도가 0을 지날 때)마다 작은 구름이 퍼짐
const Dust: React.FC<{ f: number; x0: number; x1: number }> = ({ f, x0, x1 }) => {
  const puffs: { at: number; x: number }[] = [];
  for (let k = 0; ; k++) {
    const at = Math.round((k * Math.PI) / SPEED);
    if (at > WALK_END) break;
    puffs.push({ at, x: x0 + (x1 - x0) * ease(at / WALK_END) });
  }
  return (
    <>
      {puffs.map((p, i) => {
        const age = f - p.at;
        if (age < 0 || age > 16) return null;
        const k = age / 16;
        return [-1, 1].map((sd) => (
          <div key={`${i}${sd}`} style={{ position: "absolute", left: p.x + sd * (20 + k * 50) - 22, top: FLOOR - 26 - k * 18, width: 44 * (0.6 + k), height: 30 * (0.6 + k), borderRadius: "50%", background: "#efe3cc", border: "4px solid #2a1c24", opacity: 1 - k }} />
        ));
      })}
    </>
  );
};

export const RigTest: React.FC = () => {
  const f = useCurrentFrame();
  const x = interpolate(ease(Math.min(1, f / WALK_END)), [0, 1], [-160, 540]);
  let pose: RigPose;
  if (f < WALK_END) pose = walk(f, SPEED);
  else if (f < 100) pose = { ...idle(f), face: f > 80 && f < 96 ? "side" : "calm" };
  else if (f < TALK_AT) pose = { ...wave(f, Math.min(1, (f - 100) / 8) * Math.min(1, (TALK_AT - f) / 8)), face: "laugh" };
  else {
    const v = mouth[f - TALK_AT] ?? 0;
    pose = { ...idle(f), face: v > 0.35 ? (v > 0.75 ? "o" : "talk") : "calm", armL: idle(f).armL! + 10 * v, head: 3 * Math.sin(f * 0.07) };
  }
  if (pose.face === undefined || pose.face === "calm") if (blinking(f, 20)) pose.face = "blink";
  const camZ = interpolate(f, [0, 75, 140, 290], [1, 1.04, 1.18, 1.26], cl);
  return (
    <AbsoluteFill style={{ background: "#f3ead8" }}>
      <AbsoluteFill style={{ transform: `scale(${camZ})`, transformOrigin: `540px ${FLOOR - 300}px` }}>
        <Img src={staticFile("m04/park.png")} style={{ width: 1080, height: 1920 }} />
        <Dust f={f} x0={-160} x1={540} />
        <Rig rig={MAN} pose={pose} x={x} floor={FLOOR} height={600} flip={f < WALK_END} />
      </AbsoluteFill>
      <Sequence from={TALK_AT} layout="none">
        <Audio src={staticFile("ep04/vo_en/s0.wav")} />
      </Sequence>
    </AbsoluteFill>
  );
};
