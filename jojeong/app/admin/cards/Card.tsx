import { Fragment } from "react";
import { monthOf } from "@/lib/chaek";
import { ILGAN, ILJU_TAG_TEXT, iljuFacts, jiaziNo, nextDayOf, stemCure, stemMatches, stemName, stemThing } from "@/lib/cards";
import { josa } from "@/lib/josa";
import { pickDays } from "@/lib/taekil";
import { figureById, figureChart } from "@/lib/figures";
import { monthPillarOf, rankMonth, SIXTY, type IljuMonth } from "@/lib/iljuRank";
import { ANIMALS, BRANCHES, BRANCHES_KO, STEMS, STEMS_KO } from "@/lib/saju";

// Social cards, 1080×1440 (Instagram 3:4, the profile grid's own shape, so nothing is cropped there), drawn in the site's own look. Owner only. Each slide is one URL
// (?c=…), so a screenshot of the page is the image.
const HANJI = "#f4ecdb";
const INK = "#211b17";
const SOFT = "#62564c";
const SEAL = "#b3261e";
const GOLD = "#d4af5f";
const serif = "var(--font-heading)";
const sans = '"Pretendard Variable", Pretendard, system-ui, sans-serif';
const NUM = ["一", "二", "三", "四", "五"];

function Frame({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      data-card
      style={{
        position: "fixed",
        inset: 0,
        width: 1080,
        height: 1440,
        zIndex: 50,
        background: dark ? "linear-gradient(180deg,#0f2236,#17304a 55%,#1f3d5c)" : HANJI,
        backgroundImage: dark
          ? undefined
          : "radial-gradient(circle at 18% 8%, rgba(255,255,255,.6), transparent 42%), radial-gradient(circle at 85% 92%, rgba(168,122,34,.12), transparent 48%)",
        color: dark ? HANJI : INK,
        fontFamily: serif,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 36, border: `3px solid ${dark ? "rgba(212,175,95,.55)" : "rgba(179,38,30,.55)"}` }} />
      <div style={{ position: "absolute", inset: 48, border: `1.5px solid ${dark ? "rgba(212,175,95,.35)" : "rgba(179,38,30,.3)"}` }} />
      {children}
    </div>
  );
}

// Reels and stories, 1080×1920 (9:16): one dense picture people stop to read. Instagram lays its own buttons over
// the bottom fifth and the right edge, so the content keeps to the top four fifths.
// Where a reel's content survives Instagram's player, checked on a tall phone (the picture fills the screen and is
// cropped about 100px at each side): below the status bar and the 릴스·친구 tabs (top), above the account and caption
// (bottom), and clear of the like/comment column that runs down the right edge from about y 1040 (x past 880).
// Measured again on the posted 띠 궁합 reel (10/3): the picture is cropped about 50px a side, the account row
// starts near y 1700 and the like column's heart near y 1150 (x past 900), so content may run down to about 1640.
const REEL = { top: 250, side: 100, bottom: 1640 };

function ReelFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-card
      style={{
        position: "fixed",
        inset: 0,
        width: 1080,
        height: 1920,
        zIndex: 50,
        background: "linear-gradient(180deg,#0f2236,#17304a 55%,#1f3d5c)",
        color: HANJI,
        fontFamily: serif,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 64, textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
        <span
          style={{
            width: 58,
            height: 58,
            border: `4px solid ${SEAL}`,
            color: SEAL,
            background: dark ? HANJI : "transparent",
            display: "grid",
            placeItems: "center",
            fontSize: 22,
            fontWeight: 800,
            lineHeight: 1,
            transform: "rotate(-4deg)",
          }}
        >
          訓<br />導
        </span>
        <span style={{ fontSize: 38, fontWeight: 800 }}>훈도사주</span>
      </div>
      <p style={{ marginTop: 8, fontSize: 30, letterSpacing: "0.04em", color: dark ? "rgba(244,236,219,.85)" : SOFT }}>hundosaju.com</p>
    </div>
  );
}

// The sixty-pillar characters in a brush hand (Google Fonts, OFL, cut down to the 22 stems and branches in
// public/fonts). ?hf= picks one while we choose: syuku (default), boku, mai.
const BRUSHES = ["syuku", "boku", "mai"] as const;
function BrushFont({ hf }: { hf: string }) {
  const pick = BRUSHES.includes(hf as (typeof BRUSHES)[number]) ? hf : "syuku";
  return <style>{`@font-face{font-family:"GanzhiBrush";src:url(/fonts/ganzhi-${pick}.woff2) format("woff2");font-display:block}`}</style>;
}
const brush = '"GanzhiBrush", var(--font-heading)';

// 1·2·3위: a round medal in gold, silver and bronze, rimmed like the site's seals.
const MEDAL = [
  { face: "radial-gradient(circle at 35% 30%, #fff3c4, #e2bd62 45%, #a87a22)", rim: "#8a6214" },
  { face: "radial-gradient(circle at 35% 30%, #ffffff, #c9ced6 45%, #8e959f)", rim: "#6f7580" },
  { face: "radial-gradient(circle at 35% 30%, #ffdcbf, #c98b55 45%, #8e5429)", rim: "#6e3f1c" },
];
function Medal({ n, size }: { n: number; size: number }) {
  const md = MEDAL[n - 1];
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: md.face,
        border: `${Math.round(size / 18)}px solid ${md.rim}`,
        boxShadow: `inset 0 0 0 ${Math.round(size / 14)}px rgba(255,255,255,.35), 0 4px 10px rgba(0,0,0,.25)`,
        display: "grid",
        placeItems: "center",
        color: md.rim,
        fontSize: Math.round(size * 0.46),
        fontWeight: 800,
        fontFamily: serif,
        flexShrink: 0,
      }}
    >
      {n}
    </span>
  );
}

// The feed thumbnail's two-line title over the bottom of the cover, on a gradient so it reads over anything.
function ThumbTitle({ top, main }: { top: string; main: React.ReactNode }) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 560,
          background: "linear-gradient(180deg, rgba(10,20,34,0) 0%, rgba(10,20,34,.78) 42%, rgba(10,20,34,.96) 100%)",
        }}
      />
      <div style={{ position: "absolute", left: 70, right: 70, bottom: 92 }}>
        <p style={{ fontSize: 50, fontWeight: 800, color: "#f4ecdb", letterSpacing: "0.01em" }}>{top}</p>
        <p style={{ marginTop: 6, fontSize: 92, fontWeight: 800, lineHeight: 1.12, color: "#f1cf7a" }}>{main}</p>
      </div>
    </>
  );
}

// The profile's pinned row: one 3240×1440 picture (pin-wide) of a night over the 관상감 courtyard, the hall on
// the left, its mirror on the right, 정 훈도 standing between, that is cut into three 3:4 posts (pin-1 … pin-3)
// sitting side by side in the grid. Each third is the same picture slid along, so the seams meet exactly;
// faces and words keep 60px from every seam (the grid's white gaps).
function starField(): { x: number; y: number; r: number; o: number }[] {
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  return Array.from({ length: 190 }, () => ({ x: rnd() * 3240, y: rnd() * 760, r: 1.5 + rnd() * 3, o: 0.35 + rnd() * 0.65 }));
}

