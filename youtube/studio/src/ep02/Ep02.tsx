// EP02 "빨간 이름" (대본: youtube/scripts/ep02.md, 문장: youtube/tts/lines/ep02.json)
// EP01과 같은 틀: 컷 = 모형 세상 모드, 컷 길이 = 그 문장 음성 길이를 자막 글자 수 비율로 나눔.
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadNotoSans } from "@remotion/google-fonts/NotoSansKR";
import voEn from "./vo_en.json";
import voEs from "./vo_es.json";
import { Mode02, Scene02, state02, Words02 } from "./Scene02";

const { fontFamily: sans } = loadNotoSans();
const FPS = 30;
const YELLOW = "#ffd400";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Lang = "en" | "es";
type Cap = { text: string; hl?: boolean }[];
type Fx = { name: string; at?: number; vol?: number };
// xfade: 장소가 바뀌는 컷이 앞 컷 위로 겹쳐 들어오는 프레임 수. trans: 넘어가는 방식
//   fade = 흐리게 겹침, ink = 빨간 잉크가 번지며 새 장면이 드러남, flash = 흰 빛이 번쩍하며 바뀜 (video-shotcraft 전환 카드)
type Shot = { mode: Mode02; sent: number; weight?: number; sfx?: Fx[]; shake?: number; xfade?: number; trans?: "fade" | "ink" | "flash" };
const h = (text: string) => ({ text, hl: true });
const w = (text: string) => ({ text });

// weight: 자막 글자 수 대신 쓰는 길이 비율 (짧은 자막인데 장면이 필요할 때)
const SHOTS: Shot[] = [
  { mode: "pen", sent: 0, sfx: [{ name: "ding", at: 0.05, vol: 0.3 }] },
  { mode: "red", sent: 1, weight: 16, sfx: [{ name: "whoosh", at: 0.05, vol: 0.3 }] },
  { mode: "curse", sent: 1, sfx: [{ name: "buzz", at: 0.6, vol: 0.25 }] },
  { mode: "dark", sent: 2, sfx: [{ name: "riser", at: 0.1, vol: 0.25 }] },
  { mode: "banners", sent: 3, weight: 26, xfade: 28, trans: "ink", sfx: [{ name: "whoosh", at: 0.05, vol: 0.3 }] },
  { mode: "tablets", sent: 3 },
  { mode: "bleed", sent: 4, xfade: 9, trans: "fade", sfx: [{ name: "thud", at: 0.2, vol: 0.3 }] },
  { mode: "light", sent: 5, xfade: 6, trans: "flash", sfx: [{ name: "chime", at: 0.1, vol: 0.3 }] },
  { mode: "stamp", sent: 6, shake: 1, sfx: [{ name: "thud", at: 0.28, vol: 0.7 }] },
  { mode: "calm", sent: 6 },
  { mode: "end", sent: 7, sfx: [{ name: "pop", at: 0.75, vol: 0.4 }] },
];

const CAPS: Record<Lang, Cap[][]> = {
  en: [
    [[w("Never write")], [w("a Korean's name")], [w("in this"), h("color.")]],
    [[h("Red.")]],
    [[w("To many Koreans,")], [w("it feels like")], [h("a curse.")]],
    [[w("Why?")], [w("Red has long been")], [w("linked to"), h("the dead.")]],
    [[w("On funeral")], [h("banners")]],
    [[w("and ancestral tablets,")], [w("the names")], [w("of the departed")], [w("were written"), h("in red.")]],
    [[w("So a living name")], [w("in red")], [w("feels like")], [w("wishing them"), h("gone.")]],
    [[w("But there's")], [h("one red name")], [w("nearly every Korean"), w("uses.")]],
    [[w("Their")], [h("name stamp.")], [w("Red ink,")]],
    [[w("on contracts")], [w("and bank papers,")], [w("and nobody"), h("blinks.")]],
    [[w("So why is")], [w("a red"), h("stamp"), w("fine,")], [w("but a red"), h("pen"), w("isn't?")], [w("What do you think?")]],
  ],
  es: [
    [[w("Nunca escribas")], [w("el nombre de un coreano")], [w("en este"), h("color.")]],
    [[h("Rojo.")]],
    [[w("Para muchos coreanos,")], [w("se siente como")], [h("una maldición.")]],
    [[w("¿Por qué?")], [w("El rojo se asocia")], [w("desde hace mucho")], [w("con"), h("los muertos.")]],
    [[w("En estandartes")], [h("de funeral")]],
    [[w("y tablillas de los ancestros,")], [w("los nombres")], [w("de los difuntos")], [w("se escribían"), h("en rojo.")]],
    [[w("Así que un nombre vivo")], [w("en rojo")], [w("parece desearle")], [h("la muerte.")]],
    [[w("Pero hay")], [h("un nombre en rojo")], [w("que casi todos"), w("los coreanos usan.")]],
    [[w("Su")], [h("sello personal.")], [w("Tinta roja,")]],
    [[w("en contratos")], [w("y papeles del banco,")], [w("y nadie"), h("se inmuta.")]],
    [[w("Entonces, ¿por qué")], [w("el"), h("sello"), w("rojo sí,")], [w("y el"), h("bolígrafo"), w("rojo no?")], [w("¿Tú qué crees?")]],
  ],
};

