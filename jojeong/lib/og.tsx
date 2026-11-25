import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { CHARACTER, SERVICE_NAME, SITE_NAME, SITE_TAGLINE, TAGLINE, type Mood } from "./brand";
import type { Seat } from "./court";
import { decreeLine } from "./decree";
import { kingLinkText } from "./kings";
import { KING_TYPES } from "./kingTypes";
import { type Tier } from "./reign";
import { type Cast, sillok } from "./sillok";
import { moodFor, ROLES } from "./roles";
import type { Pillars, RoleKey } from "./saju";

const [regular, bold] = await Promise.all([
  readFile(join(process.cwd(), "assets/fonts/NanumMyeongjo-400.ttf")),
  readFile(join(process.cwd(), "assets/fonts/NanumMyeongjo-800.ttf")),
]);
const art = Object.fromEntries(
  await Promise.all(
    (Object.keys(CHARACTER) as Mood[]).map(async (mood) => {
      const png = await readFile(join(process.cwd(), "public", CHARACTER[mood]));
      return [mood, `data:image/png;base64,${png.toString("base64")}`] as const;
    }),
  ),
) as Record<Mood, string>;

const sinsalFour = `data:image/jpeg;base64,${(await readFile(join(process.cwd(), "public/sinsal/og-four.jpg"))).toString("base64")}`;

const throne = `data:image/svg+xml;base64,${(await readFile(join(process.cwd(), "public/irworobongdo.svg"))).toString("base64")}`;

const C = { hanji: "#f4ecdb", deep: "#e9dcc0", ink: "#211b17", soft: "#62564c", seal: "#b3261e", gold: "#a87a22" };

function render(node: React.ReactElement, width: number, height: number) {
  return new ImageResponse(node, {
    width,
    height,
    fonts: [
      { name: "Myeongjo", data: regular, weight: 400, style: "normal" },
      { name: "Myeongjo", data: bold, weight: 800, style: "normal" },
    ],
    headers: { "Cache-Control": "public, max-age=60, s-maxage=60" },
  });
}

function Portrait({ mood, size }: { mood: Mood; size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser
    <img
      src={art[mood]}
      width={size}
      height={size}
      alt=""
      style={{ borderRadius: size / 2, border: `${Math.round(size / 40)}px solid ${C.gold}`, background: "#fff" }}
    />
  );
}

function Seal({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `${Math.round(size / 18)}px solid ${C.seal}`,
        borderRadius: size / 8,
        color: C.seal,
        fontSize: size / 3.2,
        fontWeight: 800,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1.05,
        transform: "rotate(-8deg)",
      }}
    >
      <div>御</div>
      <div>寶</div>
    </div>
  );
}

// Every image is a royal document: hanji paper with a red double frame on a dark lacquer ground, rolled on
// wooden rods (top and bottom for the tall story images, left and right for the wide link previews).
const frame = (width: number, height: number): React.CSSProperties => ({
  width,
  height,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  background: "#2b1d12",
  color: C.ink,
  fontFamily: "Myeongjo",
  position: "relative",
});

const ROD = "linear-gradient(180deg, #8a5c33, #4a2e17 60%, #2e1c0d)";
const ROD_SIDE = "linear-gradient(90deg, #8a5c33, #4a2e17 60%, #2e1c0d)";
const CAP = "radial-gradient(circle at 35% 35%, #f3d383, #a8781f)";

