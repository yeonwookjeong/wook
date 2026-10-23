import type { Metadata } from "next";
import AdSlot from "@/components/AdSlot";
import NextStep from "@/components/NextStep";
import SinsalBoard from "@/components/SinsalBoard";
import SinsalStart, { SinsalHeader } from "@/components/SinsalStart";
import SinsalWithFriend from "@/components/SinsalWithFriend";
import SinsalCards from "@/components/SinsalCards";
import SinsalNight, { NIGHT_GOLD, NIGHT_PANEL } from "@/components/SinsalNight";
import { SinsalCardA, SinsalCardB } from "@/components/SinsalSaveCards";
import SinsalShare from "@/components/SinsalShare";
import TrackOnce from "@/components/TrackOnce";
import { readMe } from "@/lib/me";
import { samePerson } from "@/lib/pairToken";
import { STEPS } from "@/lib/nextStep";
import { openPerson, sealPerson } from "@/lib/shareToken";
import { BOOK, CARDS, per100, placesOf, rareText, sinsalOf } from "@/lib/sinsal";

export const metadata: Metadata = {
  title: "신살 도감 · 나는 무슨 살을 타고났을까",
  description: "천을귀인, 도화, 역마, 화개, 양인, 괴강, 백호, 귀문관, 홍염. 내 사주에 적힌 살을 카드로 모아 보고, 친구 사주로 도감의 빈칸을 채워 보세요.",
};

// The book's commonest and rarest cards, for the line under the board.
const COMMONEST = CARDS.reduce((a, b) => (per100(b.id) > per100(a.id) ? b : a));
const RAREST = BOOK.reduce((a, b) => (per100(b.id) < per100(a.id) ? b : a));

// Free, rule-based (lib/sinsal.ts): every 신살 the chart holds as a card, rarest first, then the book of 20 with
// the empty places a friend's chart can fill, and the link that sends the book with its cards hidden.
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
  const { head, rest, kinds, summary } = sinsalOf(p);
  const cards = [head, ...rest];
  const count = kinds || 1;
  const name = me.person.name;
  const noHour = p.hourBranch === null;

  return (
    <>
      <SinsalNight>
        <TrackOnce e="sinsal_view" />
        {fromFriend && <TrackOnce e="sinsal_friend_view" />}
        <SinsalHeader />
        <section className={`${NIGHT_PANEL} mt-4 px-4 py-3 text-center`}>
          <p className="font-myeongjo text-[17px] font-extrabold">
            {name}님은 <span className={NIGHT_GOLD}>{kinds ? `20장 중 ${kinds}장` : "무살 카드 1장"}</span>
          </p>
          <p className="mt-1 text-[13px] text-hanji/70">{summary}</p>
        </section>

        <SinsalCards cards={cards} places={cards.map((c) => placesOf(p, c.id))} gender={gender} />

        <section className={`${NIGHT_PANEL} mt-5 px-3 py-5`}>
          <h2 className="text-center font-myeongjo text-lg font-extrabold">
            {name}님의 도감 <span className={NIGHT_GOLD}>{count} / 20</span>
          </h2>
          <p className="mt-1 text-center text-[12px] text-hanji/60">빈칸은 다른 사람 사주에 있어요. 혼자서는 많아야 10장이에요.</p>
          <div className="mt-3">
            <SinsalBoard owned={new Set(cards.map((c) => c.id))} gender={gender} />
          </div>
          <p className="mt-3 px-1 text-[12px] leading-relaxed text-hanji/60">
            가장 흔한 카드 {COMMONEST.sal} ({rareText(COMMONEST)}) · 가장 귀한 카드 {RAREST.sal} ({rareText(RAREST)})
          </p>
        </section>

        {friend && <SinsalWithFriend friend={friend} me={me.person} />}

        <SinsalShare
          name={name}
          path={`/s/sinsal/${sealPerson("sinsal", me.person)}`}
          text={"내 사주에 적힌 살 카드야. 너는 무슨 살이야? 겹치는 살도 보여 줘"}
          cards={{
            feed: <SinsalCardA name={name} head={head} rest={rest} count={count} gender={gender} />,
            story: <SinsalCardB name={name} head={head} rest={rest} count={count} gender={gender} />,
          }}
        />

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

