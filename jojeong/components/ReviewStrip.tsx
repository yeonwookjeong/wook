import { productById, type ProductId } from "@/lib/products";
import { publicReviews, type PublicReview } from "@/lib/feedback";

// 후기 (2026-11-17 대표님, 사주아이를 참고로): the reviews the owner put on the site, as letters on hanji that drift
// sideways. On the home page it sits under how many charts have been read (the large number, as 사주아이 does);
// on a report, just above the price, with that report's own reviews when there are three. Hidden until three are
// public. A review that brought a question says so (lib/feedback.ts).
const MIN = 3;

function Letter({ r }: { r: PublicReview }) {
  const m = new Date(r.at + 9 * 3600000).getUTCMonth() + 1;
  const title = productById(r.product)?.title.split(", ")[0] ?? "보고서";
  return (
    <figure className="relative flex w-[248px] shrink-0 flex-col rounded-[14px] bg-[#fffaf0] px-4 pt-3.5 pb-3 text-left shadow-[0_1px_0_rgb(134_96_26/0.25),0_6px_16px_rgb(33_27_23/0.07),inset_0_0_0_1px_rgb(134_96_26/0.18)]">
      <span aria-hidden className="font-myeongjo text-[30px] leading-[0.7] text-gold/50">&ldquo;</span>
      <blockquote className="mt-1 line-clamp-4 min-h-[5.6em] font-myeongjo text-[14px] leading-[1.45] font-bold whitespace-normal text-ink">{r.text}</blockquote>
      <figcaption className="mt-3 flex items-center gap-1.5 border-t border-dashed border-gold/25 pt-2.5 text-[11px] text-ink-soft">
        <span className="rounded-full bg-[#1d2a3a] px-2 py-0.5 font-bold text-[#f3e3b8]">{title}</span>
        <span>{m}월</span>
        {r.rewarded && <span className="ml-auto text-[10px] text-ink-soft/80">질문권 받고 남긴 후기</span>}
      </figcaption>
    </figure>
  );
}

function Row({ list, reverse }: { list: PublicReview[]; reverse?: boolean }) {
  // The list twice in a row, moved by half its width: an endless line with no seam, faded at both edges.
  const sec = Math.max(36, list.length * 9);
  return (
    <div className="review-row w-full min-w-0 overflow-hidden py-1 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className={`review-track flex w-max gap-3 px-1.5 ${reverse ? "review-reverse" : ""}`} style={{ animationDuration: `${sec}s` }}>
        {[...list, ...list].map((r, i) => (
          <Letter key={`${r.key}-${i}`} r={r} />
        ))}
      </div>
    </div>
  );
}

export default async function ReviewStrip({ product, count, className = "" }: { product?: ProductId; count?: number; className?: string }) {
  const all = await publicReviews();
  const own = product ? all.filter((r) => r.product === product) : [];
  const list = own.length >= MIN ? own : all;
  if (list.length < MIN)
    // Too few yet: on the home page the plain count line stays as it was.
    return count !== undefined ? (
      <p className={`flex items-center justify-center gap-2 text-[13px] text-ink-soft ${className}`}>
        <span aria-hidden className="h-px w-6 bg-gold/40" />
        지금까지 <b className="font-myeongjo text-[17px] text-gold">{count.toLocaleString("ko-KR")}</b>건의 사주를 풀어 드렸어요
        <span aria-hidden className="h-px w-6 bg-gold/40" />
      </p>
    ) : null;
  const two = !product && list.length >= 8;
  const half = Math.ceil(list.length / 2);
  return (
    <section aria-label="손님 후기" className={`min-w-0 overflow-hidden ${className}`}>
      {count !== undefined ? (
        <div className="text-center">
          <p className="font-myeongjo text-[12px] font-extrabold tracking-[0.35em] text-gold">訓導가 읽어 드린 사주</p>
          <p className="mt-1 font-myeongjo text-[42px] leading-none font-extrabold tracking-tight text-ink">
            {count.toLocaleString("ko-KR")}
            <span className="ml-1 text-[18px] text-ink-soft">건</span>
          </p>
          <p className="mt-2 text-[13px] text-ink-soft">먼저 받아 본 분들이 남긴 이야기</p>
        </div>
      ) : (
        <p className="text-center font-myeongjo text-[14px] font-extrabold">
          {own.length >= MIN ? "이 보고서를 먼저 받아 본 분들" : "보고서를 먼저 받아 본 분들"}
          <span className="ml-1.5 text-gold">{list.length}</span>
        </p>
      )}
      <div className="mt-4 flex flex-col gap-3">
        <Row list={two ? list.slice(0, half) : list} />
        {two && <Row list={list.slice(half)} reverse />}
      </div>
    </section>
  );
}
