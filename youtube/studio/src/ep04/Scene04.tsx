// EP04 "한국 커플이 피하는 것 3가지" (1분 편) 모형 세상
//  거리(신발 선물) → 치킨집(닭 날개) → 가을 덕수궁 돌담길(옛 가정법원)
import { useMemo } from "react";
import { Easing, interpolate } from "remotion";
import * as THREE from "three";
import { Character, Prop } from "../three/kenney";

const CS = 1.35; // Kenney 사람 배율
import { canvasTex, clamp, rng } from "../three/kit";
import { Box, glyphTex, K, Key, MiniFrame, MiniLights, PEN_KO, qTex, Rig, SKY, Slab, Sprite } from "../three/mini";

export type Mode04 = "intro" | "shoes" | "walk" | "away" | "coin" | "chicken" | "fly" | "plate" | "wall" | "split" | "court" | "gone" | "end";
export const ORDER04: Mode04[] = ["intro", "shoes", "walk", "away", "coin", "chicken", "fly", "plate", "wall", "split", "court", "gone", "end"];
export type Words04 = { lang: "en" | "es"; court: string };

const ease = Easing.inOut(Easing.cubic);
const pop = Easing.out(Easing.back(1.6));
const r01 = (t: number, a: number, b: number, e = ease) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: e });

const STREET: [number, number] = [0, 0];
const SHOP: [number, number] = [-18, -10];
const WALL: [number, number] = [18, -12];

const paths = (lang: "en" | "es"): Record<Mode04, Key[]> => {
  const [wx, wz] = WALL;
  const [cx, cz] = SHOP;
  return {
    intro: [lang === "es" ? K(-2.8, 2.6, 8.2, 0, 1.5, 0.6) : K(2.8, 2.6, 8.2, 0, 1.5, 0.6), K(1.4, 2.3, 6.8, 0, 1.6, 0.6)],
    shoes: [K(1.4, 2.3, 6.8, 0, 1.6, 0.6), K(0.4, 1.6, 4.4, -0.25, 0.65, 1.1)],
    walk: [K(0.4, 1.6, 4.4, -0.25, 0.65, 1.1), K(1.9, 0.95, 3.0, 1.3, 0.15, 0.9)],
    away: [K(0.6, 2.1, 6.6, 0.4, 0.6, 1.0), K(1.4, 2.1, 6.8, 1.2, 0.6, 1.1), K(-0.3, 1.9, 5.4, -0.6, 0.75, 1.0)],
    coin: [K(-0.2, 2.0, 6.4, -0.2, 0.75, 1.0), K(-0.1, 1.8, 5.8, -0.2, 0.75, 1.0)],
    chicken: [K(cx - 0.6, 2.6, cz + 6.4, cx - 0.6, 0.75, cz - 0.8), K(cx + 0.2, 2.0, cz + 4.4, cx, 0.6, cz)],
    fly: [K(cx + 0.2, 2.0, cz + 4.4, cx, 0.6, cz), K(cx - 0.2, 2.4, cz + 5.6, cx - 0.2, 1.5, cz - 0.8)],
    plate: [K(cx + 0.7, 1.9, cz + 3.6, cx - 0.1, 0.6, cz), K(cx - 0.6, 1.8, cz + 3.4, cx - 0.15, 0.6, cz)],
    wall: [K(wx + 4, 3.0, wz + 8.5, wx, 0.9, wz + 0.8), K(wx + 2.0, 2.2, wz + 7.0, wx - 0.3, 0.7, wz + 1.1)],
    split: [K(wx + 1.4, 2.0, wz + 6.2, wx - 0.5, 0.6, wz + 1.2), K(wx + 0.4, 2.4, wz + 7.6, wx - 0.5, 0.6, wz + 1.2)],
    court: [K(wx - 1.2, 3.6, wz + 10.0, wx - 2.6, 1.5, wz - 0.6), K(wx - 2.0, 3.3, wz + 9.0, wx - 3.0, 1.5, wz - 0.6)],
    gone: [K(wx - 2.0, 3.3, wz + 9.0, wx - 3.0, 1.5, wz - 0.6), K(wx + 0.4, 2.4, wz + 6.6, wx - 0.6, 0.8, wz + 1.2)],
    end: [K(wx + 0.4, 2.4, wz + 6.6, wx - 0.6, 0.8, wz + 1.2), K(wx + 0.9, 1.6, wz + 4.0, wx - 0.6, 0.75, wz + 1.2)],
  };
};

