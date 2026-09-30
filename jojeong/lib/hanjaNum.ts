const DIGITS = "一二三四五六七八九";

// 1 → 一, 10 → 十, 13 → 十三, 20 → 二十. Chapter numbers of the longest reports (a 연운 has twelve, a 평생 사주 thirteen).
export function hanjaNum(n: number): string {
  if (n < 1) return String(n);
  if (n < 10) return DIGITS[n - 1];
  if (n < 20) return `十${n > 10 ? DIGITS[n - 11] : ""}`;
  if (n < 100) return `${DIGITS[Math.floor(n / 10) - 1]}十${n % 10 ? DIGITS[(n % 10) - 1] : ""}`;
  return String(n);
}
