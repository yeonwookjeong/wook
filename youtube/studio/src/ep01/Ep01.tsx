import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadNotoSans } from "@remotion/google-fonts/NotoSansKR";
import { loadFont as loadHahmlet } from "@remotion/google-fonts/Hahmlet";
import { MapOpening, MAP_OPENING_FRAMES } from "../components/MapOpening";
import vo from "./vo.json";

const { fontFamily: sans } = loadNotoSans();
const { fontFamily: serif } = loadHahmlet();

// EP01 러프컷 (youtube/episodes/ep01-4th-floor.md). 음성은 아직 없음: 자막 시간은 임시.
// 문법: servokind 기준. 컷 1~2.5초, 자막 1~3단어, 핵심만 노란색.

const FPS = 30;
const YELLOW = "#ffd400";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 1080×1920 화면에서의 초점 위치 (그림 A의 F 버튼, 그림 D의 死)
const F_BTN = { x: 619, y: 805 };
const DEATH = { x: 540, y: 760 };
const H_F = { x: 672, y: 809 }; // 그림 H에서 손가락이 누르는 F 버튼
const G_GAP = { x: 861, y: 967 }; // 그림 G 안내판에서 3과 5 사이

type Cam = { s0: number; s1: number; ox: number; oy: number; dx?: number; dy?: number; snap?: boolean };
type Cap = { text: string; hl?: boolean }[];
type Shot = {
  img?: string;
  sec: number;
  cam: Cam;
  caps: Cap[];
  dark?: number;
  fadeIn?: boolean;
  shake?: boolean;
  overlay?: "sa" | "circleF" | "room304" | "noFour" | "endcard" | "question";
  sent: number; // 내레이션 문장 번호 (youtube/tts/make_ep01.py 의 SENTENCES)
  sfx?: { name: string; at?: number; vol?: number };
  sfx2?: { name: string; at?: number; vol?: number };
};

const SHOTS: Shot[] = [
  { img: "A", sec: 1.4, cam: { s0: 1.6, s1: 1.0, ox: 540, oy: 960, snap: true }, caps: [[{ text: "this elevator" }], [{ text: "is hiding" }, { text: "a floor.", hl: true }]], sent: 1, sfx: { name: "ding", at: 0.1, vol: 0.35 } },
  { img: "A", sec: 1.1, cam: { s0: 1.0, s1: 2.4, ox: F_BTN.x, oy: F_BTN.y }, caps: [[{ text: "Just an" }, { text: "F.", hl: true }]], sent: 2 },
  { img: "C", sec: 1.1, cam: { s0: 1.0, s1: 1.12, ox: 640, oy: 700 }, caps: [[{ text: "The number" }, { text: "four", hl: true }]], sent: 3, sfx: { name: "buzz", vol: 0.25 } },
  { img: "C", sec: 1.5, cam: { s0: 1.12, s1: 1.18, ox: 640, oy: 700 }, caps: [[{ text: "is read" }], [{ text: '"sa,"', hl: true }]], dark: 0.35, overlay: "sa", sent: 3, sfx: { name: "pop", at: 0.1, vol: 0.4 } },
  { img: "D", sec: 1.1, cam: { s0: 1.0, s1: 1.08, ox: DEATH.x, oy: DEATH.y }, caps: [[{ text: "the same" }], [{ text: "sound as" }]], fadeIn: true, sent: 3 },
  { img: "D", sec: 1.3, cam: { s0: 1.5, s1: 1.65, ox: DEATH.x, oy: DEATH.y, snap: true }, caps: [[{ text: "an old word" }], [{ text: "for" }, { text: "death.", hl: true }]], shake: true, sent: 3, sfx: { name: "thud", vol: 0.5 }, sfx2: { name: "glitch", vol: 0.2 } },
  { img: "E", sec: 1.4, cam: { s0: 1.3, s1: 1.3, ox: 540, oy: 960, dy: -260 }, caps: [[{ text: "So many" }], [{ text: "buildings" }]], sent: 4 },
  { img: "A", sec: 1.3, cam: { s0: 2.2, s1: 2.3, ox: F_BTN.x, oy: F_BTN.y }, caps: [[{ text: "swap it" }], [{ text: "for" }, { text: "F,", hl: true }]], overlay: "circleF", sent: 4, sfx: { name: "pop", at: 0.07, vol: 0.4 } },
  { img: "F", sec: 1.4, cam: { s0: 1.2, s1: 1.2, ox: 540, oy: 960, dx: 90 }, caps: [[{ text: "skip room" }], [{ text: "numbers,", hl: true }]], overlay: "room304", sent: 4, sfx: { name: "pop", at: 0.15, vol: 0.35 } },
  { img: "G", sec: 1.3, cam: { s0: 1.0, s1: 1.15, ox: G_GAP.x, oy: G_GAP.y }, caps: [[{ text: "even" }, { text: "hospital", hl: true }], [{ text: "floors." }]], overlay: "noFour", sent: 4, sfx: { name: "pop", at: 0.15, vol: 0.35 } },
  { img: "H", sec: 1.3, cam: { s0: 1.0, s1: 1.3, ox: H_F.x, oy: H_F.y }, caps: [[{ text: "Next time" }], [{ text: "you see an" }, { text: "F,", hl: true }]], sent: 5, sfx: { name: "ding", at: 0.35, vol: 0.25 } },
  { img: "A", sec: 1.5, cam: { s0: 1.6, s1: 1.9, ox: F_BTN.x, oy: F_BTN.y }, caps: [[{ text: "you'll know" }], [{ text: "what it's" }, { text: "hiding.", hl: true }]], dark: 0.45, sent: 5, sfx: { name: "thud", at: 0.9, vol: 0.25 } },
];

