// Where a visitor first came from, kept in this browser (a cookie, so the server sees it when an order is made)
// and written on the order, so the owner can tell which road the paying readers came by. One word, nothing about
// the person. The road is read once, on the first visit: the page they landed on, then the app they opened it in
// (Instagram, Threads and 카카오톡 name themselves in the browser's user agent), then the site that sent them.
export const SOURCES = ["game", "instagram", "threads", "search", "kakao", "other", "direct"] as const;
export type Source = (typeof SOURCES)[number];
export const isSource = (v: unknown): v is Source => SOURCES.includes(v as Source);
export const SOURCE_LABEL: Record<Source, string> = {
  game: "왕이 될 사주 (친구 초대)",
  instagram: "인스타그램",
  threads: "스레드",
  search: "검색 (구글·네이버)",
  kakao: "카카오톡",
  other: "다른 사이트",
  direct: "직접 · 알 수 없음",
};
export const SRC_COOKIE = "jj_src";

export function classify({ path, referrer, ua, query }: { path: string; referrer: string; ua: string; query: string }): Source {
  // An invitation to a court is the game spreading, whatever app it was opened in.
  if (path.startsWith("/court/")) return "game";
  const tag = new URLSearchParams(query).get("utm_source")?.toLowerCase() ?? "";
  if (/^(ig|insta)/.test(tag)) return "instagram";
  if (tag.startsWith("thread")) return "threads";
  if (/Instagram/i.test(ua)) return "instagram";
  // Threads' in-app browser goes by its code name.
  if (/Barcelona/i.test(ua)) return "threads";
  let host = "";
  try {
    host = referrer ? new URL(referrer).hostname : "";
  } catch {}
  if (/instagram\.com$/.test(host)) return "instagram";
  if (/threads\.(net|com)$/.test(host)) return "threads";
  if (/(^|\.)(google|naver|daum|bing)\./.test(host)) return "search";
  if (/KAKAOTALK/i.test(ua) || /kakao/.test(host)) return path.startsWith("/king") ? "game" : "kakao";
  if (path.startsWith("/king")) return "game";
  if (host && !/hundosaju\.com$/.test(host)) return "other";
  return "direct";
}
