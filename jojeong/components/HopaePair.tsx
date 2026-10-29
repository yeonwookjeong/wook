import Link from "next/link";
import { bornOf, yearGanji, type HopaeInput } from "@/lib/hopae";
import { sinbunOf, type Rank, type Sinbun } from "@/lib/sinbun";
import type { Pillars } from "@/lib/saju";
import HopaeFace from "./HopaeFace";
import SinsalNight, { NIGHT_GOLD, NIGHT_PANEL } from "./SinsalNight";

const ORDER: Rank[] = ["양반", "중인", "상민", "천민"];

type Side = { name: string; life: Sinbun; tag: HopaeInput };

// A chart's side of the pair: its life and its tag (the birth year left off when the link carried none).
export function sideOf(name: string, pillars: Pillars | null, gender: "m" | "f" | null | undefined, life?: Pick<Sinbun, "rank" | "job" | "line">): Side | null {
  const l = pillars ? sinbunOf(pillars, gender) : life ? ({ ...life } as Sinbun) : null;
  if (!l) return null;
  return { name, life: l, tag: { rank: l.rank, job: l.job, office: l.office, born: pillars ? bornOf(pillars.yearStem, pillars.yearBranch) : "", issued: yearGanji() } };
}

// One line on the two lives, light and never a put-down.
function lineOf(a: Side, b: Side): string {
  if (a.life.job === b.life.job) return "조선에서도 같은 일을 했을 두 사람이에요. 그대로 동업자감이에요.";
  if (a.life.rank === b.life.rank) return `둘 다 ${a.life.rank}으로 났어요. 같은 동네에서 마주쳤을 사이예요.`;
  const [hi, lo] = ORDER.indexOf(a.life.rank) < ORDER.indexOf(b.life.rank) ? [a, b] : [b, a];
  return `${hi.name}님은 ${hi.life.rank}, ${lo.name}님은 ${lo.life.rank}. 조선에서 만났다면 ${lo.name}님의 재주를 ${hi.name}님이 알아봤을 거예요.`;
}

// The friend who opened a 신분 감정 link, once their own chart is on this device: the two 호패 side by side.
export default function HopaePair({ me, them }: { me: Side; them: Side }) {
  return (
    <SinsalNight>
      <section className="pt-6 text-center">
        <p className={`font-myeongjo text-sm font-extrabold tracking-[0.3em] ${NIGHT_GOLD}`}>號 牌 · 나란히</p>
        <h2 className="mt-2 font-myeongjo text-[22px] font-extrabold">우리 둘, 조선에서는</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[them, me].map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-[min(34vw,140px)]">
                <HopaeFace tag={s.tag} id={`pair${i}`} />
              </div>
              <p className="mt-2 text-[12.5px] text-hanji/70">{i === 1 ? `${s.name}님 (나)` : `${s.name}님`}</p>
              <p className="font-myeongjo text-[17px] leading-tight font-extrabold break-keep">{s.life.job}</p>
              <span className="mt-1 rounded-full border border-[#d4af5f]/60 px-2 text-[11px] font-bold text-[#d4af5f]">{s.life.rank}</span>
            </div>
          ))}
        </div>
        <p className={`${NIGHT_PANEL} mt-4 px-4 py-3 text-[13.5px] leading-relaxed text-hanji/90`}>{lineOf(them, me)}</p>
        <Link href="/reports/sinbun" className="mt-4 block rounded-2xl bg-[#d4af5f] py-3.5 text-center font-myeongjo text-[16px] font-extrabold text-[#0f2236]">
          내 호패 자세히 보기
        </Link>
      </section>
    </SinsalNight>
  );
}