// ---------- 소품 ----------
/** 운동화 한 짝: 원점 = 바닥 가운데, 앞이 +x */
const Sneaker: React.FC<{ p: [number, number, number]; ry?: number; s?: number; c?: string }> = ({ p, ry = 0, s = 1, c = "#ffffff" }) => (
  <group position={p} rotation={[0, ry, 0]} scale={s}>
    <Box p={[0, 0.02, 0]} s={[0.3, 0.04, 0.12]} c="#e9e4da" />
    <Box p={[-0.03, 0.07, 0]} s={[0.22, 0.08, 0.11]} c={c} />
    <Box p={[0.1, 0.055, 0]} s={[0.1, 0.05, 0.1]} c={c} />
    <Box p={[-0.03, 0.075, 0.057]} s={[0.12, 0.025, 0.005]} c="#e8322b" shadow={false} />
    <Box p={[-0.03, 0.075, -0.057]} s={[0.12, 0.025, 0.005]} c="#e8322b" shadow={false} />
  </group>
);

const Pair: React.FC<{ p: [number, number, number]; ry?: number; s?: number; step?: number }> = ({ p, ry = 0, s = 1, step = 0 }) => {
  const a = Math.sin(step * Math.PI * 2);
  return (
    <group position={p} rotation={[0, ry, 0]} scale={s}>
      <Sneaker p={[0.06 * a, Math.max(0, a) * 0.05, -0.08]} />
      <Sneaker p={[-0.06 * a, Math.max(0, -a) * 0.05, 0.08]} />
    </group>
  );
};

const GiftBox: React.FC<{ p: [number, number, number]; open: number }> = ({ p, open }) => (
  <group position={p}>
    <Box p={[0, 0.12, 0]} s={[0.42, 0.24, 0.3]} c="#3d6fb6" />
    <Box p={[0, 0.12, 0]} s={[0.06, 0.245, 0.305]} c="#f2c14e" shadow={false} />
    <group position={[0, 0.26 + 0.35 * open, -0.1 * open]} rotation={[-1.1 * open, 0, 0]}>
      <Box p={[0, 0, 0]} s={[0.45, 0.05, 0.33]} c="#3d6fb6" />
      <Box p={[0, 0.005, 0]} s={[0.06, 0.055, 0.335]} c="#f2c14e" shadow={false} />
      <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.05, 0.018, 8, 16]} />
        <meshStandardMaterial color="#f2c14e" />
      </mesh>
    </group>
  </group>
);

/** 비구름: 혼자 남은 사람 위 */
const RainCloud: React.FC<{ p: [number, number, number]; s: number; t: number }> = ({ p, s, t }) => {
  const drops = useMemo(() => {
    const r = rng(4);
    return Array.from({ length: 14 }, () => ({ x: (r() - 0.5) * 0.5, z: (r() - 0.5) * 0.3, o: r() }));
  }, []);
  if (s <= 0.01) return null;
  return (
    <group position={p} scale={s}>
      {[[-0.15, 0, 0, 0.16], [0.05, 0.05, 0, 0.2], [0.22, 0, 0, 0.14]].map(([x, y, z, r], k) => (
        <mesh key={k} position={[x, y, z]}>
          <sphereGeometry args={[r, 16, 12]} />
          <meshStandardMaterial color="#8a919c" />
        </mesh>
      ))}
      {drops.map((d, k) => {
        const f = (t * 3 + d.o) % 1;
        return (
          <mesh key={k} position={[d.x, -0.1 - f * 0.6, d.z]}>
            <boxGeometry args={[0.008, 0.06, 0.008]} />
            <meshBasicMaterial color="#9fc3e8" />
          </mesh>
        );
      })}
    </group>
  );
};

const Coin: React.FC<{ p: [number, number, number]; spin: number; s?: number }> = ({ p, spin, s = 1 }) => {
  const face = useMemo(() => glyphTex("100", { bg: "#c9cbd0", fg: "#6f737a", size: 110, font: "Arial", w: 256, h: 256 }), []);
  return (
    <mesh position={p} rotation={[Math.PI / 2, spin, 0]} scale={s} castShadow>
      <cylinderGeometry args={[0.07, 0.07, 0.012, 32]} />
      <meshStandardMaterial attach="material-0" color="#b8bbc2" metalness={0.8} roughness={0.25} />
      <meshStandardMaterial attach="material-1" map={face} metalness={0.6} roughness={0.3} />
      <meshStandardMaterial attach="material-2" map={face} metalness={0.6} roughness={0.3} />
    </mesh>
  );
};

