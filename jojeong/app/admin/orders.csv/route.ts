import { isAdmin } from "@/lib/admin";
import { allMembers, buyerTag } from "@/lib/members";
import { paidOrders } from "@/lib/pay";
import { productById, SETS } from "@/lib/products";
import { saleKey, saleLabel } from "@/lib/sales";

// Every paid order as a spreadsheet (owner only), for analysis in Excel or Google Sheets. No names or charts:
// when, what, how much, how it was paid, and whether it was refunded.
// The last two columns (added after the others, so older sheets keep their columns): 구매자, a short keyed hash of
// the member id (lib/members.ts buyerTag), never the id, email or phone; blank for a buyer who was not signed in, as
// an order keeps nothing of the browser. 첫 구매/재구매: 재구매 when the same buyer paid before (refunded payments
// count as having paid; test payments are left out and left blank).
export async function GET() {
  if (!(await isAdmin())) return new Response("관리자만 받을 수 있어요.", { status: 403 });
  const kst = (t: number) => new Date(t + 9 * 3600000).toISOString().slice(0, 16).replace("T", " ");
  const cell = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const orders = await paidOrders();
  // Whose order: the member a 질문권 order was for, else the member whose record holds it (bought signed in, or
  // brought along at a later sign-in). A member who left takes the link with them.
  const owner = new Map<string, string>();
  for (const m of await allMembers(Infinity)) for (const id of m.orders) owner.set(id, m.id);
  const buyerOf = new Map(orders.map((o) => [o.id, o.member ?? o.bonusMember ?? owner.get(o.id)]));
  const tags = new Map<string, string>();
  const tag = (id: string) => tags.get(id) ?? tags.set(id, buyerTag(id)).get(id)!;
  // First or again, in the order of payment.
  const seen = new Set<string>();
  const again = new Map<string, boolean>();
  const byTime = orders.filter((o) => !o.test).sort((a, b) => (a.paidAt ?? a.createdAt) - (b.paidAt ?? b.createdAt));
  for (const o of byTime) {
    const b = buyerOf.get(o.id);
    if (!b) continue;
    again.set(o.id, seen.has(b));
    seen.add(b);
  }
  const head = ["결제일시(KST)", "요일", "시", "주문번호", "분류", "상품", "세트", "연운 연도", "금액", "결제수단", "상태", "들어온 길", "테스트", "구매자", "첫 구매/재구매"];
  const rows = orders.map((o) => {
    const t = o.paidAt ?? o.createdAt;
    const d = new Date(t + 9 * 3600000);
    const b = buyerOf.get(o.id);
    const a = again.get(o.id);
    return [
      kst(t),
      "일월화수목금토"[d.getUTCDay()],
      d.getUTCHours(),
      o.id,
      saleLabel(saleKey(o.product, o.set, o.req.y, t)) ?? o.product,
      productById(o.product)?.title ?? o.product,
      o.set ? SETS[o.set]?.title ?? o.set : "",
      o.req.y ?? "",
      o.amount,
      o.method ?? "",
      o.status === "paid" ? "결제" : o.status === "canceled" ? "환불" : o.status,
      o.src ?? "",
      o.test ? "테스트" : "",
      b ? tag(b) : "",
      a === undefined ? "" : a ? "재구매" : "첫 구매",
    ];
  });
  // A BOM so Excel reads the Korean as UTF-8.
  const csv = "﻿" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  const name = `hundosaju-orders-${kst(Date.now()).slice(0, 10)}.csv`;
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" },
  });
}
