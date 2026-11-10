import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { enReadingById, usd } from "@/lib/en/readings";
import { getReportText } from "@/lib/store";

export const metadata: Metadata = { title: "A sample reading" };

// A full English reading written for a sample person (app/api/en/sample), so a visitor sees exactly what they buy.
// The text is the writer's "## [question] headline" chapters and the closing "At a glance" rows.

type Chapter = { q: string; head: string; body: string[] };
function parse(text: string): Chapter[] {
  const out: Chapter[] = [];
  for (const line of text.split("\n")) {
    const m = /^##\s*\[([^\]]+)\]\s*(.*)$/.exec(line.trim());
    if (m) out.push({ q: m[1], head: m[2], body: [] });
    else if (out.length && line.trim()) out[out.length - 1].body.push(line.trim());
  }
  return out;
}

export default async function Sample({ params }: PageProps<"/en/reading/[id]/sample">) {
  const r = enReadingById((await params).id);
  if (!r) notFound();
  const text = await getReportText(`en-sample:${r.id}`).catch(() => null);
  if (!text) notFound();
  const chapters = parse(text);
  const glance = chapters.find((c) => c.q === "At a glance");
  return (
    <div className="flex flex-col gap-6 pt-6">
      <section className="text-center">
        <p className="text-[11px] font-bold tracking-[0.2em] text-gold">A SAMPLE READING</p>
        <h1 className="mt-2 font-myeongjo text-[26px] font-extrabold">{r.title}</h1>
        <p className="mt-2 text-[13.5px] text-ink-soft">
          Written for a sample person{r.people === 2 ? " and partner" : ""}, exactly as a paid reading is written.
        </p>
      </section>
      {glance && (
        <section className="doc-paper px-5 py-5">
          <p className="text-[11px] font-bold tracking-[0.15em] text-gold">AT A GLANCE</p>
          <p className="mt-1 font-myeongjo text-[18px] font-extrabold">{glance.head}</p>
          <ul className="mt-3 flex flex-col gap-2 text-[14px] leading-relaxed">
            {glance.body.map((l) => {
              const m = /^\[([^\]]+)\]\s*(.*)$/.exec(l);
              return (
                <li key={l}>
                  {m ? (
                    <>
                      <b>{m[1]}</b> {m[2]}
                    </>
                  ) : (
                    l
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {chapters
        .filter((c) => c !== glance)
        .map((c) => (
          <section key={c.q} className="flex flex-col gap-2">
            <p className="text-[12px] font-bold tracking-wide text-ink-soft">{c.q}</p>
            <h2 className="font-myeongjo text-[19px] leading-snug font-extrabold">{c.head}</h2>
            {c.body.map((p, i) => (
              <p key={i} className="text-[14.5px] leading-relaxed">
                {p}
              </p>
            ))}
          </section>
        ))}
      <Link href={`/en/reading/${r.id}`} className="mx-auto rounded-full bg-seal px-6 py-3 font-myeongjo font-extrabold text-hanji">
        Get my own, {usd(r.price)}
      </Link>
    </div>
  );
}
