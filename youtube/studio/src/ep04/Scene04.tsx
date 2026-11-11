// EP04 "한국 커플이 피하는 것 3가지" (1분 편) 모형 세상
//  거리(신발 선물) → 치킨집(닭 날개) → 가을 덕수궁 돌담길(옛 가정법원)
import { useMemo } from "react";
import { Easing, interpolate } from "remotion";
import * as THREE from "three";
import { Person } from "../three/World";
import { canvasTex, clamp, rng } from "../three/kit";
import { Box, glyphTex, K, Key, MiniFrame, MiniLights, qTex, Rig, SKY, Slab, Sprite } from "../three/mini";

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
    shoes: [K(1.4, 2.3, 6.8, 0, 1.6, 0.6), K(0.6, 1.3, 3.2, -0.3, 0.55, 1.0)],
    walk: [K(0.6, 1.3, 3.2, -0.3, 0.55, 1.0), K(1.6, 1.0, 3.8, 0.8, 0.3, 1.2)],
    away: [K(0.2, 2.0, 6.0, 0.4, 0.75, 0.9), K(1.8, 2.0, 6.2, 2.2, 0.75, 1.1), K(-0.4, 1.9, 5.2, -0.6, 0.85, 1.0)],
    coin: [K(0.0, 1.5, 4.4, -0.2, 0.8, 1.0), K(0.3, 1.35, 3.6, -0.2, 0.8, 1.0)],
    chicken: [K(cx + 2.8, 2.6, cz + 4.4, cx, 0.8, cz), K(cx + 1.6, 1.9, cz + 3.0, cx, 0.8, cz)],
    fly: [K(cx + 1.6, 1.9, cz + 3.0, cx, 0.8, cz), K(cx + 2.2, 2.6, cz + 4.6, cx + 0.4, 1.6, cz - 0.5)],
    plate: [K(cx + 1.4, 1.6, cz + 2.0, cx, 0.7, cz + 0.1), K(cx - 1.2, 1.5, cz + 2.0, cx, 0.7, cz + 0.1)],
    wall: [K(wx + 6, 3.4, wz + 7, wx, 1.0, wz), K(wx + 3.5, 2.4, wz + 5.5, wx - 0.5, 1.0, wz)],
    split: [K(wx + 3.5, 2.4, wz + 5.5, wx - 0.5, 1.0, wz), K(wx + 1.5, 2.0, wz + 4.4, wx - 0.5, 0.9, wz)],
    court: [K(wx - 1.0, 3.0, wz + 6.5, wx - 3.0, 1.6, wz - 2.5), K(wx - 2.0, 2.6, wz + 5.5, wx - 3.4, 1.5, wz - 2.5)],
    gone: [K(wx - 2.0, 2.6, wz + 5.5, wx - 3.4, 1.5, wz - 2.5), K(wx + 0.5, 2.2, wz + 5.0, wx - 1.0, 1.0, wz)],
    end: [K(wx + 0.5, 2.2, wz + 5.0, wx - 1.0, 1.0, wz), K(wx + 1.2, 1.5, wz + 3.6, wx - 0.6, 0.8, wz + 0.6)],
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
      {/* 커플 */}
      {(i("intro") || i("shoes") || i("walk") || i("coin")) && (
        <>
          <Person p={[-0.75, 0, 1.0]} coat="#c86b5a" s={0.62} ry={Math.PI / 2} />
          <Person p={[0.35, 0, 1.0]} coat="#4a6a8a" s={0.62} ry={-Math.PI / 2} />
        </>
      )}
      {i("intro") &&
        [0, 1, 2].map((k) => (
          <group key={k}>
            <Sprite tex={cards[k]} s={card(k)} pos={[-0.9 + k * 0.9, 2.05, 0.6]} size={[0.6, 0.6]} />
            {card(k) > 0.5 && k === 0 && <Pair p={[-0.9, 1.45, 0.6]} s={1.6} ry={0.5} />}
            {card(k) > 0.5 && k === 1 && <Wing p={[0, 1.55, 0.6]} s={3.2} />}
            {card(k) > 0.5 && k === 2 && <Sprite tex={q} s={1} pos={[0.9, 1.55, 0.6]} size={[0.45, 0.45]} />}
          </group>
        ))}
      {(i("shoes") || i("walk")) && <group scale={1.5} position={[-0.2, 0, 1.25]}><GiftBox p={[0, 0, 0]} open={open} /></group>}
      {i("shoes") && shoeOut > 0 && <Pair p={[-0.2, 0.1 + 0.45 * shoeOut, 1.25]} s={2.2 * shoeOut} ry={0.4} />}
      {i("coin") && <Pair p={[-0.75, 0, 1.25]} s={1.1} ry={0} />}
      {i("walk") && <Pair p={[-0.2 + walkX, 0, 1.6 - walkX * 0.5]} s={2.2} ry={-0.45} step={walkX * 2} />}
      {i("away") && (
        <>
          <Person p={[-0.6, 0, 1.0]} coat="#c86b5a" s={0.62} ry={Math.PI / 2} />
          <RainCloud p={[-0.6, 1.25, 1.0]} s={rain} t={t} />
          <group position={[0.4 + leave * 2.8, 0, 0.9 + leave * 0.4]}>
            <Person p={[0, 0, 0]} coat="#4a6a8a" s={0.62} ry={0} />
            <Pair p={[0, 0, 0]} s={1.1} ry={0} step={leave * 5} />
          </group>
        </>
      )}
      {i("coin") && coinT < 1 && <Coin p={[0.35 - 1.1 * coinT, 0.6 + 0.45 * Math.sin(coinT * Math.PI), 1.2]} spin={coinT * 12} s={3.2} />}
      {i("coin") && coinT >= 1 && <Coin p={[-0.6, 0.55, 1.2]} spin={0} s={3.2} />}
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
const ChickenShop: React.FC<{ mode: Mode04; t: number }> = ({ mode, t }) => {
  const i = (m: Mode04) => mode === m;
  const [cx, cz] = SHOP;
  const sign = useMemo(() => glyphTex("CHICKEN", { bg: "#f2c14e", fg: "#7a2a10", size: 76, font: "Arial Black, Arial", w: 512, h: 128 }), []);
  const give = i("fly") ? r01(t, 0.05, 0.3) : 0;
  const sprout = i("fly") ? r01(t, 0.3, 0.5, pop) : 0;
  const rise = i("fly") ? r01(t, 0.5, 1, Easing.in(Easing.quad)) : 0;
  const slide = i("plate") ? r01(t, 0.2, 0.7) : 0;
  const TOP = 0.55;
  return (
    <group>
      <Slab c={SHOP} size={[7, 6]} top="#c9a06a" />
      <Box p={[cx, 1.5, cz - 2.6]} s={[7, 3, 0.15]} c="#f6ead2" />
      <mesh position={[cx, 2.4, cz - 2.5]}>
        <planeGeometry args={[2.2, 0.55]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
      {/* 테이블 */}
      <Box p={[cx, TOP, cz]} s={[1.4, 0.06, 0.8]} c="#b5845a" />
      {[[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]].map(([x, z], k) => <Box key={k} p={[cx + x, TOP / 2, cz + z]} s={[0.06, TOP, 0.06]} c="#8a6040" />)}
      {/* 바구니 + 치킨 */}
      <mesh position={[cx, TOP + 0.08, cz]} castShadow>
        <cylinderGeometry args={[0.22, 0.16, 0.14, 20, 1, true]} />
        <meshStandardMaterial color="#d8b07a" side={THREE.DoubleSide} />
      </mesh>
      {[[-0.08, 0.05], [0.07, -0.05], [0, 0.08], [0.09, 0.06], [-0.06, -0.07]].map(([x, z], k) => <Wing key={k} p={[cx + x, TOP + 0.15, cz + z]} r={k} s={1.1} />)}
      {/* 접시 두 개: 왼쪽 사람, 오른쪽 사람 */}
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[cx + x, TOP + 0.04, cz + 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.14, 24]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      {/* 날개 하나가 건네지거나, 접시에서 접시로 미끄러짐 */}
      {i("fly") && give < 1 && <Wing p={[cx - 0.45 + 0.9 * give, TOP + 0.08 + 0.15 * Math.sin(give * Math.PI), cz + 0.15]} s={1.2} />}
      {i("plate") && [0, 1].map((k) => {
        const sl = r01(t, 0.15 + k * 0.3, 0.45 + k * 0.3);
        return <Wing key={k} p={[cx - 0.02 + (k ? 0.08 : -0.08) - 0.45 * sl, TOP + 0.16 + 0.12 * Math.sin(sl * Math.PI), cz + 0.1 * sl]} s={2.0} r={k} />;
      })}
      {/* 사람 */}
      <Person p={[cx - 0.85, 0, cz + 0.15]} coat="#c86b5a" s={0.62} ry={Math.PI / 2} />
      <group position={[cx + 0.85, 1.6 * rise, cz + 0.15 - 0.6 * rise]} rotation={[0, 0, -0.3 * rise]}>
        <Person p={[0, 0, 0]} coat="#4a6a8a" s={0.62} ry={-Math.PI / 2} />
        <BackWings p={[0.05, 0.62, 0]} s={2.2 * sprout} flap={t * 30} />
      </group>
      {i("fly") && rise > 0.3 && (
        <group position={[cx + 1.6, 1.6 * rise + 0.1, cz - 0.6 * rise]}>
          <Person p={[0, 0, 0]} coat="#8c5a8a" s={0.62} ry={-Math.PI / 2} />
          <BackWings p={[0.05, 0.62, 0]} s={2.2} flap={t * 30 + 1} />
        </group>
      )}
      {i("plate") && <Person p={[cx + 0.85, 0, cz + 0.15]} coat="#4a6a8a" s={0.62} ry={-Math.PI / 2} />}
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
  const walk = (k: number) => ((t * 0.6 + k * 0.33) % 1) * 6 - 3;
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
          <Box p={[0, 1.4, 0]} s={[3.2, 2.8, 1.6]} c="#a7a9ad" opacity={courtIn} />
          {[-1.1, -0.37, 0.37, 1.1].map((x) => <Box key={x} p={[x, 1.1, 0.85]} s={[0.18, 2.2, 0.18]} c="#c9cbcf" opacity={courtIn} />)}
          <mesh position={[0, 2.45, 0.83]}>
            <planeGeometry args={[2.2, 0.48]} />
            <meshBasicMaterial map={courtSign} transparent opacity={courtIn} toneMapped={false} />
          </mesh>
        </group>
      )}
      {/* 걷는 커플들 */}
      {(i("wall") || i("court") || i("gone")) &&
        [0, 1, 2].map((k) => (
          <group key={k} position={[wx + walk(k), 0, wz + 1.0 + (k % 2) * 0.5]}>
            <Person p={[0, 0, -0.12]} coat={["#c86b5a", "#e0b04a", "#6f7d5c"][k]} s={0.6} ry={Math.PI / 2} />
            <Person p={[0, 0, 0.12]} coat={["#4a6a8a", "#3d4a63", "#8c5a8a"][k]} s={0.6} ry={Math.PI / 2} />
          </group>
        ))}
      {i("split") && (
        <group position={[wx - 0.5, 0, wz + 1.2]}>
          <Person p={[-0.15 - 1.4 * apart, 0, 0]} coat="#c86b5a" s={0.62} ry={Math.PI / 2 + (apart > 0.05 ? Math.PI : 0)} />
          <Person p={[0.15 + 1.4 * apart, 0, 0]} coat="#4a6a8a" s={0.62} ry={Math.PI / 2} />
        </group>
      )}
      {i("end") && (
        <group position={[wx - 0.6, 0, wz + 1.2]}>
          <Person p={[-0.16 + 0.04 * hold, 0, 0]} coat="#c86b5a" s={0.62} ry={Math.PI / 2} />
          <Person p={[0.16 - 0.04 * hold, 0, 0]} coat="#4a6a8a" s={0.62} ry={Math.PI / 2} />
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
    <MiniFrame sky={autumn ? SKY.dusk : SKY.day} filter={mode === "coin" ? `sepia(${(0.85 * (1 - interpolate(t, [0.55, 0.65], [0, 1], clamp))).toFixed(3)})` : ""}>
      <Rig paths={P} mode={mode} t={t} />
      <MiniLights dusk={autumn ? 0.6 : 0} />
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
