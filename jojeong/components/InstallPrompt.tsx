"use client";

import { useSyncExternalStore } from "react";

// "Add to home screen", in the way each phone allows it:
// - Chrome / Edge / Samsung on Android: the browser's own install dialog, opened from our button
//   (beforeinstallprompt). Without that event, the menu (⋮) path.
// - Safari on iPhone: no button is possible; the Share → Add to Home Screen steps.
// - In-app browsers (KakaoTalk, Instagram, TikTok…): they can't add at all; open in the real browser first.
// Hidden once installed (opened from the home screen) or dismissed in this browser.

type Lang = "ko" | "en";
type Mode = "hidden" | "button" | "ios" | "inapp" | "menu";
type Deferred = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const KEY = "install-dismissed";
let deferred: Deferred | null = null;
let closed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as Deferred;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    closed = true;
    notify();
  });
}

function modeNow(): Mode {
  if (closed) return "hidden";
  try {
    if (localStorage.getItem(KEY) === "1") return "hidden";
  } catch {}
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  if (standalone) return "hidden";
  const ua = navigator.userAgent;
  if (/KAKAOTALK|Instagram|FBAN|FBAV|Line\/|NAVER|TikTok|musical_ly|BytedanceWebview|Threads/i.test(ua)) return "inapp";
  if (deferred) return "button";
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(ua)) return "menu";
  return "hidden"; // desktop: not worth a card
}

const TEXT = {
  ko: {
    title: "홈 화면에 훈도 두기",
    sub: "앱처럼 바로 열려요. 설치도, 용량도 필요 없어요.",
    add: "홈 화면에 추가",
    ios: ["화면 아래(또는 위) 공유 버튼 ⬆️ 누르기", "'홈 화면에 추가' 누르기", "오른쪽 위 '추가' 누르기"],
    inapp: "카카오톡·인스타 같은 앱 안에서는 추가가 안 돼요. 오른쪽 위 ⋮ 또는 ··· 메뉴에서 '다른 브라우저로 열기'를 누른 뒤 추가해 주세요.",
    menu: "브라우저 오른쪽 위 ⋮ 메뉴에서 '홈 화면에 추가' 또는 '앱 설치'를 눌러 주세요.",
    close: "닫기",
  },
  en: {
    title: "Keep Hundo on your home screen",
    sub: "Opens like an app. Nothing to download.",
    add: "Add to Home Screen",
    ios: ["Tap the Share button ⬆️", "Tap “Add to Home Screen”", "Tap “Add”"],
    inapp: "Apps like Instagram and TikTok can’t add pages to your home screen. Open this page in your browser (⋯ menu → Open in browser), then add it.",
    menu: "Open your browser menu ⋮ and tap “Add to Home screen” or “Install app”.",
    close: "Close",
  },
} as const;

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export default function InstallPrompt({ lang = "ko", className = "" }: { lang?: Lang; className?: string }) {
  const mode = useSyncExternalStore(subscribe, modeNow, () => "hidden" as Mode);
  if (mode === "hidden") return null;
  const t = TEXT[lang];
  const close = () => {
    closed = true;
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    notify();
  };
  return (
    <aside className={`relative rounded-xl border border-ink/15 bg-white/60 px-4 py-3.5 ${className}`}>
      <button type="button" onClick={close} aria-label={t.close} className="absolute top-2 right-2 px-2 text-lg leading-none text-ink-soft">
        ×
      </button>
      <div className="flex items-center gap-3 pr-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- a 48px icon */}
        <img src="/icons/icon-192.png" alt="" width={44} height={44} className="shrink-0 rounded-[10px] shadow-sm" />
        <div>
          <p className="font-myeongjo text-[15px] leading-tight font-extrabold">{t.title}</p>
          <p className="mt-0.5 text-[12px] text-ink-soft">{t.sub}</p>
        </div>
      </div>
      {mode === "button" && (
        <button
          type="button"
          onClick={async () => {
            const d = deferred;
            if (!d) return;
            await d.prompt();
            const { outcome } = await d.userChoice;
            deferred = null;
            if (outcome === "accepted") closed = true;
            notify();
          }}
          className="mt-3 w-full rounded-full bg-seal px-4 py-2.5 text-[14px] font-bold text-hanji"
        >
          {t.add}
        </button>
      )}
      {mode === "ios" && (
        <ol className="mt-3 flex flex-col gap-1 text-[13px]">
          {t.ios.map((step, i) => (
            <li key={step} className="flex gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-seal text-[11px] font-bold text-hanji">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      )}
      {mode === "inapp" && <p className="mt-3 text-[13px] leading-relaxed">{t.inapp}</p>}
      {mode === "menu" && <p className="mt-3 text-[13px] leading-relaxed">{t.menu}</p>}
    </aside>
  );
}
