"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { keepPng, makePng } from "@/lib/cardExport";
import { trackEvent } from "./VisitBeacon";

type Section = { label: string; headline: string; paras: string[]; why?: string; todo?: string };

import { hanjaNum } from "@/lib/hanjaNum";
const MARK_ERROR = "[[error]]";

// Present-day reports speak plain 해요체; the Joseon ones keep 정 훈도's court speech.
const WORDS = {
  modern: {
    failed: "보고서를 불러오지 못했어요.",
    cut: "보고서를 불러오다 연결이 끊겼어요. 새로고침해 주세요.",
    stopped: "보고서 작성이 멈췄어요. 새로고침해 주세요.",
    stoppedMidway: "작성이 중간에 멈췄어요. 새로고침하시면 다시 써 드려요.",
    reading: "정 훈도가 사주를 읽고 있어요…",
    writing: "정 훈도가 보고서를 쓰고 있어요…",
    wait: "처음 한 번만 1~2분 걸려요. 창을 닫아도 끝까지 써 두니, 다음부터는 바로 열려요.",
    chapterDone: "완료",
    sign: "— 정 훈도 드림",
    tap: "제목을 누르면 풀이가 펼쳐져요",
  },
  joseon: {
    failed: "보고서를 불러오지 못했사옵니다.",
    cut: "보고서를 불러오는 중 길이 끊겼사옵니다. 새로고침해 주시옵소서.",
    stopped: "붓이 멈췄사옵니다. 새로고침해 주시옵소서.",
    stoppedMidway: "붓이 중간에 멈췄사옵니다. 새로고침하시면 다시 적어 올리옵니다.",
    reading: "정 훈도가 사주를 펼쳐 보는 중이옵니다…",
    writing: "붓을 들어 적는 중이옵니다…",
    wait: "처음 한 번만 1~2분 걸리옵니다. 창을 닫으셔도 끝까지 적어 두니, 다음부터는 바로 열리옵니다.",
    chapterDone: "적음",
    sign: "— 관상감 명과학 훈도 정가, 삼가 적음",
    tap: "제목을 누르시면 풀이가 펼쳐지옵니다",
  },
};

const SUMMARY_LABEL = "한눈에";

// "## [장 이름] 헤드라인" + paragraphs → sections. Works on partial text while it streams in.
// `chapters`: the questions asked, so a heading written without its brackets ("2. 질문 헤드라인") still splits into
// the question and the headline.
function parse(text: string, chapters: string[] = []): { sections: Section[]; failed: boolean } {
  const failed = text.includes(MARK_ERROR);
  const body = text.replace(MARK_ERROR, "");
  const sections: Section[] = [];
  for (const chunk of body.split(/^##\s+/m).slice(1)) {
    const [head, ...rest] = chunk.split("\n");
    const bracketed = /^\[([^\]]+)\]\s*(.*)$/.exec(head.trim());
    const bare = head.trim().replace(/^\d+\s*[.)]\s*/, "");
    const asked = bracketed ? null : [chapters[sections.length], ...chapters].find((c) => c && bare.startsWith(c));
    const m = bracketed ?? (asked ? [bare, asked, bare.slice(asked.length).replace(/^\s*[:\-–—]?\s*/, "")] : null);
    // v9's point lines (lib/reportPrompts.ts POINT_LINES), right under the headline: "이유: …" and "할 일: …".
    const point = (k: string) => rest.map((l) => new RegExp(`^${k}\\s*[:：]\\s*(.+)$`).exec(l.trim())?.[1]).find(Boolean);
    const body = rest.filter((l) => !/^(이유|할 일)\s*[:：]/.test(l.trim()));
    sections.push({
      label: m ? m[1] : "",
      headline: (m ? m[2] : head).trim(),
      why: point("이유"),
      todo: point("할 일"),
      paras: body
        .join("\n")
        .split(/\n\s*\n/)
        .map((p) => p.replace(/\*\*/g, "").trim())
        .filter(Boolean),
    });
  }
  return { sections, failed };
}

