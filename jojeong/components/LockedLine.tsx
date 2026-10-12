import Link from "next/link";

// The life report's chapters by number (lib/products.ts pyeongsaeng toc), for the locks on the free reading.
export const LIFE_CHAPTER = {
  who: [1, "나는 어떤 사람일까"],
  edge: [3, "내 사주의 무기와 약점"],
  people: [8, "사람 복: 나를 돕는 사람, 조심할 사람"],
  seasons: [10, "인생의 사계절"],
  now: [11, "지금 나는 인생의 어디쯤일까"],
  next: [12, "앞으로 10년, 꼭 잡아야 할 기회"],
} as const;
export type LifeChapter = keyof typeof LIFE_CHAPTER;

// Where the paid report goes on: which chapter of the life report tells what the free screen leaves out.
// No blurred stand-in text: one clean line that says where the rest is. `href` goes to the payment or the report.
export default function LockedLine({ href, chapter, className = "" }: { href: string; chapter: LifeChapter; className?: string }) {
  const [n, title] = LIFE_CHAPTER[chapter];
  return (
    <Link href={href} className={`mt-2 flex items-center gap-2 rounded-xl border border-seal/25 bg-seal/5 px-3 py-2 text-[12.5px] ${className}`}>
      <span aria-hidden="true">🔒</span>
      <span className="min-w-0 flex-1">
        <b className="text-seal">평생 사주 {n}장</b> · {title}
        <span className="block text-[11px] text-ink-soft">이유와 시기는 여기서 이어서 풀어 드려요</span>
      </span>
      <span aria-hidden="true" className="shrink-0 font-bold text-seal">
        →
      </span>
    </Link>
  );
}
