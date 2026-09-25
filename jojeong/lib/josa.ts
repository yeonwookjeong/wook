const PAIRS = { "이/가": ["이", "가"], "을/를": ["을", "를"], "과/와": ["과", "와"], "은/는": ["은", "는"], "이래/래": ["이래", "래"], "이라/라": ["이라", "라"], "이었다/였다": ["이었다", "였다"] } as const;

export function josa(word: string, pair: keyof typeof PAIRS) {
  const hangul = [...word].reverse().find((c) => c >= "가" && c <= "힣");
  const hasFinal = hangul ? (hangul.charCodeAt(0) - 0xac00) % 28 !== 0 : false;
  return word + PAIRS[pair][hasFinal ? 0 : 1];
}
