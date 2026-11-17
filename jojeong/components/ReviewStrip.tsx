import { productById, type ProductId } from "@/lib/products";
import { publicReviews, type PublicReview } from "@/lib/feedback";

// 후기 띠 (2026-11-17 대표님, 사주아이처럼): the reviews the owner put on the site, flowing sideways. On a report,
// that report's own when it has three or more, else all of them; hidden until there are three. A review that
// brought a question is marked so (lib/feedback.ts).
const MIN = 3;

function Card({ r }: { r: PublicReview }) {
  const m = new Date(r.at + 9 * 3600000).getUTCMonth() + 1;
  return (
    <figure className="w-[260px] shrink-0 rounded-2xl bg-white px-4 py-3.5 text-left shadow-[inset_0_0_0_1px_rgb(33_27_23/0.1)]">
      <p className="text-[12px] font-bold text-seal">좋았어요</p>
      <blockquote className="mt-1 line-clamp-4 text-[13.5px] leading-relaxed whitespace-normal">{r.text}</blockquote>
      <figcaption className="mt-2 text-[11px] leading-snug text-ink-soft">
        {productById(r.product)?.title.split(", ")[0] ?? "보고서"} · {m}월{r.rewarded ? " · 질문권을 받고 남긴 후기" : ""}
      </figcaption>
    </figure>
  );
}

function Row({ list, reverse }: { list: PublicReview[]; reverse?: boolean }) {
  // The list twice in a row, moved by half its width: an endless line with no seam.
  const sec = Math.max(30, list.length * 7);
  return (
    <div className="review-row overflow-hidden">
      <div className={`review-track flex w-max gap-3 ${reverse ? "review-reverse" : ""}`} style={{ animationDuration: `${sec}s` }}>
        {[...list, ...list].map((r, i) => (
          <Card key={`${r.key}-${i}`} r={r} />
        ))}
      </div>
    </div>
  );
}

export default async function ReviewStrip({ product, className = "" }: { product?: ProductId; className?: string }) {
  const all = await publicReviews();
  const own = product ? all.filter((r) => r.product === product) : [];
  const list = own.length >= MIN ? own : all;
  if (list.length < MIN) return null;
  const two = list.length >= 8;
  const half = Math.ceil(list.length / 2);
  return (
    <section aria-label="손님 후기" className={className}>
      <p className="mb-2.5 text-center text-[13px] text-ink-soft">
        {own.length >= MIN ? "이 보고서를 받아 본 분들의 후기" : "보고서를 받아 본 분들의 후기"} <b className="text-seal">{list.length}</b>
      </p>
      <div className="flex flex-col gap-3">
        <Row list={two ? list.slice(0, half) : list} />
        {two && <Row list={list.slice(half)} reverse />}
      </div>
    </section>
  );
}