/** 닭 날개 (튀김) */
const Wing: React.FC<{ p: [number, number, number]; r?: number; s?: number }> = ({ p, r = 0, s = 1 }) => (
  <group position={p} rotation={[0, r, 0.3]} scale={s}>
    <mesh castShadow>
      <icosahedronGeometry args={[0.06, 1]} />
      <meshStandardMaterial color="#c8822e" roughness={0.8} flatShading />
    </mesh>
    <mesh position={[0.07, 0.01, 0]} scale={[1.2, 0.7, 0.8]} castShadow>
      <icosahedronGeometry args={[0.045, 1]} />
      <meshStandardMaterial color="#b9702a" roughness={0.8} flatShading />
    </mesh>
  </group>
);

/** 등에 돋는 날개 (깃털 판 두 장) */
const BackWings: React.FC<{ p: [number, number, number]; s: number; flap: number }> = ({ p, s, flap }) =>
  s <= 0.01 ? null : (
    <group position={p} scale={s}>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[sd * 0.12, 0, -0.05]} rotation={[0, sd * (0.6 + 0.5 * Math.sin(flap)), sd * 0.3]}>
          <circleGeometry args={[0.2, 20, 0, Math.PI]} />
          <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );

// ---------- 1. 거리 (신발 선물) ----------
const Street: React.FC<{ mode: Mode04; t: number }> = ({ mode, t }) => {
  const i = (m: Mode04) => mode === m;
  const paving = useMemo(
    () =>
      canvasTex(512, 512, (g) => {
        g.fillStyle = "#d9d2c5";
        g.fillRect(0, 0, 512, 512);
        g.strokeStyle = "#c7bfb0";
        g.lineWidth = 3;
        for (let k = 0; k <= 16; k++) {
          g.beginPath(); g.moveTo(k * 32, 0); g.lineTo(k * 32, 512); g.stroke();
          g.beginPath(); g.moveTo(0, k * 32 + (k % 2) * 16); g.lineTo(512, k * 32 + (k % 2) * 16); g.stroke();
        }
      }),
    [],
  );
  const cards = useMemo(() => [1, 2, 3].map((n) => glyphTex(String(n), { bg: "#fffaf0", fg: "#c8231f", size: 170, font: "Arial Black, Arial" })), []);
  const q = useMemo(() => qTex(), []);
  // 신발 상자 열기 → 걸어 나가기 → 떠나기 → (옛날) 동전
  const open = i("shoes") ? r01(t, 0.15, 0.5, pop) : i("walk") || i("coin") ? 1 : 0;
  const shoeOut = i("shoes") ? r01(t, 0.35, 0.7, pop) : 1;
  const walkX = i("walk") ? r01(t, 0.15, 1, Easing.linear) * 1.6 : 0;
  const leave = i("away") ? r01(t, 0.05, 0.55, Easing.linear) : 0;
  const rain = i("away") ? r01(t, 0.6, 0.8, pop) : 0;
  const coinT = i("coin") ? r01(t, 0.08, 0.45) : 0;
  const laugh = i("coin") ? r01(t, 0.66, 0.8, pop) : 0;
  const haha = useMemo(() => glyphTex("HAHA", { bg: "#ffffff", fg: "#e8322b", size: 90, font: "Arial Black, Arial", w: 384, h: 192 }), []);
  const card = (k: number) => (i("intro") ? r01(t, 0.1 + k * 0.18, 0.3 + k * 0.18, pop) : 0);
  return (
    <group>
      <Slab c={STREET} size={[10, 8]} top="#d9d2c5" map={paving} />
      {/* 가게들 */}
      {[[-3.2, "#f3dcc2", "#c8231f", "SHOES"], [0.2, "#e6eef3", "#2f5d8a", "CAFE"], [3.4, "#efe6d6", "#3f7d6b", "FLOWERS"]].map(([x, c, aw, label], k) => (
        <group key={k} position={[x as number, 0, -3]}>
          <Box p={[0, 1.5, 0]} s={[3.0, 3.0, 1]} c={c as string} />
          <Box p={[0, 1.2, 0.62]} s={[2.8, 0.08, 0.5]} c={aw as string} r={[0.25, 0, 0]} />
          <Box p={[0, 0.6, 0.51]} s={[2.2, 1.0, 0.02]} c="#a9cbe0" e="#dff2ff" ei={0.25} />
          <ShopSign text={label as string} y={2.4} />
        </group>
      ))}
      {/* 거리 소품: 화분, 벤치 */}
      {[-4.7, -1.7, 1.8, 4.9].map((x) => <Prop key={x} kit="furniture" name="pottedPlant" p={[x, 0, -2.2]} s={2.2} />)}
      <Prop kit="furniture" name="bench" p={[1.0, 0, -2.0]} s={2.0} />
      <Prop kit="furniture" name="bench" p={[-2.9, 0, -2.0]} s={2.0} />
      {/* 커플 */}
      {(i("intro") || i("shoes") || i("walk") || i("coin")) && (
        <>
          <Character kind="female-a" p={[-0.75, 0, 1.0]} ry={Math.PI / 2 - 0.6} s={CS} clip={i("coin") ? (t > 0.66 ? "emote-yes" : "interact-left") : "idle"} animT={t * 3} />
          <Character kind="male-a" p={[0.35, 0, 1.0]} ry={-Math.PI / 2 + 0.6} s={CS} clip={i("coin") ? (t > 0.66 ? "emote-yes" : "interact-right") : "idle"} animT={t * 3} />
        </>
      )}
      {i("intro") &&
        [0, 1, 2].map((k) => (
          <group key={k}>
            <Sprite tex={cards[k]} s={card(k)} pos={[-0.9 + k * 0.9, 2.05, 0.6]} size={[0.6, 0.6]} />
            {card(k) > 0.5 && k === 0 && <Pair p={[-0.9, 1.45, 0.6]} s={1.6} ry={0.5} />}
            {card(k) > 0.5 && k === 1 && <Drum p={[0, 1.55, 0.6]} s={3.0} r={0.4} />}
            {card(k) > 0.5 && k === 2 && <Sprite tex={q} s={1} pos={[0.9, 1.55, 0.6]} size={[0.45, 0.45]} />}
          </group>
        ))}
      {(i("shoes") || i("walk")) && <group scale={0.85} position={[-0.2, 0, 1.25]}><GiftBox p={[0, 0, 0]} open={open} /></group>}
      {i("shoes") && shoeOut > 0 && <Pair p={[-0.2, 0.25 + 0.3 * shoeOut, 1.25]} s={1.15 * shoeOut} ry={0.4} />}
      {i("coin") && <Pair p={[-0.75, 0, 1.3]} s={0.75} ry={0} />}
      {i("walk") && <Pair p={[-0.2 + walkX, 0, 1.6 - walkX * 0.5]} s={1.15} ry={-0.45} step={walkX * 2} />}
      {i("away") && (
        <>
          <Character kind="female-a" p={[-0.6, 0, 1.0]} ry={0.5} s={CS} clip="idle" animT={t * 2} headPitch={0.3 * rain} />
          <RainCloud p={[-0.6, 1.25, 1.0]} s={rain} t={t} />
          <group position={[0.4 + leave * 2.8, 0, 0.9 + leave * 0.4]}>
            <Character kind="male-a" p={[0, 0, 0]} ry={Math.PI / 2} s={CS} clip="walk" animT={t * 4} />
          </group>
        </>
      )}
      {i("coin") && coinT < 1 && <Coin p={[0.35 - 1.1 * coinT, 0.6 + 0.45 * Math.sin(coinT * Math.PI), 1.2]} spin={coinT * 12} s={4.2} />}
      {i("coin") && coinT >= 1 && <Coin p={[-0.55, 0.6, 1.25]} spin={0} s={4.2} />}
      {i("coin") && laugh > 0 && <Sprite tex={haha} s={laugh} pos={[-0.2, 1.35, 1.1]} size={[0.8, 0.4]} rz={-0.05} />}
    </group>
  );
};

