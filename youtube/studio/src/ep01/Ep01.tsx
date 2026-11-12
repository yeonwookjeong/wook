import { AbsoluteFill, Audio, Easing, getStaticFiles, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadNotoSans } from "@remotion/google-fonts/NotoSansKR";
import { loadFont as loadHahmlet } from "@remotion/google-fonts/Hahmlet";
import vo from "./vo.json";
import voEs from "./vo_es.json";
import { Complex3D } from "../samples/Complex3D";
import { Scene3D, Spec3D } from "../three/Scenes3D";
import { World, WorldMode } from "../three/World";

const { fontFamily: sans } = loadNotoSans();
const { fontFamily: serif } = loadHahmlet();

// EP01 대본 v3 (youtube/episodes/ep01-4th-floor.md). vo.json이 비어 있으면 자막 시간은 임시(sec).
// 문법: servokind 기준. 컷 1~2.5초, 자막 1~3단어, 핵심만 노란색.

const FPS = 30;
const YELLOW = "#ffd400";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 1080×1920 화면에서의 초점 위치 (그림 A의 F 버튼, 그림 D의 死)
const F_BTN = { x: 752, y: 822 }; // 새 그림 A(배너 오른쪽 그림풍, 2026-11-07)에서 잰 F 버튼 중심
const DEATH = { x: 540, y: 885 }; // 새 그림 D의 死
const H_F = { x: 705, y: 750 }; // 새 그림 H에서 손가락이 누르는 F 버튼
const G_GAP = { x: 624, y: 891 }; // 새 그림 G 안내판에서 3과 5 사이
const I_F = { x: 630, y: 480 }; // 새 그림 I 층수 표시의 F
const C_4 = { x: 570, y: 705 }; // 새 그림 C의 숫자 4
const E_103 = { x: 855, y: 630 }; // 새 그림 E의 103

// 아직 없는 그림은 비슷한 그림으로 대신 보여 준다 (미리보기용). 파일이 생기면 자동으로 새 그림을 쓴다.
const FALLBACK: Record<string, string> = { I: "A", J: "G", K: "H" };
const HAVE = new Set(getStaticFiles().map((f) => f.name));
const imgSrc = (img: string) => staticFile(`ep01/${HAVE.has(`ep01/${img}.webp`) ? img : FALLBACK[img] ?? img}.webp`);

type Cam = { s0: number; s1: number; ox: number; oy: number; dx?: number; dy?: number; snap?: boolean; panY?: [number, number] }; // panY: 시작→끝 세로 이동(px)
type Cap = { text: string; hl?: boolean }[];
type Shot = {
  img?: string;
  sec: number;
  cam: Cam;
  caps: Cap[];
  dark?: number;
  fadeIn?: boolean;
  shake?: boolean;
  overlay?: "sa" | "circleF" | "fIs4" | "room304" | "noFour" | "endcard" | "question" | "show4" | "flip4" | "chain";
  grade?: [number, number]; // 흑백·어둡게 정도(0~1) 컷 시작→끝 — 死 장면 분위기
  at?: { x: number; y: number }; // circleF·fIs4 동그라미 중심 (기본: 그림 A의 F 버튼)
  world?: WorldMode; // 모형 세상 장면 (EP01 전체)
  s3d?: Spec3D; // 3D 장면 (그림 대신)
  three?: "a" | "b"; // 3D 단지 장면(Complex3D): a = 다가가며 4층 강조, b = 4층 빠지고 F 들어옴. 두 컷이 이어진다
  sent: number; // 내레이션 문장 번호 (youtube/tts/make_ep01.py 의 SENTENCES)
  sfx?: { name: string; at?: number; vol?: number };
  sfx2?: { name: string; at?: number; vol?: number };
};

