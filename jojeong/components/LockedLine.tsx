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

// A line held back for the paid report: a blurred stand-in (never the real sentence, so nothing is in the page to
// unblur) and, over it, which chapter of the life report tells it. `href` goes to the payment or the report page.
export default function LockedLine({ href, chapter, className = "" }: { href: string; chapter: LifeChapter; className?: string }) {
  const [n, title] = LIFE_CHAPTER[chapter];
  return (
    <Link href={href} className={`relative mt-1 block overflow-hidden rounded-lg ${className}`}>
      <span aria-hidden="true" className="block text-[13px] leading-snug blur-[4px] select-none">
        이 시기에 어떤 일이 생기고 무엇을 준비하면 좋은지 자세히 풀어 드려요
      </span>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-full border border-seal/30 bg-hanji/95 px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap text-seal">
          🔒 평생 사주 {n}장 · {title}
        </span>
      </span>
    </Link>
  );
}
