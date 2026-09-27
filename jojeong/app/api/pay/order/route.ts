import { decodePerson, relationOf } from "@/lib/pairToken";
import { createOrder, payClientKey, payEnabled, payMock } from "@/lib/pay";
import { FIXED_RELATION, isOpen, isPair, priceNow, productById } from "@/lib/products";
import { jobFor, type JobRequest } from "@/lib/reportWriter";

// POST { product, p } or, for a two-person report, { product, a, b, rel } → a new order for that exact report, priced here.
export async function POST(request: Request) {
  if (!payEnabled()) return Response.json({ error: "결제 준비 중이에요." }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as JobRequest;
  const product = productById(body.product);
  if (!product || !product.modern || isOpen(product)) return Response.json({ error: "결제할 수 없는 보고서예요." }, { status: 400 });

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
