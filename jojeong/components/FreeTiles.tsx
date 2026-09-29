import Link from "next/link";

// Free things, drawn apart from the paper cards of the reports on sale: night-blue tiles, two to a row, in the
// look of the site's own hero. Used on the main page and under 전체 보고서.
export type FreeTile = { href: string; hanja: string; title: string; line: string; tag: string };

export default function FreeTiles({ tiles, className = "" }: { tiles: FreeTile[]; className?: string }) {
  return (
    <ul className={`grid grid-cols-2 gap-2.5 ${className}`}>
      {tiles.map((t) => (
        <li key={t.href}>
          <Link href={t.href} className="flex h-full flex-col rounded-2xl bg-[#17304a] px-4 pt-4 pb-3.5 text-hanji shadow-[0_4px_0_#0f2236]">
            <span className="flex items-center justify-between gap-1">
              <span className="font-myeongjo text-2xl text-gold">{t.hanja}</span>
              <span className="shrink-0 rounded-full border border-gold/50 px-2 py-0.5 text-[10px] font-bold text-gold">{t.tag} · 무료</span>
            </span>
            <b className="mt-2 font-myeongjo text-[17px] leading-tight">{t.title}</b>
            <span className="mt-1 flex-1 text-[12px] leading-snug text-hanji/75">{t.line}</span>
            <span className="mt-2 text-right text-[12px] font-bold text-gold">해 보기 →</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
