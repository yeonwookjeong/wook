import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { decodePerson, type Person } from "@/lib/pairToken";
import { dayMaster, dayMeeting, elementCounts, ELEMENTS_EN, ANIMALS_EN } from "@/lib/en/chart";
import { enReadingById, usd } from "@/lib/en/readings";
import { getReportText } from "@/lib/store";
import FreeEn from "@/components/en/FreeEn";
import { isFull } from "@/lib/saju";
import { enFreeOf } from "@/lib/en/free";

export const metadata: Metadata = { title: "Your free preview" };

// The free preview of an English reading: worked out from the chart alone (no AI), then the full reading's
// contents and its price. The person tokens carry the chart, never the birth date.

function Elements({ p }: { p: Person }) {
  const { counts, known } = elementCounts(p.pillars);
  const max = Math.max(...counts, 1);
  const missing = counts.flatMap((c, i) => (c === 0 ? [ELEMENTS_EN[i]] : []));
  return (
    <div className="flex flex-col gap-1.5">
      {counts.map((c, i) => (
        <div key={i} className="flex items-center gap-2 text-[13px]">
          <span className="w-12 shrink-0">{ELEMENTS_EN[i]}</span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/10">
            <span className="block h-full rounded-full bg-seal/70" style={{ width: `${(c / max) * 100}%` }} />
          </span>
          <span className="w-4 text-right text-ink-soft">{c}</span>
        </div>
      ))}
      <p className="mt-1 text-[12.5px] text-ink-soft">
        Counted over the {known} characters we can see{known < 8 ? " (no birth time, so six)" : ""}.
        {missing.length > 0 ? ` Missing: ${missing.join(" and ")}. What a chart lacks often shapes it as much as what it has.` : " All five are present."}
      </p>
    </div>
  );
}

function Card({ p }: { p: Person }) {
  const dm = dayMaster(p.pillars);
  return (
    <section className="doc-paper flex flex-col gap-4 px-5 py-6">
      <div className="text-center">
        <p className="text-[11px] font-bold tracking-[0.2em] text-gold">{p.name.toUpperCase()}&apos;S DAY MASTER</p>
        <p className="mt-2 font-myeongjo text-[44px] leading-none text-seal">{dm.hanja}</p>
        <p className="mt-2 font-myeongjo text-[20px] font-extrabold">
          {dm.name} <span className="text-[14px] font-normal text-ink-soft">({dm.yin ? "yin" : "yang"})</span>
        </p>
        <p className="mt-2 text-[14.5px] leading-relaxed">You were born as {dm.image}.</p>
        <p className="mt-1 text-[12.5px] text-ink-soft">Born on a {ANIMALS_EN[p.pillars.dayBranch]} day.</p>
      </div>
      <Elements p={p} />
    </section>
  );
}

export default async function Preview({ params, searchParams }: PageProps<"/en/reading/[id]/preview">) {
  const r = enReadingById((await params).id);
  if (!r) notFound();
  const sp = await searchParams;
  const a = decodePerson(typeof sp.a === "string" ? sp.a : undefined);
  const b = r.people === 2 ? decodePerson(typeof sp.b === "string" ? sp.b : undefined) : null;
  if (!a || (r.people === 2 && !b)) {
    return (
      <div className="flex flex-col items-center gap-4 pt-16 text-center">
        <p className="text-[15px]">That link didn&apos;t come through. Please fill in the form again.</p>
        <Link href={`/en/reading/${r.id}`} className="rounded-full bg-seal px-5 py-3 font-myeongjo font-extrabold text-hanji">
          Back to the form
        </Link>
      </div>
    );
  }
  const meet = b ? dayMeeting(a.pillars, b.pillars) : null;
  // One person: the whole Korean free screen, in English (lib/en/free.ts).
  const free = !b ? enFreeOf(a) : null;
  const sample = await getReportText(`en-sample:${r.id}`).catch(() => null);

  return (
    <div className="flex flex-col gap-6 pt-6">
      <p className="text-center text-[13px] text-ink-soft">{r.title}, free preview</p>
      <Card p={a} />
      {free && isFull(a.pillars) && <FreeEn name={a.name} pillars={a.pillars} r={free} />}
      {b && <Card p={b} />}
      {meet && (
        <section className="doc-paper px-5 py-5 text-center">
          <p className="text-[11px] font-bold tracking-[0.2em] text-gold">HOW YOUR DAYS MEET</p>
          <p className="mt-2 font-myeongjo text-[22px] font-extrabold">{meet.title}</p>
          <p className="mt-2 text-[14.5px] leading-relaxed">{meet.line}</p>
        </section>
      )}

      <section className="rounded-2xl border-2 border-seal/30 bg-white/60 px-5 py-5">
        <p className="text-[11px] font-bold tracking-[0.15em] text-seal">THE FULL READING</p>
        <h2 className="mt-1 font-myeongjo text-[19px] font-extrabold">{r.title}</h2>
        <p className="mt-2 text-[14px] leading-relaxed">{r.teaser}</p>
        <ol className="mt-3 flex flex-col gap-1 text-[13.5px] leading-relaxed">
          {r.chapters.map((c, i) => (
            <li key={c}>
              {i + 1}. {c}
            </li>
          ))}
        </ol>
        <button disabled className="mt-4 w-full rounded-full bg-seal/60 py-3.5 font-myeongjo text-[16px] font-extrabold text-hanji">
          Opening soon, {usd(r.price)}
        </button>
        {sample && (
          <Link href={`/en/reading/${r.id}/sample`} className="mt-3 block text-center text-[14px] font-bold text-seal underline underline-offset-2">
            Read a sample reading
          </Link>
        )}
      </section>

      <div className="flex flex-col items-center gap-2 text-[14px]">
        <Link href="/en" className="text-ink-soft underline underline-offset-2">
          All readings
        </Link>
      </div>
    </div>
  );
}
