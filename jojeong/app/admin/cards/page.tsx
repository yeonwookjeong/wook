import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { ILGAN, ILJU_TAG_TEXT, iljuFacts, jiaziNo, nextDayOf, stemCure, stemMatches, stemName, stemThing } from "@/lib/cards";
import { josa } from "@/lib/josa";
import { pickDays } from "@/lib/taekil";
import { figureById, figureChart } from "@/lib/figures";
import { monthPillarOf, rankMonth, SIXTY, type IljuMonth } from "@/lib/iljuRank";
import { BRANCHES, BRANCHES_KO, STEMS, STEMS_KO } from "@/lib/saju";

export const metadata: Metadata = { title: "카드", robots: { index: false } };

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

// The brand in the top corner, for covers whose bottom carries the thumbnail title.
function CornerBrand() {
  return (
    <div style={{ position: "absolute", top: 64, left: 70, display: "flex", alignItems: "center", gap: 12 }}>
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

export default async function Cards({ searchParams }: PageProps<"/admin/cards">) {
  if (!(await isAdmin())) redirect("/admin");
  const q = await searchParams;
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
  if (c.startsWith("rank-")) {
    const y = Number(q.y ?? 2026);
    const m = Number(q.m ?? 10);
    const mp = monthPillarOf(y, m);
    if (!mp) return null;
    const rows = rankMonth(mp.stem, mp.branch);
    const head = `60일주 운세 랭킹 · ${mp.label} (${mp.term}~${mp.nextTerm})`;
    const stars = (r: IljuMonth) => "★★★★★".slice(0, 5 - Math.floor((r.rank - 1) / 12)) + "☆☆☆☆☆".slice(0, Math.floor((r.rank - 1) / 12));
    const hf = <BrushFont hf={String(q.hf ?? "")} />;

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
            <p style={{ marginTop: 6, fontSize: 21, color: SOFT, fontFamily: sans }}>일주(태어난 날의 두 글자)로 본 간이 운세예요 · 내 일주는 프로필 링크에서</p>
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
    // A real day: 2026-10-17 (丙午년 戊戌월 甲子일).
    const cols = [
      { pos: "태어난 시", h: "？", ko: "" },
      { pos: "태어난 날", h: "甲子", ko: "갑자", me: true },
      { pos: "태어난 달", h: "戊戌", ko: "무술" },
      { pos: "태어난 해", h: "丙午", ko: "병오" },
    ];
    return (
      <Frame>
        <BrushFont hf={String(q.hf ?? "")} />
        <div style={{ position: "absolute", top: 140, left: 100, right: 100 }}>
          <Label>일주가 뭐예요?</Label>
          <p style={{ marginTop: 18, fontSize: 70, fontWeight: 800, lineHeight: 1.2 }}>태어난 날의 두 글자</p>
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
                    이게 일주!
                  </span>
                )}
              </div>
            ))}
          </div>
          <Body style={{ marginTop: 48, fontSize: 35, color: INK }}>
            사주 여덟 글자 가운데 <b>나 자신</b>을 뜻하는 자리예요. 성격과 인연을 볼 때 가장 먼저 봐요.
          </Body>
          <div style={{ marginTop: 40, padding: "32px 34px", borderRadius: 22, background: "rgba(33,27,23,.05)", fontFamily: sans }}>
            <p style={{ fontSize: 31, lineHeight: 1.6 }}>
              <b style={{ color: SEAL }}>하늘 글자 10개</b> <span style={{ fontFamily: brush, color: SOFT }}>{STEMS.join("")}</span>
            </p>
            <p style={{ marginTop: 8, fontSize: 31, lineHeight: 1.6 }}>
              <b style={{ color: SEAL }}>땅 글자 12개</b> <span style={{ fontFamily: brush, color: SOFT }}>{BRANCHES.join("")}</span>
            </p>
            <p style={{ marginTop: 18, fontSize: 32, fontWeight: 800, lineHeight: 1.45 }}>둘이 차례로 짝을 지어 60가지, 60일마다 한 바퀴 돌아요</p>
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
          <Label>저장해 두고 꺼내 보시옵소서</Label>
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
  if (c === "gz-find") {
    const steps = [
      { t: "생년월일만 있으면 돼요", d: "양력이든 음력이든 괜찮아요. 태어난 시간은 몰라도 일주는 나와요" },
      { t: "hundosaju.com에서 '내 사주 무료로 보기'", d: "프로필 링크로 들어가 생년월일을 넣어요" },
      { t: "'태어난 날' 칸의 두 글자가 내 일주", d: "예) 甲子가 나오면 갑자일주예요" },
    ];
    return (
      <Frame>
        <div style={{ position: "absolute", top: 160, left: 100, right: 100 }}>
          <Label>내 일주 찾는 법</Label>
          <p style={{ marginTop: 18, fontSize: 70, fontWeight: 800, lineHeight: 1.2 }}>1분이면 충분해요</p>
          <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 30 }}>
            {steps.map((x, i) => (
              <div key={x.t} className="doc-paper" style={{ display: "flex", alignItems: "center", gap: 28, padding: "38px 34px" }}>
                <span style={{ flexShrink: 0, width: 76, height: 76, display: "grid", placeItems: "center", borderRadius: "50%", background: SEAL, color: HANJI, fontSize: 40, fontWeight: 800 }}>{i + 1}</span>
                <div>
                  <p style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.3 }}>{x.t}</p>
                  <p style={{ marginTop: 10, fontSize: 29, lineHeight: 1.45, color: SOFT, fontFamily: sans }}>{x.d}</p>
                </div>
              </div>
            ))}
          </div>
          <Body style={{ marginTop: 44, fontSize: 27 }}>밤 11시 이후에 태어났다면 학파에 따라 다음 날의 일주로 보기도 해요</Body>
        </div>
        <Brand />
      </Frame>
    );
  }

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
