import Link from "next/link";
import PayButton from "./PayButton";
import { hanjaNum } from "@/lib/hanjaNum";
import { josa } from "@/lib/josa";
import { payEnabled } from "@/lib/pay";
import { bonusFor, PRICE, priceFor, productById, saleLabel, saleNow, SETS, setsWith, type Product, type ProductId, type SetId } from "@/lib/products";
import { setOffer, type SetOffer } from "@/lib/upgrade";
import { pricingNow } from "@/lib/pricing";
import { newYearOf } from "@/lib/yeonun";
import { isPreview } from "@/lib/admin";
import { currentMember, membersEnabled } from "@/lib/members";

// Where the written report would begin, before it is bought: its chapters, the price, and the payment.
// Everything above it (the chart and how it was read) stays free.
const FRONT_SET: Partial<Record<ProductId, SetId>> = { jaemul: "all", jikup: "all" };
const FRONT_SET_A: Partial<Record<ProductId, SetId>> = { jaemul: "jeonseo", jikup: "jeonseo", yeonae: "jeonseo" };

export default async function Paywall({
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
  const pr = await pricingNow();
  const ny = newYearOf();
  const price = priceFor(product.id, pr, request.y, ny);
  // A sale shows only on the 990-won reports (lib/products.ts priceFor).
  const sale = price < PRICE ? saleNow() : null;
  const bonus = bonusFor(pr, product.id, null, request.y, ny);
  // Sets are offered for a one-person report bought for a saved chart. A set holding a 연운 only while there is
  // a coming year, and on a 연운 page only for that year.
  const offered = request.p
    ? setsWith(product.id, pr).filter((s) => !SETS[s].products.includes("yeonun") || (ny !== null && (request.y === undefined || request.y === String(ny))))
    : [];
  // What each set costs this chart: less what was already bought for it, or not offered when that is no deal.
  const offers = new Map<SetId, SetOffer>();
  for (const s of offered) {
    const o = await setOffer(s, request.p, pr, ny);
    if (o) offers.set(s, o);
  }
  const sets = offered.filter((s) => offers.has(s));
  const titleIn = (id: ProductId) => (id === "yeonun" && ny !== null ? `${ny} 신년운세` : productById(id)!.title.split(" · ")[0]);
  // Money and work showed three sets under the single report and sold least: one set in front, the rest folded.
  const lead = (pr === "a" ? FRONT_SET_A : FRONT_SET)[product.id];
  const front = lead && sets.includes(lead) ? [lead] : sets;
  const folded = sets.filter((s) => !front.includes(s));
  // A set as shops show a bundle: its name and what is in it on the left, the price on the right with the discount
  // and the regular price struck through small, not spelled out in brackets. An upgrade shows no percentage (it is
  // the difference, not a sale), only what the missing reports would cost one by one.
  const setButton = (s: SetId) => {
    const o = offers.get(s)!;
    const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
    const off = Math.round((1 - o.price / o.regular) * 100);
    const missing = SETS[s].products.filter((id) => !o.owned.includes(id));
    const label = (
      <span className="flex items-center gap-3 px-4 text-left">
        <span className="min-w-0 flex-1">
          <span className="block font-myeongjo text-[16px] leading-snug">{o.owned.length ? `${SETS[s].title}로 올리기` : SETS[s].title}</span>
          <span className="mt-0.5 block font-sans text-[11.5px] leading-snug font-medium text-ink-soft">
            {o.owned.length ? `${missing.map(titleIn).join(" · ")} 더하기` : SETS[s].products.map(titleIn).join(" · ")}
            {o.bonus ? ` · 질문 ${o.bonus}개` : ""}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="flex items-baseline justify-end gap-1.5">
            {off > 0 && !o.owned.length && <span className="font-sans text-[13px] font-extrabold text-[#e0452b]">{off}%</span>}
            <span className="font-myeongjo text-[18px]">{o.owned.length ? `+${won(o.price)}` : won(o.price)}</span>
          </span>
          <s className="block font-sans text-[11.5px] font-medium text-ink-soft/80">{won(o.regular)}</s>
        </span>
      </span>
    );
    return (
      <div key={s}>
        <PayButton secondary request={{ set: s, p: request.p, from: product.id }} label={label} />
        {o.owned.length > 0 && (
          <p className="mt-1 text-[11px] text-ink-soft">
            {josa(o.owned.map(titleIn).join(" · "), "은/는")} 이미 있어서 {won(o.credit)} 빼 드려요
          </p>
        )}
      </div>
    );
  };
  return (
    <section id="report-start" className="doc-paper mt-6 scroll-mt-4 px-5 pt-6 pb-6">
      <h2 className="text-center font-myeongjo text-lg font-extrabold">{heading}</h2>
      <p className="mt-1 text-center text-xs text-ink-soft">{sub}</p>
      <ol className="mt-4 flex flex-col divide-y divide-seal/15 border-y-[3px] border-double border-seal/40 px-1">
        {chapters.map((item, i) => (
          <li key={item} className="flex items-center gap-2 py-2 text-left text-[15px]">
            <span className="w-9 shrink-0 font-myeongjo font-extrabold whitespace-nowrap text-seal">{hanjaNum(i + 1)}</span>
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
        {bonus > 0 && <p className="mt-1 text-[12.5px] font-bold text-[#9a7424]">정 훈도 질문 {bonus}개 포함</p>}
        {note && <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-left text-[12px] leading-relaxed">{note}</p>}
        {/* 시안: what is being bought, for how much, and what happens next, right above the button (half of those who
            opened the payment window left it). */}
        {(await isPreview()) && (
          <dl className="mt-4 grid grid-cols-[4.2rem_1fr] gap-x-2 gap-y-1.5 rounded-xl border border-seal/25 bg-white/60 px-3.5 py-3 text-left text-[12.5px] leading-snug">
            <dt className="font-bold text-ink-soft">무엇을</dt>
            <dd>
              <b>{product.title}</b> · {chapters.length}장 보고서{request.p ? " (지금 넣은 사주로)" : ""}
            </dd>
            <dt className="font-bold text-ink-soft">얼마에</dt>
            <dd>
              <b>{price.toLocaleString("ko-KR")}원</b>
              {bonus > 0 ? ` · 정 훈도 질문 ${bonus}개 포함` : ""} · 한 번 결제, 추가 요금 없음
            </dd>
            <dt className="font-bold text-ink-soft">결제 뒤</dt>
            <dd>이 화면으로 돌아와 바로 써 드려요(1~2분)</dd>
            <dt className="font-bold text-ink-soft">보관</dt>
            <dd>
              {membersEnabled() && (await currentMember().catch(() => null))
                ? "로그인돼 있어 계정에 보관돼요 · 어느 기기에서든 열려요"
                : "결제 후 받는 링크로 언제든 다시 열려요 · 카카오로 로그인하면 어느 기기에서든"}
            </dd>
            <dt className="font-bold text-ink-soft">결제창</dt>
            <dd>토스페이먼츠 결제창으로 넘어가요</dd>
          </dl>
        )}
        {payEnabled() ? (
          <>
            <PayButton request={request} label={`${price.toLocaleString("ko-KR")}원 결제하고 보기`} />
            {front.map(setButton)}
            {folded.length > 0 && (
              <details className="mt-3 text-left">
                <summary className="cursor-pointer text-center text-[12px] font-bold text-ink-soft">다른 세트 보기 ▾</summary>
                {folded.map(setButton)}
              </details>
            )}
          </>
        ) : (
          <button type="button" disabled className="mt-4 w-full rounded-2xl bg-seal/60 py-4 font-myeongjo text-lg font-extrabold text-hanji">
            결제 준비 중이에요
          </button>
        )}
        <p className="mt-2 text-[11px] text-ink-soft">결제하면 바로 열려요 · 링크로 언제든 다시 볼 수 있어요</p>
      </div>
      <p className="mt-4 text-left text-[11px] leading-relaxed text-ink-soft">
        보고서는 결제 즉시 열리는 디지털 콘텐츠라, 열람을 시작한 뒤에는 전자상거래법에 따라 청약철회가 제한돼요. 결제 전에 위의 목차와 풀이로 내용을 확인해
        주세요. 보고서가 안내한 내용과 다르게 제공된 경우에는 받은 날부터 3개월 이내에 환불을 요청할 수 있어요. 자세한 내용은{" "}
        <Link href="/refund" className="whitespace-nowrap underline">
          환불 규정
        </Link>
        을 확인해 주세요.
      </p>
    </section>
  );
}

// 시안: a slim bar at the top of a long free page, straight to the report's contents and price (the life report's
// payment sat eight screens down).
export async function JumpToPay({ product, request, chapters }: { product: Product; request: Record<string, string>; chapters: number }) {
  if (!(await isPreview())) return null;
  const price = priceFor(product.id, await pricingNow(), request.y, newYearOf());
  return (
    <a href="#report-start" className="mt-3 flex items-center gap-3 rounded-2xl bg-seal px-4 py-3 text-hanji shadow-[0_4px_0_#7d1a14]">
      <span className="min-w-0 flex-1">
        <b className="block font-myeongjo text-[15px]">{product.title} 보고서 바로 보기</b>
        <span className="block text-[11.5px] opacity-85">
          {chapters}장 · {price.toLocaleString("ko-KR")}원 · 아래 무료 풀이는 그대로 볼 수 있어요
        </span>
      </span>
      <span className="shrink-0 text-lg font-bold" aria-hidden="true">
        ↓
      </span>
    </a>
  );
}
