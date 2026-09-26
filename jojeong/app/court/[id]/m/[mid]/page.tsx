import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Hundo from "@/components/Hundo";
import ReportShelf from "@/components/ReportShelf";
import RoyalDoc from "@/components/RoyalDoc";
import { SaveImageButton, ShareLinkButton } from "@/components/ShareButtons";
import { bragLine, decreeLine, summonLine } from "@/lib/decree";
import { loadCourt, viewerOf } from "@/lib/load";
import { moodFor, ROLES } from "@/lib/roles";
import { factLines, GANSIN_SIGNS, relationSentence, roleReasons, type Pillars } from "@/lib/saju";
import { chartOf, GYEOK_NAME, readChart } from "@/lib/myeongri";
import SajuChart from "@/components/SajuChart";
import { sinbunOf } from "@/lib/sinbun";
import { yearPreview } from "@/lib/yearly";

async function loadSeat(id: string, mid: string) {
  const { court, seats } = await loadCourt(id);
  const seat = seats.find((s) => s.minister.id === mid);
  if (!seat) notFound();
  return { court, seat };
}

export async function generateMetadata({ params }: PageProps<"/court/[id]/m/[mid]">): Promise<Metadata> {
  const { id, mid } = await params;
  const { court, seat } = await loadSeat(id, mid);
  const title = `${seat.minister.name}, ${court.kingName} 전하의 ${ROLES[seat.role].title}`;
  const description = `${decreeLine(seat.minister.name, seat.role)}. 그대의 관직도 사주로 받아보시옵소서.`;
  return { title, description, openGraph: { title, description }, twitter: { card: "summary_large_image" } };
}