const SHOTS: Shot[] = [
  // 0초부터 주제: 지도 오프닝 없이 버튼판에서 시작 (2026-11-06, 레퍼런스 14편 모두 0초에 주제)
  { world: "aerial", sec: 0.7, cam: { s0: 1.6, s1: 1.15, ox: F_BTN.x, oy: F_BTN.y, snap: true }, caps: [[{ text: "In" }, { text: "Korea,", hl: true }]], sent: 0, sfx: { name: "ding", at: 0.05, vol: 0.35 } },
  { world: "reveal", sec: 1.9, cam: { s0: 1.15, s1: 1.0, ox: F_BTN.x, oy: F_BTN.y }, caps: [[{ text: "this elevator" }], [{ text: "is hiding" }, { text: "a floor.", hl: true }]], sent: 1, sfx: { name: "glitch", at: 0.15, vol: 0.25 } },
  { world: "ride1", sec: 1.2, cam: { s0: 1.4, s1: 1.4, ox: F_BTN.x, oy: F_BTN.y, panY: [(1 - 1.4) * (1920 - F_BTN.y), 0] }, caps: [[{ text: "Look:" }], [{ text: "1, 2, 3…" }]], sent: 2 },
  { world: "ride2", sec: 1.1, cam: { s0: 1.9, s1: 2.4, ox: F_BTN.x, oy: F_BTN.y }, caps: [[{ text: "F.", hl: true }], [{ text: "Where's" }, { text: "4?", hl: true }]], sent: 2, sfx: { name: "pop", at: 0.5, vol: 0.35 } },
  { world: "four", sec: 1.2, cam: { s0: 1.0, s1: 1.12, ox: C_4.x, oy: C_4.y }, caps: [[{ text: "In Korean," }], [{ text: "four", hl: true }]], sent: 3, sfx: { name: "buzz", vol: 0.2 } },
  { world: "sa", sec: 1.2, cam: { s0: 1.12, s1: 1.18, ox: C_4.x, oy: C_4.y }, caps: [[{ text: "is read" }], [{ text: '"sa,"', hl: true }]], sent: 3, sfx: { name: "pop", at: 0.1, vol: 0.4 } },
  { world: "death1", sec: 1.1, cam: { s0: 1.0, s1: 1.08, ox: DEATH.x, oy: DEATH.y }, caps: [[{ text: "the same" }], [{ text: "sound as" }]], sent: 3 },
  { world: "death2", sec: 1.4, cam: { s0: 1.5, s1: 1.65, ox: DEATH.x, oy: DEATH.y, snap: true }, caps: [[{ text: "the Chinese" }], [{ text: "character" }], [{ text: "for" }, { text: "death.", hl: true }]], shake: true, overlay: "chain", sent: 3, sfx: { name: "thud", vol: 0.6 } },
  { world: "swapA", sec: 1.2, cam: { s0: 1, s1: 1, ox: 540, oy: 960 }, caps: [[{ text: "So many" }], [{ text: "buildings" }]], sent: 4, sfx: { name: "buzz", at: 0.65, vol: 0.2 } },
  { world: "swapB", sec: 1.4, cam: { s0: 1, s1: 1, ox: 540, oy: 960 }, caps: [[{ text: "swap it" }], [{ text: "for an" }, { text: "F,", hl: true }], [{ text: 'for "four."' }]], sent: 4, sfx: { name: "pop", at: 0.95, vol: 0.4 } },
  { world: "hosp1", sec: 1.4, cam: { s0: 1.0, s1: 1.1, ox: 540, oy: 900 }, caps: [[{ text: "Hospitals", hl: true }], [{ text: "go further:" }]], sent: 5 },
  { world: "hosp2", sec: 2.1, cam: { s0: 1.0, s1: 1.15, ox: G_GAP.x, oy: G_GAP.y }, caps: [[{ text: "many skip" }], [{ text: "the 4th floor" }], [{ text: "entirely." }]], overlay: "noFour", sent: 5, sfx: { name: "pop", at: 0.3, vol: 0.35 } },
  { world: "life1", sec: 1.6, cam: { s0: 1.0, s1: 1.3, ox: H_F.x, oy: H_F.y }, caps: [[{ text: "But" }], [{ text: "here's the thing:", hl: true }]], sent: 6, sfx: { name: "ding", at: 0.3, vol: 0.25 } },
  { world: "life2", sec: 1.2, cam: { s0: 1.3, s1: 1.4, ox: I_F.x, oy: I_F.y }, caps: [[{ text: "the F is still" }], [{ text: "the 4th floor.", hl: true }]], sent: 6, sfx: { name: "pop", at: 0.2, vol: 0.35 } },
  { world: "life3", sec: 1.3, cam: { s0: 1.0, s1: 1.1, ox: 540, oy: 900 }, caps: [[{ text: "Nobody" }], [{ text: "just says it." }]], sent: 6 },
  { world: "out1", sec: 1.2, cam: { s0: 1.3, s1: 1.1, ox: H_F.x, oy: H_F.y }, caps: [[{ text: "Next time" }], [{ text: "you see an" }, { text: "F,", hl: true }]], sent: 7 },
  // 마지막 = 2번 컷과 같은 구도(어둡게) → 반복 재생 때 첫 장면으로 자연스럽게 이어진다
  { world: "out2", sec: 1.3, cam: { s0: 1.1, s1: 1.0, ox: F_BTN.x, oy: F_BTN.y }, caps: [[{ text: "you'll know" }], [{ text: "what it's" }, { text: "hiding.", hl: true }]], sent: 7, sfx: { name: "thud", at: 1.0, vol: 0.25 } },
];

