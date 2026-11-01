import MeForm from "@/components/MeForm";
import Image from "next/image";
import { NIGHT_GOLD, NIGHT_PANEL } from "@/components/SinsalNight";
import { BOOK, imageOf, rareText } from "@/lib/sinsal";

// Five of the 20 types fanned out on the first screen, with their names as chips below.
const FAN = (["yeokma2", "dohwa", "hwagae3", "cheoneul", "goegang"] as const).map((id) => BOOK.find((c) => c.id === id)!);

// The 신살 유형 테스트 before a chart is entered: the header, a fan of types and the form. The same screen opens from a
// friend's link (app/s/[kind]/[token]), with only `band` on top and `next` carrying the link back.
export default function SinsalStart({ band, next = "/sinsal" }: { band?: React.ReactNode; next?: string }) {
  return (
    <>
      {band && <p className="mt-4 rounded-full border border-[#d4af5f]/50 bg-white/[0.06] px-4 py-2 text-center text-[13px] leading-snug text-hanji/90">{band}</p>}
      <SinsalHeader />
      <section className={`${NIGHT_PANEL} mt-4 px-4 pt-5 pb-5`}>
        <div className="relative mx-auto h-[150px] w-full max-w-[300px]" aria-hidden>
          {FAN.map((c, i) => (
            <div
              key={c.id}
              className="absolute top-3 left-1/2 w-[80px] overflow-hidden rounded-lg shadow-[0_0_0_1px_rgb(212_175_95/0.6),0_8px_18px_rgb(0_0_0/0.45)]"
              style={{ transform: `translateX(calc(-50% + ${(i - 2) * 44}px)) rotate(${(i - 2) * 8}deg)`, transformOrigin: "50% 120%", zIndex: i === 2 ? 5 : 4 - Math.abs(i - 2) }}
            >
              <Image src={imageOf(c, i % 2 ? "f" : "m")} alt="" width={184} height={230} className="h-auto w-full" />
            </div>
          ))}
        </div>
        <ul className="mt-2 flex flex-wrap justify-center gap-1.5">
          {FAN.map((c) => (
            <li key={c.id} className="rounded-full border border-[#d4af5f]/50 bg-white/[0.05] px-2.5 py-1 text-[12px] font-bold">
              {c.nick} <span className="font-normal text-hanji/55">{rareText(c).replace(" 약 ", " ")}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-[13.5px] leading-relaxed text-hanji/85">
          살은 사주 여덟 글자 위에 얹힌 표시예요.
          <br />
          20가지 가운데 <b className={NIGHT_GOLD}>가장 드문 살</b>이 내 유형이 돼요.
        </p>
      </section>
      <section className="card mt-4 px-5 pt-5 pb-6 text-ink">
        <MeForm next={next} submit="내 살 유형 보기" />
      </section>
    </>
  );
}

export function SinsalHeader() {
  return (
    <section className="pt-6 text-center">
      <p className="font-myeongjo text-sm font-extrabold tracking-[0.3em] text-[#d4af5f]">神 煞 · 신살 유형 테스트</p>
      <h1 className="mt-2 font-myeongjo text-[28px] font-extrabold">나는 어떤 살의 사람일까</h1>
      <p className="mt-2 text-[14.5px] leading-relaxed text-hanji/85">20가지 살 유형 중 나는 100명 중 몇 명일까</p>
      <p className="mt-1 text-xs text-hanji/55">무료 · 생년월일은 저장하지 않아요</p>
    </section>
  );
}
