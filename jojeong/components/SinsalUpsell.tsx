import type { Card } from "@/lib/sinsal";
import { NIGHT_GOLD, NIGHT_PANEL } from "./SinsalNight";
import TrackLink from "./TrackLink";

// Right under the type: the report that answers what this 살 makes one wonder about (도화 → 인연, 역마 → 일, …).
// Counted as a step out of the 신살 page (to:sinsal). No price on the card; the report page shows it.
const PICKS: Record<string, { href: string; seal: string; title: string; line: string }> = {
  dohwa: { href: "/reports/yeonae", seal: "緣", title: "도화가 있는 사람의 인연은 언제 오나", line: "연애·결혼 보고서 · 내 사주로 보는 인연의 때와 사람" },
  hongyeom: { href: "/reports/yeonae", seal: "緣", title: "볼수록 끌리는 매력, 어떤 인연으로 이어지나", line: "연애·결혼 보고서 · 내 사주로 보는 인연의 때와 사람" },
  yeokma: { href: "/reports/jikup", seal: "業", title: "움직여야 풀리는 사주, 어떤 일이 맞나", line: "직업·적성 보고서 · 맞는 일과 일하는 방식" },
  hwagae: { href: "/reports/jikup", seal: "業", title: "혼자 깊어지는 재주, 어디에 쓰면 빛나나", line: "직업·적성 보고서 · 맞는 일과 일하는 방식" },
  munchang: { href: "/reports/jikup", seal: "業", title: "말과 글이 무기인 사주, 어떤 일에서 이름이 나나", line: "직업·적성 보고서 · 맞는 일과 일하는 방식" },
  gwimun: { href: "/reports/jikup", seal: "業", title: "예민한 촉을 일로 쓰는 법", line: "직업·적성 보고서 · 맞는 일과 일하는 방식" },
  cheoneul: { href: "/reports/yeonun?y=2027", seal: "年", title: "귀인이 오는 해와 달, 2027년에서 짚어 보기", line: "2027 신년운세 · 좋은 달·조심할 달까지" },
  yangin: { href: "/reports/pyeongsaeng", seal: "命", title: "센 기운을 어디에 써야 하는지, 평생 사주에서", line: "평생 사주 · 13장에 걸친 내 사주 전체" },
  goegang: { href: "/reports/pyeongsaeng", seal: "命", title: "판을 이끄는 기운, 어디서 크게 쓰이나", line: "평생 사주 · 13장에 걸친 내 사주 전체" },
  baekho: { href: "/reports/pyeongsaeng", seal: "命", title: "흰 범의 기세를 어디에 써야 하는지", line: "평생 사주 · 13장에 걸친 내 사주 전체" },
};
const DEFAULT = { href: "/reports/pyeongsaeng", seal: "命", title: "살 아래의 여덟 글자, 평생 사주로 깊이", line: "평생 사주 · 13장에 걸친 내 사주 전체" };

export const pickFor = (c: Card) => PICKS[c.id.replace(/\d+$/, "")] ?? DEFAULT;

export default function SinsalUpsell({ head }: { head: Card }) {
  const p = pickFor(head);
  return (
    <TrackLink event="to_saju" from="sinsal" href={p.href} className={`${NIGHT_PANEL} mt-4 flex items-center gap-3 px-4 py-4`}>
      <span className="flex size-12 shrink-0 -rotate-3 items-center justify-center border-[3px] border-[#d4af5f] font-myeongjo text-xl font-extrabold text-[#d4af5f]">{p.seal}</span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[11px] font-extrabold ${NIGHT_GOLD}`}>{head.sal} 유형에게</span>
        <span className="block font-myeongjo text-[16px] leading-snug font-extrabold">{p.title}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-hanji/70">{p.line}</span>
      </span>
      <span className={`shrink-0 font-myeongjo text-sm font-extrabold ${NIGHT_GOLD}`}>보기 →</span>
    </TrackLink>
  );
}

// The foot of the result, after sharing: the head's report again, one for another 살 on the chart that leads
// somewhere else, and 궁합 (the friend comparison just above leads there). At most three, smaller than the head card.
export function SinsalMore({ head, rest }: { head: Card; rest: Card[] }) {
  const first = pickFor(head);
  const other = rest.map(pickFor).find((p) => p.href !== first.href && p !== DEFAULT);
  const items = [
    { ...first, kicker: `${head.sal} 유형에게` },
    ...(other ? [{ ...other, kicker: "함께 적힌 살로" }] : []),
    { href: "/reports/gunghap", seal: "合", title: "살이 겹치는 사람과의 궁합", line: "궁합 보고서 · 두 사람 사주로 보는 끌림과 부딪힘", kicker: "친구와 함께" },
  ];
  return (
    <section className={`${NIGHT_PANEL} mt-4 px-3 py-3`}>
      <h2 className="px-1 text-center font-myeongjo text-[16px] font-extrabold">그대 살로 이어 보기</h2>
      <ul className="mt-2 flex flex-col divide-y divide-white/10">
        {items.map((p) => (
          <li key={p.href + p.kicker}>
            <TrackLink event="to_saju" from="sinsal" href={p.href} className="flex items-center gap-3 px-1 py-2.5">
              <span className="flex size-9 shrink-0 -rotate-3 items-center justify-center border-2 border-[#d4af5f] font-myeongjo text-base font-extrabold text-[#d4af5f]">{p.seal}</span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[10.5px] font-bold ${NIGHT_GOLD}`}>{p.kicker}</span>
                <span className="block font-myeongjo text-[14.5px] leading-snug font-extrabold">{p.title}</span>
                <span className="block text-[11.5px] leading-snug text-hanji/60">{p.line}</span>
              </span>
              <span className={`shrink-0 text-sm ${NIGHT_GOLD}`}>→</span>
            </TrackLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
