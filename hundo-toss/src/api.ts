// The site's server (jojeong/): it checks a Toss in-app order and writes the report, as it does for the site's own
// orders. Set VITE_HUNDO_API to the site's address (no trailing slash) before building.
export const API_BASE = (import.meta.env.VITE_HUNDO_API ?? "").replace(/\/+$/, "");

export type Grant = { ok: true; order: string; product: string } | { ok: false; message: string };

// After a payment: the server confirms the order with Toss and makes the site order that opens the report. The same
// Toss order always gives back the same site order, so this is safe to call again (a restore, a retry).
export async function grantOrder(body: { orderId: string; sku: string; key: string | null; p: string }): Promise<Grant> {
  if (!API_BASE) return { ok: false, message: "서버 주소가 설정되지 않았어요." };
  try {
    const res = await fetch(`${API_BASE}/api/toss/grant`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { order?: string; product?: string; error?: string };
    if (res.ok && data.order && data.product) return { ok: true, order: data.order, product: data.product };
    return { ok: false, message: data.error ?? `서버 오류 (${res.status})` };
  } catch {
    return { ok: false, message: "인터넷 연결을 확인해 주세요." };
  }
}

export type MyOrder = { order: string; opens: string[]; who: string; at: number };

// The reports bought with this Toss account (its anonymous key), so they open again on another phone.
export async function myOrders(key: string): Promise<MyOrder[]> {
  if (!API_BASE) return [];
  try {
    const res = await fetch(`${API_BASE}/api/toss/orders?key=${encodeURIComponent(key)}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { orders?: MyOrder[] };
    return data.orders ?? [];
  } catch {
    return [];
  }
}

// One report of an order, as it is written: the text so far is handed to `onText` while it streams in. A report
// another visit is already writing comes back as "writing"; ask again in a few seconds.
export async function readReport(order: string, product: string, onText: (text: string) => void): Promise<"done" | "writing" | { error: string }> {
  if (!API_BASE) return { error: "서버 주소가 설정되지 않았어요." };
  try {
    const res = await fetch(`${API_BASE}/api/toss/report`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ order, product }),
    });
    if (res.status === 202) return "writing";
    if (!res.ok || !res.body) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return { error: data.error ?? `서버 오류 (${res.status})` };
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      onText(text);
    }
    text += decoder.decode();
    if (text.includes("[[error]]")) {
      onText(text.replace("[[error]]", "").trimEnd());
      return { error: "쓰는 도중 끊겼어요. 잠시 뒤 다시 열어 주세요." };
    }
    onText(text);
    return "done";
  } catch {
    return { error: "인터넷 연결을 확인해 주세요." };
  }
}
