import Link from "next/link";
import { forgetMeAction } from "@/app/actions";
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
  gukjeong: "2026년, 나한테 무슨 일이?",
  yeonae: "나랑 맞는 사람은 언제 올까?",
  jaemul: "돈이 왜 안 모일까?",
  jikup: "지금 일, 나랑 맞을까?",
};
// What a report actually says, so the difference shows in the sentences rather than in the method.
const SAYINGS = [
  { label: "같은 일주라도", line: "같은 丁未일주 중에서도 이 구조는 100명 중 6명뿐이에요." },
  { label: "지나온 해를 짚어요", line: "2019년 무렵, 일하는 방식이 통째로 바뀌었을 거예요." },
  { label: "앞으로 할 일까지", line: "11월엔 먼저 연락하세요. 올해 인연이 들어오는 달이에요." },
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
          <span className="font-bold text-gold">{me.person.name}님의 사주로 보고 있어요</span>
          <button type="submit" className="text-ink-soft underline">
            다른 사람으로
          </button>
        </form>
      )}

      {/* The flagship: the whole life in one report */}
      <RoyalDoc className="mt-5" paperClassName="px-5">
        <p className="text-center text-xs font-extrabold text-seal">대표 보고서</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <Seal hanja={main.hanja} />
          <h2 className="font-myeongjo text-2xl font-extrabold">{main.title}</h2>
        </div>
        <p className="mt-2 text-center text-sm leading-relaxed text-ink-soft">{main.tagline}</p>
        <ol className="mt-4 flex flex-col divide-y divide-seal/15 border-y-[3px] border-double border-seal/40 px-1 text-[14px]">
          {main.toc.slice(0, 4).map((item, i) => (
            <li key={item} className="flex gap-2 py-2">
              <span className="font-myeongjo font-extrabold text-seal">{"一二三四"[i]}</span>
              {item}
            </li>
          ))}
          <li className="py-2 text-center text-xs text-ink-soft">…모두 {main.toc.length}장</li>
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
        <h2 className="text-center font-myeongjo text-lg font-extrabold">뻔한 말 대신, 이런 말을 해요</h2>
        <p className="mt-1 text-center text-[13px] text-ink-soft">&ldquo;따뜻하고 배려심이 깊으시네요&rdquo; 같은 말은 하지 않아요</p>
        <ul className="mt-4 flex flex-col gap-2.5">
          {SAYINGS.map((x) => (
            <li key={x.label} className="doc-paper px-6 py-5">
              <p className="text-[11px] font-extrabold text-seal">{x.label}</p>
              <p className="mt-1 font-myeongjo text-[17px] leading-snug font-extrabold">&ldquo;{x.line}&rdquo;</p>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-center text-[11px] text-ink-soft">보고서 속 문장 예시예요. 실제 문장은 사람마다 모두 달라요.</p>
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
