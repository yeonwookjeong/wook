import Link from "next/link";
import PayButton from "./PayButton";
import { josa } from "@/lib/josa";
import { payEnabled } from "@/lib/pay";
import { PRICE, productById, saleLabel, saleNow, SETS, setsWith, type Product, type ProductId } from "@/lib/products";
import { newYearOf } from "@/lib/yeonun";

// Where the written report would begin, before it is bought: its chapters, the price, and the payment.
// Everything above it (the chart and how it was read) stays free.
export default function Paywall({
  product,
  request,
  chapters,
  heading = `이 사주로 쓴 ${product.title} 보고서`,
  sub = `위의 풀이를 바탕으로 ${chapters.length}장에 걸쳐 써 드려요`,
  note,
}: {
  product: Product;
  request: Record<string, string>;
  chapters: string[];
  heading?: string;
  sub?: string;
  note?: string;
}) {
  const sale = saleNow();
  const price = sale?.price ?? PRICE;
  // Sets are offered for a one-person report bought for a saved chart.
  // 새해 준비 세트 only while there is a coming year, and on a 연운 page only for that year.
  const ny = newYearOf();
  const sets = request.p ? setsWith(product.id).filter((s) => s !== "ny" || (ny !== null && (request.y === undefined || request.y === String(ny)))) : [];
  const titleIn = (id: ProductId) => (id === "yeonun" && ny !== null ? `${ny} 신년운세` : productById(id)!.title);
  return (
    <section id="report-start" className="doc-paper mt-6 scroll-mt-4 px-5 pt-6 pb-6">
      <h2 className="text-center font-myeongjo text-lg font-extrabold">{heading}</h2>
      <p className="mt-1 text-center text-xs text-ink-soft">{sub}</p>
      <ol className="mt-4 flex flex-col divide-y divide-seal/15 border-y-[3px] border-double border-seal/40 px-1">
        {chapters.map((item, i) => (
          <li key={item} className="flex items-center gap-2 py-2 text-left text-[15px]">
            <span className="font-myeongjo font-extrabold text-seal">{i < 9 ? "一二三四五六七八九"[i] : i + 1}</span>
            <span className="flex-1">{item}</span>
            <span className="text-xs text-ink-soft" aria-label="잠김">
              🔒
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-5 text-center">
        {sale && <p className="text-xs font-extrabold text-seal">{saleLabel(sale)}</p>}
        <p className="mt-1 flex items-baseline justify-center gap-2">
          {sale && <s className="text-base text-ink-soft">{PRICE.toLocaleString("ko-KR")}원</s>}
          <span className="font-myeongjo text-3xl font-extrabold text-seal">{price.toLocaleString("ko-KR")}원</span>
        </p>
        {note && <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-left text-[12px] leading-relaxed">{note}</p>}
        {payEnabled() ? (
          <>
            <PayButton request={request} label={`${price.toLocaleString("ko-KR")}원 결제하고 보기`} />
            {sets.map((s) => {
              const list = SETS[s].products;
              const regular = list.length * PRICE;
              return (
                <div key={s}>
                  <PayButton
                    secondary
                    request={{ set: s, p: request.p }}
                    label={`${SETS[s].title} ${SETS[s].price.toLocaleString("ko-KR")}원 (정가 ${regular.toLocaleString("ko-KR")}원)`}
                  />
                  <p className="mt-1 text-[11px] text-ink-soft">{josa(list.map(titleIn).join(" · "), "을/를")} 이 사주로 한 번에</p>
                </div>
              );
            })}
          </>
        ) : (
          <button type="button" disabled className="mt-4 w-full rounded-2xl bg-seal/60 py-4 font-myeongjo text-lg font-extrabold text-hanji">
            결제 준비 중이에요
          </button>
        )}
        <p className="mt-2 text-[11px] text-ink-soft">결제하면 바로 열려요 · 링크로 언제든 다시 볼 수 있어요</p>
      </div>
      <p className="mt-4 text-left text-[11px] leading-relaxed text-ink-soft">
        보고서는 결제 즉시 열리는 디지털 콘텐츠라, 열람을 시작한 뒤에는 전자상거래법에 따라 청약철회가 제한돼요. 결제 전에 위의
        목차와 풀이로 내용을 확인해 주세요. 보고서가 안내한 내용과 다르게 제공된 경우에는 받은 날부터 3개월 이내에 환불을 요청할
        수 있어요. 자세한 내용은{" "}
        <Link href="/refund" className="whitespace-nowrap underline">
          환불 규정
        </Link>
        을 확인해 주세요.
      </p>
    </section>
  );
}
