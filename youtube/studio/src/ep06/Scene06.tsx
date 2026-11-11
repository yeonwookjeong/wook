// EP06 "'나' 대신 '우리'" 모형 세상
//  마을(MY 말풍선이 깨지고 OUR) → 집·학교·태극기에 OUR 꼬리표 → 거실(외동인데 OUR MOM) → 광장 손잡은 원 → 회사(MY 차갑게 / OUR 따뜻하게) → 거리 간판이 '우리'로 → 질문
import { useMemo } from "react";
import { Easing, interpolate } from "remotion";
import * as THREE from "three";
import { Person } from "../three/World";
import { canvasTex, clamp } from "../three/kit";
import { Box, K, Key, MiniFrame, MiniLights, qTex, Rig, SKY, Slab, Sprite, CJK } from "../three/mini";

export type Mode06 = "my" | "ours" | "only" | "belong" | "company" | "everywhere" | "end";
export const ORDER06: Mode06[] = ["my", "ours", "only", "belong", "company", "everywhere", "end"];
export type Words06 = { lang: "en" | "es"; my: string; our: string; house: string; school: string; country: string; mom: string; myCo: string; ourCo: string };

const pop = Easing.out(Easing.back(1.6));
const ease = Easing.inOut(Easing.cubic);
const r01 = (t: number, a: number, b: number, e = ease) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: e });

const TOWN: [number, number] = [0, 0];
const HOME: [number, number] = [-16, -10];
const RING: [number, number] = [16, -10];
const OFFICE: [number, number] = [0, -24];

const paths = (lang: "en" | "es"): Record<Mode06, Key[]> => {
  const [hx, hz] = HOME;
  const [rx, rz] = RING;
  const [ox, oz] = OFFICE;
  return {
    my: [lang === "es" ? K(-1.2, 1.7, 3.6, 0, 1.25, 0.6) : K(1.2, 1.7, 3.6, 0, 1.25, 0.6), K(0.6, 1.55, 3.0, 0, 1.3, 0.6)],
    ours: [K(0.6, 1.55, 3.0, 0, 1.3, 0.6), K(0, 3.0, 7.2, 0, 1.4, -0.9)],
    only: [K(hx + 1.6, 1.8, hz + 3.8, hx, 1.1, hz), K(hx + 0.8, 1.6, hz + 3.0, hx, 1.15, hz)],
    belong: [K(rx + 3.5, 5.0, rz + 6.5, rx, 0.6, rz), K(rx + 1.0, 6.5, rz + 4.0, rx, 0.5, rz)],
    company: [K(ox - 3.0, 2.6, oz + 7.0, ox - 1.6, 1.6, oz), K(ox + 3.0, 2.6, oz + 7.0, ox + 1.6, 1.6, oz)],
    everywhere: [K(-3.5, 2.6, 7.5, -1.5, 1.6, -2.5), K(3.5, 2.6, 7.5, 1.5, 1.6, -2.5)],
    end: [K(3.5, 2.6, 7.5, 1.5, 1.6, -2.5), K(0.7, 1.5, 3.2, 0, 1.2, 0.6)],
  };
};

const bubble = (text: string, color: string) =>
  canvasTex(400, 240, (g) => {
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.roundRect(10, 10, 380, 170, 60);
    g.fill();
    g.beginPath();
    g.moveTo(150, 175);
    g.lineTo(120, 235);
    g.lineTo(210, 178);
    g.fill();
    g.lineWidth = 8;
    g.strokeStyle = "#1b1b1b";
    g.beginPath();
    g.roundRect(10, 10, 380, 170, 60);
    g.stroke();
    g.fillStyle = color;
    g.font = `900 ${text.length > 6 ? 70 : 110}px Arial Black, Arial`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 200, 98);
  });

