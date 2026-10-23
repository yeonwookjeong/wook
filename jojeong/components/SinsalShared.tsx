import Link from "next/link";
import SinsalNight from "@/components/SinsalNight";
import SinsalStart from "@/components/SinsalStart";
import TrackOnce from "@/components/TrackOnce";
import type { Person } from "@/lib/pairToken";

// The same eight characters and name: the sender opening their own link.
const samePerson = (a: Person, b: Person) =>
  a.name === b.name &&
  (["yearStem", "yearBranch", "monthStem", "monthBranch", "dayStem", "dayBranch", "hourBranch"] as const).every((k) => a.pillars[k] === b.pillars[k]);

// A friend's 신살 도감 link (2026-10-23 대표님 지시): the friend sees the 도감's own first screen, with one line on
// top saying who sent it. The sender's cards are not shown at all; entering a chart leads to the friend's own
// result (/sinsal, the link carried along). The sender opening their own link is told this is what friends see.
export default function SinsalShared({ sender, me, token }: { sender: Person; me: Person | null; token: string }) {
  const name = sender.name;
  const self = me !== null && samePerson(me, sender);
  const next = `/sinsal?f=${token}`;
  return (
    <SinsalNight>
      {!self && <TrackOnce e="sinsal_friend_open" />}
      {me && !self ? (
        <>
          <p className="mt-4 rounded-full border border-[#d4af5f]/50 bg-white/[0.06] px-4 py-2 text-center text-[13px] leading-snug text-hanji/90">
            {name}님이 보냈어요 · 내 살을 보면 {name}님과 겹치는 살도 보여요
          </p>
          <section className="pt-6 text-center">
            <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-[#d4af5f]">神 煞 圖 鑑</p>
            <h1 className="mt-2 font-myeongjo text-3xl font-extrabold">신살 도감</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-hanji/85">{me.name}님의 사주가 이 기기에 저장돼 있어요</p>
          </section>
          <Link href={next} className="mt-5 block rounded-2xl bg-seal py-4 text-center font-myeongjo text-lg font-extrabold text-hanji shadow-[0_6px_0_#7d1a14]">
            내 카드 펼치기
          </Link>
        </>
      ) : (
        <SinsalStart
          next={next}
          band={self ? <>친구에게는 이렇게 보여요</> : <>{name}님이 보냈어요 · 내 살을 보면 {name}님과 겹치는 살도 보여요</>}
        />
      )}
    </SinsalNight>
  );
}