// A report written by 정 훈도 (lib/reportWriter.ts): while it is written, a waiting card that stamps each chapter
// as it is finished; then the whole report at once.
// For a report bought from v8 on (lib/reportPrompts.ts V8_SINCE), the page may add: `figures`, a picture worked out
// from the chart at the top of a chapter (by its index); `ask`, the report's name, for "이 장, 정 훈도에게 더 묻기"
// under each chapter (app/ask/DraftCarry.tsx); `save`, a file name to keep the 한눈에 card as an image.
export default function AiReport({
  request,
  chapters,
  fallback,
  modern = false,
  figures,
  ask,
  save,
}: {
  request: Record<string, string>;
  chapters: string[];
  fallback?: React.ReactNode;
  modern?: boolean;
  figures?: Record<number, React.ReactNode>;
  ask?: string;
  save?: string;
}) {
  const card = useRef<HTMLElement>(null);
  const [saving, setSaving] = useState<"idle" | "making" | "error">("idle");
  async function keepCard() {
    if (!card.current || !save) return;
    trackEvent("save_image", "report");
    setSaving("making");
    try {
      const png = await makePng(card.current, save);
      setSaving("idle");
      await keepPng(png);
    } catch {
      setSaving("error");
    }
  }
  const w = WORDS[modern ? "modern" : "joseon"];
  const [text, setText] = useState("");
  // "waiting": written for an earlier visit (or this one lost its connection), so the page asks again until saved.
  const [state, setState] = useState<"loading" | "writing" | "waiting" | "done" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const body = JSON.stringify(request);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const since = Date.now();
    const again = () => {
      // The writing takes a minute or two; past six, it is not coming.
      if (Date.now() - since > 6 * 60 * 1000) {
        setError(w.stopped);
        setState("error");
      } else setTimeout(load, 4000);
    };
    async function load() {
      let all = "";
      try {
        const res = await fetch("/api/report", { method: "POST", headers: { "content-type": "application/json" }, body });
        if (res.status === 202) {
          setState("waiting");
          return again();
        }
        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          setError(data.error ?? w.failed);
          setState("error");
          return;
        }
        setState(res.headers.get("x-report") === "cached" ? "done" : "writing");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          all += decoder.decode(value, { stream: true });
          setText(all);
        }
        setState(all.includes(MARK_ERROR) ? "error" : "done");
      } catch {
        // The connection dropped while it was being written: the server writes on, so wait for the saved report.
        if (all && !all.includes(MARK_ERROR)) {
          setText("");
          setState("waiting");
          return again();
        }
        setError(w.cut);
        setState("error");
      }
    }
    load();
    // w only changes with `modern`, which never changes for one report.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body]);

  const parsed = parse(text, chapters);
  const { failed } = parsed;
  // Money and work reports end on a "한눈에" summary (lib/reportPrompts.ts SUMMARY_BLOCK): shown open, as rows.
  const sections = parsed.sections.filter((s) => s.label !== SUMMARY_LABEL);
  const summary = parsed.sections.find((s) => s.label === SUMMARY_LABEL);
  const summaryRows = (summary?.paras ?? [])
    .flatMap((p) => p.split("\n"))
    .map((l) => /^\[([^\]]+)\]\s*(.+)$/.exec(l.trim()))
    .filter((m) => m !== null)
    .map((m) => ({ label: m[1], text: m[2] }));

  if (state === "error" && !sections.length)
    return (
      <div className="mt-4">
        <p className="rounded-xl bg-seal/10 px-4 py-3 text-center text-sm text-seal">{error ?? w.stopped}</p>
        {fallback}
      </div>
    );

  // While it is being written nothing of it is shown: the report appears whole, as a finished document.
  if (state !== "done" && state !== "error") {
    const written = state === "writing" ? Math.max(0, parsed.sections.length - 1) : 0;
    return (
      <div className="doc-paper mt-4 px-5 py-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="size-6 animate-spin rounded-full border-2 border-seal/30 border-t-seal" aria-hidden="true" />
          <p className="font-myeongjo text-sm font-extrabold text-seal">{state === "loading" ? w.reading : w.writing}</p>
          <p className="text-xs text-ink-soft">{w.wait}</p>
        </div>
        {chapters.length > 0 && (
          <ol className="mt-5 flex flex-col gap-1.5 border-t border-seal/15 pt-4">
            {chapters.map((c, i) => {
              const done = i < written;
              return (
                <li key={i} className={`flex items-center gap-2.5 text-[13px] ${done ? "text-ink" : "text-ink-soft/70"}`}>
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center border font-myeongjo text-[11px] font-extrabold ${done ? "border-seal bg-seal text-hanji" : "border-ink/20"}`}
                  >
                    {hanjaNum(i + 1)}
                  </span>
                  <span className={done ? "font-bold" : ""}>{c}</span>
                  {done && <span className="ml-auto text-[11px] font-bold text-seal">{w.chapterDone}</span>}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      {sections.length > 0 && <p className="text-center text-xs text-ink-soft">{w.tap}</p>}
      {sections.map((s, i) => (
        // Closed by default: the headlines read as a table of contents, and each opens on a tap.
        <details key={i} className="group doc-paper px-5 py-4">
          <summary className="flex cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden">
            {/* Two characters (十一…) go on one line at a smaller size, so they stay inside the seal. */}
            <span
              className={`flex size-9 shrink-0 items-center justify-center border-2 border-seal/60 font-myeongjo font-extrabold whitespace-nowrap text-seal ${hanjaNum(i + 1).length > 1 ? "text-[15px] leading-none tracking-[-0.06em]" : ""}`}
            >
              {hanjaNum(i + 1)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-extrabold text-seal">{s.label}</span>
              <span className="block font-myeongjo text-[17px] leading-snug font-extrabold">{s.headline}</span>
            </span>
            <span className="mt-1 shrink-0 text-ink-soft transition group-open:rotate-180" aria-hidden="true">
              ▾
            </span>
          </summary>
          <div className="mt-3 border-t border-seal/15 pt-3">
            {/* The point box (v9): why, and what to do, under the headline (the answer), before the picture and the text. */}
            {(s.why || s.todo) && (
              <dl className="mb-4 grid grid-cols-[3.2rem_1fr] gap-x-2 gap-y-1.5 rounded-xl bg-seal/5 px-3.5 py-3 text-[14px] leading-snug ring-1 ring-seal/15">
                {s.why && (
                  <>
                    <dt className="text-[11.5px] font-extrabold text-seal">이유</dt>
                    <dd>{s.why}</dd>
                  </>
                )}
                {s.todo && (
                  <>
                    <dt className="text-[11.5px] font-extrabold text-seal">할 일</dt>
                    <dd className="font-bold">{s.todo}</dd>
                  </>
                )}
              </dl>
            )}
            {figures?.[i] && <div className="mb-4">{figures[i]}</div>}
            {s.paras.map((p, j) => (
              <p key={j} className="mt-4 text-[16px] leading-[1.85] tracking-[-0.005em] first:mt-0">
                {p}
              </p>
            ))}
            {ask && (
              <Link
                href={`/ask?draft=${encodeURIComponent(`${ask} ${i + 1}장 '${s.headline}'에서 더 여쭙고 싶어요. `)}`}
                onClick={() => trackEvent("to_ask", "chapter")}
                className="mt-4 flex items-center gap-2 rounded-xl border border-[#d4af5f]/60 bg-[#fbf6ea] px-3.5 py-2.5 text-[13px]"
              >
                <b className="font-myeongjo">이 장, 정 훈도에게 더 묻기</b>
                <span className="text-[11.5px] text-ink-soft">내 상황을 적어 보내면 답서로</span>
                <span className="ml-auto font-bold text-seal">→</span>
              </Link>
            )}
          </div>
        </details>
      ))}

      {summary && summaryRows.length > 0 && (
        <section ref={card} className="doc-paper mt-2 px-5 py-5">
          <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">한 눈 에</p>
          {summary.headline && <h3 className="mt-1 text-center font-myeongjo text-[17px] leading-snug font-extrabold">{summary.headline}</h3>}
          <dl className="mt-4 flex flex-col divide-y divide-seal/10">
            {summaryRows.map((r, i) => {
              const key = r.label.includes("소름");
              return (
                <div key={i} className={`flex flex-col gap-0.5 py-2.5 ${key ? "-mx-2 rounded-lg bg-seal/10 px-2" : ""}`}>
                  <dt className="text-[11px] font-extrabold text-seal">{r.label}</dt>
                  <dd className={`text-[15px] leading-relaxed ${key ? "font-bold" : ""}`}>{r.text}</dd>
                </div>
              );
            })}
          </dl>
          {save && <p className="mt-3 text-right font-myeongjo text-[11px] text-ink-soft">훈도사주 · 정 훈도</p>}
        </section>
      )}
      {save && summary && summaryRows.length > 0 && (
        <button
          type="button"
          onClick={keepCard}
          disabled={saving === "making"}
          className="rounded-2xl border-2 border-seal bg-white/70 py-3 font-myeongjo text-[15px] font-extrabold text-seal disabled:opacity-60"
        >
          {saving === "making" ? "만드는 중…" : "한눈에 카드 저장"}
        </button>
      )}
      {saving === "error" && <p className="text-center text-xs text-seal">카드를 만들지 못했어요. 화면을 캡처해 주세요.</p>}

      {(failed || state === "error") && sections.length > 0 && (
        <p className="rounded-xl bg-seal/10 px-4 py-3 text-center text-sm text-seal">{w.stoppedMidway}</p>
      )}
      {state === "done" && <p className="mt-2 text-right font-myeongjo text-sm text-ink-soft">{w.sign}</p>}
    </div>
  );
}
