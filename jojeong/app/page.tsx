import Link from "next/link";
import { forgetMeAction } from "@/app/actions";
import FreeTiles, { type FreeTile } from "@/components/FreeTiles";
import { publishedColumns } from "@/lib/columns";
import Keep from "@/components/Keep";
import RoyalDoc from "@/components/RoyalDoc";
import { hanjaNum } from "@/lib/hanjaNum";
import StoreHero from "@/components/StoreHero";
import TodayCard from "@/components/TodayCard";
import TrackLink from "@/components/TrackLink";
import { readMe } from "@/lib/me";
import { ownedByProduct, ownedOrders } from "@/lib/pay";
import { PRICE, priceNow, productById, SETS, type ProductId } from "@/lib/products";
import { readingCount } from "@/lib/store";
import { monthPillarNow, rankMonth } from "@/lib/iljuRank";
import { todayFor } from "@/lib/today";
import { profileOf } from "@/lib/pairToken";
import { isPreview, newYearOf, newYearProduct, thisYear, yearDetail, yearName, yearNickname } from "@/lib/yeonun";

// The main page, one path: the free reading first; then what changes every day and every month (오늘의 운세,
// the month's 일주 랭킹), so a return visit always has something new; in season, next year's 신년운세 as the
// flagship; then what the visitor wants to know, as plain choices; then the free extras, folded into short
// rows. A buyer finds what they bought near the top.
// The Joseon game (왕이 될 사주, /king) is one row among the free extras.

// What each report answers, in the visitor's words: the report and the question.
const TOPICS: { id: ProductId; name: string; ask: string }[] = [
  { id: "pyeongsaeng", name: "평생 사주", ask: "나는 어떤 사람이고 어떻게 살아갈까?" },
  { id: "yeonun", name: "연운", ask: "그해 나한테 무슨 일이? 지난해도, 앞으로의 해도" },
  { id: "jaemul", name: "재물운", ask: "돈이 왜 안 모일까, 언제 트일까?" },
  { id: "yeonae", name: "연애·결혼", ask: "나랑 맞는 사람은 언제 올까?" },
  { id: "jikup", name: "직업·적성", ask: "지금 일, 나랑 맞을까?" },
  { id: "gunghap", name: "궁합", ask: "우리, 진짜 잘 맞을까?" },
  { id: "taekil", name: "택일", ask: "결혼·이사·계약·면접, 언제 할까?" },
];

// Free, computed, no payment: night-blue tiles under the choices (components/FreeTiles.tsx).
const FREE: FreeTile[] = [
  { href: "/reports/gukjeong", hanja: "國運", title: "2026 운세", line: "남은 올해, 언제 움직이고 언제 쉴까", tag: "내 사주" },
  { href: "/samjae", hanja: "三災", title: "2026 삼재 띠", line: "토끼·양·돼지띠 눌삼재", tag: "띠별" },
  { href: "/king", hanja: "王", title: "왕이 될 사주", line: "친구를 불러 내 조정을 꾸리는 놀이", tag: "친구와" },
  { href: "/reports/sinbun", hanja: "身分", title: "조선 신분 감정", line: "조선에 태어났다면 어떤 신분이었을까", tag: "혼자" },
];

// The one price, and the regular one struck through beside it on a sale day.
function Price() {
  const price = priceNow();
  return price < PRICE ? (
    <>
      <b className="text-seal">{price.toLocaleString("ko-KR")}원</b> <s>{PRICE.toLocaleString("ko-KR")}원</s>
    </>
  ) : (
    <b className="text-seal">{PRICE.toLocaleString("ko-KR")}원</b>
  );
}

function Seal({ hanja }: { hanja: string }) {
  return (
    <span className="flex size-12 shrink-0 items-center justify-center border-2 border-seal/70 font-myeongjo text-sm font-extrabold text-seal">
      {hanja}
    </span>
  );
}

// The running count shows only once it means something; before that, a small number reads as an empty shop.
const SHOW_COUNT_FROM = 100;

