import Image from "next/image";
import { BOOK, imageOf, type SinsalId } from "@/lib/sinsal";

// The book of 20: the cards held in colour, the rest a faint silhouette on the night. `locked` keeps even the
// held ones hidden (a friend's link before the reader enters their own chart).
export default function SinsalBoard({ owned, gender, locked = false }: { owned: Set<SinsalId>; gender: "m" | "f" | null; locked?: boolean }) {
  return (
    <ul className="grid grid-cols-5 gap-1.5">
      {BOOK.map((c, i) => {
        const on = owned.has(c.id);
        const shown = on && !locked;
        return (
          <li key={c.id} className={`relative aspect-[4/5] overflow-hidden rounded-md bg-[#162b44] ${on ? "ring-2 ring-[#d4af5f]" : "ring-1 ring-white/10"}`}>
            <Image
              src={imageOf(c, gender ?? (i % 2 ? "f" : "m"))}
              alt={shown ? c.sal : "아직 모르는 카드"}
              width={160}
              height={200}
              className={`h-full w-full object-cover object-top ${shown ? "" : on ? "blur-[5px]" : "opacity-25 blur-[2px] grayscale"}`}
            />
            {!shown && <span className="absolute inset-0 grid place-items-center font-myeongjo text-xl font-extrabold text-[#d4af5f]/70">?</span>}
            {shown && <span className="absolute inset-x-0 bottom-0 bg-black/55 py-px text-center text-[9.5px] leading-tight text-white">{c.sal}</span>}
          </li>
        );
      })}
    </ul>
  );
}
