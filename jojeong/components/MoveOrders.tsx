"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// "내 보고서" between browsers without an account. On an iPhone, the home-screen app and Safari keep separate
// cookies, so a report bought in one doesn't show in the other: make a code where it shows, type it where it doesn't.
export default function MoveOrders({ has }: { has: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(body: object) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/transfer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json()) as { code?: string; moved?: number; error?: string };
      if (data.error) setMsg(data.error);
      return data;
    } catch {
      setMsg("연결이 잠시 불안정해요. 다시 눌러 주세요.");
      return {};
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="doc-paper mt-6 px-5 py-5 text-sm">
      <h2 className="font-myeongjo text-lg font-extrabold">다른 기기·홈 화면 앱으로 옮기기</h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">
        아이폰은 홈 화면 앱과 사파리가 기록을 따로 보관해요. 보고서가 보이는 곳에서 코드를 만들고, 안 보이는 곳에서 코드를 넣으면 옮겨져요.
      </p>
      {has && (
        <div className="mt-3">
          {code ? (
            <p className="rounded-lg bg-white/60 px-3 py-3 text-center">
              <span className="block font-mono text-2xl font-bold tracking-[0.25em] text-seal">
                {code.slice(0, 4)}-{code.slice(4)}
              </span>
              <span className="mt-1 block text-[12px] text-ink-soft">10분 동안, 한 번만 쓸 수 있어요</span>
            </p>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={async () => setCode((await call({})).code ?? null)}
              className="w-full border border-seal py-2.5 font-bold text-seal disabled:opacity-50"
            >
              옮기기 코드 만들기
            </button>
          )}
        </div>
      )}
      <form
        className="mt-3 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = await call({ code: input });
          if (data.moved !== undefined) {
            setMsg(data.moved ? `보고서 ${data.moved}개를 가져왔어요.` : "가져올 결제 보고서가 없었어요.");
            setInput("");
            router.refresh();
          }
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="받은 코드 (예: QK7M-2PXD)"
          autoCapitalize="characters"
          autoComplete="off"
          className="min-w-0 flex-1 rounded border border-ink/20 bg-white/70 px-3 py-2 font-mono tracking-widest"
        />
        <button type="submit" disabled={busy || input.replace(/[^A-Za-z0-9]/g, "").length !== 8} className="shrink-0 bg-seal px-4 font-bold text-hanji disabled:opacity-40">
          가져오기
        </button>
      </form>
      {msg && <p className="mt-2 text-[13px] font-bold text-seal">{msg}</p>}
    </section>
  );
}
