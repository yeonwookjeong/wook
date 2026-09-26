import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import RoyalDoc from "@/components/RoyalDoc";
import { MINISTER_COOKIE, OWNER_COOKIE, PURCHASES_COOKIE } from "@/lib/cookies";
import { ownedCourts } from "@/lib/load";
import { PRICE_STEPS, priceFor, productById, type Product } from "@/lib/products";
import type { Pillars } from "@/lib/saju";
import { getCourt, listMinisters } from "@/lib/store";
import { yearPreview } from "@/lib/yearly";
import Keep from "@/components/Keep";

export async function generateMetadata({ params }: PageProps<"/reports/[id]">): Promise<Metadata> {
  const product = productById((await params).id);
  return product ? { title: product.title, description: product.tagline } : {};
}

// Whose chart the preview is read from: a court (and minister) named in the link if this browser belongs to
// it, otherwise the first court this browser enthroned.
async function subjectFor(product: Product, courtId?: string, ministerId?: string) {
  const jar = await cookies();
  if (courtId) {
    const court = await getCourt(courtId);
    if (court) {
      const mid = ministerId ?? jar.get(MINISTER_COOKIE(court.id))?.value;
      if (product.for !== "king" && mid) {
        const minister = (await listMinisters(court.id)).find((m) => m.id === mid);
        if (minister) return { name: minister.name, pillars: minister.pillars as Pillars };
      }
      if (product.for !== "minister" && jar.get(OWNER_COOKIE(court.id))?.value === court.ownerToken)
        return { name: court.kingName, pillars: court.king };
    }
  }
  if (product.for === "minister") return null;
  const [court] = await ownedCourts(1);
  return court ? { name: court.kingName, pillars: court.king } : null;
}

export default async function ReportPage({ params, searchParams }: PageProps<"/reports/[id]">) {
  const product = productById((await params).id);
  if (!product) notFound();
  const query = await searchParams;
  const courtId = typeof query.court === "string" ? query.court : undefined;
  const ministerId = typeof query.m === "string" ? query.m : undefined;
  const subject = await subjectFor(product, courtId, ministerId);
  const bought = Number((await cookies()).get(PURCHASES_COOKIE)?.value ?? 0);
  const price = priceFor(bought);
  const year = product.id === "gukjeong" && subject ? yearPreview(subject.pillars) : null;

  return (
    <>
      <nav className="pt-4 text-sm">
        <Link href="/reports" className="font-bold text-ink-soft">
          ← 비밀 보고서 목록
        </Link>
      </nav>

      <RoyalDoc className="mt-3" paperClassName="px-5">
        <p className="text-center font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">{product.hanja}</p>
        <h1 className="mt-2 text-center font-myeongjo text-2xl font-extrabold">{product.title}</h1>
        <p className="mt-2 text-center text-sm leading-snug text-ink-soft">
          <Keep clauses>{product.tagline}</Keep>
        </p>
        {subject && <p className="mt-3 text-center text-xs font-bold text-gold">{subject.name} 님의 사주로 지어 올리옵니다</p>}

        <ol className="mt-5 flex flex-col divide-y divide-seal/15 border-y-[3px] border-double border-seal/40 px-1">
          {product.toc.map((item, i) => (
            <li key={item} className="flex items-center gap-2 py-2 text-[15px]">
              <span className="font-myeongjo font-extrabold text-seal">{"一二三四五六"[i]}</span>
              <span className="flex-1">{item}</span>
              <span className="text-xs text-ink-soft">{i === 0 ? "맛보기" : "🔒"}</span>
            </li>
          ))}
        </ol>

        {/* 맛보기: the first chapter, free */}
        <div className="mt-5 border-l-[3px] border-seal/60 py-1 pl-3">
          <p className="text-xs font-extrabold text-seal">제一장 맛보기 · {product.toc[0]}</p>
          {year ? (
            <>
              <p className="mt-2 font-myeongjo text-lg font-extrabold">
                병오년 운세 <span className="text-seal">{year.verdict}</span>
              </p>
              <p className="mt-1.5 text-[15px] leading-relaxed">{year.lead}</p>
              <p className="mt-1.5 text-[15px] leading-relaxed">{year.text}</p>
              {year.full && (
                <p className="mt-2 text-[15px] leading-relaxed">
                  열두 달 가운데 <b className="whitespace-nowrap text-seal">좋은 달이 {year.good}번</b>,{" "}
                  <b className="whitespace-nowrap text-seal">조심할 달이 {year.bad}번</b> 보이옵니다. 어느 달인지는 보고서에 적어 올리옵니다.
                </p>
              )}
            </>
          ) : (
            <p className="mt-2 text-[15px] leading-relaxed">{product.teaser}</p>
          )}
        </div>

        {!subject && (
          <p className="mt-4 bg-seal/5 px-4 py-3 text-center text-sm leading-relaxed">
            {product.for === "minister"
              ? "전하의 조정에 입궐한 신하만 볼 수 있는 보고서이옵니다. 받으신 교지에서 이 보고서를 여시옵소서."
              : "먼저 즉위하시면 전하의 사주로 맛보기를 지어 올리옵니다."}
            {product.for !== "minister" && (
              <Link href="/#enthrone" className="mt-2 block font-myeongjo font-extrabold text-seal">
                즉위하러 가기 →
              </Link>
            )}
          </p>
        )}

        {/* The rest stays locked until payment; placeholder lines only, so nothing paid is in the page source. */}
        <div className="relative mt-5 overflow-hidden" aria-hidden="true">
          <div className="flex flex-col gap-2 blur-[5px] select-none">
            {[92, 80, 88, 70, 85, 60].map((w, i) => (
              <span key={i} className="h-3.5 rounded bg-ink/15" style={{ width: `${w}%` }} />
            ))}
          </div>
          <span className="absolute inset-0 flex items-center justify-center font-myeongjo text-sm font-extrabold text-seal">
            🔒 나머지 {product.toc.length - 1}장은 복채를 주시면 열리옵니다
          </span>
        </div>

        <div className="mt-6 border-t border-seal/20 pt-5 text-center">
          <p className="font-myeongjo text-3xl font-extrabold text-seal">{price.toLocaleString("ko-KR")}원</p>
          <p className="mt-1 text-xs text-ink-soft">
            <span className="inline-block">복채 단골 할인 ·</span>{" "}
            <span className="inline-block">살 때마다 100원씩 내려가 {PRICE_STEPS[PRICE_STEPS.length - 1]}원까지</span>
          </p>
          <button
            type="button"
            disabled
            className="mt-4 w-full rounded-2xl bg-seal/60 py-4 font-myeongjo text-lg font-extrabold text-hanji"
          >
            결제 준비 중 · 곧 열리옵니다
          </button>
          <p className="mt-3 text-left text-[11px] leading-relaxed text-ink-soft">
            보고서는 결제 즉시 열리는 디지털 콘텐츠라, 열람을 시작한 뒤에는 전자상거래법에 따라 청약철회가 제한되옵니다.
            결제 전 위의 목차와 맛보기로 내용을 확인해 주시옵소서. 보고서가 안내한 내용과 다르게 제공된 경우에는 받은 날부터
            3개월 이내에 환불을 요청하실 수 있사옵니다. 자세한 내용은{" "}
            <Link href="/refund" className="whitespace-nowrap underline">
              환불 규정
            </Link>
            을 보시옵소서.
          </p>
        </div>
      </RoyalDoc>
    </>
  );
}
