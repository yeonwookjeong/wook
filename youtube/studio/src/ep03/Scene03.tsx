// EP03 "11/11" 모형 세상: 광장(일력·줄·선물·꽃다발) → 90년대 학교 운동장 → 편의점 → 부엌 → 해 질 녘 논밭(十+一=土, 가래떡)
// 상자 그림은 참고 사진을 보고 새로 그린 것 (실제 포장 이미지를 쓰지 않음)
import { useMemo } from "react";
import { Easing, interpolate } from "remotion";
import * as THREE from "three";
import { Person } from "../three/World";
import { canvasTex, clamp, rng } from "../three/kit";
import { Box, BRUSH_HANJA, glyphTex, K, Key, MiniFrame, MiniLights, qTex, Rig, SKY, Slab, Sprite } from "../three/mini";

export type Mode03 = "calendar" | "ones" | "give" | "school" | "store" | "kitchen" | "bouquet" | "farm" | "soil" | "end";
export const ORDER03: Mode03[] = ["calendar", "ones", "give", "school", "store", "kitchen", "bouquet", "farm", "soil", "end"];
export type Words03 = { lang: "en" | "es"; tag: string };

const CHOC = "#4a2a1a";
const BISCUIT = "#d8a965";
const RED = "#d4202a";
const ease = Easing.inOut(Easing.cubic);
const out = Easing.out(Easing.cubic);
const pop = Easing.out(Easing.back(1.6));
const r01 = (t: number, a: number, b: number, e = ease) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: e });

// ---------- 카메라 (34° 기준 좌표) ----------
const PLAZA_Z = 0;
const SCHOOL: [number, number] = [16, -12];
const STORE: [number, number] = [-16, -12];
const KITCHEN: [number, number] = [0, -26];
const FARM: [number, number] = [20, 14];
const paths = (lang: "en" | "es"): Record<Mode03, Key[]> => ({
  calendar: [lang === "es" ? K(-6.0, 3.8, 11.5, 0, 1.4, 0.2) : K(6.0, 3.8, 12.0, 0, 1.4, 0.2), K(2.2, 2.7, 6.4, 0, 1.9, -1.2)],
  ones: [K(2.2, 2.7, 6.4, 0, 1.9, -1.2), K(1.0, 2.4, 4.0, 0, 2.15, -2.0)],
  give: [K(1.0, 2.4, 4.0, 0, 2.15, -2.0), K(1.0, 1.7, 5.4, -0.1, 0.75, 1.8), K(1.7, 1.45, 4.6, -0.1, 0.7, 1.8)],
  school: [K(SCHOOL[0] + 4.5, 3.6, SCHOOL[1] + 7.5, SCHOOL[0], 1.1, SCHOOL[1] + 0.4), K(SCHOOL[0] + 0.5, 1.5, SCHOOL[1] + 3.4, SCHOOL[0] - 0.8, 0.75, SCHOOL[1] + 0.4)],
  store: [K(STORE[0] + 3.5, 3.0, STORE[1] + 6.5, STORE[0], 1.3, STORE[1] - 1.6), K(STORE[0] + 1.4, 2.2, STORE[1] + 3.8, STORE[0], 1.5, STORE[1] - 2.2)],
  kitchen: [K(KITCHEN[0] + 0.2, 1.9, KITCHEN[1] + 2.0, KITCHEN[0] - 0.5, 1.15, KITCHEN[1] - 1.2), K(KITCHEN[0] + 1.3, 1.75, KITCHEN[1] + 2.0, KITCHEN[0] + 0.25, 1.15, KITCHEN[1] - 1.2)],
  bouquet: [K(-1.6, 1.6, 4.7, -2.6, 0.8, 1.5), K(1.0, 1.6, 4.7, 0, 0.8, 1.5), K(3.6, 1.6, 4.7, 2.6, 0.8, 1.5)],
  farm: [K(FARM[0] + 9.5, 4.6, FARM[1] + 4.0, FARM[0] + 4.3, 0.9, FARM[1] - 2.8), K(FARM[0] + 8.6, 4.4, FARM[1] + 5.4, FARM[0] + 3.0, 1.1, FARM[1] - 1.8)],
  soil: [K(FARM[0] + 8.6, 4.4, FARM[1] + 5.4, FARM[0] + 3.0, 1.1, FARM[1] - 1.8), K(FARM[0] + 4.5, 3.4, FARM[1] + 5.4, FARM[0] + 0.6, 2.0, FARM[1]), K(FARM[0] + 2.4, 3.1, FARM[1] + 4.8, FARM[0], 2.2, FARM[1])],
  end: [K(FARM[0] + 1.9, 2.2, FARM[1] + 5.8, FARM[0] + 0.05, 1.1, FARM[1] + 2), K(FARM[0] + 1.2, 1.6, FARM[1] + 4.6, FARM[0] + 0.05, 0.95, FARM[1] + 2), K(FARM[0] + 0.9, 1.45, FARM[1] + 4.1, FARM[0] + 0.05, 0.95, FARM[1] + 2)],
});

