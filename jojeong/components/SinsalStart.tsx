import MeForm from "@/components/MeForm";
import SinsalBoard from "@/components/SinsalBoard";
import { NIGHT_GOLD, NIGHT_PANEL } from "@/components/SinsalNight";

// The 신살 도감 before a chart is entered: the header, the empty book and the form. The same screen opens from a
// friend's link (app/s/[kind]/[token]), with only `band` on top and `next` carrying the link back.
export default function SinsalStart({ band, next = "/sinsal" }: { band?: React.ReactNode; next?: string }) {
  return (
    <>
      {band && <p className="mt-4 rounded-full border border-[#d4af5f]/50 bg-white/[0.06] px-4 py-2 text-center text-[13px] leading-snug text-hanji/90">{band}</p>}
      <SinsalHeader />
      <section className={`${NIGHT_PANEL} mt-4 px-4 pt-5 pb-5`}>
        <p className="text-center text-[13.5px] leading-relaxed text-hanji/85">
          살은 사주 여덟 글자 위에 얹힌 표시예요.
          <br />
          보통은 <b className={NIGHT_GOLD}>3~4장</b>, 100명 중 1.5명은 하나도 없어요.
        </p>
        <div className="mt-4">
          <SinsalBoard owned={new Set()} gender={null} />
        </div>
      </section>
      <section className="card mt-4 px-5 pt-5 pb-6 text-ink">
        <MeForm next={next} submit="내 카드 펼치기" />
      </section>
    </>
  );
}

export function SinsalHeader() {
  return (
    <section className="pt-6 text-center">
      <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-[#d4af5f]">神 煞 圖 鑑</p>
      <h1 className="mt-2 font-myeongjo text-3xl font-extrabold">신살 도감</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-hanji/85">나는 무슨 살을 타고났을까</p>
      <p className="mt-1 text-xs text-hanji/55">무료 · 도화일까, 역마일까, 아무 살도 없는 100명 중 1.5명일까</p>
    </section>
  );
}
