import Link from "next/link";
import { WORRIES, worryHref } from "@/lib/worries";

// 고민별 카드: the shelf shows what a 질문 is for. `dark` for the ask hall, light for the reports shelf.
export default function WorryCards({ dark = false }: { dark?: boolean }) {
  return (
    <ul className="mt-3 grid grid-cols-2 gap-2.5">
      {WORRIES.map((w, i) => (
        <li key={w.id} className={i === WORRIES.length - 1 ? "col-span-2" : ""}>
          <Link
            href={worryHref(w)}
            prefetch={false}
            className={
              dark
                ? "flex h-full flex-col rounded-xl bg-white/[0.05] px-3.5 py-3 text-hanji ring-1 ring-[#e2bc68]/30"
                : "flex h-full flex-col rounded-xl bg-gradient-to-b from-[#222d3b] to-[#1a232f] px-3.5 py-3 text-hanji shadow-[inset_0_0_0_1px_rgb(212_175_95/0.35)]"
            }
          >
            <b className="font-myeongjo text-[15.5px] leading-snug">{w.title}</b>
            <span className="mt-0.5 text-[11.5px] leading-snug text-hanji/65">{w.line}</span>
            <span className="mt-auto pt-2 text-right font-myeongjo text-[12.5px] font-extrabold text-[#e2bc68]">묻기 →</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