// ---------- 과자 ----------
/** 막대 과자 하나: 원점 = 아래 끝(과자 손잡이). coat 0~1 = 초콜릿이 덮인 정도, top 토핑 색 */
const Stick: React.FC<{ p?: [number, number, number]; r?: [number, number, number]; s?: number; coat?: number; color?: string; sprinkles?: number; seed?: number }> = ({ p = [0, 0, 0], r, s = 1, coat = 1, color = CHOC, sprinkles = 0, seed = 1 }) => {
  const L = 0.95;
  const grip = 0.22;
  const sp = useMemo(() => {
    const rr = rng(seed);
    const cs = ["#ff5d8f", "#ffd23a", "#5ec8ff", "#7ee08a", "#ffffff"];
    return Array.from({ length: 26 }, () => ({ y: grip + 0.05 + rr() * (L - grip - 0.1), a: rr() * Math.PI * 2, c: cs[Math.floor(rr() * cs.length)] }));
  }, [seed]);
  const cl = (L - grip) * coat;
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh position={[0, L / 2, 0]} castShadow>
        <cylinderGeometry args={[0.042, 0.042, L, 14]} />
        <meshStandardMaterial color={BISCUIT} roughness={0.7} />
      </mesh>
      {cl > 0.01 && (
        <mesh position={[0, L - cl / 2, 0]} castShadow>
          <cylinderGeometry args={[0.052, 0.052, cl, 14]} />
          <meshStandardMaterial color={color} roughness={0.35} />
        </mesh>
      )}
      {sp.slice(0, Math.round(sp.length * sprinkles)).map((d, k) => (
        <mesh key={k} position={[Math.cos(d.a) * 0.055, d.y, Math.sin(d.a) * 0.055]} rotation={[d.a, 0, d.a * 2]}>
          <boxGeometry args={[0.03, 0.012, 0.012]} />
          <meshStandardMaterial color={d.c} />
        </mesh>
      ))}
    </group>
  );
};

const useBoxTex = (kind: "red" | "gold" | "white" | "pink") =>
  useMemo(() => {
    const bg = { red: RED, gold: "#c9952b", white: "#f3eee6", pink: "#e98aa6" }[kind];
    const fg = kind === "white" ? "#b8222a" : "#ffffff";
    return canvasTex(256, 400, (g) => {
      g.fillStyle = bg;
      g.fillRect(0, 0, 256, 400);
      // 막대 두 개 (비스듬히)
      [[60, 360, 190, 40], [100, 380, 220, 70]].forEach(([x1, y1, x2, y2]) => {
        g.lineCap = "round";
        g.strokeStyle = BISCUIT;
        g.lineWidth = 16;
        g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
        g.strokeStyle = kind === "white" ? "#eadfcf" : CHOC;
        g.lineWidth = 20;
        g.beginPath(); g.moveTo(x1 + (x2 - x1) * 0.22, y1 + (y2 - y1) * 0.22); g.lineTo(x2, y2); g.stroke();
      });
      g.save();
      g.translate(128, 190);
      g.rotate(-0.25);
      g.fillStyle = fg;
      g.font = "900 64px Arial Black, Arial";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("PEPERO", 0, 0);
      g.restore();
      g.fillStyle = fg;
      g.font = "bold 30px Arial";
      g.textAlign = "center";
      g.fillText("11.11", 128, 370);
    });
  }, [kind]);

/** 과자 상자 (실제 크기의 큰 모형). open 0~1 이면 위가 열리고 막대가 솟음 */
const SnackBox: React.FC<{ p: [number, number, number]; s?: number; kind?: "red" | "gold" | "white" | "pink"; r?: [number, number, number]; open?: number }> = ({ p, s = 1, kind = "red", r, open = 0 }) => {
  const tex = useBoxTex(kind);
  const side = { red: RED, gold: "#c9952b", white: "#f3eee6", pink: "#e98aa6" }[kind];
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh castShadow>
        <boxGeometry args={[0.16, 0.25, 0.04]} />
        <meshStandardMaterial attach="material-0" color={side} />
        <meshStandardMaterial attach="material-1" color={side} />
        <meshStandardMaterial attach="material-2" color={side} />
        <meshStandardMaterial attach="material-3" color={side} />
        <meshStandardMaterial attach="material-4" map={tex} />
        <meshStandardMaterial attach="material-5" map={tex} />
      </mesh>
      {open > 0 &&
        [-0.045, -0.015, 0.015, 0.045].map((x, k) => <Stick key={k} p={[x, 0.02 + 0.2 * open, 0]} s={0.28} />)}
    </group>
  );
};

