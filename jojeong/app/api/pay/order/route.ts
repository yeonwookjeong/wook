import { decodePerson, relationOf } from "@/lib/pairToken";
import { createOrder, payClientKey, payEnabled, payMock } from "@/lib/pay";
import { FIXED_RELATION, isOpen, isPair, priceNow, productById, SETS, setOf } from "@/lib/products";
import { jobFor, type JobRequest } from "@/lib/reportWriter";
import { KINDS, parseSearch, searchDay } from "@/lib/taekil";
import { newYearOf } from "@/lib/yeonun";
import { saleKey } from "@/lib/sales";
import { track } from "@/lib/stats";

// POST { product, p } or, for a two-person report, { product, a, b, rel } → a new order for that exact report, priced here.
export async function POST(request: Request) {
  if (!payEnabled()) return Response.json({ error: "결제 준비 중이에요." }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as JobRequest & { set?: string };

  // A set: its reports for one saved chart, at the set's price.
  const set = setOf(body.set);
  if (set) {
    const [lead, ...rest] = SETS[set].products;
    const leadProduct = productById(lead)!;
    if (isOpen(leadProduct)) return Response.json({ error: "지금은 무료로 볼 수 있어요." }, { status: 400 });
    // 새해 준비 세트 carries its year, so its 연운 opens on the coming year.
    const ny = set === "ny" ? newYearOf() : null;
    if (set === "ny" && ny === null) return Response.json({ error: "새해 준비 세트는 지금 팔지 않아요." }, { status: 400 });
    const req: JobRequest = { product: lead, p: body.p, ...(ny !== null && { y: String(ny) }) };
    const job = await jobFor(req);
    if ("error" in job) return Response.json({ error: job.error }, { status: job.status });
    const order = await createOrder(lead, req, `${decodePerson(req.p)?.name}님`, SETS[set].price, { set, bundle: [lead, ...rest] });
    await track(`co:${saleKey(lead, set, undefined)}`);
    return Response.json({ orderId: order.id, amount: order.amount, orderName: ny ? `${SETS[set].title} (${ny} 신년운세 포함)` : SETS[set].title, clientKey: payClientKey(), mock: payMock() });
  }

  const product = productById(body.product);
  if (!product || !product.modern || isOpen(product)) return Response.json({ error: "결제할 수 없는 보고서예요." }, { status: 400 });

  // 택일 is computed, not written: its search and chart(s) are checked here instead of by the writer.
  if (product.id === "taekil") {
    const search = parseSearch(body.kind, body.from, body.n);
    const a = decodePerson(body.a);
    const b = search && KINDS[search.kind].people === 2 ? decodePerson(body.b) : null;
    if (!search || !a || (KINDS[search.kind].people === 2 && !b)) return Response.json({ error: "날짜 조건을 다시 골라 주세요." }, { status: 400 });
    // The search date is set here, not by the browser: the days (and the written note) stay as they were bought.
    const req: JobRequest = { product: product.id, kind: search.kind, from: body.from, n: String(search.n), a: body.a, ...(b && { b: body.b }), d: searchDay(undefined) };
    const order = await createOrder(product.id, req, `${b ? `${a.name}님과 ${b.name}님` : `${a.name}님`} · ${KINDS[search.kind].title}`, priceNow());
    await track(`co:${saleKey(product.id, undefined, undefined)}`);
    return Response.json({ orderId: order.id, amount: order.amount, orderName: KINDS[search.kind].title, clientKey: payClientKey(), mock: payMock() });
  }

  // Only what identifies the report goes into the order (연운: the chart and the year).
  const req: JobRequest = isPair(product)
    ? { product: product.id, a: body.a, b: body.b, rel: FIXED_RELATION[product.id] ?? relationOf(body.rel) }
    : { product: product.id, p: body.p, ...(product.id === "yeonun" && { y: body.y }) };
  const job = await jobFor(req);
  if ("error" in job) return Response.json({ error: job.error }, { status: job.status });

  const who =
    isPair(product) ? `${decodePerson(req.a)?.name}님과 ${decodePerson(req.b)?.name}님` : `${decodePerson(req.p)?.name}님`;
  const order = await createOrder(product.id, req, product.id === "yeonun" ? `${who} · ${req.y}년 운세` : who, priceNow());
  await track(`co:${saleKey(product.id, undefined, req.y)}`);
  const orderName = product.id === "yeonun" ? `${req.y}년 운세 (연운)` : product.title;
  return Response.json({ orderId: order.id, amount: order.amount, orderName, clientKey: payClientKey(), mock: payMock() });
}