function PinBanner({ k }: { k: 0 | 1 | 2 | null }) {
  const stars = starField();
  const fade = (dir: "90deg" | "270deg") => `linear-gradient(${dir}, #000 72%, transparent 100%)`;
  return (
    <div
      data-card
      style={{ position: "fixed", inset: 0, width: k === null ? 3240 : 1080, height: 1440, zIndex: 50, overflow: "hidden", fontFamily: serif, color: HANJI }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: -(k ?? 0) * 1080,
          width: 3240,
          height: 1440,
          background: "linear-gradient(180deg, #0e2041 0%, #142a4c 40%, #1a2d4e 58%, #2a2c3c 76%, #4a3b35 90%, #3a2e2b 100%)",
        }}
      >
        {stars.map((st, i) => (
          <span key={i} style={{ position: "absolute", left: st.x, top: st.y, width: st.r, height: st.r, borderRadius: "50%", background: "#fff6dc", opacity: st.o }} />
        ))}
        {/* One milky way across the whole row. */}
        <div style={{ position: "absolute", left: -300, top: 40, width: 3840, height: 420, transform: "rotate(-6deg)", background: "radial-gradient(ellipse at center, rgba(200,212,255,.22), rgba(200,212,255,.08) 45%, transparent 72%)" }} />

        {/* Far mountains behind the whole row, and the main hall of the 관상감 behind 정 훈도, so the middle third
            is a courtyard too, not an empty sky. */}
        <svg style={{ position: "absolute", left: 0, top: 0 }} width={3240} height={1440}>
          <defs>
            <linearGradient id="pinMt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#24406a" />
              <stop offset="1" stopColor="#182a48" />
            </linearGradient>
            <linearGradient id="pinRoof" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3b3433" />
              <stop offset="1" stopColor="#141010" />
            </linearGradient>
            <radialGradient id="pinWin" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#ffe4a8" />
              <stop offset="1" stopColor="#e79a45" />
            </radialGradient>
          </defs>
          <filter id="pinHaze">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          {/* Two ridges of far hills, soft and close to the sky's colour, so they read as distance, not shapes. */}
          <path
            d="M0 900 C 260 840, 420 880, 620 830 S 980 800, 1240 850 S 1640 790, 1900 830 S 2300 860, 2560 810 S 3000 850, 3240 820 L3240 1120 L0 1120 Z"
            fill="url(#pinMt)"
            opacity={0.7}
            filter="url(#pinHaze)"
          />
          <path
            d="M0 975 C 300 935, 520 965, 760 940 S 1180 960, 1420 935 S 1860 965, 2100 940 S 2560 930, 2800 955 S 3100 940, 3240 950 L3240 1140 L0 1140 Z"
            fill="#16263f"
            opacity={0.85}
            filter="url(#pinHaze)"
          />
          {/* A waning moon: the morning moon of these days. */}
          {/* Cut out with a mask, not painted over, so no dark disc shows against the sky. */}
          <mask id="pinMoon">
            <circle cx={1300} cy={430} r={58} fill="#fff" />
            <circle cx={1326} cy={414} r={56} fill="#000" />
          </mask>
          <circle cx={1300} cy={430} r={58} fill="#fff4d6" opacity={0.95} mask="url(#pinMoon)" />
        </svg>

        {/* The hall on the left and its mirror on the right, fading into one courtyard. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cards/gwansanggam.webp"
          alt=""
          style={{ position: "absolute", left: 0, top: 0, width: 1152, height: 1440, objectFit: "cover", maskImage: fade("90deg"), WebkitMaskImage: fade("90deg") }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cards/gwansanggam.webp"
          alt=""
          style={{
            position: "absolute",
            left: 3240 - 1152,
            top: 0,
            width: 1152,
            height: 1440,
            objectFit: "cover",
            transform: "scaleX(-1)",
            maskImage: fade("90deg"),
            WebkitMaskImage: fade("90deg"),
          }}
        />
        {/* One courtyard floor under all three, lit warm like the painting's, with no lines drawn on it; the lanterns stand
            inside the middle third, clear of the seams, so no post shows half of one. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 330,
            background:
              "linear-gradient(180deg, rgba(92,72,58,0) 0%, rgba(110,86,66,.8) 30%, #6a5240 62%, #4a3a30 100%)",
          }}
        />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 360, background: "radial-gradient(ellipse 1500px 300px at 1620px 360px, rgba(240,170,90,.42), transparent 75%)" }} />
        {[1250, 1990].map((x) => (
          <div key={x} style={{ position: "absolute", left: x - 44, bottom: 120, width: 88 }}>
            <div style={{ width: 88, height: 18, background: "#2a211e", borderRadius: 4 }} />
            <div
              style={{
                margin: "0 auto",
                width: 62,
                height: 82,
                background: "radial-gradient(circle at 50% 45%, #ffe2a3, #f0a94c 55%, #b5651d)",
                border: "6px solid #2a211e",
                boxShadow: "0 0 70px 26px rgba(255,190,110,.45)",
              }}
            />
            <div style={{ margin: "0 auto", width: 26, height: 70, background: "#2a211e" }} />
            <div style={{ width: 88, height: 16, background: "#2a211e", borderRadius: 4 }} />
          </div>
        ))}
        {/* 북두칠성 drawn across the middle and right thirds: the 관상감 watched these stars. */}
        <svg style={{ position: "absolute", left: 0, top: 0 }} width={3240} height={700}>
          {(() => {
            const pts: [number, number][] = [
              [1830, 520],
              [2050, 470],
              [2260, 430],
              [2470, 400],
              [2560, 250],
              [2860, 230],
              [2900, 420],
            ];
            const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
            return (
              <>
                <polyline points={line} fill="none" stroke="rgba(241,207,122,.45)" strokeWidth={3} strokeDasharray="10 10" />
                <line x1={2470} y1={400} x2={2900} y2={420} stroke="rgba(241,207,122,.45)" strokeWidth={3} strokeDasharray="10 10" />
                {pts.map(([x, y], i) => (
                  <g key={i}>
                    <circle cx={x} cy={y} r={22} fill="rgba(255,240,200,.18)" />
                    <circle cx={x} cy={y} r={9} fill="#fff4d6" />
                  </g>
                ))}
              </>
            );
          })()}
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 700, background: "linear-gradient(180deg, rgba(10,22,40,.6), transparent)" }} />

        {/* ① the name and the hook, on a sheet of 한지 that reads first in the grid */}
        <div
          className="doc-paper"
          style={{ position: "absolute", left: 90, top: 200, width: 900, padding: "60px 60px 56px", color: INK, boxShadow: "0 18px 40px rgba(0,0,0,.45)" }}
        >
          <p style={{ display: "inline-block", padding: "8px 22px", border: `3px solid ${SEAL}`, color: SEAL, fontSize: 30, fontWeight: 800, letterSpacing: "0.12em" }}>
            觀象監 · 훈도사주
          </p>
          {/* The site's promise, the same words as its first screen and the profile: what is said fits one person. */}
          <p style={{ marginTop: 40, fontSize: 96, fontWeight: 800, lineHeight: 1.18, letterSpacing: "-0.02em" }}>
            누구에게나
            <br />
            맞는 말 말고
            <br />
            <span style={{ color: SEAL }}>
              나한테만
              <br />
              맞는 사주
            </span>
          </p>
          <p style={{ marginTop: 34, fontSize: 32, fontWeight: 800, color: SOFT, fontFamily: sans, letterSpacing: "0.02em" }}>
            사주 · 연애 · 궁합 · 신년 운세 · 택일
          </p>
          <p
            style={{
              display: "inline-block",
              marginTop: 44,
              padding: "20px 44px",
              borderRadius: 999,
              background: SEAL,
              color: HANJI,
              fontSize: 36,
              fontWeight: 800,
              fontFamily: sans,
            }}
          >
            내 사주 보러 가기 →
          </p>
        </div>

        {/* ② 정 훈도, standing in the courtyard */}
        <div style={{ position: "absolute", left: 1080 + 80, top: 130, width: 920, textAlign: "center", textShadow: "0 3px 18px rgba(0,0,0,.6)" }}>
          <p style={{ fontSize: 34, letterSpacing: "0.4em", color: GOLD, fontWeight: 800 }}>鄭 訓導</p>
          <p style={{ marginTop: 10, fontSize: 58, fontWeight: 800 }}>명과학 훈도 정가</p>
        </div>
        {/* The 관상감 main hall, far behind 정 훈도: the same painting, smaller and dimmer, so it reads as distance. */}
        <div
          style={{
            position: "absolute",
            left: 1620 - 470,
            top: 820,
            width: 940,
            height: 360,
            overflow: "hidden",
            maskImage: "linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              maskImage: "linear-gradient(180deg, transparent 0%, #000 38%, #000 82%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 38%, #000 82%, transparent 100%)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cards/gwansanggam.webp"
              alt=""
              style={{ position: "absolute", left: -20, top: -745, width: 1346, height: 1682, maxWidth: "none", filter: "brightness(.72) saturate(.9) blur(1px)" }}
            />
          </div>
        </div>
        <div style={{ position: "absolute", left: 1620 - 340, top: 520, width: 680, height: 680, borderRadius: "50%", background: "radial-gradient(circle, rgba(241,207,122,.2), transparent 68%)" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cards/hundo-scroll.webp"
          alt=""
          style={{ position: "absolute", left: 1620 - 440, bottom: 34, width: 880, height: 1100, objectFit: "contain", filter: "drop-shadow(0 18px 26px rgba(0,0,0,.55))" }}
        />

        {/* ③ the hall, and where to find it */}
        <p style={{ position: "absolute", left: 2160, width: 1080, bottom: 70, textAlign: "center", fontSize: 44, fontWeight: 800, color: "#f1cf7a", textShadow: "0 3px 18px rgba(0,0,0,.7)" }}>
          hundosaju.com
        </p>
      </div>
    </div>
  );
}

// The brand in the top corner, for covers whose bottom carries the thumbnail title.
function CornerBrand({ top = 64, left = 70 }: { top?: number; left?: number } = {}) {
  return (
    <div style={{ position: "absolute", top, left, display: "flex", alignItems: "center", gap: 12 }}>
      <span
        style={{
          width: 50,
          height: 50,
          border: `4px solid ${SEAL}`,
          color: SEAL,
          background: HANJI,
          display: "grid",
          placeItems: "center",
          fontSize: 19,
          fontWeight: 800,
          lineHeight: 1,
          transform: "rotate(-4deg)",
        }}
      >
        訓<br />導
      </span>
      <span style={{ fontSize: 32, fontWeight: 800, color: HANJI }}>훈도사주</span>
    </div>
  );
}

function Hundo({ src, size = 300, bottom = 210 }: { src: string; size?: number; bottom?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom,
        left: "50%",
        transform: "translateX(-50%)",
        width: size,
        height: size,
        borderRadius: "50%",
        border: `6px solid ${GOLD}`,
        boxShadow: "0 0 0 10px rgba(212,175,95,.18)",
        background: HANJI,
        overflow: "hidden",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%" }} />
    </div>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => <p style={{ fontSize: 32, fontWeight: 800, color: SEAL }}>{children}</p>;
const Body = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <p style={{ fontSize: 34, lineHeight: 1.7, color: SOFT, fontFamily: sans, ...style }}>{children}</p>
);

export type CardQuery = Record<string, string | string[] | undefined>;

// One slide, from the same query the page takes (?c=…). The SNS page draws a whole day's set with it.
export async function Card({ q }: { q: CardQuery }) {
  const c = typeof q.c === "string" ? q.c : "cta";
  const s = Math.min(9, Math.max(0, Number(q.s ?? 2) || 0));

  // ① 10일간 도감: cover
  if (c === "ilgan-cover")
    return (
      <Frame dark>
        <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center" }}>
          <p style={{ fontSize: 34, letterSpacing: "0.3em", color: GOLD, fontWeight: 800 }}>十日干 圖鑑 · No.{s + 1}</p>
          <p style={{ marginTop: 50, fontSize: 124, fontWeight: 800, lineHeight: 1.1 }}>{stemName(s).replace(/\(.*\)/, "")}</p>
          <p style={{ marginTop: 10, fontSize: 60, fontWeight: 800, color: "#f0c9a0" }}>{stemName(s).match(/\((.*)\)/)?.[1]}</p>
          <p style={{ marginTop: 40, fontSize: 44, lineHeight: 1.5, color: "rgba(244,236,219,.9)" }}>{josa(stemThing(s), "을/를")} 닮은 사람</p>
          <p style={{ marginTop: 36, fontSize: 30, color: GOLD }}>넘겨서 나랑 맞는지 보기 →</p>
        </div>
        <Hundo src="/hundo-fan.png" />
        <Brand dark />
      </Frame>
    );

  // ① 10일간 도감: the person
  if (c === "ilgan") {
    const x = ILGAN[s];
    return (
      <Frame>
        <div style={{ position: "absolute", top: 130, left: 100, right: 100 }}>
          <Label>10일간 도감 · {stemName(s)}</Label>
          <p style={{ marginTop: 26, fontSize: 76, fontWeight: 800, lineHeight: 1.3 }}>
            {stemName(s).replace(/\(.*\)/, "")} 사람의 특징
          </p>
          <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 34 }}>
            {x.traits.map((t, i) => (
              <p key={t} style={{ display: "flex", gap: 24, fontSize: 44, fontWeight: 700, lineHeight: 1.4 }}>
                <span style={{ color: SEAL, width: 44, flexShrink: 0 }}>{NUM[i]}</span>
                {t}
              </p>
            ))}
          </div>
          <div style={{ marginTop: 44, height: 3, background: "rgba(179,38,30,.3)" }} />
          <div style={{ marginTop: 44, display: "grid", gridTemplateColumns: "190px 1fr", rowGap: 24, fontSize: 40, lineHeight: 1.45 }}>
            <b style={{ color: SEAL }}>화날 때</b>
            <span style={{ fontFamily: sans }}>{x.angry}</span>
            <b style={{ color: SEAL }}>연애할 때</b>
            <span style={{ fontFamily: sans }}>{x.love}</span>
          </div>
          <p style={{ marginTop: 50, padding: "24px 30px", borderRadius: 20, background: "rgba(179,38,30,.08)", fontSize: 32, lineHeight: 1.6, fontFamily: sans }}>
            {stemCure(s)}.
          </p>
        </div>
        <Brand />
      </Frame>
    );
  }

  // ⑤ 일간 궁합표
  if (c === "match") {
    const m = stemMatches(s);
    const rows = [
      { mark: "찰떡", who: stemName(m.bond), why: "천간합: 이유 없이 끌리고, 만나면 편한 사이" },
      { mark: "든든", who: m.feeds.map(stemName).join(" · "), why: "나를 키워 주는 기운: 기대면 힘이 나는 사이" },
      { mark: "자극", who: m.tests.map(stemName).join(" · "), why: "나를 다듬는 기운: 부딪히며 같이 크는 사이" },
    ];
    return (
      <Frame>
        <div style={{ position: "absolute", top: 130, left: 100, right: 100 }}>
          <Label>일간 궁합표 · {stemName(s)}</Label>
          <p style={{ marginTop: 26, fontSize: 64, fontWeight: 800, lineHeight: 1.3 }}>
            {josa(stemName(s).replace(/\(.*\)/, ""), "과/와")}
            <br />잘 맞는 일간은?
          </p>
          <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 24 }}>
            {rows.map((r, i) => (
              <div
                key={r.mark}
                style={{ padding: "26px 32px", borderRadius: 24, background: i === 0 ? "rgba(179,38,30,.1)" : "rgba(33,27,23,.05)", border: i === 0 ? `3px solid ${SEAL}` : "3px solid transparent" }}
              >
                <p style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
                  <b style={{ fontSize: 34, color: SEAL }}>{r.mark}</b>
                  <b style={{ fontSize: 42 }}>{r.who}</b>
                </p>
                <p style={{ marginTop: 10, fontSize: 30, color: SOFT, fontFamily: sans }}>{r.why}</p>
              </div>
            ))}
          </div>
          <Body style={{ marginTop: 36, fontSize: 28 }}>일간끼리는 맛보기예요. 진짜 궁합은 두 사람의 여덟 글자 전부로 봐요.</Body>
        </div>
        <Brand />
      </Frame>
    );
  }

  // ② 60일주 도감
  // 60일주 월간 랭킹, posted on the day the 절기 month begins (?y=&m= the calendar month it begins in).
  // A month's 손 없는 날 (lunar days ending in 9 and 0) on one calendar, for a reel people save before moving.
  // 얼굴 많이 보는 남자 일주: the four day pillars whose day branch is a 도화 (子午卯酉) holding the man's 재성, the
  // only four of the sixty (checked against every pillar); 戊子 and 壬午 also join in secret (戊癸, 丁壬 암합).
  if (c === "face-reel") {
    const ROWS = [
      { hanja: "戊子", name: "무자일주", line: "첫눈에 반하면 그날로 직진" },
      { hanja: "壬午", name: "임오일주", line: "사진 한 장 보고 이미 마음 정함" },
      { hanja: "辛卯", name: "신묘일주", line: "얼굴 보고, 옷 센스 보고, 손끝까지 봄" },
      { hanja: "丁酉", name: "정유일주", line: "예쁜 걸 보면 \"예쁘다\"가 바로 나옴" },
    ];
    return (
      <ReelFrame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: REEL.top, left: REEL.side, right: REEL.side, textAlign: "center" }}>
          <p style={{ fontSize: 34, fontWeight: 800, letterSpacing: "0.06em", color: GOLD }}>60일주 가운데 딱 넷</p>
          <p style={{ marginTop: 14, fontSize: 86, fontWeight: 800, lineHeight: 1.15 }}>
            <span style={{ color: "#f1cf7a" }}>얼굴</span> 많이 보는
            <br />
            남자 일주
          </p>
        </div>
        <div style={{ position: "absolute", top: 570, left: 150, width: 780, display: "flex", flexDirection: "column", gap: 26 }}>
          {ROWS.map((r) => (
            <div key={r.hanja} className="doc-paper" style={{ display: "flex", alignItems: "center", gap: 22, padding: "34px 56px 34px 24px", color: INK }}>
              <span style={{ width: 190, flexShrink: 0, textAlign: "center", whiteSpace: "nowrap", fontSize: 78, lineHeight: 1, color: SEAL, fontFamily: brush }}>{r.hanja}</span>
              <span style={{ minWidth: 0 }}>
                <b style={{ display: "block", fontSize: 44 }}>{r.name}</b>
                <span style={{ display: "block", marginTop: 6, fontSize: 30, lineHeight: 1.35, color: SOFT, fontFamily: sans, fontWeight: 700 }}>{r.line}</span>
              </span>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", top: 1470, left: 150, width: 780, textAlign: "center" }}>
          <p style={{ fontSize: 30, lineHeight: 1.45, color: "rgba(244,236,219,.88)", fontFamily: sans }}>배우자 자리에 끌림의 별을 품고 태어난 일주</p>
          <p style={{ marginTop: 14, fontSize: 36, lineHeight: 1.4, fontWeight: 800, color: "#f1cf7a" }}>여기 그대 일주가 없사옵니까?</p>
          <p style={{ marginTop: 6, fontSize: 28, color: "rgba(244,236,219,.8)", fontFamily: sans }}>프로필 링크에서 내 일주 확인</p>
        </div>
      </ReelFrame>
    );
  }

  // 2026년(丙午)을 돌아보며: the 띠 the year's 午 joined (寅·戌 삼합, 未 육합) and the ones it shook (子 충, 午 its
  // own year, 丑 원진), with every year of birth 1960–2010 computed from the branch, never typed in.
  if (c === "y2026-reel") {
    const yearsOf = (b: number) => Array.from({ length: 51 }, (_, i) => 1960 + i).filter((y) => (y - 4 + 1200) % 12 === b);
    const BOXES = [
      {
        head: "올해 사람이 붙은 년생",
        sub: "올해 도와주는 사람이 자꾸 나타났다면",
        color: "#3d6656",
        rows: [
          { b: 2, why: "寅午 삼합" },
          { b: 10, why: "午戌 삼합" },
          { b: 7, why: "午未 육합", note: "삼재 한가운데였지만 손잡아 준 해" },
        ],
      },
      {
        head: "올해 판이 흔들린 년생",
        sub: "올해 이사·이직·이별이 몰렸다면",
        color: SEAL,
        rows: [
          { b: 0, why: "子午 충" },
          { b: 6, why: "내 띠의 해" },
          { b: 1, why: "丑午 원진" },
        ],
      },
    ];
    const boxTop = [548, 1006];
    // Each 띠 with its animal, so the row is found at a glance.
    const FACE = ["🐭", "🐮", "🐯", "🐰", "🐲", "🐍", "🐴", "🐑", "🐵", "🐔", "🐶", "🐷"];
    return (
      <ReelFrame>
        <div style={{ position: "absolute", top: REEL.top, left: REEL.side, right: REEL.side, textAlign: "center" }}>
          <p style={{ fontSize: 34, fontWeight: 800, letterSpacing: "0.06em", color: GOLD }}>2026년 붉은 말의 해, 석 달 남았습니다</p>
          <p style={{ marginTop: 12, fontSize: 74, fontWeight: 800, lineHeight: 1.18 }}>
            올해 <span style={{ color: "#9fd3b4" }}>사람이 붙은</span> 년생
            <br />
            vs <span style={{ color: "#f08a80" }}>판이 흔들린</span> 년생
          </p>
        </div>
        {BOXES.map((box, bi) => (
          <div
            key={box.head}
            className="doc-paper"
            style={{ position: "absolute", top: boxTop[bi], left: 150, width: 780, padding: "20px 64px 18px 30px", color: INK }}
          >
            <b style={{ display: "block", fontSize: 40, color: box.color }}>{box.head}</b>
            <span style={{ display: "block", marginTop: 2, fontSize: 25, fontWeight: 800, color: SOFT, fontFamily: sans }}>{box.sub}</span>
            {box.rows.map((r) => (
              <div key={r.b} style={{ marginTop: 10, paddingTop: 10, borderTop: "1.5px solid rgba(179,38,30,.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ width: 228, flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 54, lineHeight: 1 }}>{FACE[r.b]}</span>
                    <span>
                      <b style={{ display: "block", fontSize: 32, lineHeight: 1.15, whiteSpace: "nowrap" }}>{ANIMALS[r.b]}띠</b>
                      <span style={{ display: "block", fontSize: 18, fontWeight: 800, whiteSpace: "nowrap", color: box.color, fontFamily: sans }}>{r.why}</span>
                    </span>
                  </span>
                  <b style={{ fontSize: 40, whiteSpace: "nowrap", color: box.color }}>
                    {yearsOf(r.b)
                      .map((y) => String(y).slice(2))
                      .join(" · ")}
                  </b>
                </div>
                {r.note && <p style={{ marginTop: 2, marginLeft: 242, fontSize: 21, fontWeight: 800, color: box.color, fontFamily: sans }}>{r.note}</p>}
              </div>
            ))}
          </div>
        ))}
        <div style={{ position: "absolute", top: 1440, left: 150, width: 780, textAlign: "center" }}>
          <p style={{ fontSize: 31, lineHeight: 1.4, fontWeight: 800, color: "#f1cf7a" }}>흔들린 만큼 판이 바뀐 해 · 남은 석 달은 정리하는 때</p>
          <p style={{ marginTop: 8, fontSize: 24, lineHeight: 1.45, color: "rgba(244,236,219,.8)", fontFamily: sans }}>
            띠는 여덟 글자 중 한 글자 · 내 2026년 전체는 프로필 링크에서
            <br />
            1월~2월 초(입춘 전)에 태어났다면 앞 해의 띠예요
          </p>
        </div>
      </ReelFrame>
    );
  }

  // 내 사주에 없는 오행, 몇 %: every chart a person born 1960–2010 can have (each day × the twelve hours,
  // 223,536 charts), counted with the site's own reading (lib/myeongri.ts readChart().missing, the eight
  // characters as written). Computed once offline; the numbers are fixed facts of the calendar.
  if (c === "ohaeng-reel") {
    const MISSING = [
      { el: 2, hanja: "土", word: "흙", pct: 7.6, note: "가장 희귀" },
      { el: 1, hanja: "火", word: "불", pct: 19.5 },
      { el: 4, hanja: "水", word: "물", pct: 19.8 },
      { el: 3, hanja: "金", word: "쇠", pct: 20.2 },
      { el: 0, hanja: "木", word: "나무", pct: 20.5 },
    ];
    const COUNT = [
      { n: "다섯 다 있음", pct: 30.4 },
      { n: "하나 없음", pct: 52.5, note: "제일 흔함" },
      { n: "둘 없음", pct: 16.3 },
      { n: "셋 없음", pct: 0.8, note: "초희귀" },
    ];
    const EL = ["#3d6656", "#b3261e", "#a87a22", "#7d8590", "#1f3d5c"];
    // The right padding keeps the numbers clear of the like column (x past 900, from y ~1150).
    const panel = { left: 150, width: 780, padding: "22px 64px 24px 30px", color: INK } as const;
    const bar = (pct: number, max: number, color: string) => (
      <div style={{ flex: 1, height: 26, borderRadius: 13, background: "rgba(33,27,23,.07)", overflow: "hidden" }}>
        <div style={{ width: `${Math.max(2, (pct / max) * 100)}%`, height: "100%", borderRadius: 13, background: color }} />
      </div>
    );
    return (
      <ReelFrame>
        <div style={{ position: "absolute", top: REEL.top, left: REEL.side, right: REEL.side, textAlign: "center" }}>
          <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: "0.04em", color: GOLD }}>1960~2010년생 사주 22만 개를 전부 세어 봤어요</p>
          <p style={{ marginTop: 14, fontSize: 80, fontWeight: 800, lineHeight: 1.15 }}>
            내 사주에 <span style={{ color: "#f1cf7a" }}>없는 오행</span>
            <br />몇 %일까?
          </p>
        </div>
        <div className="doc-paper" style={{ position: "absolute", top: 530, ...panel }}>
          <p style={{ fontSize: 30, fontWeight: 800, fontFamily: sans }}>이 오행이 없는 사주</p>
          {MISSING.map((m, i) => (
            <div key={m.el} style={{ display: "flex", alignItems: "center", gap: 18, height: 86, borderTop: i ? "1.5px solid rgba(179,38,30,.13)" : "none" }}>
              <span style={{ width: 150, flexShrink: 0, display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontSize: 46, lineHeight: 1, color: EL[m.el] }}>{m.hanja}</span>
                <b style={{ fontSize: 32 }}>{m.word}</b>
              </span>
              {bar(m.pct, 21, EL[m.el])}
              <span style={{ width: 190, flexShrink: 0, textAlign: "right" }}>
                <b style={{ fontSize: 40, color: i === 0 ? SEAL : INK }}>{m.pct}%</b>
                {m.note && <span style={{ display: "block", fontSize: 21, fontWeight: 800, color: SEAL, fontFamily: sans }}>{m.note}</span>}
              </span>
            </div>
          ))}
          <p style={{ marginTop: 6, fontSize: 22, lineHeight: 1.45, color: SOFT, fontFamily: sans }}>
            흙이 귀한 이유: 땅의 글자 열둘 중 넷(辰·戌·丑·未)이 흙이라 어딘가에 하나쯤 들어 있어요
          </p>
        </div>
        <div className="doc-paper" style={{ position: "absolute", top: 1128, ...panel }}>
          <p style={{ fontSize: 30, fontWeight: 800, fontFamily: sans }}>비어 있는 오행 개수</p>
          {COUNT.map((m, i) => (
            <div key={m.n} style={{ display: "flex", alignItems: "center", gap: 18, height: 74, borderTop: i ? "1.5px solid rgba(179,38,30,.13)" : "none" }}>
              <b style={{ width: 190, flexShrink: 0, fontSize: 31 }}>{m.n}</b>
              {bar(m.pct, 55, i === 1 ? SEAL : "#8a6214")}
              <span style={{ width: 190, flexShrink: 0, textAlign: "right" }}>
                <b style={{ fontSize: 38, color: i === 1 ? SEAL : INK }}>{m.pct}%</b>
                {m.note && <span style={{ display: "block", fontSize: 21, fontWeight: 800, color: SEAL, fontFamily: sans }}>{m.note}</span>}
              </span>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", top: 1548, left: 150, width: 780, textAlign: "center" }}>
          <p style={{ fontSize: 30, lineHeight: 1.4, fontWeight: 800, color: "#f1cf7a" }}>10명 중 7명은 하나쯤 비어 있어요. 내 건 뭘까?</p>
          <p style={{ marginTop: 6, fontSize: 24, lineHeight: 1.4, color: "rgba(244,236,219,.8)", fontFamily: sans }}>
            프로필 링크에서 생일만 넣으면 바로 · 태어난 시간까지 넣은 여덟 글자 기준
          </p>
        </div>
      </ReelFrame>
    );
  }

  // 띠 궁합 at a glance, for a reel people tag each other on: each animal's 육합 (찰떡) and 충 (부딪힘), both
  // fixed by the branches, so nothing in it is a guess.
  if (c === "tti-reel") {
    const HAP = [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
    const GREEN = "#3d6656";
    // Rows tall enough to fill the picture down to the closing lines, which end above the account row (y ~1650).
    const rowH = 70;
    const tableTop = 556;
    const pair = (b: number, color: string) => (
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 40, lineHeight: 1, color, fontFamily: brush }}>{BRANCHES[b]}</span>
        <b style={{ fontSize: 35, color }}>{ANIMALS[b]}</b>
      </span>
    );
    return (
      <ReelFrame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: REEL.top, left: REEL.side, right: REEL.side, textAlign: "center" }}>
          <p style={{ fontSize: 34, fontWeight: 800, letterSpacing: "0.08em", color: GOLD }}>열두 띠 궁합 한눈에</p>
          <p style={{ marginTop: 14, fontSize: 80, fontWeight: 800, lineHeight: 1.15 }}>
            우리 띠, <span style={{ color: "#f1cf7a" }}>찰떡</span>일까
            <br />
            <span style={{ color: "#f08a80" }}>상극</span>일까
          </p>
        </div>
        {/* Centred on the picture: the words stay left of x 820, clear of the like column; only the paper's edge runs under it. */}
        <div className="doc-paper" style={{ position: "absolute", top: tableTop, left: 150, width: 780, padding: "16px 22px 16px 40px", color: INK }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr 1fr", alignItems: "center", height: 50, fontSize: 27, fontWeight: 800, fontFamily: sans }}>
            <span style={{ color: SOFT }}>내 띠</span>
            <span style={{ color: GREEN }}>찰떡 짝</span>
            <span style={{ color: SEAL }}>부딪히는 짝</span>
          </div>
          {ANIMALS.map((_, b) => (
            <div
              key={b}
              style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr 1fr", alignItems: "center", height: rowH, borderTop: "1.5px solid rgba(179,38,30,.15)" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 46, lineHeight: 1, color: INK, fontFamily: brush }}>{BRANCHES[b]}</span>
                <b style={{ fontSize: 39 }}>{ANIMALS[b]}띠</b>
              </span>
              {pair(HAP[b], GREEN)}
              {pair((b + 6) % 12, SEAL)}
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", top: tableTop + 32 + 50 + 12 * rowH + 34, left: 150, width: 780, textAlign: "center" }}>
          <p style={{ fontSize: 34, lineHeight: 1.45, fontWeight: 800, color: "#f1cf7a" }}>띠는 여덟 글자 중 한 글자일 뿐이옵니다</p>
          <p style={{ marginTop: 8, fontSize: 28, lineHeight: 1.45, color: "rgba(244,236,219,.8)", fontFamily: sans }}>찰떡은 육합, 부딪힘은 충 · 진짜 궁합은 두 사람의 여덟 글자로</p>
        </div>
      </ReelFrame>
    );
  }

  if (c === "tti-grid") {
    // Every pair of 띠 in one table, like the MBTI 궁합표 people save: no made-up percentages, only the four
    // relations between year branches (육합 · 삼합 · 충 · 원진), each a fixed rule anyone can check.
    const FACE = ["🐭", "🐮", "🐯", "🐰", "🐲", "🐍", "🐴", "🐑", "🐵", "🐔", "🐶", "🐷"];
    const WONJIN = [7, 6, 9, 8, 11, 10, 1, 0, 3, 2, 5, 4];
    const KIND = {
      hap: { mark: "♥", bg: SEAL, fg: HANJI, name: "육합", say: "찰떡" },
      samhap: { mark: "◎", bg: "#a87a22", fg: HANJI, name: "삼합", say: "한편" },
      chung: { mark: "✕", bg: "#1f3448", fg: HANJI, name: "충", say: "부딪힘" },
      wonjin: { mark: "△", bg: "#d4cbbd", fg: INK, name: "원진", say: "묘하게 서운" },
    } as const;
    const rel = (a: number, b: number): keyof typeof KIND | null =>
      a === b ? null : (a + b) % 12 === 1 ? "hap" : (a - b + 12) % 4 === 0 ? "samhap" : (a - b + 12) % 12 === 6 ? "chung" : WONJIN[a] === b ? "wonjin" : null;
    // Big and centred on the picture: the table is what people stop for. Its right edge runs under the like
    // column (x past 900, from y ~1150), like the MBTI tables it answers; the cells there stay readable around it.
    const width = 940;
    const left = (1080 - width) / 2;
    const head = 110;
    const cell = 64;
    const top = 430;
    const grid = `${head}px repeat(12, ${cell}px)`;
    return (
      <ReelFrame>
        <div style={{ position: "absolute", top: REEL.top, left: REEL.side, right: REEL.side, textAlign: "center" }}>
          <p style={{ fontSize: 34, fontWeight: 800, letterSpacing: "0.06em", color: GOLD }}>명리의 합 · 충으로 그린</p>
          <p style={{ marginTop: 14, fontSize: 84, fontWeight: 800, lineHeight: 1.12 }}>
            12띠 <span style={{ color: "#f1cf7a" }}>찐궁합표</span>
          </p>
        </div>
        <div className="doc-paper" style={{ position: "absolute", top, left, width, padding: "14px", color: INK }}>
          <div style={{ display: "grid", gridTemplateColumns: grid, gap: 2 }}>
            <span />
            {FACE.map((f, b) => (
              <span key={b} style={{ height: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                <span style={{ fontSize: 38 }}>{f}</span>
                <b style={{ marginTop: 5, fontSize: 17, fontFamily: sans, color: SOFT, whiteSpace: "nowrap" }}>{ANIMALS[b]}</b>
              </span>
            ))}
            {FACE.map((f, a) => (
              <Fragment key={a}>
                <span style={{ height: cell, display: "flex", alignItems: "center", gap: 5, paddingLeft: 2 }}>
                  <span style={{ fontSize: 36, lineHeight: 1 }}>{f}</span>
                  <b style={{ fontSize: 19, fontFamily: sans, whiteSpace: "nowrap" }}>{ANIMALS[a]}</b>
                </span>
                {FACE.map((_, b) => {
                  const k = rel(a, b);
                  const st = k ? KIND[k] : null;
                  return (
                    <span
                      key={b}
                      style={{
                        height: cell,
                        borderRadius: 10,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 36,
                        fontWeight: 800,
                        fontFamily: sans,
                        background: st ? st.bg : a === b ? "rgba(33,27,23,.12)" : "rgba(33,27,23,.04)",
                        color: st ? st.fg : SOFT,
                      }}
                    >
                      {st ? st.mark : a === b ? "=" : ""}
                    </span>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
        <div style={{ position: "absolute", top: top + 28 + 80 + 12 * (cell + 2) + 28, left, width }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto auto", justifyContent: "center", gap: "12px 80px", fontFamily: sans, fontSize: 28 }}>
            {Object.values(KIND).map((k) => (
              <span key={k.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{ width: 44, height: 44, borderRadius: 8, background: k.bg, color: k.fg, border: "2px solid rgba(244,236,219,.5)", display: "grid", placeItems: "center", fontWeight: 800 }}
                >
                  {k.mark}
                </span>
                <span>
                  <b>{k.say}</b> <span style={{ color: "rgba(244,236,219,.7)" }}>{k.name}</span>
                </span>
              </span>
            ))}
          </div>
          <p style={{ marginTop: 30, textAlign: "center", fontSize: 34, fontWeight: 800, color: "#f1cf7a" }}>띠는 여덟 글자 중 한 글자일 뿐이옵니다</p>
          <p style={{ marginTop: 8, textAlign: "center", fontSize: 28, color: "rgba(244,236,219,.8)", fontFamily: sans }}>진짜 궁합은 두 사람의 사주에 · 프로필 링크에서</p>
        </div>
      </ReelFrame>
    );
  }

  if (c === "yeokma-reel") {
    // A checklist anyone can score without knowing their chart: the 역마 (寅申巳亥) temper in everyday scenes.
    const ITEMS = [
      "집에만 있으면 이틀 만에 답답해진다",
      "여행은 가는 날보다 계획 짜는 날이 더 신난다",
      "이사·이직 얘기만 나오면 마음이 먼저 가 있다",
      "단골보다 처음 가 보는 가게가 끌린다",
      "낯선 동네에서도 금방 길을 익힌다",
      "앉아 있는 일보다 돌아다니는 일이 편하다",
      "한곳에 3년쯤 있으면 뭐라도 바꾸고 싶어진다",
    ];
    return (
      <ReelFrame>
        <div style={{ position: "absolute", top: REEL.top, left: REEL.side, right: REEL.side, textAlign: "center" }}>
          <p style={{ fontSize: 34, fontWeight: 800, letterSpacing: "0.06em", color: GOLD }}>몇 개나 해당되시옵니까?</p>
          <p style={{ marginTop: 14, fontSize: 84, fontWeight: 800, lineHeight: 1.15 }}>
            셋 이상이면
            <br />
            <span style={{ color: "#f1cf7a" }}>역마살</span>
          </p>
        </div>
        <div className="doc-paper" style={{ position: "absolute", top: 560, left: REEL.side, right: REEL.side, padding: "34px 44px", color: INK }}>
          {ITEMS.map((t, i) => (
            <div
              key={t}
              style={{ display: "flex", alignItems: "center", gap: 22, height: 106, borderTop: i ? "1.5px solid rgba(179,38,30,.15)" : "none", fontFamily: sans }}
            >
              <span style={{ width: 46, height: 46, flexShrink: 0, border: `4px solid ${SEAL}`, borderRadius: 8 }} />
              <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.02em" }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", top: 560 + 68 + 7 * 106 + 44, left: REEL.side, right: REEL.side, textAlign: "center" }}>
          <p style={{ fontSize: 34, lineHeight: 1.45, fontWeight: 800, color: "#f1cf7a" }}>떠돌이 팔자가 아니라, 움직여야 풀리는 사람</p>
          <p style={{ marginTop: 8, fontSize: 28, lineHeight: 1.45, color: "rgba(244,236,219,.8)", fontFamily: sans }}>
            사주표 아래 줄에 寅·申·巳·亥가 있는지 · 프로필 링크에서
          </p>
        </div>
      </ReelFrame>
    );
  }

  if (c === "tti-bunryu") {
    // One situation split into roles across the twelve 띠, so a whole group chat finds itself in it (the idea of
    // the "MBTI별 분류" posts, drawn in our own paper and voice). The travel split is the 명리 grouping itself: 역마 寅申巳亥, 도화 子午卯酉, 화개 辰戌丑未.
    const SECTIONS: { head: string; rows: [string, number[]][] }[] = [
      {
        head: "빡쳤을 때",
        rows: [
          ["그 자리에서 바로 터지는 쪽", [2, 6, 9]],
          ["얼굴에 다 쓰여 있는 쪽", [3, 8]],
          ["조용히 계산 끝내 놓는 쪽", [0, 5]],
          ["참고 참다 한 번에 터지는 쪽", [1, 7, 10]],
          ["자고 일어나면 잊는 쪽", [4, 11]],
        ],
      },
      {
        head: "단톡방에서",
        rows: [
          ["\"그래서 언제 어디서?\" 정리하는 쪽", [2, 4]],
          ["ㅋㅋㅋ 리액션 담당", [6, 8, 11]],
          ["다 읽고 말 없는 쪽", [1, 5]],
          ["새벽 2시에 갑자기 살아나는 쪽", [0]],
          ["오타 보면 못 참는 쪽", [9]],
          ["생일 제일 먼저 챙기는 쪽", [3, 7, 10]],
        ],
      },
      {
        head: "여행 가면",
        rows: [
          ["일정 짜고 앞장서는 쪽", [2, 8, 5, 11]],
          ["사진 찍고 찍히는 쪽", [0, 6, 3, 9]],
          ["숙소가 제일 행복한 쪽", [4, 10, 1, 7]],
        ],
      },
    ];
    const FACE = ["🐭", "🐮", "🐯", "🐰", "🐲", "🐍", "🐴", "🐑", "🐵", "🐔", "🐶", "🐷"];
    const emoji = '"Noto Color Emoji", "Apple Color Emoji", sans-serif';
    return (
      <ReelFrame>
        <div style={{ position: "absolute", top: REEL.top, left: REEL.side, right: REEL.side, textAlign: "center" }}>
          <p style={{ fontSize: 34, fontWeight: 800, letterSpacing: "0.06em", color: GOLD }}>단톡방에 보내 보시옵소서</p>
          <p style={{ marginTop: 14, fontSize: 80, fontWeight: 800, lineHeight: 1.15 }}>
            열두 띠, 이럴 때
            <br />
            <span style={{ color: "#f1cf7a" }}>갈리옵니다</span>
          </p>
        </div>
        {/* Inset 140 a side: centred, and the names at the right end stay left of the like column (x 900). */}
        <div className="doc-paper" style={{ position: "absolute", top: 530, left: 140, right: 140, padding: "24px 36px 26px", color: INK }}>
          {SECTIONS.map((sec, si) => (
            <div key={sec.head} style={{ marginTop: si ? 16 : 0 }}>
              <p style={{ display: "flex", alignItems: "center", gap: 14, height: 52 }}>
                <span style={{ padding: "4px 16px", border: `3px solid ${SEAL}`, color: SEAL, fontSize: 30, fontWeight: 800 }}>{sec.head}</span>
                <span style={{ flex: 1, height: 2, background: "rgba(179,38,30,.25)" }} />
              </p>
              {sec.rows.map(([label, bs]) => (
                <div
                  key={label}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, borderBottom: "1.5px solid rgba(179,38,30,.12)", fontFamily: sans }}
                >
                  <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>{label}</span>
                  <span style={{ display: "flex", gap: 14, whiteSpace: "nowrap" }}>
                    {bs.map((x) => (
                      <span key={x} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 30, fontFamily: emoji, lineHeight: 1 }}>{FACE[x]}</span>
                        <b style={{ fontSize: 25, color: "#17304a" }}>{ANIMALS[x]}</b>
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p style={{ position: "absolute", top: 1592, left: 0, right: 0, textAlign: "center", fontSize: 26, color: "rgba(244,236,219,.75)", fontFamily: sans }}>
          여행 편은 사주의 역마 · 도화 · 화개로 나눴사옵니다
        </p>
      </ReelFrame>
    );
  }

  if (c === "son-reel") {
    const y = Number(q.y ?? 2026);
    const m = Number(q.m ?? 10);
    // The almanac (lib/chaek.ts): lunar dates, 손 없는 날 and public holidays (substitute days included).
    const days = monthOf(y, m);
    const first = days[0].wd;
    const sons = days.filter((x) => x.son);
    const cells = [...Array(first).fill(null), ...days];
    const W = "일월화수목금토";
    // The calendar ends above the like column (y 1040) in a five-week month; a six-week month gets shorter cells.
    const weeks = Math.ceil(cells.length / 7);
    const tall = weeks <= 5;
    const ch = tall ? 92 : 80;
    const calTop = 470;
    const calH = 36 + 38 + weeks * (ch + 6);
    return (
      <ReelFrame>
        <div style={{ position: "absolute", top: REEL.top, left: REEL.side, right: REEL.side, textAlign: "center" }}>
          <p style={{ fontSize: 34, fontWeight: 800, letterSpacing: "0.08em", color: GOLD }}>이사 · 개업 날짜 잡기 전에</p>
          <p style={{ marginTop: 14, fontSize: 80, fontWeight: 800, lineHeight: 1.1, whiteSpace: "nowrap" }}>
            {m}월 손 없는 날, <span style={{ color: "#f1cf7a" }}>딱 {sons.length}일</span>
          </p>
          <p style={{ marginTop: 16, fontSize: 30, lineHeight: 1.3, color: "rgba(244,236,219,.85)", fontFamily: sans }}>음력 날짜 끝자리가 9와 0인 날 · 작은 글씨는 음력</p>
        </div>
        <div className="doc-paper" style={{ position: "absolute", top: calTop, left: REEL.side, right: REEL.side, padding: "18px 16px", color: INK }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, textAlign: "center" }}>
            {W.split("").map((w, i) => (
              <p key={w} style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2, color: i === 0 ? SEAL : i === 6 ? "#1f4e8c" : SOFT, paddingBottom: 6 }}>
                {w}
              </p>
            ))}
            {cells.map((x, i) =>
              x ? (
                <div
                  key={i}
                  style={{
                    height: ch,
                    borderRadius: 14,
                    paddingTop: 5,
                    background: x.son ? SEAL : "rgba(33,27,23,.04)",
                    color: x.son ? HANJI : x.wd === 0 || x.holi ? SEAL : x.wd === 6 ? "#1f4e8c" : INK,
                  }}
                >
                  <p style={{ fontSize: tall ? 34 : 30, fontWeight: 800, lineHeight: 1.05 }}>{x.d}</p>
                  <p style={{ marginTop: 2, fontSize: 16, lineHeight: 1.15, fontFamily: sans, opacity: x.son ? 0.9 : 0.6 }}>{x.lunar}</p>
                  {tall && x.son ? (
                    <p style={{ marginTop: 3, fontSize: 18, lineHeight: 1.15, fontWeight: 800 }}>손 없음</p>
                  ) : tall && x.holi ? (
                    <p style={{ marginTop: 3, fontSize: 16, lineHeight: 1.15, fontWeight: 800 }}>{x.holi}</p>
                  ) : null}
                </div>
              ) : (
                <div key={i} />
              ),
            )}
          </div>
        </div>
        <div style={{ position: "absolute", top: calTop + calH + 34, left: REEL.side, width: 780 }}>
          {/* Two columns, so even a month with seven of them leaves room for the closing line above the caption. */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            {sons.map((x) => (
              <p key={x.d} style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.5, whiteSpace: "nowrap" }}>
                <span style={{ color: "#f1cf7a" }}>
                  {m}/{x.d} ({W[x.wd]})
                </span>
                <span style={{ marginLeft: 12, fontSize: 24, fontWeight: 400, color: "rgba(244,236,219,.8)", fontFamily: sans }}>
                  {[x.holi, x.wd === 0 || x.wd === 6 ? "주말" : ""].filter(Boolean).join(" · ")}
                </span>
              </p>
            ))}
          </div>
          <p style={{ marginTop: 18, fontSize: 28, lineHeight: 1.5, color: "rgba(244,236,219,.85)", fontFamily: sans }}>
            손 없는 날은 누구에게나 같은 날이에요. 내 사주에 맞는 날은 따로 있어요.
          </p>
        </div>
      </ReelFrame>
    );
  }

  if (c.startsWith("rank-")) {
    const y = Number(q.y ?? 2026);
    const m = Number(q.m ?? 10);
    const mp = monthPillarOf(y, m);
    if (!mp) return null;
    const rows = rankMonth(mp.stem, mp.branch);
    const head = `60일주 운세 랭킹 · ${mp.label} (${mp.term}~${mp.nextTerm})`;
    const stars = (r: IljuMonth) => "★★★★★".slice(0, 5 - Math.floor((r.rank - 1) / 12)) + "☆☆☆☆☆".slice(0, Math.floor((r.rank - 1) / 12));
    const hf = <BrushFont hf={String(q.hf ?? "")} />;

    if (c === "rank-reel") {
      const cols = [rows.slice(0, 20), rows.slice(20, 40), rows.slice(40, 60)];
      return (
        <ReelFrame>
          {hf}
          <div style={{ position: "absolute", top: REEL.top, left: REEL.side, right: REEL.side, textAlign: "center" }}>
            <p style={{ fontSize: 34, fontWeight: 800, letterSpacing: "0.08em", color: GOLD }}>60일주 운세 랭킹 · {mp.label}</p>
            <p style={{ marginTop: 14, fontSize: 80, fontWeight: 800, lineHeight: 1.1, whiteSpace: "nowrap" }}>
              {m}월, 내 일주는 <span style={{ color: "#f1cf7a" }}>몇 위?</span>
            </p>
            <p style={{ marginTop: 16, fontSize: 30, lineHeight: 1.3, color: "rgba(244,236,219,.85)", fontFamily: sans }}>
              {mp.term} {mp.from} ~ {mp.to}
            </p>
          </div>
          <div className="doc-paper" style={{ position: "absolute", top: 480, left: REEL.side, right: REEL.side, padding: "18px 14px", color: INK, display: "flex", gap: 12 }}>
            {cols.map((col, ci) => (
              <div key={ci} style={{ flex: 1, minWidth: 0 }}>
                {col.map((r) => {
                  const top = r.rank <= 3;
                  return (
                    <div
                      key={r.no}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        height: 42,
                        padding: "0 8px",
                        borderTop: r.rank % 20 === 1 ? "none" : "1.5px solid rgba(179,38,30,.13)",
                        background: top ? "rgba(212,175,95,.22)" : r.rank > 55 ? "rgba(33,27,23,.05)" : "transparent",
                      }}
                    >
                      <span style={{ width: 36, flexShrink: 0, textAlign: "right", fontSize: 24, fontWeight: 800, color: top ? SEAL : INK }}>{r.rank}</span>
                      <span style={{ width: 76, flexShrink: 0, whiteSpace: "nowrap", fontSize: 34, lineHeight: 1, color: SEAL, fontFamily: brush }}>{r.hanja}</span>
                      <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", fontSize: 23, fontWeight: 800 }}>{r.name.replace("일주", "")}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", top: 1384, left: REEL.side, width: 780, textAlign: "center" }}>
            <p style={{ fontSize: 30, lineHeight: 1.4, fontWeight: 800, color: "#f1cf7a" }}>내 일주를 모르면? 프로필 링크에서 생년월일만 넣으면 바로</p>
            <p style={{ marginTop: 10, fontSize: 26, lineHeight: 1.4, color: "rgba(244,236,219,.75)", fontFamily: sans }}>저장해 두고 이번 달 내내 꺼내 보시옵소서</p>
          </div>
        </ReelFrame>
      );
    }
    if (c === "rank-cover") {
      const top = rows[0];
      return (
        <Frame dark>
          {hf}
          <CornerBrand />
          <p style={{ position: "absolute", top: 72, right: 70, fontSize: 30, fontWeight: 800, color: GOLD }}>{mp.label}</p>
          <div className="doc-paper" style={{ position: "absolute", top: 160, left: 150, right: 150, height: 700, textAlign: "center", color: INK, paddingTop: 50 }}>
            <p style={{ display: "inline-block", padding: "10px 26px", background: INK, color: HANJI, fontSize: 34, fontWeight: 800 }}>
              {mp.label} 일주 랭킹 <span style={{ color: "#f1cf7a" }}>1위</span>
            </p>
            <div style={{ position: "absolute", top: 34, right: 34 }}>
              <Medal n={1} size={96} />
            </div>
            <p style={{ marginTop: 26, fontSize: 28, color: SOFT, fontFamily: sans }}>- - - - - - - - - - - - - - - - - - - -</p>
            <p style={{ marginTop: 22, fontSize: 30, color: SOFT }}>{top.image}</p>
            <p style={{ marginTop: 10, fontSize: 200, lineHeight: 1.05, color: SEAL, fontFamily: brush }}>{top.hanja}</p>
            <p style={{ marginTop: 6, fontSize: 64, fontWeight: 800 }}>{top.name}</p>
            <p style={{ marginTop: 14, padding: "0 50px", fontSize: 30, lineHeight: 1.45, color: SOFT, fontFamily: sans }}>{top.line}</p>
          </div>
          <div style={{ position: "absolute", top: 745, left: 64 }}>
            <div style={{ width: 170, height: 170, borderRadius: "50%", overflow: "hidden", border: `6px solid ${GOLD}`, background: HANJI, boxShadow: "0 10px 24px rgba(0,0,0,.4)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hundo-face.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ position: "absolute", left: -12, top: -84, padding: "12px 22px", background: "#fff", color: INK, borderRadius: 22, fontSize: 32, fontWeight: 800, whiteSpace: "nowrap", boxShadow: "0 8px 20px rgba(0,0,0,.3)" }}>
              {q.say ? String(q.say) : "이달의 1위!"}
            </div>
          </div>
          <ThumbTitle top={`60일주 운세 랭킹 · ${mp.term} ${mp.from} ~ ${mp.to}`} main={`${mp.label} 1위 · ${top.name}`} />
        </Frame>
      );
    }
    if (c === "rank-top3")
      return (
        <Frame>
          {hf}
          <div style={{ position: "absolute", top: 120, left: 90, right: 90 }}>
            <Label>{head}</Label>
            <p style={{ marginTop: 10, fontSize: 66, fontWeight: 800 }}>이달의 TOP 3</p>
            <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 28 }}>
              {rows.slice(0, 3).map((r) => (
                <div key={r.no} className="doc-paper" style={{ display: "flex", gap: 26, padding: "36px 32px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 160 }}>
                    <Medal n={r.rank} size={86} />
                    <span style={{ fontSize: 66, color: SEAL, fontFamily: brush, lineHeight: 1 }}>{r.hanja}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 42, fontWeight: 800 }}>{r.name}</p>
                    <p style={{ marginTop: 6, fontSize: 28, lineHeight: 1.45, color: INK, fontFamily: sans }}>{r.line}</p>
                    {r.tips.slice(0, 2).map((t) => (
                      <p key={t} style={{ marginTop: 8, fontSize: 25, lineHeight: 1.4, color: SOFT, fontFamily: sans }}>
                        <b style={{ color: SEAL }}>✓</b> {t}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Brand />
        </Frame>
      );
    if (c === "rank-care")
      return (
        <Frame>
          {hf}
          <div style={{ position: "absolute", top: 100, left: 90, right: 90 }}>
            <Label>{head}</Label>
            <p style={{ marginTop: 10, fontSize: 56, fontWeight: 800, lineHeight: 1.25 }}>미리 대비하면 되는 일주</p>
            <p style={{ marginTop: 8, fontSize: 26, color: SOFT, fontFamily: sans }}>나쁜 달이 아니라, 알고 준비하면 되는 달이에요</p>
            <div style={{ marginTop: 18 }}>
              {rows.slice(-5).map((r) => (
                <div key={r.no} style={{ display: "flex", gap: 22, padding: "11px 0", borderTop: "1.5px solid rgba(179,38,30,.15)" }}>
                  <span style={{ width: 110, fontSize: 50, color: SEAL, fontFamily: brush, lineHeight: 1.1 }}>{r.hanja}</span>
                  <div style={{ flex: 1, minWidth: 0, fontFamily: sans }}>
                    <p style={{ fontSize: 33, fontWeight: 800, fontFamily: serif }}>
                      {r.name} <span style={{ marginLeft: 6, fontSize: 22, color: SOFT, fontWeight: 400 }}>{r.rank}위 · {r.short}</span>
                    </p>
                    {(
                      [
                        ["피할 것", r.avoid, SEAL, "rgba(179,38,30,.1)"],
                        ["이렇게", r.prep, "#3d6656", "rgba(61,102,86,.12)"],
                        ["좋은 점", r.bright, "#a87a22", "rgba(168,122,34,.14)"],
                      ] as const
                    ).map(([tag, text, fg, bg]) => (
                      <p key={tag} style={{ marginTop: 5, display: "flex", alignItems: "flex-start", gap: 12, fontSize: 24, lineHeight: 1.4 }}>
                        <span style={{ flexShrink: 0, width: 92, marginTop: 1, padding: "1px 0", borderRadius: 8, background: bg, color: fg, fontSize: 19, fontWeight: 800, textAlign: "center" }}>{tag}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>{text}</span>
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Brand />
        </Frame>
      );
    if (c === "rank-rest") {
      // 4위~55위 in two pages of two columns, every pillar with its line.
      const page = Math.min(2, Math.max(1, Number(q.p ?? 1)));
      const list = rows.slice(3 + (page - 1) * 26, 3 + page * 26);
      const cols = [list.slice(0, 13), list.slice(13)];
      return (
        <Frame>
          {hf}
          <div style={{ position: "absolute", top: 96, left: 80, right: 80 }}>
            <Label>{head}</Label>
            <p style={{ marginTop: 4, fontSize: 46, fontWeight: 800 }}>
              {list[0].rank}위 ~ {list.at(-1)!.rank}위
            </p>
            <p style={{ marginTop: 6, fontSize: 21, color: SOFT, fontFamily: sans }}>내 일주는 프로필 링크에서</p>
            <div style={{ marginTop: 10, display: "flex", gap: 30 }}>
              {cols.map((col, i) => (
                <div key={i} style={{ flex: 1, minWidth: 0 }}>
                  {col.map((r) => (
                    <div key={r.no} style={{ display: "flex", alignItems: "center", gap: 12, padding: "5px 0", borderTop: "1.5px solid rgba(179,38,30,.15)" }}>
                      <span style={{ width: 40, fontSize: 25, fontWeight: 800, textAlign: "right" }}>{r.rank}</span>
                      <span style={{ width: 62, fontSize: 30, color: SEAL, fontFamily: brush, lineHeight: 1 }}>{r.hanja}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 23, fontWeight: 800 }}>
                          {r.name} <span style={{ fontSize: 15, color: GOLD }}>{stars(r)}</span>
                        </p>
                        <p style={{ fontSize: 19, color: SOFT, fontFamily: sans, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.short}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <Brand />
        </Frame>
      );
    }
  }

  // 60일주 도감: the feed cover. Each pillar is posted on its own day of the sixty-day round.
  if (c === "ilju-cover") {
    const b = Math.min(11, Math.max(0, Number(q.b ?? 0) || 0));
    const st = b % 2 === s % 2 ? s : (s + 1) % 10; // a stem and branch of the same yin-yang only
    const f = iljuFacts(st, b);
    const no = jiaziNo(st, b);
    const when = nextDayOf(st, b);
    const nn = String(no).padStart(2, "0");
    return (
      <Frame dark>
        <BrushFont hf={String(q.hf ?? "")} />
        <CornerBrand />
        <p style={{ position: "absolute", top: 72, right: 70, fontSize: 30, fontWeight: 800, color: GOLD }}>{nn} / 60</p>
        <div
          className="doc-paper"
          style={{ position: "absolute", top: 160, left: 150, right: 150, height: 700, textAlign: "center", color: INK, paddingTop: 50 }}
        >
          <p style={{ display: "inline-block", padding: "10px 26px", background: INK, color: HANJI, fontSize: 34, fontWeight: 800 }}>
            60일주 도감 <span style={{ color: "#f1cf7a" }}>No.{nn}</span>
          </p>
          <p style={{ marginTop: 26, fontSize: 28, color: SOFT, fontFamily: sans }}>- - - - - - - - - - - - - - - - - - - -</p>
          <p style={{ marginTop: 22, fontSize: 30, color: SOFT }}>{no === 1 ? "육십갑자의 맨 첫 자리" : `육십갑자의 ${no}번째 자리`}</p>
          <p style={{ marginTop: 10, fontSize: 200, fontWeight: 400, lineHeight: 1.05, color: SEAL, letterSpacing: "0.02em", fontFamily: brush }}>{f.hanja}</p>
          <p style={{ marginTop: 6, fontSize: 64, fontWeight: 800 }}>{f.name}</p>
          <p style={{ marginTop: 14, fontSize: 34, color: SOFT }}>{f.image}</p>
        </div>
        {/* 정 훈도, calling it from the side of the page */}
        <div style={{ position: "absolute", top: 745, left: 64 }}>
          <div
            style={{
              width: 170,
              height: 170,
              borderRadius: "50%",
              overflow: "hidden",
              border: `6px solid ${GOLD}`,
              background: HANJI,
              boxShadow: "0 10px 24px rgba(0,0,0,.4)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hundo-face.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div
            style={{
              position: "absolute",
              left: -12,
              top: -84,
              padding: "12px 22px",
              background: "#fff",
              color: INK,
              borderRadius: 22,
              fontSize: 32,
              fontWeight: 800,
              whiteSpace: "nowrap",
              boxShadow: "0 8px 20px rgba(0,0,0,.3)",
            }}
          >
            {q.say ? String(q.say) : "오늘 태어난 일주!"}
          </div>
        </div>
        <ThumbTitle
          top={`60일주 도감${when ? ` · ${when.m}월 ${when.d}일 ${when.weekday}요일` : ""}`}
          main={
            <>
              <span style={{ fontSize: 70, color: HANJI, marginRight: 22 }}>No.{nn}</span>
              {f.name}
            </>
          }
        />
      </Frame>
    );
  }

  if (c === "ilju") {
    const b = Math.min(11, Math.max(0, Number(q.b ?? 6) || 0));
    const f = iljuFacts(s, b);
    return (
      <Frame>
        <div style={{ position: "absolute", top: 130, left: 100, right: 100 }}>
          <Label>60일주 도감 · {f.hanja} · 100명 중 약 1.7명</Label>
          <p style={{ marginTop: 20, fontSize: 104, fontWeight: 800, lineHeight: 1.15 }}>{f.name}</p>
          <p style={{ marginTop: 16, fontSize: 44, fontWeight: 700, color: SEAL }}>{f.image}</p>
          <div style={{ marginTop: 34, height: 3, background: "rgba(179,38,30,.3)" }} />
          <p style={{ marginTop: 30, fontSize: 38, fontWeight: 800 }}>
            일지 12운성 · <span style={{ color: SEAL }}>{f.stage}</span>
          </p>
          <Body style={{ marginTop: 10 }}>{f.stageText}</Body>
          <p style={{ marginTop: 26, fontSize: 38, fontWeight: 800 }}>이런 사람</p>
          {ILGAN[s].traits.slice(0, 2).map((t) => (
            <Body key={t} style={{ marginTop: 6 }}>
              · {t}
            </Body>
          ))}
          {f.tags.map((t) => (
            <p key={t} style={{ marginTop: 16, padding: "14px 24px", borderRadius: 18, background: "rgba(179,38,30,.08)", fontSize: 29, lineHeight: 1.5, fontFamily: sans }}>
              {ILJU_TAG_TEXT[t]}
            </p>
          ))}
        </div>
        <Brand />
      </Frame>
    );
  }

  // ③ 이달의 좋은 날 (책력 기준, 사주 없이)
  if (c === "month") {
    const y = Number(q.y ?? 2026);
    const m = Number(q.m ?? 10);
    const at = new Date(`${y}-${String(m).padStart(2, "0")}-01T00:00:00+09:00`);
    const now = new Date(at.getTime() - 86400000);
    const move = pickDays("move", [], { y, m }, 1, now);
    const best = (k: "move" | "wedding" | "deal") =>
      pickDays(k, [], { y, m }, 1, now)
        .filter((d) => d.grade >= 1)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((d) => d.label.replace(`${m}월 `, ""));
    const son = move.filter((d) => d.son === null).map((d) => Number(d.date.slice(8)));
    const lead = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    const len = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return (
      <Frame>
        <div style={{ position: "absolute", top: 120, left: 100, right: 100 }}>
          <Label>이달의 좋은 날 · 책력</Label>
          <p style={{ marginTop: 20, fontSize: 72, fontWeight: 800 }}>
            {y}년 {m}월
          </p>
          <div style={{ marginTop: 30, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, textAlign: "center", fontFamily: sans }}>
            {"일월화수목금토".split("").map((w) => (
              <span key={w} style={{ fontSize: 24, color: SOFT }}>
                {w}
              </span>
            ))}
            {Array.from({ length: lead }, (_, i) => (
              <span key={`e${i}`} />
            ))}
            {Array.from({ length: len }, (_, i) => {
              const on = son.includes(i + 1);
              return (
                <span key={i} style={{ fontSize: 32, padding: "10px 0", borderRadius: 14, background: on ? SEAL : "transparent", color: on ? HANJI : INK, fontWeight: on ? 800 : 400 }}>
                  {i + 1}
                </span>
              );
            })}
          </div>
          <p style={{ marginTop: 16, fontSize: 26, color: SOFT, fontFamily: sans }}>빨간 날 = 손 없는 날 (이사하기 좋다는 날)</p>
          <div style={{ marginTop: 30, display: "grid", gridTemplateColumns: "150px 1fr", rowGap: 16, fontSize: 34 }}>
            <b style={{ color: SEAL }}>이사</b>
            <span style={{ fontFamily: sans }}>{best("move").join(" · ") || "뚜렷한 날 없음"}</span>
            <b style={{ color: SEAL }}>결혼</b>
            <span style={{ fontFamily: sans }}>{best("wedding").join(" · ") || "뚜렷한 날 없음"}</span>
            <b style={{ color: SEAL }}>계약</b>
            <span style={{ fontFamily: sans }}>{best("deal").join(" · ") || "뚜렷한 날 없음"}</span>
          </div>
          <Body style={{ marginTop: 26, fontSize: 26 }}>책력만 본 날이에요. 내 사주와 부딪히는 날은 사람마다 달라요.</Body>
        </div>
        <Brand />
      </Frame>
    );
  }

  // ④ 조선 인물 사주: 세종대왕 (1397년 음력 4월 10일, 태어난 시각 기록 없음)
  if (c === "sejong") {
    const cols = [
      { pos: "태어난 해", gz: "丁丑", ko: "정축" },
      { pos: "태어난 달", gz: "乙巳", ko: "을사" },
      { pos: "태어난 날", gz: "壬辰", ko: "임진", me: true },
      { pos: "태어난 시", gz: "?", ko: "기록 없음" },
    ];
    return (
      <Frame>
        <div style={{ position: "absolute", top: 120, left: 100, right: 100 }}>
          <Label>조선 인물 사주 · 재미로 보기</Label>
          <p style={{ marginTop: 22, fontSize: 80, fontWeight: 800 }}>세종대왕의 사주</p>
          <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, textAlign: "center" }}>
            {cols.map((x) => (
              <div key={x.pos} style={{ padding: "22px 0", borderRadius: 20, border: x.me ? `3px solid ${SEAL}` : "3px solid rgba(33,27,23,.12)", background: x.me ? "rgba(179,38,30,.08)" : "transparent" }}>
                <p style={{ fontSize: 22, color: SOFT, fontFamily: sans }}>{x.pos}</p>
                <p style={{ marginTop: 8, fontSize: 64, fontWeight: 800, color: x.me ? SEAL : INK, lineHeight: 1.1 }}>
                  {x.gz.split("").map((ch) => (
                    <span key={ch} style={{ display: "block" }}>
                      {ch}
                    </span>
                  ))}
                </p>
                <p style={{ marginTop: 6, fontSize: 24, color: SOFT, fontFamily: sans }}>{x.ko}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 40, fontSize: 42, fontWeight: 800, lineHeight: 1.45 }}>
            큰 강(壬水)이 괴강의 기세를 탔다
          </p>
          <Body style={{ marginTop: 14 }}>
            일간은 굽이치는 큰 강, 일주는 판을 크게 벌이는 괴강 일주예요. 넓게 적시고 끝까지 밀어붙이는 우두머리의 여덟 글자, 그중 여섯 글자예요.
          </Body>
          <p style={{ marginTop: 26, padding: "22px 28px", borderRadius: 20, background: "rgba(179,38,30,.08)", fontSize: 32, lineHeight: 1.55, fontFamily: sans }}>
            괴강을 가진 사람은 100명 중 약 8명. 판이 크고 기복도 크지만, 제 판을 잡으면 크게 풀리는 기운이에요.
          </p>
          <Body style={{ marginTop: 22, fontSize: 24 }}>1397년 음력 4월 10일 기준 · 태어난 시각은 전하지 않아 여섯 글자로 봤어요</Body>
        </div>
        <Brand />
      </Frame>
    );
  }

  // ── 오늘 태어난 인물의 사주: a fixed cover (only the person changes), then the chart, the chart against the
  // life, and the decades against the life.
  const fig = figureById(q.id ?? "fermi");
  if (fig && c.startsWith("fig")) {
    const ch = figureChart(fig);
    const { m, d } = fig.born;
    const cols = [
      { pos: "태어난 해", ...ch.year },
      { pos: "태어난 달", ...ch.month },
      { pos: "태어난 날", ...ch.day, me: true },
      ch.hour ? { pos: "태어난 시", ...ch.hour } : { pos: "태어난 시", hanja: "?", ko: "기록 없음" },
    ];
    if (c === "fig-cover")
      return (
        <Frame dark>
          <div style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center" }}>
            <p style={{ display: "inline-block", padding: "14px 34px", background: GOLD, color: INK, fontSize: 36, fontWeight: 800, letterSpacing: "0.04em" }}>
              오늘 태어난 인물의 사주
            </p>
            <p style={{ marginTop: 40, fontSize: 60, fontWeight: 800 }}>
              {m}월 {d}일
            </p>
            {fig.photo ? (
              // The person as a sticker (like the zodiac animals on 띠 cards), the day pillar as a seal on it.
              <div style={{ position: "relative", margin: "40px auto 0", width: 420, height: 420 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fig.photo}
                  alt=""
                  style={{
                    width: 420,
                    height: 420,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "12px solid #fff",
                    boxShadow: `0 0 0 6px ${GOLD}, 0 18px 40px rgba(0,0,0,.45)`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: -30,
                    bottom: 6,
                    transform: "rotate(-6deg)",
                    padding: "10px 14px",
                    background: SEAL,
                    color: HANJI,
                    border: `4px solid ${HANJI}`,
                    borderRadius: 10,
                    fontSize: 58,
                    fontWeight: 800,
                    lineHeight: 1.05,
                    boxShadow: "0 8px 20px rgba(0,0,0,.35)",
                  }}
                >
                  {ch.day.hanja.split("").map((x) => (
                    <span key={x} style={{ display: "block" }}>
                      {x}
                    </span>
                  ))}
                </div>
                {fig.bubble && (
                  <div
                    style={{
                      position: "absolute",
                      left: -150,
                      top: 30,
                      padding: "18px 28px",
                      background: "#fff",
                      color: INK,
                      borderRadius: 24,
                      fontSize: 34,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                      boxShadow: "0 8px 20px rgba(0,0,0,.3)",
                    }}
                  >
                    {fig.bubble}
                    <span
                      style={{
                        position: "absolute",
                        right: 34,
                        bottom: -20,
                        borderLeft: "14px solid transparent",
                        borderRight: "14px solid transparent",
                        borderTop: "22px solid #fff",
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  margin: "44px auto 0",
                  width: 300,
                  height: 300,
                  borderRadius: "50%",
                  border: `6px solid ${GOLD}`,
                  boxShadow: "0 0 0 12px rgba(212,175,95,.18)",
                  background: HANJI,
                  color: SEAL,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <span style={{ fontSize: 118, fontWeight: 800, lineHeight: 1.05 }}>
                  {ch.day.hanja.split("").map((x) => (
                    <span key={x} style={{ display: "block" }}>
                      {x}
                    </span>
                  ))}
                </span>
              </div>
            )}
            <p style={{ marginTop: fig.photo ? 40 : 46, fontSize: 84, fontWeight: 800 }}>{fig.name}</p>
            <p style={{ marginTop: 10, fontSize: 30, color: "rgba(244,236,219,.75)", fontFamily: sans }}>{fig.line}</p>
            <p style={{ marginTop: 34, padding: "0 110px", fontSize: 44, fontWeight: 800, lineHeight: 1.4, color: "#f0c9a0" }}>{fig.hook}</p>
          </div>
          <Brand dark />
        </Frame>
      );
    if (c === "fig-chart") {
      const r = ch.reading;
      return (
        <Frame>
          <div style={{ position: "absolute", top: 150, left: 100, right: 100 }}>
            <Label>오늘 태어난 인물의 사주 · {fig.name}</Label>
            <p style={{ marginTop: 22, fontSize: 72, fontWeight: 800 }}>{ch.hour ? "여덟 글자" : "여섯 글자"}로 본 사주</p>
            <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, textAlign: "center" }}>
              {cols.map((x) => (
                <div
                  key={x.pos}
                  style={{ padding: "30px 0", borderRadius: 20, border: "me" in x && x.me ? `3px solid ${SEAL}` : "3px solid rgba(33,27,23,.12)", background: "me" in x && x.me ? "rgba(179,38,30,.08)" : "transparent" }}
                >
                  <p style={{ fontSize: 22, color: SOFT, fontFamily: sans }}>{x.pos}</p>
                  <p style={{ marginTop: 8, fontSize: 64, fontWeight: 800, color: "me" in x && x.me ? SEAL : INK, lineHeight: 1.1 }}>
                    {x.hanja.split("").map((chr, i) => (
                      <span key={i} style={{ display: "block" }}>
                        {chr}
                      </span>
                    ))}
                  </p>
                  <p style={{ marginTop: 6, fontSize: 24, color: SOFT, fontFamily: sans }}>{x.ko}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "200px 1fr", rowGap: 30, fontSize: 40, lineHeight: 1.45 }}>
              <b style={{ color: SEAL }}>일간</b>
              <span style={{ fontFamily: sans }}>{stemName(STEMS.indexOf(ch.day.hanja[0] as (typeof STEMS)[number]))} · {stemThing(STEMS.indexOf(ch.day.hanja[0] as (typeof STEMS)[number]))}</span>
              <b style={{ color: SEAL }}>일주</b>
              <span style={{ fontFamily: sans }}>{ch.day.ko}일주{ch.sals.includes("괴강") ? " · 괴강" : ""}{ch.sals.includes("백호") ? " · 백호" : ""}</span>
              <b style={{ color: SEAL }}>사주의 힘</b>
              <span style={{ fontFamily: sans }}>{r?.strength ?? "-"}</span>
              <b style={{ color: SEAL }}>별(신살)</b>
              <span style={{ fontFamily: sans }}>{ch.sals.filter((x) => x !== "괴강" && x !== "백호").join(" · ") || "없음"}</span>
            </div>
            {!ch.hour && <Body style={{ marginTop: 34, fontSize: 24 }}>태어난 시각은 전하지 않아 여섯 글자로 봤어요 · 재미로 보는 인물 사주</Body>}
          </div>
          <Brand />
        </Frame>
      );
    }
    if (c === "fig-pairs")
      return (
        <Frame>
          <div style={{ position: "absolute", top: 150, left: 100, right: 100 }}>
            <Label>오늘 태어난 인물의 사주 · {fig.name}</Label>
            <p style={{ marginTop: 22, fontSize: 72, fontWeight: 800, lineHeight: 1.25 }}>사주가 닮은 인생</p>
            <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 34 }}>
              {fig.pairs.map((x) => (
                <div key={x.sign} style={{ padding: "32px 34px", borderRadius: 24, background: "rgba(33,27,23,.05)" }}>
                  <p style={{ fontSize: 30, color: SEAL, fontWeight: 800 }}>사주 · {x.sign}</p>
                  <p style={{ marginTop: 12, fontSize: 40, fontWeight: 800, lineHeight: 1.4 }}>→ {x.life}</p>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 34, textAlign: "right", fontSize: 30, color: SOFT }}>정 훈도, 삼가 올리옵니다</p>
          </div>
          <Brand />
        </Frame>
      );
    if (c === "fig-daeun")
      return (
        <Frame>
          <div style={{ position: "absolute", top: 130, left: 100, right: 100 }}>
            <Label>오늘 태어난 인물의 사주 · {fig.name}</Label>
            <p style={{ marginTop: 22, fontSize: 72, fontWeight: 800, lineHeight: 1.25 }}>대운과 인생의 순간</p>
            <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 14 }}>
              {ch.decades.filter((x) => !fig.died || x.from <= fig.died).slice(-6).map((x) => (
                <div
                  key={x.gz}
                  style={{
                    padding: "20px 26px",
                    borderRadius: 20,
                    background: x.mark === "◎" ? "rgba(179,38,30,.1)" : "rgba(33,27,23,.05)",
                    border: x.mark === "◎" ? `3px solid ${SEAL}` : "3px solid transparent",
                  }}
                >
                  <p style={{ display: "flex", alignItems: "baseline", gap: 20, fontSize: 34 }}>
                    <b style={{ width: 40, color: x.mark === "◎" ? SEAL : SOFT }}>{x.mark}</b>
                    <b style={{ width: 210 }}>{x.ages}</b>
                    <span style={{ color: SOFT, fontFamily: sans, fontSize: 28 }}>
                      {x.from}~{x.to}
                    </span>
                  </p>
                  {x.events.map((ev) => (
                    <p key={ev.year} style={{ marginTop: 6, marginLeft: 60, fontSize: 32, fontWeight: 800, color: SEAL }}>
                      {ev.year} {ev.text}
                    </p>
                  ))}
                </div>
              ))}
            </div>
            <Body style={{ marginTop: 24, fontSize: 24 }}>◎ 좋은 10년 · ○ 무난한 10년 · △ 다지는 10년 · 출처 {fig.source}</Body>
          </div>
          <Brand />
        </Frame>
      );
  }

  // ── 60갑자 한눈에 보기: what a day pillar is, all sixty in their order, and how to find one's own.
  const gz = (i: number) => ({ no: i + 1, hanja: `${STEMS[i % 10]}${BRANCHES[i % 12]}`, ko: `${STEMS_KO[i % 10]}${BRANCHES_KO[i % 12]}` });
  if (c === "gz-cover")
    return (
      <Frame dark>
        <BrushFont hf={String(q.hf ?? "")} />
        {/* all sixty, faint, behind the title */}
        <div
          style={{
            position: "absolute",
            top: 130,
            left: 70,
            right: 70,
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            rowGap: 6,
            textAlign: "center",
            fontFamily: brush,
            fontSize: 56,
            lineHeight: 1.25,
            color: "rgba(212,175,95,.13)",
          }}
        >
          {SIXTY.map((x) => (
            <span key={x.no}>{gz(x.no - 1).hanja}</span>
          ))}
        </div>
        <CornerBrand />
        <div style={{ position: "absolute", top: 250, left: 0, right: 0, textAlign: "center" }}>
          <p style={{ fontSize: 34, letterSpacing: "0.3em", color: GOLD, fontWeight: 800 }}>六十甲子</p>
          <p style={{ marginTop: 18, fontSize: 210, lineHeight: 1, color: "#f1cf7a", fontFamily: brush, textShadow: "0 6px 24px rgba(0,0,0,.5)" }}>甲子</p>
          <p style={{ marginTop: 20, fontSize: 40, color: "rgba(244,236,219,.9)" }}>갑자에서 계해까지, 예순 가지 일주</p>
        </div>
        <div style={{ position: "absolute", top: 790, left: 64 }}>
          <div style={{ width: 170, height: 170, borderRadius: "50%", overflow: "hidden", border: `6px solid ${GOLD}`, background: HANJI, boxShadow: "0 10px 24px rgba(0,0,0,.4)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hundo-face.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ position: "absolute", left: -12, top: -84, padding: "12px 22px", background: "#fff", color: INK, borderRadius: 22, fontSize: 32, fontWeight: 800, whiteSpace: "nowrap", boxShadow: "0 8px 20px rgba(0,0,0,.3)" }}>
            {q.say ? String(q.say) : "저장해 두시옵소서!"}
          </div>
        </div>
        <ThumbTitle top="태어난 날의 두 글자, 60갑자 한눈에" main="나는 무슨 일주?" />
      </Frame>
    );
  if (c === "gz-what") {
    // Today, the day this post goes up: 2026-09-30 is 丙午년 丁酉월 丁未일.
    const cols = [
      { pos: "시각", h: "？", ko: "" },
      { pos: "오늘", h: "丁未", ko: "정미", me: true },
      { pos: "이번 달", h: "丁酉", ko: "정유" },
      { pos: "올해", h: "丙午", ko: "병오" },
    ];
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 140, left: 100, right: 100 }}>
          <Label>① 일주가 뭐예요?</Label>
          <p style={{ marginTop: 18, fontSize: 64, fontWeight: 800, lineHeight: 1.2 }}>오늘 9월 30일은 丁未일</p>
          <Body style={{ marginTop: 14, fontSize: 32, color: INK }}>올해가 丙午년이듯, 달에도 날에도 두 글자 이름이 있어요</Body>
          <div style={{ marginTop: 44, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, textAlign: "center" }}>
            {cols.map((x) => (
              <div
                key={x.pos}
                style={{ position: "relative", padding: "24px 0", borderRadius: 20, border: x.me ? `3px solid ${SEAL}` : "3px solid rgba(33,27,23,.12)", background: x.me ? "rgba(179,38,30,.08)" : "transparent" }}
              >
                <p style={{ fontSize: 22, color: SOFT, fontFamily: sans }}>{x.pos}</p>
                <p style={{ marginTop: 8, fontSize: 66, lineHeight: 1.1, color: x.me ? SEAL : INK, fontFamily: brush }}>
                  {x.h.split("").map((chr, i) => (
                    <span key={i} style={{ display: "block" }}>
                      {chr}
                    </span>
                  ))}
                </p>
                {x.me && (
                  <span style={{ position: "absolute", top: -26, left: "50%", transform: "translateX(-50%)", padding: "4px 14px", borderRadius: 999, background: SEAL, color: HANJI, fontSize: 22, fontWeight: 800, whiteSpace: "nowrap" }}>
                    여기가 일주
                  </span>
                )}
              </div>
            ))}
          </div>
          <Body style={{ marginTop: 50, fontSize: 36, color: INK }}>
            내가 <b>태어난 날의 이름</b>이 바로 <b style={{ color: SEAL }}>일주</b>예요. 사주 여덟 글자 가운데 <b>나 자신</b>을 뜻해서 가장 먼저 봐요.
          </Body>
          <div style={{ marginTop: 50, padding: "38px 36px", borderRadius: 22, background: "rgba(33,27,23,.05)", fontFamily: sans }}>
            <p style={{ fontSize: 33, lineHeight: 1.6 }}>
              사주는 <b>해·달·날·시</b> 네 기둥이에요. 기둥마다 위에 <b style={{ color: SEAL }}>하늘 글자</b>, 아래에 <b style={{ color: SEAL }}>땅 글자</b>가 하나씩, 모두 여덟 글자.
            </p>
            <p style={{ marginTop: 14, fontSize: 33, lineHeight: 1.6 }}>
              그중 <b style={{ color: SEAL }}>날 기둥 두 글자</b>가 일주예요. 같은 일주는 60일마다 다시 돌아와요.
            </p>
          </div>
        </div>
        <Brand />
      </Frame>
    );
  }
  if (c === "gz-read") {
    const SKY = ["큰 나무", "꽃·덩굴", "태양", "촛불", "큰 산", "논밭", "무쇠", "보석", "큰 강", "단비"];
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 130, left: 80, right: 80 }}>
          <Label>④ 두 글자는 이렇게 읽어요</Label>
          <p style={{ marginTop: 12, fontSize: 58, fontWeight: 800, lineHeight: 1.2 }}>앞은 나의 모습, 뒤는 나의 동물</p>
          <div style={{ marginTop: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 26 }}>
            {[
              { h: "丁", t: "촛불", d: "하늘 글자 · 나의 모습" },
              { h: "未", t: "양", d: "땅 글자 · 나의 동물" },
            ].map((x, i) => (
              <Fragment key={x.h}>
                {i === 1 && <span style={{ fontSize: 56, color: SOFT, fontWeight: 800 }}>+</span>}
                <div style={{ width: 340, padding: "28px 0 24px", borderRadius: 24, textAlign: "center", background: "rgba(179,38,30,.08)", border: `3px solid ${SEAL}` }}>
                  <p style={{ fontSize: 124, lineHeight: 1, fontFamily: brush, color: SEAL }}>{x.h}</p>
                  <p style={{ marginTop: 8, fontSize: 38, fontWeight: 800 }}>{x.t}</p>
                  <p style={{ marginTop: 4, fontSize: 23, color: SOFT, fontFamily: sans }}>{x.d}</p>
                </div>
              </Fragment>
            ))}
          </div>
          <p style={{ marginTop: 30, textAlign: "center", fontSize: 38, fontWeight: 800 }}>
            오늘 丁未일은 <span style={{ color: SEAL }}>&lsquo;여름밤 들판의 모닥불&rsquo;</span>
          </p>
          <div style={{ marginTop: 40, padding: "30px 30px", borderRadius: 22, background: "rgba(33,27,23,.05)" }}>
            <p style={{ fontSize: 26, fontWeight: 800, color: SOFT }}>하늘 글자 10 · 나의 모습</p>
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", rowGap: 14 }}>
              {STEMS.map((st, i) => (
                <span key={st} style={{ fontSize: 27, fontFamily: sans }}>
                  <b style={{ fontFamily: brush, fontSize: 38, color: SEAL, marginRight: 6 }}>{st}</b>
                  {SKY[i]}
                </span>
              ))}
            </div>
            <p style={{ marginTop: 26, fontSize: 26, fontWeight: 800, color: SOFT }}>땅 글자 12 · 나의 동물</p>
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", rowGap: 14 }}>
              {BRANCHES.map((b, i) => (
                <span key={b} style={{ fontSize: 27, fontFamily: sans }}>
                  <b style={{ fontFamily: brush, fontSize: 38, color: SEAL, marginRight: 6 }}>{b}</b>
                  {ANIMALS[i]}
                </span>
              ))}
            </div>
          </div>
        </div>
        <Brand />
      </Frame>
    );
  }
  if (c === "gz-table")
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 100, left: 70, right: 70 }}>
          <Label>④ 이제 내 일주를 찾아보시옵소서</Label>
          <p style={{ marginTop: 6, fontSize: 56, fontWeight: 800 }}>60갑자 한눈에 보기</p>
          {/* six columns of ten, as the sixty are laid out in the almanacs (갑자순·갑술순…) */}
          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gridAutoFlow: "column", gridTemplateRows: "repeat(10, auto)", gap: "5px 8px" }}>
            {SIXTY.map((x) => {
              const g = gz(x.no - 1);
              return (
                <div key={x.no} style={{ position: "relative", padding: "8px 0 6px", borderRadius: 12, textAlign: "center", background: x.no % 2 ? "rgba(33,27,23,.045)" : "transparent" }}>
                  <span style={{ position: "absolute", top: 6, left: 8, fontSize: 15, color: SOFT, fontFamily: sans }}>{x.no}</span>
                  <p style={{ fontSize: 44, lineHeight: 1.05, color: SEAL, fontFamily: brush, whiteSpace: "nowrap" }}>{g.hanja}</p>
                  <p style={{ marginTop: 2, fontSize: 20, fontWeight: 800 }}>{g.ko}</p>
                </div>
              );
            })}
          </div>
        </div>
        <Brand />
      </Frame>
    );
  if (c === "gz-how") {
    // The first twelve days: stems and branches step together, and the stems come round first.
    const first = Array.from({ length: 12 }, (_, i) => gz(i));
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 140, left: 80, right: 80 }}>
          <Label>② 날의 이름은 이렇게 붙어요</Label>
          <p style={{ marginTop: 16, fontSize: 70, fontWeight: 800, lineHeight: 1.2 }}>하루에 한 칸씩, 나란히</p>
          <Body style={{ marginTop: 18, fontSize: 34, color: INK }}>하늘 글자와 땅 글자가 날마다 한 칸씩 함께 나아가요</Body>
          <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "96px repeat(12, 1fr)", rowGap: 16, alignItems: "center", textAlign: "center" }}>
            <span style={{ fontSize: 22, color: SOFT, fontFamily: sans, textAlign: "left" }}>하늘</span>
            {first.map((g, i) => (
              <span key={`s${i}`} style={{ fontSize: 52, fontFamily: brush, color: i >= 10 ? SEAL : INK }}>
                {g.hanja[0]}
              </span>
            ))}
            <span style={{ fontSize: 22, color: SOFT, fontFamily: sans, textAlign: "left" }}>땅</span>
            {first.map((g, i) => (
              <span key={`b${i}`} style={{ fontSize: 52, fontFamily: brush, color: i >= 10 ? SEAL : INK }}>
                {g.hanja[1]}
              </span>
            ))}
            <span style={{ fontSize: 22, color: SOFT, fontFamily: sans, textAlign: "left" }}>날</span>
            {first.map((g, i) => (
              <span key={`n${i}`} style={{ fontSize: 24, fontWeight: 800, color: i >= 10 ? SEAL : SOFT, fontFamily: sans }}>
                {i + 1}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 56, padding: "34px 36px", borderRadius: 22, background: "rgba(179,38,30,.07)", fontFamily: sans }}>
            <p style={{ fontSize: 33, lineHeight: 1.6 }}>
              하늘 글자는 10개라 먼저 한 바퀴를 돌아, 11번째 날 다시 <b style={{ color: SEAL }}>甲</b>.
            </p>
            <p style={{ marginTop: 10, fontSize: 33, lineHeight: 1.6 }}>
              땅 글자는 12개라 아직 <b style={{ color: SEAL }}>戌</b>. 그래서 11번째는 <b style={{ color: SEAL }}>甲戌</b>이에요.
            </p>
          </div>
          <Body style={{ marginTop: 36, fontSize: 33, color: INK }}>
            하늘은 10일마다, 땅은 12일마다 처음으로 돌아가요. 둘이 <b>동시에</b> 처음으로 돌아오는 날은 10으로도 12로도 나누어떨어지는 <b style={{ color: SEAL }}>60일째</b>예요.
          </Body>
          <p style={{ marginTop: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 18, fontFamily: brush, fontSize: 56, color: SEAL }}>
            甲子 <span style={{ fontSize: 30, color: SOFT, fontFamily: sans }}>→ 60일 →</span> 甲子
          </p>
        </div>
        <Brand />
      </Frame>
    );
  }
  if (c === "gz-why") {
    // 10 × 12 = 120 cells, and the days fill only the checkerboard half: stems and branches start together at
    // number 1 and step together, so odd meets odd and even meets even (both 10 and 12 are even, so a lap never
    // changes that). 甲丑 is the cell that never comes.
    const JIA_CHOU = "0-1";
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 110, left: 70, right: 70 }}>
          <Label>③ 그래서 딱 60가지</Label>
          <p style={{ marginTop: 12, fontSize: 58, fontWeight: 800, lineHeight: 1.2 }}>120칸인데 왜 60칸만 찰까?</p>
          <Body style={{ marginTop: 14, fontSize: 30, color: INK, lineHeight: 1.55 }}>
            하늘과 땅은 <b>1번끼리</b> 출발해 매일 한 칸씩 같이 가요. 그래서 <b style={{ color: SEAL }}>홀수는 홀수끼리</b>, <b style={{ color: "#2c3848" }}>짝수는 짝수끼리</b>만 만나요.
          </Body>
          <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "62px repeat(12, 1fr)", gap: 5 }}>
            <span />
            {BRANCHES.map((b, bi) => (
              <span key={b} style={{ textAlign: "center", lineHeight: 1.1 }}>
                <span style={{ display: "block", fontSize: 30, fontFamily: brush, color: bi % 2 ? "#2c3848" : SEAL }}>{b}</span>
                <span style={{ display: "block", fontSize: 15, fontWeight: 800, fontFamily: sans, color: bi % 2 ? "#2c3848" : SEAL }}>{bi + 1}</span>
              </span>
            ))}
            {STEMS.map((st, si) => (
              <Fragment key={st}>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: sans }}>
                  <span style={{ fontSize: 30, fontFamily: brush, color: si % 2 ? "#2c3848" : SEAL }}>{st}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: si % 2 ? "#2c3848" : SEAL }}>{si + 1}</span>
                </span>
                {BRANCHES.map((b, bi) => {
                  const on = si % 2 === bi % 2;
                  const never = `${si}-${bi}` === JIA_CHOU;
                  return (
                    <span
                      key={b}
                      style={{
                        height: 60,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 8,
                        fontFamily: brush,
                        fontSize: 23,
                        background: on ? (si % 2 ? "rgba(44,56,72,.12)" : "rgba(179,38,30,.12)") : "transparent",
                        color: on ? INK : "rgba(33,27,23,.18)",
                        border: never ? `3px dashed ${SEAL}` : on ? "none" : "1.5px solid rgba(33,27,23,.08)",
                      }}
                    >
                      {on ? `${st}${b}` : never ? <span style={{ color: SEAL, fontSize: 26, fontFamily: sans, fontWeight: 800 }}>✕</span> : ""}
                    </span>
                  );
                })}
              </Fragment>
            ))}
          </div>
          <Body style={{ marginTop: 22, fontSize: 30, color: INK, lineHeight: 1.55 }}>
            1번 <b>甲</b>은 2번 <b>丑</b>을 끝내 못 만나요. 그래서 <b style={{ color: SEAL }}>甲丑일은 없어요.</b>
          </Body>
          <p style={{ marginTop: 18, padding: "18px 0", borderRadius: 18, background: "rgba(33,27,23,.05)", textAlign: "center", fontSize: 32, fontWeight: 800 }}>
            <span style={{ color: SEAL }}>홀수 5 × 6</span> + <span style={{ color: "#2c3848" }}>짝수 5 × 6</span> = <span style={{ color: SEAL, fontSize: 40 }}>60</span>
          </p>
        </div>
        <Brand />
      </Frame>
    );
  }

  // ── 2027년은 왜 붉은 양일까: where a year's color and animal come from, and what 丁未 looks like.
  // ── 10/3 손 없는 날: what the '손' is, why 9 and 0, and how it differs from a day chosen by the chart.
  const SON_DAYS = [9, 10, 19, 20, 29, 30];
  const monthGrid = (size: number) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: size / 8 }}>
      {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
        const on = SON_DAYS.includes(d);
        return (
          <span
            key={d}
            style={{ height: size, borderRadius: size / 5, display: "grid", placeItems: "center", fontFamily: sans, fontSize: size * 0.42, fontWeight: on ? 800 : 500, background: on ? SEAL : "rgba(33,27,23,.05)", color: on ? HANJI : SOFT }}
          >
            {d}
          </span>
        );
      })}
    </div>
  );
  if (c === "son-cover")
    return (
      <Frame dark>
        <BrushFont hf={String(q.hf ?? "")} />
        <CornerBrand />
        <div style={{ position: "absolute", top: 190, left: 110, right: 110, padding: 34, borderRadius: 30, background: "rgba(244,236,219,.96)", boxShadow: "0 16px 40px rgba(0,0,0,.35)" }}>
          <p style={{ textAlign: "center", fontSize: 30, fontWeight: 800, color: SEAL, marginBottom: 20 }}>음력 한 달</p>
          {monthGrid(64)}
        </div>
        <div style={{ position: "absolute", top: 790, left: 64 }}>
          <div style={{ width: 170, height: 170, borderRadius: "50%", overflow: "hidden", border: `6px solid ${GOLD}`, background: HANJI, boxShadow: "0 10px 24px rgba(0,0,0,.4)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hundo-face.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ position: "absolute", left: -12, top: -84, padding: "12px 22px", background: "#fff", color: INK, borderRadius: 22, fontSize: 32, fontWeight: 800, whiteSpace: "nowrap", boxShadow: "0 8px 20px rgba(0,0,0,.3)" }}>
            {q.say ? String(q.say) : "빨간 날만 이사하시옵니까?"}
          </div>
        </div>
        <ThumbTitle top="이사할 때 꼭 보는 손 없는 날" main="그 ‘손’이 뭐길래?" />
      </Frame>
    );
  if (c === "son-who") {
    const cell = (dir: string, days: string, on = false) => (
      <div style={{ padding: "26px 0", borderRadius: 24, textAlign: "center", background: on ? SEAL : "rgba(33,27,23,.05)", color: on ? HANJI : INK }}>
        <p style={{ fontSize: 44, fontWeight: 800 }}>{dir}</p>
        <p style={{ marginTop: 6, fontSize: 28, fontFamily: sans, color: on ? "rgba(244,236,219,.9)" : SOFT }}>{days}</p>
      </div>
    );
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 140, left: 100, right: 100 }}>
          <Label>① ‘손’은 날마다 자리를 옮겨요</Label>
          <p style={{ marginTop: 18, fontSize: 58, fontWeight: 800, lineHeight: 1.25 }}>일을 방해한다는 떠돌이 귀신</p>
          <Body style={{ marginTop: 16, fontSize: 33, color: INK }}>
            옛사람들은 ‘손’이 날짜에 따라 동서남북을 돌며, 그쪽에서 벌이는 일을 방해한다고 믿었어요. 그래서 손이 있는 방향으로는 이사를 피했어요.
          </Body>
          <div style={{ marginTop: 44, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <span />
            {cell("북", "7·8일")}
            <span />
            {cell("서", "5·6일")}
            {cell("하늘", "9·10일", true)}
            {cell("동", "1·2일")}
            <span />
            {cell("남", "3·4일")}
            <span />
          </div>
          <p style={{ marginTop: 22, textAlign: "center", fontSize: 26, color: SOFT, fontFamily: sans }}>음력 날짜 끝자리 기준 · 11일부터 다시 동쪽으로</p>
        </div>
        <Brand />
      </Frame>
    );
  }
  if (c === "son-nine")
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 140, left: 100, right: 100 }}>
          <Label>② 9와 0으로 끝나는 날엔 하늘로</Label>
          <p style={{ marginTop: 18, fontSize: 58, fontWeight: 800, lineHeight: 1.25 }}>그래서 ‘손 없는 날’</p>
          <Body style={{ marginTop: 16, fontSize: 33, color: INK }}>
            음력으로 끝자리가 <b style={{ color: SEAL }}>9와 0</b>인 날에는 손이 하늘로 올라가 어느 방향에도 없다고 여겼어요. 어느 쪽으로 옮겨도 괜찮은 날이에요.
          </Body>
          <div style={{ marginTop: 44 }}>{monthGrid(72)}</div>
          <div style={{ marginTop: 44, padding: "32px 36px", borderRadius: 22, background: "rgba(33,27,23,.05)", fontFamily: sans }}>
            <p style={{ fontSize: 32, lineHeight: 1.6 }}>
              한 달에 <b style={{ color: SEAL }}>딱 여섯 날</b>. 모두가 이 날에 이사하려고 해서 이삿짐 예약이 몰리고, 값도 오르기 쉬워요.
            </p>
          </div>
        </div>
        <Brand />
      </Frame>
    );
  if (c === "son-diff")
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 140, left: 100, right: 100 }}>
          <Label>③ 사실, 사주와는 다른 이야기예요</Label>
          <p style={{ marginTop: 18, fontSize: 58, fontWeight: 800, lineHeight: 1.25 }}>손 없는 날은 누구에게나 같은 날</p>
          <div style={{ marginTop: 44, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {[
              { t: "손 없는 날", rows: ["음력 날짜 끝자리만 봐요", "모든 사람에게 같은 날", "한 달에 여섯 날"], on: false },
              { t: "사주로 고른 날", rows: ["그날의 두 글자(일진)와\n내 사주를 함께 봐요", "사람마다 다른 날", "나에게 맞는 날만"], on: true },
            ].map((x) => (
              <div key={x.t} style={{ padding: "30px 24px", borderRadius: 24, border: x.on ? `3px solid ${SEAL}` : "3px solid rgba(33,27,23,.12)", background: x.on ? "rgba(179,38,30,.06)" : "transparent" }}>
                <p style={{ textAlign: "center", fontSize: 42, fontWeight: 800, color: x.on ? SEAL : INK }}>{x.t}</p>
                {x.rows.map((r) => (
                  <p key={r} style={{ marginTop: 18, paddingTop: 16, borderTop: "1.5px solid rgba(33,27,23,.1)", textAlign: "center", fontSize: 29, lineHeight: 1.45, fontFamily: sans, whiteSpace: "pre-line" }}>
                    {r}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <Body style={{ marginTop: 44, fontSize: 33, color: INK }}>
            손 없는 날은 음양오행과 방위를 따지던 <b>민간 풍속</b>에서 나왔어요. 태어난 날의 글자로 사람마다 따로 보는 <b>사주</b>와는 뿌리가 달라요.
          </Body>
        </div>
        <Brand />
      </Frame>
    );
  if (c === "son-me")
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 140, left: 100, right: 100 }}>
          <Label>④ 그대에게 좋은 날은 따로 있어요</Label>
          <p style={{ marginTop: 18, fontSize: 56, fontWeight: 800, lineHeight: 1.25 }}>같은 손 없는 날이라도</p>
          <div style={{ marginTop: 40, padding: "30px 32px", borderRadius: 24, background: "rgba(33,27,23,.05)" }}>
            <p style={{ fontSize: 30, color: SOFT, fontFamily: sans }}>예: 손 없는 날이 마침 <b style={{ color: INK }}>子(쥐)의 날</b>이라면</p>
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, textAlign: "center" }}>
              <div style={{ padding: "24px 10px", borderRadius: 20, background: "#fff" }}>
                <p style={{ fontSize: 30, fontFamily: sans, color: SOFT }}>丑(소)의 날에 태어난 사람</p>
                <p style={{ marginTop: 8, fontSize: 40, fontWeight: 800, color: SEAL }}>손잡는 날 ◎</p>
              </div>
              <div style={{ padding: "24px 10px", borderRadius: 20, background: "#fff" }}>
                <p style={{ fontSize: 30, fontFamily: sans, color: SOFT }}>午(말)의 날에 태어난 사람</p>
                <p style={{ marginTop: 8, fontSize: 40, fontWeight: 800, color: INK }}>부딪히는 날 △</p>
              </div>
            </div>
          </div>
          <Body style={{ marginTop: 40, fontSize: 33, color: INK }}>
            사주에서 子와 丑은 서로 손을 잡고, 子와 午는 정면으로 부딪히는 사이예요. 그래서 모두에게 좋다는 날도 <b style={{ color: SEAL }}>누군가에게는 부딪히는 날</b>일 수 있어요.
          </Body>
          <div style={{ marginTop: 36, padding: "30px 34px", borderRadius: 22, background: "rgba(33,27,23,.05)", fontFamily: sans }}>
            <p style={{ fontSize: 30, lineHeight: 1.6 }}>
              조선에서는 나라의 큰 날을 <b>관상감 명과학</b>이 골랐어요. 정 훈도가 바로 그 명과학의 훈도예요. 붐비는 날 대신 <b>나에게 맞는 날</b>은 훈도사주 <b>택일</b>에서 받아 보세요.
            </p>
          </div>
        </div>
        <Brand />
      </Frame>
    );
  // ── 10/3 결혼 날짜는 왜 '받는다'고 할까: 택일, 정 훈도의 본업.
  if (c === "tk-cover")
    return (
      <Frame dark>
        <BrushFont hf={String(q.hf ?? "")} />
        <CornerBrand />
        <div style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center" }}>
          <p style={{ fontSize: 34, letterSpacing: "0.3em", color: GOLD, fontWeight: 800 }}>擇 日</p>
          <p style={{ marginTop: 20, fontSize: 230, lineHeight: 1, color: "#f1cf7a", fontFamily: brush, textShadow: "0 6px 24px rgba(0,0,0,.5)" }}>吉日</p>
          <p style={{ marginTop: 26, fontSize: 40, color: "rgba(244,236,219,.9)" }}>“날 받았어?” 의 그 날</p>
        </div>
        <div style={{ position: "absolute", top: 790, left: 64 }}>
          <div style={{ width: 170, height: 170, borderRadius: "50%", overflow: "hidden", border: `6px solid ${GOLD}`, background: HANJI, boxShadow: "0 10px 24px rgba(0,0,0,.4)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hundo-face.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ position: "absolute", left: -12, top: -84, padding: "12px 22px", background: "#fff", color: INK, borderRadius: 22, fontSize: 32, fontWeight: 800, whiteSpace: "nowrap", boxShadow: "0 8px 20px rgba(0,0,0,.3)" }}>
            {q.say ? String(q.say) : "소신의 본업이옵니다"}
          </div>
        </div>
        <ThumbTitle top="결혼 날짜는 왜 ‘잡는다’가 아니라" main="‘받는다’고 할까?" />
      </Frame>
    );
  if (c === "tk-receive")
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 140, left: 100, right: 100 }}>
          <Label>① 날은 ‘받아 오는’ 것이었어요</Label>
          <p style={{ marginTop: 18, fontSize: 62, fontWeight: 800, lineHeight: 1.25 }}>“날 받았어?”</p>
          <Body style={{ marginTop: 20, fontSize: 36, color: INK }}>
            결혼, 이사, 개업처럼 큰일을 앞두면 옛사람들은 날짜를 <b>스스로 고르지 않았어요.</b> 날을 볼 줄 아는 사람에게 가서 좋은 날을 <b style={{ color: SEAL }}>받아 왔어요.</b>
          </Body>
          <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, textAlign: "center" }}>
            {[
              { k: "날을 잡다", v: "내 사정에 맞춰\n내가 정하는 날", on: false },
              { k: "날을 받다", v: "하늘과 내 사주에 맞춰\n골라 받은 날", on: true },
            ].map((x) => (
              <div key={x.k} style={{ padding: "34px 20px", borderRadius: 24, border: x.on ? `3px solid ${SEAL}` : "3px solid rgba(33,27,23,.12)", background: x.on ? "rgba(179,38,30,.07)" : "transparent" }}>
                <p style={{ fontSize: 46, fontWeight: 800, color: x.on ? SEAL : INK }}>{x.k}</p>
                <p style={{ marginTop: 14, fontSize: 30, lineHeight: 1.5, color: SOFT, fontFamily: sans, whiteSpace: "pre-line" }}>{x.v}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 56, padding: "34px 36px", borderRadius: 22, background: "rgba(33,27,23,.05)", fontFamily: sans }}>
            <p style={{ fontSize: 32, lineHeight: 1.6 }}>
              그래서 좋은 날을 고르는 일을 <b style={{ color: SEAL }}>택일(擇日)</b>, 날을 받아 오는 일을 <b>날받이</b>라고 불렀어요.
            </p>
          </div>
        </div>
        <Brand />
      </Frame>
    );
  if (c === "tk-gwan")
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 140, left: 100, right: 100 }}>
          <Label>② 나라의 날은 관상감이 골랐어요</Label>
          <p style={{ marginTop: 18, fontSize: 58, fontWeight: 800, lineHeight: 1.25 }}>조선의 날씨청이자 달력청</p>
          <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { h: "天文", t: "천문학", v: "하늘을 보고 해·달·별과 날씨를 기록", on: false },
              { h: "地理", t: "지리학", v: "땅을 보고 집터와 묏자리를 고름", on: false },
              { h: "命課", t: "명과학", v: "사람의 명을 보고 좋은 날을 고름", on: true },
            ].map((x) => (
              <div key={x.h} style={{ display: "flex", alignItems: "center", gap: 26, padding: "24px 30px", borderRadius: 22, border: x.on ? `3px solid ${SEAL}` : "3px solid transparent", background: x.on ? "rgba(179,38,30,.07)" : "rgba(33,27,23,.045)" }}>
                <span style={{ flexShrink: 0, width: 130, fontSize: 60, lineHeight: 1, fontFamily: brush, color: x.on ? SEAL : INK }}>{x.h}</span>
                <span>
                  <b style={{ display: "block", fontSize: 40, color: x.on ? SEAL : INK }}>{x.t}</b>
                  <span style={{ display: "block", marginTop: 4, fontSize: 29, color: SOFT, fontFamily: sans }}>{x.v}</span>
                </span>
              </div>
            ))}
          </div>
          <Body style={{ marginTop: 44, fontSize: 34, color: INK }}>
            왕실의 혼례, 즉위, 장례처럼 나라의 큰일은 <b>관상감 명과학</b> 관원들이 날을 골라 올렸어요. 정 훈도는 바로 그 <b style={{ color: SEAL }}>명과학의 훈도</b>, 날 고르는 법을 가르치던 관원이에요.
          </Body>
        </div>
        <Brand />
      </Frame>
    );
  if (c === "tk-how")
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 140, left: 100, right: 100 }}>
          <Label>③ 좋은 날은 두 번 거른 날</Label>
          <p style={{ marginTop: 18, fontSize: 58, fontWeight: 800, lineHeight: 1.25 }}>달력이 좋고, 내 사주에도 좋고</p>
          <div style={{ marginTop: 44, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            {[
              { n: "一", t: "달력(책력)이 권하는 날", v: "누구에게나 좋다는 날, 피하라는 날을 먼저 거르고", w: 880 },
              { n: "二", t: "내 사주와 부딪히지 않는 날", v: "그 가운데 내 글자와 부딪히지 않고, 필요한 기운이 드는 날", w: 720 },
              { n: "三", t: "나에게 좋은 날", v: "두 번 걸러 남은 날이 받는 날", w: 560 },
            ].map((x, i) => (
              <div key={x.n} style={{ width: x.w, padding: "22px 28px", borderRadius: 22, textAlign: "center", background: i === 2 ? SEAL : "rgba(33,27,23,.05)", color: i === 2 ? HANJI : INK }}>
                <b style={{ fontSize: 36 }}>
                  {x.n} · {x.t}
                </b>
                <p style={{ marginTop: 6, fontSize: 27, lineHeight: 1.45, color: i === 2 ? "rgba(244,236,219,.85)" : SOFT, fontFamily: sans }}>{x.v}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 44, padding: "32px 36px", borderRadius: 22, background: "rgba(33,27,23,.05)", fontFamily: sans }}>
            <p style={{ fontSize: 31, lineHeight: 1.6 }}>
              이사 때 많이 보는 <b>손 없는 날</b>은 첫 번째 거름망이에요. 누구에게나 같은 날이라, 그 날이 <b style={{ color: SEAL }}>나에게도</b> 좋은지는 두 번째 거름망에서 갈려요.
            </p>
          </div>
        </div>
        <Brand />
      </Frame>
    );
  if (c === "tk-now")
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 140, left: 100, right: 100 }}>
          <Label>④ 지금도 날을 받을 수 있어요</Label>
          <p style={{ marginTop: 18, fontSize: 58, fontWeight: 800, lineHeight: 1.25 }}>큰일 앞두고 계신가요?</p>
          <div style={{ marginTop: 44, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, textAlign: "center" }}>
            {["결혼", "상견례", "이사", "개업", "계약", "면접"].map((x) => (
              <div key={x} style={{ padding: "26px 0", borderRadius: 20, background: "rgba(33,27,23,.045)", fontSize: 40, fontWeight: 800 }}>
                {x}
              </div>
            ))}
          </div>
          <Body style={{ marginTop: 44, fontSize: 34, color: INK }}>
            책력이 권하는 날 가운데 <b>내 사주와 부딪히지 않는 날</b>을 골라, 날마다 <b style={{ color: SEAL }}>왜 그 날인지</b>와 좋은 시간까지 적어 드려요. 결혼처럼 두 사람의 일은 두 사람 사주를 함께 봐요.
          </Body>
          <div style={{ marginTop: 40, padding: "30px 34px", borderRadius: 22, background: "rgba(33,27,23,.05)", fontFamily: sans }}>
            <p style={{ fontSize: 31, lineHeight: 1.6 }}>
              훈도사주 <b>택일 · 좋은 날 받기</b>에서 조건에 맞는 좋은 날이 <b>몇 날인지</b>는 먼저 무료로 볼 수 있어요.
            </p>
          </div>
        </div>
        <Brand />
      </Frame>
    );
  // ── 10/2 그대는 나무? 촛불?: the first letter of the day pillar, the ten ways a person can be.
  const GAN = [
    { h: "甲", ko: "갑", el: "나무", sw: "#3f7a5a", img: "큰 나무", line: "곧게 위로 자라는 모습 · 한번 정하면 밀고 나가는 편" },
    { h: "乙", ko: "을", el: "나무", sw: "#3f7a5a", img: "꽃·덩굴", line: "어디서든 뿌리내리는 모습 · 부드럽게 길을 찾는 편" },
    { h: "丙", ko: "병", el: "불", sw: "#b3261e", img: "태양", line: "모두를 비추는 모습 · 숨김없이 밝은 편" },
    { h: "丁", ko: "정", el: "불", sw: "#b3261e", img: "촛불·등불", line: "가까운 곳을 밝히는 모습 · 곁을 섬세하게 챙기는 편" },
    { h: "戊", ko: "무", el: "흙", sw: "#c9a13b", img: "큰 산", line: "묵묵히 버티는 모습 · 믿음직하고 듬직한 편" },
    { h: "己", ko: "기", el: "흙", sw: "#c9a13b", img: "논밭", line: "길러 내는 모습 · 사람을 챙기고 키우는 편" },
    { h: "庚", ko: "경", el: "쇠", sw: "#bdb6a6", img: "바위·원석", line: "단단하게 부딪히는 모습 · 결단이 빠른 편" },
    { h: "辛", ko: "신", el: "쇠", sw: "#bdb6a6", img: "보석", line: "다듬어져 빛나는 모습 · 기준이 섬세한 편" },
    { h: "壬", ko: "임", el: "물", sw: "#1d1d22", img: "큰 강·바다", line: "넓게 흘러가는 모습 · 품이 넓은 편" },
    { h: "癸", ko: "계", el: "물", sw: "#1d1d22", img: "비·이슬", line: "조용히 스며드는 모습 · 눈치와 감이 좋은 편" },
  ];
  const ganRows = (from: number, to: number) => (
    <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 14 }}>
      {GAN.slice(from, to).map((x) => (
        <div key={x.h} style={{ display: "flex", alignItems: "center", gap: 26, padding: "20px 28px", borderRadius: 22, background: "rgba(33,27,23,.045)" }}>
          <span style={{ flexShrink: 0, width: 96, textAlign: "center" }}>
            <span style={{ display: "block", fontSize: 76, lineHeight: 1, fontFamily: brush, color: INK }}>{x.h}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 22, color: SOFT, fontFamily: sans }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", background: x.sw }} />
              {x.el}
            </span>
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <b style={{ display: "block", fontSize: 44, lineHeight: 1.2, color: SEAL }}>{x.img}</b>
            <span style={{ display: "block", marginTop: 6, fontSize: 28, lineHeight: 1.45, color: INK, fontFamily: sans }}>{x.line}</span>
          </span>
        </div>
      ))}
    </div>
  );
  if (c === "gan-cover")
    return (
      <Frame dark>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 120, left: 70, right: 70, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", rowGap: 10, textAlign: "center", fontFamily: brush, fontSize: 120, lineHeight: 1.25, color: "rgba(212,175,95,.12)" }}>
          {GAN.map((x) => (
            <span key={x.h}>{x.h}</span>
          ))}
        </div>
        <CornerBrand />
        <div style={{ position: "absolute", top: 250, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 90, textAlign: "center" }}>
          {[
            { h: "甲", t: "큰 나무" },
            { h: "丁", t: "촛불" },
          ].map((x) => (
            <div key={x.h}>
              <p style={{ fontSize: 230, lineHeight: 1, color: "#f1cf7a", fontFamily: brush, textShadow: "0 6px 24px rgba(0,0,0,.5)" }}>{x.h}</p>
              <p style={{ marginTop: 18, fontSize: 44, fontWeight: 800, color: "rgba(244,236,219,.92)" }}>{x.t}</p>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", top: 790, left: 64 }}>
          <div style={{ width: 170, height: 170, borderRadius: "50%", overflow: "hidden", border: `6px solid ${GOLD}`, background: HANJI, boxShadow: "0 10px 24px rgba(0,0,0,.4)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hundo-face.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ position: "absolute", left: -12, top: -84, padding: "12px 22px", background: "#fff", color: INK, borderRadius: 22, fontSize: 32, fontWeight: 800, whiteSpace: "nowrap", boxShadow: "0 8px 20px rgba(0,0,0,.3)" }}>
            {q.say ? String(q.say) : "그대의 앞 글자는?"}
          </div>
        </div>
        <ThumbTitle top="일주 앞 글자로 보는 나의 모습" main="그대는 나무? 촛불?" />
      </Frame>
    );
  if (c === "gan-where")
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 140, left: 100, right: 100 }}>
          <Label>① 앞 글자가 ‘나’예요</Label>
          <p style={{ marginTop: 18, fontSize: 60, fontWeight: 800, lineHeight: 1.25 }}>일주 두 글자 가운데 위 글자</p>
          <div style={{ marginTop: 56, display: "flex", justifyContent: "center", gap: 60, alignItems: "center" }}>
            <div style={{ padding: "26px 40px", borderRadius: 26, border: `3px solid rgba(33,27,23,.12)`, textAlign: "center" }}>
              <p style={{ fontSize: 24, color: SOFT, fontFamily: sans }}>예: 丁未일주</p>
              <p style={{ marginTop: 10, fontSize: 130, lineHeight: 1.05, fontFamily: brush, color: SEAL }}>丁</p>
              <p style={{ fontSize: 130, lineHeight: 1.05, fontFamily: brush, color: "rgba(33,27,23,.28)" }}>未</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 120, fontFamily: sans }}>
              <p style={{ fontSize: 36, lineHeight: 1.4 }}>
                <b style={{ color: SEAL }}>← 위 글자 = 나의 모습</b>
                <br />
                <span style={{ fontSize: 28, color: SOFT }}>하늘 글자 · 열 가지</span>
              </p>
              <p style={{ fontSize: 36, lineHeight: 1.4, color: SOFT }}>
                ← 아래 글자 = 내가 선 자리
                <br />
                <span style={{ fontSize: 28 }}>땅 글자 · 열두 가지</span>
              </p>
            </div>
          </div>
          <Body style={{ marginTop: 60, fontSize: 36, color: INK }}>
            태어난 날의 두 글자 가운데 <b style={{ color: SEAL }}>위 글자</b>가 사주에서 <b>나 자신</b>이에요. 丁未일에 태어났다면 나는 <b style={{ color: SEAL }}>丁, 촛불</b>이에요.
          </Body>
          <div style={{ marginTop: 40, padding: "32px 34px", borderRadius: 22, background: "rgba(33,27,23,.05)", fontFamily: sans }}>
            <p style={{ fontSize: 31, lineHeight: 1.6 }}>
              띠는 <b>태어난 해</b>에서, 나의 모습은 <b>태어난 날</b>에서 나와요. 그래서 같은 띠 친구끼리도 앞 글자는 다를 수 있어요.
            </p>
          </div>
        </div>
        <Brand />
      </Frame>
    );
  if (c === "gan-list1")
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 110, left: 90, right: 90 }}>
          <Label>② 나무 · 불 · 흙</Label>
          <p style={{ marginTop: 12, fontSize: 56, fontWeight: 800, lineHeight: 1.2 }}>열 가지 모습, 먼저 여섯</p>
          {ganRows(0, 6)}
        </div>
        <Brand />
      </Frame>
    );
  if (c === "gan-list2")
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 110, left: 90, right: 90 }}>
          <Label>③ 쇠 · 물</Label>
          <p style={{ marginTop: 12, fontSize: 56, fontWeight: 800, lineHeight: 1.2 }}>나머지 넷</p>
          {ganRows(6, 10)}
          <div style={{ marginTop: 36, padding: "30px 34px", borderRadius: 22, background: "rgba(33,27,23,.05)", fontFamily: sans }}>
            <p style={{ fontSize: 31, lineHeight: 1.6 }}>
              둘씩 짝이 같은 기운이에요. 甲은 <b>큰 나무</b>, 乙은 <b>꽃</b>처럼 한쪽은 크고 곧게, 한쪽은 작고 부드럽게 같은 기운을 나눠 가져요.
            </p>
          </div>
        </div>
        <Brand />
      </Frame>
    );
  if (c === "gan-same") {
    const pair = [
      { h: "甲子", t: "한겨울 깊은 물가에 선 큰 나무" },
      { h: "甲午", t: "한여름 햇살 아래 무성한 큰 나무" },
    ];
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 140, left: 100, right: 100 }}>
          <Label>④ 같은 나무라도 다 같지 않아요</Label>
          <p style={{ marginTop: 18, fontSize: 58, fontWeight: 800, lineHeight: 1.25 }}>뒤 글자가 계절과 자리를 정해요</p>
          <div style={{ marginTop: 50, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
            {pair.map((x, i) => (
              <div key={x.h} style={{ padding: "34px 24px", borderRadius: 24, textAlign: "center", background: i === 0 ? "rgba(29,29,34,.07)" : "rgba(179,38,30,.07)" }}>
                <p style={{ fontSize: 110, lineHeight: 1.05, fontFamily: brush }}>
                  <span style={{ color: INK }}>{x.h[0]}</span>
                  <span style={{ color: i === 0 ? "#1d1d22" : SEAL }}>{x.h[1]}</span>
                </p>
                <p style={{ marginTop: 20, fontSize: 32, lineHeight: 1.45, fontWeight: 800 }}>{x.t}</p>
              </div>
            ))}
          </div>
          <Body style={{ marginTop: 50, fontSize: 35, color: INK }}>
            둘 다 <b>큰 나무</b>지만, 한겨울 물가의 나무는 <b>뿌리부터 단단히</b>, 한여름의 나무는 <b>잎부터 무성하게</b> 자라요. 같은 앞 글자도 뒤 글자에 따라 다른 사람이 돼요.
          </Body>
          <div style={{ marginTop: 40, padding: "30px 34px", borderRadius: 22, background: "rgba(33,27,23,.05)", fontFamily: sans }}>
            <p style={{ fontSize: 31, lineHeight: 1.6 }}>
              내 일주가 궁금하면 <b>60갑자 표</b>에서 태어난 날을 찾거나, 훈도사주 <b>무료 사주 분석</b>에서 바로 볼 수 있어요.
            </p>
          </div>
        </div>
        <Brand />
      </Frame>
    );
  }
  // ── 10/3 그대의 일주에도 동물이 숨어 있사옵니다: the second letter of the day pillar, the twelve animals.
  const JI = [
    { h: "子", ani: "쥐", el: "물", sw: "#1d1d22", season: "한겨울", line: "조용히 모으고 깊이 생각하는 편" },
    { h: "丑", ani: "소", el: "흙", sw: "#c9a13b", season: "늦겨울", line: "묵묵히 버티며 쌓아 가는 편" },
    { h: "寅", ani: "호랑이", el: "나무", sw: "#3f7a5a", season: "이른 봄", line: "먼저 일어나 앞서 나가는 편" },
    { h: "卯", ani: "토끼", el: "나무", sw: "#3f7a5a", season: "한봄", line: "부드럽게 어울리며 자라는 편" },
    { h: "辰", ani: "용", el: "흙", sw: "#c9a13b", season: "늦봄", line: "여러 기운을 품고 바뀌어 가는 편" },
    { h: "巳", ani: "뱀", el: "불", sw: "#b3261e", season: "초여름", line: "조용하다가 한번에 타오르는 편" },
    { h: "午", ani: "말", el: "불", sw: "#b3261e", season: "한여름", line: "밝고 빠르게 내달리는 편" },
    { h: "未", ani: "양", el: "흙", sw: "#c9a13b", season: "늦여름", line: "따뜻하게 품고 기다리는 편" },
    { h: "申", ani: "원숭이", el: "쇠", sw: "#bdb6a6", season: "초가을", line: "재빠르게 움직이고 손이 빠른 편" },
    { h: "酉", ani: "닭", el: "쇠", sw: "#bdb6a6", season: "한가을", line: "정확하게 다듬고 가려내는 편" },
    { h: "戌", ani: "개", el: "흙", sw: "#c9a13b", season: "늦가을", line: "제 것을 지키고 믿음을 주는 편" },
    { h: "亥", ani: "돼지", el: "물", sw: "#1d1d22", season: "초겨울", line: "넉넉하게 품고 흘려보내는 편" },
  ];
  const jiRows = (from: number, to: number) => (
    <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 12 }}>
      {JI.slice(from, to).map((x) => (
        <div key={x.h} style={{ display: "flex", alignItems: "center", gap: 26, padding: "17px 28px", borderRadius: 22, background: "rgba(33,27,23,.045)" }}>
          <span style={{ flexShrink: 0, width: 96, textAlign: "center" }}>
            <span style={{ display: "block", fontSize: 74, lineHeight: 1, fontFamily: brush, color: INK }}>{x.h}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 22, color: SOFT, fontFamily: sans }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", background: x.sw }} />
              {x.el}
            </span>
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <b style={{ fontSize: 44, lineHeight: 1.2, color: SEAL }}>{x.ani}</b>
              <span style={{ fontSize: 27, color: SOFT, fontFamily: sans }}>{x.season}</span>
            </span>
            <span style={{ display: "block", marginTop: 4, fontSize: 28, lineHeight: 1.45, color: INK, fontFamily: sans }}>{x.line}</span>
          </span>
        </div>
      ))}
    </div>
  );
  if (c === "ji-cover")
    return (
      <Frame dark>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 120, left: 70, right: 70, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", rowGap: 10, textAlign: "center", fontFamily: brush, fontSize: 112, lineHeight: 1.3, color: "rgba(212,175,95,.12)" }}>
          {JI.map((x) => (
            <span key={x.h}>{x.h}</span>
          ))}
        </div>
        <CornerBrand />
        <div style={{ position: "absolute", top: 250, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 90, textAlign: "center" }}>
          {[
            { h: "戌", t: "띠는 개", dim: true },
            { h: "未", t: "날은 양", dim: false },
          ].map((x) => (
            <div key={x.h}>
              <p style={{ fontSize: 230, lineHeight: 1, color: x.dim ? "rgba(241,207,122,.45)" : "#f1cf7a", fontFamily: brush, textShadow: "0 6px 24px rgba(0,0,0,.5)" }}>{x.h}</p>
              <p style={{ marginTop: 18, fontSize: 44, fontWeight: 800, color: x.dim ? "rgba(244,236,219,.6)" : "rgba(244,236,219,.95)" }}>{x.t}</p>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", top: 790, left: 64 }}>
          <div style={{ width: 170, height: 170, borderRadius: "50%", overflow: "hidden", border: `6px solid ${GOLD}`, background: HANJI, boxShadow: "0 10px 24px rgba(0,0,0,.4)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hundo-face.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ position: "absolute", left: -12, top: -84, padding: "12px 22px", background: "#fff", color: INK, borderRadius: 22, fontSize: 32, fontWeight: 800, whiteSpace: "nowrap", boxShadow: "0 8px 20px rgba(0,0,0,.3)" }}>
            {q.say ? String(q.say) : "그대의 날은 무슨 동물?"}
          </div>
        </div>
        <ThumbTitle top="일주 뒤 글자에 숨은 동물" main="띠 말고, 나의 동물은?" />
      </Frame>
    );
  if (c === "ji-where") {
    // A real chart: 1994-05-21 14:00 → 甲戌년 己巳월 丁未일 丁未시. 개띠, and the day's animal is 양.
    const cols = [
      { k: "시", s: "丁", b: "未", ani: "양" },
      { k: "날", s: "丁", b: "未", ani: "양", day: true },
      { k: "달", s: "己", b: "巳", ani: "뱀" },
      { k: "해", s: "甲", b: "戌", ani: "개", year: true },
    ];
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 140, left: 100, right: 100 }}>
          <Label>① 뒤 글자가 ‘나의 동물’이에요</Label>
          <p style={{ marginTop: 18, fontSize: 60, fontWeight: 800, lineHeight: 1.25 }}>사주에는 동물이 넷</p>
          <div style={{ marginTop: 46, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, textAlign: "center" }}>
            {cols.map((x) => (
              <div
                key={x.k}
                style={{
                  padding: "18px 0 22px",
                  borderRadius: 24,
                  background: x.day ? "rgba(179,38,30,.08)" : "rgba(33,27,23,.04)",
                  border: x.day ? `3px solid ${SEAL}` : "3px solid transparent",
                }}
              >
                <p style={{ fontSize: 26, color: SOFT, fontFamily: sans }}>태어난 {x.k}</p>
                <p style={{ marginTop: 8, fontSize: 92, lineHeight: 1.08, fontFamily: brush, color: "rgba(33,27,23,.25)" }}>{x.s}</p>
                <p style={{ fontSize: 92, lineHeight: 1.08, fontFamily: brush, color: x.day ? SEAL : INK }}>{x.b}</p>
                <p style={{ marginTop: 8, fontSize: 34, fontWeight: 800, color: x.day ? SEAL : INK }}>{x.ani}</p>
                <p style={{ marginTop: 4, fontSize: 24, fontFamily: sans, color: x.day ? SEAL : SOFT, fontWeight: x.day || x.year ? 700 : 400 }}>
                  {x.day ? "나의 동물" : x.year ? "띠" : " "}
                </p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 14, textAlign: "center", fontSize: 24, color: SOFT, fontFamily: sans }}>예: 1994년 5월 21일 오후 2시에 태어난 사람</p>
          <Body style={{ marginTop: 40, fontSize: 35, color: INK }}>
            여덟 글자의 <b>아래 줄 넷</b>이 모두 동물이에요. 띠는 그중 <b>태어난 해</b>의 동물이고, 사주에서 나를 뜻하는 <b style={{ color: SEAL }}>태어난 날</b>의 아래 글자가 나의 동물이에요.
          </Body>
          <div style={{ marginTop: 34, padding: "28px 34px", borderRadius: 22, background: "rgba(33,27,23,.05)", fontFamily: sans }}>
            <p style={{ fontSize: 31, lineHeight: 1.6 }}>
              이 사람은 <b>개띠</b>지만, 날의 동물은 <b style={{ color: SEAL }}>양</b>이에요.
            </p>
          </div>
        </div>
        <Brand />
      </Frame>
    );
  }
  if (c === "ji-list1")
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 110, left: 90, right: 90 }}>
          <Label>② 한겨울부터 초여름까지</Label>
          <p style={{ marginTop: 12, fontSize: 56, fontWeight: 800, lineHeight: 1.2 }}>열두 동물, 먼저 여섯</p>
          {jiRows(0, 6)}
        </div>
        <Brand />
      </Frame>
    );
  if (c === "ji-list2")
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 110, left: 90, right: 90 }}>
          <Label>③ 한여름부터 초겨울까지</Label>
          <p style={{ marginTop: 12, fontSize: 56, fontWeight: 800, lineHeight: 1.2 }}>나머지 여섯</p>
          {jiRows(6, 12)}
        </div>
        <Brand />
      </Frame>
    );
  if (c === "ji-diff") {
    const rows = [
      ["어디서", "태어난 해", "태어난 날"],
      ["바뀌는 때", "12년마다", "12일마다"],
      ["같은 동물", "그해 태어난 모두", "띠가 같아도 제각각"],
    ];
    const friends = [
      { h: "子", ani: "쥐" },
      { h: "午", ani: "말" },
      { h: "酉", ani: "닭" },
    ];
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 140, left: 100, right: 100 }}>
          <Label>④ 띠와 날의 동물</Label>
          <p style={{ marginTop: 18, fontSize: 58, fontWeight: 800, lineHeight: 1.25 }}>무엇이 다를까요?</p>
          <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "190px 1fr 1fr", rowGap: 4, fontSize: 32, lineHeight: 1.4, fontFamily: sans }}>
            <span />
            <b style={{ padding: "14px 18px", fontFamily: serif, fontSize: 36 }}>띠</b>
            <b style={{ padding: "14px 18px", fontFamily: serif, fontSize: 36, color: SEAL, background: "rgba(179,38,30,.07)", borderRadius: "18px 18px 0 0" }}>날의 동물</b>
            {rows.map(([k, a, b], i) => (
              <Fragment key={k}>
                <span style={{ padding: "14px 0", color: SOFT, borderTop: "1.5px solid rgba(33,27,23,.1)" }}>{k}</span>
                <span style={{ padding: "14px 18px", borderTop: "1.5px solid rgba(33,27,23,.1)" }}>{a}</span>
                <b
                  style={{
                    padding: "14px 18px",
                    borderTop: "1.5px solid rgba(179,38,30,.15)",
                    background: "rgba(179,38,30,.07)",
                    borderRadius: i === rows.length - 1 ? "0 0 18px 18px" : 0,
                  }}
                >
                  {b}
                </b>
              </Fragment>
            ))}
          </div>
          <p style={{ marginTop: 50, fontSize: 36, fontWeight: 800 }}>같은 개띠 친구 셋이라도</p>
          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, textAlign: "center" }}>
            {friends.map((x) => (
              <div key={x.h} style={{ padding: "22px 0", borderRadius: 22, background: "rgba(33,27,23,.045)" }}>
                <p style={{ fontSize: 26, color: SOFT, fontFamily: sans }}>개띠</p>
                <p style={{ marginTop: 4, fontSize: 84, lineHeight: 1.05, fontFamily: brush, color: SEAL }}>{x.h}</p>
                <p style={{ marginTop: 4, fontSize: 32, fontWeight: 800 }}>날은 {x.ani}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, padding: "28px 34px", borderRadius: 22, background: "rgba(33,27,23,.05)", fontFamily: sans }}>
            <p style={{ fontSize: 31, lineHeight: 1.6 }}>
              내 날의 동물이 궁금하면 <b>60갑자 표</b>에서 태어난 날을 찾거나, 훈도사주 <b>무료 사주 분석</b>에서 바로 볼 수 있어요.
            </p>
          </div>
        </div>
        <Brand />
      </Frame>
    );
  }
  const YEAR_COLORS = [
    { stems: "甲乙", el: "나무", color: "푸른", swatch: "#3f7a5a", ex: "2024 갑진년 · 푸른 용" },
    { stems: "丙丁", el: "불", color: "붉은", swatch: "#b3261e", ex: "2026 병오년 · 붉은 말" },
    { stems: "戊己", el: "흙", color: "누런(황금)", swatch: "#c9a13b", ex: "2019 기해년 · 황금돼지" },
    { stems: "庚辛", el: "쇠", color: "하얀", swatch: "#e9e4d8", ex: "2020 경자년 · 흰 쥐" },
    { stems: "壬癸", el: "물", color: "검은", swatch: "#1d1d22", ex: "2012 임진년 · 흑룡" },
  ];
  if (c === "ny-cover")
    return (
      <Frame dark>
        <BrushFont hf={String(q.hf ?? "")} />
        <CornerBrand />
        <p style={{ position: "absolute", top: 72, right: 70, fontSize: 30, fontWeight: 800, color: GOLD }}>2027</p>
        <div style={{ position: "absolute", top: 200, left: 0, right: 0, textAlign: "center" }}>
          <p style={{ fontSize: 34, letterSpacing: "0.3em", color: GOLD, fontWeight: 800 }}>丁未年</p>
          <p style={{ marginTop: 10, fontSize: 250, lineHeight: 1, fontFamily: brush, color: "#e2553f", textShadow: "0 6px 30px rgba(226,85,63,.35)" }}>丁未</p>
          <p style={{ marginTop: 26, display: "flex", justifyContent: "center", gap: 14 }}>
            {["황금돼지", "흑룡", "붉은 말", "붉은 양?"].map((t, i) => (
              <span key={t} style={{ padding: "8px 20px", borderRadius: 999, border: `2px solid ${i === 3 ? GOLD : "rgba(212,175,95,.4)"}`, color: i === 3 ? "#f1cf7a" : "rgba(244,236,219,.75)", fontSize: 30, fontWeight: 800 }}>
                {t}
              </span>
            ))}
          </p>
        </div>
        <div style={{ position: "absolute", top: 790, left: 64 }}>
          <div style={{ width: 170, height: 170, borderRadius: "50%", overflow: "hidden", border: `6px solid ${GOLD}`, background: HANJI, boxShadow: "0 10px 24px rgba(0,0,0,.4)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hundo-face.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ position: "absolute", left: -12, top: -84, padding: "12px 22px", background: "#fff", color: INK, borderRadius: 22, fontSize: 32, fontWeight: 800, whiteSpace: "nowrap", boxShadow: "0 8px 20px rgba(0,0,0,.3)" }}>
            {q.say ? String(q.say) : "색에도 까닭이 있사옵니다"}
          </div>
        </div>
        <ThumbTitle top="2027 정미년 · 해마다 붙는 색의 비밀" main="왜 붉은 양일까?" />
      </Frame>
    );
  if (c === "ny-color")
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 120, left: 90, right: 90 }}>
          <Label>색은 해 이름의 앞 글자에서</Label>
          <p style={{ marginTop: 14, fontSize: 60, fontWeight: 800, lineHeight: 1.2 }}>앞 글자가 색을 정해요</p>
          <Body style={{ marginTop: 14, fontSize: 31, color: INK }}>하늘 글자 열 개는 둘씩 다섯 기운이고, 기운마다 제 색이 있어요</Body>
          <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 14 }}>
            {YEAR_COLORS.map((x) => (
              <div key={x.stems} style={{ display: "flex", alignItems: "center", gap: 24, padding: "18px 26px", borderRadius: 20, background: x.stems === "丙丁" ? "rgba(179,38,30,.09)" : "rgba(33,27,23,.045)", border: x.stems === "丙丁" ? `3px solid ${SEAL}` : "3px solid transparent" }}>
                <span style={{ flexShrink: 0, width: 58, height: 58, borderRadius: "50%", background: x.swatch, boxShadow: "inset 0 0 0 2px rgba(0,0,0,.15)" }} />
                <span style={{ flexShrink: 0, width: 120, fontSize: 52, lineHeight: 1, fontFamily: brush, color: INK }}>{x.stems}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ display: "block", fontSize: 36 }}>
                    {x.el} → {x.color}
                  </b>
                  <span style={{ display: "block", marginTop: 2, fontSize: 25, color: SOFT, fontFamily: sans }}>{x.ex}</span>
                </span>
              </div>
            ))}
          </div>
          <Body style={{ marginTop: 26, fontSize: 30, color: INK }}>
            2027년의 앞 글자는 <b style={{ color: SEAL }}>丁</b>. 불의 글자라 <b style={{ color: SEAL }}>붉은</b> 해예요.
          </Body>
        </div>
        <Brand />
      </Frame>
    );
  if (c === "ny-animal")
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 130, left: 90, right: 90 }}>
          <Label>동물은 해 이름의 뒤 글자에서</Label>
          <p style={{ marginTop: 14, fontSize: 60, fontWeight: 800, lineHeight: 1.2 }}>뒤 글자가 띠를 정해요</p>
          <Body style={{ marginTop: 14, fontSize: 31, color: INK }}>땅 글자 열두 개가 곧 열두 띠예요</Body>
          <div style={{ marginTop: 34, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {BRANCHES.map((b, i) => (
              <div key={b} style={{ padding: "18px 0 14px", borderRadius: 18, textAlign: "center", background: i === 7 ? "rgba(179,38,30,.09)" : "rgba(33,27,23,.045)", border: i === 7 ? `3px solid ${SEAL}` : "3px solid transparent" }}>
                <p style={{ fontSize: 62, lineHeight: 1, fontFamily: brush, color: i === 7 ? SEAL : INK }}>{b}</p>
                <p style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: i === 7 ? SEAL : SOFT }}>{ANIMALS[i]}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, textAlign: "center" }}>
            <p style={{ fontSize: 40, fontWeight: 800 }}>
              <span style={{ fontFamily: brush, color: SEAL, fontSize: 60 }}>丁</span> 붉은 + <span style={{ fontFamily: brush, color: SEAL, fontSize: 60 }}>未</span> 양
            </p>
            <p style={{ marginTop: 10, fontSize: 48, fontWeight: 800, color: SEAL }}>= 붉은 양의 해</p>
          </div>
        </div>
        <Brand />
      </Frame>
    );
  if (c === "ny-what")
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 140, left: 90, right: 90 }}>
          <Label>그럼 정미년은 어떤 해일까?</Label>
          <p style={{ marginTop: 14, fontSize: 60, fontWeight: 800, lineHeight: 1.2 }}>해가 지고, 모닥불이 남는 해</p>
          <div style={{ marginTop: 44, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {[
              { y: "2026", h: "丙午", img: "한여름 한낮의 태양", d: "크게 타오르고 멀리까지 비추는 해" },
              { y: "2027", h: "丁未", img: "여름밤 들판의 모닥불", d: "가까운 곳을 오래 밝히는 해" },
            ].map((x, i) => (
              <div key={x.y} style={{ padding: "32px 24px", borderRadius: 22, textAlign: "center", background: i ? "rgba(179,38,30,.08)" : "rgba(33,27,23,.045)", border: i ? `3px solid ${SEAL}` : "3px solid transparent" }}>
                <p style={{ fontSize: 26, color: SOFT, fontWeight: 800 }}>{x.y}</p>
                <p style={{ marginTop: 4, fontSize: 96, lineHeight: 1.1, fontFamily: brush, color: i ? SEAL : INK }}>{x.h}</p>
                <p style={{ marginTop: 12, fontSize: 32, fontWeight: 800 }}>{x.img}</p>
                <p style={{ marginTop: 8, fontSize: 26, color: SOFT, fontFamily: sans, lineHeight: 1.4 }}>{x.d}</p>
              </div>
            ))}
          </div>
          <Body style={{ marginTop: 36, fontSize: 33, color: INK }}>
            丁은 태양이 아닌 <b>촛불·등불</b> 같은 불, 未는 여름 끝의 <b>따뜻한 흙</b>이에요. 크게 벌이기보다 곁을 밝히고, 벌여 둔 일을 다지기 좋은 기운이에요.
          </Body>
          <Body style={{ marginTop: 14, fontSize: 28 }}>같은 해라도 사주에 따라 누구에겐 기회, 누구에겐 숨 고르기예요</Body>
          <div style={{ marginTop: 34, padding: "28px 32px", borderRadius: 20, background: "rgba(212,175,95,.14)" }}>
            <p style={{ fontSize: 34, fontWeight: 800 }}>1967년생이시라면</p>
            <p style={{ marginTop: 8, fontSize: 30, lineHeight: 1.5, fontFamily: sans }}>태어난 해도 丁未년. 2027년은 태어난 해가 돌아오는 환갑이에요</p>
          </div>
        </div>
        <Brand />
      </Frame>
    );

  // ── The pinned row (see PinBanner).
  if (c === "pin-wide") return <PinBanner k={null} />;
  if (c === "pin-1" || c === "pin-2" || c === "pin-3") return <PinBanner k={(Number(c.slice(4)) - 1) as 0 | 1 | 2} />;

  // ── The introduction post.
  if (c === "intro-1")
    return (
      <Frame dark>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cards/gwansanggam.webp" alt="" style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1440, objectFit: "cover", objectPosition: "50% 100%" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,22,40,.55), transparent 38%, transparent 72%, rgba(10,22,40,.85))" }} />
        <div style={{ position: "absolute", inset: 36, border: "3px solid rgba(212,175,95,.55)" }} />
        <div style={{ position: "absolute", top: 104, left: 0, right: 0, textAlign: "center", textShadow: "0 2px 14px rgba(0,0,0,.6)" }}>
          <p style={{ fontSize: 40, letterSpacing: "0.4em", color: GOLD, fontWeight: 800 }}>觀象監</p>
          <p style={{ marginTop: 34, fontSize: 70, fontWeight: 800, lineHeight: 1.35 }}>
            소신, 관상감
            <br />
            명과학 훈도 정가이옵니다
          </p>
          <p style={{ marginTop: 30, fontSize: 38, lineHeight: 1.6, color: "rgba(244,236,219,.95)" }}>
            왕실의 사주와 길일을 보던 눈으로,
            <br />
            이제 그대의 여덟 글자를 보겠사옵니다
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cards/hundo-books.webp"
          alt=""
          style={{ position: "absolute", bottom: 176, left: "50%", transform: "translateX(-50%)", height: 580, filter: "drop-shadow(0 14px 24px rgba(0,0,0,.5))" }}
        />
        <Brand dark />
      </Frame>
    );
  if (c === "intro-gwan") {
    // What 관상감 was (한국민족문화대백과사전, 『경국대전』): its three schools, 명과학 being the one that read fate and days.
    const schools = [
      { h: "天", t: "천문학", d: "별과 해를 보고, 달력을 만들고" },
      { h: "地", t: "지리학", d: "땅의 기운을 살피고" },
      { h: "命", t: "명과학", d: "사람의 운명과 좋은 날을 읽었사옵니다" },
    ];
    return (
      <Frame>
        <div style={{ position: "absolute", top: 180, left: 100, right: 100 }}>
          <div style={{ textAlign: "center" }}>
            <Label>觀象監</Label>
            <p style={{ marginTop: 14, fontSize: 66, fontWeight: 800 }}>관상감은 어떤 곳이옵니까</p>
            <p style={{ marginTop: 12, fontSize: 36, color: SOFT }}>조선의 하늘을 맡던 관청이옵니다</p>
          </div>
          <div style={{ marginTop: 64, display: "flex", flexDirection: "column", gap: 30 }}>
            {schools.map((x, i) => {
              const ours = i === schools.length - 1;
              return (
                <div key={x.t} className="doc-paper" style={{ display: "flex", alignItems: "center", gap: 30, padding: "32px 34px" }}>
                  <span
                    style={{
                      flexShrink: 0,
                      width: 96,
                      height: 96,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 60,
                      fontWeight: 800,
                      color: ours ? HANJI : SEAL,
                      background: ours ? SEAL : "transparent",
                      border: `4px solid ${SEAL}`,
                    }}
                  >
                    {x.h}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 42, fontWeight: 800 }}>
                      {x.t}
                      {ours && <span style={{ marginLeft: 16, fontSize: 26, color: SEAL }}>· 정 훈도가 있는 곳</span>}
                    </p>
                    <p style={{ marginTop: 6, fontSize: 30, color: SOFT, fontFamily: sans }}>{x.d}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 44, textAlign: "center", fontSize: 30, lineHeight: 1.7, color: INK }}>
            <p>
              지금으로 치면 <b>기상청과 천문대</b>
            </p>
            <p style={{ color: SOFT }}>1466년(세조 12), 관상감이라는 이름을 얻다</p>
          </div>
        </div>
        <Brand />
      </Frame>
    );
  }
  if (c === "intro-hundo") {
    return (
      <Frame dark>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cards/hundo-scroll.webp"
          alt=""
          style={{ position: "absolute", left: -150, bottom: 170, height: 960, filter: "drop-shadow(0 14px 24px rgba(0,0,0,.45))" }}
        />
        <div style={{ position: "absolute", top: 290, left: 470, right: 90 }}>
          <p style={{ fontSize: 30, letterSpacing: "0.2em", color: GOLD, fontWeight: 800 }}>鄭 訓導</p>
          <p style={{ marginTop: 10, fontSize: 88, fontWeight: 800, lineHeight: 1.1 }}>정 훈도</p>
          <p style={{ marginTop: 18, fontSize: 32, fontWeight: 800 }}>관상감 명과학 훈도 · 정9품</p>
          <div style={{ marginTop: 44, borderTop: "1.5px solid rgba(212,175,95,.4)", paddingTop: 20 }}>
            <p style={{ fontSize: 24, color: GOLD, fontWeight: 800, fontFamily: sans }}>하는 일</p>
            <p style={{ marginTop: 8, fontSize: 36, lineHeight: 1.45, fontWeight: 800 }}>
              여덟 글자를 읽고,
              <br />
              좋은 날을 고르옵니다
            </p>
          </div>
          <div style={{ marginTop: 44, borderTop: "1.5px solid rgba(212,175,95,.4)", paddingTop: 28 }}>
            <p style={{ fontSize: 44, fontWeight: 800, color: GOLD, lineHeight: 1.3 }}>배움에는 끝이 없사옵니다</p>
            <p style={{ marginTop: 18, fontSize: 32, lineHeight: 1.65, color: "rgba(244,236,219,.92)" }}>
              오늘도 명리서를 펴고 풀이를 다듬어,
              <br />
              더 정확하게 읽어 드리겠사옵니다
            </p>
          </div>
          <p style={{ marginTop: 56, fontSize: 22, color: "rgba(244,236,219,.55)", fontFamily: sans }}>※ 정 훈도는 실제 관직을 빌린 가상의 인물이옵니다</p>
        </div>
        <Brand dark />
      </Frame>
    );
  }
  if (c === "intro-2") {
    // The home page's topic tiles, as they read on the site.
    const topics = [
      { t: "평생 사주", d: "나는 어떤 사람이고 어떻게 살아갈까?" },
      { t: "연운", d: "그해 나한테 무슨 일이? 지난해도, 앞으로의 해도" },
      { t: "재물운", d: "돈이 왜 안 모일까, 언제 트일까?" },
      { t: "연애·결혼", d: "나랑 맞는 사람은 언제 올까?" },
      { t: "직업·적성", d: "지금 일, 나랑 맞을까?" },
      { t: "궁합", d: "우리, 진짜 잘 맞을까?" },
      { t: "택일", d: "결혼·이사·계약·면접, 언제 할까?" },
    ];
    return (
      <Frame>
        <div style={{ position: "absolute", top: 185, left: 96, right: 96 }}>
          <div style={{ textAlign: "center" }}>
            <Label>훈도사주에서 볼 수 있는 것</Label>
            <p style={{ marginTop: 14, fontSize: 64, fontWeight: 800 }}>무엇이 궁금하시옵니까</p>
          </div>
          <div style={{ marginTop: 38, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
            {topics.map((x, i) => (
              <div key={x.t} className="doc-paper" style={{ gridColumn: i === topics.length - 1 ? "span 2" : undefined, padding: "32px 30px 30px" }}>
                <p style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.1 }}>{x.t}</p>
                <p style={{ marginTop: 10, fontSize: 25, lineHeight: 1.4, color: SOFT, fontFamily: sans }}>{x.d}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 40, textAlign: "center", fontSize: 30, color: SOFT }}>새로 익히는 대로, 하나씩 더 올리겠사옵니다</p>
        </div>
        <Brand />
      </Frame>
    );
  }

  // The last slide of every carousel: the site for the reader's own chart, then a reason to follow.
  return (
    <Frame dark>
      <div style={{ position: "absolute", top: 165, left: 0, right: 0, textAlign: "center" }}>
        <p style={{ fontSize: 34, letterSpacing: "0.3em", color: GOLD, fontWeight: 800 }}>明 課 學 訓 導</p>
        <p style={{ marginTop: 40, fontSize: 76, fontWeight: 800, lineHeight: 1.3 }}>
          {q.who === "saju" ? "그대의 여덟 글자가" : "내 일간이"}
          <br />
          궁금하다면?
        </p>
        <p style={{ marginTop: 30, fontSize: 38, lineHeight: 1.6, color: "rgba(244,236,219,.9)" }}>
          생년월일만 넣으면,
          <br />
          정 훈도가 풀어 드리옵니다
        </p>
        <p style={{ marginTop: 34, display: "inline-block", padding: "18px 44px", borderRadius: 999, background: GOLD, color: INK, fontSize: 36, fontWeight: 800 }}>
          프로필 링크에서 보기
        </p>
      </div>
      <Hundo src="/hundo-bow.png" size={230} bottom={400} />
      <div style={{ position: "absolute", left: 150, right: 150, bottom: 200, paddingTop: 26, borderTop: "1.5px solid rgba(212,175,95,.45)", textAlign: "center" }}>
        <p style={{ fontSize: 31, lineHeight: 1.55, color: GOLD, fontWeight: 800 }}>여덟 글자 속 이야기를 날마다 올리옵니다</p>
        <p style={{ marginTop: 4, fontSize: 29, color: "rgba(244,236,219,.85)" }}>저장해 두고 팔로우하시옵소서</p>
      </div>
      <Brand dark />
    </Frame>
  );
}