// ---------- 1. 광장 ----------
const Plaza: React.FC<{ mode: Mode03; t: number; tag: string }> = ({ mode, t }) => {
  const paving = useMemo(
    () =>
      canvasTex(512, 512, (g) => {
        g.fillStyle = "#ddd6ca";
        g.fillRect(0, 0, 512, 512);
        g.strokeStyle = "#c9c1b3";
        g.lineWidth = 3;
        for (let k = 0; k <= 16; k++) {
          g.beginPath(); g.moveTo(k * 32, 0); g.lineTo(k * 32, 512); g.stroke();
          g.beginPath(); g.moveTo(0, k * 32); g.lineTo(512, k * 32); g.stroke();
        }
      }),
    [],
  );
  const face = useMemo(
    () =>
      canvasTex(512, 520, (g) => {
        g.fillStyle = "#fbfaf6";
        g.fillRect(0, 0, 512, 520);
        g.fillStyle = "#2a2a2a";
        g.font = "bold 260px Arial";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText("/", 256, 250);
        g.fillStyle = "#8a8a8a";
        g.font = "bold 34px Arial";
        g.fillText("2026", 256, 470);
      }),
    [],
  );
  const oneTex = useMemo(
    () =>
      canvasTex(128, 256, (g) => {
        g.fillStyle = "#2a2a2a";
        g.font = "900 250px Arial Black, Arial";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText("1", 64, 140);
      }),
    [],
  );
  const band = useMemo(() => glyphTex("NOVEMBER", { bg: RED, fg: "#ffffff", size: 70, font: "Arial", w: 512, h: 120 }), []);
  const i = (m: Mode03) => mode === m;
  // 숫자 1 네 개 → 막대 과자
  const lift = i("ones") ? interpolate(t, [0.08, 0.7], [0, 1], clamp) : i("give") ? 1 : 0;
  const morph = i("ones") ? r01(t, 0.45, 0.62, pop) : i("give") ? 1 : 0;
  const XS = [-0.78, -0.48, 0.48, 0.78];
  // 선물 주고받기
  const pass = i("give") ? r01(t, 0.25, 0.55) : 0;
  const opn = i("give") ? r01(t, 0.6, 0.85, pop) : 0;
  // 꽃다발
  const bq = (k: number) => (i("bouquet") ? r01(t, 0.02 + k * 0.3, 0.2 + k * 0.3, pop) : 0);
  const QUEUE = [-2.9, -2.2, -1.5, -0.8, -0.1, 0.6];
  const coats = ["#4a6a8a", "#c86b5a", "#6f7d5c", "#8c5a8a", "#e0b04a", "#3d4a63"];
  return (
    <group position={[0, 0, PLAZA_Z]}>
      <Slab c={[0, 0]} size={[10, 8]} top="#ddd6ca" map={paving} />
      {/* 뒤쪽 가게들 */}
      {[[-3.4, "#f0d9b5", "#3f7d6b"], [0, "#e9e2d6", RED], [3.4, "#dbe6ee", "#2f5d8a"]].map(([x, c, aw], k) => (
        <group key={k} position={[x as number, 0, -3.5]}>
          <Box p={[0, 1.6, 0]} s={[3.2, 3.2, 1]} c={c as string} />
          <Box p={[0, 1.15, 0.62]} s={[3.0, 0.08, 0.5]} c={aw as string} r={[0.25, 0, 0]} />
          <Box p={[0, 0.6, 0.51]} s={[2.4, 1.0, 0.02]} c="#a9cbe0" e="#dff2ff" ei={0.25} />
        </group>
      ))}
      {/* 일력 */}
      <group position={[0, 0, -2.2]}>
        {[-1.0, 1.0].map((x) => <Box key={x} p={[x, 0.4, 0]} s={[0.1, 0.8, 0.1]} c="#6b5a48" />)}
        <Box p={[0, 2.25, 0]} s={[2.5, 3.0, 0.16]} c="#f4f1ea" />
        <mesh position={[0, 2.05, 0.085]}>
          <planeGeometry args={[2.3, 2.34]} />
          <meshStandardMaterial map={face} />
        </mesh>
        <Box p={[0, 3.55, 0.02]} s={[2.5, 0.5, 0.2]} c={RED} />
        <mesh position={[0, 3.55, 0.125]}>
          <planeGeometry args={[2.2, 0.5]} />
          <meshBasicMaterial map={band} toneMapped={false} />
        </mesh>
        {XS.map((x, k) => {
          // 인쇄된 "1"이 종이에서 튀어나오며 초콜릿 과자로 바뀌고 한 바퀴 돈다
          const d = Math.max(0, Math.min(1, (lift - k * 0.12) / 0.64));
          if (d <= 0)
            return (
              <mesh key={k} position={[x, 2.0, 0.088]}>
                <planeGeometry args={[0.42, 0.84]} />
                <meshBasicMaterial map={oneTex} transparent toneMapped={false} />
              </mesh>
            );
          const e = Easing.out(Easing.back(1.4))(d);
          return (
            <Stick key={k} p={[x * (1 - 0.15 * e), 1.52 + 0.25 * e, 0.12 + 0.55 * e]} s={0.95 + 0.1 * e} r={[0.1 * e, Math.PI * 2 * d, (k - 1.5) * 0.12 * e]} />
          );
        })}
      </group>
      {/* 줄 선 사람들 (상자를 들고) */}
      {(i("calendar") || i("ones")) &&
        QUEUE.map((x, k) => {
          // 줄이 한 칸씩 앞으로 (첫 장면이 멈춰 있지 않게)
          const tt = i("calendar") ? t * 3 : 3;
          const step = Math.floor(tt) + ease(Math.min(1, (tt % 1) * 1.6));
          const dx = -0.32 * Math.min(3, step);
          const hop = i("calendar") ? Math.abs(Math.sin(Math.min(1, (tt % 1) * 1.6) * Math.PI)) * 0.05 : 0;
          return (
            <group key={k} position={[dx, hop, 0]}>
              <Person p={[x, 0, 1.0]} coat={coats[k]} s={0.62} ry={-Math.PI / 2} />
              <SnackBox p={[x - 0.12, 0.52, 1.18]} r={[0, -Math.PI / 2, 0]} s={1.1} />
            </group>
          );
        })}
      {/* 주고받기 */}
      {i("give") && (
        <group>
          <Person p={[-0.65, 0, 1.8]} coat="#c86b5a" s={0.62} ry={Math.PI / 2} />
          <Person p={[0.45, 0, 1.8]} coat="#4a6a8a" s={0.62} ry={-Math.PI / 2} />
          <SnackBox p={[-0.45 + 0.7 * pass, 0.55 + 0.12 * Math.sin(pass * Math.PI), 1.85]} s={1.6} open={opn} />
        </group>
      )}
      {/* 꽃다발: 친구 → 연인 → 동료 */}
      {i("bouquet") &&
        [[-2.6, "#e0b04a", "#7f9a7a"], [0, "#c86b5a", "#4a6a8a"], [2.6, "#5b6470", "#5b6470"]].map(([x, c1, c2], k) => (
          <group key={k}>
            <Person p={[(x as number) - 0.45, 0, 1.5]} coat={c1 as string} s={0.62} ry={Math.PI / 2} />
            <Person p={[(x as number) + 0.45, 0, 1.5]} coat={c2 as string} s={0.62} ry={-Math.PI / 2} />
            {bq(k) > 0 && <Bouquet p={[x as number, 0.42, 1.6]} s={0.8 * bq(k)} />}
          </group>
        ))}
    </group>
  );
};

