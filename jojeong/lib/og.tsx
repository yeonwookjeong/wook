import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { CHARACTER, SERVICE_NAME, TAGLINE, type Mood } from "./brand";
import type { Seat } from "./court";
import { decreeLine } from "./decree";
import { kingLinkText } from "./kings";
import { KING_TYPES } from "./kingTypes";
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

const frame = (width: number, height: number, accent: string): React.CSSProperties => ({
  width,
  height,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  background: C.hanji,
  color: C.ink,
  fontFamily: "Myeongjo",
  border: `${Math.round(width / 90)}px solid ${accent}`,
  position: "relative",
});

// Satori has no `double` border style, so the inner rule is drawn as an overlay.
function InnerRule({ width, accent }: { width: number; accent: string }) {
  const inset = Math.round(width / 70);
  return (
    <div
      style={{
        position: "absolute",
        top: inset,
        left: inset,
        right: inset,
        bottom: inset,
        border: `${Math.max(2, Math.round(width / 400))}px solid ${accent}`,
        display: "flex",
      }}
    />
  );
}

export function inviteImage(kingName: string, king: Pillars, ministerCount: number) {
  return render(
    <div style={{ ...frame(1200, 630, C.seal), justifyContent: "center" }}>
      <InnerRule width={1200} accent={C.seal} />
      <div style={{ fontSize: 30, letterSpacing: 16, color: C.seal, fontWeight: 800 }}>敎 旨</div>
      <div style={{ marginTop: 22, fontSize: 34, color: C.gold, fontWeight: 800 }}>{KING_TYPES[king.dayStem].title}</div>
      <div style={{ marginTop: 6, fontSize: 76, fontWeight: 800 }}>{`${kingName} 전하께서`}</div>
      <div style={{ fontSize: 76, fontWeight: 800 }}>그대를 부르셨사옵니다</div>
      <div style={{ marginTop: 28, fontSize: 30, color: C.soft }}>
        {ministerCount > 0 ? `이미 ${ministerCount}명이 입궐했사옵니다 · 사주로 관직 받기` : "사주로 관직을 받아보시옵소서"}
      </div>
      <div style={{ position: "absolute", left: 60, bottom: 50, display: "flex" }}>
        <Portrait mood="decree" size={190} />
      </div>
      <div style={{ position: "absolute", right: 70, bottom: 60, display: "flex" }}>
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
    <div style={{ ...frame(1200, 630, danger ? C.seal : C.gold), justifyContent: "center" }}>
      <InnerRule width={1200} accent={danger ? C.seal : C.gold} />
      <div style={{ fontSize: 30, color: C.soft }}>{`${kingName} 전하께서`}</div>
      <div style={{ marginTop: 8, fontSize: 44, fontWeight: 800 }}>{decreeLine(name, role)}</div>
      <div style={{ marginTop: 20, fontSize: 150, fontWeight: 800, color: danger ? C.seal : C.ink }}>{r.title}</div>
      <div style={{ marginTop: 8, fontSize: 32, color: C.gold, fontWeight: 800 }}>{`${r.rank} · 궁합 ${score}점`}</div>
      <div style={{ position: "absolute", left: 60, bottom: 50, display: "flex" }}>
        <Portrait mood={moodFor(role)} size={190} />
      </div>
      <div style={{ position: "absolute", right: 70, bottom: 60, display: "flex" }}>
        <Seal size={120} />
      </div>
    </div>,
    1200,
    630,
  );
}

function StoryFooter() {
  return (
    <div style={{ position: "absolute", bottom: 90, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: 58, fontWeight: 800 }}>{SERVICE_NAME}</div>
      <div style={{ marginTop: 10, fontSize: 32, color: C.soft }}>{TAGLINE}</div>
    </div>
  );
}

export function ministerStory(kingName: string, name: string, role: RoleKey, score: number) {
  const r = ROLES[role];
  const danger = r.tone === "red" || r.tone === "gray";
  return render(
    <div style={{ ...frame(1080, 1920, danger ? C.seal : C.gold), paddingTop: 220 }}>
      <InnerRule width={1080} accent={danger ? C.seal : C.gold} />
      <div style={{ fontSize: 52, letterSpacing: 28, color: C.seal, fontWeight: 800 }}>敎 旨</div>
      <div style={{ marginTop: 110, fontSize: 48, color: C.soft }}>{`${kingName} 전하께서`}</div>
      <div style={{ marginTop: 16, fontSize: 60, fontWeight: 800 }}>{decreeLine(name, role)}</div>
      <div style={{ marginTop: 90, fontSize: 250, fontWeight: 800, color: danger ? C.seal : C.ink }}>{r.title}</div>
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
    <div style={{ ...frame(1080, 1920, C.seal), paddingTop: 150 }}>
      <InnerRule width={1080} accent={C.seal} />
      <div style={{ fontSize: 46, letterSpacing: 24, color: C.seal, fontWeight: 800 }}>朝 廷 圖</div>
      <div style={{ marginTop: 40, fontSize: 84, fontWeight: 800 }}>{`${kingName} 전하의 조정`}</div>
      <div style={{ marginTop: 14, fontSize: 38, color: C.soft }}>{`신하 ${seats.length}명 · 간신 ${seats.filter((s) => s.role === "gansin").length}명 적발`}</div>
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
  return render(
    <div style={{ ...frame(1080, 1920, C.gold), paddingTop: 220 }}>
      <InnerRule width={1080} accent={C.gold} />
      <div style={{ fontSize: 52, letterSpacing: 24, color: C.seal, fontWeight: 800 }}>卽 位 敎 書</div>
      <div style={{ marginTop: 120, fontSize: 52, color: C.soft }}>{`${kingName} 전하는`}</div>
      <div style={{ marginTop: 30, fontSize: 150, fontWeight: 800 }}>{t.title}</div>
      <div style={{ marginTop: 20, fontSize: 44, color: C.gold, fontWeight: 800 }}>{t.symbol}</div>
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