// 스페인어판(중남미): 컷·그림·효과음은 같고 자막과 화면 글자만 바뀐다. 컷 순서는 SHOTS와 같다.
type Lang = "en" | "es";
const h = (text: string) => ({ text, hl: true });
const w = (text: string) => ({ text });
const CAPS_ES: Cap[][] = [
  [[w("En"), h("Corea,")]],
  [[w("este ascensor")], [w("esconde"), h("un piso.")]],
  [[w("Mira:")], [w("1, 2, 3…")]],
  [[h("F.")], [w("¿Y el"), h("4?")]],
  [[w("En coreano,")], [h("el cuatro")]],
  [[w("se lee")], [h('"sa",')]],
  [[w("igual que")], [w("el carácter")]],
  [[w("chino de")], [h("la muerte.")]],
  [[w("Por eso")], [w("muchos edificios")]],
  [[w("lo cambian")], [w("por una"), h("F,")], [w('de "four".')]],
  [[h("Los hospitales")], [w("van más lejos:")]],
  [[w("muchos se saltan")], [w("el cuarto piso.")]],
  [[w("Pero")], [h("ojo:")]],
  [[w("la F sigue siendo")], [h("el cuarto piso.")]],
  [[w("Solo que")], [w("nadie lo dice.")]],
  [[w("La próxima vez")], [w("que veas una"), h("F,")]],
  [[w("sabrás")], [w("lo que"), h("esconde.")]],
];
const LABEL: Record<Lang, { four: string; f4: string; no4: string }> = {
  en: { four: "F = Four", f4: "F = 4th floor", no4: "no 4th floor" },
  es: { four: "F = Four (4)", f4: "F = 4.º piso", no4: "sin 4.º piso" },
};

// 음성이 있으면 문장 길이를 그 문장에 속한 컷들에 글자 수 비율로 나눈다. 없으면 임시 길이(sec).
type Vo = { voice: string | null; sentences: { id: number; file: string; sec: number }[] };
const TAIL = 0.1; // 문장 끝 숨 고르기 (짧게: 쇼츠 템포)
const capLen = (sh: Shot) => sh.caps.flat().reduce((a, x) => a + x.text.length, 0);
const build = (lang: Lang) => {
  const shots = lang === "es" ? SHOTS.map((sh, i) => ({ ...sh, caps: CAPS_ES[i] })) : SHOTS;
  const VO = (lang === "es" ? voEs : vo) as Vo;
  const sec = (i: number): number => {
    const sh = shots[i];
    const v = VO.sentences.find((x) => x.id === sh.sent);
    if (!v) return sh.sec;
    const group = shots.filter((x) => x.sent === sh.sent);
    const total = group.reduce((a, x) => a + capLen(x), 0);
    const isLast = group[group.length - 1] === sh;
    return (v.sec * capLen(sh)) / total + (isLast ? TAIL : 0);
  };
  const frames = shots.map((_, i) => Math.round(sec(i) * FPS));
  return { shots, VO, frames, total: frames.reduce((a, f) => a + f, 0) };
};
const EN = build("en");
const ES = build("es");