// Satori paints in document order, so this goes first and the content is drawn over the paper.
function InnerRule({ width, accent }: { width: number; accent: string }) {
  const wide = width === 1200;
  const height = wide ? 630 : 1920;
  const padX = wide ? 44 : 40;
  const padY = wide ? 26 : 66;
  const rod = wide ? 24 : 30;
  const cap = wide ? 34 : 42;
  const inset = wide ? 18 : 24;
  const rule = (d: number, w: number, color: string) => (
    <div
      style={{
        position: "absolute",
        top: padY + d,
        left: padX + d,
        width: width - 2 * (padX + d),
        height: height - 2 * (padY + d),
        border: `${w}px solid ${color}`,
        display: "flex",
      }}
    />
  );
  const rods = wide
    ? [
        { left: padX - rod / 2, top: padY - 16, width: rod, height: height - 2 * padY + 32, background: ROD_SIDE },
        { left: width - padX - rod / 2, top: padY - 16, width: rod, height: height - 2 * padY + 32, background: ROD_SIDE },
      ]
    : [
        { left: padX - 22, top: padY - rod / 2, width: width - 2 * padX + 44, height: rod, background: ROD },
        { left: padX - 22, top: height - padY - rod / 2, width: width - 2 * padX + 44, height: rod, background: ROD },
      ];
  return (
    <div style={{ position: "absolute", top: 0, left: 0, width, height, display: "flex" }}>
      <div style={{ position: "absolute", top: padY, left: padX, width: width - 2 * padX, height: height - 2 * padY, background: "#f9f1de", display: "flex" }} />
      {rule(inset, wide ? 4 : 6, accent === C.gold ? "rgba(179, 38, 30, 0.7)" : "rgba(179, 38, 30, 0.8)")}
      {rule(inset + (wide ? 10 : 14), 2, "rgba(179, 38, 30, 0.4)")}
      {rods.map((r, i) => (
        <div key={i} style={{ position: "absolute", ...r, borderRadius: rod / 2, display: "flex" }} />
      ))}
      {rods.flatMap((r, i) => {
        const ends = wide
          ? [
              { left: r.left + (rod - cap) / 2, top: r.top - cap / 2 },
              { left: r.left + (rod - cap) / 2, top: r.top + r.height - cap / 2 },
            ]
          : [
              { left: r.left - cap / 2, top: r.top + (rod - cap) / 2 },
              { left: r.left + r.width - cap / 2, top: r.top + (rod - cap) / 2 },
            ];
        return ends.map((e, k) => (
          <div
            key={`${i}-${k}`}
            style={{ position: "absolute", ...e, width: cap, height: cap, borderRadius: cap / 2, background: CAP, display: "flex" }}
          />
        ));
      })}
    </div>
  );
}

// A column of 훈도의 사주 이야기 (app/column/[slug]/opengraph-image.tsx): its section and level, the topic large and
// the subtitle under it, as the title shows on the page.
export function columnImage({ level, head, sub }: { level: string; head: string; sub?: string }) {
  return render(
    <div style={{ ...frame(1200, 630), justifyContent: "center", paddingBottom: 110 }}>
      <InnerRule width={1200} accent={C.seal} />
      <div style={{ fontSize: 30, color: C.seal, fontWeight: 800, letterSpacing: 2 }}>{`훈도의 사주 이야기, ${level}`}</div>
      <div style={{ marginTop: 22, fontSize: head.length > 18 ? 60 : 72, fontWeight: 800, textAlign: "center", maxWidth: 1000 }}>{head}</div>
      {sub && <div style={{ marginTop: 18, fontSize: 36, color: C.soft, textAlign: "center", maxWidth: 960 }}>{sub}</div>}
      <div style={{ position: "absolute", left: 80, bottom: 56, display: "flex" }}>
        <Portrait mood="face" size={130} />
      </div>
      <div style={{ position: "absolute", right: 90, bottom: 66, display: "flex", fontSize: 30, color: C.gold, fontWeight: 800 }}>{SITE_NAME}</div>
    </div>,
    1200,
    630,
  );
}

