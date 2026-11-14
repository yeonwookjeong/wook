import { bestMinisterIljus, kingLink, type KingLink } from "@/lib/kings";
import { BRANCHES, ELEMENTS_KO, STEMS, STEMS_KO, type Pillars } from "@/lib/saju";

// The first thing a new king sees (2026-11-14 개편): the Joseon king of the same day pillar by the Annals, and the
// day pillars that would make the best 영의정, so there is something to read and to post before any friend comes.
// Before this, the same-pillar king sat folded inside the 즉위 교서 and most never opened it.
// Left off this card: a deposed tyrant is no one's flattering twin (the same rule as the 옛사람 list).
const SKIP = new Set(["연산군"]);

// The kings to show: the same day pillar first, else the same day stem, never a skipped king.
function matchOf(pillars: Pillars): KingLink {
  const keep = (l: KingLink): KingLink => {
    if (l.kind === "none") return l;
    const kings = l.kings.filter((k) => !SKIP.has(k.name));
    return kings.length ? { kind: l.kind, kings } : { kind: "none" };
  };
  const first = keep(kingLink(pillars));
  if (first.kind !== "none") return first;
  // An impossible day branch, so kingLink falls through to the kings of the same day stem.
  return keep(kingLink({ ...pillars, dayBranch: -1 }));
}

export default function KingMatch({ pillars }: { pillars: Pillars }) {
  const link = matchOf(pillars);
  const pillar = `${STEMS[pillars.dayStem]}${BRANCHES[pillars.dayBranch]}`;
  const stemLabel = `${STEMS_KO[pillars.dayStem]}${ELEMENTS_KO[Math.floor(pillars.dayStem / 2)]}`;
  const best = bestMinisterIljus(pillars, 3);

  return (
    <section className="mt-5 overflow-hidden rounded-2xl bg-[#0f2236] px-5 py-5 text-hanji shadow-[0_8px_24px_rgb(15_34_54/0.25),inset_0_0_0_1px_rgb(212_175_95/0.35)]">
      <p className="font-myeongjo text-[13px] font-bold text-[#d4af5f]">
        {link.kind === "pillar"
          ? `실록 기준, 전하와 일주(${pillar})가 같은 왕`
          : link.kind === "stem"
            ? `실록 기준, 전하와 같은 ${stemLabel} 일간의 왕`
            : `조선 27왕 가운데 ${stemLabel} 일간은 없었사옵니다`}
      </p>
      {link.kind === "none" ? (
        <>
          <p className="mt-1 font-myeongjo text-[26px] leading-tight font-extrabold">조선 최초의 {stemLabel} 군주</p>
          <p className="mt-2 text-[14px] leading-relaxed text-hanji/85">
            실록에 생일이 남은 조선 왕 스물일곱 분 가운데 전하와 같은 일간은 한 분도 없었사옵니다. 전하가 처음이시옵니다.
          </p>
        </>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {link.kings.slice(0, 3).map((k) => (
            <li key={k.name} className="rounded-xl bg-white/[0.06] px-4 py-3">
              <p className="font-myeongjo text-[24px] leading-tight font-extrabold">
                {k.name}
                <span className="ml-2 align-middle text-[13px] font-normal text-hanji/70">
                  {STEMS[k.dayStem]}
                  {BRANCHES[k.dayBranch]}일생
                </span>
              </p>
              <p className="mt-0.5 text-[14px] text-hanji/85">{k.note}</p>
            </li>
          ))}
        </ul>
      )}
      {link.kind === "stem" && (
        <p className="mt-2 text-[13px] leading-relaxed text-hanji/75">일주까지 같은 왕은 없어, 날의 위 글자가 같은 왕을 모셨사옵니다.</p>
      )}

      <div className="mt-4 border-t border-[#d4af5f]/25 pt-4">
        <p className="font-myeongjo text-[13px] font-bold text-[#d4af5f]">전하의 영의정 감</p>
        <p className="mt-1 text-[15px] leading-relaxed">
          사주로 보아 전하와 가장 잘 맞는 일주는{" "}
          <b className="text-[#f1d892]">{best.map((b) => `${b.name}일주`).join(", ")}</b>
          이옵니다. 벗들 가운데 이 일주를 찾아 부르시옵소서.
        </p>
      </div>
    </section>
  );
}
