// EP06 "'나' 대신 '우리'" (대본: youtube/scripts/ep06.md, 문장: youtube/tts/lines/ep06.json)
// EP01과 같은 틀: 컷 = 모형 세상 모드, 컷 길이 = 그 문장 음성 길이를 자막 글자 수 비율로 나눔.
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadNotoSans } from "@remotion/google-fonts/NotoSansKR";
import voEn from "./vo_en.json";
import voEs from "./vo_es.json";
import { Mode06F as Mode06, SceneFable06, Words06F as Words06, ORDER06F } from "../cas/fable/SceneFable06";

const { fontFamily: sans } = loadNotoSans();
const FPS = 30;
const YELLOW = "#ffd400";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Lang = "en" | "es";
type Cap = { text: string; hl?: boolean }[];
type Fx = { name: string; at?: number; u?: number; vol?: number };
// xfade: 장소가 바뀌는 컷이 앞 컷 위로 겹쳐 들어오는 프레임 수. trans: 넘어가는 방식
//   fade = 흐리게 겹침, ink = 빨간 잉크가 번지며 새 장면이 드러남, flash = 흰 빛이 번쩍하며 바뀜 (video-shotcraft 전환 카드)
type Shot = { mode: Mode06; sent: number; weight?: number; sfx?: Fx[]; shake?: number; xfade?: number; trans?: "fade" | "ink" | "flash" };
const h = (text: string) => ({ text, hl: true });
const w = (text: string) => ({ text });

// weight: 자막 글자 수 대신 쓰는 길이 비율 (짧은 자막인데 장면이 필요할 때)
const SHOTS: Shot[] = [
  // 0 외동 거실: MY MOM 말풍선이 깨지고 OUR MOM
  { mode: "onlychild", sent: 0, sfx: [{ name: "glitch", u: 0.62, vol: 0.3 }, { name: "pop", u: 0.72, vol: 0.4 }] },
  // 1 집·학교·나라에 OUR 꼬리표 (세 번 팝)
  { mode: "ours", sent: 1, xfade: 9, trans: "fade", sfx: [{ name: "pop", u: 0.08, vol: 0.3 }, { name: "pop", u: 0.25, vol: 0.3 }, { name: "pop", u: 0.42, vol: 0.3 }] },
  // 2 가족이 둥글게 모이고 원 위에 OUR
  { mode: "group", sent: 2, xfade: 9, trans: "fade", sfx: [{ name: "chime", u: 0.55, vol: 0.3 }] },
  // 3 MY COMPANY = 사장님 / OUR COMPANY = 직원들 사이
  { mode: "company", sent: 3, xfade: 9, trans: "fade", sfx: [{ name: "pop", u: 0.1, vol: 0.35 }, { name: "pop", u: 0.6, vol: 0.35 }] },
  // 4 거리 간판에 우리 ○○가 켜짐
  { mode: "everywhere", sent: 4, xfade: 6, trans: "flash", sfx: [{ name: "pop", u: 0.3, vol: 0.3 }, { name: "pop", u: 0.6, vol: 0.3 }] },
  // 5 MY / OUR 카드 사이 물음표
  { mode: "end", sent: 5, sfx: [{ name: "pop", u: 0.5, vol: 0.4 }] },
];

const CAPS: Record<Lang, Cap[][]> = {
  en: [
    [[w("You're an only child.")], [w("But in Korea,")], [w("your mom is still"), h("our mom.")]],
    [[w("Our house.")], [w("Our school.")], [w("Our country.")], [w("Koreans say"), h("our,"), w("not my.")]],
    [[w("In Korean,")], [w("what belongs to your group")], [w("is"), h("ours.")], [w("Your family is the group,")], [w("so it's"), h("our mom.")]],
    [[w("Say"), h("my company,")], [w("and it sounds like you own it.")], [h("Our company")], [w("means you work there.")]],
    [[w("Once you notice it,")], [w("you hear it"), h("everywhere.")]],
    [[w("In your language,")], [w("do you say"), h("my, or our?")]],
  ],
  es: [
    [[w("Eres hijo único.")], [w("Pero en Corea,")], [w("tu mamá sigue siendo"), h("nuestra mamá.")]],
    [[w("Nuestra casa.")], [w("Nuestra escuela.")], [w("Nuestro país.")], [w("Los coreanos dicen"), h("nuestro,"), w("no mi.")]],
    [[w("En coreano,")], [w("lo que es de tu grupo")], [w("es"), h("nuestro.")], [w("Tu familia es el grupo,")], [w("así que es"), h("nuestra mamá.")]],
    [[w("Si dices"), h("mi empresa,")], [w("suena a que eres el dueño.")], [h("Nuestra empresa")], [w("es donde trabajas.")]],
    [[w("Cuando te das cuenta,")], [w("lo escuchas"), h("en todas partes.")]],
    [[w("En tu idioma,")], [w("¿dices"), h("mi o nuestro?")]],
  ],
};

const WORDS: Record<Lang, Words06> = {
  en: { lang: "en", my: "MY", our: "OUR", myMom: "MY MOM", ourMom: "OUR MOM", house: "OUR HOUSE", school: "OUR SCHOOL", country: "OUR COUNTRY", myCo: "MY COMPANY", ourCo: "OUR COMPANY", boss: "BOSS" },
  es: { lang: "es", my: "MI", our: "NUESTRO", myMom: "MI MAMÁ", ourMom: "NUESTRA MAMÁ", house: "NUESTRA CASA", school: "NUESTRA ESCUELA", country: "NUESTRO PAÍS", myCo: "MI EMPRESA", ourCo: "NUESTRA EMPRESA", boss: "JEFE" },
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
export const EP06 = { en: build("en"), es: build("es") };

const Caption: React.FC<{ cap: Cap }> = ({ cap }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1480, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 22px", transform: `scale(${0.85 + 0.15 * pop})` }}>
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

const ShotView: React.FC<{ shot: Shot; caps: Cap[]; dur: number; words: Words06; pre?: number }> = ({ shot, caps, dur, words, pre = 0 }) => {
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
        <SceneFable06 mode={shot.mode} t={t} words={words} />
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

export const Ep06: React.FC<{ lang?: Lang }> = ({ lang = "en" }) => {
  const b = EP06[lang];
  const firstOf = (id: number) => SHOTS.findIndex((x) => x.sent === id);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {SHOTS.map((shot, i) => (
        <Sequence key={i} from={b.starts[i] - (shot.xfade ?? 0)} durationInFrames={b.frames[i] + (shot.xfade ?? 0)}>
          <ShotView shot={shot} caps={b.caps[i]} dur={b.frames[i]} words={WORDS[lang]} pre={shot.xfade ?? 0} />
          {(shot.sfx ?? []).map((fx, k) => (
            <Sequence key={k} from={(shot.xfade ?? 0) + (fx.u !== undefined ? Math.round(fx.u * b.frames[i]) : Math.round((fx.at ?? 0) * FPS))} layout="none">
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

// 점검용: 컷마다 한 장면 (앞 6장 t=0.15, 뒤 6장 t=0.85)
import { useCurrentFrame as useF } from "remotion";
export const Ep06Check: React.FC = () => {
  const f = useF();
  return <SceneFable06 mode={ORDER06F[f % ORDER06F.length]} t={f < ORDER06F.length ? 0.15 : 0.85} words={WORDS.en} />;
};
