import Link from "next/link";
import { forgetMeAction } from "@/app/actions";
import Keep from "@/components/Keep";
import RoyalDoc from "@/components/RoyalDoc";
import StoreHero from "@/components/StoreHero";
import TodayCard from "@/components/TodayCard";
import { readMe } from "@/lib/me";
import { OPEN_ALL, PRICE, priceNow, productById, type Product, type ProductId } from "@/lib/products";
import { todayFor } from "@/lib/today";

// The main page: 정 훈도's present-day readings, picked and opened with one's own chart. The Joseon game
// (왕이 될 사주, /king) is the free, shareable side door.

// Short names for the grid; the full titles stay on the report pages.
const SHORT: Partial<Record<ProductId, string>> = {
  gunghap: "궁합",
  sokgunghap: "속궁합",
  jaehoe: "재회운",
  gukjeong: "2026 운세",
  yeonae: "연애·결혼",
  jaemul: "재물·돈",
  jikup: "직업·적성",
};
const PITCH: Partial<Record<ProductId, string>> = {
  gunghap: "우리 둘, 진짜 잘 맞을까?",
  sokgunghap: "말로는 다 모르는 우리 둘의 온도",
  jaehoe: "그 사람, 다시 올까?",
  gukjeong: "남은 올해, 언제 움직이고 언제 쉴까?",
  yeonae: "나랑 맞는 사람은 언제 올까?",
  jaemul: "돈이 왜 안 모일까?",
  jikup: "지금 일, 나랑 맞을까?",
};
// A page torn from three reports, laid out the way the reports are (a chapter question, a one-line answer,
// the reading), each opening its report. Real report form, so nothing suggests a chat.
const EXCERPTS: { id: ProductId; chapter: string; headline: string; body: string }[] = [
  {
    id: "yeonae",
    chapter: "왜 늘 비슷한 사람에게 끌릴까",
    headline: "끌리는 사람과 편한 사람이 늘 달라요",
    body: "첫눈에 반한 사람보다 세 번째로 만난 사람 쪽이 인연일 때가 많아요. 설렘이 먼저 오는 사람일수록 한 번은 멈춰서 보세요.",
  },
  {
    id: "jikup",
    chapter: "지금 일이 버겁게 느껴진다면",
    headline: "버틸 때가 아니라, 방향을 고를 때예요",
    body: "2019년 즈음 일하는 방식이 한 번 크게 바뀌었을 거예요. 그 흐름이 2028년까지 이어지니, 지금 고르는 방향이 다음 10년을 정해요.",
  },
  {
    id: "gukjeong",
    chapter: "언제 움직이고 언제 쉴까 (하반기)",
    headline: "11월이 문이 열리는 달이에요",
    body: "미뤄 둔 연락이 있다면 그때 먼저 하세요. 10월은 숨을 고르고, 큰 결정은 11월로 넘기는 편이 좋아요.",
  },
];
// The court's own reports (they open from a court, with friends in it).
const COURT_REPORTS = [
  ["현실 궁합 뒷조사", "이 친구, 일·여행·돈으로 엮여도 될까"],
  ["모임 관계도", "우리 모임 찰떡 짝과 숨은 실세"],
  ["내 인사기록 열람", "왕(친구)은 나를 어떻게 볼까"],
] as const;
const GRID: ProductId[] = ["gunghap", "yeonae", "jaemul", "jikup", "gukjeong"];

function Price({ product }: { product: Product }) {
  if (product.free) return <span className="text-[13px] font-extrabold text-seal">무료</span>;
  if (OPEN_ALL)
    return (
      <span className="flex items-baseline gap-1.5">
        <span className="text-[13px] font-extrabold text-seal">무료 공개</span>
        <s className="text-[11px] text-ink-soft">{PRICE.toLocaleString("ko-KR")}원</s>
      </span>
    );
  const price = priceNow();
  if (price < PRICE)
    return (
      <span className="flex items-baseline gap-1.5">
        <span className="text-[13px] font-extrabold text-seal">{price.toLocaleString("ko-KR")}원</span>
        <s className="text-[11px] text-ink-soft">{PRICE.toLocaleString("ko-KR")}원</s>
      </span>
    );
  return <span className="text-[13px] font-extrabold text-seal">{PRICE.toLocaleString("ko-KR")}원</span>;
}