/** 막대 과자 꽃다발: 종이 고깔 + 부채꼴로 꽂힌 막대 + 리본 */
const Bouquet: React.FC<{ p: [number, number, number]; s?: number }> = ({ p, s = 1 }) => {
  const sticks = useMemo(() => {
    const rr = rng(7);
    const cs = [CHOC, CHOC, "#f2ede4", "#e98aa6", CHOC];
    return Array.from({ length: 13 }, (_, k) => ({ a: (k / 13) * Math.PI * 2, tilt: 0.12 + rr() * 0.22, c: cs[k % cs.length], sp: rr() > 0.6 ? 1 : 0 }));
  }, []);
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 0.35, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.32, 0.8, 18, 1, true]} />
        <meshStandardMaterial color="#d9b38c" side={THREE.DoubleSide} />
      </mesh>
      {sticks.map((d, k) => (
        <Stick key={k} p={[Math.cos(d.a) * 0.08, 0.3, Math.sin(d.a) * 0.08]} r={[Math.sin(d.a) * d.tilt, 0, -Math.cos(d.a) * d.tilt]} color={d.c} sprinkles={d.sp} seed={k + 3} />
      ))}
      <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.17, 0.035, 10, 28]} />
        <meshStandardMaterial color="#ff5d8f" />
      </mesh>
    </group>
  );
};

