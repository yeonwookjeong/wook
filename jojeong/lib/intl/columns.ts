import { EN_COLUMNS } from "./en-columns";
import { JA_COLUMNS } from "./ja-columns";

// 훈도의 사주 이야기 abroad (2026-11-16, 대표님 "영어랑 일본어 얼른 구축하자"): the Korean columns rewritten for
// readers new to saju, not translated line by line. Same rule as lib/columns.ts: a column teaches the concepts
// freely and never shows what the paid readings do. `ko` names the Korean column it grew from.

export type Lang = "en" | "ja";

export type IntlBlock =
  | { t: "p"; text: string }
  | { t: "h2"; text: string }
  | { t: "list"; items: string[] }
  | { t: "qa"; q: string; a: string }
  | { t: "term"; k: string; v: string };

export type IntlColumn = {
  slug: string;
  // The Korean column it grew from; for a culture piece written only for readers abroad, the key shared by its
  // English and Japanese versions, with `noKo` set so no Korean hreflang is claimed.
  ko: string;
  noKo?: true;
  title: string;
  summary: string;
  // YYYY-MM-DD (KST), the day it goes public.
  date: string;
  points: string[];
  body: IntlBlock[];
};

const ALL: Record<Lang, IntlColumn[]> = { en: EN_COLUMNS, ja: JA_COLUMNS };

const kstToday = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
export const isLive = (c: IntlColumn) => c.date <= kstToday();
export const intlColumns = (lang: Lang) => ALL[lang].filter(isLive).sort((a, b) => (a.date < b.date ? 1 : -1));
export const intlColumn = (lang: Lang, slug: string) => ALL[lang].find((c) => c.slug === slug);
// The same article in the other language, for hreflang.
export const sibling = (from: Lang, slug: string, to: Lang) => {
  const ko = intlColumn(from, slug)?.ko;
  return ko ? ALL[to].find((c) => c.ko === ko && isLive(c)) : undefined;
};

// The words around an article, per language.
export const UI: Record<Lang, { guides: string; guidesLine: string; youWill: string; inShort: string; more: string; next: string; nextLine: string; nextCta: string; all: string; locale: string }> = {
  en: {
    guides: "Saju guides",
    guidesLine: "Plain-English guides to saju, the Korean four pillars of destiny.",
    youWill: "In this guide",
    inShort: "In short",
    more: "More guides",
    next: "Your own chart",
    nextLine: "Readings in English open soon. Start with your Korean name, chosen from your birth chart, free.",
    nextCta: "Get your Korean name, free",
    all: "← All guides",
    locale: "en_US",
  },
  ja: {
    guides: "四柱推命コラム",
    guidesLine: "韓国の四柱推命「サジュ」を、はじめての方にもわかる言葉で。",
    youWill: "この記事でわかること",
    inShort: "ひとことで",
    more: "ほかのコラム",
    next: "あなたの命式",
    nextLine: "日本語の鑑定はまもなく公開します。それまでコラムで、サジュの基本をのぞいてみてください。",
    nextCta: "鑑定メニューを見る",
    all: "← コラム一覧",
    locale: "ja_JP",
  },
};
