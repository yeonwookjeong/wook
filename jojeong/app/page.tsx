import Link from "next/link";
import { forgetMeAction } from "@/app/actions";
import Hundo from "@/components/Hundo";
import RoyalDoc from "@/components/RoyalDoc";
import { readMe } from "@/lib/me";
import { OPEN_ALL, PRICE_STEPS, productById, type Product, type ProductId } from "@/lib/products";

// The main page: 정 훈도's present-day readings, picked and opened with one's own chart. The Joseon game
// (왕이 될 사주, /king) is the free, shareable side door.

const PITCH: Partial<Record<ProductId, string>> = {
  gunghap: "우리 둘, 진짜 잘 맞을까?",
  gukjeong: "2026년, 나한테 무슨 일이?",
  yeonae: "나랑 맞는 사람은 언제 올까?",
  jaemul: "돈이 왜 안 모일까?",
  jikup: "지금 일, 나랑 맞을까?",
};
const GRID: ProductId[] = ["gunghap", "gukjeong", "yeonae", "jaemul", "jikup"];

function Price({ product }: { product: Product }) {
  if (product.free) return <span className="text-sm font-extrabold text-seal">무료</span>;
  if (OPEN_ALL)
    return (
      <span className="flex items-baseline gap-1">
        <s className="text-[11px] text-ink-soft">{PRICE_STEPS[0].toLocaleString("ko-KR")}원</s>
        <span className="text-sm font-extrabold text-seal">무료 공개 중</span>
      </span>
    );
  return <span className="text-sm font-extrabold text-seal">{PRICE_STEPS[0].toLocaleString("ko-KR")}원</span>;
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
      <section className="mt-6 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.5em] text-seal">觀 象 監</p>
        <h1 className="mt-2 font-myeongjo text-[32px] leading-tight font-extrabold">정 훈도의 사주</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          조선 최고의 사주쟁이가
          <br />
          <b className="text-ink">지금의 나</b>를 봐 드려요
        </p>
      </section>

      <section className="mt-5">
        <Hundo mood="bow">
          어서 오시옵소서. 같은 일주라도 다 같은 사주가 아니옵니다. 생년월일을 주시면 그대만의 여덟 글자를 끝까지 풀어 올리겠사옵니다.
        </Hundo>
      </section>

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
                <Link href={`/reports/${id}`} className="doc-paper flex h-full flex-col gap-2 px-3 py-4">
                  <span className="flex items-center gap-2">
                    <span className="flex size-9 shrink-0 items-center justify-center border-2 border-seal/60 font-myeongjo text-xs font-extrabold text-seal">
                      {p.hanja}
                    </span>
                    <span className="font-myeongjo text-[15px] leading-tight font-extrabold">{p.title}</span>
                  </span>
                  <span className="flex-1 text-[13px] leading-snug text-ink-soft">{PITCH[id]}</span>
                  <Price product={p} />
                </Link>
              </li>
            );
          })}
          <li>
            <Link href="/reports" className="doc-paper flex h-full flex-col items-center justify-center gap-1 px-3 py-4 text-center">
              <span className="font-myeongjo text-[15px] font-extrabold">전체 보고서</span>
              <span className="text-[13px] text-seal">모두 보기 →</span>
            </Link>
          </li>
        </ul>
      </section>

      <section className="doc-paper mt-8 px-5 py-6">
        <h2 className="text-center font-myeongjo text-lg font-extrabold">정 훈도는 이렇게 봐요</h2>
        <ol className="mt-4 flex flex-col gap-3 text-[14px] leading-relaxed">
          <li className="flex gap-3">
            <span className="font-myeongjo font-extrabold text-seal">一</span>
            <span>
              <b>여덟 글자를 12.5%씩 똑같이 세지 않아요.</b> 계절을 쥔 태어난 달이 가장 무겁고, 나와 가장 가까운 태어난 날이 그다음이에요. 계절 보정과
              글자끼리의 합·충까지 반영해요.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-myeongjo font-extrabold text-seal">二</span>
            <span>
              <b>같은 일주라도 다 달라요.</b> 25만여 개의 사주와 비교해서, 같은 일주 가운데서도 몇 %만 가진 구조인지 짚어 드려요.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-myeongjo font-extrabold text-seal">三</span>
            <span>
              <b>누구에게나 맞는 말은 쓰지 않아요.</b> 지나온 해를 짚고, 앞으로 몇 월에 무엇을 할지까지 그 사람의 사주로만 풀어요.
            </span>
          </li>
        </ol>
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
