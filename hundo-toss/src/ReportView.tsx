import { useEffect, useState } from "react";
import { productById } from "@/lib/products";
import { readReport } from "./api";

type Section = { label: string; headline: string; why?: string; todo?: string; paras: string[] };

// "## [장 이름] 헤드라인", then "이유: …" and "할 일: …" lines, then paragraphs: the site's report format
// (jojeong/components/AiReport.tsx parse). Works on partial text while it streams in.
function parse(text: string): Section[] {
  return text
    .split(/^##\s+/m)
    .slice(1)
    .map((chunk) => {
      const [head, ...rest] = chunk.split("\n");
      const m = /^\[([^\]]+)\]\s*(.*)$/.exec(head.trim());
      const point = (k: string) => rest.map((l) => new RegExp(`^${k}\\s*[:：]\\s*(.+)$`).exec(l.trim())?.[1]).find(Boolean);
      return {
        label: m ? m[1] : "",
        headline: (m ? m[2] : head).trim(),
        why: point("이유"),
        todo: point("할 일"),
        paras: rest
          .filter((l) => !/^(이유|할 일)\s*[:：]/.test(l.trim()))
          .join("\n")
          .split(/\n\s*\n/)
          .map((p) => p.replace(/\*\*/g, "").trim())
          .filter(Boolean),
      };
    });
}

// One bought report, read from the site's server. While it is first written (a minute or two) the chapters appear as
// they come; another visit already writing it means asking again shortly.
function OneReport({ order, product }: { order: string; product: string }) {
  const [text, setText] = useState("");
  const [state, setState] = useState<"loading" | "writing" | "done" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const go = async () => {
      const r = await readReport(order, product, (t) => alive && setText(t));
      if (!alive) return;
      if (r === "writing") {
        setState("writing");
        timer = setTimeout(go, 5000);
      } else if (r === "done") setState("done");
      else {
        setState("error");
        setError(r.error);
      }
    };
    void go();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [order, product]);

  const sections = parse(text);
  return (
    <div className="stack">
      {sections.length === 0 && state !== "error" && (
        <div className="card">
          <p>정 훈도가 사주를 펼쳐 보는 중이에요…</p>
          <p className="quiet">처음 한 번만 1~2분 걸려요. 창을 닫아도 끝까지 써 두니, 다음부터는 바로 열려요.</p>
        </div>
      )}
      {sections.map((s, i) => (
        <article key={i} className="card chapter">
          {s.label && <p className="kicker">{s.label}</p>}
          <h3>{s.headline}</h3>
          {s.why && (
            <p className="point">
              <strong>이유</strong> {s.why}
            </p>
          )}
          {s.todo && (
            <p className="point">
              <strong>할 일</strong> {s.todo}
            </p>
          )}
          {s.paras.map((p, j) => (
            <p key={j}>{p}</p>
          ))}
        </article>
      ))}
      {state === "error" && <p className="error">{error}</p>}
      {state === "done" && <p className="sign">— 관상감 명과학 훈도 정가, 삼가 적음</p>}
    </div>
  );
}

// An order may open several reports (a set): one tab for each.
export function ReportView({ order, products, onBack }: { order: string; products: string[]; onBack: () => void }) {
  const [current, setCurrent] = useState(products[0]);
  return (
    <section className="stack">
      <button className="back" onClick={onBack}>
        ← 돌아가기
      </button>
      {products.length > 1 && (
        <div className="tabs small">
          {products.map((p) => (
            <button key={p} className={p === current ? "on" : undefined} onClick={() => setCurrent(p)}>
              {productById(p)?.title ?? p}
            </button>
          ))}
        </div>
      )}
      <OneReport key={current} order={order} product={current} />
    </section>
  );
}
