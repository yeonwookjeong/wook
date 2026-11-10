import raw from "../data/items.json";
import type { Category } from "../site.config";

// One card, whatever its kind. Collectors (scripts/collect.mjs) and hand-written entries share this shape.
export type Item = {
  id: string; // "<source>-<their id>", unique across sources
  category: Category;
  title: string;
  org: string;
  summary: string;
  benefit: string; // shown as is: "상금 총 800만원", "여행경비 50% 환급(최대 10만원)", "정규직 3명"
  valueKrw: number | null; // money worth in won, for sorting by amount; null when unknown
  regions: string[]; // "전국" or 시·도 short names
  ages: { min: number | null; max: number | null } | null;
  method: "first_come" | "lottery" | "screening" | null;
  effort: 1 | 2 | 3 | null; // how much work applying takes
  start: string | null; // YYYY-MM-DD
  end: string | null; // YYYY-MM-DD; null = 상시
  url: string; // the official notice
  tags: string[];
  hook: string; // one line on why it is worth a look; written or checked by a person
  pick: boolean; // pinned by hand above the score order
  updated: string; // YYYY-MM-DD, when the facts were last checked against the notice
  sample?: boolean; // placeholder data; the site says so wherever one is shown
};

// Hand-written and sample cards (items.json) plus whatever the collectors wrote (data/collected/*.json).
const collected = Object.values(
  import.meta.glob<{ default: Item[] }>("../data/collected/*.json", { eager: true }),
).flatMap((m) => m.default);

// Hand-written entries win over collected ones with the same id (a person checked them).
const byId = new Map<string, Item>();
for (const it of [...collected, ...(raw as Item[])]) byId.set(it.id, it);
export const items = [...byId.values()];

const KST = 9 * 60 * 60 * 1000;
// Today in Korea as YYYY-MM-DD, for the build machine (UTC) and visitors alike.
export const todayKst = (now = Date.now()) => new Date(now + KST).toISOString().slice(0, 10);

// Days left until the deadline (0 = closes today), null for 상시.
export function daysLeft(end: string | null, today = todayKst()): number | null {
  if (!end) return null;
  return Math.round((Date.parse(end) - Date.parse(today)) / 86_400_000);
}

export const isOpen = (it: Item, today = todayKst()) => {
  const d = daysLeft(it.end, today);
  return d === null || d >= 0;
};

// Score order: pinned first, then closing soon, worth more, easier to apply.
export function score(it: Item, today = todayKst()): number {
  let s = it.pick ? 1000 : 0;
  const d = daysLeft(it.end, today);
  if (d !== null && d <= 7) s += 30 - d * 2;
  if (it.valueKrw) s += Math.min(25, Math.log10(it.valueKrw) * 3);
  if (it.effort) s += (3 - it.effort) * 5;
  if (it.method === "first_come") s += 5;
  return s;
}

export function openItems(category?: Category, today = todayKst()) {
  return items
    .filter((it) => (!category || it.category === category) && isOpen(it, today))
    .sort((a, b) => score(b, today) - score(a, today));
}

export const methodLabel = { first_come: "선착순", lottery: "추첨", screening: "심사" } as const;

export const regionList = ["전국", "서울", "경기", "인천", "강원", "충북", "충남", "대전", "세종", "전북", "전남", "광주", "경북", "경남", "대구", "울산", "부산", "제주"];
