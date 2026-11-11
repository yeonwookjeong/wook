// EP05 "한국 나이가 줄어든 날" 모형 세상
//  신생아실(12/31 → 1/1, 풍선 1 → 2) → 거실(나이 카드 세 장) → 광장(2023 신문, 머리 위 숫자가 줄어듦) → 예외(군대 정문·편의점 술 진열대)
import { useMemo } from "react";
import { Easing, interpolate } from "remotion";
import { Person } from "../three/World";
import { canvasTex, clamp, rng } from "../three/kit";
import { Box, glyphTex, K, Key, MiniFrame, MiniLights, qTex, Rig, SKY, Slab, Sprite } from "../three/mini";

export type Mode05 = "baby" | "dec31" | "jan1" | "three" | "law" | "except" | "end";
export const ORDER05: Mode05[] = ["baby", "dec31", "jan1", "three", "law", "except", "end"];
export type Words05 = { lang: "en" | "es"; dec: string; jan: string; korean: string; year: string; intl: string; news: string; army: string; store: string };

const pop = Easing.out(Easing.back(1.6));
const ease = Easing.inOut(Easing.cubic);
const r01 = (t: number, a: number, b: number, e = ease) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: e });

const WARD: [number, number] = [0, 0];
const ROOM: [number, number] = [-16, -10];
const PLAZA: [number, number] = [16, -10];
const EXC: [number, number] = [0, -24];

const paths = (lang: "en" | "es"): Record<Mode05, Key[]> => {
  const [rx, rz] = ROOM;
  const [px, pz] = PLAZA;
  const [ex, ez] = EXC;
  return {
    baby: [lang === "es" ? K(-1.6, 1.8, 3.6, 0, 0.9, 0) : K(1.6, 1.8, 3.6, 0, 0.9, 0), K(0.8, 1.5, 2.8, 0, 0.95, 0)],
    dec31: [K(0.8, 1.5, 2.8, 0, 0.95, 0), K(-0.6, 1.7, 3.2, -0.6, 1.3, -1.2)],
    jan1: [K(-0.6, 1.7, 3.2, -0.6, 1.3, -1.2), K(1.4, 1.9, 4.2, 0, 1.0, 0)],
    three: [K(rx + 1.4, 2.0, rz + 5.0, rx, 1.35, rz), K(rx + 0.6, 1.9, rz + 4.4, rx, 1.4, rz)],
    law: [K(px + 4, 4.0, pz + 7.5, px, 1.0, pz - 0.5), K(px + 2.2, 3.0, pz + 5.6, px, 1.0, pz)],
    except: [K(ex - 3.6, 2.6, ez + 5.2, ex - 2.2, 1.0, ez), K(ex + 3.6, 2.6, ez + 5.2, ex + 2.2, 1.0, ez)],
    end: [K(ex + 3.6, 2.6, ez + 5.2, ex + 2.2, 1.0, ez), K(ex + 0.9, 1.5, ez + 3.4, ex, 1.1, ez + 1.2)],
  };
};

const numTex = (n: string, bg = "#ffffff", fg = "#c8231f") => glyphTex(n, { bg, fg, size: 150, font: "Arial Black, Arial" });

/** 풍선 (숫자) */
const Balloon: React.FC<{ p: [number, number, number]; label: string; s?: number; c?: string; bob?: number }> = ({ p, label, s = 1, c = "#ff6b8a", bob = 0 }) => {
  const tex = useMemo(() => numTex(label, "rgba(0,0,0,0)", "#ffffff"), [label]);
  return (
    <group position={[p[0], p[1] + Math.sin(bob) * 0.03, p[2]]} scale={s}>
      <mesh castShadow>
        <sphereGeometry args={[0.22, 24, 18]} />
        <meshStandardMaterial color={c} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.225]}>
        <planeGeometry args={[0.28, 0.28]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.45, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.5, 4]} />
        <meshBasicMaterial color="#888888" />
      </mesh>
    </group>
  );
};

/** 머리 위 나이 꼬리표 */
const AgeTag: React.FC<{ p: [number, number, number]; n: number; flash?: number }> = ({ p, n, flash = 0 }) => {
  const tex = useMemo(() => canvasTex(160, 110, (g) => {
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.roundRect(4, 4, 152, 102, 24);
    g.fill();
    g.fillStyle = "#1b1b1b";
    g.font = "900 78px Arial Black, Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(String(n), 80, 60);
  }), [n]);
  return (
    <mesh position={p} scale={1 + 0.25 * flash}>
      <planeGeometry args={[0.36, 0.25]} />
      <meshBasicMaterial map={tex} transparent depthTest={false} toneMapped={false} />
    </mesh>
  );
};

