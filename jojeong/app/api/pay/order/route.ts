import { decodePerson, relationOf } from "@/lib/pairToken";
import { createOrder, payClientKey, payEnabled, payMock } from "@/lib/pay";
import { FIXED_RELATION, isOpen, isPair, priceNow, productById } from "@/lib/products";
import { jobFor, type JobRequest } from "@/lib/reportWriter";
import { KINDS, parseSearch } from "@/lib/taekil";

// POST { product, p } or, for a two-person report, { product, a, b, rel } → a new order for that exact report, priced here.
export async function POST(request: Request) {
  if (!payEnabled()) return Response.json({ error: "결제 준비 중이에요." }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as JobRequest;
  const product = productById(body.product);
  if (!product || !product.modern || isOpen(product)) return Response.json({ error: "결제할 수 없는 보고서예요." }, { status: 400 });

  // 택일 is computed, not written: its search and chart(s) are checked here instead of by the writer.
  if (product.id === "taekil") {
    const search = parseSearch(body.kind, body.from, body.n);
    const a = decodePerson(body.a);
    const b = search && KINDS[search.kind].people === 2 ? decodePerson(body.b) : null;
    if (!search || !a || (KINDS[search.kind].people === 2 && !b)) return Response.json({ error: "날짜 조건을 다시 골라 주세요." }, { status: 400 });
    const req: JobRequest = { product: product.id, kind: search.kind, from: body.from, n: String(search.n), a: body.a, ...(b && { b: body.b }) };
    const order = await createOrder(product.id, req, `${b ? `${a.name}님과 ${b.name}님` : `${a.name}님`} · ${KINDS[search.kind].title}`, priceNow());
    return Response.json({ orderId: order.id, amount: order.amount, orderName: KINDS[search.kind].title, clientKey: payClientKey(), mock: payMock() });
  }

  // Only what identifies the report goes into the order.
  const req: JobRequest =
    isPair(product) ? { product: product.id, a: body.a, b: body.b, rel: FIXED_RELATION[product.id] ?? relationOf(body.rel) } : { product: product.id, p: body.p };
  const job = await jobFor(req);
  if ("error" in job) return Response.json({ error: job.error }, { status: job.status });

  const who =
    isPair(product) ? `${decodePerson(req.a)?.name}님과 ${decodePerson(req.b)?.name}님` : `${decodePerson(req.p)?.name}님`;
  const order = await createOrder(product.id, req, who, priceNow());
  return Response.json({ orderId: order.id, amount: order.amount, orderName: product.title, clientKey: payClientKey(), mock: payMock() });
}
