import type { Person } from "@/lib/pairToken";
import { starPair } from "@/lib/celebs";
import { MiniChart } from "./PairIntro";

// Before the written 유명인 궁합: the same title and standing the /star game used to show free (대표님 11/21: 덤을
// 빼고 상품으로), so the reader sees why it is worth reading on. The famous person's chart has no hour.
export default function StarPairIntro({ a, b }: { a: Person; b: Person }) {
  const s = starPair(a.pillars, b.pillars);
  return (
    <section className="doc-paper mt-4 px-4 py-5">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">星 合</p>
      <h2 className="mt-1 text-center font-myeongjo text-lg font-extrabold">
        {a.name}님과 {b.name}님, 사주로 나란히 놓아 봤어요
      </h2>
      <div className="mt-4 flex gap-3">
        <MiniChart person={a} />
        <MiniChart person={b} />
      </div>
      <div className="mt-5 flex flex-col items-center">
        <span className="text-xs text-ink-soft">사주로 본 두 사람</span>
        <span className={`font-myeongjo text-2xl font-extrabold ${s.low ? "text-ink" : "text-seal"}`}>{s.title}</span>
        <span className="text-[12px] text-ink-soft">
          실제 두 사람을 짝지은 경우 가운데 {s.low ? "하위" : "상위"} {s.pct}%
        </span>
      </div>
      {s.why.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2 text-[14px] leading-snug">
          {s.why.map((t) => (
            <li key={t} className="border-b border-seal/10 pb-2">
              <span className={s.low ? "text-ink-soft" : "text-seal"}>{s.low ? "△" : "∞"}</span> {t}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-center text-[11.5px] text-ink-soft">{b.name}님은 태어난 시가 알려지지 않아 여섯 글자로 봤어요. 재미로 보는 궁합이에요.</p>
    </section>
  );
}