const WORDS: Record<Lang, Words02> = {
  en: { stop: "STOP!", bank: "BANK", contract: "CONTRACT", lang: "en" },
  es: { stop: "¡ALTO!", bank: "BANCO", contract: "CONTRATO", lang: "es" },
};

type Vo = { sentences: { id: number; file: string; sec: number }[] };
const TAIL = 0.12;
const build = (lang: Lang) => {
  const VO = (lang === "es" ? voEs : voEn) as Vo;
  const caps = CAPS[lang];
  const len = (i: number) => SHOTS[i].weight ?? caps[i].flat().reduce((a, x) => a + x.text.length, 0);
  const frames = SHOTS.map((sh, i) => {
    const v = VO.sentences.find((x) => x.id === sh.sent)!;
    const group = SHOTS.map((_, k) => k).filter((k) => SHOTS[k].sent === sh.sent);
    const total = group.reduce((a, k) => a + len(k), 0);
    const isLast = group[group.length - 1] === i;
    return Math.round(((v.sec * len(i)) / total + (isLast ? TAIL : 0)) * FPS);
  });
  const starts = frames.map((_, i) => frames.slice(0, i).reduce((a, f) => a + f, 0));
  return { VO, caps, frames, starts, total: frames.reduce((a, f) => a + f, 0) };
};
export const EP02 = { en: build("en"), es: build("es") };

// 배경음 줄이는 구간(어두운 부분) 초: mix_music.sh 에 넘긴다
export const darkRange = (lang: Lang) => {
  const b = EP02[lang];
  const a = SHOTS.findIndex((s) => s.mode === "dark");
  const z = SHOTS.findIndex((s) => s.mode === "light");
  return [(b.starts[a] + b.frames[a] * 0.3) / FPS, (b.starts[z] + b.frames[z] * 0.4) / FPS];
};

const Caption: React.FC<{ cap: Cap }> = ({ cap }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1180, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 22px", transform: `scale(${0.85 + 0.15 * pop})` }}>
      {cap.map((x, i) => (
        <span key={i} style={{ fontFamily: sans, fontWeight: 900, fontSize: 88, lineHeight: 1.15, textAlign: "center", color: x.hl ? YELLOW : "#fff", WebkitTextStroke: "14px #000", paintOrder: "stroke fill", textShadow: "0 6px 18px rgba(0,0,0,0.55)" }}>
          {x.text}
        </span>
      ))}
    </div>
  );
};

