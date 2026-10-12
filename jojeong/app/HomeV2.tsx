import Link from "next/link";
import { forgetMeAction } from "@/app/actions";
import { HundoFace } from "@/app/ask/Letter";
import AskLink from "@/components/AskLink";
import ColumnTitle from "@/components/ColumnTitle";
import Keep from "@/components/Keep";
import StoreHero from "@/components/StoreHero";
import TodayCard from "@/components/TodayCard";
import { publishedColumns } from "@/lib/columns";
import { hanjaNum } from "@/lib/hanjaNum";
import { monthPillarNow, rankMonth } from "@/lib/iljuRank";
import { readMe } from "@/lib/me";
import { askShown, JOIN_GIFT } from "@/lib/members";
import { profileOf } from "@/lib/pairToken";
import { ownedByProduct, ownedOrders } from "@/lib/pay";
import { PRICE, priceNow, productById, SETS, type ProductId } from "@/lib/products";
import { readingCount } from "@/lib/store";
import { todayFor } from "@/lib/today";
import { isPreview, newYearOf, newYearProduct, thisYear, yearDetail, yearName, yearNickname } from "@/lib/yeonun";

// The new home (시안: the owner's 시안 모드 only, until it replaces app/page.tsx). The same things as now, set in
// one plain card style (globals .card) and in the order a visitor uses them: the free reading and 정 훈도에게
// 묻기 at the top; the free extras as one row of chips; today and the month together; next year's 신년운세 with
// its contents folded; the reports on sale, with 묻기 in the eighth place; the stories as a short list.

const TOPICS: { id: ProductId; name: string; ask: string }[] = [
  { id: "pyeongsaeng", name: "평생 사주", ask: "나는 어떤 사람이고 어떻게 살아갈까?" },
  { id: "yeonun", name: "연운", ask: "그해 나한테 무슨 일이? 지난해도, 앞으로의 해도" },
  { id: "jaemul", name: "재물운", ask: "돈이 왜 안 모일까, 언제 트일까?" },
  { id: "yeonae", name: "연애·결혼", ask: "나랑 맞는 사람은 언제 올까?" },
  { id: "jikup", name: "직업·적성", ask: "지금 일, 나랑 맞을까?" },
  { id: "gunghap", name: "궁합", ask: "우리, 진짜 잘 맞을까?" },
  { id: "taekil", name: "택일", ask: "결혼·이사·계약·면접, 언제 할까?" },
];

const CHIPS: { href: string; hanja: string; label: string }[] = [
  { href: "/reports/gukjeong", hanja: "命", label: "내 사주 · 2027" },
  { href: "/#today", hanja: "日", label: "오늘의 운세" },
  { href: "/ranking", hanja: "月", label: "이달 일주 랭킹" },
  { href: "/samjae", hanja: "三災", label: "2026 삼재" },
  { href: "/king", hanja: "王", label: "왕이 될 사주" },
  { href: "/reports/sinbun", hanja: "身分", label: "조선 신분 감정" },
];

const SHOW_COUNT_FROM = 100;

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

