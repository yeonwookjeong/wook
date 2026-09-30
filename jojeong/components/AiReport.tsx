"use client";

import { useEffect, useRef, useState } from "react";

type Section = { label: string; headline: string; paras: string[] };

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
    wait: "처음 한 번만 1~2분 걸리고, 다음부터는 바로 열려요.",
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
    wait: "처음 한 번만 1~2분 걸리고, 다음부터는 바로 열리옵니다.",
    sign: "— 관상감 명과학 훈도 정가, 삼가 적음",
    tap: "제목을 누르시면 풀이가 펼쳐지옵니다",
  },
};

// "## [장 이름] 헤드라인" + paragraphs → sections. Works on partial text while it streams in.
function parse(text: string): { sections: Section[]; failed: boolean } {
  const failed = text.includes(MARK_ERROR);
  const body = text.replace(MARK_ERROR, "");
  const sections: Section[] = [];
  for (const chunk of body.split(/^##\s+/m).slice(1)) {
    const [head, ...rest] = chunk.split("\n");
    const m = /^\[([^\]]+)\]\s*(.*)$/.exec(head.trim());
    sections.push({
      label: m ? m[1] : "",
      headline: (m ? m[2] : head).trim(),
      paras: rest
        .join("\n")
        .split(/\n\s*\n/)
        .map((p) => p.replace(/\*\*/g, "").trim())
        .filter(Boolean),
    });
  }
  return { sections, failed };
}

// A report written by 정 훈도 (lib/reportWriter.ts): fetched once, rendered chapter by chapter as it arrives.
export default function AiReport({
  request,
  chapters,
  fallback,
  modern = false,
}: {
  request: Record<string, string>;
  chapters: string[];
  fallback?: React.ReactNode;
  modern?: boolean;
}) {
  const w = WORDS[modern ? "modern" : "joseon"];
  const [text, setText] = useState("");
  const [state, setState] = useState<"loading" | "writing" | "done" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const body = JSON.stringify(request);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const res = await fetch("/api/report", { method: "POST", headers: { "content-type": "application/json" }, body });
        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          setError(data.error ?? w.failed);
          setState("error");
          return;
        }
        setState(res.headers.get("x-report") === "cached" ? "done" : "writing");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let all = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          all += decoder.decode(value, { stream: true });
          setText(all);
        }
        setState(all.includes(MARK_ERROR) ? "error" : "done");
      } catch {
        setError(w.cut);
        setState("error");
      }
    })();
    // w only changes with `modern`, which never changes for one report.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body]);

  const { sections, failed } = parse(text);

  if (state === "error" && !sections.length)
    return (
      <div className="mt-4">
        <p className="rounded-xl bg-seal/10 px-4 py-3 text-center text-sm text-seal">{error ?? w.stopped}</p>
        {fallback}
      </div>
    );

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
            {s.paras.map((p, j) => (
              <p key={j} className="mt-4 text-[16px] leading-[1.85] tracking-[-0.005em] first:mt-0">
                {p}
              </p>
            ))}
          </div>
        </details>
      ))}

      {state !== "done" && state !== "error" && (
        <div className="doc-paper flex flex-col items-center gap-2 px-5 py-6 text-center">
          <span className="size-6 animate-spin rounded-full border-2 border-seal/30 border-t-seal" aria-hidden="true" />
          <p className="font-myeongjo text-sm font-extrabold text-seal">
            {state === "loading" ? w.reading : `${w.writing} (${Math.min(sections.length, chapters.length)}/${chapters.length}장)`}
          </p>
          <p className="text-xs text-ink-soft">{w.wait}</p>
        </div>
      )}
      {(failed || state === "error") && sections.length > 0 && (
        <p className="rounded-xl bg-seal/10 px-4 py-3 text-center text-sm text-seal">{w.stoppedMidway}</p>
      )}
      {state === "done" && <p className="mt-2 text-right font-myeongjo text-sm text-ink-soft">{w.sign}</p>}
    </div>
  );
}
