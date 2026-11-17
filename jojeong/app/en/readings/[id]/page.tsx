import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EN_CHECKOUT_OPEN, EN_FAQ, EN_READINGS, enReading, priceLabel } from "@/lib/en/catalog";

export function generateStaticParams() {
  return EN_READINGS.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: PageProps<"/en/readings/[id]">): Promise<Metadata> {
  const r = enReading((await params).id);
  if (!r) return {};
  return { title: r.title, description: r.tagline };
}

// One reading's page: what it is, what is inside, what we need, the price, and the newcomer's questions.
// Checkout stays closed until overseas cards and PayPal are contracted (EN_CHECKOUT_OPEN).
export default async function EnReadingPage({ params }: PageProps<"/en/readings/[id]">) {
  const r = enReading((await params).id);
  if (!r) notFound();
  const steps = [
    ["Your birth details", r.pair ? "Both people's dates of birth, and the times if you know them." : "Your date of birth, and the time if you know it."],
    ["Hundo reads the chart", "Your eight characters and the five elements are worked out, then the reading is written for you."],
    ["Read it on screen", "It opens right away in English, and stays at the same link."],
  ];

  return (
    <>
      <section className="mt-6 rounded-2xl bg-[#0f2236] px-5 pt-5 pb-6 text-hanji shadow-[0_8px_24px_rgb(15_34_54/0.3)]">
        <p className="text-[13px] text-hanji/70">{r.korean}</p>
        <h1 className="mt-1 font-myeongjo text-[28px] leading-tight font-extrabold">{r.title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-hanji/85">{r.tagline}</p>
        <p className="mt-4 font-myeongjo text-[20px] font-extrabold text-[#d9b465]">{priceLabel(r.free)}</p>
      </section>

      <p className="mt-5 text-[15px] leading-relaxed">{r.forWhom}</p>

      <section className="mt-6">
        <h2 className="font-myeongjo text-[20px] font-extrabold">What&apos;s inside</h2>
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
        <h2 className="font-myeongjo text-[20px] font-extrabold">How it works</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {steps.map(([t, d], i) => (
            <li key={t} className="text-[15px] leading-relaxed">
              <b className="font-myeongjo">
                {i + 1}. {t}.
              </b>{" "}
              <span className="text-ink-soft">{d}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="sticky bottom-4 z-10 mt-8">
        {EN_CHECKOUT_OPEN ? null : (
          // Inert until the English birth form and checkout are in (overseas cards and PayPal are being contracted).
          <span className="flex h-13 flex-col items-center justify-center rounded-xl bg-ink/80 text-hanji">
            <span className="font-myeongjo text-[16px] font-extrabold">Opening soon · {priceLabel(r.free)}</span>
            <span className="text-[12px] text-hanji/75">{r.free ? "The English version opens with the full readings" : "International cards and PayPal are being set up"}</span>
          </span>
        )}
      </div>

      <section className="mt-8">
        <h2 className="font-myeongjo text-[20px] font-extrabold">Questions</h2>
        <div className="mt-3 flex flex-col gap-2">
          {EN_FAQ.map((f) => (
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
        <Link href="/en" className="font-bold text-seal underline-offset-2 hover:underline">
          ← All readings
        </Link>
      </p>
    </>
  );
}
