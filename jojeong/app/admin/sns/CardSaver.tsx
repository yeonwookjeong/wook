"use client";

import { useRef, useState } from "react";
import { toBlob } from "html-to-image";

// The day's cards as real 1080×1440 PNGs, made in the browser from the slides drawn above them (each one a
// [data-card] frame), then handed to the phone's share sheet ("이미지 n개 저장") or downloaded. The fonts
// are inlined first, only the faces the cards use, so the image reads the same as the page.
const dataUrls = new Map<string, Promise<string>>();
function dataUrl(url: string) {
  if (!dataUrls.has(url))
    dataUrls.set(
      url,
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`${r.status} ${url}`);
          return r.blob();
        })
        .then((b) => new Promise<string>((ok, no) => {
          const fr = new FileReader();
          fr.onload = () => ok(String(fr.result));
          fr.onerror = () => no(fr.error);
          fr.readAsDataURL(b);
        })),
    );
  return dataUrls.get(url)!;
}

// "U+AC00-D7A3, U+0041" → does any of the code points fall inside?
function inRange(range: string, points: Set<number>) {
  if (!range) return true;
  return range.split(",").some((part) => {
    const [a, b] = part.trim().replace(/^U\+/i, "").split("-");
    if (a.includes("?")) {
      const lo = parseInt(a.replace(/\?/g, "0"), 16);
      const hi = parseInt(a.replace(/\?/g, "F"), 16);
      return [...points].some((p) => p >= lo && p <= hi);
    }
    const lo = parseInt(a, 16);
    const hi = b ? parseInt(b, 16) : lo;
    return [...points].some((p) => p >= lo && p <= hi);
  });
}

async function fontRules(): Promise<{ rule: CSSFontFaceRule; base: string }[]> {
  const out: { rule: CSSFontFaceRule; base: string }[] = [];
  for (const sheet of [...document.styleSheets]) {
    const base = sheet.href ?? location.href;
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      // A stylesheet from another site (the Pretendard CDN): read it again by fetch, which its CORS allows.
      if (!sheet.href) continue;
      try {
        const css = await fetch(sheet.href).then((r) => r.text());
        const copy = new CSSStyleSheet();
        copy.replaceSync(css.replace(/@import[^;]+;/g, ""));
        rules = copy.cssRules;
      } catch {
        continue;
      }
    }
    for (const r of [...rules]) if (r instanceof CSSFontFaceRule) out.push({ rule: r, base });
  }
  return out;
}

async function fontCss(nodes: HTMLElement[]) {
  const families = new Set<string>();
  const points = new Set<number>();
  for (const n of nodes) {
    for (const ch of n.textContent ?? "") points.add(ch.codePointAt(0)!);
    for (const el of [n, ...n.querySelectorAll<HTMLElement>("*")])
      for (const f of getComputedStyle(el).fontFamily.split(",")) families.add(f.trim().replace(/^["']|["']$/g, ""));
  }
  const used = (await fontRules()).filter(
    ({ rule }) => families.has(rule.style.getPropertyValue("font-family").trim().replace(/^["']|["']$/g, "")) && inRange(rule.style.getPropertyValue("unicode-range"), points),
  );
  const css = await Promise.all(
    used.map(async ({ rule, base }) => {
      let text = rule.cssText;
      for (const m of [...text.matchAll(/url\((['"]?)([^'")]+)\1\)/g)]) {
        if (m[2].startsWith("data:")) continue;
        text = text.replace(m[0], `url(${await dataUrl(new URL(m[2], base).href)})`);
      }
      return text;
    }),
  );
  return css.join("\n");
}

type State = { kind: "idle" } | { kind: "making"; done: number } | { kind: "ready"; files: File[]; urls: string[] } | { kind: "error"; message: string };

export default function CardSaver({ date, count, children }: { date: string; count: number; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>({ kind: "idle" });

  async function make() {
    const nodes = [...(box.current?.querySelectorAll<HTMLElement>("[data-card]") ?? [])];
    if (!nodes.length) return;
    setState({ kind: "making", done: 0 });
    try {
      await document.fonts.ready;
      const fontEmbedCSS = await fontCss(nodes);
      const opts = {
        width: 1080,
        height: 1440,
        pixelRatio: 1,
        fontEmbedCSS,
        style: { position: "relative", inset: "auto", left: "0", top: "0", zIndex: "auto" },
      };
      // Safari draws the first pass before the inlined images and fonts decode; a throwaway pass first.
      await toBlob(nodes[0], opts).catch(() => null);
      const files: File[] = [];
      for (const [i, n] of nodes.entries()) {
        const blob = await toBlob(n, opts);
        if (!blob) throw new Error("이미지를 만들지 못했어요");
        files.push(new File([blob], `hundosaju-${date}-${i + 1}.png`, { type: "image/png" }));
        setState({ kind: "making", done: i + 1 });
      }
      setState({ kind: "ready", files, urls: files.map((f) => URL.createObjectURL(f)) });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  async function save(files: File[], urls: string[]) {
    if (navigator.canShare?.({ files })) {
      try {
        await navigator.share({ files });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    // No share sheet (a computer): download them one by one.
    for (const [i, url] of urls.entries()) {
      const a = document.createElement("a");
      a.href = url;
      a.download = files[i].name;
      a.click();
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return (
    <div>
      <div ref={box} className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
        {children}
      </div>
      <div className="mt-3">
        {state.kind === "ready" ? (
          <>
            <button type="button" onClick={() => save(state.files, state.urls)} className="w-full rounded-xl bg-seal py-3 text-sm font-bold text-white">
              앨범에 저장 ({state.files.length}장)
            </button>
            <p className="mt-2 text-center text-[11px] text-ink-soft">저장 창이 안 뜨면 아래 이미지를 길게 눌러 하나씩 저장하세요</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {state.urls.map((u, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={u} src={u} alt={`${i + 1}번 카드`} className="w-full rounded border border-seal/20" />
              ))}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={make}
            disabled={state.kind === "making"}
            className="w-full rounded-xl border border-seal bg-white/70 py-3 text-sm font-bold text-seal disabled:opacity-60"
          >
            {state.kind === "making" ? `이미지 만드는 중… ${state.done}/${count}` : `카드 이미지 ${count}장 만들기`}
          </button>
        )}
        {state.kind === "error" && <p className="mt-2 text-center text-xs text-seal">만들지 못했어요: {state.message}</p>}
      </div>
    </div>
  );
}
