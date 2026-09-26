const PAIRS = { "이/가": ["이", "가"], "을/를": ["을", "를"], "과/와": ["과", "와"], "은/는": ["은", "는"], "이래/래": ["이래", "래"], "이라/라": ["이라", "라"], "이었다/였다": ["이었다", "였다"] } as const;

export function josa(word: string, pair: keyof typeof PAIRS | "으로/로") {
  const hangul = [...word].reverse().find((c) => c >= "가" && c <= "힣");
  const final = hangul ? (hangul.charCodeAt(0) - 0xac00) % 28 : 0;
  // 으로/로 treats a final ㄹ like no final at all (서울로, 달로).
  if (pair === "으로/로") return word + (final !== 0 && final !== 8 ? "으로" : "로");
  return word + PAIRS[pair][final !== 0 ? 0 : 1];
}
