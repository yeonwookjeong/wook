// EP02 "빨간 이름" 모형 세상. EP01 World.tsx 와 같은 그림체·조명·카메라 곡선 방식.
// 무대: 단지 광장의 거대한 이름판(세로) + 빨간 펜, 뒤쪽 만장 줄, 왼쪽 위패 상, 오른쪽 은행 앞 책상과 도장.
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useVideoConfig } from "remotion";
import * as THREE from "three";
import { Ground, Tower, Tree } from "../samples/Complex3D";
import { Person } from "../three/World";
import { canvasTex, clamp } from "../three/kit";

export type Mode02 = "pen" | "red" | "curse" | "dark" | "banners" | "tablets" | "bleed" | "light" | "stamp" | "calm" | "end";
export const ORDER02: Mode02[] = ["pen", "red", "curse", "dark", "banners", "tablets", "bleed", "light", "stamp", "calm", "end"];
export type Words02 = { stop: string; bank: string; contract: string };

const CJK = '"WenQuanYi Zen Hei", Arial';
const INK = "#d61f1f";

// ---------- 카메라 ----------
type Key = { p: THREE.Vector3; t: THREE.Vector3 };
const K = (px: number, py: number, pz: number, tx: number, ty: number, tz: number): Key => ({ p: new THREE.Vector3(px, py, pz), t: new THREE.Vector3(tx, ty, tz) });
const KEYS: Key[] = [
  K(1.1, 2.9, 4.4, 0, 2.55, 0), // pen: 첫 프레임, 펜촉과 빈 이름 칸
  K(1.0, 2.1, 6.4, 0, 1.85, 0), // red: 이름판 전체
  K(3.0, 2.0, 7.4, 0.9, 1.7, 0), // curse: 옆 사람 말풍선까지
  K(5.0, 5.2, 11.5, 0, 2.0, -2), // dark: 뒤로 빠지며 어두워짐
  K(2.4, 4.3, 6.5, 0, 2.6, -3.5), // banners: 만장 줄
  K(-1.7, 1.7, 2.6, -3.2, 0.95, -1.0), // tablets: 위패 상 가까이
  K(0.9, 2.2, 4.9, 0, 1.8, 0), // bleed: 다시 이름판
  K(5.5, 3.4, 8.5, 8, 1.2, -0.5), // light: 은행 쪽으로
  K(9.0, 3.1, 4.4, 8.2, 0.4, 1.6), // stamp: 책상 위 계약서
  K(11.2, 3.8, 8.6, 8.2, 1.0, 0.4), // calm: 은행 앞 넓게
  K(4.5, 2.6, 8.8, 4.5, 2.0, 1.5), // end: 펜과 도장
  K(4.4, 2.45, 7.6, 4.5, 2.0, 1.5), // end 끝
];
const POS = new THREE.CatmullRomCurve3(KEYS.map((k) => k.p), false, "centripetal");
const TGT = new THREE.CatmullRomCurve3(KEYS.map((k) => k.t), false, "centripetal");

const Rig: React.FC<{ mode: Mode02; t: number }> = ({ mode, t }) => {
  const { camera } = useThree();
  const idx = ORDER02.indexOf(mode);
  const tt = idx === ORDER02.length - 1 ? Easing.out(Easing.quad)(t) * 0.5 + t * 0.5 : t;
  const u = (idx + tt) / ORDER02.length;
  camera.position.copy(POS.getPoint(u));
  camera.lookAt(TGT.getPoint(u));
  return null;
};

