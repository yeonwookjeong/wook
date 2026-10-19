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
  // Search apps open results in their own browser and often send no referrer.
  if (/NAVER\(inapp|DaumApps|DaumDevice|Whale\/.*NAVER/i.test(ua)) return "search";
  if (/KAKAOTALK/i.test(ua) || /kakao/.test(host)) return path.startsWith("/king") ? "game" : "kakao";
  if (path.startsWith("/king")) return "game";
  if (host && !/hundosaju\.com$/.test(host)) return "other";
  return "direct";
}

// For a visit that came out as "direct": what kind of browser it was, so the owner can tell a typed address from
// an app's own browser that hid where it came from. A family name only, never the user agent itself.
export const DIRECT_KINDS = ["ios-safari", "ios-chrome", "ios-app", "android-chrome", "android-app", "samsung", "facebook", "line", "band", "x", "desktop", "bot", "unknown"] as const;
export type DirectKind = (typeof DIRECT_KINDS)[number];
export const DIRECT_KIND_LABEL: Record<DirectKind, string> = {
  "ios-safari": "아이폰 사파리 (주소 입력·복사 붙여넣기·즐겨찾기)",
  "ios-chrome": "아이폰 크롬",
  "ios-app": "아이폰 앱 안 브라우저 (이름 없는 앱)",
  "android-chrome": "안드로이드 크롬",
  "android-app": "안드로이드 앱 안 브라우저 (이름 없는 앱)",
  samsung: "삼성 인터넷",
  facebook: "페이스북·메신저",
  line: "라인",
  band: "밴드",
  x: "X (트위터)",
  desktop: "PC",
  bot: "검색 로봇·미리보기",
  unknown: "알 수 없음",
};
export const isDirectKind = (v: unknown): v is DirectKind => DIRECT_KINDS.includes(v as DirectKind);
export function directKind(ua: string): DirectKind {
  if (/bot|crawl|spider|preview|HeadlessChrome/i.test(ua)) return "bot";
  if (/FBAN|FBAV|FB_IAB|Messenger/i.test(ua)) return "facebook";
  if (/\bLine\//i.test(ua)) return "line";
  if (/BAND\//.test(ua)) return "band";
  if (/Twitter/i.test(ua)) return "x";
  if (/iPhone|iPad|iPod/.test(ua)) {
    if (/CriOS/.test(ua)) return "ios-chrome";
    // An app's own browser on iOS leaves out the "Safari/" token.
    return /Safari\//.test(ua) ? "ios-safari" : "ios-app";
  }
  if (/Android/.test(ua)) {
    if (/SamsungBrowser/.test(ua)) return "samsung";
    // Android's in-app browsers mark themselves "; wv)".
    if (/; wv\)/.test(ua)) return "android-app";
    return /Chrome\//.test(ua) ? "android-chrome" : "unknown";
  }
  if (/Windows|Macintosh|X11|CrOS/.test(ua)) return "desktop";
  return "unknown";
}
