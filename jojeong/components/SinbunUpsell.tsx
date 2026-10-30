import type { Rank } from "@/lib/sinbun";
import { NIGHT_GOLD, NIGHT_PANEL } from "./SinsalNight";
import TrackLink from "./TrackLink";

// The 신분 감정 result's step into a report, by the calling the chart fell into (lib/sinbun.ts keyOf): the
// gift the Joseon life showed, asked of today. Counted as a step out of the page (to:sinbun). No price shown.
type Calling = "비겁" | "식상" | "재성" | "관성" | "인성" | "고른";
type Pick = { href: string; seal: string; title: string; line: string };

const PICKS: Record<Calling, (job: string) => Pick> = {
  인성: (job) => ({ href: "/reports/jikup", seal: "業", title: `${job}의 기질, 지금 시대엔 어떤 일에서 빛나나`, line: "직업·적성 보고서 · 맞는 일과 일하는 방식" }),
  관성: (job) => ({ href: "/reports/jikup", seal: "業", title: `${job}의 원칙과 책임감, 지금은 어디에 쓰이나`, line: "직업·적성 보고서 · 맞는 일과 일하는 방식" }),
  식상: (job) => ({ href: "/reports/jikup", seal: "業", title: `${job}의 말솜씨와 재주, 지금 맞는 일은`, line: "직업·적성 보고서 · 맞는 일과 일하는 방식" }),
  재성: () => ({ href: "/reports/jaemul", seal: "財", title: "엽전이 새끼를 치던 셈, 지금 내 재물운은", line: "재물운 보고서 · 돈이 들어오는 길과 새는 곳" }),
  비겁: () => ({ href: "/reports/pyeongsaeng", seal: "命", title: "벗이 곧 재산이던 사람, 평생의 흐름은", line: "평생 사주 · 13장에 걸친 내 사주 전체" }),
  고른: () => ({ href: "/reports/pyeongsaeng", seal: "命", title: "어디에 둬도 제 몫을 하는 그릇, 평생 사주로", line: "평생 사주 · 13장에 걸친 내 사주 전체" }),
};
export const sinbunPick = (group: string, job: string) => (PICKS[group as Calling] ?? PICKS.고른)(job);

export default function SinbunUpsell({ group, job, rank }: { group: string; job: string; rank: Rank }) {
  const p = sinbunPick(group, job);
  return (
    <TrackLink event="to_saju" from="sinbun" href={p.href} className={`${NIGHT_PANEL} mt-4 flex items-center gap-3 px-4 py-4 text-left`}>
      <span className="flex size-12 shrink-0 -rotate-3 items-center justify-center border-[3px] border-[#d4af5f] font-myeongjo text-xl font-extrabold text-[#d4af5f]">{p.seal}</span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[11px] font-extrabold ${NIGHT_GOLD}`}>{rank} · 조선의 그대에게</span>
        <span className="block font-myeongjo text-[16px] leading-snug font-extrabold">{p.title}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-hanji/70">{p.line}</span>
      </span>
      <span className={`shrink-0 font-myeongjo text-sm font-extrabold ${NIGHT_GOLD}`}>보기 →</span>
    </TrackLink>
  );
}

// Under the four tags: the calling's report again, 연애·결혼 (the 귀인 of the life), and 궁합 (the friend's tag beside).
export function SinbunMore({ group, job }: { group: string; job: string }) {
  const first = sinbunPick(group, job);
  const items = [
    { ...first, kicker: "그대 기질로" },
    ...(first.href !== "/reports/yeonae"
      ? [{ href: "/reports/yeonae", seal: "緣", title: "조선에서 만났을 인연, 지금은 언제 오나", line: "연애·결혼 보고서 · 인연의 때와 사람", kicker: "인연으로" }]
      : []),
    { href: "/reports/gunghap", seal: "合", title: "친구 호패와 나란히, 두 사람 궁합은", line: "궁합 보고서 · 끌림과 부딪힘", kicker: "친구와 함께" },
  ];
  return (
    <section className={`${NIGHT_PANEL} mt-4 px-3 py-3`}>
      <h2 className="px-1 text-center font-myeongjo text-[16px] font-extrabold">그대 신분으로 이어 보기</h2>
      <ul className="mt-2 flex flex-col divide-y divide-white/10">
        {items.map((p) => (
          <li key={p.href}>
            <TrackLink event="to_saju" from="sinbun" href={p.href} className="flex items-center gap-3 px-1 py-2.5 text-left">
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