// The preview of a friend's shared result (app/s/[kind]/[token]): who, a badge (the rank or the day pillar), the
// verdict large, and one line under it.
export function shareImage({ top, badge, big, small }: { top: string; badge?: string; big: string; small: string }) {
  return render(
    <div style={{ ...frame(1200, 630), justifyContent: "center", paddingBottom: 130 }}>
      <InnerRule width={1200} accent={C.seal} />
      <div style={{ fontSize: 34, color: C.soft, fontWeight: 800 }}>{top}</div>
      {badge && <div style={{ marginTop: 16, display: "flex", fontSize: 50, color: C.seal, fontWeight: 800, border: `5px solid ${C.seal}`, padding: "0 26px" }}>{badge}</div>}
      <div style={{ marginTop: 18, fontSize: big.length > 16 ? 60 : big.length > 10 ? 78 : 92, fontWeight: 800, textAlign: "center" }}>{big}</div>
      <div style={{ marginTop: 18, fontSize: 28, color: C.soft, textAlign: "center", maxWidth: 900 }}>{small}</div>
      <div style={{ position: "absolute", left: 80, bottom: 56, display: "flex" }}>
        <Portrait mood="face" size={130} />
      </div>
      <div style={{ position: "absolute", right: 90, bottom: 66, display: "flex", fontSize: 30, color: C.gold, fontWeight: 800 }}>{SITE_NAME}</div>
    </div>,
    1200,
    630,
  );
}

// A friend's 신살 도감 link: four of the twenty characters and the question, the sender's cards kept hidden.
export function sinsalShareImage(name: string) {
  return render(
    <div style={{ width: 1200, height: 630, display: "flex", position: "relative", fontFamily: "Myeongjo" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser */}
      <img src={sinsalFour} width={1200} height={630} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 230,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 40,
          background: "linear-gradient(180deg, rgba(15,34,54,0), rgba(15,34,54,0.95) 45%)",
        }}
      >
        <div style={{ fontSize: 58, fontWeight: 800, color: C.hanji }}>{`${name}님이 신살 유형 테스트를 보냈어요`}</div>
        <div style={{ marginTop: 10, fontSize: 30, color: "#d4af5f", fontWeight: 800 }}>{`나는 어떤 살의 사람일까, ${SITE_NAME}`}</div>
      </div>
    </div>,
    1200,
    630,
  );
}

export function inviteImage(kingName: string, king: Pillars, ministerCount: number) {
  return render(
    <div style={{ ...frame(1200, 630), justifyContent: "center" }}>
      <InnerRule width={1200} accent={C.seal} />
      <div style={{ fontSize: 30, letterSpacing: 16, color: C.seal, fontWeight: 800 }}>敎 旨</div>
      <div style={{ marginTop: 22, fontSize: 34, color: C.gold, fontWeight: 800 }}>{KING_TYPES[king.dayStem].title}</div>
      <div style={{ marginTop: 6, fontSize: 76, fontWeight: 800 }}>{`${kingName} 전하께서`}</div>
      <div style={{ fontSize: 76, fontWeight: 800 }}>그대를 부르셨사옵니다</div>
      <div style={{ marginTop: 28, fontSize: 30, color: C.soft }}>
        {ministerCount > 0 ? `이미 ${ministerCount}명이 입궐했사옵니다, 사주로 관직 받기` : "사주로 관직을 받아보시옵소서"}
      </div>
      <div style={{ position: "absolute", left: 96, bottom: 58, display: "flex" }}>
        <Portrait mood="decree" size={190} />
      </div>
      <div style={{ position: "absolute", right: 104, bottom: 66, display: "flex" }}>
        <Seal size={120} />
      </div>
    </div>,
    1200,
    630,
  );
}

export function ministerImage(kingName: string, name: string, role: RoleKey, score: number) {
  const r = ROLES[role];
  const danger = r.tone === "red" || r.tone === "gray";
  return render(
    <div style={{ ...frame(1200, 630), justifyContent: "center" }}>
      <InnerRule width={1200} accent={danger ? C.seal : C.gold} />
      <div style={{ fontSize: 30, color: C.soft }}>{`${kingName} 전하께서`}</div>
      <div style={{ marginTop: 8, fontSize: 44, fontWeight: 800 }}>{decreeLine(name, role)}</div>
      <div style={{ marginTop: 20, fontSize: 150, fontWeight: 800, color: danger ? C.seal : C.ink }}>{r.title}</div>
      <div style={{ marginTop: 8, fontSize: 32, color: C.gold, fontWeight: 800 }}>{`${r.rank}, 궁합 ${score}점`}</div>
      <div style={{ position: "absolute", left: 96, bottom: 58, display: "flex" }}>
        <Portrait mood={moodFor(role)} size={190} />
      </div>
      <div style={{ position: "absolute", right: 104, bottom: 66, display: "flex" }}>
        <Seal size={120} />
      </div>
    </div>,
    1200,
    630,
  );
}