// 음성이 있으면 문장 길이를 그 문장에 속한 컷들에 글자 수 비율로 나눈다. 없으면 임시 길이(sec).
type Vo = { voice: string | null; sentences: { id: number; file: string; sec: number }[] };
const VO = vo as Vo;
const TAIL = 0.1; // 문장 끝 숨 고르기 (짧게: 쇼츠 템포)
const capLen = (sh: Shot) => sh.caps.flat().reduce((a, w) => a + w.text.length, 0);
const shotSec = (i: number): number => {
  const sh = SHOTS[i];
  const v = VO.sentences.find((x) => x.id === sh.sent);
  if (!v) return sh.sec;
  const group = SHOTS.filter((x) => x.sent === sh.sent);
  const total = group.reduce((a, x) => a + capLen(x), 0);
  const isLast = group[group.length - 1] === sh;
  return (v.sec * capLen(sh)) / total + (isLast ? TAIL : 0);
};
const SHOT_FRAMES = SHOTS.map((_, i) => Math.round(shotSec(i) * FPS));

export const EP01_FRAMES = MAP_OPENING_FRAMES + SHOT_FRAMES.reduce((a, f) => a + f, 0);

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

const Overlay: React.FC<{ kind: Shot["overlay"]; dur: number }> = ({ kind, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 4, fps, config: { damping: 9, stiffness: 220 } });

  if (kind === "question")
    return (
      <div style={{ position: "absolute", left: 760, top: 560, fontFamily: sans, fontWeight: 900, fontSize: 260, color: YELLOW, WebkitTextStroke: "14px #000", paintOrder: "stroke fill", transform: `scale(${pop}) rotate(12deg)` }}>?</div>
    );
  if (kind === "sa")
    return (
      <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${pop})` }}>
        <div style={{ fontFamily: serif, fontWeight: 900, fontSize: 380, lineHeight: 1, color: "#fff", WebkitTextStroke: "16px #000", paintOrder: "stroke fill" }}>사</div>
        <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 70, color: YELLOW, WebkitTextStroke: "10px #000", paintOrder: "stroke fill", marginTop: 10 }}>sa · 4</div>
      </div>
    );
  if (kind === "circleF") {
    // 확대된 화면 기준 F 버튼 위치는 화면 중앙 근처
    const r = 195;
    const draw = interpolate(frame, [2, 16], [0, 1], clamp);
    return (
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <circle cx={F_BTN.x} cy={F_BTN.y} r={r} fill="none" stroke="#ff2a2a" strokeWidth={18} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} transform={`rotate(-90 ${F_BTN.x} ${F_BTN.y})`} />
        <text x={F_BTN.x} y={F_BTN.y + r + 120} textAnchor="middle" fontFamily={sans} fontWeight={900} fontSize={80} fill={YELLOW} stroke="#000" strokeWidth={12} paintOrder="stroke" opacity={draw}>
          F = Four
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
  if (kind === "noFour")
    return (
      <div style={{ position: "absolute", left: G_GAP.x - 520, top: G_GAP.y - 95, display: "flex", alignItems: "center", gap: 14, transform: `scale(${pop})`, transformOrigin: "right center" }}>
        <span style={{ fontFamily: sans, fontWeight: 900, fontSize: 150, color: "#fff", textDecoration: "line-through", textDecorationColor: "#ff2a2a", textDecorationThickness: 18, WebkitTextStroke: "14px #000", paintOrder: "stroke fill" }}>4</span>
        <span style={{ fontFamily: sans, fontWeight: 900, fontSize: 84, color: YELLOW, WebkitTextStroke: "12px #000", paintOrder: "stroke fill" }}>no 4th</span>
        <span style={{ width: 90, height: 0, borderTop: "10px dashed #ffd400" }} />
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

const ShotView: React.FC<{ shot: Shot; dur: number }> = ({ shot, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(frame, [0, dur], [0, 1], clamp);
  const { cam } = shot;
  const ease = Easing.out(Easing.cubic);
  const snap = cam.snap ? spring({ frame, fps, config: { damping: 14, stiffness: 200 } }) : ease(t);
  const s = cam.s0 + (cam.s1 - cam.s0) * snap;
  const dx = (cam.dx ?? 0) * (t - 0.5) * 2;
  const dy = (cam.dy ?? 0) * (t - 0.5) * 2;
  const shake = shot.shake ? Math.sin(frame * 2.3) * 10 * interpolate(frame, [0, 10], [1, 0], clamp) : 0;
  const fade = shot.fadeIn ? interpolate(frame, [0, 8], [0, 1], clamp) : 1;

  // 자막은 컷 길이를 묶음 수로 나눠서 차례로
  const per = shot.caps.length ? dur / shot.caps.length : dur;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {shot.img && (
        <AbsoluteFill style={{ opacity: fade }}>
          <Img
            src={staticFile(`ep01/${shot.img}.webp`)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transformOrigin: `${cam.ox}px ${cam.oy}px`,
              transform: `translate(${dx + shake}px, ${dy}px) scale(${s})`,
            }}
          />
        </AbsoluteFill>
      )}
      {shot.dark ? <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 30%, rgba(0,0,0,${shot.dark}) 100%)` }} /> : null}
      {shot.overlay && <Overlay kind={shot.overlay} dur={dur} />}
      {shot.caps.map((c, i) => (
        <Sequence key={i} from={Math.round(i * per)} durationInFrames={Math.round(per)} layout="none">
          <Caption cap={c} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const Ep01: React.FC = () => {
  const starts = SHOT_FRAMES.map((_, i) => MAP_OPENING_FRAMES + SHOT_FRAMES.slice(0, i).reduce((a, f) => a + f, 0));
  const firstOfSent = (id: number) => SHOTS.findIndex((x) => x.sent === id);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* 시그니처 오프닝: 지도에서 서울로 쑥 */}
      <Sequence durationInFrames={MAP_OPENING_FRAMES}>
        <MapOpening variant="modern" />
        <Sequence from={6} durationInFrames={32} layout="none">
          <Caption cap={[{ text: "In" }, { text: "Korea,", hl: true }]} />
        </Sequence>
      </Sequence>
      <Sequence from={30} durationInFrames={20} layout="none">
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.45} />
      </Sequence>

      {SHOTS.map((shot, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={SHOT_FRAMES[i]}>
          <ShotView shot={shot} dur={SHOT_FRAMES[i]} />
          {[shot.sfx, shot.sfx2].map((fx, k) =>
            fx ? (
              <Sequence key={k} from={Math.round((fx.at ?? 0) * FPS)} layout="none">
                <Audio src={staticFile(`sfx/${fx.name}.wav`)} volume={fx.vol ?? 0.4} />
              </Sequence>
            ) : null,
          )}
        </Sequence>
      ))}

      {/* 내레이션: 0번 문장은 지도 위, 나머지는 그 문장의 첫 컷에서 시작 */}
      {VO.sentences.map((v) => (
        <Sequence key={v.id} from={v.id === 0 ? 6 : starts[firstOfSent(v.id)]} layout="none">
          <Audio src={staticFile(v.file)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
