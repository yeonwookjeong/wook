import Image from "next/image";
import { NIGHT_PANEL } from "@/components/SinsalNight";
import type { Person } from "@/lib/pairToken";
import { imageOf, rareText, sinsalOf, type Card } from "@/lib/sinsal";

const genderOf = (p: Person): "m" | "f" | null => (p.gender === "f" ? "f" : p.gender === "m" ? "m" : null);
// 도화 and 도화 둘 are the same 살: compare by the 살, not the card.
const familyOf = (c: Card) => c.id.replace(/\d$/, "");
const salName = (c: Card) => c.sal.replace(/ (둘|셋)$/, "");

// Under the reader's own result, when they came from a friend's link: the two lead cards, the 살 both hold, and
// what each has that the other does not. The friend's cards are shown only here, after the reader's own.
export default function SinsalWithFriend({ friend, me }: { friend: Person; me: Person }) {
  const theirs = sinsalOf(friend.pillars);
  const mine = sinsalOf(me.pillars);
  const theirCards = [theirs.head, ...theirs.rest].filter((c) => c.id !== "musal");
  const myCards = [mine.head, ...mine.rest].filter((c) => c.id !== "musal");
  const mySet = new Set(myCards.map(familyOf));
  const theirSet = new Set(theirCards.map(familyOf));
  const both = theirCards.filter((c) => mySet.has(familyOf(c)));
  const onlyMe = myCards.filter((c) => !theirSet.has(familyOf(c)));
  const onlyThem = theirCards.filter((c) => !mySet.has(familyOf(c)));
  const pair = [
    { who: me.name, c: mine.head, g: genderOf(me) },
    { who: friend.name, c: theirs.head, g: genderOf(friend) },
  ];
  const list = (cs: Card[]) => (cs.length ? cs.map(salName).join(", ") : "없음");
  return (
    <section className={`${NIGHT_PANEL} mt-5 px-4 py-5`}>
      <h2 className="text-center font-myeongjo text-lg font-extrabold">
        {friend.name}님과 {me.name}님
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {pair.map(({ who, c, g }) => (
          <div key={who + c.id} className="text-center">
            <Image src={imageOf(c, g)} alt={`${c.sal} · ${c.nick}`} width={400} height={500} className="h-auto w-full rounded-lg ring-1 ring-[#d4af5f]/50" />
            <p className="mt-1.5 text-[12px] text-hanji/60">{who}님</p>
            <p className="font-myeongjo text-[15px] font-extrabold">{c.sal}</p>
            <p className="text-[12px] text-hanji/80">{c.nick}</p>
            <p className="mt-1 inline-block rounded-full bg-[#d4af5f] px-2 py-0.5 text-[11px] font-extrabold text-[#0f2236]">{rareText(c)}</p>
          </div>
        ))}
      </div>
      <ul className="mt-4 flex flex-col gap-1.5 rounded-lg border-l-4 border-[#d4af5f] bg-white/[0.06] px-3 py-2 text-[13px] leading-relaxed">
        <li>
          <b>둘 다 가진 살</b> · {list(both)}
        </li>
        <li>
          <b>{me.name}님에게만</b> · {list(onlyMe)}
        </li>
        <li>
          <b>{friend.name}님에게만</b> · {list(onlyThem)}
        </li>
      </ul>
      <p className="mt-2 text-[12px] text-hanji/60">같은 살이라도 다른 칸과 어울리는 결은 사람마다 달라요.</p>
    </section>
  );
}