export const EP01_FRAMES = EN.total;
export const EP01_ES_FRAMES = ES.total;

// 자막: 흰 굵은 글씨 + 검은 테두리, 화면 가운데보다 조금 아래, 핵심만 노란색
const Caption: React.FC<{ cap: Cap }> = ({ cap }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1180, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 22px", transform: `scale(${0.85 + 0.15 * pop})` }}>
      {cap.map((w, i) => (
        <span
          key={i}
          style={{
            fontFamily: sans,
            fontWeight: 900,
            fontSize: 92,
            lineHeight: 1.15,
            color: w.hl ? YELLOW : "#ffffff",
            WebkitTextStroke: "14px #000",
            paintOrder: "stroke fill",
            textShadow: "0 6px 18px rgba(0,0,0,0.55)",
          }}
        >
          {w.text}
        </span>
      ))}
    </div>
  );
};

const Overlay: React.FC<{ kind: Shot["overlay"]; dur: number; at?: { x: number; y: number }; lang: Lang }> = ({ kind, dur, at, lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 4, fps, config: { damping: 9, stiffness: 220 } });

  if (kind === "question")
    return (
      <div style={{ position: "absolute", left: 880, top: 470, fontFamily: sans, fontWeight: 900, fontSize: 260, color: YELLOW, WebkitTextStroke: "14px #000", paintOrder: "stroke fill", transform: `scale(${pop}) rotate(12deg)` }}>?</div>
    );
  if (kind === "sa")
    return (
      <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${pop})` }}>
        <div style={{ fontFamily: serif, fontWeight: 900, fontSize: 380, lineHeight: 1, color: "#fff", WebkitTextStroke: "16px #000", paintOrder: "stroke fill" }}>사</div>
        <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 70, color: YELLOW, WebkitTextStroke: "10px #000", paintOrder: "stroke fill", marginTop: 10 }}>sa · 4</div>
      </div>
    );
  if (kind === "circleF" || kind === "fIs4") {
    const P = at ?? F_BTN;
    // 확대된 화면 기준 F 버튼 위치는 화면 중앙 근처
    const r = 195;
    const draw = interpolate(frame, [2, 16], [0, 1], clamp);
    return (
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <circle cx={P.x} cy={P.y} r={r} fill="none" stroke="#ff2a2a" strokeWidth={18} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} transform={`rotate(-90 ${P.x} ${P.y})`} />
        <text x={P.x} y={P.y + r + 120} textAnchor="middle" fontFamily={sans} fontWeight={900} fontSize={80} fill={YELLOW} stroke="#000" strokeWidth={12} paintOrder="stroke" opacity={draw}>
          {kind === "fIs4" ? LABEL[lang].f4 : LABEL[lang].four}
        </text>
      </svg>
    );
  }
  if (kind === "room304")
    return (
      <div style={{ position: "absolute", left: 590, top: 520, width: 300, height: 150, border: "10px dashed #ffd400", display: "grid", placeItems: "center", transform: `scale(${pop})`, background: "rgba(0,0,0,0.35)" }}>
        <span style={{ fontFamily: sans, fontWeight: 900, fontSize: 92, color: "#fff", textDecoration: "line-through", textDecorationColor: "#ff2a2a", textDecorationThickness: 12 }}>304</span>
      </div>
    );
  if (kind === "show4" || kind === "flip4") {
    // F 버튼 자리에 "4"가 있었다가 F로 바뀐다 = 숨겨진 층. 버튼 모양을 그대로 덮는다.
    const o = kind === "show4" ? 1 : interpolate(frame, [3, 13], [1, 0], clamp);
    const flip = kind === "flip4" ? interpolate(frame, [3, 13], [1, 0], clamp) : 1; // 가로로 접히며 사라짐
    return (
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: o }}>
        <defs>
          <radialGradient id="btn4" cx="50%" cy="45%" r="60%">
            <stop offset="0" stopColor="#f3ece4" />
            <stop offset="1" stopColor="#cbbfb3" />
          </radialGradient>
        </defs>
        <g transform={`translate(${F_BTN.x} ${F_BTN.y}) scale(${flip} 1)`}>
          <circle r={76} fill="url(#btn4)" stroke="#9c8f84" strokeWidth={5} />
          <text y={30} textAnchor="middle" fontFamily={sans} fontWeight={700} fontSize={86} fill="#3d3530">4</text>
        </g>
      </svg>
    );
  }
  if (kind === "chain")
    // 4 = 사 = 死 : 이 편의 핵심을 한 줄 카드로
    return (
      <div style={{ position: "absolute", left: 0, right: 0, top: 260, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 26, transform: `scale(${pop})` }}>
        {[["4", "#fff"], ["=", YELLOW], ["사", "#fff"], ["=", YELLOW], ["死", "#ff4d4d"]].map(([t, c], i) => (
          <span key={i} style={{ fontFamily: t === "사" || t === "死" ? serif : sans, fontWeight: 900, fontSize: t === "=" ? 90 : 140, color: c, WebkitTextStroke: "14px #000", paintOrder: "stroke fill" }}>{t}</span>
        ))}
      </div>
    );
  if (kind === "noFour")
    // 안내판 위쪽 빈 곳에 "4̶ no 4th floor" (화면 밖으로 잘리지 않게 가운데 정렬)
    return (
      <div style={{ position: "absolute", left: 0, right: 0, top: 230, display: "flex", justifyContent: "center", alignItems: "center", gap: 22, transform: `scale(${pop})` }}>
        <span style={{ fontFamily: sans, fontWeight: 900, fontSize: 150, color: "#fff", textDecoration: "line-through", textDecorationColor: "#ff2a2a", textDecorationThickness: 18, WebkitTextStroke: "14px #000", paintOrder: "stroke fill" }}>4</span>
        <span style={{ fontFamily: sans, fontWeight: 900, fontSize: 84, color: YELLOW, WebkitTextStroke: "12px #000", paintOrder: "stroke fill" }}>{LABEL[lang].no4}</span>
      </div>
    );
  if (kind === "endcard") {
    const o = interpolate(frame, [0, 10], [0, 1], clamp);
    const out = interpolate(frame, [dur - 6, dur], [1, 0], clamp);
    return (
      <AbsoluteFill style={{ background: "#141f31", alignItems: "center", justifyContent: "center", opacity: o * out }}>
        <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 40, letterSpacing: "0.2em", color: "#2de2e6", marginBottom: 40 }}>NEXT</div>
        <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 96, lineHeight: 1.15, textAlign: "center", color: "#fff", padding: "0 80px", transform: `scale(${0.9 + 0.1 * pop})` }}>
          Why Koreans never write a name in <span style={{ color: "#ff3d8b" }}>red</span>?
        </div>
        <div style={{ marginTop: 60, fontFamily: sans, fontSize: 36, color: "#8fa3c2" }}>(까치 엔딩 카드 자리)</div>
      </AbsoluteFill>
    );
  }
  return null;
};

const ShotView: React.FC<{ shot: Shot; dur: number; lang: Lang; split?: number }> = ({ shot, dur, lang, split = 0.4 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(frame, [0, dur], [0, 1], clamp);
  const { cam } = shot;
  const ease = Easing.out(Easing.cubic);
  const snap = cam.snap ? spring({ frame, fps, config: { damping: 14, stiffness: 200 } }) : ease(t);
  const s = cam.s0 + (cam.s1 - cam.s0) * snap;
  const dx = (cam.dx ?? 0) * (t - 0.5) * 2;
  const dy = cam.panY ? cam.panY[0] + (cam.panY[1] - cam.panY[0]) * ease(t) : (cam.dy ?? 0) * (t - 0.5) * 2;
  const shake = shot.shake ? Math.sin(frame * 2.3) * 10 * interpolate(frame, [0, 10], [1, 0], clamp) : 0;
  const fade = shot.fadeIn ? interpolate(frame, [0, 8], [0, 1], clamp) : 1;
  const g = shot.grade ? shot.grade[0] + (shot.grade[1] - shot.grade[0]) * t : 0;

  // 자막은 컷 길이를 묶음 수로 나눠서 차례로
  const per = shot.caps.length ? dur / shot.caps.length : dur;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {shot.img && (
        <AbsoluteFill style={{ opacity: fade }}>
          <Img
            src={imgSrc(shot.img)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transformOrigin: `${cam.ox}px ${cam.oy}px`,
              transform: `translate(${dx + shake}px, ${dy}px) scale(${s})`,
              filter: g ? `grayscale(${g}) brightness(${1 - 0.45 * g}) contrast(${1 + 0.25 * g})` : undefined,
            }}
          />
        </AbsoluteFill>
      )}
      {shot.world && (
        <AbsoluteFill style={{ transform: `translate(${shake}px, 0)` }}>
          <World mode={shot.world} t={t} tag={LABEL[lang].f4} />
        </AbsoluteFill>
      )}
      {shot.s3d && (
        <AbsoluteFill style={{ transform: `translate(${shake}px, 0)`, filter: g ? `grayscale(${g}) brightness(${1 - 0.45 * g}) contrast(${1 + 0.25 * g})` : undefined }}>
          <Scene3D spec={shot.s3d} t={t} />
        </AbsoluteFill>
      )}
      {shot.three && <Complex3D split={split} p={shot.three === "a" ? t * split : split + t * (1 - split)} />}
      {shot.dark ? <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 30%, rgba(0,0,0,${shot.dark}) 100%)` }} /> : null}
      {g ? <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 46%, rgba(0,0,0,0) 25%, rgba(0,0,0,${0.7 * g}) 100%)` }} /> : null}
      {shot.overlay && <Overlay kind={shot.overlay} dur={dur} at={shot.at} lang={lang} />}
      {shot.caps.map((c, i) => (
        <Sequence key={i} from={Math.round(i * per)} durationInFrames={Math.round((i + 1) * per) - Math.round(i * per)} layout="none">
          <Caption cap={c} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const Ep01: React.FC<{ lang?: Lang }> = ({ lang = "en" }) => {
  const { shots: SHOTS_L, VO, frames: SHOT_FRAMES } = lang === "es" ? ES : EN;
  const starts = SHOT_FRAMES.map((_, i) => SHOT_FRAMES.slice(0, i).reduce((a, f) => a + f, 0));
  const firstOfSent = (id: number) => SHOTS_L.findIndex((x) => x.sent === id);
  const ia = SHOTS_L.findIndex((x) => x.three === "a");
  const split = ia >= 0 ? SHOT_FRAMES[ia] / (SHOT_FRAMES[ia] + SHOT_FRAMES[ia + 1]) : 0.4;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {SHOTS_L.map((shot, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={SHOT_FRAMES[i]}>
          <ShotView shot={shot} dur={SHOT_FRAMES[i]} lang={lang} split={split} />
          {[shot.sfx, shot.sfx2].map((fx, k) =>
            fx ? (
              <Sequence key={k} from={Math.round((fx.at ?? 0) * FPS)} layout="none">
                <Audio src={staticFile(`sfx/${fx.name}.wav`)} volume={fx.vol ?? 0.4} />
              </Sequence>
            ) : null,
          )}
        </Sequence>
      ))}

      {/* 내레이션: 각 문장은 그 문장의 첫 컷에서 시작 (0번도 0초부터) */}
      {VO.sentences.map((v) => (
        <Sequence key={v.id} from={starts[firstOfSent(v.id)]} layout="none">
          <Audio src={staticFile(v.file)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
