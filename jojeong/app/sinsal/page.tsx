import type { Metadata } from "next";
import AdSlot from "@/components/AdSlot";
import MeForm from "@/components/MeForm";
import NextStep from "@/components/NextStep";
import SinsalBoard from "@/components/SinsalBoard";
import SinsalCards from "@/components/SinsalCards";
import { SinsalCardA, SinsalCardB } from "@/components/SinsalSaveCards";
import SinsalShare from "@/components/SinsalShare";
import { readMe } from "@/lib/me";
import { STEPS } from "@/lib/nextStep";
import { sealPerson } from "@/lib/shareToken";
import { BOOK, CARDS, per100, placesOf, rareText, sinsalOf } from "@/lib/sinsal";

export const metadata: Metadata = {
  title: "신살 도감 · 내 사주에 적힌 살, 20장 중 몇 장?",
  description: "천을귀인, 도화, 역마, 화개, 양인, 괴강, 백호, 귀문관, 홍염. 내 사주에 적힌 살을 카드로 모아 보고, 친구 사주로 도감의 빈칸을 채워 보세요.",
};

// The book's commonest and rarest cards, for the line under the board.
const COMMONEST = CARDS.reduce((a, b) => (per100(b.id) > per100(a.id) ? b : a));
const RAREST = BOOK.reduce((a, b) => (per100(b.id) < per100(a.id) ? b : a));

// Free, rule-based (lib/sinsal.ts): every 신살 the chart holds as a card, rarest first, then the book of 20 with
// the empty places a friend's chart can fill, and the link that sends the book with its cards hidden.
export default async function SinsalPage() {
  const me = await readMe();

  if (!me)
    return (
      <>
        <Header />
        <section className="doc-paper mt-4 px-5 pt-6 pb-6">
          <p className="text-center text-[13.5px] leading-relaxed">
            살은 사주 여덟 글자 위에 얹힌 표시예요.
            <br />
            보통은 <b>3~4장</b>, 100명 중 1.5명은 하나도 없어요.
          </p>
          <div className="mt-4">
            <SinsalBoard owned={new Set()} gender={null} />
          </div>
          <div className="mt-5">
            <MeForm next="/sinsal" submit="내 카드 펼치기" />
          </div>
        </section>
      </>
    );

  const gender = me.person.gender === "f" ? "f" : me.person.gender === "m" ? "m" : null;
  const p = me.person.pillars;
  const { head, rest, kinds, summary } = sinsalOf(p);
  const cards = [head, ...rest];
  const count = kinds || 1;
  const name = me.person.name;
  const noHour = p.hourBranch === null;
  const hint = head.id === "musal" ? `힌트: ${rareText(head)}만 받는 카드` : `힌트: ${rareText(head)}만 있는 살`;

  return (
    <>
      <Header />
      <section className="mt-4 rounded-xl bg-gold/10 px-4 py-3 text-center">
        <p className="font-myeongjo text-[17px] font-extrabold">
          {name}님은 <span className="text-seal">{kinds ? `20장 중 ${kinds}장` : "무살 카드 1장"}</span>
        </p>
        <p className="mt-1 text-[13px] text-ink-soft">{summary}</p>
      </section>

      <SinsalCards cards={cards} places={cards.map((c) => placesOf(p, c.id))} gender={gender} />

      <section className="doc-paper mt-5 px-4 py-5">
        <h2 className="text-center font-myeongjo text-lg font-extrabold">
          {name}님의 도감 <span className="text-seal">{count} / 20</span>
        </h2>
        <p className="mt-1 text-center text-[12px] text-ink-soft">빈칸은 다른 사람 사주에 있어요. 혼자서는 많아야 10장이에요.</p>
        <div className="mt-3">
          <SinsalBoard owned={new Set(cards.map((c) => c.id))} gender={gender} />
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">
          가장 흔한 카드 {COMMONEST.sal} ({rareText(COMMONEST)}) · 가장 귀한 카드 {RAREST.sal} ({rareText(RAREST)})
        </p>
      </section>

      <SinsalShare
        name={name}
        path={`/s/sinsal/${sealPerson("sinsal", me.person)}`}
        text={`내 사주에 적힌 살 맞혀 봐\n${hint}`}
        cards={{
          feed: <SinsalCardA name={name} head={head} rest={rest} count={count} gender={gender} />,
          story: <SinsalCardB name={name} head={head} rest={rest} count={count} gender={gender} />,
        }}
      />

      <section className="doc-paper mt-5 px-5 py-5 text-[13px] leading-relaxed text-ink-soft">
        <p>
          신살은 여덟 글자 위에 얹힌 양념 같은 표시예요. 같은 살도 다른 칸과 어떻게 어울리느냐에 따라 결이 달라져요.
          {noHour && " 태어난 시를 모르면 그 칸은 빼고 봤어요."}
        </p>
        <p className="mt-2">드문 정도는 1950~2008년 모든 날의 열두 시를 다 넣은 사주 25만 8,600개를 세어 낸 숫자예요.</p>
      </section>

      <NextStep from="sinsal" steps={STEPS.sinsal()} />
      <AdSlot />
    </>
  );
}

function Header() {
  return (
    <section className="mt-6 text-center">
      <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">神 煞 圖 鑑</p>
      <h1 className="mt-2 font-myeongjo text-3xl font-extrabold">신살 도감</h1>
      <p className="mt-2 text-[15px] leading-relaxed">내 사주에 적힌 살, 20장 중 몇 장?</p>
      <p className="mt-1 text-xs text-ink-soft">무료 · 혼자는 많아야 10장, 나머지는 친구 사주로 채워요</p>
    </section>
  );
}
