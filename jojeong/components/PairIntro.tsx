import type { Couple } from "@/lib/couple";
import { BRANCH_EL, chartOf, ELEMENT_HANJA, ELEMENT_KO, stemEl } from "@/lib/myeongri";
import type { Person } from "@/lib/pairToken";
import { BRANCHES, isFull, STEMS } from "@/lib/saju";
import { Cell } from "./SajuChart";

export function MiniChart({ person }: { person: Person }) {
  if (!isFull(person.pillars)) return null;
  const slots = chartOf(person.pillars);
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1.5 truncate text-center text-sm font-extrabold">{person.name}</p>
      <div className="grid grid-cols-4 gap-1 text-center">
        {slots.map((s) => (
          <div key={s.pos} className="flex flex-col gap-1">
            <span className="text-[10px] text-ink-soft">{s.pos}</span>
            <Cell value={s.stem === null ? null : STEMS[s.stem]} el={s.stem === null ? null : stemEl(s.stem)} />
            <Cell value={s.branch === null ? null : BRANCHES[s.branch]} el={s.branch === null ? null : BRANCH_EL[s.branch]} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Before the written 궁합: both charts side by side and what the engine found between them (lib/couple.ts).
export default function PairIntro({ a, b, c }: { a: Person; b: Person; c: Couple }) {
  const EL = (e: number) => `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`;
  return (
    <section className="doc-paper mt-4 px-4 py-5">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">合 讀</p>
      <h2 className="mt-1 text-center font-myeongjo text-lg font-extrabold">두 사람의 사주를 나란히 놓고 봤어요</h2>

      <div className="mt-4 flex gap-3">
        <MiniChart person={a} />
        <MiniChart person={b} />
      </div>

      <div className="mt-5 flex flex-col items-center">
        <span className="text-xs text-ink-soft">궁합 점수</span>
        <span className="font-myeongjo text-4xl font-extrabold text-seal">{c.score}점</span>
        <span className="text-[11px] text-ink-soft">평균 69점 · 점수보다 아래의 &lsquo;왜&rsquo;가 더 중요해요</span>
      </div>

      <ul className="mt-4 flex flex-col gap-2 text-[14px] leading-snug">
        <li className="border-b border-seal/10 pb-2">
          <b>{b.name}</b>님은 {a.name}님에게 <b>{c.roles[0]}</b>
        </li>
        <li className="border-b border-seal/10 pb-2">
          <b>{a.name}</b>님은 {b.name}님에게 <b>{c.roles[1]}</b>
        </li>
        {c.seat.map((s) => (
          <li key={s} className="border-b border-seal/10 pb-2">
            {s}
          </li>
        ))}
        {c.lends.slice(0, 2).map((l) => (
          <li key={`${l.to}-${l.el}`} className="border-b border-seal/10 pb-2">
            {l.to}님에게 부족한 {EL(l.el)} 기운을 <b>{l.from}님</b>이 {l.pct}% 갖고 있어요
          </li>
        ))}
        {c.sharedLack.length > 0 && (
          <li className="border-b border-seal/10 pb-2">둘 다 {c.sharedLack.map(EL).join("·")} 기운이 부족해요. 함께 채워야 할 부분이에요.</li>
        )}
      </ul>

      {c.years.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-1.5">
          {c.years.map((y) => (
            <span
              key={y.year}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${y.mark === "함께 좋은 해" ? "bg-seal text-hanji" : "border border-ink/30 text-ink"}`}
            >
              {y.year} {y.mark}
            </span>
          ))}
        </p>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
        두 사람 각자의 사주도 같은 방식(자리마다 다른 무게, 계절 보정, 합)으로 읽었어요. 아래 보고서는 이 관계를 바탕으로 썼어요.
      </p>
    </section>
  );
}
