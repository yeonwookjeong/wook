// EP05 "한국 나이가 줄어든 날" (대본: youtube/scripts/ep05.md, 문장: youtube/tts/lines/ep05.json)
// EP01과 같은 틀: 컷 = 모형 세상 모드, 컷 길이 = 그 문장 음성 길이를 자막 글자 수 비율로 나눔.
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadNotoSans } from "@remotion/google-fonts/NotoSansKR";
import voEn from "./vo_en.json";
import voEs from "./vo_es.json";
import { Mode05, Scene05, Words05 } from "./Scene05";

const { fontFamily: sans } = loadNotoSans();
const FPS = 30;
const YELLOW = "#ffd400";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Lang = "en" | "es";
type Cap = { text: string; hl?: boolean }[];
type Fx = { name: string; at?: number; vol?: number };
// xfade: 장소가 바뀌는 컷이 앞 컷 위로 겹쳐 들어오는 프레임 수. trans: 넘어가는 방식
//   fade = 흐리게 겹침, ink = 빨간 잉크가 번지며 새 장면이 드러남, flash = 흰 빛이 번쩍하며 바뀜 (video-shotcraft 전환 카드)
type Shot = { mode: Mode05; sent: number; weight?: number; sfx?: Fx[]; shake?: number; xfade?: number; trans?: "fade" | "ink" | "flash" };
const h = (text: string) => ({ text, hl: true });
const w = (text: string) => ({ text });

// weight: 자막 글자 수 대신 쓰는 길이 비율 (짧은 자막인데 장면이 필요할 때)
const SHOTS: Shot[] = [
  { mode: "baby", sent: 0, sfx: [{ name: "ding", at: 0.1, vol: 0.3 }] },
  { mode: "dec31", sent: 1, sfx: [{ name: "pop", at: 0.5, vol: 0.35 }] },
  { mode: "jan1", sent: 2, sfx: [{ name: "chime", at: 0.6, vol: 0.35 }, { name: "pop", at: 2.4, vol: 0.4 }] },
  { mode: "three", sent: 3, xfade: 9, trans: "fade", sfx: [{ name: "pop", at: 1.2, vol: 0.3 }, { name: "pop", at: 2.3, vol: 0.3 }, { name: "pop", at: 3.4, vol: 0.3 }] },
  { mode: "law", sent: 4, xfade: 6, trans: "flash", sfx: [{ name: "thud", at: 0.2, vol: 0.4 }, { name: "whoosh", at: 2.3, vol: 0.3 }] },
  { mode: "except", sent: 5, xfade: 9, trans: "fade", sfx: [{ name: "buzz", at: 1.6, vol: 0.2 }] },
  { mode: "end", sent: 6, sfx: [{ name: "pop", at: 0.8, vol: 0.4 }] },
];

const CAPS: Record<Lang, Cap[][]> = {
  en: [
    [[w("In Korea,")], [w("a baby could turn")], [h("two years old")], [w("just one day")], [w("after being born.")]],
    [[w("Born on")], [h("December 31st?")], [w("You're one")], [w("on the day you're born.")]],
    [[w("The next morning")], [w("is January first,")], [w("when everyone")], [w("gets a year older together.")], [h("Two.")]],
    [[w("That was"), h("Korean age.")], [w("Add year age")], [w("and international age,")], [w("and many Koreans had")], [h("three ages at once.")]],
    [[w("Then in"), h("June 2023,")], [w("a new law made")], [w("international age")], [w("the standard.")], [w("Overnight, most people got")], [h("one or two years younger.")]],
    [[w("But not everywhere.")], [w("For military service,")], [w("drinking and smoking,")], [w("Korea still"), h("counts by year.")]],
    [[w("So how old")], [h("would you be in Korea?")]],
  ],
  es: [
    [[w("En Corea,")], [w("un bebé podía cumplir")], [h("dos años")], [w("un día")], [w("después de nacer.")]],
    [[w("¿Naciste el")], [h("31 de diciembre?")], [w("Tienes un año")], [w("el mismo día que naces.")]],
    [[w("A la mañana siguiente")], [w("es primero de enero,")], [w("y todos")], [w("cumplen un año juntos.")], [h("Dos.")]],
    [[w("Esa era la"), h("edad coreana.")], [w("Súmale la edad por año")], [w("y la edad internacional,")], [w("y muchos coreanos tenían")], [h("tres edades a la vez.")]],
    [[w("En"), h("junio de 2023,")], [w("una ley hizo oficial")], [w("la edad internacional.")], [w("De la noche a la mañana,")], [w("casi todos rejuvenecieron")], [h("uno o dos años.")]],
    [[w("Pero no en todo.")], [w("Para el servicio militar,")], [w("el alcohol y el tabaco,")], [w("Corea todavía"), h("cuenta por año.")]],
    [[w("¿Cuántos años")], [h("tendrías tú en Corea?")]],
  ],

};

const WORDS: Record<Lang, Words05> = {
  en: { lang: "en", dec: "DEC 31", jan: "JAN 1", korean: "Korean age", year: "Year age", intl: "International age", news: "NEW AGE LAW", army: "MILITARY", store: "BEER & SOJU" },
  es: { lang: "es", dec: "31 DIC", jan: "1 ENE", korean: "Edad coreana", year: "Edad por año", intl: "Edad internacional", news: "NUEVA LEY DE EDAD", army: "SERVICIO MILITAR", store: "CERVEZA Y SOJU" },

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
export const EP05 = { en: build("en"), es: build("es") };

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

const ShotView: React.FC<{ shot: Shot; caps: Cap[]; dur: number; words: Words05; pre?: number }> = ({ shot, caps, dur, words, pre = 0 }) => {
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
  const hit = 0;
  const since = frame - hit;
  const shake = shot.shake && since >= 0 ? Math.sin(since * 2.3) * 14 * interpolate(since, [0, 10], [1, 0], clamp) : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: fadeIn, transform: `translate(${shake}px, ${shake * 0.4}px)`, ...(ink ? maskStyle(ink.fill) : {}) }}>
        <Scene05 mode={shot.mode} t={t} words={words} />
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
        <Sequence key={i} from={Math.round(i * per)} durationInFrames={Math.round(per)} layout="none">
          <Caption cap={c} />
        </Sequence>
      ))}
    </>
  );
};

export const Ep05: React.FC<{ lang?: Lang }> = ({ lang = "en" }) => {
  const b = EP05[lang];
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

// 점검용: 컷마다 한 장면 (앞 7장 t=0.15, 뒤 7장 t=0.85)
import { useCurrentFrame as useF } from "remotion";
import { ORDER05 } from "./Scene05";
export const Ep05Check: React.FC = () => {
  const f = useF();
  return <Scene05 mode={ORDER05[f % ORDER05.length]} t={f < ORDER05.length ? 0.15 : 0.85} words={WORDS.en} />;
};