// ---------- 1. 신생아실 ----------
const Ward: React.FC<{ mode: Mode05; t: number; w: Words05 }> = ({ mode, t, w }) => {
  const i = (m: Mode05) => mode === m;
  const [wx, wz] = WARD;
  const dec = useMemo(() => glyphTex(w.dec, { bg: "#ffffff", fg: "#1b1b1b", size: 64, font: "Arial Black, Arial", w: 256, h: 256 }), [w.dec]);
  const jan = useMemo(() => glyphTex(w.jan, { bg: "#fffaf0", fg: "#c8231f", size: 64, font: "Arial Black, Arial", w: 256, h: 256 }), [w.jan]);
  const flip = i("jan1") ? r01(t, 0.05, 0.3) : 0;
  const two = i("jan1") ? r01(t, 0.4, 0.55, pop) : 0;
  const born = i("dec31") ? r01(t, 0.1, 0.4, pop) : i("baby") ? 1 : 1;
  const fire = useMemo(() => {
    const r = rng(3);
    return Array.from({ length: 30 }, () => ({ a: r() * Math.PI * 2, e: r() * 1.2, c: ["#ffd23a", "#ff6b8a", "#5ec8ff", "#7ee08a"][Math.floor(r() * 4)] }));
  }, []);
  const burst = i("jan1") ? r01(t, 0.3, 0.8, Easing.out(Easing.quad)) : 0;
  return (
    <group>
      <Slab c={WARD} size={[6, 5]} top="#e9eef0" />
      <Box p={[wx, 1.5, wz - 2.3]} s={[6, 3, 0.15]} c="#dfeaf0" />
      {/* 창문: 밤하늘 */}
      <Box p={[wx + 1.4, 1.7, wz - 2.21]} s={[1.6, 1.1, 0.02]} c={i("jan1") ? "#2b2f5a" : "#1f2440"} e="#2b2f5a" ei={0.3} />
      {/* 달력 */}
      <group position={[wx - 0.6, 1.4, wz - 2.2]}>
        <Box p={[0, 0, 0]} s={[0.62, 0.62, 0.05]} c="#ffffff" />
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[0.56, 0.56]} />
          <meshBasicMaterial map={dec} toneMapped={false} />
        </mesh>
        {flip > 0 && (
          <mesh position={[0, 0.28 - 0.28 * Math.cos(flip * Math.PI) * 0 , 0.045]} rotation={[-Math.PI * (1 - flip), 0, 0]}>
            <planeGeometry args={[0.56, 0.56]} />
            <meshBasicMaterial map={jan} toneMapped={false} />
          </mesh>
        )}
      </group>
      {/* 아기 침대 + 아기 */}
      <group position={[wx, 0, wz]}>
        <Box p={[0, 0.35, 0]} s={[0.9, 0.08, 0.55]} c="#ffffff" />
        {[[-0.42, -0.25], [0.42, -0.25], [-0.42, 0.25], [0.42, 0.25]].map(([x, z], k) => <Box key={k} p={[x, 0.2, z]} s={[0.04, 0.4, 0.04]} c="#e3d6c6" />)}
        {[-0.26].map((z) => <Box key={z} p={[0, 0.5, z]} s={[0.9, 0.22, 0.03]} c="#f4ece2" />)}
        <group scale={born}>
          <mesh position={[0, 0.5, 0]} scale={[1.3, 0.7, 0.9]}>
            <sphereGeometry args={[0.12, 20, 14]} />
            <meshStandardMaterial color="#9fd0f0" />
          </mesh>
          <mesh position={[0.17, 0.54, 0]}>
            <sphereGeometry args={[0.07, 16, 12]} />
            <meshStandardMaterial color="#f0c9a6" />
          </mesh>
        </group>
        {two < 0.5 ? <Balloon p={[0.25, 1.05, 0]} label="1" s={born} bob={t * 6} /> : <Balloon p={[0.25, 1.05, 0]} label="2" s={0.8 + 0.4 * two} c="#5ec8ff" bob={t * 6} />}
      </group>
      {/* 엄마, 아빠 */}
      <Person p={[wx - 0.9, 0, wz + 0.3]} coat="#c86b5a" s={0.62} ry={Math.PI / 2} />
      <Person p={[wx + 0.95, 0, wz + 0.4]} coat="#4a6a8a" s={0.62} ry={-Math.PI / 2} />
      {/* 1월 1일 불꽃 (창밖) */}
      {burst > 0 &&
        fire.map((f, k) => {
          const r = 0.5 * burst * (0.6 + f.e * 0.4);
          return (
            <mesh key={k} position={[wx + 1.4 + Math.cos(f.a) * r, 1.8 + Math.sin(f.a) * r, wz - 2.0]}>
              <sphereGeometry args={[0.025 * (1 - burst * 0.6), 6, 4]} />
              <meshBasicMaterial color={f.c} toneMapped={false} />
            </mesh>
          );
        })}
    </group>
  );
};

