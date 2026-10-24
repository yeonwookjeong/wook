import { useEffect, useState } from "react";
import { productById } from "@/lib/products";
import { myOrders } from "./api";
import { itemBySku } from "./catalog";
import { readList } from "./me";
import { anonKey, MINE_KEY, type Bought } from "./purchase";

type Row = { order: string; opens: string[]; who: string; at: number };

// The reports bought here: those kept on this phone, and those the server holds for this Toss account (bought on
// another phone). One row per order.
export function MineView({ onOpen }: { onOpen: (order: string, opens: string[]) => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    (async () => {
      const local = (await readList(MINE_KEY)).flatMap((raw): Row[] => {
        try {
          const b = JSON.parse(raw) as Bought;
          return [{ order: b.order, opens: itemBySku(b.sku)?.opens ?? [b.product], who: b.who, at: b.at }];
        } catch {
          return [];
        }
      });
      const key = await anonKey();
      const remote = key ? await myOrders(key) : [];
      const seen = new Set<string>();
      setRows(
        [...local, ...remote]
          .filter((r) => !seen.has(r.order) && Boolean(seen.add(r.order)))
          .sort((a, b) => b.at - a.at),
      );
    })();
  }, []);

  if (rows === null) return <p className="quiet center">불러오는 중…</p>;
  if (!rows.length)
    return (
      <section className="card">
        <p>아직 산 보고서가 없어요.</p>
      </section>
    );
  return (
    <section className="stack">
      {rows.map((r) => (
        <button key={r.order} className="card row-button" onClick={() => onOpen(r.order, r.opens)}>
          <strong>{r.opens.map((p) => productById(p)?.title ?? p).join(" · ")}</strong>
          <span className="quiet">
            {r.who}님 · {new Date(r.at).toLocaleDateString("ko-KR")}
          </span>
        </button>
      ))}
    </section>
  );
}