// 잉크 번짐 마스크: 가장자리가 울퉁불퉁한 원이 화면 가운데에서 퍼진다. 매 프레임 같은 모양(난수 고정)
const blob = (g: CanvasRenderingContext2D, cx: number, cy: number, r: number, f: number) => {
  g.beginPath();
  const N = 120;
  for (let k = 0; k <= N; k++) {
    const a = (k / N) * Math.PI * 2;
    const n = 0.13 * Math.sin(a * 5 + 1.3) + 0.08 * Math.sin(a * 11 + 0.4 + f * 0.05) + 0.05 * Math.sin(a * 23 + 2.1) + 0.03 * Math.sin(a * 41 + f * 0.11);
    const rr = r * (1 + n);
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (k === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
};
const inkMasks = (p: number, f: number) => {
  const W = 270, H = 480;
  const r = Math.pow(p, 1.6) * 440 * (1 + 0.06 * Math.sin(f * 0.32) * (1 - p));
  const fill = document.createElement("canvas");
  fill.width = W; fill.height = H;
  const g = fill.getContext("2d")!;
  g.filter = "blur(1.5px)";
  g.fillStyle = "#000";
  blob(g, W * 0.5, H * 0.46, r, f);
  g.fill();
  const rim = document.createElement("canvas");
  rim.width = W; rim.height = H;
  const h2 = rim.getContext("2d")!;
  h2.filter = "blur(2px)";
  h2.fillStyle = "#000";
  blob(h2, W * 0.5, H * 0.46, r + 9, f + 3);
  h2.fill();
  h2.globalCompositeOperation = "destination-out";
  h2.filter = "blur(1px)";
  blob(h2, W * 0.5, H * 0.46, Math.max(0, r - 2), f);
  h2.fill();
  return { fill: fill.toDataURL(), rim: rim.toDataURL() };
};

const ShotView: React.FC<{ shot: Shot; caps: Cap[]; dur: number; words: Words02; pre?: number }> = ({ shot, caps, dur, words, pre = 0 }) => {
  const f0 = useCurrentFrame();
  const frame = f0 - pre;
  const t = interpolate(frame, [0, dur], [0, 1], clamp);
  const kind = shot.trans ?? "fade";
  const inPre = pre > 0 && f0 < pre + 2;
  const fadeIn = pre && kind === "fade" ? interpolate(f0, [0, pre], [0, 1], clamp) : pre && kind === "flash" ? (f0 < pre ? 0 : 1) : 1;
  const ink = pre && kind === "ink" && inPre ? inkMasks(interpolate(f0, [0, pre], [0, 1], clamp), f0) : null;
  const flash = pre && kind === "flash" ? (f0 < pre ? interpolate(f0, [0, pre], [0, 1], clamp) : interpolate(f0, [pre, pre + 8], [1, 0], clamp)) : 0;
  const maskStyle = (url: string): React.CSSProperties => ({ maskImage: `url(${url})`, WebkitMaskImage: `url(${url})`, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" });
  // 도장이 닿는 순간부터 흔들림
  const hit = shot.shake ? Math.round(state02(shot.mode, 0).slamAt * dur) : 0;
  const since = frame - hit;
  const shake = shot.shake && since >= 0 ? Math.sin(since * 2.3) * 14 * interpolate(since, [0, 10], [1, 0], clamp) : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: fadeIn, transform: `translate(${shake}px, ${shake * 0.4}px)`, ...(ink ? maskStyle(ink.fill) : {}) }}>
        <Scene02 mode={shot.mode} t={t} words={words} />
      </AbsoluteFill>
      {ink && <AbsoluteFill style={{ background: "#b3141a", opacity: 0.9, ...maskStyle(ink.rim) }} />}
      {flash > 0 && <AbsoluteFill style={{ background: "#fffaf0", opacity: flash }} />}
    </AbsoluteFill>
  );
};

// 자막은 모든 장면·전환 위에 따로 그린다 (전환이 앞 컷 자막을 가리지 않게)
const CapTrack: React.FC<{ caps: Cap[]; dur: number }> = ({ caps, dur }) => {
  const per = dur / caps.length;
  return (
    <>
      {caps.map((c, i) => (
        <Sequence key={i} from={Math.round(i * per)} durationInFrames={Math.round((i + 1) * per) - Math.round(i * per)} layout="none">
          <Caption cap={c} />
        </Sequence>
      ))}
    </>
  );
};

export const Ep02: React.FC<{ lang?: Lang }> = ({ lang = "en" }) => {
  const b = EP02[lang];
  const firstOf = (id: number) => SHOTS.findIndex((x) => x.sent === id);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {SHOTS.map((shot, i) => (
        <Sequence key={i} from={b.starts[i] - (shot.xfade ?? 0)} durationInFrames={b.frames[i] + (shot.xfade ?? 0)}>
          <ShotView shot={shot} caps={b.caps[i]} dur={b.frames[i]} words={WORDS[lang]} pre={shot.xfade ?? 0} />
          {(shot.sfx ?? []).map((fx, k) => (
            <Sequence key={k} from={(shot.xfade ?? 0) + Math.round((fx.at ?? 0) * FPS)} layout="none">
              <Audio src={staticFile(`sfx/${fx.name}.wav`)} volume={fx.vol ?? 0.4} />
            </Sequence>
          ))}
        </Sequence>
      ))}
      {SHOTS.map((_, i) => (
        <Sequence key={`c${i}`} from={b.starts[i]} durationInFrames={b.frames[i]} layout="none">
          <CapTrack caps={b.caps[i]} dur={b.frames[i]} />
        </Sequence>
      ))}
      {b.VO.sentences.map((v) => (
        <Sequence key={v.id} from={b.starts[firstOf(v.id)]} layout="none">
          <Audio src={staticFile(v.file)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// 점검용: 컷마다 한 장면 (t=0.65)
import { useCurrentFrame as useF } from "remotion";
import { ORDER02 } from "./Scene02";
export const Ep02Check: React.FC = () => {
  const f = useF();
  return <Scene02 mode={ORDER02[f % ORDER02.length]} t={f < ORDER02.length ? 0.15 : 0.85} words={WORDS.en} />;
};
