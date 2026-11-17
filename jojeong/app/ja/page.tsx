import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { intlColumns } from "@/lib/intl/columns";
import { JA_FAQ, JA_READINGS } from "@/lib/ja/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "訓導サジュ · 韓国の四柱推命をやさしい日本語で" },
  description:
    "韓国の四柱推命「サジュ」を、朝鮮王朝の観象監の学者・訓導がやさしい日本語で。朝鮮時代のあなた、一生の鑑定、相性(宮合)、恋愛、金運、仕事、1年の運勢。",
  alternates: { canonical: "/ja", languages: { ko: "/", en: "/en", ja: "/ja" } },
};

// 日本語のホーム (2026-11-16): 韓国語サイトと同じ棚。鑑定は近日公開、コラムは今日から読める。
export default function JaHome() {
  const free = JA_READINGS.filter((r) => r.free);
  const paid = JA_READINGS.filter((r) => !r.free);
  const cols = intlColumns("ja").slice(0, 3);
  return (
    <>
      <section className="-mx-4 mt-4">
        <Image src="/king/hero.webp" alt="夕暮れの景福宮・勤政殿" width={1080} height={780} priority className="block h-auto w-full" />
      </section>

      <header className="relative -mt-10 rounded-2xl bg-[#0f2236] px-5 pt-5 pb-6 text-hanji shadow-[0_8px_24px_rgb(15_34_54/0.3)]">
        <p className="font-myeongjo text-[12px] font-bold tracking-[0.15em] text-[#d9b465]">SAJU · 四柱 · 韓国の四柱推命</p>
        <h1 className="mt-2 font-myeongjo text-[27px] leading-tight font-extrabold">生まれた瞬間から、あなたの人生を読む</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-hanji/85">
          韓国では何百年も、生まれた日の8つの文字から人生を読んできました。朝鮮王朝の観象監の学者・訓導が、あなたのサジュをやさしい日本語で読み解きます。
        </p>
        <Link href="/ja/column" className="mt-5 flex h-12 items-center justify-center rounded-xl bg-[#d9b465] font-myeongjo text-[16px] font-extrabold text-[#0f2236]">
          まずはコラムでサジュを知る
        </Link>
      </header>

      <section className="mt-8">
        <h2 className="font-myeongjo text-[22px] font-extrabold">サジュのしくみ</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {[
            ["4つの柱", "生まれた年、月、日、時間を、それぞれ2つの漢字で書きます。合わせて8文字。"],
            ["五行", "8つの文字はそれぞれ木、火、土、金、水のどれか。そのバランスが気質をあらわします。"],
            ["時の流れ", "毎年、10年ごとの気があなたの命式と出会う。それがサジュで読む人生のタイミングです。"],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3 rounded-xl bg-white/60 px-4 py-3 shadow-[inset_0_0_0_1px_rgb(33_27_23/0.08)]">
              <span className="font-myeongjo text-[18px] font-extrabold text-seal">{i + 1}</span>
              <p className="text-[15px] leading-relaxed">
                <b className="font-myeongjo">{t}。</b>
                {d}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {cols.length > 0 && (
        <section className="mt-8">
          <h2 className="font-myeongjo text-[22px] font-extrabold">四柱推命コラム</h2>
          <div className="mt-3 flex flex-col gap-3">
            {cols.map((c) => (
              <Link key={c.slug} href={`/ja/column/${c.slug}`} className="block rounded-2xl bg-white/70 px-4 py-4 shadow-[inset_0_0_0_1px_rgb(33_27_23/0.1)]">
                <p className="font-myeongjo text-[17px] leading-snug font-extrabold">{c.title}</p>
                <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-ink-soft">{c.summary}</p>
              </Link>
            ))}
            <Link href="/ja/column" className="text-center text-[14px] font-bold text-seal">
              コラムをすべて見る →
            </Link>
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-myeongjo text-[22px] font-extrabold">鑑定メニュー</h2>
        <p className="mt-1 text-[14px] text-ink-soft">韓国で hundosaju.com を利用されている方と同じ鑑定を、日本語で。まもなく公開します。</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[...free, ...paid].map((r) => (
            <Link key={r.id} href={`/ja/readings/${r.id}`} className="flex flex-col rounded-2xl bg-[#0f2236] px-4 py-4 text-hanji">
              <p className="text-[12px] text-hanji/70">{r.korean}</p>
              <p className="mt-1 font-myeongjo text-[17px] leading-snug font-extrabold">{r.title}</p>
              <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-hanji/80">{r.tagline}</p>
              <p className="mt-auto pt-3 text-[13px] font-bold text-[#d9b465]">{r.free ? "無料 · 近日公開" : `全${r.toc.length}章 · 近日公開`}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-myeongjo text-[22px] font-extrabold">よくある質問</h2>
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
    </>
  );
}