function StoryFooter() {
  return (
    <div style={{ position: "absolute", bottom: 124, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: 58, fontWeight: 800 }}>{SERVICE_NAME}</div>
      <div style={{ marginTop: 10, fontSize: 32, color: C.soft }}>{TAGLINE}</div>
    </div>
  );
}

export function ministerStory(kingName: string, name: string, role: RoleKey, score: number) {
  const r = ROLES[role];
  const danger = r.tone === "red" || r.tone === "gray";
  return render(
    <div style={{ ...frame(1080, 1920), paddingTop: 220 }}>
      <InnerRule width={1080} accent={danger ? C.seal : C.gold} />
      <div style={{ fontSize: 52, letterSpacing: 28, color: C.seal, fontWeight: 800 }}>敎 旨</div>
      <div style={{ marginTop: 110, fontSize: 48, color: C.soft }}>{`${kingName} 전하께서`}</div>
      <div style={{ marginTop: 16, fontSize: 60, fontWeight: 800 }}>{decreeLine(name, role)}</div>
      <div style={{ marginTop: 90, fontSize: 210, fontWeight: 800, color: danger ? C.seal : C.ink }}>{r.title}</div>
      <div style={{ marginTop: 20, fontSize: 48, color: C.gold, fontWeight: 800 }}>{r.rank}</div>
      <div style={{ marginTop: 40, fontSize: 50, lineHeight: 1.5, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {balancedLines(`“${r.tagline}”`, 16).map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
      <div
        style={{
          marginTop: 70,
          padding: "20px 56px",
          borderRadius: 999,
          background: C.deep,
          fontSize: 52,
          display: "flex",
        }}
      >{`궁합 ${score}점`}</div>
      <div style={{ marginTop: 70, display: "flex", alignItems: "center", gap: 60 }}>
        <Portrait mood={moodFor(role)} size={250} />
        <Seal size={180} />
      </div>
      <StoryFooter />
    </div>,
    1080,
    1920,
  );
}

export function courtStory(kingName: string, seats: Seat[]) {
  const shown = seats.slice(0, 11);
  const rest = seats.length - shown.length;
  return render(
    <div style={{ ...frame(1080, 1920), paddingTop: 150 }}>
      <InnerRule width={1080} accent={C.seal} />
      <div style={{ fontSize: 46, letterSpacing: 24, color: C.seal, fontWeight: 800 }}>朝 廷 圖</div>
      <div style={{ marginTop: 40, fontSize: 84, fontWeight: 800 }}>{`${kingName} 전하의 조정`}</div>
      <div style={{ marginTop: 14, fontSize: 38, color: C.soft }}>{`신하 ${seats.length}명, 간신 ${seats.filter((s) => s.role === "gansin").length}명 적발`}</div>
      <div style={{ marginTop: 60, width: 880, display: "flex", flexDirection: "column" }}>
        {shown.map((s) => {
          const r = ROLES[s.role];
          const danger = r.tone === "red" || r.tone === "gray";
          return (
            <div
              key={s.minister.id}
              style={{
                display: "flex",
                alignItems: "center",
                height: 96,
                borderBottom: `2px solid ${C.deep}`,
                fontSize: 44,
              }}
            >
              <div style={{ width: 250, fontWeight: 800, color: danger ? C.seal : r.tone === "gold" ? C.gold : C.ink }}>
                {r.title}
              </div>
              <div style={{ flex: 1, display: "flex" }}>{s.minister.name}</div>
              <div style={{ fontWeight: 800, display: "flex" }}>{s.match.score}</div>
            </div>
          );
        })}
        {rest > 0 && (
          <div style={{ marginTop: 20, fontSize: 36, color: C.soft, display: "flex", justifyContent: "center" }}>{`외 ${rest}명`}</div>
        )}
      </div>
      <StoryFooter />
    </div>,
    1080,
    1920,
  );
}

// Satori breaks Korean mid-word, so long lines are split by hand at the space nearest the middle.
function balancedLines(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const mid = text.length / 2;
  let best = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  }
  return best < 0 ? [text] : [text.slice(0, best), text.slice(best + 1)];
}

export function kingStory(kingName: string, king: Pillars) {
  const t = KING_TYPES[king.dayStem];
  const { short } = kingLinkText(king);
  const record = sillok(king, { kingName });
  return render(
    <div style={{ ...frame(1080, 1920), paddingTop: 220 }}>
      <InnerRule width={1080} accent={C.gold} />
      <div style={{ fontSize: 52, letterSpacing: 24, color: C.seal, fontWeight: 800 }}>卽 位 敎 書</div>
      <div style={{ marginTop: 120, fontSize: 52, color: C.soft }}>{`${kingName} 전하는`}</div>
      <div style={{ marginTop: 30, fontSize: 150, fontWeight: 800 }}>{t.title}</div>
      <div style={{ marginTop: 20, fontSize: 44, color: C.gold, fontWeight: 800 }}>{t.symbol}</div>
      <div style={{ marginTop: 18, fontSize: 38, color: C.soft }}>
        {`${record.tierLabel}, ${record.deposed ? `폐위되어 ${record.epithet}` : `존호 ${record.epithet}`}, 향년 ${record.death}세`}
      </div>
      <div style={{ marginTop: 50, fontSize: 46, lineHeight: 1.5, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {balancedLines(`“${t.tagline}”`, 18).map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
      <div
        style={{
          marginTop: 80,
          width: 860,
          padding: "34px 40px",
          borderRadius: 32,
          background: "rgba(179, 38, 30, 0.07)",
          border: `3px solid rgba(179, 38, 30, 0.3)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 34, color: C.seal, fontWeight: 800 }}>실록 속 같은 사주의 왕</div>
        <div style={{ marginTop: 14, fontSize: 50, fontWeight: 800, textAlign: "center", display: "flex", justifyContent: "center" }}>
          {short}
        </div>
      </div>
      <div style={{ marginTop: 80, display: "flex", alignItems: "center", gap: 60 }}>
        <Portrait mood="bow" size={250} />
        <Seal size={180} />
      </div>
      <StoryFooter />
    </div>,
    1080,
    1920,
  );
}

// Link preview for the landing page: the same throne scene as the hero, with the pitch beside it.
export function landingImage() {
  return render(
    <div style={{ width: 1200, height: 630, display: "flex", background: "#17304a", fontFamily: "Myeongjo", position: "relative" }}>
      <div style={{ width: 615, height: 630, display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 72 }}>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            padding: "8px 22px",
            borderRadius: 999,
            border: "2px solid rgba(243, 234, 208, 0.5)",
            color: "#f3ead0",
            fontSize: 26,
            fontWeight: 800,
          }}
        >
          조선 왕실도 사주를 봤다
        </div>
        <div style={{ marginTop: 26, fontSize: 92, fontWeight: 800, color: "#f7efd9", whiteSpace: "nowrap" }}>{SERVICE_NAME}</div>
        <div style={{ marginTop: 6, fontSize: 40, fontWeight: 800, color: "#e9c46a" }}>옥좌의 주인을 찾사옵니다</div>
        <div style={{ marginTop: 34, fontSize: 28, color: "#cfdad7", display: "flex", flexDirection: "column", lineHeight: 1.5 }}>
          <div>성군일까 폭군일까, 사주로 보는 내 치세</div>
          <div>벗들을 부르면 사주가 관직을 내리옵니다</div>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser */}
      <img src={throne} width={585} height={630} alt="" style={{ position: "absolute", right: 0, top: 0 }} />
      <div style={{ position: "absolute", right: 28, bottom: 28, display: "flex" }}>
        <Portrait mood="bow" size={120} />
      </div>
    </div>,
    1200,
    630,
  );
}

// Share image for the main page: 정 훈도's present-day readings.
export function storeImage() {
  return render(
    <div style={{ width: 1200, height: 630, display: "flex", background: "#f4ecdb", fontFamily: "Myeongjo", position: "relative" }}>
      <div style={{ width: 820, height: 630, display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 80 }}>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: "#b3261e", letterSpacing: 12 }}>觀象監</div>
        <div style={{ marginTop: 18, fontSize: 88, fontWeight: 800, color: "#1f1a14", whiteSpace: "nowrap" }}>{SITE_NAME}</div>
        <div style={{ marginTop: 8, fontSize: 38, fontWeight: 800, color: "#8a6d1f" }}>{SITE_TAGLINE}</div>
        <div style={{ marginTop: 34, fontSize: 30, color: "#5c5247", display: "flex", flexDirection: "column", lineHeight: 1.5 }}>
          <div>평생 사주, 궁합, 2027 신년운세, 연애, 재물, 직업</div>
          <div>같은 일주라도 다 다른, 나만의 여덟 글자</div>
        </div>
      </div>
      <div style={{ position: "absolute", right: 60, bottom: 40, display: "flex" }}>
        <Portrait mood="bow" size={300} />
      </div>
    </div>,
    1200,
    630,
  );
}

const TIER_COLOR: Record<Tier, string> = { seong: C.gold, myeong: C.gold, pyeong: C.ink, am: C.soft, pok: C.seal };

// Story card for the 가상 실록 summary: the verdict, the numbers and the ratings, built to be screenshotted.
export function sillokStory(kingName: string, king: Pillars, cast: Cast) {
  const s = sillok(king, { cast, kingName });
  const accent = TIER_COLOR[s.tier];
  return render(
    <div style={{ ...frame(1080, 1920), paddingTop: 150 }}>
      <InnerRule width={1080} accent={s.tier === "pok" ? C.seal : C.gold} />
      <div style={{ fontSize: 46, letterSpacing: 24, color: C.seal, fontWeight: 800 }}>假 想 實 錄</div>
      <div style={{ marginTop: 50, fontSize: 46, color: C.soft }}>{`${kingName} 전하는`}</div>
      <div
        style={{
          marginTop: 24,
          display: "flex",
          alignItems: "baseline",
          gap: 22,
          padding: "14px 60px",
          borderRadius: 36,
          border: `6px solid ${accent}`,
          color: accent,
        }}
      >
        <div style={{ fontSize: 50, fontWeight: 800, opacity: 0.7 }}>{s.tierHanja}</div>
        <div style={{ fontSize: 120, fontWeight: 800 }}>{s.tierLabel}</div>
      </div>
      <div style={{ marginTop: 40, fontSize: 52, fontWeight: 800, lineHeight: 1.4, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {balancedLines(`“${s.headline}”`, 17).map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
      <div style={{ marginTop: 18, fontSize: 38, color: s.deposed ? C.seal : C.gold, fontWeight: 800 }}>
        {s.deposed ? `폐위되어 ${s.epithet}으로 강등` : `존호 ${s.epithet}`}
      </div>

      <div style={{ marginTop: 50, display: "flex", gap: 20 }}>
        {[
          ["즉위", `${s.accession}세`],
          ["재위", `${s.reign}년`],
          ["향년", `${s.death}세`],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              width: 270,
              height: 150,
              borderRadius: 26,
              background: "#fbf6ea",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: 30, color: C.soft }}>{label}</div>
            <div style={{ marginTop: 6, fontSize: 60, fontWeight: 800 }}>{value}</div>
          </div>
        ))}
      </div>
      {s.chart && (
        <div style={{ marginTop: 34, display: "flex", alignItems: "center", gap: 16 }}>
          {s.chart.elements.map((n, el) => (
            <div
              key={el}
              style={{
                width: 118,
                height: 62,
                borderRadius: 31,
                background: ["#3d6656", C.seal, C.gold, "#d9d4c7", "#1f3448"][el],
                color: el === 3 ? C.ink : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                fontWeight: 800,
                border: el === s.chart!.yong ? `5px solid ${C.ink}` : "5px solid transparent",
              }}
            >{`${"木火土金水"[el]} ${n}`}</div>
          ))}
        </div>
      )}
      {s.chart && (
        <div style={{ marginTop: 12, fontSize: 28, color: C.soft }}>
          {`${s.chart.strength}, 용신 ${"목화토금수"[s.chart.yong]}(${"木火土金水"[s.chart.yong]})`}
        </div>
      )}

      <div style={{ marginTop: s.chart ? 36 : 44, width: 566, display: "flex", flexDirection: "column", gap: s.chart ? 14 : 18 }}>
        {s.ratings.map((r) => (
          <div key={r.key} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 250, fontSize: 40, fontWeight: 800, color: C.soft }}>{r.label}</div>
            <div style={{ display: "flex", gap: 14 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  style={{ width: 52, height: 52, borderRadius: 14, background: n <= r.value ? C.gold : "rgba(33, 27, 23, 0.1)" }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: s.chart ? 36 : 50, display: "flex", gap: 24 }}>
        {[
          ["신하들이 몰래 부른 이름", s.nickname],
          ["백성들이 부른 이름", s.peopleName],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              width: 420,
              padding: "22px 0",
              borderRadius: 26,
              background: "#fbf6ea",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 28, color: C.soft }}>{label}</div>
            <div style={{ marginTop: 6, fontSize: 46, fontWeight: 800 }}>{value}</div>
          </div>
        ))}
      </div>
      <StoryFooter />
    </div>,
    1080,
    1920,
  );
}

// Page link cards (2026-11-25): a bold promise, a glimpse of what the page shows, a button and 정 훈도 with a word,
// so a link in a feed says what it opens. Laid out after the cards that travel best on X and Threads.
const saju8 = `data:image/png;base64,${(await readFile(join(process.cwd(), "public/og-saju-mosaic.png"))).toString("base64")}`;

function PageCard({
  bg,
  pill,
  pillStyle,
  head,
  headColors,
  children,
  cta,
  mood,
  bubble,
  ring,
  brand,
}: {
  bg: string;
  pill: string;
  pillStyle: React.CSSProperties;
  head: [string, string];
  headColors: [string, string];
  children?: React.ReactNode;
  cta: string;
  mood: Mood;
  bubble: [string, string];
  ring: string;
  brand: string;
}) {
  return (
    <div style={{ width: 1200, height: 630, display: "flex", background: bg, fontFamily: "Myeongjo", padding: "40px 60px 48px", position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
        <div style={{ display: "flex", alignSelf: "flex-start", fontSize: 26, fontWeight: 800, padding: "6px 18px", borderRadius: 999, ...pillStyle }}>{pill}</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 66, fontWeight: 800, lineHeight: 1.22, marginTop: 22 }}>
          <div style={{ display: "flex", color: headColors[0] }}>{head[0]}</div>
          <div style={{ display: "flex", color: headColors[1] }}>{head[1]}</div>
        </div>
        {children}
        <div style={{ display: "flex", alignSelf: "flex-start", background: "#c8321f", color: "#fff", fontSize: 36, fontWeight: 800, padding: "18px 40px", borderRadius: 999, marginTop: 30 }}>{cta}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 340 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#fff", color: "#211b17", fontSize: 28, fontWeight: 800, padding: "16px 26px", borderRadius: 22, lineHeight: 1.35, marginBottom: 18 }}>
          <div style={{ display: "flex" }}>{bubble[0]}</div>
          <div style={{ display: "flex" }}>{bubble[1]}</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser */}
        <img src={art[mood]} width={290} height={290} alt="" style={{ borderRadius: 145, border: `8px solid ${ring}`, background: "#f4ecdb" }} />
      </div>
      <div style={{ display: "flex", position: "absolute", right: 60, bottom: 22, fontSize: 22, color: brand, fontWeight: 800 }}>훈도사주 hundosaju.com</div>
    </div>
  );
}

// 신년운세: the twelve months with a sample of marks (○ good, △ careful); the page shows the reader's own for free.
export function yeonunImage(pill: string) {
  const good = [3, 5, 9];
  return render(
    <PageCard
      bg="#17120f"
      pill={pill}
      pillStyle={{ border: "2px solid #c99a3a", color: "#e6c36a" }}
      head={["내년, 내가", "풀리는 달 나왔사옵니다"]}
      headColors={["#fff", "#e6c36a"]}
      cta="생일 넣고 내 12달 보기 →"
      mood="fan"
      bubble={["좋은 달, 조심할 달", "짚어 드리옵니다"]}
      ring="#c99a3a"
      brand="#6f6357"
    >
      <div style={{ display: "flex", marginTop: 28 }}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
          const mark = good.includes(m) ? "○" : m === 7 ? "△" : "-";
          const bgc = good.includes(m) ? "#c99a3a" : m === 7 ? "#c8321f" : "#2d2620";
          return (
            <div key={m} style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 7 }}>
              <div style={{ display: "flex", fontSize: 20, color: "#a89a8b", marginBottom: 4 }}>{`${m}월`}</div>
              <div style={{ display: "flex", width: 50, height: 50, borderRadius: 10, alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, background: bgc, color: mark === "-" ? "#6f6357" : "#fff" }}>{mark}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", fontSize: 22, color: "#a89a8b", marginTop: 12 }}>달마다 흐름은 무료로 먼저 보여 드리옵니다</div>
    </PageCard>,
    1200,
    630,
  );
}

// 무료 사주풀이: an eight-character chart under mosaic, only the day stem ("나") left readable.
export function gukjeongImage() {
  return render(
    <PageCard
      bg="#f4ecdb"
      pill="무료 사주풀이"
      pillStyle={{ background: "#211b17", color: "#f4ecdb" }}
      head={["성격, 돈, 사랑, 일", "생일 하나로 나왔사옵니다"]}
      headColors={["#211b17", "#b3261e"]}
      cta="내 사주 무료로 보기 →"
      mood="face"
      bubble={["10년 흐름까지", "보여 드리옵니다"]}
      ring="#c99a3a"
      brand="#8a7d70"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser */}
      <img src={saju8} width={310} height={166} alt="" style={{ marginTop: 18 }} />
    </PageCard>,
    1200,
    630,
  );
}

// 신살 테스트: a few of the twenty names; the reader's own stays for the page.
export function sinsalImage() {
  return render(
    <PageCard
      bg="#4a0f0c"
      pill="무료 신살 테스트"
      pillStyle={{ border: "2px solid #f0b8a8", color: "#f6d3c8" }}
      head={["그대 사주에 숨은", "살 이름 나왔사옵니다"]}
      headColors={["#fff", "#ffd27a"]}
      cta="내 살 유형 보기 →"
      mood="shock"
      bubble={["100명 중 몇 명인지도", "알려 드리옵니다"]}
      ring="#c99a3a"
      brand="#b98a7e"
    >
      <div style={{ display: "flex", marginTop: 26, alignItems: "center" }}>
        {["도화살", "역마살", "화개살", "백호살"].map((c) => (
          <div key={c} style={{ display: "flex", background: "#6b1a15", color: "#ffe1d6", fontSize: 26, fontWeight: 800, padding: "8px 16px", borderRadius: 12, marginRight: 10 }}>{c}</div>
        ))}
        <div style={{ display: "flex", fontSize: 24, color: "#d9a99c" }}>등 20가지</div>
      </div>
    </PageCard>,
    1200,
    630,
  );
}
