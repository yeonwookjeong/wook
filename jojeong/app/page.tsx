import Link from "next/link";
import { forgetMeAction } from "@/app/actions";
import { CHARACTER } from "@/lib/brand";
import Keep from "@/components/Keep";
import RoyalDoc from "@/components/RoyalDoc";
import StoreHero from "@/components/StoreHero";
import TodayCard from "@/components/TodayCard";
import { readMe } from "@/lib/me";
import { OPEN_ALL, PRICE_STEPS, productById, type Product, type ProductId } from "@/lib/products";
import { todayFor } from "@/lib/today";

// The main page: 정 훈도's present-day readings, picked and opened with one's own chart. The Joseon game
// (왕이 될 사주, /king) is the free, shareable side door.

// Short names for the grid; the full titles stay on the report pages.
const SHORT: Partial<Record<ProductId, string>> = { gunghap: "궁합", gukjeong: "2026 운세", yeonae: "연애·결혼", jaemul: "재물·돈", jikup: "직업·적성" };
const PITCH: Partial<Record<ProductId, string>> = {
  gunghap: "우리 둘, 진짜 잘 맞을까?",
  gukjeong: "남은 올해, 언제 움직이고 언제 쉴까?",
  yeonae: "나랑 맞는 사람은 언제 올까?",
  jaemul: "돈이 왜 안 모일까?",
  jikup: "지금 일, 나랑 맞을까?",
};
// A few exchanges at 정 훈도's table: what people bring, what they hear back. Shown, not claimed.
const TALKS = [
  { ask: "연애만 하면 왜 이렇게 꼬일까요?", answer: "끌리는 사람과 편한 사람이 늘 다른 사주예요. 세 번째로 만난 사람 쪽이 인연일 때가 많아요." },
  { ask: "요즘 일이 손에 안 잡혀요.", answer: "2019년 즈음 일하는 방식이 한 번 크게 바뀌었죠? 그 흐름이 2028년까지 이어져요. 지금은 버틸 때가 아니라 방향을 고를 때예요." },
  { ask: "올해 안에 뭘 해 보면 좋을까요?", answer: "11월이 문이 열리는 달이에요. 미뤄 둔 연락이 있다면 그때 먼저 하세요." },
];
const GRID: ProductId[] = ["gunghap", "gukjeong", "yeonae", "jaemul", "jikup"];

function Price({ product }: { product: Product }) {
  if (product.free) return <span className="text-[13px] font-extrabold text-seal">무료</span>;
  if (OPEN_ALL)
    return (
      <span className="flex items-baseline gap-1.5">
        <span className="text-[13px] font-extrabold text-seal">무료 공개</span>
        <s className="text-[11px] text-ink-soft">{PRICE_STEPS[0].toLocaleString("ko-KR")}원</s>
      </span>
    );
  return <span className="text-[13px] font-extrabold text-seal">{PRICE_STEPS[0].toLocaleString("ko-KR")}원</span>;
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
      <StoreHero />
      <TodayCard today={todayFor(me?.person ?? null)} name={me?.person.name ?? null} />

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

      <section className="mt-9">
        <h2 className="text-center font-myeongjo text-lg font-extrabold">요즘 이런 고민 있으세요?</h2>
        <div className="doc-paper mt-4 flex flex-col gap-5 px-5 py-6">
          {TALKS.map((t) => (
            <div key={t.ask} className="flex flex-col gap-2">
              <p className="max-w-[80%] self-end rounded-2xl rounded-br-sm bg-ink/8 px-4 py-2.5 text-[14px] leading-snug">{t.ask}</p>
              <div className="flex items-end gap-2">
                <span className="size-9 shrink-0 overflow-hidden rounded-full border-2 border-[#d9ad52] bg-[#f7efd9]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={CHARACTER.face} alt="" width={36} height={36} className="size-full object-cover" />
                </span>
                <p className="max-w-[85%] rounded-2xl rounded-bl-sm border border-seal/20 bg-white/70 px-4 py-2.5 text-[14px] leading-relaxed">{t.answer}</p>
              </div>
            </div>
          ))}
          <Link href="/reports/pyeongsaeng" className="mt-1 block rounded-2xl bg-seal py-3.5 text-center font-myeongjo font-extrabold text-hanji shadow-[0_4px_0_#7d1a14]">
            내 고민도 물어보기 →
          </Link>
        </div>
        <p className="mt-2 text-center text-[11px] text-ink-soft">예시 대화예요. 실제 이야기는 사주마다 달라요.</p>
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
