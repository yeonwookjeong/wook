import { IAP, type IapProductListItem } from "@apps-in-toss/web-framework";
import { useEffect, useState } from "react";
import type { Person } from "@/lib/pairToken";
import { catalog } from "./catalog";
import { buy, iapSupported } from "./purchase";

// The shelf: the mini app's items in the catalog's order, priced from the Apps in Toss console (an item the console
// does not list, or lists switched off, is not sold).
export function ShopView({ me, onOpen }: { me: Person; onOpen: (order: string, opens: string[]) => void }) {
  const [listed, setListed] = useState<Record<string, IapProductListItem> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const supported = iapSupported();

  useEffect(() => {
    if (!supported) return;
    IAP.getProductItemList()
      .then((r) => setListed(Object.fromEntries((r?.products ?? []).map((p) => [p.sku, p]))))
      .catch(() => setListed({}));
  }, [supported]);

  function purchase(sku: string, opens: string[]) {
    setBusy(sku);
    setMessage(null);
    buy(sku, me, (r) => {
      setBusy(null);
      if (r.ok) onOpen(r.order, opens);
      else setMessage(r.message);
    });
  }

  const items = catalog();
  return (
    <section className="stack">
      <div className="card">
        <h2>{me.name}님 사주로 쓰는 보고서</h2>
        <p className="quiet">정 훈도가 {me.name}님 사주만 보고 한 권으로 써 드려요. 한 번 사면 언제든 다시 열 수 있어요.</p>
      </div>
      {!supported && <p className="notice">결제는 토스 앱 안에서만 할 수 있어요.</p>}
      {message && <p className="error">{message}</p>}
      {items.map((item) => {
        const p = listed?.[item.sku];
        const sellable = supported && Boolean(p);
        return (
          <div key={item.sku} className="card product">
            <h3>{item.title}</h3>
            <p>{item.tagline}</p>
            <ul className="toc">
              {item.toc.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <button className="primary" disabled={!sellable || busy !== null} onClick={() => purchase(item.sku, item.opens)}>
              {busy === item.sku ? "결제 중…" : p ? `${p.displayAmount} 결제하고 보기` : supported && listed === null ? "불러오는 중…" : "준비 중"}
            </button>
          </div>
        );
      })}
    </section>
  );
}