// ---------- 2. 90년대 학교 운동장 ----------
const School: React.FC<{ t: number; tag: string }> = ({ t, tag }) => {
  const win = useMemo(
    () =>
      canvasTex(1024, 256, (g) => {
        g.fillStyle = "#efe4cc";
        g.fillRect(0, 0, 1024, 256);
        g.fillStyle = "#9fc3d6";
        for (let k = 0; k < 12; k++) {
          g.fillRect(30 + k * 83, 30, 60, 70);
          g.fillRect(30 + k * 83, 150, 60, 70);
        }
      }),
    [],
  );
  const tagT = useMemo(() => glyphTex(tag, { bg: "#fffaf0", fg: "#2a3560", size: 64, font: "Arial", w: 512, h: 128 }), [tag]);
  const pass = r01(t, 0.15, 0.45);
  const grow = r01(t, 0.5, 0.8, pop);
  const [sx, sz] = SCHOOL;
  return (
    <group>
      <Slab c={SCHOOL} size={[10, 7]} top="#cdb28a" />
      <Box p={[sx, 1.3, sz - 2.6]} s={[9, 2.6, 1.4]} c="#efe4cc" />
      <mesh position={[sx, 1.3, sz - 1.89]}>
        <planeGeometry args={[8.8, 2.2]} />
        <meshStandardMaterial map={win} />
      </mesh>
      <Box p={[sx, 2.72, sz - 2.6]} s={[9.2, 0.2, 1.6]} c="#8a5a3a" />
      <mesh position={[sx, 2.3, sz - 1.88]}>
        <circleGeometry args={[0.28, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* 철봉, 국기 게양대 */}
      <Box p={[sx - 3.6, 1.5, sz - 0.5]} s={[0.06, 3, 0.06]} c="#b8b8b8" />
      {[0, 1].map((k) => <Box key={k} p={[sx + 3.2 + k * 0.9, 0.55, sz + 1.5]} s={[0.05, 1.1, 0.05]} c="#9a9a9a" />)}
      <Box p={[sx + 3.65, 1.08, sz + 1.5]} s={[0.95, 0.04, 0.04]} c="#9a9a9a" />
      {/* 교복 여학생 넷 */}
      <Person p={[sx - 1.2, 0, sz + 0.4]} coat="#2a3560" s={0.6} ry={Math.PI / 2} />
      <Person p={[sx - 0.4, 0, sz + 0.4]} coat="#2a3560" s={0.6 + 0.3 * grow} ry={-Math.PI / 2} />
      <SnackBox p={[sx - 1.0 + 0.45 * pass, 0.5 + 0.1 * Math.sin(pass * Math.PI), sz + 0.45]} s={1.4} />
      <Person p={[sx + 0.9, 0, sz + 1.1]} coat="#2a3560" s={0.6} ry={Math.PI / 2 + 0.3} />
      <Person p={[sx + 1.6, 0, sz + 1.1]} coat="#2a3560" s={0.6 + 0.12 * grow} ry={-Math.PI / 2} />
      <SnackBox p={[sx + 1.25, 0.5, sz + 1.15]} s={1.3} kind="pink" />
      <Sprite tex={tagT} s={r01(t, 0.05, 0.25, pop)} pos={[sx + 0.6, 1.75, sz + 1.2]} size={[1.2, 0.3]} />
    </group>
  );
};

// ---------- 3. 편의점 ----------
const KINDS: ("red" | "gold" | "white" | "pink")[] = ["red", "red", "gold", "red", "white", "pink"];
const Store: React.FC<{ t: number }> = ({ t }) => {
  const banner = useMemo(() => glyphTex("11.11", { bg: RED, fg: "#ffffff", size: 110, font: "Arial Black, Arial", w: 512, h: 160 }), []);
  const fill = r01(t, 0.05, 0.75, Easing.out(Easing.quad));
  const [sx, sz] = STORE;
  const units = [-2.3, 0, 2.3];
  const tiers = [0.32, 0.78, 1.24, 1.7, 2.16];
  const total = units.length * tiers.length * 7;
  let n = 0;
  return (
    <group>
      <Slab c={STORE} size={[8, 6]} top="#e8e6e0" />
      <Box p={[sx, 1.6, sz - 3]} s={[8, 3.2, 0.15]} c="#f4f2ec" />
      <mesh position={[sx, 2.85, sz - 2.9]}>
        <planeGeometry args={[2.0, 0.62]} />
        <meshBasicMaterial map={banner} toneMapped={false} />
      </mesh>
      {units.map((ux) => (
        <group key={ux} position={[sx + ux, 0, sz - 2.4]}>
          <Box p={[0, 1.3, -0.22]} s={[2.0, 2.6, 0.06]} c="#dcd8cf" />
          {tiers.map((y) => <Box key={y} p={[0, y - 0.04, 0]} s={[2.0, 0.05, 0.5]} c="#c9c4ba" />)}
          {tiers.map((y, ti) =>
            Array.from({ length: 7 }, (_, k) => {
              n++;
              const show = fill * total >= n;
              return show ? <SnackBox key={`${ti}-${k}`} p={[-0.82 + k * 0.27, y + 0.15, 0.05]} s={1.45} kind={KINDS[(k + ti) % KINDS.length]} /> : null;
            }),
          )}
        </group>
      ))}
      {/* 계산대와 줄 */}
      <Box p={[sx + 2.6, 0.5, sz + 0.6]} s={[1.6, 1.0, 0.6]} c="#3f7d6b" />
      <Person p={[sx + 2.6, 0, sz + 0.05]} coat="#3f7d6b" s={0.65} />
      {[0, 1, 2].map((k) => (
        <group key={k}>
          <Person p={[sx + 1.6 - k * 0.7, 0, sz + 1.5]} coat={["#c86b5a", "#4a6a8a", "#8c5a8a"][k]} s={0.62} ry={Math.PI / 2} />
          <SnackBox p={[sx + 1.75 - k * 0.7, 0.52, sz + 1.62]} r={[0, Math.PI / 2, 0]} s={1.1} kind={KINDS[k]} />
        </group>
      ))}
    </group>
  );
};

// ---------- 4. 부엌 ----------
const Kitchen: React.FC<{ t: number }> = ({ t }) => {
  const tiles = useMemo(
    () =>
      canvasTex(512, 256, (g) => {
        g.fillStyle = "#f6f3ee";
        g.fillRect(0, 0, 512, 256);
        g.strokeStyle = "#d9d3c9";
        g.lineWidth = 3;
        for (let k = 0; k <= 16; k++) { g.beginPath(); g.moveTo(k * 32, 0); g.lineTo(k * 32, 256); g.stroke(); }
        for (let k = 0; k <= 8; k++) { g.beginPath(); g.moveTo(0, k * 32); g.lineTo(512, k * 32); g.stroke(); }
      }),
    [],
  );
  const [kx, kz] = KITCHEN;
  const TOP = 0.92;
  const pot = new THREE.Vector3(kx - 0.55, TOP, kz - 1.2);
  // 찍기 → 스프링클 → 리본
  const dip = t < 0.32 ? r01(t, 0.02, 0.16) - r01(t, 0.18, 0.32) : 0;
  const coat = r01(t, 0.14, 0.18, Easing.linear);
  const moveToJar = r01(t, 0.6, 0.78);
  const spr = r01(t, 0.34, 0.58, Easing.linear);
  const ribbon = r01(t, 0.8, 0.95, pop);
  const stickPos: [number, number, number] = [
    pot.x + (0.95) * moveToJar,
    TOP + 0.75 - 0.45 * dip - 0.55 * moveToJar,
    pot.z + 0.05 * moveToJar,
  ];
  // 떨어지는 스프링클 (고정 난수)
  const falling = useMemo(() => {
    const rr = rng(11);
    const cs = ["#ff5d8f", "#ffd23a", "#5ec8ff", "#7ee08a", "#ffffff"];
    return Array.from({ length: 30 }, () => ({ x: (rr() - 0.5) * 0.25, z: (rr() - 0.5) * 0.25, d: rr() * 0.6, c: cs[Math.floor(rr() * cs.length)] }));
  }, []);
  return (
    <group>
      <Slab c={KITCHEN} size={[6, 5]} top="#b98f63" />
      <Box p={[kx, 1.6, kz - 2.35]} s={[6, 3.2, 0.15]} c="#f6f3ee" />
      <mesh position={[kx, 1.55, kz - 2.27]}>
        <planeGeometry args={[5.8, 1.2]} />
        <meshStandardMaterial map={tiles} />
      </mesh>
      <Box p={[kx, TOP / 2, kz - 1.3]} s={[4, TOP, 0.9]} c="#e8eef2" />
      <Box p={[kx, TOP + 0.02, kz - 1.3]} s={[4.1, 0.04, 1.0]} c="#efe9df" />
      {/* 냄비 + 녹은 초콜릿 */}
      <mesh position={[pot.x, TOP + 0.16, pot.z]} castShadow>
        <cylinderGeometry args={[0.3, 0.27, 0.3, 28, 1, true]} />
        <meshStandardMaterial color="#c9ccd1" metalness={0.6} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[pot.x, TOP + 0.26, pot.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.29, 28]} />
        <meshStandardMaterial color={CHOC} roughness={0.2} />
      </mesh>
      <Box p={[pot.x + 0.35, TOP + 0.24, pot.z]} s={[0.35, 0.03, 0.04]} c="#2b2b2b" />
      {/* 찍는 막대 */}
      <Stick p={stickPos} coat={coat * 0.85} sprinkles={spr} seed={5} s={0.9} />
      {spr > 0 && spr < 1 &&
        falling.map((f, k) => {
          const ft = Math.min(1, Math.max(0, spr * 1.6 - f.d));
          if (ft <= 0 || ft >= 1) return null;
          return (
            <mesh key={k} position={[stickPos[0] + f.x, stickPos[1] + 1.4 - ft * 0.9, stickPos[2] + f.z]} rotation={[k, k * 2, 0]}>
              <boxGeometry args={[0.03, 0.012, 0.012]} />
              <meshStandardMaterial color={f.c} />
            </mesh>
          );
        })}
      {/* 완성된 막대가 꽂힌 병 + 리본 */}
      <group position={[pot.x + 0.95, TOP, pot.z]}>
        <mesh position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.34, 24, 1, true]} />
          <meshStandardMaterial color="#cfe6f2" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
        {[[-0.05, CHOC, 1], [0.05, "#f2ede4", 0], [0, "#e98aa6", 1]].map(([x, c, sp], k) => (
          <Stick key={k} p={[x as number, 0.02, (k - 1) * 0.04]} r={[0, 0, (x as number) * 2]} s={0.85} color={c as string} sprinkles={sp as number} seed={k + 20} />
        ))}
        {ribbon > 0 && (
          <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} scale={ribbon}>
            <torusGeometry args={[0.17, 0.03, 10, 28]} />
            <meshStandardMaterial color="#ff5d8f" />
          </mesh>
        )}
      </group>
      {/* 쟁반 위 막대들 */}
      <Box p={[kx + 1.3, TOP + 0.05, kz - 1.15]} s={[0.9, 0.03, 0.5]} c="#9aa7b2" />
      {[0, 1, 2, 3, 4].map((k) => <Stick key={k} p={[kx + 0.95, TOP + 0.1, kz - 1.32 + k * 0.08]} r={[0, 0, -Math.PI / 2]} s={0.75} coat={k % 2 ? 1 : 0.8} sprinkles={k % 3 === 0 ? 1 : 0} seed={k + 30} />)}
      <Person p={[kx + 1.6, 0, kz - 0.3]} coat="#e98aa6" s={0.7} ry={-0.4} />
    </group>
  );
};