const ShopSign: React.FC<{ text: string; y: number }> = ({ text, y }) => {
  const tex = useMemo(() => glyphTex(text, { bg: "#2b2b2b", fg: "#ffffff", size: 70, font: "Arial", w: 512, h: 128 }), [text]);
  return (
    <mesh position={[0, y, 0.52]}>
      <planeGeometry args={[1.6, 0.4]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
};

// ---------- 2. 치킨집 ----------
/** 후라이드 닭다리: 원점 = 가운데, 뼈가 +x */
const Drum: React.FC<{ p: [number, number, number]; r?: number; s?: number; tilt?: number }> = ({ p, r = 0, s = 1, tilt = 0 }) => (
  <group position={p} rotation={[0, r, tilt]} scale={s}>
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
      <capsuleGeometry args={[0.045, 0.05, 6, 12]} />
      <meshStandardMaterial color="#c9772a" roughness={0.95} />
    </mesh>
    <mesh position={[0.075, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.012, 0.014, 0.06, 8]} />
      <meshStandardMaterial color="#f4ecd8" />
    </mesh>
    <mesh position={[0.108, 0, 0]} castShadow>
      <sphereGeometry args={[0.018, 10, 8]} />
      <meshStandardMaterial color="#f4ecd8" />
    </mesh>
  </group>
);

/** 치킨 바구니 */
const Basket: React.FC<{ p: [number, number, number]; s?: number; n?: number }> = ({ p, s = 1, n = 6 }) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.045, 0]} castShadow>
      <cylinderGeometry args={[0.17, 0.13, 0.09, 24, 1, true]} />
      <meshStandardMaterial color="#e2c08a" side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.13, 24]} />
      <meshStandardMaterial color="#e2c08a" />
    </mesh>
    <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.16, 24]} />
      <meshStandardMaterial color="#f7f2e6" />
    </mesh>
    {Array.from({ length: n }, (_, k) => {
      const a = (k / n) * Math.PI * 2;
      return <Drum key={k} p={[Math.cos(a) * 0.07, 0.11 + (k % 2) * 0.03, Math.sin(a) * 0.07]} r={-a} tilt={0.35} />;
    })}
  </group>
);

