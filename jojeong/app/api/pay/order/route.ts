import { decodePerson, relationOf } from "@/lib/pairToken";
import { createOrder, payClientKey, payEnabled, payMock } from "@/lib/pay";
import { isOpen, priceNow, productById } from "@/lib/products";
import { jobFor, type JobRequest } from "@/lib/reportWriter";

// POST { product, p } or { product: "gunghap", a, b, rel } → a new order for that exact report, priced here.
export async function POST(request: Request) {
  if (!payEnabled()) return Response.json({ error: "결제 준비 중이에요." }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as JobRequest;
  const product = productById(body.product);
  if (!product || !product.modern || isOpen(product)) return Response.json({ error: "결제할 수 없는 보고서예요." }, { status: 400 });

  // Only what identifies the report goes into the order.
  const req: JobRequest =
    product.id === "gunghap" ? { product: product.id, a: body.a, b: body.b, rel: relationOf(body.rel) } : { product: product.id, p: body.p };
  const job = await jobFor(req);
  if ("error" in job) return Response.json({ error: job.error }, { status: job.status });

  const who =
    product.id === "gunghap" ? `${decodePerson(req.a)?.name}님과 ${decodePerson(req.b)?.name}님` : `${decodePerson(req.p)?.name}님`;
  const order = await createOrder(product.id, req, who, priceNow());
  return Response.json({ orderId: order.id, amount: order.amount, orderName: product.title, clientKey: payClientKey(), mock: payMock() });
}
