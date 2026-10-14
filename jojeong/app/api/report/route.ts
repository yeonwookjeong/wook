import { isAdmin } from "@/lib/admin";
import { covers, getOrder, pinReportText } from "@/lib/pay";
import { productById, type ProductId } from "@/lib/products";
import { aiEnabled, jobFor, writeReport, type JobRequest } from "@/lib/reportWriter";
import { isV8 } from "@/lib/reportPrompts";
import { renewNow } from "@/lib/launch";
import { hasPoints, mergePoints, pointsJob } from "@/lib/reportPoints";
import { after } from "next/server";
import { countReportToday, getReportText, getReportWriting, noteReportError, setReportText, setReportWriting } from "@/lib/store";

// Writing a long report takes a minute or two.
export const maxDuration = 300;

const DAILY_LIMIT = Number(process.env.REPORT_DAILY_LIMIT ?? 1000);
const MARK_ERROR = "\n\n[[error]]";
// A writing begun this long ago and still unsaved has died with its function (maxDuration is 5 minutes).
const WRITING_FOR = 5 * 60 * 1000;
// When the v6 prompt went live (lib/reportPrompts.ts). Orders paid before it keep their v5 reports.
const V6_SINCE = Date.parse("2026-09-30T15:05:00Z");
// When the five-grade life flow went live (lib/freeReading.ts). Orders paid before it keep the report they were
// first written with, which was told three grades.
const GRADES5_SINCE = Date.parse("2026-10-02T04:30:00Z");
// When the v7 prompt went live (money and work: roles, money talents, the 한눈에 summary). Orders paid before it
// keep the v6 report they were first written with.
const V7_SINCE = Date.parse("2026-10-07T04:00:00Z");