const Plate: React.FC<{ p: [number, number, number] }> = ({ p }) => (
  <group position={p}>
    <mesh position={[0, 0.008, 0]} receiveShadow castShadow>
      <cylinderGeometry args={[0.12, 0.09, 0.016, 28]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  </group>
);

/** 가구 모델은 원점이 모서리라서, 가운데 기준으로 놓는 포장 */
const FURN: Record<string, [number, number]> = { table: [0.841, 0.447], chair: [0.2, 0.2], kitchenFridgeSmall: [0.43, 0.282] };
const Furn: React.FC<{ name: string; p: [number, number, number]; ry?: number; s: number }> = ({ name, p, ry = 0, s }) => {
  const [w, d] = FURN[name];
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Prop kit="furniture" name={name} p={[(-w / 2) * s, 0, (d / 2) * s]} s={s} />
    </group>
  );
};

const ChickenShop: React.FC<{ mode: Mode04; t: number }> = ({ mode, t }) => {
  const i = (m: Mode04) => mode === m;
  const [cx, cz] = SHOP;
  const F = 1.53; // 가구 배율: 앉은 사람 가슴 높이에 식탁 윗면
  const SEAT = 0.32; // 의자 앉는 면 높이 (sit 동작은 엉덩이가 원점)
  const TOP = 0.327 * F; // 식탁 윗면 높이
  const sign = useMemo(() => glyphTex("CHICKEN", { bg: "#f2c14e", fg: "#7a2a10", size: 76, font: "Arial Black, Arial", w: 512, h: 128 }), []);
  const menu = useMemo(
    () =>
      canvasTex(512, 384, (g) => {
        g.fillStyle = "#2f3a33"; g.fillRect(0, 0, 512, 384);
        g.strokeStyle = "#c9a76a"; g.lineWidth = 12; g.strokeRect(6, 6, 500, 372);
        g.fillStyle = "#fff6dc"; g.textBaseline = "middle";
        g.font = `64px ${PEN_KO}`; g.textAlign = "center"; g.fillText("메뉴", 256, 62);
        g.font = `52px ${PEN_KO}`; g.textAlign = "left";
        [["후라이드", "18,000"], ["양념", "19,000"], ["반반", "19,000"], ["치맥 세트", "23,000"]].forEach(([a, b], k) => {
          g.fillText(a, 46, 140 + k * 62); g.textAlign = "right"; g.fillText(b, 470, 140 + k * 62); g.textAlign = "left";
        });
      }),
    [],
  );
  const tiles = useMemo(
    () =>
      canvasTex(512, 512, (g) => {
        g.fillStyle = "#d7b48a"; g.fillRect(0, 0, 512, 512);
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
          g.fillStyle = (x + y) % 2 ? "#cfa97c" : "#dcbb93"; g.fillRect(x * 64 + 1, y * 64 + 1, 62, 62);
        }
      }),
    [],
  );
  const give = i("fly") ? r01(t, 0.05, 0.3) : 0;
  const sprout = i("fly") ? r01(t, 0.3, 0.5, pop) : 0;
  const rise = i("fly") ? r01(t, 0.5, 1, Easing.in(Easing.quad)) : 0;
  const sx = 0.86; // 뒤 손님 식탁 의자
  const ux = 0.56; // 우리 식탁: 세로로 놓고 좌우에 마주 앉기 // 의자 위치(식탁 가운데에서 좌우)
  return (
    <group>
      <Slab c={SHOP} size={[7, 6]} top="#d7b48a" map={tiles} />
      {/* 뒷벽: 아래는 나무 판, 위는 크림색 */}
      <Box p={[cx, 1.6, cz - 2.6]} s={[7, 3.2, 0.15]} c="#f6ead2" />
      <Box p={[cx, 0.45, cz - 2.5]} s={[7, 0.9, 0.04]} c="#a8714a" />
      <Box p={[cx, 0.92, cz - 2.48]} s={[7, 0.05, 0.06]} c="#7d5236" />
      <mesh position={[cx - 1.0, 2.55, cz - 2.5]}>
        <planeGeometry args={[2.0, 0.5]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
      <mesh position={[cx + 1.35, 1.75, cz - 2.5]}>
        <planeGeometry args={[1.3, 0.975]} />
        <meshStandardMaterial map={menu} />
      </mesh>
      {/* 벽등 */}
      {[-2.2, -0.2, 2.4].map((x) => (
        <group key={x} position={[cx + x, 1.45, cz - 2.48]}>
          <Box p={[0, 0, 0.05]} s={[0.12, 0.2, 0.1]} c="#3b3532" />
          <mesh position={[0, 0.02, 0.12]}><sphereGeometry args={[0.07, 12, 10]} /><meshStandardMaterial color="#ffe3a3" emissive="#ffcf6b" emissiveIntensity={0.9} /></mesh>
        </group>
      ))}
      {/* 음료 냉장고, 화분 */}
      <Furn name="kitchenFridgeSmall" p={[cx + 2.8, 0, cz - 2.2]} s={2.0} />
      <Prop kit="furniture" name="pottedPlant" p={[cx - 3.0, 0, cz - 2.1]} s={1.8} />
      {/* 뒤쪽 손님 테이블 */}
      <group position={[cx - 2.0, 0, cz - 1.9]}>
        <Furn name="table" p={[0, 0, 0]} s={F} />
        <Furn name="chair" p={[-sx, 0, 0]} ry={Math.PI / 2} s={F} />
        <Furn name="chair" p={[sx, 0, 0]} ry={-Math.PI / 2} s={F} />
        <Character kind="male-c" p={[-sx, SEAT, 0]} ry={Math.PI / 2 - 0.7} s={CS} clip="sit" animT={0.2} />
        {!(i("fly") && rise > 0.3) && <Character kind="female-b" p={[sx, SEAT, 0]} ry={-Math.PI / 2 + 0.7} s={CS} clip="sit" animT={0.2} headYaw={0.4} />}
        <Basket p={[0, TOP, 0]} s={0.9} />
        <Prop kit="food" name="soda-bottle" p={[0.18, TOP, -0.1]} s={0.3} />
      </group>
      {/* 우리 커플 식탁 */}
      <Furn name="table" p={[cx, 0, cz]} ry={Math.PI / 2} s={F} />
      <Furn name="chair" p={[cx - ux, 0, cz + 0.1]} ry={Math.PI / 2} s={F} />
      <Furn name="chair" p={[cx + ux, 0, cz + 0.1]} ry={-Math.PI / 2} s={F} />
      <Basket p={[cx, TOP, cz - 0.3]} s={1.1} n={i("plate") ? 4 : 6} />
      <Plate p={[cx - 0.18, TOP, cz + 0.12]} />
      <Plate p={[cx + 0.18, TOP, cz + 0.12]} />
      <Prop kit="food" name="soda-bottle" p={[cx + 0.05, TOP, cz - 0.6]} s={0.3} />
      {/* 닭다리 하나가 건네짐 → 받은 사람이 날아감 */}
      {i("fly") && give < 1 && <Drum p={[cx - 0.18 + 0.36 * give, TOP + 0.05 + 0.3 * Math.sin(give * Math.PI), cz + 0.12]} s={1.6} r={give * 6} />}
      {i("fly") && give >= 1 && rise < 0.05 && <Drum p={[cx + 0.18, TOP + 0.05, cz + 0.12]} s={1.6} />}
      {/* 접시 위로 하나씩 조용히 옮겨짐 */}
      {i("plate") && [0, 1].map((k) => {
        const sl = r01(t, 0.15 + k * 0.3, 0.45 + k * 0.3);
        return <Drum key={k} p={[cx - 0.18 * sl + (k ? 0.03 : -0.03), TOP + 0.13 - 0.08 * sl + 0.15 * Math.sin(sl * Math.PI), cz - 0.3 + 0.42 * sl]} s={1.5} r={k} />;
      })}
      {/* 사람 */}
      <Character kind="female-a" p={[cx - ux, SEAT, cz + 0.1]} ry={Math.PI / 2 - 0.7} s={CS} clip="sit" animT={0.2} headYaw={i("plate") ? -0.25 * r01(t, 0.6, 0.8) : 0} />
      <group position={[cx + ux, SEAT + 1.5 * rise, cz + 0.1 - 0.5 * rise]} rotation={[0, 0, -0.25 * rise]}>
        <Character kind="male-a" p={[0, 0, 0]} ry={-Math.PI / 2 + 0.7} s={CS} clip={rise > 0.05 ? "jump" : "sit"} animT={rise > 0.05 ? t * 2 : 0.2} />
        <BackWings p={[0.08, 0.6, 0]} s={1.8 * sprout} flap={t * 30} />
      </group>
      {i("fly") && rise > 0.3 && (
        <group position={[cx - 2.0 + sx, SEAT + 1.5 * rise, cz - 1.9 - 0.3 * rise]}>
          <Character kind="female-b" p={[0, 0, 0]} ry={-Math.PI / 2} s={CS} clip="jump" animT={t * 2} />
          <BackWings p={[0.08, 0.6, 0]} s={1.8} flap={t * 30 + 1} />
        </group>
      )}
    </group>
  );
};

