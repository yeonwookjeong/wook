import Image from "next/image";
import Link from "next/link";
import MeForm from "@/components/MeForm";
import SinsalBoard from "@/components/SinsalBoard";
import type { Person } from "@/lib/pairToken";
import { imageOf, rareText, sinsalOf, type Card } from "@/lib/sinsal";

const genderOf = (p: Person): "m" | "f" | null => (p.gender === "f" ? "f" : p.gender === "m" ? "m" : null);
// 도화 and 도화 둘 are the same 살: compare by the 살, not the card.
const familyOf = (c: Card) => c.id.replace(/\d$/, "");

// A friend's 신살 도감 link: their cards stay hidden until the reader enters their own chart; then both open side
// by side, with the 살 they share and the book the two fill together.
export default function SinsalShared({ sender, me, token }: { sender: Person; me: Person | null; token: string }) {
  const theirs = sinsalOf(sender.pillars);
  const theirCards = [theirs.head, ...theirs.rest];
  const name = sender.name;
  const rare = rareText(theirs.head);

  return (
    <>
      <section className="mt-6 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">傳 達</p>
        <h1 className="mt-2 font-myeongjo text-2xl font-extrabold">{name}님이 신살 도감을 보내왔어요</h1>
        <p className="mt-1 text-xs text-ink-soft">내 사주에 적힌 살, 20장 중 몇 장?</p>
      </section>

      <section className="mt-4 rounded-xl bg-gold/10 px-4 py-3 text-center">
        <p className="font-myeongjo text-[17px] font-extrabold">
          {name}님은 <span className="text-seal">{theirs.kinds ? `20장 중 ${theirs.kinds}장` : "무살 카드 1장"}</span>
        </p>
        <p className="mt-1 text-[13px] text-ink-soft">
          {theirs.head.id === "musal" ? `${rare}만 받는 카드예요` : `그중 한 장은 ${rare}만 가진 카드예요`}
        </p>
      </section>

      {me ? <Both sender={sender} me={me} theirCards={theirCards} /> : (
        <section className="doc-paper mt-4 px-4 pt-5 pb-6">
          <h2 className="text-center font-myeongjo text-lg font-extrabold">어떤 카드일까요?</h2>
          <div className="mt-3">
            <SinsalBoard owned={new Set(theirCards.map((c) => c.id))} gender={genderOf(sender)} locked />
          </div>
          <p className="mt-4 text-center text-[13px] leading-relaxed text-ink-soft">생일을 넣으면 내 카드와 {name}님 카드가 함께 열려요.</p>
          <div className="mt-3">
            <MeForm next={`/s/sinsal/${token}`} submit="내 카드 펼치고 같이 보기" />
          </div>
        </section>
      )}
    </>
  );
}

function Both({ sender, me, theirCards }: { sender: Person; me: Person; theirCards: Card[] }) {
  const mine = sinsalOf(me.pillars);
  const myCards = [mine.head, ...mine.rest];
  const mySet = new Set(myCards.map(familyOf));
  const shared = theirCards.filter((c) => c.id !== "musal" && mySet.has(familyOf(c)));
  const union = new Set([...theirCards, ...myCards].map((c) => c.id));
  const pair = [
    { who: sender.name, c: theirCards[0], g: genderOf(sender), n: theirCards.length },
    { who: me.name, c: mine.head, g: genderOf(me), n: myCards.length },
  ];
  return (
    <>
      <section className="doc-paper mt-4 px-4 py-5">
        <div className="grid grid-cols-2 gap-3">
          {pair.map(({ who, c, g, n }) => (
            <div key={who + c.id} className="text-center">
              <Image src={imageOf(c, g)} alt={`${c.sal} · ${c.nick}`} width={400} height={500} className="h-auto w-full rounded-lg" />
              <p className="mt-1.5 text-[12px] text-ink-soft">{who}님 · {c.id === "musal" ? "무살 1장" : `${n}장`}</p>
              <p className="font-myeongjo text-[15px] font-extrabold">{c.sal}</p>
              <p className="text-[12px]">{c.nick}</p>
              <p className="mt-1 inline-block rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-bold">{rareText(c)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border-l-4 border-seal bg-white/70 px-3 py-2 text-[13px] leading-relaxed">
          {shared.length ? (
            <>
              <b>둘 다 가진 살 · {shared.map((c) => c.sal.replace(/ (둘|셋)$/, "")).join(", ")}</b>
              <br />
              같은 살이라도 다른 칸과 어울리는 결은 사람마다 달라요.
            </>
          ) : (
            <b>겹치는 살이 하나도 없어요. 서로의 빈칸을 채워 주는 사이예요.</b>
          )}
        </div>
      </section>

      <section className="doc-paper mt-4 px-4 py-5">
        <h2 className="text-center font-myeongjo text-lg font-extrabold">
          합친 도감 <span className="text-seal">{union.size} / 20</span>
        </h2>
        <div className="mt-3">
          <SinsalBoard owned={union} gender={genderOf(me)} />
        </div>
        <Link href="/sinsal" className="mt-4 block rounded-2xl bg-seal py-4 text-center font-myeongjo text-lg font-extrabold text-hanji shadow-[0_6px_0_#7d1a14]">
          내 카드 전부 보고 친구 더 부르기
        </Link>
      </section>
    </>
  );
}