function Seal({ hanja }: { hanja: string }) {
  return (
    <span className="flex size-12 shrink-0 items-center justify-center border-2 border-seal/70 font-myeongjo text-sm font-extrabold text-seal">
      {hanja}
    </span>
  );
}

export default async function Home() {
  const me = await readMe();
  const main = productById("pyeongsaeng")!;

  return (
    <>
      <StoreHero
        cta={
          me
            ? { href: "/reports/pyeongsaeng", label: `${me.person.name}님 사주 분석 보기`, sub: "여덟 글자의 무게와 드문 특징까지 · 무료" }
            : { href: "/reports/pyeongsaeng", label: "내 사주 무료 분석", sub: "생년월일만 넣으면 여덟 글자의 무게와 드문 특징을 바로 보여 드려요" }
        }
      />
      <TodayCard today={todayFor(me?.person ?? null)} name={me?.person.name ?? null} />
      <Link href="/samjae" className="mt-2 flex items-center justify-between rounded-2xl border border-seal/20 bg-white/40 px-5 py-3 text-[13px]">
        <span>
          <b className="font-myeongjo">2026 삼재 띠</b> <span className="text-ink-soft">· 토끼·양·돼지띠 눌삼재</span>
        </span>
        <span className="font-bold text-seal">무료 확인 →</span>
      </Link>

      {me && (
        <form action={forgetMeAction} className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-gold/15 px-4 py-2 text-xs">
          <span className="font-bold text-gold">{me.person.name}님 사주로 보는 중</span>
          <button type="submit" className="text-ink-soft underline">
            다른 사람 보기
          </button>
        </form>
      )}

      {/* The flagship: the whole life in one report */}
      <RoyalDoc className="mt-5" paperClassName="px-5">
        <p className="text-center text-xs font-extrabold text-seal">정 훈도의 대표 보고서</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <Seal hanja={main.hanja} />
          <h2 className="font-myeongjo text-2xl font-extrabold">{main.title}</h2>
        </div>
        <p className="mt-2 text-center text-sm leading-relaxed text-ink-soft">
          <Keep clauses>{main.tagline}</Keep>
        </p>
        <ol className="mt-4 flex flex-col divide-y divide-seal/15 border-y-[3px] border-double border-seal/40 px-1 text-[14px]">
          {main.toc.slice(0, 4).map((item, i) => (
            <li key={item} className="flex gap-2 py-2">
              <span className="font-myeongjo font-extrabold text-seal">{"一二三四"[i]}</span>
              {item}
            </li>
          ))}
          <li className="py-2 text-center text-xs text-ink-soft">그리고 {main.toc.length - 4}장 더</li>
        </ol>
        <div className="mt-4 flex items-center justify-center">
          <Price product={main} />
        </div>
        <Link href="/reports/pyeongsaeng" className="mt-3 block rounded-2xl bg-seal py-4 text-center font-myeongjo text-lg font-extrabold text-hanji shadow-[0_6px_0_#7d1a14]">
          {me ? `${me.person.name}님의 평생 사주 보기` : "내 평생 사주 보기"}
        </Link>
      </RoyalDoc>

      <section className="mt-8">
        <h2 className="text-center font-myeongjo text-lg font-extrabold">궁금한 것부터 골라 보세요</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {GRID.map((id) => {
            const p = productById(id)!;
            return (
              <li key={id}>
                <Link href={`/reports/${id}`} className="doc-paper flex h-full flex-col px-5 pt-5 pb-4">
                  <span className="font-myeongjo text-[11px] font-extrabold tracking-[0.3em] text-seal">{p.hanja}</span>
                  <span className="mt-1 font-myeongjo text-lg leading-tight font-extrabold">{SHORT[id]}</span>
                  <span className="mt-1.5 flex-1 text-[13px] leading-snug text-ink-soft">{PITCH[id]}</span>
                  <span className="mt-3 flex items-center justify-between border-t border-seal/15 pt-2.5">
                    <Price product={p} />
                    <span className="text-seal" aria-hidden="true">
                      →
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
          <li>
            <Link href="/reports" className="doc-paper flex h-full flex-col items-center justify-center gap-1 px-5 py-5 text-center">
              <span className="font-myeongjo text-lg font-extrabold">전체 보고서</span>
              <span className="text-[13px] text-seal">모두 보기 →</span>
            </Link>
          </li>
        </ul>
      </section>

      {/* 택일 was the 명과학 훈도's own work at 관상감: the brand, as a product. */}
      <Link href="/reports/taekil" className="doc-paper mt-3 flex items-center gap-4 px-5 py-4">
        <Seal hanja="擇日" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-extrabold text-seal">명과학 훈도의 본업</span>
          <span className="block font-myeongjo text-lg leading-tight font-extrabold">택일 · 좋은 날 받기</span>
          <span className="mt-0.5 block text-[13px] leading-snug text-ink-soft">결혼, 이사, 개업·계약 날짜를 책력과 내 사주로</span>
        </span>
        <span className="text-seal">→</span>
      </Link>

      <section className="mt-9">
        <h2 className="text-center font-myeongjo text-lg font-extrabold">요즘 이런 고민 있으세요?</h2>
        <ul className="mt-4 flex flex-col gap-2.5">
          {EXCERPTS.map((x) => (
            <li key={x.id}>
              <Link href={`/reports/${x.id}`} className="doc-paper block px-6 py-5">
                <span className="block text-[11px] text-ink-soft">{productById(x.id)!.title} 보고서 중에서</span>
                <span className="mt-2 block text-[12px] font-extrabold text-seal">{x.chapter}</span>
                <span className="mt-0.5 block font-myeongjo text-[17px] leading-snug font-extrabold">{x.headline}</span>
                {/* The reading fades out: a taste, not the page */}
                <span className="mt-2 block [mask-image:linear-gradient(to_bottom,black_40%,transparent)] text-[14px] leading-relaxed text-ink-soft">{x.body}</span>
                <span className="mt-1 block text-right text-[13px] font-bold text-seal">이 보고서 보기 →</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-center text-[11px] text-ink-soft">보고서 속 한 장면을 옮긴 예시예요. 실제 내용은 사주마다 달라요.</p>
      </section>

      <section className="mt-8">
        <h2 className="text-center font-myeongjo text-lg font-extrabold">재미로 보는 조선 사주</h2>
        <p className="mt-1 text-center text-xs text-ink-soft">무료 · 친구와 같이 하면 더 재밌어요</p>
        <div className="mt-3 flex flex-col gap-2">
          <Link href="/king" className="flex items-center gap-4 rounded-2xl bg-[#17304a] px-5 py-5 text-hanji">
            <span className="flex size-12 shrink-0 items-center justify-center border-2 border-gold font-myeongjo text-sm font-extrabold text-gold">王</span>
            <span className="min-w-0 flex-1">
              <span className="block font-myeongjo text-lg font-extrabold">왕이 될 사주</span>
              <span className="block text-[13px] leading-snug text-hanji/80">내가 왕이었다면 성군일까 폭군일까? 친구를 부르면 사주로 관직을 내려요</span>
            </span>
            <span className="text-gold">→</span>
          </Link>
          <div className="doc-paper px-5 py-4">
            <p className="text-[12px] font-extrabold text-seal">친구를 부르면 조정에서 열리는 보고서 · 무료</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-[13px]">
              {COURT_REPORTS.map(([title, line]) => (
                <li key={title} className="flex gap-2">
                  <b className="shrink-0 font-myeongjo">{title}</b>
                  <span className="text-ink-soft">{line}</span>
                </li>
              ))}
            </ul>
            <Link href="/king" className="mt-3 block text-right text-[13px] font-bold text-seal">
              왕이 될 사주 시작하기 →
            </Link>
          </div>
          <Link href="/reports/sinbun" className="doc-paper flex items-center gap-4 px-5 py-4">
            <Seal hanja="身分" />
            <span className="min-w-0 flex-1">
              <span className="block font-myeongjo font-extrabold">조선 신분 감정</span>
              <span className="block text-[13px] leading-snug text-ink-soft">조선에 태어났다면 어떤 신분, 어떤 일을 했을까</span>
            </span>
            <span className="text-sm font-extrabold text-seal">무료</span>
          </Link>
        </div>
      </section>
    </>
  );
}
