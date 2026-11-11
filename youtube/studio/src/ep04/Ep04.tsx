// EP04 "한국 커플이 피하는 것 3가지" 1분 편 (대본: youtube/scripts/ep04.md, 문장: youtube/tts/lines/ep04.json)
// EP01과 같은 틀: 컷 = 모형 세상 모드, 컷 길이 = 그 문장 음성 길이를 자막 글자 수 비율로 나눔.
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadNotoSans } from "@remotion/google-fonts/NotoSansKR";
import voEn from "./vo_en.json";
import voEs from "./vo_es.json";
import { Mode04, Scene04, Words04 } from "./Scene04";

const { fontFamily: sans } = loadNotoSans();
const FPS = 30;
const YELLOW = "#ffd400";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Lang = "en" | "es";
type Cap = { text: string; hl?: boolean }[];
type Fx = { name: string; at?: number; vol?: number };
// xfade: 장소가 바뀌는 컷이 앞 컷 위로 겹쳐 들어오는 프레임 수. trans: 넘어가는 방식
//   fade = 흐리게 겹침, ink = 빨간 잉크가 번지며 새 장면이 드러남, flash = 흰 빛이 번쩍하며 바뀜 (video-shotcraft 전환 카드)
type Shot = { mode: Mode04; sent: number; weight?: number; sfx?: Fx[]; shake?: number; xfade?: number; trans?: "fade" | "ink" | "flash" };
const h = (text: string) => ({ text, hl: true });
const w = (text: string) => ({ text });

// weight: 자막 글자 수 대신 쓰는 길이 비율 (짧은 자막인데 장면이 필요할 때)
const SHOTS: Shot[] = [
  { mode: "intro", sent: 0, sfx: [{ name: "pop", at: 0.5, vol: 0.35 }, { name: "pop", at: 1.4, vol: 0.35 }, { name: "pop", at: 2.3, vol: 0.35 }] },
  { mode: "shoes", sent: 1, sfx: [{ name: "pop", at: 0.4, vol: 0.4 }] },
  { mode: "walk", sent: 2 },
  { mode: "away", sent: 3, sfx: [{ name: "whoosh", at: 1.4, vol: 0.25 }] },
  { mode: "coin", sent: 4, xfade: 9, trans: "fade", sfx: [{ name: "ding", at: 1.2, vol: 0.35 }] },
  { mode: "chicken", sent: 5, xfade: 6, trans: "flash", sfx: [{ name: "whoosh", vol: 0.3 }] },
  { mode: "fly", sent: 6, sfx: [{ name: "whoosh", at: 2.5, vol: 0.3 }] },
  { mode: "plate", sent: 7 },
  { mode: "wall", sent: 8, xfade: 6, trans: "flash", sfx: [{ name: "chime", at: 0.2, vol: 0.3 }] },
  { mode: "split", sent: 9, sfx: [{ name: "buzz", at: 1.2, vol: 0.2 }] },
  { mode: "court", sent: 10, sfx: [{ name: "thud", at: 0.4, vol: 0.3 }] },
  { mode: "gone", sent: 11 },
  { mode: "end", sent: 12, sfx: [{ name: "pop", at: 5.5, vol: 0.4 }] },
];

