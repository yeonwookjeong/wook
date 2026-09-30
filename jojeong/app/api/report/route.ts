import { isAdmin } from "@/lib/admin";
import { covers, getOrder } from "@/lib/pay";
import { productById } from "@/lib/products";
import { aiEnabled, jobFor, writeReport, type JobRequest } from "@/lib/reportWriter";
import { after } from "next/server";
import { countReportToday, getReportText, getReportWriting, setReportText, setReportWriting } from "@/lib/store";

// Writing a long report takes a minute or two.
export const maxDuration = 300;

const DAILY_LIMIT = Number(process.env.REPORT_DAILY_LIMIT ?? 1000);
const MARK_ERROR = "\n\n[[error]]";
// A writing begun this long ago and still unsaved has died with its function (maxDuration is 5 minutes).
const WRITING_FOR = 5 * 60 * 1000;
// When the v6 prompt went live (lib/reportPrompts.ts). Orders paid before it keep their v5 reports.
const V6_SINCE = Date.parse("2026-09-30T15:05:00Z");

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
  const job = await jobFor(req);
  if ("error" in job) return Response.json({ error: job.error }, { status: job.status });

  // A report bought before the v6 prompt opens exactly as it was first written (its v5 text), never rewritten.
  const boughtBefore = order && (order.paidAt ?? order.createdAt) < V6_SINCE;
  const legacy = boughtBefore ? await jobFor(req, "v5") : null;
  const cached = (legacy && !("error" in legacy) ? await getReportText(legacy.key) : null) ?? (await getReportText(job.key));
  if (cached) return new Response(cached, { headers: { "content-type": "text/plain; charset=utf-8", "x-report": "cached" } });

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

  // Already being written for an earlier visit: this one waits for it (the page asks again every few seconds).
  if (Date.now() - (await getReportWriting(job.key)) < WRITING_FOR) return Response.json({ writing: true }, { status: 202 });
  await setReportWriting(job.key, Date.now());

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
      const text = await writeReport(job, push);
      if (text) {
        await setReportText(job.key, text);
        ok = true;
      }
    } catch (e) {
      console.error(e);
    }
    if (!ok) {
      await setReportWriting(job.key, 0).catch(() => {});
      push(MARK_ERROR);
    }
    try {
      sink.out?.close();
    } catch {}
  })();
  after(() => work);
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "x-report": "fresh", "cache-control": "no-store" } });
}
