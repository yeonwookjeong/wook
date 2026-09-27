import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import Keep from "@/components/Keep";
import { isOpen, OPEN_ALL, PRICE, priceNow, productById, PRODUCTS, saleLabel, saleNow, SETS, type Product, type SetId } from "@/lib/products";

export const metadata: Metadata = { title: "전체 보고서" };

// Every report on one shelf: the present-day readings first, then the Joseon play that opens from the court.
const WHERE: Record<Product["for"], string | null> = { king: "왕이 보는 보고서", minister: "신하가 보는 보고서", anyone: null };

function Row({ p, price }: { p: Product; price: number }) {
  const where = p.modern ? null : WHERE[p.for];
  return (
    <li>
      <Link href={`/reports/${p.id}`} className="doc-paper flex items-center gap-4 px-5 py-5">
        <span
          className={`flex h-14 min-w-14 shrink-0 items-center justify-center border-2 border-seal/60 px-1 font-myeongjo font-extrabold text-seal ${p.hanja.length > 2 ? "text-sm" : "text-lg"}`}
        >
          {p.hanja}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-myeongjo text-lg leading-snug font-extrabold">{p.title}</span>
          <span className="mt-0.5 block text-[13px] leading-snug text-ink-soft">
            <Keep clauses>{p.tagline}</Keep>
          </span>
          {where && <span className="mt-1 inline-block border border-gold/60 px-1.5 text-[10px] font-bold text-gold">{where}</span>}
        </span>
        <span className="shrink-0 text-right font-myeongjo font-extrabold text-seal">
          {p.free ? (
            "무료"
          ) : isOpen(p) ? (
            <>
              <s className="block text-xs font-normal text-ink-soft">{PRICE.toLocaleString("ko-KR")}원</s>무료
            </>
          ) : price < PRICE ? (
            <>
              <s className="block text-xs font-normal text-ink-soft">{PRICE.toLocaleString("ko-KR")}원</s>
              {price.toLocaleString("ko-KR")}원
            </>
          ) : (
            `${price.toLocaleString("ko-KR")}원`
          )}
        </span>
      </Link>
    </li>
  );
}

export default async function ReportsPage() {
  // Rendered per request, so a sale starts and ends on its dates without a redeploy.
  await connection();
  const price = priceNow();
  const sale = saleNow();
  const modern = PRODUCTS.filter((p) => p.modern);
  const joseon = PRODUCTS.filter((p) => !p.modern);

  return (
    <>
      <section className="mt-6 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">報 告</p>
        <h1 className="mt-2 font-myeongjo text-3xl font-extrabold">전체 보고서</h1>
        <p className="mt-2 text-[15px] leading-relaxed">궁금한 것부터 골라 보세요</p>
        <p className="mt-1 text-sm">
          {OPEN_ALL ? (
            <b className="text-gold">지금은 무료 공개 기간이라 모든 보고서를 무료로 볼 수 있어요</b>
          ) : sale ? (
            <b className="text-seal">{saleLabel(sale)}</b>
          ) : (
            <span className="text-ink-soft">
              보고서 한 편 <b className="text-ink">{price.toLocaleString("ko-KR")}원</b> · 첫 장은 무료로 먼저 읽어 볼 수 있어요
            </span>
          )}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-myeongjo text-lg font-extrabold">내 사주 보고서</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {modern.map((p) => (
            <Row key={p.id} p={p} price={price} />
          ))}
        </ul>
      </section>

      {!OPEN_ALL && (
        <section className="doc-paper mt-4 px-5 py-4">
          <h2 className="font-myeongjo font-extrabold">세트로 보면 더 저렴해요</h2>
          <ul className="mt-2 flex flex-col gap-1.5 text-[13px]">
            {(Object.keys(SETS) as SetId[]).map((s) => (
              <li key={s} className="flex items-baseline gap-2">
                <b className="shrink-0 font-myeongjo">{SETS[s].title}</b>
                <span className="flex-1 text-ink-soft">{SETS[s].products.map((id) => productById(id)!.title).join(" · ")}</span>
                <b className="shrink-0 text-seal">{SETS[s].price.toLocaleString("ko-KR")}원</b>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-ink-soft">세트에 든 보고서 아무거나 열면 결제 화면에서 고를 수 있어요</p>
        </section>
      )}

      <section className="mt-9">
        <h2 className="font-myeongjo text-lg font-extrabold">재미로 보는 조선 사주</h2>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">
          조선 시대로 가 보는 보고서예요. 왕·신하 표시가 붙은 건{" "}
          <Link href="/king" className="font-bold text-seal underline">
            왕이 될 사주
          </Link>
          의 조정에서 열려요.
        </p>
        <ul className="mt-3 flex flex-col gap-3">
          {joseon.map((p) => (
            <Row key={p.id} p={p} price={price} />
          ))}
        </ul>
      </section>
    </>
  );
}
