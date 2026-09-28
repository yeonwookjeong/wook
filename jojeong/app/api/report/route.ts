import { isAdmin } from "@/lib/admin";
import { covers, getOrder } from "@/lib/pay";
import { isOpen, productById } from "@/lib/products";
import { aiEnabled, jobFor, writeReport, type JobRequest } from "@/lib/reportWriter";
import { countReportToday, getReportText, setReportText } from "@/lib/store";

// Writing a long report takes a minute or two.
export const maxDuration = 300;

const DAILY_LIMIT = Number(process.env.REPORT_DAILY_LIMIT ?? 1000);
const MARK_ERROR = "\n\n[[error]]";

// POST { product, court?, m?, t?, p?, a?, b?, rel?, order? } → the report as plain text, streamed while it is being written (or all at
// once when it was written before). A failure midway ends the stream with MARK_ERROR.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as JobRequest & { order?: string };
  // A paid report is written only for a confirmed order, and exactly for what was bought.
  const product = productById(body.product);
  let req: JobRequest = body;
  // The owner (lib/admin.ts) reads any report without an order.
  if (product && !isOpen(product) && !(body.order === undefined && (await isAdmin()))) {
    const order = await getOrder(body.order);
    if (!order || !covers(order, product.id))
      return Response.json({ error: product.modern ? "결제한 뒤에 열 수 있어요." : "복채를 주신 뒤에 열리옵니다." }, { status: 402 });
    req = { ...order.req, product: product.id };
  }
  const job = await jobFor(req);
  if ("error" in job) return Response.json({ error: job.error }, { status: job.status });

  const cached = await getReportText(job.key);
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

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const text = await writeReport(job, (t) => controller.enqueue(encoder.encode(t)));
        if (text) await setReportText(job.key, text);
        else controller.enqueue(encoder.encode(MARK_ERROR));
      } catch (e) {
        console.error(e);
        controller.enqueue(encoder.encode(MARK_ERROR));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "x-report": "fresh", "cache-control": "no-store" } });
}
