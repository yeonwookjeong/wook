import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { ILGAN, ILJU_TAG_TEXT, iljuFacts, stemCure, stemMatches, stemName, stemThing } from "@/lib/cards";
import { josa } from "@/lib/josa";
import { pickDays } from "@/lib/taekil";

export const metadata: Metadata = { title: "카드", robots: { index: false } };

// Social cards, 1080×1350 (Instagram 4:5), drawn in the site's own look. Owner only. Each slide is one URL
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
        height: 1350,
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
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 86, display: "flex", justifyContent: "center", alignItems: "center", gap: 18 }}>
      <span
        style={{
          width: 64,
          height: 64,
          border: `4px solid ${SEAL}`,
          color: SEAL,
          background: dark ? HANJI : "transparent",
          display: "grid",
          placeItems: "center",
          fontSize: 24,
          fontWeight: 800,
          lineHeight: 1,
          transform: "rotate(-4deg)",
        }}
      >
        訓<br />導
      </span>
      <span style={{ fontSize: 36, fontWeight: 800 }}>훈도사주</span>
      <span style={{ fontSize: 26, color: dark ? "rgba(244,236,219,.7)" : SOFT }}>· hundosaju.com</span>
    </div>
  );
}

function Hundo({ src, size = 300, bottom = 190 }: { src: string; size?: number; bottom?: number }) {
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

  // The last slide of every carousel.
  return (
    <Frame dark>
      <div style={{ position: "absolute", top: 170, left: 0, right: 0, textAlign: "center" }}>
        <p style={{ fontSize: 34, letterSpacing: "0.3em", color: GOLD, fontWeight: 800 }}>明 課 學 訓 導</p>
        <p style={{ marginTop: 50, fontSize: 76, fontWeight: 800, lineHeight: 1.3 }}>
          내 일간이
          <br />
          궁금하다면?
        </p>
        <p style={{ marginTop: 36, fontSize: 40, lineHeight: 1.6, color: "rgba(244,236,219,.9)" }}>
          생년월일만 넣으면 3초.
          <br />
          사주 분석과 올해 운세까지 무료예요.
        </p>
        <p style={{ marginTop: 40, display: "inline-block", padding: "18px 44px", borderRadius: 999, background: GOLD, color: INK, fontSize: 36, fontWeight: 800 }}>
          프로필 링크에서 보기
        </p>
      </div>
      <Hundo src="/hundo-bow.png" size={280} bottom={200} />
      <Brand dark />
    </Frame>
  );
}
