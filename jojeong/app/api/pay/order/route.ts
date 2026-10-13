import { decodePerson, relationOf } from "@/lib/pairToken";
import { createOrder, payClientKey, payEnabled, payMock } from "@/lib/pay";
import { bonusFor, CREDIT_PACKS, creditPackOf, FIXED_RELATION, isOpen, isPair, priceFor, productById, SETS, SETS_OFFERED, setOf, setPrice } from "@/lib/products";
import { pricingNow } from "@/lib/pricing";
import { currentMember } from "@/lib/members";
import { jobFor, type JobRequest } from "@/lib/reportWriter";
import { KINDS, parseSearch, searchDay } from "@/lib/taekil";
import { newYearOf } from "@/lib/yeonun";
import { saleKey } from "@/lib/sales";
import { track } from "@/lib/stats";

// POST { product, p } or, for a two-person report, { product, a, b, rel } → a new order for that exact report, priced here.
export async function POST(request: Request) {
  if (!payEnabled()) return Response.json({ error: "결제 준비 중이에요." }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as JobRequest & { set?: string; from?: string; credits?: string };
  const pr = await pricingNow();
  const ny = newYearOf();
  // Questions that come with the report (A안): to the member signed in now, or at their first sign-in after.
  const member = await currentMember().catch(() => null);
  const withBonus = (n: number) => (n > 0 ? { bonus: n, ...(member && { bonusMember: member.id }) } : {});

  // 질문권: for the member signed in here; the questions are added once the payment is confirmed (/pay/success).
  const pack = creditPackOf(body.credits);
  if (pack) {
    if (!member) return Response.json({ error: "로그인한 뒤에 살 수 있어요." }, { status: 401 });
    const order = await createOrder("jilmun", { product: "jilmun" }, member.nick, CREDIT_PACKS[pack], undefined, { credits: pack, member: member.id });
    await track("co:jilmun");
    return Response.json({ orderId: order.id, amount: order.amount, orderName: `정 훈도에게 묻기 질문 ${pack}개`, clientKey: payClientKey(), mock: payMock() });
  }

  // A set: its reports for one saved chart, at the set's price.
  const set = setOf(body.set);
  if (set && !SETS_OFFERED[pr].includes(set)) return Response.json({ error: "지금은 팔지 않는 세트예요." }, { status: 400 });
  if (set) {
    const [lead, ...rest] = SETS[set].products;
    const leadProduct = productById(lead)!;
    if (isOpen(leadProduct)) return Response.json({ error: "지금은 무료로 볼 수 있어요." }, { status: 400 });
    // A set with a 연운 carries the coming year, so it opens on that year.
    const withYear = SETS[set].products.includes("yeonun");
    if (withYear && ny === null) return Response.json({ error: `${SETS[set].title}는 지금 팔지 않아요.` }, { status: 400 });
    const req: JobRequest = { product: lead, p: body.p, ...(withYear && { y: String(ny) }) };
    const job = await jobFor(req);
    if ("error" in job) return Response.json({ error: job.error }, { status: job.status });
    // The report page the set was bought on, for the owner's table (only one of the set's own reports counts).
    const from = SETS[set].products.find((p) => p === body.from);
    const order = await createOrder(lead, req, `${decodePerson(req.p)?.name}님`, setPrice(set, pr), { set, bundle: [lead, ...rest], ...(from && { from }) }, undefined, withBonus(bonusFor(pr, null, set)));
    await track(`co:${saleKey(lead, set, undefined)}`);
    return Response.json({ orderId: order.id, amount: order.amount, orderName: withYear ? `${SETS[set].title} (${ny} 신년운세 포함)` : SETS[set].title, clientKey: payClientKey(), mock: payMock() });
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
    const order = await createOrder(product.id, req, `${b ? `${a.name}님과 ${b.name}님` : `${a.name}님`} · ${KINDS[search.kind].title}`, priceFor(product.id, pr));
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
  const order = await createOrder(
    product.id,
    req,
    product.id === "yeonun" ? `${who} · ${req.y}년 운세` : who,
    priceFor(product.id, pr, req.y, ny),
    undefined,
    undefined,
    withBonus(bonusFor(pr, product.id, null, req.y, ny)),
  );
  await track(`co:${saleKey(product.id, undefined, req.y)}`);
  const orderName = product.id === "yeonun" ? `${req.y}년 운세 (연운)` : product.title;
  return Response.json({ orderId: order.id, amount: order.amount, orderName, clientKey: payClientKey(), mock: payMock() });
}