export default async function MinisterPage({ params }: PageProps<"/court/[id]/m/[mid]">) {
  const { id, mid } = await params;
  const { court, seat } = await loadSeat(id, mid);
  const { isOwner, myMinisterId } = await viewerOf(court.id, court.ownerToken);
  const isSelf = myMinisterId === seat.minister.id;
  const role = ROLES[seat.role];
  const danger = role.tone === "red" || role.tone === "gray";
  const reasons = roleReasons(court.king, seat.minister.pillars, seat.match, seat.role, seat.minister.name);
  // The 기신 line is already part of the reasons for 간신 and 유배.
  const facts = factLines(court.king, seat.minister.pillars, seat.match.facts, seat.role).filter(
    (line) => !(danger && line.startsWith("기신(")),
  );

  return (
    <>
      <nav className="flex justify-between pt-5 text-sm">
        <Link href={`/court/${court.id}`} className="font-bold text-ink-soft">
          ← {court.kingName} 전하의 조정
        </Link>
      </nav>

      <RoyalDoc className="mt-5" paperClassName="pb-24 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.3em] text-seal">敎 旨</p>
        <p className="mt-5 text-sm text-ink-soft">{court.kingName} 전하께서</p>
        <p className="mt-1 font-myeongjo text-xl font-extrabold">{decreeLine(seat.minister.name, seat.role)}</p>

        <p className={`mt-6 font-myeongjo text-6xl font-extrabold ${danger ? "text-seal" : "text-ink"}`}>
          {role.title}
        </p>
        <p className="mt-2 text-sm font-bold text-gold">{role.rank}</p>
        <p className="mt-3 text-[15px]">&ldquo;{role.tagline}&rdquo;</p>

        <div className="mx-auto mt-6 w-fit rounded-full bg-hanji-deep px-4 py-1.5 text-sm">
          궁합 <b className="font-myeongjo text-lg">{seat.match.score}</b>점
        </div>
        <p className="mt-1.5 text-[11px] text-ink-soft">
          <span className="inline-block">궁합 평균 68점 ·</span> <span className="inline-block">조정 1등(75점 이상)은 영의정 ·</span>{" "}
          <span className="inline-block">80점 넘으면 좌의정</span>
        </p>

        <span className="animate-stamp absolute right-5 bottom-5 flex size-16 items-center justify-center rounded-lg border-[3px] border-seal font-myeongjo text-sm font-extrabold leading-tight text-seal">
          御
          <br />寶
        </span>
      </RoyalDoc>

      <section className="mt-6">
        <Hundo mood={moodFor(seat.role)}>{role.report}</Hundo>
      </section>

      <section
        className={`mt-5 rounded-3xl border px-5 py-4 ${danger ? "border-seal/40 bg-seal/5" : "border-gold/40 bg-white/60"}`}
      >
        <h2 className={`font-myeongjo text-lg font-extrabold ${danger ? "text-seal" : ""}`}>
          {seat.role === "gansin" ? "간신 판정 사유" : seat.role === "yubae" ? "유배 사유" : `${role.title} 천거 사유`}
        </h2>
        <ol className="mt-2 flex flex-col gap-2 text-[15px] leading-relaxed">
          {reasons.map((line, i) => (
            <li key={line} className="flex gap-2">
              <span className={`font-myeongjo font-extrabold ${danger ? "text-seal" : "text-gold"}`}>{"一二三四"[i]}</span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
        {seat.role === "gansin" && (
          <div className="mt-3 rounded-2xl bg-white/70 px-4 py-3">
            <p className="text-xs font-extrabold text-seal">이런 간신은 이렇게 티가 나옵니다</p>
            <ul className="mt-1.5 flex flex-col gap-1 text-sm leading-relaxed">
              {GANSIN_SIGNS.map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mt-5 rounded-3xl border border-ink/10 bg-hanji-deep/60 p-5">
        <h2 className="font-myeongjo text-lg font-extrabold">밀지(密旨) · 사주 풀이</h2>
        <p className="mt-3 text-[15px] leading-relaxed">
          {relationSentence(court.king, seat.minister.pillars, seat.match.facts, seat.minister.name)}
        </p>
        {facts.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5 text-sm leading-relaxed">
            {facts.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-seal">◆</span>
                {line}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 rounded-xl bg-white/70 px-4 py-3 text-sm leading-relaxed">
          <b className="block text-gold">정 훈도의 진언</b>
          {role.advice}
        </p>
      </section>

      {isSelf && <MyChartTeaser pillars={seat.minister.pillars} name={seat.minister.name} />}
      {isSelf && (
        <ReportShelf
          ids={["sinbun", "pyeongsaeng", "gukjeong", "yeonae", "insa"]}
          query={`court=${court.id}&m=${seat.minister.id}`}
          highlights={{
            sinbun: `조선에 태어났다면 ‘${sinbunOf(seat.minister.pillars).job}’`,
            gukjeong: `병오년 운세 ‘${yearPreview(seat.minister.pillars).verdict}’ · 무료로 전부 공개`,
          }}
        />
      )}

      <section className="mt-6 flex flex-col gap-3">
        {isSelf && (
          <>
            <SaveImageButton
              src={`/court/${court.id}/m/${seat.minister.id}/card`}
              filename={`${seat.minister.name}-${role.title}.png`}
              label="내 교지 저장 (스토리용)"
            />
            <ShareLinkButton
              path={`/court/${court.id}/m/${seat.minister.id}`}
              text={bragLine(court.kingName, seat.role)}
              label="결과 자랑하기"
              primary={false}
            />
          </>
        )}
        {isOwner && (
          <>
            <ShareLinkButton
              path={`/court/${court.id}/m/${seat.minister.id}`}
              text={summonLine(seat.minister.name, seat.role)}
              label={`${seat.minister.name}에게 교지 보내기`}
            />
            <SaveImageButton
              src={`/court/${court.id}/m/${seat.minister.id}/card`}
              filename={`${seat.minister.name}-${role.title}.png`}
              label="이 교지 저장"
            />
            <Link
              href={`/court/${court.id}`}
              className="w-full rounded-2xl border-2 border-ink/30 py-3.5 text-center font-myeongjo font-extrabold text-ink-soft"
            >
              조정으로 돌아가기
            </Link>
          </>
        )}
        {!isSelf && !isOwner && (
          <>
            {!myMinisterId && seat.minister.source !== "appointed" && (
              <Link
                href={`/court/${court.id}`}
                className="w-full rounded-2xl border-2 border-ink py-3.5 text-center font-myeongjo font-extrabold"
              >
                나도 {court.kingName} 전하의 조정에 입궐하기
              </Link>
            )}
            <Link
              href="/"
              className="w-full rounded-2xl bg-seal py-4 text-center font-myeongjo text-lg font-extrabold text-hanji shadow-[0_6px_0_#7d1a14]"
            >
              나는 어떤 왕일까? 즉위하기
            </Link>
          </>
        )}
      </section>
    </>
  );
}

// The minister already gave a birth date, so show them their own chart and keep the verdict locked behind
// enthronement: that curiosity is what turns a guest into the next king.
function MyChartTeaser({ pillars, name }: { pillars: Pillars; name: string }) {
  const reading = readChart(pillars);
  return (
    <section className="mt-6">
      <h2 className="text-center font-myeongjo text-lg font-extrabold">{name}의 사주 여덟 글자</h2>
      {reading && (
        <SajuChart
          slots={chartOf(pillars as Parameters<typeof chartOf>[0])}
          elements={reading.elements}
          strength={reading.strength}
          yong={reading.yong}
          missing={reading.missing}
          gyeok={GYEOK_NAME[reading.gyeok]}
        />
      )}
      <div className="relative mt-3 overflow-hidden border border-seal/30 bg-[#f9f1de] px-5 py-5 text-center">
        <div className="pointer-events-none flex justify-center gap-2 blur-[3px] select-none" aria-hidden="true">
          {["聖君", "明君", "暗君", "暴君"].map((t) => (
            <span key={t} className="border-2 border-gold/60 px-3 py-1 font-myeongjo text-xl font-extrabold text-gold">
              {t}
            </span>
          ))}
        </div>
        <p className="mt-3 font-myeongjo text-lg leading-snug font-extrabold">
          🔒 그대가 왕이었다면
          <br />
          성군이었을까, 폭군이었을까?
        </p>
        <p className="mt-1.5 text-sm text-ink-soft">즉위하면 그대의 등급과 가상 실록 일곱 장이 열리옵니다</p>
        <Link
          href="/#enthrone"
          className="mt-4 block w-full rounded-2xl bg-seal py-3.5 font-myeongjo text-lg font-extrabold text-hanji shadow-[0_5px_0_#7d1a14]"
        >
          내 실록 열기 · 즉위하기
        </Link>
      </div>
    </section>
  );
}