const tag = (text: string, bg: string, fg = "#ffffff", font = "Arial Black, Arial") =>
  canvasTex(512, 140, (g) => {
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(6, 6, 500, 128, 30);
    g.fill();
    g.fillStyle = fg;
    g.font = `900 ${text.length > 12 ? 48 : 64}px ${font}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 256, 74);
  });

const WARM = "#e8743b";

/** 태극기 (흰 바탕, 가운데 태극, 네 귀퉁이 괘) */
const taegukgi = () =>
  canvasTex(360, 240, (g) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, 360, 240);
    const cx = 180, cy = 120, R = 60;
    g.save();
    g.translate(cx, cy);
    g.rotate(Math.atan2(2, 3));
    g.fillStyle = "#cd2e3a";
    g.beginPath(); g.arc(0, 0, R, Math.PI, 0); g.fill();
    g.fillStyle = "#0047a0";
    g.beginPath(); g.arc(0, 0, R, 0, Math.PI); g.fill();
    g.fillStyle = "#cd2e3a";
    g.beginPath(); g.arc(-R / 2, 0, R / 2, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#0047a0";
    g.beginPath(); g.arc(R / 2, 0, R / 2, 0, Math.PI * 2); g.fill();
    g.restore();
    // 괘 (네 귀퉁이, 단순화)
    g.fillStyle = "#000000";
    const bars = (x: number, y: number, rot: number, pattern: number[][]) => {
      g.save();
      g.translate(x, y);
      g.rotate(rot);
      pattern.forEach((row, k) => {
        if (row.length === 1) g.fillRect(-24, -18 + k * 14, 48, 9);
        else { g.fillRect(-24, -18 + k * 14, 21, 9); g.fillRect(3, -18 + k * 14, 21, 9); }
      });
      g.restore();
    };
    bars(78, 56, -Math.atan2(2, 3) * 1, [[1], [1], [1]]);
    bars(282, 184, -Math.atan2(2, 3) * 1, [[1, 1], [1, 1], [1, 1]]);
    bars(282, 56, Math.atan2(2, 3), [[1, 1], [1], [1, 1]]);
    bars(78, 184, Math.atan2(2, 3), [[1], [1, 1], [1]]);
  });
const COLD = "#3d6fb6";

// ---------- 1. 마을 ----------
const SIGNS = [[-3.6, "#f0d9b5"], [-1.2, "#e6eef3"], [1.2, "#efe6d6"], [3.6, "#dfe9d8"]] as const;
const Town: React.FC<{ mode: Mode06; t: number; w: Words06 }> = ({ mode, t, w }) => {
  const i = (m: Mode06) => mode === m;
  const myT = useMemo(() => bubble(w.my, COLD), [w.my]);
  const ourT = useMemo(() => bubble(w.our, WARM), [w.our]);
  const tags = useMemo(() => [w.house, w.school, w.country].map((x) => tag(x, WARM)), [w.house, w.school, w.country]);
  const uri = useMemo(() => tag("우리", WARM, "#ffffff", CJK), []);
  const blank = useMemo(() => tag("", "#2b2b2b"), []);
  const q = useMemo(() => qTex(), []);
  const flag = useMemo(() => taegukgi(), []);
  const crack = i("my") ? r01(t, 0.35, 0.55) : 1;
  const shake = i("my") && crack < 1 ? Math.sin(t * 120) * 0.02 * crack : 0;
  const tg = (k: number) => (i("ours") ? r01(t, 0.25 + k * 0.18, 0.4 + k * 0.18, pop) : i("everywhere") || i("end") ? 1 : 0);
  const sign = (k: number) => (i("everywhere") ? r01(t, 0.1 + k * 0.18, 0.25 + k * 0.18, pop) : i("end") ? 1 : 0);
  return (
    <group>
      <Slab c={TOWN} size={[10, 8]} top="#ddd6ca" />
      {/* 가게들: 간판이 '우리'로 바뀜 */}
      {SIGNS.map(([x, c], k) => (
        <group key={k} position={[x, 0, -3]}>
          <Box p={[0, 1.4, 0]} s={[2.2, 2.8, 1]} c={c} />
          <Box p={[0, 0.55, 0.51]} s={[1.6, 0.9, 0.02]} c="#a9cbe0" e="#dff2ff" ei={0.25} />
          <mesh position={[0, 2.2, 0.52]} rotation={[0, sign(k) * Math.PI * 2, 0]}>
            <planeGeometry args={[1.4, 0.38]} />
            <meshBasicMaterial map={sign(k) > 0.5 ? uri : blank} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* 집, 학교, 깃대 */}
      <group position={[-2.6, 0, -0.6]}>
        <Box p={[0, 0.45, 0]} s={[1.0, 0.9, 0.8]} c="#f4ead8" />
        <Box p={[0, 1.05, 0]} s={[1.15, 0.3, 0.95]} c="#a33c2c" r={[0, 0, 0]} />
        <Sprite tex={tags[0]} s={tg(0)} pos={[0, 1.6, 0.3]} size={[1.0, 0.27]} />
      </group>
      <group position={[2.6, 0, -0.6]}>
        <Box p={[0, 0.6, 0]} s={[1.4, 1.2, 0.8]} c="#efe4cc" />
        <mesh position={[0, 0.95, 0.41]}><circleGeometry args={[0.13, 20]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <Sprite tex={tags[1]} s={tg(1)} pos={[0, 1.6, 0.3]} size={[1.0, 0.27]} />
      </group>
      <group position={[0, 0, -1.2]}>
        <Box p={[0, 1.2, 0]} s={[0.05, 2.4, 0.05]} c="#b8b8b8" />
        <mesh position={[0.28, 2.15, 0]}>
          <planeGeometry args={[0.54, 0.36]} />
          <meshStandardMaterial map={flag} side={THREE.DoubleSide} />
        </mesh>
        <Sprite tex={tags[2]} s={tg(2)} pos={[0.1, 2.65, 0.2]} size={[1.0, 0.27]} />
      </group>
      {/* 말하는 사람 */}
      <Person p={[0, 0, 0.6]} coat="#4a6a8a" s={0.66} />
      {(i("my") || i("ours")) && (
        <>
          {crack < 0.5 && <Sprite tex={myT} s={i("my") ? r01(t, 0.02, 0.15, pop) : 0} pos={[0.12 + shake, 1.45, 0.7]} size={[0.6, 0.36]} rz={crack * 0.4} />}
          {crack >= 0.5 && <Sprite tex={ourT} s={i("my") ? r01(t, 0.55, 0.7, pop) : 1 - r01(t, 0, 0.2)} pos={[0.12, 1.45, 0.7]} size={[0.6, 0.36]} />}
        </>
      )}
      {i("end") && <Sprite tex={q} s={r01(t, 0.5, 0.7, pop)} pos={[0.3, 1.45, 0.7]} size={[0.3, 0.3]} />}
    </group>
  );
};

// ---------- 2. 거실: 외동인데 OUR MOM ----------
const Home: React.FC<{ t: number; w: Words06 }> = ({ t, w }) => {
  const [hx, hz] = HOME;
  const momT = useMemo(() => tag(w.mom, WARM), [w.mom]);
  return (
    <group>
      <Slab c={HOME} size={[6, 5]} top="#d9b98c" />
      <Box p={[hx, 1.5, hz - 2.3]} s={[6, 3, 0.15]} c="#f2ebdf" />
      <Box p={[hx + 1.2, 0.3, hz - 1.4]} s={[1.6, 0.4, 0.6]} c="#c9a3a3" />
      <Person p={[hx - 0.35, 0, hz]} coat="#c86b5a" s={0.72} ry={0.4} />
      <Person p={[hx + 0.4, 0, hz + 0.2]} coat="#7f9a7a" s={0.42} ry={-0.5} />
      <Sprite tex={momT} s={r01(t, 0.15, 0.35, pop)} pos={[hx - 0.05, 1.5, hz + 0.3]} size={[0.95, 0.26]} />
    </group>
  );
};

// ---------- 3. 광장: 손잡은 원이 커짐 ----------
const Ring: React.FC<{ t: number }> = ({ t }) => {
  const [rx, rz] = RING;
  const rings = [5, 9, 14];
  const grow = (k: number) => r01(t, 0.05 + k * 0.25, 0.3 + k * 0.25, pop);
  return (
    <group>
      <Slab c={RING} size={[9, 9]} top="#ddd6ca" />
      {rings.map((n, k) => {
        const g = grow(k);
        if (g <= 0) return null;
        const R = 0.6 + k * 0.85;
        return Array.from({ length: n }, (_, j) => {
          const a = (j / n) * Math.PI * 2;
          return <Person key={`${k}-${j}`} p={[rx + Math.cos(a) * R * g, 0, rz + Math.sin(a) * R * g]} coat={["#c86b5a", "#4a6a8a", "#e0b04a", "#6f7d5c", "#8c5a8a"][(j + k) % 5]} s={0.55 * Math.min(1, g * 1.3)} ry={-a + Math.PI / 2} />;
        });
      })}
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[rx, 0.02, rz]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6 + k * 0.85 - 0.02, 0.6 + k * 0.85 + 0.02, 64]} />
          <meshBasicMaterial color={WARM} transparent opacity={0.6 * grow(k)} />
        </mesh>
      ))}
    </group>
  );
};

// ---------- 4. 회사: MY는 차갑게, OUR는 따뜻하게 ----------
const Office: React.FC<{ t: number; w: Words06 }> = ({ t, w }) => {
  const [ox, oz] = OFFICE;
  const myT = useMemo(() => tag(w.myCo, COLD), [w.myCo]);
  const ourT = useMemo(() => tag(w.ourCo, WARM), [w.ourCo]);
  const warm = r01(t, 0.45, 0.7);
  return (
    <group>
      <Slab c={OFFICE} size={[9, 6]} top="#d6cfc2" />
      <group position={[ox - 1.8, 0, oz - 1]}>
        <Box p={[0, 1.4, 0]} s={[2.0, 2.8, 1.6]} c="#c9d6e6" e="#6f9fd8" ei={0.15} />
        <Sprite tex={myT} s={r01(t, 0.05, 0.2, pop)} pos={[0, 3.1, 0.6]} size={[1.4, 0.38]} />
        <Person p={[0, 0, 1.4]} coat="#5a6f8a" s={0.62} ry={0} />
      </group>
      <group position={[ox + 1.8, 0, oz - 1]}>
        <Box p={[0, 1.4, 0]} s={[2.0, 2.8, 1.6]} c="#f3d9bf" e="#ffb06a" ei={0.25 * warm} />
        <Sprite tex={ourT} s={r01(t, 0.45, 0.6, pop)} pos={[0, 3.1, 0.6]} size={[1.4, 0.38]} />
        {[-0.4, 0, 0.4].map((x, k) => <Person key={k} p={[x, 0, 1.4]} coat={["#c86b5a", "#e0b04a", "#6f7d5c"][k]} s={0.62} ry={0} />)}
        {warm > 0 && <pointLight position={[0, 1.6, 1.6]} color="#ffb06a" intensity={2.5 * warm} distance={4} />}
      </group>
    </group>
  );
};

export const Scene06: React.FC<{ mode: Mode06; t: number; words: Words06 }> = ({ mode, t, words }) => {
  const P = useMemo(() => paths(words.lang), [words.lang]);
  const town = ["my", "ours", "everywhere", "end"].includes(mode);
  return (
    <MiniFrame sky={SKY.day}>
      <Rig paths={P} mode={mode} t={t} />
      <MiniLights />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color="#c9d6a8" />
      </mesh>
      {town && <Town mode={mode} t={t} w={words} />}
      {mode === "only" && <Home t={t} w={words} />}
      {mode === "belong" && <Ring t={t} />}
      {mode === "company" && <Office t={t} w={words} />}
    </MiniFrame>
  );
};