// ---------- 3. 덕수궁 돌담길 ----------
const StoneWall: React.FC<{ mode: Mode04; t: number; court: string }> = ({ mode, t, court }) => {
  const i = (m: Mode04) => mode === m;
  const [wx, wz] = WALL;
  const stones = useMemo(
    () =>
      canvasTex(512, 128, (g) => {
        g.fillStyle = "#b9ae9c";
        g.fillRect(0, 0, 512, 128);
        const r = rng(9);
        for (let y = 0; y < 128; y += 26)
          for (let x = -(y % 52); x < 512; x += 46) {
            const sh = 160 + Math.floor(r() * 50);
            g.fillStyle = `rgb(${sh},${sh - 8},${sh - 22})`;
            g.fillRect(x + 2, y + 2, 42, 22);
          }
      }),
    [],
  );
  const courtSign = useMemo(() => glyphTex(court, { bg: "#3b3e44", fg: "#ffffff", size: 54, font: "Arial", w: 512, h: 110 }), [court]);
  const q = useMemo(() => qTex(), []);
  const leaves = useMemo(() => {
    const r = rng(21);
    return Array.from({ length: 40 }, () => ({ x: (r() - 0.5) * 9, z: (r() - 0.5) * 3, o: r(), s: 0.5 + r() * 0.5 }));
  }, []);
  // 갈라짐: 커플이 양쪽으로 멀어짐
  const apart = i("split") ? r01(t, 0.35, 0.85) : 0;
  const courtIn = i("court") ? r01(t, 0.05, 0.35) : i("gone") ? 1 - r01(t, 0.1, 0.5) : 0;
  const hold = i("end") ? r01(t, 0.1, 0.4) : 0;
  const qS = i("end") ? r01(t, 0.6, 0.8, pop) : 0;
  const walk = (k: number) => ((t * 0.5 + k * 0.33) % 1) * 4.4 - 2.2;
  return (
    <group>
      <Slab c={WALL} size={[12, 8]} top="#cbbf9f" side="#7d6a52" />
      {/* 길 */}
      <mesh position={[wx, 0.03, wz + 1.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 1.8]} />
        <meshStandardMaterial color="#d8cdb8" />
      </mesh>
      {/* 돌담 + 기와 */}
      <group position={[wx, 0, wz]}>
        <Box p={[0, 0.8, 0]} s={[12, 1.6, 0.5]} c="#b9ae9c" />
        <mesh position={[0, 0.8, 0.26]}>
          <planeGeometry args={[12, 1.6]} />
          <meshStandardMaterial map={stones} />
        </mesh>
        <Box p={[0, 1.7, 0]} s={[12.2, 0.18, 0.75]} c="#4b4f56" r={[0, 0, 0]} />
        <Box p={[0, 1.83, 0]} s={[12.2, 0.12, 0.3]} c="#3b3e44" />
        {/* 담 너머 궁궐 지붕 */}
        <Box p={[1.5, 2.6, -2.0]} s={[4, 0.25, 2.2]} c="#4b4f56" />
        <Box p={[1.5, 1.9, -2.0]} s={[3.4, 1.2, 1.6]} c="#a33c2c" />
      </group>
      {/* 은행나무 */}
      {/* 은행나무: 담과 길 사이 (카메라를 가리지 않게) */}
      {[-5.8, 1.0, 3.4, 5.6].map((x, k) => (
        <group key={k} position={[wx + x, 0, wz + 0.55]}>
          <mesh position={[0, 0.8, 0]} castShadow><cylinderGeometry args={[0.06, 0.09, 1.6, 8]} /><meshStandardMaterial color="#6b4a32" /></mesh>
          <mesh position={[0, 2.1, 0]} castShadow><icosahedronGeometry args={[0.6, 1]} /><meshStandardMaterial color="#f2c43a" flatShading /></mesh>
        </group>
      ))}
      {/* 떨어지는 은행잎 */}
      {leaves.map((l, k) => {
        const f = (t * 0.8 + l.o) % 1;
        return (
          <mesh key={k} position={[wx + l.x + Math.sin(f * 6 + k) * 0.2, 2.6 - f * 2.6, wz + 2.0 + l.z]} rotation={[f * 6, k, f * 4]}>
            <circleGeometry args={[0.045 * l.s, 6]} />
            <meshStandardMaterial color="#f5c83a" side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      {/* 옛 가정법원 (나타났다 사라짐) */}
      {courtIn > 0.01 && (
        <group position={[wx - 3.4, 0, wz - 2.6]}>
          <Box p={[0, 1.7, 0]} s={[3.2, 3.4, 1.6]} c="#b9b2a4" opacity={courtIn} />
          <Box p={[0, 3.5, 0.05]} s={[3.6, 0.22, 1.9]} c="#4b4f56" opacity={courtIn} />
          {[-1.05, -0.35, 0.35, 1.05].map((x) => <Box key={"w" + x} p={[x, 2.75, 0.81]} s={[0.4, 0.5, 0.02]} c="#5d7a92" opacity={courtIn} />)}
          {[-1.1, -0.37, 0.37, 1.1].map((x) => <Box key={x} p={[x, 1.2, 0.85]} s={[0.18, 2.4, 0.18]} c="#e3ded3" opacity={courtIn} />)}
          <mesh position={[0, 2.2, 0.95]}>
            <planeGeometry args={[2.2, 0.48]} />
            <meshBasicMaterial map={courtSign} transparent opacity={courtIn} toneMapped={false} />
          </mesh>
        </group>
      )}
      {/* 걷는 커플들 */}
      {(i("wall") || i("court") || i("gone")) &&
        [0, 1, 2].map((k) => (
          <group key={k} position={[wx + walk(k), 0, wz + 1.0 + (k % 2) * 0.5]}>
            <Character kind={(["female-b", "female-d", "female-e"] as const)[k]} p={[0, 0, -0.14]} ry={Math.PI / 2} s={CS} clip="walk" animT={t * 4 + k * 0.3} />
            <Character kind={(["male-b", "male-d", "male-e"] as const)[k]} p={[0, 0, 0.14]} ry={Math.PI / 2} s={CS} clip="walk" animT={t * 4 + k * 0.3 + 0.2} />
          </group>
        ))}
      {i("split") && (
        <group position={[wx - 0.5, 0, wz + 1.2]}>
          <Character kind="female-a" p={[-0.15 - 0.85 * apart, 0, 0]} ry={Math.PI / 2 + (apart > 0.05 ? Math.PI : 0)} s={CS} clip={apart > 0.05 ? "walk" : "idle"} animT={t * 4} />
          <Character kind="male-a" p={[0.15 + 0.85 * apart, 0, 0]} ry={Math.PI / 2} s={CS} clip={apart > 0.05 ? "walk" : "idle"} animT={t * 4} />
        </group>
      )}
      {i("end") && (
        <group position={[wx - 0.6, 0, wz + 1.2]}>
          <Character kind="female-a" p={[-0.2 + 0.04 * hold, 0, 0]} ry={0.3} s={CS} clip="idle" animT={t * 2} headYaw={-0.3 * hold} />
          <Character kind="male-a" p={[0.2 - 0.04 * hold, 0, 0]} ry={-0.3} s={CS} clip="idle" animT={t * 2} headYaw={0.3 * hold} />
          {hold > 0.5 && (
            <mesh position={[0, 0.42, 0.05]}>
              <sphereGeometry args={[0.035, 10, 8]} />
              <meshStandardMaterial color="#f0c9a6" />
            </mesh>
          )}
        </group>
      )}
      <Sprite tex={q} s={qS} pos={[wx - 0.6, 1.25, wz + 1.2]} size={[0.32, 0.32]} rz={-0.1} />
    </group>
  );
};

export const Scene04: React.FC<{ mode: Mode04; t: number; words: Words04 }> = ({ mode, t, words }) => {
  const P = useMemo(() => paths(words.lang), [words.lang]);
  const street = ["intro", "shoes", "walk", "away", "coin"].includes(mode);
  const shop = ["chicken", "fly", "plate"].includes(mode);
  const wall = ["wall", "split", "court", "gone", "end"].includes(mode);
  const autumn = wall;
  return (
    <MiniFrame sky={autumn ? SKY.dusk : SKY.day} filter={mode === "coin" ? `sepia(${(0.55 * (1 - interpolate(t, [0.55, 0.65], [0, 1], clamp))).toFixed(3)})` : ""}>
      <Rig paths={P} mode={mode} t={t} />
      <MiniLights dusk={autumn ? 0.35 : 0} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color={autumn ? "#c9b98a" : "#c9d6a8"} />
      </mesh>
      {street && <Street mode={mode} t={t} />}
      {shop && <ChickenShop mode={mode} t={t} />}
      {wall && <StoneWall mode={mode} t={t} court={words.court} />}
    </MiniFrame>
  );
};
