import type { Metadata } from "next";
import AdSlot from "@/components/AdSlot";
import NextStep from "@/components/NextStep";
import SinsalUpsell from "@/components/SinsalUpsell";
import AskCard from "@/components/AskCard";
import SinsalList from "@/components/SinsalList";
import SinsalStart from "@/components/SinsalStart";
import SinsalType from "@/components/SinsalType";
import SinsalWithFriend from "@/components/SinsalWithFriend";
import SinsalCards from "@/components/SinsalCards";
import SinsalNight from "@/components/SinsalNight";
import { SinsalCardA, SinsalCardB } from "@/components/SinsalSaveCards";
import SinsalShare from "@/components/SinsalShare";
import TrackOnce from "@/components/TrackOnce";
import { readMe } from "@/lib/me";
import { samePerson } from "@/lib/pairToken";
import { STEPS } from "@/lib/nextStep";
import { openPerson, sealPerson } from "@/lib/shareToken";
import { placesOf, rareText, sinsalOf } from "@/lib/sinsal";

export const metadata: Metadata = {
  title: "신살 유형 테스트 · 나는 어떤 살의 사람일까",
  description: "20가지 살 유형 중 나는 무엇일까. 천을귀인, 도화, 역마, 화개, 양인, 괴강, 백호, 귀문관, 홍염. 내 살 유형과 100명 중 몇 명인지, 내 살 구성까지 무료로 봐요.",
};

// Free, rule-based (lib/sinsal.ts): the 살 type (the rarest card held), how the 살 share the chart, every card
// rarest first, then all 20 with their share of births, and the link that sends a friend the first screen.
// `f`: the friend's link this visit came from (app/s/[kind]/[token]), kept so its arrivals are counted.
export default async function SinsalPage({ searchParams }: PageProps<"/sinsal">) {
  const me = await readMe();
  const f = (await searchParams).f;
  const sender = typeof f === "string" ? openPerson("sinsal", f) : null;
  // The sender coming back through their own link sees their result alone, not themselves twice.
  const friend = sender && !(me && samePerson(sender, me.person)) ? sender : null;
  const fromFriend = friend !== null;

  if (!me)
    return (
      <SinsalNight>
        <TrackOnce e="sinsal_open" />
        <SinsalStart next={fromFriend ? `/sinsal?f=${f}` : "/sinsal"} />
      </SinsalNight>
    );

  const gender = me.person.gender === "f" ? "f" : me.person.gender === "m" ? "m" : null;
  const p = me.person.pillars;
  const { head, rest, kinds } = sinsalOf(p);
  const cards = [head, ...rest];
  const count = kinds || 1;
  const name = me.person.name;
  const noHour = p.hourBranch === null;

  return (
    <>
      <SinsalNight>
        <TrackOnce e="sinsal_view" />
        {fromFriend && <TrackOnce e="sinsal_friend_view" />}
        <SinsalType name={name} head={head} rest={rest} pillars={p} />
        <SinsalUpsell head={head} />

        <h2 className="mt-6 text-center font-myeongjo text-lg font-extrabold">내 카드 {kinds || 1}장</h2>
        <SinsalCards cards={cards} places={cards.map((c) => placesOf(p, c.id))} gender={gender} />

        <SinsalList mine={new Set(cards.map((c) => c.id))} />

        {friend && <SinsalWithFriend friend={friend} me={me.person} />}

        <SinsalShare
          name={name}
          path={`/s/sinsal/${sealPerson("sinsal", me.person)}`}
          text={`20가지 살 유형 중 나는 ${rareText(head)}만 있는 유형. 너는 뭐 나올까?`}
          cards={{
            feed: <SinsalCardA name={name} head={head} rest={rest} count={count} gender={gender} />,
            story: <SinsalCardB name={name} head={head} rest={rest} count={count} gender={gender} />,
          }}
        />

        <AskCard from="free" lead="내 살 이야기, 정 훈도에게 묻기" />

        <section className="mt-5 px-1 text-[12.5px] leading-relaxed text-hanji/60">
          <p>
            신살은 여덟 글자 위에 얹힌 양념 같은 표시예요. 같은 살도 다른 칸과 어떻게 어울리느냐에 따라 결이 달라져요.
            {noHour && " 태어난 시를 모르면 그 칸은 빼고 봤어요."}
          </p>
          <p className="mt-2">드문 정도는 1950~2008년 모든 날의 열두 시를 다 넣은 사주 25만 8,600개를 세어 낸 숫자예요.</p>
        </section>
      </SinsalNight>

      <NextStep from="sinsal" steps={STEPS.sinsal()} />
      <AdSlot />
    </>
  );
}

