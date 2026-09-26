import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import Hundo from "@/components/Hundo";
import { PURCHASES_COOKIE } from "@/lib/cookies";
import { PRICE_STEPS, priceFor, PRODUCTS } from "@/lib/products";
import Keep from "@/components/Keep";

export const metadata: Metadata = { title: "정 훈도의 비밀 보고서" };

const FOR_LABEL = { king: "전하용", minister: "신하용", anyone: "누구나" } as const;

export default async function ReportsPage() {
  const bought = Number((await cookies()).get(PURCHASES_COOKIE)?.value ?? 0);
  const price = priceFor(bought);

  return (
    <>
      <section className="mt-6 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">秘 密 報 告</p>
        <h1 className="mt-2 font-myeongjo text-3xl font-extrabold">정 훈도의 비밀 보고서</h1>
        <p className="mt-2 text-[15px] leading-relaxed">
          조선 최고의 사주쟁이가{" "}
          <span className="inline-block">
            봐 드리는 <b>지금 그대의 운명</b>
          </span>
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          <span className="inline-block">신분 감정과 2026 운세는 무료,</span>{" "}
          <span className="inline-block">
            지금의 운세는 복채 한 닢 <b className="text-ink">{price.toLocaleString("ko-KR")}원</b>
          </span>
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          <span className="inline-block">복채 단골 할인: 살 때마다 100원씩</span>{" "}
          <span className="inline-block">{PRICE_STEPS.map((p) => p.toLocaleString("ko-KR")).join(" → ")}원</span>
        </p>
      </section>

      <section className="mt-5">
        <Hundo mood="decree">
          조선의 왕실 사주를 봐 온 눈으로 이번에는 그대의 지금을 보아 드리옵니다. 첫 장은 누구나 먼저 읽어 보시고, 마음에
          드시면 그때 복채를 주시옵소서.
        </Hundo>
      </section>

      <ul className="mt-6 flex flex-col gap-3">
        {PRODUCTS.map((p) => (
          <li key={p.id}>
            <Link href={`/reports/${p.id}`} className="doc-paper flex items-center gap-4 px-5 py-5">
              <span className={`flex h-14 min-w-14 shrink-0 items-center justify-center border-2 border-seal/60 px-1 font-myeongjo font-extrabold text-seal ${p.hanja.length > 2 ? "text-sm" : "text-lg"}`}>
                {p.hanja}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-myeongjo text-lg leading-snug font-extrabold">{p.title}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-ink-soft">
                  <Keep clauses>{p.tagline}</Keep>
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="font-myeongjo font-extrabold text-seal">{p.free ? "무료" : `${price}원`}</span>
                <span className="border border-gold/60 px-1.5 text-[10px] font-bold whitespace-nowrap text-gold">{FOR_LABEL[p.for]}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
