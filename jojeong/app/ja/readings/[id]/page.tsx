import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JA_CHECKOUT_OPEN, JA_FAQ, JA_READINGS, jaReading } from "@/lib/ja/catalog";

export function generateStaticParams() {
  return JA_READINGS.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: PageProps<"/ja/readings/[id]">): Promise<Metadata> {
  const r = jaReading((await params).id);
  if (!r) return {};
  return { title: r.title, description: r.tagline, alternates: { canonical: `/ja/readings/${r.id}`, languages: { en: `/en/readings/${r.id}`, ja: `/ja/readings/${r.id}` } } };
}

// ひとつの鑑定のページ。決済は海外カードの契約のあと(JA_CHECKOUT_OPEN)。
export default async function JaReadingPage({ params }: PageProps<"/ja/readings/[id]">) {
  const r = jaReading((await params).id);
  if (!r) notFound();
  const steps = [
    ["生年月日を入力", r.pair ? "ふたりの生年月日と、わかれば生まれた時間。" : "生年月日と、わかれば生まれた時間。"],
    ["訓導が命式を読む", "8つの文字と五行を出し、あなたのための鑑定を書きます。"],
    ["画面で読む", "すぐに日本語で開き、同じリンクでいつでも読み返せます。"],
  ];
  return (
    <>
      <section className="mt-6 rounded-2xl bg-[#0f2236] px-5 pt-5 pb-6 text-hanji shadow-[0_8px_24px_rgb(15_34_54/0.3)]">
        <p className="text-[13px] text-hanji/70">{r.korean}</p>
        <h1 className="mt-1 font-myeongjo text-[28px] leading-tight font-extrabold">{r.title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-hanji/85">{r.tagline}</p>
        <p className="mt-4 font-myeongjo text-[18px] font-extrabold text-[#d9b465]">{r.free ? "無料" : "近日公開"}</p>
      </section>

      <p className="mt-5 text-[15px] leading-relaxed">{r.forWhom}</p>

      <section className="mt-6">
        <h2 className="font-myeongjo text-[20px] font-extrabold">目次</h2>
        <ol className="mt-3 flex flex-col gap-1.5">
          {r.toc.map((t, i) => (
            <li key={t} className="flex gap-3 rounded-lg bg-white/60 px-3 py-2.5 text-[15px] shadow-[inset_0_0_0_1px_rgb(33_27_23/0.06)]">
              <span className="w-5 shrink-0 text-right font-myeongjo font-extrabold text-seal">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6">
        <h2 className="font-myeongjo text-[20px] font-extrabold">鑑定の流れ</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {steps.map(([t, d], i) => (
            <li key={t} className="text-[15px] leading-relaxed">
              <b className="font-myeongjo">
                {i + 1}. {t}。
              </b>
              <span className="text-ink-soft">{d}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="sticky bottom-4 z-10 mt-8">
        {JA_CHECKOUT_OPEN ? null : (
          <span className="flex h-13 flex-col items-center justify-center rounded-xl bg-ink/80 text-hanji">
            <span className="font-myeongjo text-[16px] font-extrabold">近日公開</span>
            <span className="text-[12px] text-hanji/75">日本語の鑑定とお支払いを準備しています</span>
          </span>
        )}
      </div>

      <section className="mt-8">
        <h2 className="font-myeongjo text-[20px] font-extrabold">よくある質問</h2>
        <div className="mt-3 flex flex-col gap-2">
          {JA_FAQ.map((f) => (
            <details key={f.q} className="group rounded-xl bg-white/60 px-4 py-3 shadow-[inset_0_0_0_1px_rgb(33_27_23/0.08)]">
              <summary className="cursor-pointer list-none font-myeongjo text-[15px] font-bold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="float-right text-ink-soft transition group-open:rotate-180">▾</span>
              </summary>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="mt-8 text-center text-[14px]">
        <Link href="/ja" className="font-bold text-seal underline-offset-2 hover:underline">
          ← 鑑定メニューへ
        </Link>
      </p>
    </>
  );
}