// ---------- 2. 거실: 나이 카드 세 장 ----------
const Room: React.FC<{ t: number; w: Words05 }> = ({ t, w }) => {
  const [rx, rz] = ROOM;
  const cards = useMemo(
    () =>
      [[w.korean, "26", "#c8231f"], [w.year, "25", "#2f5d8a"], [w.intl, "24", "#3f7d6b"]].map(([label, n, c]) =>
        canvasTex(300, 200, (g) => {
          g.fillStyle = "#ffffff";
          g.beginPath();
          g.roundRect(6, 6, 288, 188, 26);
          g.fill();
          g.fillStyle = c;
          g.font = "bold 34px Arial";
          g.textAlign = "center";
          g.fillText(label, 150, 56);
          g.font = "900 100px Arial Black, Arial";
          g.fillText(n, 150, 160);
        }),
      ),
    [w.korean, w.year, w.intl],
  );
  return (
    <group>
      <Slab c={ROOM} size={[6, 5]} top="#d9b98c" />
      <Box p={[rx, 1.5, rz - 2.3]} s={[6, 3, 0.15]} c="#f2ebdf" />
      <Box p={[rx - 1.2, 0.3, rz - 1.4]} s={[1.6, 0.4, 0.6]} c="#8a9bb0" />
      <Box p={[rx - 1.2, 0.6, rz - 1.65]} s={[1.6, 0.4, 0.12]} c="#8a9bb0" />
      <Person p={[rx, 0, rz + 0.2]} coat="#e0b04a" s={0.68} ry={0.2} />
      {cards.map((tex, k) => (
        <Sprite key={k} tex={tex} s={r01(t, 0.1 + k * 0.2, 0.3 + k * 0.2, pop)} pos={[rx - 0.7 + k * 0.7, 1.55 + (k === 1 ? 0.12 : 0), rz + 0.3]} size={[0.6, 0.4]} />
      ))}
    </group>
  );
};

// ---------- 3. 광장: 2023 법 ----------
const CROWD: [number, number, number][] = [[-1.6, -0.6, 31], [-0.8, 0.2, 45], [0, -0.8, 19], [0.8, 0.3, 27], [1.6, -0.5, 62], [-1.2, 1.0, 38], [1.2, 1.1, 54]];
const Plaza: React.FC<{ t: number; w: Words05 }> = ({ t, w }) => {
  const [px, pz] = PLAZA;
  const paper = useMemo(
    () =>
      canvasTex(400, 520, (g) => {
        g.fillStyle = "#f4f0e6";
        g.fillRect(0, 0, 400, 520);
        g.fillStyle = "#1b1b1b";
        g.font = "900 44px Arial Black, Arial";
        g.textAlign = "center";
        g.fillText(w.news, 200, 70);
        g.font = "bold 30px Arial";
        g.fillText("2023 · 6 · 28", 200, 120);
        g.fillStyle = "#bdb6a8";
        for (let k = 0; k < 10; k++) g.fillRect(30, 160 + k * 32, k % 3 === 2 ? 200 : 340, 10);
      }),
    [w.news],
  );
  const news = r01(t, 0.02, 0.2, pop);
  const drop = r01(t, 0.35, 0.6);
  return (
    <group>
      <Slab c={PLAZA} size={[8, 6]} top="#ddd6ca" />
      <group position={[px, 2.2 + 0.3 * (1 - news), pz - 2.2]} scale={news} rotation={[0, 0, -0.06]}>
        <mesh>
          <planeGeometry args={[1.5, 1.95]} />
          <meshStandardMaterial map={paper} />
        </mesh>
      </group>
      {CROWD.map(([x, z, n], k) => {
        const minus = n % 2 === 0 ? 1 : 2;
        const shown = drop < 0.5 ? n : n - minus;
        return (
          <group key={k}>
            <Person p={[px + x, 0, pz + z]} coat={["#4a6a8a", "#c86b5a", "#6f7d5c", "#8c5a8a", "#e0b04a", "#3d4a63", "#7a8fa8"][k]} s={0.62} ry={0.2 * k} />
            <AgeTag p={[px + x, 1.25, pz + z]} n={shown} flash={drop > 0.5 ? 1 - r01(t, 0.6, 0.75) : 0} />
          </group>
        );
      })}
    </group>
  );
};

