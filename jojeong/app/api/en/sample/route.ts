import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { personToken } from "@/lib/en/person";
import { enReadingById } from "@/lib/en/readings";
import { jobFor, writeReport } from "@/lib/reportWriter";
import { setReportText } from "@/lib/store";

export const maxDuration = 300;

// The owner writes (or rewrites) the sample of one English reading: /api/en/sample?id=life|year|love, signed in
// as the owner. The sample people are invented; the text is shown on /en/reading/<id>/sample.
const EMILY = { name: "Emily", gender: "f", y: 1994, m: 4, d: 11, time: "14:30", city: "london" };
const JAMES = { name: "James", gender: "m", y: 1992, m: 9, d: 3, time: "08:15", city: "london" };

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "owner only" }, { status: 403 });
  const r = enReadingById(new URL(req.url).searchParams.get("id") ?? "");
  if (!r) return NextResponse.json({ error: "no such reading" }, { status: 404 });
  const a = personToken(EMILY, "Emily");
  const job =
    r.id === "love"
      ? await jobFor({ lang: "en", product: r.product, a, b: personToken(JAMES, "James"), rel: "lover" })
      : await jobFor({ lang: "en", product: r.product, p: a, ...(r.id === "year" ? { y: "2027" } : {}) });
  if ("error" in job) return NextResponse.json(job, { status: job.status });
  const text = await writeReport(job, () => {});
  if (!text) return NextResponse.json({ error: "the writing did not finish" }, { status: 502 });
  await setReportText(`en-sample:${r.id}`, text);
  return NextResponse.json({ ok: true, id: r.id, chars: text.length });
}
