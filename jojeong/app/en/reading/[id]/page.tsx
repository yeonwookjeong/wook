import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReadingForm from "@/components/en/ReadingForm";
import { enReadingById, usd } from "@/lib/en/readings";
import { getReportText } from "@/lib/store";

export async function generateMetadata({ params }: PageProps<"/en/reading/[id]">): Promise<Metadata> {
  const r = enReadingById((await params).id);
  return r ? { title: r.title, description: r.tagline } : {};
}

// One English reading: what it is, what it covers, a free preview from the birth form, and a sample.
export default async function ReadingPage({ params }: PageProps<"/en/reading/[id]">) {
  const r = enReadingById((await params).id);
  if (!r) notFound();
  const sample = await getReportText(`en-sample:${r.id}`).catch(() => null);
  return (
    <div className="flex flex-col gap-7 pt-6">
      <section className="flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-lg border-2 border-seal/60 font-myeongjo text-[24px] text-seal">{r.hanja}</span>
        <h1 className="mt-3 font-myeongjo text-[26px] leading-tight font-extrabold">{r.title}</h1>
        <p className="mt-2 max-w-[340px] text-[14.5px] leading-relaxed text-ink-soft">{r.tagline}</p>
      </section>

      <ReadingForm id={r.id} people={r.people} cta="See my free preview" />

      <section className="flex flex-col gap-2">
        <h2 className="font-myeongjo text-[18px] font-extrabold">The full reading, {usd(r.price)}</h2>
        <p className="text-[14px] leading-relaxed">{r.teaser}</p>
        <ol className="mt-1 flex flex-col gap-1 text-[14px] leading-relaxed">
          {r.chapters.map((c, i) => (
            <li key={c} className="flex gap-2">
              <span className="w-5 shrink-0 text-right text-ink-soft">{i + 1}.</span>
              <span>{c}</span>
            </li>
          ))}
        </ol>
        {sample && (
          <Link href={`/en/reading/${r.id}/sample`} className="mt-2 font-bold text-seal underline underline-offset-2">
            Read a sample reading
          </Link>
        )}
      </section>
    </div>
  );
}
