import { isAdmin } from "@/lib/admin";
import { paidOrders } from "@/lib/pay";
import { productById, SETS } from "@/lib/products";
import { saleKey, saleLabel } from "@/lib/sales";

// Every paid order as a spreadsheet (owner only), for analysis in Excel or Google Sheets. No names or charts:
// when, what, how much, how it was paid, and whether it was refunded.
export async function GET() {
  if (!(await isAdmin())) return new Response("관리자만 받을 수 있어요.", { status: 403 });
  const kst = (t: number) => new Date(t + 9 * 3600000).toISOString().slice(0, 16).replace("T", " ");
  const cell = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = ["결제일시(KST)", "요일", "시", "주문번호", "분류", "상품", "세트", "연운 연도", "금액", "결제수단", "상태"];
  const rows = (await paidOrders()).map((o) => {
    const t = o.paidAt ?? o.createdAt;
    const d = new Date(t + 9 * 3600000);
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
    ];
  });
  // A BOM so Excel reads the Korean as UTF-8.
  const csv = "﻿" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  const name = `hundosaju-orders-${kst(Date.now()).slice(0, 10)}.csv`;
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" },
  });
}