// ---------- 4. 예외: 군대 정문, 편의점 술 ----------
const Except: React.FC<{ mode: Mode05; t: number; w: Words05 }> = ({ mode, t, w }) => {
  const [ex, ez] = EXC;
  const army = useMemo(() => glyphTex(w.army, { bg: "#3f5a3a", fg: "#ffffff", size: 60, font: "Arial Black, Arial", w: 512, h: 128 }), [w.army]);
  const store = useMemo(() => glyphTex(w.store, { bg: "#2f7d6b", fg: "#ffffff", size: 60, font: "Arial Black, Arial", w: 512, h: 128 }), [w.store]);
  const q = useMemo(() => qTex(), []);
  const stamp = mode === "except" ? r01(t, 0.4, 0.55, pop) : 1;
  return (
    <group>
      <Slab c={EXC} size={[9, 5]} top="#d6cfc2" />
      {/* 군대 정문 */}
      <group position={[ex - 2.2, 0, ez - 1.2]}>
        {[-0.9, 0.9].map((x) => <Box key={x} p={[x, 0.9, 0]} s={[0.35, 1.8, 0.35]} c="#7d8a6a" />)}
        <Box p={[0, 1.9, 0]} s={[2.3, 0.3, 0.4]} c="#3f5a3a" />
        <mesh position={[0, 1.9, 0.205]}>
          <planeGeometry args={[2.0, 0.26]} />
          <meshBasicMaterial map={army} toneMapped={false} />
        </mesh>
        <Person p={[0, 0, 0.9]} coat="#4f6a3a" s={0.64} />
        <AgeTag p={[0, 1.3, 0.9]} n={20} flash={1 - stamp} />
      </group>
      {/* 편의점 술 진열대 */}
      <group position={[ex + 2.2, 0, ez - 1.2]}>
        <Box p={[0, 1.2, -0.3]} s={[2.2, 2.4, 0.15]} c="#f4f2ec" />
        <mesh position={[0, 2.2, -0.21]}>
          <planeGeometry args={[1.8, 0.4]} />
          <meshBasicMaterial map={store} toneMapped={false} />
        </mesh>
        {[0.45, 0.95, 1.45].map((y) => <Box key={y} p={[0, y, 0]} s={[1.8, 0.04, 0.4]} c="#c9c4ba" />)}
        {[0.45, 0.95, 1.45].flatMap((y, r) =>
          Array.from({ length: 8 }, (_, k) => (
            <mesh key={`${r}-${k}`} position={[-0.75 + k * 0.21, y + 0.13, 0.02]} castShadow>
              <cylinderGeometry args={[0.04, 0.045, 0.22, 10]} />
              <meshStandardMaterial color={(k + r) % 3 ? "#3fae6b" : "#2f7f8f"} transparent opacity={0.85} />
            </mesh>
          )),
        )}
        <Person p={[0, 0, 0.9]} coat="#c86b5a" s={0.62} ry={Math.PI} />
        <AgeTag p={[0, 1.25, 0.9]} n={19} flash={1 - stamp} />
      </group>
      {mode === "end" && (
        <group>
          <Person p={[ex, 0, ez + 1.2]} coat="#e0b04a" s={0.66} />
          <Sprite tex={q} s={r01(t, 0.2, 0.4, pop)} pos={[ex, 1.35, ez + 1.2]} size={[0.32, 0.32]} />
        </group>
      )}
    </group>
  );
};

export const Scene05: React.FC<{ mode: Mode05; t: number; words: Words05 }> = ({ mode, t, words }) => {
  const P = useMemo(() => paths(words.lang), [words.lang]);
  const night = mode === "dec31" || mode === "jan1";
  return (
    <MiniFrame sky={night ? SKY.night : SKY.day}>
      <Rig paths={P} mode={mode} t={t} />
      <MiniLights dim={night ? 0.35 : 0} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color="#c9d6a8" />
      </mesh>
      {(mode === "baby" || mode === "dec31" || mode === "jan1") && <Ward mode={mode} t={t} w={words} />}
      {mode === "three" && <Room t={t} w={words} />}
      {mode === "law" && <Plaza t={t} w={words} />}
      {(mode === "except" || mode === "end") && <Except mode={mode} t={t} w={words} />}
    </MiniFrame>
  );
};
