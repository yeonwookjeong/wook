import PayButton from "@/components/PayButton";
import { CREDIT_PACKS, type CreditPack } from "@/lib/products";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

// Questions to buy, as three slips in the hall's gold, the middle one marked (app/ask and the room's question bar).
// `buy`: false before signing in — the prices only (questions are bought by a member).
export default function CreditSlips({ buy = true }: { buy?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center text-hanji">
      {(Object.keys(CREDIT_PACKS).map(Number) as CreditPack[]).map((n) => (
        <div
          key={n}
          className={`relative flex flex-col rounded-xl px-1.5 pt-3.5 pb-2 ${n === 3 ? "bg-[#e2bc68]/15 ring-2 ring-[#e2bc68]" : "bg-white/[0.04] ring-1 ring-[#e2bc68]/30"}`}
        >
          {n === 3 && (
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#e2bc68] px-2 py-0.5 text-[11px] font-extrabold whitespace-nowrap text-[#17304a]">
              추천
            </span>
          )}
          <span className="font-myeongjo text-[13px] text-hanji/75">질문</span>
          <b className="font-myeongjo text-[28px] leading-none text-[#e2bc68]">{n}</b>
          <span className="mt-1.5 text-[13px] font-bold">{won(CREDIT_PACKS[n])}</span>
          {buy && (
            <PayButton
              request={{ credits: String(n) }}
              label="채우기"
              className={`mt-2.5 w-full rounded-lg py-2 font-myeongjo text-[14px] font-extrabold disabled:opacity-60 ${n === 3 ? "bg-[#e2bc68] text-[#17304a]" : "border border-[#e2bc68]/60 text-[#e2bc68]"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