export default async function Home() {
  const [me, count, orders] = await Promise.all([readMe(), readingCount(), ownedOrders().catch(() => [])]);
  const owned = ownedByProduct(orders);
  // The season's flagship: next year's 신년운세 (the 연운 report for that year), from September to February.
  const ny = newYearOf();
  const nyProduct = ny ? newYearProduct(productById("yeonun")!, ny) : null;
  const nyTheme = ny && me ? yearDetail(me.person.pillars, profileOf(me.person), ny, thisYear())?.theme : null;
  const nyOwned = ny && me ? orders.find((o) => (o.bundle ?? [o.product]).includes("yeonun") && o.req.y === String(ny) && o.req.p === me.token) : undefined;
  // This 절기 month's ranking: its winner, and where the reader's day pillar stands.
  const mp = monthPillarNow();
  const ranks = rankMonth(mp.stem, mp.branch);
  const myRank = me ? ranks.find((r) => r.stem === me.person.pillars.dayStem && r.branch === me.person.pillars.dayBranch) : undefined;

  return (
    <>
      <StoreHero
        count={count >= SHOW_COUNT_FROM ? count : null}
        cta={
          // The first stop is the free 2026 reading (a whole year, computed, no AI), not a report on sale:
          // people read something complete before being asked to pay.
          me
            ? { href: "/reports/gukjeong", label: `${me.person.name}님 무료 운세 보기`, sub: "2026년 운세와 사주 분석까지 · 무료" }
            : // ?new=1 asks for a chart: without it the report falls back to a court this browser enthroned
              // (lib/subject.ts), which right after "다른 사람 보기" brings back the chart just let go.
              { href: "/reports/gukjeong?new=1", label: "내 사주 무료로 보기", sub: "생년월일만 넣으면 2026년 운세와 사주 분석을 바로 보여 드려요" }
        }
      />

      <TodayCard today={todayFor(me?.person ?? null)} name={me?.person.name ?? null} />

      <TrackLink event="to_saju" from="today" href="/ranking" className="doc-paper mt-3 flex items-center gap-3 px-5 py-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full border-[3px] border-[#8a6214] bg-[radial-gradient(circle_at_35%_30%,#fff3c4,#e2bd62_45%,#a87a22)] font-myeongjo text-lg font-extrabold text-[#8a6214]">
          1
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-xs">
            <b className="text-seal">이달의 일주 랭킹</b>
            <span className="text-ink-soft">
              {mp.label} · {mp.term} {mp.from}~
            </span>
          </span>
          <b className="mt-0.5 block font-myeongjo text-[17px] leading-snug">
            1위 {ranks[0].name} <span className="text-seal">{ranks[0].hanja}</span>
          </b>
          <span className="block text-[12px] text-ink-soft">
            {myRank && myRank.rank > 50 ? (
              <>
                {me!.person.name}님 {myRank.name}는 이달 <b className="text-ink">미리 대비하면 되는 일주</b> · 대비법 보기
              </>
            ) : myRank ? (
              <>
                {me!.person.name}님 {myRank.name}는 <b className="text-seal">{myRank.rank}위</b> · 60일주 전체 순위 보기
              </>
            ) : (
              "60일주 중 내 일주는 몇 위? 전체 순위 보기"
            )}
          </span>
        </span>
        <span className="shrink-0 text-xs font-bold text-seal">무료 →</span>
      </TrackLink>

      {ny && nyProduct && (
        <RoyalDoc className="mt-5" paperClassName="px-5">
          <p className="text-center text-xs font-extrabold text-seal">
            {ny} {yearName(ny).ko.replace("년", "")}년({yearName(ny).hanja}年) · {yearNickname(ny)}
          </p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <Seal hanja={nyProduct.hanja} />
            <h2 className="font-myeongjo text-2xl font-extrabold">{nyProduct.title}</h2>
          </div>
          <p className="mt-2 text-center text-sm leading-relaxed text-ink-soft">
            <Keep clauses>{nyProduct.tagline}</Keep>
          </p>
          {nyTheme && (
            <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-center text-[13px]">
              {me!.person.name}님의 {ny}년은 <b className="text-seal">{nyTheme}</b>
            </p>
          )}
          <ol className="mt-4 flex flex-col divide-y divide-seal/15 border-y-[3px] border-double border-seal/40 px-1 text-[14px]">
            {nyProduct.toc.map((item, i) => (
              <li key={item} className="flex gap-2 py-1.5 text-left">
                <span className="w-9 shrink-0 font-myeongjo font-extrabold whitespace-nowrap text-seal">{hanjaNum(i + 1)}</span>
                {item}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-center text-[12px] text-ink-soft">
            {ny}년 판정과 달마다 흐름은 무료로 먼저 · 한 해 전체 풀이 <Price />
          </p>
          <Link
            href={nyOwned ? `/reports/yeonun?order=${nyOwned.id}` : `/reports/yeonun?y=${ny}`}
            className="mt-3 block rounded-2xl bg-seal py-4 text-center font-myeongjo text-lg font-extrabold text-hanji shadow-[0_6px_0_#7d1a14]"
          >
            {nyOwned ? "결제한 신년운세 바로 보기" : me ? `${me.person.name}님의 ${ny}년 ${isPreview(ny) ? "미리 보기" : "보기"}` : `내 ${ny}년 운세 ${isPreview(ny) ? "미리 보기" : "보기"}`}
          </Link>
        </RoyalDoc>
      )}

      {/* A buyer's reports come first. */}
      {orders.length > 0 && (
        <section className="doc-paper mt-4 px-5 py-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-myeongjo font-extrabold">내가 산 보고서</h2>
            <Link href="/my" className="text-xs font-bold text-seal">
              모두 보기 →
            </Link>
          </div>
          <ul className="mt-2 flex flex-col divide-y divide-seal/10">
            {orders.slice(0, 3).map((o) => (
              <li key={o.id}>
                <Link href={`/r/${o.id}`} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <b className="block truncate font-myeongjo">{o.set ? SETS[o.set].title : productById(o.product)?.title}</b>
                    <span className="block truncate text-xs text-ink-soft">{o.who}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-seal px-3 py-1 text-xs font-bold text-hanji">열기</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {me && (
        <form action={forgetMeAction} className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-gold/15 px-4 py-2 text-xs">
          <span className="font-bold text-gold">{me.person.name}님 사주로 보는 중</span>
          <button type="submit" className="text-ink-soft underline">
            다른 사람 보기
          </button>
        </form>
      )}

      <section className="mt-7">
        <h2 className="text-center font-myeongjo text-xl font-extrabold">무엇이 궁금하세요?</h2>
        <p className="mt-1 text-center text-xs text-ink-soft">사주 분석은 무료로 먼저 보고, 풀이 보고서는 한 편에 <Price /></p>
        <ul className="mt-4 grid grid-cols-2 gap-2">
          {TOPICS.map((t) => {
            const mine = owned[t.id];
            // 연운 is bought a year at a time, so its tile opens the list of years (bought ones are marked there).
            const href = t.id === "yeonun" ? "/reports/yeonun" : (mine?.href ?? `/reports/${t.id}`);
            return (
              <li key={t.id}>
                {/* The reports on sale carry the most weight on the page: 쪽빛 boxes with a gold rim, their seal in gold. */}
                <Link
                  href={href}
                  className="jjok-box flex h-full flex-col px-4 pt-4 pb-3.5"
                >
                  <span className="font-myeongjo text-2xl text-gold">{productById(t.id)!.hanja}</span>
                  <span className="mt-2 font-myeongjo text-xl leading-tight font-extrabold">{t.name}</span>
                  <span className="mt-1.5 flex-1 text-[12.5px] leading-snug text-hanji/75">{t.ask}</span>
                  {/* The price is said once above the grid, not on every card. */}
                  <span className="mt-2.5 flex items-center justify-between border-t border-gold/30 pt-2 text-[12px] font-bold">
                    <span className="text-hanji/60">{mine ? "결제함" : ""}</span>
                    <span className="text-gold">{mine ? "바로 보기 →" : "보기 →"}</span>
                  </span>
                </Link>
              </li>
            );
          })}
          {/* An odd tile out is paired with what 정 훈도 is studying next: not for sale, so dashed and faint, and it
              asks which reading people want most (the answers choose the next report). */}
          {TOPICS.length % 2 === 1 && (
            <li>
              <Link
                href={`/contact?topic=${encodeURIComponent("보고 싶은 풀이")}`}
                className="flex h-full flex-col rounded-2xl border-2 border-dashed border-jjok/30 bg-jjok/5 px-4 pt-4 pb-3.5"
              >
                <span className="font-myeongjo text-2xl text-jjok/45">硏究</span>
                <span className="mt-2 font-myeongjo text-xl leading-tight font-extrabold text-jjok/80">공부 중</span>
                <span className="mt-1.5 flex-1 text-[12.5px] leading-snug text-ink-soft">정 훈도가 새 보고서를 준비하고 있어요</span>
                <span className="mt-2.5 border-t border-jjok/15 pt-2 text-right text-[12px] font-bold text-jjok/80">보고 싶은 풀이 알려 주기 →</span>
              </Link>
            </li>
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-center font-myeongjo text-lg font-extrabold">무료로 보기</h2>
        <FreeTiles tiles={FREE} className="mt-3" />
      </section>

      <section className="mt-8">
        <h2 className="text-center font-myeongjo text-lg font-extrabold">훈도의 사주 이야기</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {publishedColumns().slice(0, 3).map((c) => (
            <li key={c.slug}>
              <Link href={`/column/${c.slug}`} className="doc-paper block px-4 py-3">
                <b className="block font-myeongjo text-[15px] leading-snug">{c.title}</b>
                <span className="mt-0.5 block text-[12px] text-ink-soft">{c.level} · 읽는 글</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/column" className="mt-2 block text-center text-[13px] font-bold text-seal">
          이야기 전체 보기 →
        </Link>
      </section>
    </>
  );
}