const CAPS: Record<Lang, Cap[][]> = {
  en: [
    [[w("Korean couples")], [w("avoid these")], [h("three things.")], [w("Number three")], [w("is a street"), w("in Seoul.")]],
    [[h("Number one:")], [w("shoes as a gift.")]],
    [[w("Shoes take you places.")], [w("Including"), h("away.")]],
    [[w("The saying goes:")], [w("give your partner shoes,")], [w("and they'll use them")], [h("to walk away")], [w("from you.")]],
    [[w("Back in the day,")], [w("people even paid")], [h("a coin")], [w("for the shoes,")], [w("so it counted as buying,")], [w("not a gift.")], [w("Today most just")], [w("laugh about it.")]],
    [[h("Number two:")], [w("chicken wings.")]],
    [[w("In Korean,")], [w("the word for"), h("wind")], [w("also means"), h("cheating.")], [w("So feed your partner wings,")], [w("and they might fly off")], [w("with someone else.")]],
    [[w("Funny,")], [w("in a country this crazy")], [w("about fried chicken.")], [w("In some homes,")], [w("the wings quietly end up")], [w("on someone else's plate.")]],
    [[h("Number three:")], [w("the stone wall road")], [w("of Deoksugung Palace.")]],
    [[w("Walk it as a couple,")], [w("the story goes,")], [w("and you'll"), h("break up.")]],
    [[w("Why?")], [w("For years,")], [w("a"), h("family court")], [w("stood nearby,")], [w("and couples walked this road")], [w("on the way")], [w("to their divorce.")]],
    [[w("The court")], [w("moved away long ago.")], [w("The story"), h("stayed.")]],
    [[w("Today it's one of")], [w("the most romantic walks")], [w("in Seoul,")], [w("and couples still walk it,")], [w("holding hands")], [w("a little tighter.")], [w("Which one"), h("would you risk?")]],
  ],
  es: [
    [[w("Las parejas coreanas")], [w("evitan")], [h("estas tres cosas.")], [w("La número tres")], [w("es una calle"), w("de Seúl.")]],
    [[h("Número uno:")], [w("regalar zapatos.")]],
    [[w("Los zapatos")], [w("te llevan a muchos lugares.")], [w("También"), h("lejos.")]],
    [[w("Dicen que si le regalas")], [w("zapatos a tu pareja,")], [w("los usará")], [h("para alejarse")], [w("de ti.")]],
    [[w("Antes, la gente")], [w("hasta pagaba")], [h("una moneda")], [w("por los zapatos,")], [w("para que contara")], [w("como compra")], [w("y no como regalo.")], [w("Hoy casi todos")], [w("se ríen de eso.")]],
    [[h("Número dos:")], [w("las alitas de pollo.")]],
    [[w("En coreano,")], [w("la palabra"), h("viento")], [w("también significa"), h("infidelidad.")], [w("Así que si le das alitas")], [w("a tu pareja,")], [w("podría volar")], [w("con otra persona.")]],
    [[w("Curioso,")], [w("en un país tan loco")], [w("por el pollo frito.")], [w("En algunas casas,")], [w("las alitas terminan")], [w("en otro plato")], [w("sin que nadie diga nada.")]],
    [[h("Número tres:")], [w("el camino del muro de piedra")], [w("del palacio Deoksugung.")]],
    [[w("Dicen que si lo caminas")], [w("en pareja,")], [h("terminarán.")]],
    [[w("¿Por qué?")], [w("Durante años")], [w("hubo un"), h("tribunal de familia")], [w("cerca,")], [w("y las parejas pasaban por aquí")], [w("camino")], [w("al divorcio.")]],
    [[w("El tribunal")], [w("se mudó hace mucho.")], [w("La historia"), h("se quedó.")]],
    [[w("Hoy es uno de")], [w("los paseos más románticos")], [w("de Seúl,")], [w("y las parejas lo siguen caminando,")], [w("tomadas de la mano")], [w("un poco más fuerte.")], [w("¿Cuál"), h("te atreverías a romper?")]],
  ],

};

const WORDS: Record<Lang, Words04> = {
  en: { lang: "en", court: "FAMILY COURT" },
  es: { lang: "es", court: "TRIBUNAL DE FAMILIA" },

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
export const EP04 = { en: build("en"), es: build("es") };

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

const ShotView: React.FC<{ shot: Shot; caps: Cap[]; dur: number; words: Words04; pre?: number }> = ({ shot, caps, dur, words, pre = 0 }) => {
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
        <Scene04 mode={shot.mode} t={t} words={words} />
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

export const Ep04: React.FC<{ lang?: Lang }> = ({ lang = "en" }) => {
  const b = EP04[lang];
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

// 점검용: 컷마다 한 장면 (앞 13장 t=0.15, 뒤 13장 t=0.85)
import { useCurrentFrame as useF } from "remotion";
import { ORDER04 } from "./Scene04";
export const Ep04Check: React.FC = () => {
  const f = useF();
  return <Scene04 mode={ORDER04[f % ORDER04.length]} t={f < ORDER04.length ? 0.15 : 0.85} words={WORDS.en} />;
};