// ---------- 무늬 ----------
const vertTex = (chars: string[], o: { w: number; h: number; bg: string; fg: string; size: number; pad?: number }) =>
  canvasTex(o.w, o.h, (g) => {
    g.fillStyle = o.bg;
    g.fillRect(0, 0, o.w, o.h);
    g.fillStyle = o.fg;
    g.font = `bold ${o.size}px ${CJK}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const pad = o.pad ?? 0;
    const step = (o.h - pad * 2) / chars.length;
    chars.forEach((c, k) => g.fillText(c, o.w / 2, pad + step * (k + 0.5)));
  });

const labelTex = (text: string, o: { w: number; h: number; bg: string; fg: string; size: number; round?: number; stroke?: string }) =>
  canvasTex(o.w, o.h, (g) => {
    g.fillStyle = o.bg;
    g.beginPath();
    g.roundRect(6, 6, o.w - 12, o.h - 12, o.round ?? 24);
    g.fill();
    if (o.stroke) {
      g.lineWidth = 8;
      g.strokeStyle = o.stroke;
      g.stroke();
    }
    g.fillStyle = o.fg;
    g.font = `900 ${o.size}px Arial`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, o.w / 2, o.h / 2 + 6);
  });

const bubbleTex = (text: string) =>
  canvasTex(420, 260, (g) => {
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.roundRect(10, 10, 400, 180, 70);
    g.fill();
    g.beginPath();
    g.moveTo(120, 185);
    g.lineTo(90, 250);
    g.lineTo(180, 188);
    g.fill();
    g.lineWidth = 8;
    g.strokeStyle = "#1b1b1b";
    g.beginPath();
    g.roundRect(10, 10, 400, 180, 70);
    g.stroke();
    g.fillStyle = INK;
    g.font = "900 104px Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 210, 106);
  });

const qTex = () =>
  canvasTex(256, 256, (g) => {
    g.font = "900 220px Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineWidth = 18;
    g.strokeStyle = "#1b1b1b";
    g.strokeText("?", 128, 140);
    g.fillStyle = "#ffd23a";
    g.fillText("?", 128, 140);
  });

const Sprite: React.FC<{ tex: THREE.Texture; s: number; pos: [number, number, number]; size: [number, number]; ry?: number; rz?: number }> = ({ tex, s, pos, size, ry = 0.2, rz = 0 }) =>
  s < 0.01 ? null : (
    <mesh position={pos} scale={0.7 + 0.3 * s} rotation={[0, ry, rz]}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={tex} transparent opacity={Math.min(1, s)} depthTest={false} toneMapped={false} />
    </mesh>
  );

// ---------- 이름판 + 빨간 이름 ----------
const NAME = ["김", "민", "지"];
const NAME_TOP = 2.95;
const NAME_H = 2.4;
const NameBoard: React.FC<{ write: number; bleed: number }> = ({ write, bleed }) => {
  const paper = useMemo(
    () =>
      canvasTex(280, 620, (g) => {
        g.fillStyle = "#fbf8f1";
        g.fillRect(0, 0, 280, 620);
        g.fillStyle = "#3a3a3a";
        g.font = "bold 30px Arial";
        g.textAlign = "center";
        g.fillText("NAME · 이름", 140, 42);
        g.strokeStyle = "#cfc6b8";
        g.lineWidth = 3;
        g.strokeRect(40, 70, 200, 520);
      }),
    [],
  );
  const name = useMemo(() => vertTex(NAME, { w: 256, h: 640, bg: "rgba(0,0,0,0)", fg: INK, size: 190 }), []);
  const p = Math.max(0.001, write);
  name.repeat.set(1, p);
  name.offset.set(0, 1 - p);
  return (
    <group>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.2, -0.05]} castShadow>
          <boxGeometry args={[0.08, 0.4, 0.3]} />
          <meshStandardMaterial color="#6b5a48" />
        </mesh>
      ))}
      <mesh position={[0, 1.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 3.1, 0.06]} />
        <meshStandardMaterial color="#8a6f55" />
      </mesh>
      <mesh position={[0, 1.85, 0.032]}>
        <planeGeometry args={[1.36, 3.0]} />
        <meshStandardMaterial map={paper} />
      </mesh>
      {write > 0.001 && (
        <mesh position={[0, NAME_TOP - (NAME_H * p) / 2, 0.04]} scale={[1, 1, 1]}>
          <planeGeometry args={[0.95, NAME_H * p]} />
          <meshBasicMaterial map={name} transparent toneMapped={false} color={new THREE.Color(1, 1 - 0.35 * bleed, 1 - 0.35 * bleed)} />
        </mesh>
      )}
      {/* 번지는 잉크 방울 */}
      {bleed > 0 &&
        [
          [-0.18, 2.35, 0.0],
          [0.12, 1.55, 0.15],
          [-0.05, 0.75, 0.3],
          [0.2, 2.2, 0.45],
        ].map(([x, y, d], k) => {
          const g = interpolate(bleed, [d, d + 0.5], [0, 1], clamp);
          return g > 0 ? (
            <mesh key={k} position={[x, y - 0.22 * g, 0.045]}>
              <boxGeometry args={[0.035, 0.44 * g, 0.01]} />
              <meshBasicMaterial color="#b3141a" toneMapped={false} />
            </mesh>
          ) : null;
        })}
    </group>
  );
};

// 빨간 펜: 원점 = 펜촉
const Pen: React.FC<{ pos: THREE.Vector3; tilt: number; drop: number }> = ({ pos, tilt, drop }) => (
  <group position={pos}>
    <group rotation={[0.25, 0, tilt]}>
      <mesh position={[0, 0.09, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.06, 0.18, 16]} />
        <meshStandardMaterial color="#d9d4cc" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.82, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 1.3, 20]} />
        <meshStandardMaterial color="#d8262b" roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.12, 20]} />
        <meshStandardMaterial color="#2b2b2b" />
      </mesh>
      <mesh position={[0.085, 1.2, 0]}>
        <boxGeometry args={[0.025, 0.35, 0.04]} />
        <meshStandardMaterial color="#c9c3ba" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
    {drop > 0 && (
      <mesh position={[0, -0.035 - 0.05 * drop, 0]} scale={[1, 1.25, 1]}>
        <sphereGeometry args={[0.04 * drop, 14, 10]} />
        <meshStandardMaterial color="#c4161c" roughness={0.15} />
      </mesh>
    )}
  </group>
);

// ---------- 만장 줄 ----------
const BANNER_TEXT = [["故", "金", "公"], ["故", "李", "氏"], ["故", "朴", "公"], ["故", "崔", "氏"], ["故", "鄭", "公"]];
const CLOTH = ["#f6f1e6", "#f3e7c4", "#eef0f2", "#f6f1e6", "#efe3d2"];
const Banners: React.FC<{ rise: number }> = ({ rise }) => {
  const texs = useMemo(() => BANNER_TEXT.map((c, k) => vertTex(c, { w: 200, h: 760, bg: CLOTH[k], fg: INK, size: 150, pad: 60 })), []);
  return (
    <group position={[0, 0, -3.6]}>
      {BANNER_TEXT.map((_, k) => {
        const r = interpolate(rise, [k * 0.1, k * 0.1 + 0.5], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.2)) });
        if (r <= 0) return null;
        const x = (k - 2) * 1.7;
        return (
          <group key={k} position={[x, -(1 - r) * 5.2, 0]} rotation={[0, 0.05 * (k - 2), 0]}>
            <mesh position={[0, 2.4, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.05, 4.8, 10]} />
              <meshStandardMaterial color="#b89a62" />
            </mesh>
            <mesh position={[0, 4.55, 0.05]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.025, 0.025, 1.0, 8]} />
              <meshStandardMaterial color="#b89a62" />
            </mesh>
            <mesh position={[0, 2.85, 0.07]} castShadow>
              <planeGeometry args={[0.85, 3.3]} />
              <meshStandardMaterial map={texs[k]} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// ---------- 위패 상 ----------
const TABLET_TEXT = [["故", "金", "公"], ["故", "李", "氏"], ["故", "朴", "公"]];
const Tablets: React.FC<{ candle: number }> = ({ candle }) => {
  const texs = useMemo(() => TABLET_TEXT.map((c) => vertTex(c, { w: 120, h: 380, bg: "#efe6d2", fg: INK, size: 90, pad: 30 })), []);
  return (
    <group position={[-3.2, 0, -1.0]}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.08, 0.75]} />
        <meshStandardMaterial color="#5a3a26" />
      </mesh>
      {[-0.85, 0.85].map((x) =>
        [-0.3, 0.3].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.25, z]}>
            <boxGeometry args={[0.07, 0.5, 0.07]} />
            <meshStandardMaterial color="#4a2e1e" />
          </mesh>
        )),
      )}
      {texs.map((tx, k) => (
        <group key={k} position={[(k - 1) * 0.5, 0.54, -0.05]}>
          <mesh position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[0.34, 0.1, 0.2]} />
            <meshStandardMaterial color="#3b2416" />
          </mesh>
          <mesh position={[0, 0.48, 0]} castShadow>
            <boxGeometry args={[0.27, 0.78, 0.06]} />
            <meshStandardMaterial color="#4a2c1a" />
          </mesh>
          <mesh position={[0, 0.48, 0.031]}>
            <planeGeometry args={[0.2, 0.66]} />
            <meshStandardMaterial map={tx} />
          </mesh>
        </group>
      ))}
      {[-0.8, 0.8].map((x) => (
        <group key={x} position={[x, 0.54, 0.15]}>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.28, 12]} />
            <meshStandardMaterial color="#f4efe4" />
          </mesh>
          {candle > 0 && (
            <>
              <mesh position={[0, 0.32, 0]} scale={[1, 1.6, 1]}>
                <sphereGeometry args={[0.03, 10, 8]} />
                <meshBasicMaterial color="#ffb347" toneMapped={false} />
              </mesh>
              <pointLight position={[0, 0.4, 0.1]} color="#ff9a40" intensity={1.6 * candle} distance={2.2} />
            </>
          )}
        </group>
      ))}
    </group>
  );
};

// ---------- 은행, 책상, 계약서, 도장 ----------
const DESK = new THREE.Vector3(8.2, 0, 1.6);
const DESK_TOP = 0.39;
const IMPRINT = new THREE.Vector3(8.4, DESK_TOP + 0.006, 1.85);

const Bank: React.FC<{ word: string }> = ({ word }) => {
  const sign = useMemo(() => labelTex(word, { w: 512, h: 150, bg: "#2f5d8a", fg: "#ffffff", size: 96, round: 20 }), [word]);
  return (
    <group position={[8.5, 0, -2.2]}>
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 2.6, 2.6]} />
        <meshStandardMaterial color="#efe8dc" />
      </mesh>
      <mesh position={[0, 2.75, 0]} castShadow>
        <boxGeometry args={[4.4, 0.3, 2.8]} />
        <meshStandardMaterial color="#d9cfc0" />
      </mesh>
      <mesh position={[0, 2.15, 1.31]}>
        <planeGeometry args={[2.2, 0.62]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.65, 1.31]}>
        <planeGeometry args={[1.0, 1.3]} />
        <meshStandardMaterial color="#9fc3d6" emissive="#cfe6f2" emissiveIntensity={0.25} />
      </mesh>
      {[-1.45, 1.45].map((x) => (
        <mesh key={x} position={[x, 1.0, 1.31]}>
          <planeGeometry args={[0.8, 0.9]} />
          <meshStandardMaterial color="#a8c8d8" emissive="#d8ecf5" emissiveIntensity={0.2} />
        </mesh>
      ))}
    </group>
  );
};

const Desk: React.FC<{ word: string; imprint: number }> = ({ word, imprint }) => {
  const paper = useMemo(
    () =>
      canvasTex(330, 450, (g) => {
        g.fillStyle = "#fdfbf6";
        g.fillRect(0, 0, 330, 450);
        g.fillStyle = "#222";
        g.font = "900 44px Arial";
        g.textAlign = "center";
        g.fillText(word, 165, 64);
        g.fillStyle = "#b9b2a6";
        for (let k = 0; k < 8; k++) g.fillRect(36, 100 + k * 30, k % 3 === 2 ? 170 : 258, 9);
        g.fillStyle = "#555";
        g.fillRect(150, 395, 150, 3);
      }),
    [word],
  );
  const seal = useMemo(
    () =>
      canvasTex(256, 256, (g) => {
        g.strokeStyle = INK;
        g.lineWidth = 16;
        g.beginPath();
        g.arc(128, 128, 112, 0, Math.PI * 2);
        g.stroke();
        g.fillStyle = INK;
        g.font = `bold 62px ${CJK}`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        NAME.forEach((c, k) => g.fillText(c, 128, 62 + k * 66));
      }),
    [],
  );
  return (
    <group>
      <group position={DESK}>
        <mesh position={[0, DESK_TOP - 0.04, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.08, 1.4]} />
          <meshStandardMaterial color="#b48a62" />
        </mesh>
        {[-1, 1].map((x) => (
          <mesh key={x} position={[x * 1.0, (DESK_TOP - 0.08) / 2, 0]}>
            <boxGeometry args={[0.08, DESK_TOP - 0.08, 1.3]} />
            <meshStandardMaterial color="#8c6a4a" />
          </mesh>
        ))}
        <mesh position={[0.15, DESK_TOP + 0.003, 0.05]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[0.95, 1.3]} />
          <meshStandardMaterial map={paper} />
        </mesh>
      </group>
      {imprint > 0 && (
        <mesh position={IMPRINT} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.4, 0.4]} />
          <meshBasicMaterial map={seal} transparent opacity={imprint} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
};

// 도장: 원점 = 도장 바닥 가운데
const Stamp: React.FC<{ pos: THREE.Vector3; rz?: number }> = ({ pos, rz = 0 }) => (
  <group position={pos} rotation={[0, 0, rz]}>
    <mesh position={[0, 0.06, 0]} castShadow>
      <cylinderGeometry args={[0.21, 0.21, 0.12, 28]} />
      <meshStandardMaterial color="#e9dfcf" />
    </mesh>
    <mesh position={[0, 0.005, 0]}>
      <cylinderGeometry args={[0.2, 0.2, 0.01, 28]} />
      <meshStandardMaterial color="#c4161c" />
    </mesh>
    <mesh position={[0, 0.45, 0]} castShadow>
      <cylinderGeometry args={[0.15, 0.19, 0.66, 24]} />
      <meshStandardMaterial color="#8a5a34" roughness={0.5} />
    </mesh>
    <mesh position={[0, 0.86, 0]} castShadow>
      <sphereGeometry args={[0.17, 20, 14]} />
      <meshStandardMaterial color="#8a5a34" roughness={0.5} />
    </mesh>
  </group>
);

// ---------- 배경 ----------
const TOWERS: { pos: [number, number, number]; dong: string; floors: number }[] = [
  { pos: [-9, 0, -11], dong: "101", floors: 15 },
  { pos: [3, 0, -13], dong: "102", floors: 17 },
  { pos: [15, 0, -10], dong: "103", floors: 13 },
  { pos: [-17, 0, -5], dong: "104", floors: 12 },
];
const TREES: [number, number][] = [
  [-2.6, 2.6], [2.8, 3.2], [-5.5, 1.5], [5.6, 4.2], [-7, -3], [12.5, 3], [12, -4.5], [-9, 3.5], [6.2, -4.5], [-4.8, -5.5], [10.5, 6.5], [-11, -1],
];

export type State02 = ReturnType<typeof state02>;
export const state02 = (mode: Mode02, t: number) => {
  const i = (m: Mode02) => mode === m;
  const after = (m: Mode02) => ORDER02.indexOf(mode) > ORDER02.indexOf(m);
  const ease = Easing.inOut(Easing.cubic);
  const write = i("pen") ? 0 : i("red") ? interpolate(t, [0.05, 1], [0, 0.55], clamp) : i("curse") ? interpolate(t, [0, 0.45], [0.55, 1], { ...clamp, easing: Easing.out(Easing.quad) }) : 1;
  const dark = i("dark") ? interpolate(t, [0.1, 0.7], [0, 1], clamp) : i("banners") || i("tablets") || i("bleed") ? 1 : i("light") ? interpolate(t, [0, 0.5], [1, 0], clamp) : 0;
  const bleed = i("bleed") ? interpolate(t, [0.05, 0.95], [0, 1], clamp) : after("bleed") ? 1 : 0;
  const rise = i("banners") ? interpolate(t, [0, 0.85], [0, 1], clamp) : i("light") ? interpolate(t, [0, 0.6], [1, 0], { ...clamp, easing: ease }) : after("light") ? 0 : after("banners") ? 1 : 0;
  const stop = i("curse") ? interpolate(t, [0.45, 0.7], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) }) : i("dark") ? interpolate(t, [0, 0.4], [1, 0], clamp) : 0;
  // 도장: 위에서 쾅 → 잠깐 눌렀다가 들어 올림
  const SLAM = 0.2;
  const stampY = i("stamp")
    ? t < SLAM
      ? interpolate(t, [0, SLAM], [2.3, DESK_TOP], { ...clamp, easing: Easing.in(Easing.cubic) })
      : interpolate(t, [0.5, 0.8], [DESK_TOP, 1.3], { ...clamp, easing: ease })
    : after("stamp")
      ? 1.3
      : 2.3;
  const imprint = i("stamp") ? (t >= SLAM ? 1 : 0) : after("stamp") ? 1 : 0;
  const fly = i("end") ? interpolate(t, [0, 0.45], [0, 1], { ...clamp, easing: ease }) : 0;
  const q = i("end") ? interpolate(t, [0.45, 0.65], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) }) : 0;
  return { write, dark, bleed, rise, stop, stampY, imprint, fly, q, slamAt: SLAM };
};

const Scene: React.FC<{ mode: Mode02; t: number; words: Words02 }> = ({ mode, t, words }) => {
  const s = state02(mode, t);
  const stopT = useMemo(() => bubbleTex(words.stop), [words.stop]);
  const q = useMemo(() => qTex(), []);
  // 펜 위치
  const bob = Math.sin(t * Math.PI * 2) * 0.03;
  const writing = mode === "red" || (mode === "curse" && t < 0.45);
  const wy = NAME_TOP - 0.15 - (NAME_H - 0.3) * s.write;
  const penRest = new THREE.Vector3(0.95, 2.35, 0.55);
  const penWrite = new THREE.Vector3(Math.sin(t * 40) * 0.12, wy, 0.07);
  const penHover = new THREE.Vector3(0, NAME_TOP - 0.05 + bob, 0.1);
  const penEnd = new THREE.Vector3(3.75, 1.35, 1.5);
  let pen = mode === "pen" ? penHover : writing ? penWrite : penRest;
  if (mode === "curse" && t >= 0.45) pen = penWrite.clone().lerp(penRest, interpolate(t, [0.45, 0.7], [0, 1], clamp));
  if (mode === "end") pen = penRest.clone().lerp(penEnd, s.fly);
  const tilt = mode === "end" ? -0.35 * (1 - s.fly) : -0.35;
  const drop = mode === "pen" ? interpolate(t, [0.25, 0.9], [0, 1], clamp) : 0;
  // 도장 위치
  const stampHome = new THREE.Vector3(IMPRINT.x, s.stampY, IMPRINT.z);
  const stampEnd = new THREE.Vector3(5.25, 1.15, 1.5);
  const stamp = mode === "end" ? new THREE.Vector3(IMPRINT.x, 1.3, IMPRINT.z).lerp(stampEnd, s.fly) : stampHome;

  const sun = 2.4 * (1 - 0.65 * s.dark);
  return (
    <>
      <Rig mode={mode} t={t} />
      <hemisphereLight args={[new THREE.Color("#fff1e0").lerp(new THREE.Color("#6a5a7a"), s.dark), "#d9c6ab", 1.1 * (1 - 0.5 * s.dark)]} />
      <directionalLight position={[14, 20, 9]} intensity={sun} color="#ffe1c2" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={22} shadow-camera-bottom={-22} shadow-camera-far={90} />
      <directionalLight position={[3, 5, 14]} intensity={1.3 * (1 - 0.5 * s.dark)} color="#ffe6c8" />
      <ambientLight intensity={0.25} />
      {s.dark > 0 && <pointLight position={[0, 2.2, 1.6]} color="#ff3a2a" intensity={3 * s.dark * (0.6 + 0.4 * s.bleed)} distance={6} />}
      <Ground />
      {TOWERS.map((o) => (
        <Tower key={o.dong} pos={o.pos} dong={o.dong} floors={o.floors} />
      ))}
      {TREES.map((p, k) => (
        <Tree key={k} p={p} s={0.8 + ((k * 7) % 5) * 0.08} />
      ))}

      <NameBoard write={s.write} bleed={s.bleed} />
      <Pen pos={pen} tilt={tilt} drop={drop} />
      <Person p={[2.1, 0, 0.9]} coat="#4a6a8a" s={0.62} ry={-0.9} />
      <Sprite tex={stopT} s={s.stop} pos={[2.2, 1.9, 1.3]} size={[1.4, 0.87]} ry={-0.1} />

      <Banners rise={s.rise} />
      <Tablets candle={s.dark} />

      <Bank word={words.bank} />
      <Desk word={words.contract} imprint={s.imprint} />
      <Stamp pos={stamp} />
      <Person p={[7.7, 0, 0.55]} coat="#6f7d5c" s={0.62} ry={0.2} />
      <Person p={[8.3, 0, 2.85]} coat="#c86b5a" s={0.62} ry={Math.PI - 0.2} />
      <Person p={[10.3, 0, 2.2]} coat="#8c5a8a" s={0.6} ry={-1.2} />

      <Sprite tex={q} s={s.q} pos={[4.5, 2.55, 1.5]} size={[0.7, 0.7]} ry={0} rz={-0.1} />
    </>
  );
};

const sky = (dark: boolean) => (dark ? "linear-gradient(#2a1a2a 0%, #4a2a33 45%, #6a3a3a 80%)" : "linear-gradient(#f3b98f 0%, #f8d7bd 40%, #fbeadb 75%)");

export const Scene02: React.FC<{ mode: Mode02; t: number; words: Words02 }> = ({ mode, t, words }) => {
  const { width, height } = useVideoConfig();
  const { dark } = state02(mode, t);
  return (
    <AbsoluteFill style={{ background: sky(false) }}>
      <AbsoluteFill style={{ background: sky(true), opacity: dark }} />
      <ThreeCanvas width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }} camera={{ fov: 34, near: 0.2, far: 200 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}>
        <Scene mode={mode} t={t} words={words} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
