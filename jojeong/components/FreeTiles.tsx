import Link from "next/link";

// Free things, a step lighter than the 쪽빛 boxes of the reports on sale: paper tiles, two to a row, the seal
// faint and the lines in 쪽빛. Used on the main page and under 전체 보고서.
export type FreeTile = { href: string; hanja: string; title: string; line: string; tag: string };

export default function FreeTiles({ tiles, className = "" }: { tiles: FreeTile[]; className?: string }) {
  return (
    <ul className={`grid grid-cols-2 gap-2.5 ${className}`}>
      {tiles.map((t) => (
        <li key={t.href}>
          <Link href={t.href} className="doc-paper flex h-full flex-col rounded-2xl px-4 pt-4 pb-3.5">
            <span className="flex items-center justify-between gap-1">
              <span className="font-myeongjo text-lg text-jjok/60">{t.hanja}</span>
              <span className="shrink-0 rounded-full border border-jjok/20 px-2 py-0.5 text-[10px] font-bold text-jjok/70">{t.tag} · 무료</span>
            </span>
            <b className="mt-2 font-myeongjo text-[16px] leading-tight">{t.title}</b>
            <span className="mt-1 flex-1 text-[12px] leading-snug text-ink-soft">{t.line}</span>
            <span className="mt-2 text-right text-[12px] font-bold text-jjok">해 보기 →</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