// POST { product, court?, m?, t?, p?, a?, b?, rel?, order? } → the report as plain text, streamed while it is being written (or all at
// once when it was written before). A failure midway ends the stream with MARK_ERROR.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as JobRequest & { order?: string };
  // Every written report costs a model call, so one is written only for a confirmed order, exactly for what was
  // bought. The owner (lib/admin.ts) reads any report without an order. Free reports have no writer at all.
  const product = productById(body.product);
  if (!product) return Response.json({ error: "없는 보고서예요." }, { status: 404 });
  let req: JobRequest = body;
  let order: Awaited<ReturnType<typeof getOrder>> = null;
  if (!(body.order === undefined && (await isAdmin()))) {
    order = await getOrder(body.order);
    if (!order || !covers(order, product.id))
      return Response.json({ error: product.modern ? "결제한 뒤에 열 수 있어요." : "복채를 주신 뒤에 열리옵니다." }, { status: 402 });
    req = { ...order.req, product: product.id };
  }
  // When it was bought: the 연운 is asked as of that year (lib/reportWriter.ts jobFor), so it opens the same after the new year.
  const at = order ? (order.paidAt ?? order.createdAt) : undefined;
  // The second pass (lib/open.ts RENEW2; 시안 모드 before it is on): bought in the opened shop, written with v9's
  // point box. A report bought before the opening never is.
  // The owner's quick look with no order (app/reports/[id] asOwner) asks v9 to see what a buyer will get.
  const v9 = order ? Boolean(isV8(order) && (await renewNow())) : (body as { v?: string }).v === "9";
  const job = await jobFor(req, v9 ? "v9" : undefined, false, at);
  if ("error" in job) return Response.json({ error: job.error }, { status: job.status });
  // A v8 text of such an order (read before the second pass) keeps its words and gets the point box beside them.
  const withPoints = async (key: string, text: string) => {
    if (!v9 || hasPoints(text)) return text;
    const pts = await getReportText(`${key}:pts`);
    if (pts) return mergePoints(text, pts);
    const pj = pointsJob(text, key, job.modern);
    if (aiEnabled() && Date.now() - (await getReportWriting(pj.key)) >= WRITING_FOR) {
      await setReportWriting(pj.key, Date.now());
      after(async () => {
        const out = await writeReport(pj, () => {}).catch(() => null);
        if (out) await setReportText(pj.key, out);
        else await setReportWriting(pj.key, 0).catch(() => {});
      });
    }
    return text;
  };

  // The text this order first opened with, kept on the order: it opens that, whatever changed since.
  const pinnedKey = order?.texts?.[product.id as ProductId];
  const pinned = pinnedKey ? await getReportText(pinnedKey) : null;
  if (pinned) return new Response(await withPoints(pinnedKey!, pinned), { headers: { "content-type": "text/plain; charset=utf-8", "x-report": "cached" } });

  // A report bought before the v6 prompt opens exactly as it was first written (its v5 text), never rewritten.
  const boughtBefore = order && (order.paidAt ?? order.createdAt) < V6_SINCE;
  const legacy = boughtBefore ? await jobFor(req, "v5", false, at) : null;
  // Paid before the five grades: what was first written then (v6 with the three-grade brief), else v5's.
  const oldGrades = order && (order.paidAt ?? order.createdAt) < GRADES5_SINCE ? await jobFor(req, "v6", true, at) : null;
  const beforeV7 = order && (order.paidAt ?? order.createdAt) < V7_SINCE ? await jobFor(req, "v6", false, at) : null;
  // Bought before the opening (not in the new shop): the v7 report, and written with v7 if never opened.
  const preV8 = Boolean(order && !isV8(order));
  const beforeV8 = preV8 ? await jobFor(req, "v7", false, at) : null;
  // A 연운 bought before its year was fixed to the purchase (2026-10): asked as of this year, as it was then.
  const asNow = order && product.id === "yeonun" ? await jobFor(req, preV8 ? "v7" : undefined) : null;
  // The first of these already written opens (oldest way first), and is kept on the order from then on.
  // An opened-shop order written with v8 before the second pass (and never pinned) opens that, with its points.
  const asV8 = v9 ? await jobFor(req, "v8", false, at) : null;
  const found = [legacy, oldGrades, beforeV7, beforeV8, asV8, job, asNow].filter((j): j is NonNullable<typeof j> & { key: string } => Boolean(j && !("error" in j)));
  for (const j of found) {
    const text = await getReportText(j.key);
    if (!text) continue;
    if (order) await pinReportText(order.id, product.id as ProductId, j.key).catch(() => {});
    return new Response(await withPoints(j.key, text), { headers: { "content-type": "text/plain; charset=utf-8", "x-report": "cached" } });
  }

  if (!aiEnabled())
    return Response.json(
      { error: job.modern ? "정 훈도가 보고서를 쓸 준비를 하고 있어요. 잠시 뒤 다시 열어 주세요." : "정 훈도가 붓을 준비하는 중이옵니다. 잠시 뒤 다시 찾아 주시옵소서." },
      { status: 503 },
    );
  if ((await countReportToday()) > DAILY_LIMIT)
    return Response.json(
      { error: job.modern ? "오늘 쓸 수 있는 보고서가 모두 찼어요. 내일 다시 열어 주세요." : "오늘은 붓을 너무 많이 들어 손목이 저리옵니다. 내일 다시 찾아 주시옵소서." },
      { status: 429 },
    );

  // What is written now: what was bought (a pre-v8 order gets the v7 report it paid for).
  const writeJob = beforeV8 && !("error" in beforeV8) ? beforeV8 : job;

  // Already being written for an earlier visit: this one waits for it (the page asks again every few seconds).
  if (Date.now() - (await getReportWriting(writeJob.key)) < WRITING_FOR) return Response.json({ writing: true }, { status: 202 });
  await setReportWriting(writeJob.key, Date.now());

  // The writing runs on its own, not tied to this response: a reader who closes the tab or loses the connection
  // midway still finds the whole report saved when they come back. The stream only lets the page follow along.
  const encoder = new TextEncoder();
  const sink: { out: ReadableStreamDefaultController<Uint8Array> | null } = { out: null };
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      sink.out = controller;
    },
    cancel() {
      sink.out = null; // the reader has gone; the writing goes on
    },
  });
  const push = (t: string) => {
    try {
      sink.out?.enqueue(encoder.encode(t));
    } catch {
      sink.out = null;
    }
  };
  const work = (async () => {
    let ok = false;
    try {
      const text = await writeReport(writeJob, push);
      if (text) {
        await setReportText(writeJob.key, text);
        if (order) await pinReportText(order.id, product.id as ProductId, writeJob.key).catch(() => {});
        ok = true;
      } else await noteReportError(`${writeJob.title}: 끝까지 쓰지 못함 (stop_reason)`).catch(() => {});
    } catch (e) {
      console.error(e);
      await noteReportError(`${writeJob.title}: ${e instanceof Error ? e.message : String(e)}`).catch(() => {});
    }
    if (!ok) {
      await setReportWriting(writeJob.key, 0).catch(() => {});
      push(MARK_ERROR);
    }
    try {
      sink.out?.close();
    } catch {}
  })();
  after(() => work);
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "x-report": "fresh", "cache-control": "no-store" } });
}
