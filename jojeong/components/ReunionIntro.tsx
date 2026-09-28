import type { Person } from "@/lib/pairToken";
import type { Reunion } from "@/lib/reunion";
import { MiniChart } from "./PairIntro";

// Before the written 재회운: the threads that remain, what pushed the two apart, and the years that bring them
// back in reach (lib/reunion.ts). Its own reading, not the 궁합 score.
export default function ReunionIntro({ a, b, r }: { a: Person; b: Person; r: Reunion }) {
  return (
    <section className="doc-paper mt-4 px-4 py-5">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">再 會</p>
      <h2 className="mt-1 text-center font-myeongjo text-lg font-extrabold">두 사람 사이에 남은 끈을 봤어요</h2>

      <div className="mt-4 flex gap-3">
        <MiniChart person={a} />
        <MiniChart person={b} />
      </div>

      <div className="mt-5 flex flex-col items-center">
        <span className="text-xs text-ink-soft">사주로 본 두 사람</span>
        <span className="font-myeongjo text-2xl font-extrabold text-seal">{r.verdict}</span>
        <span className="text-[11px] text-ink-soft">
          남은 끈 {r.ties.length}개 · 멀어지게 한 것 {r.splits.length}개
        </span>
      </div>

      <ul className="mt-4 flex flex-col gap-2 text-[14px] leading-snug">
        {r.ties.map((t) => (
          <li key={t} className="border-b border-seal/10 pb-2">
            <span className="text-seal">∞</span> {t}
          </li>
        ))}
        {r.splits.map((t) => (
          <li key={t} className="border-b border-seal/10 pb-2 text-ink/85">
            <span className="text-ink-soft">△</span> {t}
          </li>
        ))}
        {!r.ties.length && !r.splits.length && (
          <li className="border-b border-seal/10 pb-2">사주로는 크게 당기지도 밀어내지도 않는 사이예요. 멀어진 건 사주보다 그때의 상황 탓이 컸을 거예요.</li>
        )}
      </ul>

      <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="text-ink-soft">다시 닿기 좋은 해</span>
        {r.windows.length ? (
          r.windows.map((w) => (
            <span key={w.year} className="rounded-full bg-seal px-2.5 py-0.5 font-bold text-hanji">
              {w.year}
            </span>
          ))
        ) : (
          <span className="rounded-full border border-ink/30 px-2.5 py-0.5">2030년까지 뚜렷한 해 없음</span>
        )}
        {r.windows.length > 0 && <span className="text-ink-soft">· 달까지는 보고서에서</span>}
      </p>
      <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
        사주로 본 인연의 구조예요. 다시 만날지는 결국 두 사람의 마음과 선택이 정해요.
      </p>
    </section>
  );
}