// ---------- 5. 해 질 녘 논밭 + 十一 → 土 + 가래떡 ----------
const Farm: React.FC<{ mode: Mode03; t: number }> = ({ mode, t }) => {
  const [fx, fz] = FARM;
  const ten = useMemo(() => glyphTex("十", { bg: "#f4ead6", fg: "#5a2a14", size: 210, font: BRUSH_HANJA }), []);
  const one = useMemo(() => glyphTex("一", { bg: "#f4ead6", fg: "#5a2a14", size: 210, font: BRUSH_HANJA }), []);
  const soil = useMemo(() => glyphTex("土", { bg: "#f4ead6", fg: "#b8222a", size: 220, font: BRUSH_HANJA }), []);
  const q = useMemo(() => qTex(), []);
  const banner = useMemo(() => glyphTex("농업인의 날 11.11", { bg: "#fffaf0", fg: "#2f6f3a", size: 58, w: 512, h: 112 }), []);
  const i = (m: Mode03) => mode === m;
  // 十一: 나란히 등장(eleven) → 위아래로 겹침 → 土
  const show = i("soil") ? r01(t, 0.02, 0.15, pop) : 0;
  const stack = i("soil") ? r01(t, 0.3, 0.55) : 0;
  const merge = i("soil") ? r01(t, 0.62, 0.72, pop) : i("end") ? 1 : 0;
  const endT = i("end") ? r01(t, 0.05, 0.3, pop) : 0;
  const qS = i("end") ? r01(t, 0.5, 0.7, pop) : 0;
  const by = 2.2;
  const rows = useMemo(
    () =>
      canvasTex(256, 256, (g) => {
        g.fillStyle = "#d9bb5c";
        g.fillRect(0, 0, 256, 256);
        g.fillStyle = "#b8963e";
        for (let k = 0; k < 16; k++) g.fillRect(0, k * 16, 256, 5);
      }),
    [],
  );
  const paddy = (gx: number, gz: number) => (
    <mesh key={`${gx}${gz}`} position={[fx + gx * 2.6, 0.01, fz + gz * 2.2]} rotation={[-Math.PI / 2, 0, (gx + gz) % 2 ? Math.PI / 2 : 0]} receiveShadow>
      <planeGeometry args={[2.4, 2.0]} />
      <meshStandardMaterial map={rows} color={(gx + gz) % 2 ? "#ffffff" : "#e8e0c8"} />
    </mesh>
  );
  return (
    <group>
      <Slab c={FARM} size={[14, 10]} top="#a58f62" side="#7d6a52" />
      {[-2, -1, 0, 1, 2].flatMap((gx) => [-1, 0, 1].map((gz) => paddy(gx, gz)))}
      {/* 곤포 사일리지(흰 비닐 볏짚 뭉치) */}
      {[[-4.5, 3.4], [-3.6, 3.6], [4.2, -3.2], [5.0, -3.0], [4.6, 3.5]].map(([x, z], k) => (
        <mesh key={k} position={[fx + x, 0.32, fz + z]} rotation={[0, k, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.55, 20]} />
          <meshStandardMaterial color="#f4f4f0" roughness={0.4} />
        </mesh>
      ))}
      {/* 뒷산과 감나무 */}
      {[[-10, -16, 6, "#7d8f5a"], [-2, -18, 8, "#6f8250"], [8, -16.5, 6.5, "#86945f"], [15, -13, 5, "#7a8a55"]].map(([x, z, r, c], k) => (
        <mesh key={k} position={[fx + (x as number), -0.3, fz + (z as number)]} scale={[1, 0.28, 0.7]} castShadow>
          <sphereGeometry args={[r as number, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={c as string} flatShading />
        </mesh>
      ))}
      {[[-6.2, -3.8], [-5.6, 1.5], [6.4, 1.2], [-6.4, 4.2]].map(([x, z], k) => (
        <group key={k} position={[fx + x, 0, fz + z]}>
          <mesh position={[0, 0.5, 0]} castShadow><cylinderGeometry args={[0.07, 0.1, 1.0, 8]} /><meshStandardMaterial color="#6b4a32" /></mesh>
          <mesh position={[0, 1.25, 0]} castShadow><icosahedronGeometry args={[0.6, 0]} /><meshStandardMaterial color={k % 2 ? "#c46a2a" : "#8a9a4a"} flatShading /></mesh>
        </group>
      ))}
      {/* 파란 지붕 농가 */}
      <group position={[fx + 4.6, 0, fz - 3.6]}>
        <Box p={[0, 0.6, 0]} s={[2.2, 1.2, 1.4]} c="#efe8dc" />
        <Box p={[0, 1.35, 0]} s={[2.5, 0.3, 1.7]} c="#2f6fb0" />
        <mesh position={[0, 0.82, 0.71]}>
          <planeGeometry args={[1.7, 0.36]} />
          <meshBasicMaterial map={banner} toneMapped={false} />
        </mesh>
      </group>
      {/* 가래떡을 든 농부들 (마당), 들판의 농부 */}
      {[[3.4, -1.9, "#6b8e4e", 0.5], [4.4, -1.6, "#8a6a3a", -0.3], [5.4, -1.9, "#5b7a4a", -0.8]].map(([x, z, c, ry], k) => {
        const w = i("farm") ? Math.sin((t * 4 + k) * Math.PI) * 0.04 : 0;
        return (
          <group key={k} position={[fx + (x as number), Math.abs(w), fz + (z as number)]}>
            <Person p={[0, 0, 0]} coat={c as string} s={0.62} ry={ry as number} />
            {[-0.035, 0, 0.035].map((dz, j) => (
              <mesh key={j} position={[0.14, 0.5 + j * 0.03, 0.12 + dz]} rotation={[0, ry as number, Math.PI / 2]}>
                <cylinderGeometry args={[0.028, 0.028, 0.34, 12]} />
                <meshStandardMaterial color="#fbfaf5" />
              </mesh>
            ))}
          </group>
        );
      })}
      <Person p={[fx - 1.8, 0, fz + 2.8]} coat="#6b8e4e" s={0.62} ry={-1} />
      {/* 十 一 → 土 */}
      {(i("soil") || i("end")) && merge < 0.5 && show > 0 && (
        <group scale={show}>
          <Box p={[fx - 0.95 * (1 - stack), by + 0.95 * stack, fz]} s={[1.3, 1.3, 0.3]} c="#f4ead6" map={ten} />
          <Box p={[fx + 0.95 * (1 - stack), by - 0.6 * stack, fz]} s={[1.3, 1.3, 0.3]} c="#f4ead6" map={one} />
        </group>
      )}
      {merge >= 0.5 && <Box p={[fx, by + 0.2, fz]} s={[1.5 * merge, 2.2 * merge, 0.32]} c="#f4ead6" map={soil} />}
      {merge > 0 && merge < 1 && <pointLight position={[fx, by, fz + 1]} color="#fff2c0" intensity={6 * (1 - merge)} distance={5} />}
      {/* 마지막: 꽃다발과 가래떡 */}
      {i("end") && (
        <group position={[fx, 0, fz + 2]} scale={endT}>
          <Box p={[0, 0.66, 0]} s={[1.5, 0.06, 0.8]} c="#a0764e" />
          {[[-0.65, -0.3], [0.65, -0.3], [-0.65, 0.3], [0.65, 0.3]].map(([x, z], k) => <Box key={k} p={[x, 0.32, z]} s={[0.06, 0.64, 0.06]} c="#7a5638" />)}
          <Bouquet p={[-0.38, 0.7, 0]} s={0.42} />
          <mesh position={[0.38, 0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.28, 28]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          {[[-0.09, 0.76], [0, 0.76], [0.09, 0.76], [-0.045, 0.84], [0.045, 0.84]].map(([z, y], k) => (
            <mesh key={k} position={[0.38, y, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.042, 0.042, 0.5, 16]} />
              <meshStandardMaterial color="#fbfaf5" roughness={0.6} />
            </mesh>
          ))}
        </group>
      )}
      <Sprite tex={q} s={qS} pos={[fx, 1.45, fz + 2]} size={[0.3, 0.3]} rz={-0.1} />
    </group>
  );
};

// ---------- 장면 ----------
export const Scene03: React.FC<{ mode: Mode03; t: number; words: Words03 }> = ({ mode, t, words }) => {
  const P = useMemo(() => paths(words.lang), [words.lang]);
  const plaza = ["calendar", "ones", "give", "bouquet"].includes(mode);
  const farm = ["farm", "soil", "end"].includes(mode);
  return (
    <MiniFrame sky={farm ? SKY.dusk : SKY.day}>
      <Rig paths={P} mode={mode} t={t} />
      <MiniLights dusk={farm ? 1 : 0} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={farm ? "#b9a77a" : "#c9d6a8"} />
      </mesh>
      {plaza && <Plaza mode={mode} t={t} tag={words.tag} />}
      {mode === "school" && <School t={t} tag={words.tag} />}
      {mode === "store" && <Store t={t} />}
      {mode === "kitchen" && <Kitchen t={t} />}
      {farm && <Farm mode={mode} t={t} />}
    </MiniFrame>
  );
};
