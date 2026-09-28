import Link from "next/link";
import { forgetMeAction } from "@/app/actions";
import StoreHero from "@/components/StoreHero";
import TodayCard from "@/components/TodayCard";
import { readMe } from "@/lib/me";
import { ownedByProduct, ownedOrders } from "@/lib/pay";
import { PRICE, priceNow, productById, SETS, type ProductId } from "@/lib/products";
import { readingCount } from "@/lib/store";
import { todayFor } from "@/lib/today";

// The main page, one path: the free reading first; then what the visitor wants to know, as six plain
// choices; then the free extras, folded into short rows. A buyer finds what they bought at the top.
// The Joseon game (왕이 될 사주, /king) is one row among the free extras.

// What each report answers, in the visitor's words: a one-word topic, the report, the question.
const TOPICS: { id: ProductId; topic: string; name: string; ask: string }[] = [
  { id: "pyeongsaeng", topic: "나", name: "평생 사주", ask: "나는 어떤 사람이고 어떻게 살아갈까?" },
  { id: "jaemul", topic: "돈", name: "재물·돈", ask: "돈이 왜 안 모일까, 언제 트일까?" },
  { id: "yeonae", topic: "사랑", name: "연애·결혼", ask: "나랑 맞는 사람은 언제 올까?" },
  { id: "jikup", topic: "일", name: "직업·적성", ask: "지금 일, 나랑 맞을까?" },
  { id: "gunghap", topic: "우리 둘", name: "궁합", ask: "우리, 진짜 잘 맞을까?" },
  { id: "taekil", topic: "좋은 날", name: "택일", ask: "결혼·이사·개업, 언제 할까?" },
];

// Free, computed, no payment: short rows under the choices.
const FREE: { href: string; name: string; line: string }[] = [
  { href: "/reports/gukjeong", name: "2026 운세", line: "남은 올해, 언제 움직이고 언제 쉴까" },
  { href: "/samjae", name: "2026 삼재 띠", line: "토끼·양·돼지띠 눌삼재" },
  { href: "/king", name: "왕이 될 사주", line: "친구와 함께 하는 조선 사주 놀이" },
  { href: "/reports/sinbun", name: "조선 신분 감정", line: "조선에 태어났다면 어떤 신분이었을까" },
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

// The running count shows only once it means something; before that, a small number reads as an empty shop.
const SHOW_COUNT_FROM = 100;

export default async function Home() {
  const [me, count, orders] = await Promise.all([readMe(), readingCount(), ownedOrders().catch(() => [])]);
  const owned = ownedByProduct(orders);

  return (
    <>
      <StoreHero
        count={count >= SHOW_COUNT_FROM ? count : null}
        cta={
          // The first stop is the free 2026 reading (a whole year, computed, no AI), not a report on sale:
          // people read something complete before being asked to pay.
          me
            ? { href: "/reports/gukjeong", label: `${me.person.name}님 무료 운세 보기`, sub: "2026년 운세와 사주 분석까지 · 무료" }
            : { href: "/reports/gukjeong", label: "내 사주 무료로 보기", sub: "생년월일만 넣으면 2026년 운세와 사주 분석을 바로 보여 드려요" }
        }
      />

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
            return (
              <li key={t.id}>
                <Link href={mine?.href ?? `/reports/${t.id}`} className="doc-paper flex h-full flex-col px-4 pt-4 pb-3.5">
                  <span className="font-myeongjo text-2xl leading-none font-extrabold text-seal">{t.topic}</span>
                  <span className="mt-2 font-myeongjo text-[15px] leading-tight font-extrabold">{t.name}</span>
                  <span className="mt-1 flex-1 text-[12px] leading-snug text-ink-soft">{t.ask}</span>
                  <span className="mt-2.5 border-t border-seal/15 pt-2 text-right text-[12px] font-bold text-seal">{mine ? "결제함 · 바로 보기 →" : "보기 →"}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-center font-myeongjo text-lg font-extrabold">무료로 보기</h2>
        <TodayCard today={todayFor(me?.person ?? null)} name={me?.person.name ?? null} />
        <ul className="doc-paper mt-2 flex flex-col divide-y divide-seal/10 px-5 py-1">
          {FREE.map((f) => (
            <li key={f.href}>
              <Link href={f.href} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <b className="block font-myeongjo">{f.name}</b>
                  <span className="block text-[12px] text-ink-soft">{f.line}</span>
                </span>
                <span className="shrink-0 text-xs font-bold text-seal">무료 →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