const SectionTitle = ({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) => (
  <div className="mt-9 mb-3 px-1">
    <h2 className="font-myeongjo text-[19px] font-extrabold">{children}</h2>
    {sub && <p className="mt-0.5 text-[12px] text-ink-soft">{sub}</p>}
  </div>
);

export default async function HomeV2() {
  const [me, count, orders, ask] = await Promise.all([readMe(), readingCount(), ownedOrders().catch(() => []), askShown()]);
  const owned = ownedByProduct(orders);
  const ny = newYearOf();
  const nyProduct = ny ? newYearProduct(productById("yeonun")!, ny) : null;
  const nyTheme = ny && me ? yearDetail(me.person.pillars, profileOf(me.person), ny, thisYear())?.theme : null;
  const nyOwned = ny && me ? orders.find((o) => (o.bundle ?? [o.product]).includes("yeonun") && o.req.y === String(ny) && o.req.p === me.token) : undefined;
  const mp = monthPillarNow();
  const ranks = rankMonth(mp.stem, mp.branch);
  const myRank = me ? ranks.find((r) => r.stem === me.person.pillars.dayStem && r.branch === me.person.pillars.dayBranch) : undefined;

  return (
    <>
      <StoreHero
        slim
        count={count >= SHOW_COUNT_FROM ? count : null}
        cta={
          me
            ? { href: "/reports/gukjeong", label: `${me.person.name}님 무료 운세 보기`, sub: "사주 분석과 2027년 운세까지 · 무료" }
            : { href: "/reports/gukjeong?new=1", label: "내 사주 무료로 보기", sub: "생년월일만 넣으면 사주 분석과 2027년 운세를 바로 보여 드려요" }
        }
        second={ask ? { href: "/ask", label: `정 훈도에게 고민 묻기 · 첫 질문 선물` } : undefined}
      />

      {/* The free extras, one row to swipe. */}
      <nav aria-label="무료로 보기" className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {CHIPS.map((c) => (
          <Link key={c.href} href={c.href} className="card flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold">
            <span className="font-myeongjo text-[13px] text-seal">{c.hanja}</span>
            {c.label}
          </Link>
        ))}
      </nav>

      {/* Today and this month, one card: the day's reading, then the month's ranking joined below. */}
      <TodayCard today={todayFor(me?.person ?? null)} name={me?.person.name ?? null} frame="card mt-4">
        <Link href="/ranking" className="mt-4 flex items-center gap-3 border-t border-ink/10 pt-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff3c4,#e2bc68_50%,#a87a22)] font-myeongjo text-sm font-extrabold text-[#6b4a0e]">
            1
          </span>
          <span className="min-w-0 flex-1 text-[13px] leading-snug">
            <span className="block text-[11px] text-ink-soft">
              이달의 일주 랭킹 · {mp.label} {mp.term} {mp.from}~
            </span>
            <b className="font-myeongjo">
              1위 {ranks[0].name} <span className="text-seal">{ranks[0].hanja}</span>
            </b>
            {myRank && (
              <span className="text-ink-soft">
                {" "}
                · {me!.person.name}님 {myRank.rank > 50 ? "대비하면 되는 달" : `${myRank.rank}위`}
              </span>
            )}
          </span>
          <span className="shrink-0 text-[12px] font-bold text-seal">순위 →</span>
        </Link>
      </TodayCard>

      {orders.length > 0 && (
        <section className="card mt-4 px-5 py-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-myeongjo font-extrabold">내가 산 보고서</h2>
            <Link href="/my" className="text-xs font-bold text-seal">
              모두 보기 →
            </Link>
          </div>
          <ul className="mt-2 flex flex-col divide-y divide-ink/10">
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

      {/* In season: next year's 신년운세, the contents folded after three lines. */}
      {ny && nyProduct && (
        <section className="card mt-6 overflow-hidden">
          <div className="bg-seal px-5 py-2 text-center text-[12px] font-extrabold tracking-wide text-hanji">
            {ny} {yearName(ny).ko.replace("년", "")}년({yearName(ny).hanja}年) · {yearNickname(ny)}
          </div>
          <div className="px-5 pt-4 pb-5">
            <div className="flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-seal font-myeongjo text-sm font-extrabold text-seal">
                {nyProduct.hanja}
              </span>
              <h2 className="font-myeongjo text-[22px] leading-tight font-extrabold">{nyProduct.title}</h2>
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
              <Keep clauses>{nyProduct.tagline}</Keep>
            </p>
            {nyTheme && (
              <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-[13px]">
                {me!.person.name}님의 {ny}년은 <b className="text-seal">{nyTheme}</b>
              </p>
            )}
            <ol className="mt-3 flex flex-col divide-y divide-ink/10 text-[14px]">
              {nyProduct.toc.slice(0, 3).map((item, i) => (
                <li key={item} className="flex gap-2 py-1.5">
                  <span className="w-7 shrink-0 font-myeongjo font-extrabold text-seal">{hanjaNum(i + 1)}</span>
                  {item}
                </li>
              ))}
            </ol>
            <details className="group">
              <summary className="cursor-pointer list-none py-1.5 text-[13px] font-bold text-ink-soft">
                <span className="group-open:hidden">목차 {nyProduct.toc.length}장 모두 보기 ▾</span>
                <span className="hidden group-open:inline">접기 ▴</span>
              </summary>
              <ol className="flex flex-col divide-y divide-ink/10 text-[14px]">
                {nyProduct.toc.slice(3).map((item, i) => (
                  <li key={item} className="flex gap-2 py-1.5">
                    <span className="w-7 shrink-0 font-myeongjo font-extrabold text-seal">{hanjaNum(i + 4)}</span>
                    {item}
                  </li>
                ))}
              </ol>
            </details>
            <p className="mt-2 text-[12px] text-ink-soft">
              {ny}년 판정과 달마다 흐름은 무료로 먼저 · 한 해 전체 풀이 <Price />
            </p>
            <Link
              href={nyOwned ? `/reports/yeonun?order=${nyOwned.id}` : `/reports/yeonun?y=${ny}`}
              className="mt-3 block rounded-2xl bg-seal py-3.5 text-center font-myeongjo text-[17px] font-extrabold text-hanji shadow-[0_4px_0_#7d1a14]"
            >
              {nyOwned ? "결제한 신년운세 바로 보기" : me ? `${me.person.name}님의 ${ny}년 ${isPreview(ny) ? "미리 보기" : "보기"}` : `내 ${ny}년 운세 ${isPreview(ny) ? "미리 보기" : "보기"}`}
            </Link>
          </div>
        </section>
      )}

      <SectionTitle sub={<>사주 분석은 무료로 먼저 보고, 풀이 보고서는 한 편에 <Price /></>}>무엇이 궁금하세요?</SectionTitle>
      <ul className="grid grid-cols-2 gap-2">
        {TOPICS.map((t) => {
          const mine = owned[t.id];
          const href = t.id === "yeonun" ? "/reports/yeonun" : (mine?.href ?? `/reports/${t.id}`);
          return (
            <li key={t.id}>
              <Link href={href} className="jjok-box flex h-full flex-col px-4 pt-4 pb-3.5">
                <span className="font-myeongjo text-xl text-gold">{productById(t.id)!.hanja}</span>
                <span className="mt-1.5 font-myeongjo text-[18px] leading-tight font-extrabold">{t.name}</span>
                <span className="mt-1 flex-1 text-[12px] leading-snug text-hanji/75">{t.ask}</span>
                <span className="mt-2.5 flex items-center justify-between border-t border-gold/30 pt-2 text-[12px] font-bold">
                  <span className="text-hanji/60">{mine ? "결제함" : ""}</span>
                  <span className="text-gold">{mine ? "바로 보기 →" : "보기 →"}</span>
                </span>
              </Link>
            </li>
          );
        })}
        {/* The eighth place: 정 훈도에게 묻기 once it is open; before that, what he studies next. */}
        <li>
          {ask ? (
            <AskLink from="home" className="flex h-full flex-col rounded-2xl bg-gradient-to-br from-[#2c3848] to-[#1a232f] px-4 pt-4 pb-3.5 text-hanji shadow-[0_4px_0_#131a23,inset_0_0_0_1.5px_#d4af5f]">
              <span className="flex items-center justify-between">
                <span className="font-myeongjo text-xl text-gold">問</span>
                <HundoFace size={30} />
              </span>
              <span className="mt-1.5 font-myeongjo text-[18px] leading-tight font-extrabold">정 훈도에게 묻기</span>
              <span className="mt-1 flex-1 text-[12px] leading-snug text-hanji/75">내 고민 하나, 내 사주로 답서 받기</span>
              <span className="mt-2.5 flex items-center justify-between border-t border-gold/30 pt-2 text-[12px] font-bold">
                <span className="text-hanji/60">첫 질문 {JOIN_GIFT}개 선물</span>
                <span className="text-gold">묻기 →</span>
              </span>
            </AskLink>
          ) : (
            <Link
              href={`/contact?topic=${encodeURIComponent("보고 싶은 풀이")}`}
              className="flex h-full flex-col rounded-2xl border-2 border-dashed border-jjok/30 bg-jjok/5 px-4 pt-4 pb-3.5"
            >
              <span className="font-myeongjo text-xl text-jjok/45">硏究</span>
              <span className="mt-1.5 font-myeongjo text-[18px] leading-tight font-extrabold text-jjok/80">공부 중</span>
              <span className="mt-1 flex-1 text-[12px] leading-snug text-ink-soft">정 훈도가 새 보고서를 준비하고 있어요</span>
            </Link>
          )}
        </li>
      </ul>

      <SectionTitle>훈도의 사주 이야기</SectionTitle>
      <ul className="card flex flex-col divide-y divide-ink/10 px-4">
        {publishedColumns()
          .slice(0, 3)
          .map((c) => (
            <li key={c.slug}>
              <Link href={`/column/${c.slug}`} className="flex items-center gap-2 py-3">
                <span className="min-w-0 flex-1 text-[14px] leading-snug font-bold">
                  <ColumnTitle title={c.title} />
                </span>
                <span className="shrink-0 text-ink-soft">›</span>
              </Link>
            </li>
          ))}
      </ul>
      <Link href="/column" className="mt-2 block text-center text-[13px] font-bold text-seal">
        이야기 전체 보기 →
      </Link>
    </>
  );
}
