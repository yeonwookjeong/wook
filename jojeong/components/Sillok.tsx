import { KING_AVG_LIFESPAN, sillok, type Cast } from "@/lib/sillok";
import type { Pillars } from "@/lib/saju";

const HANJA_NUM = "一二三四五六";

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-white/60 px-1 py-2.5">
      <span className="text-[11px] text-ink-soft">{label}</span>
      <span className={`mt-0.5 font-myeongjo text-lg font-extrabold ${accent ? "text-seal" : ""}`}>{value}</span>
    </div>
  );
}

export default function Sillok({ kingName, pillars, cast = {} }: { kingName: string; pillars: Pillars; cast?: Cast }) {
  const s = sillok(pillars, cast);
  const hasCast = Boolean(cast.yeong || cast.gansin || cast.yubae || cast.witness);

  return (
    <section className="mt-6 rounded-3xl border border-ink/15 bg-[#fbf6ea] px-5 pt-6 pb-5 shadow-sm">
      <p className="text-center font-myeongjo text-sm font-extrabold tracking-[0.3em] text-seal">假 想 實 錄</p>
      <h2 className="mt-2 text-center font-myeongjo text-2xl font-extrabold">{kingName} 전하의 가상 실록</h2>
      <p className="mt-1 text-center font-myeongjo text-base font-bold text-gold">{s.epithet}</p>

      <div className="mt-5 grid grid-cols-4 gap-1.5">
        <Stat label="즉위" value={`${s.accession}세`} />
        <Stat label="재위" value={`${s.reign}년`} />
        <Stat label="향년" value={`${s.death}세`} />
        <Stat label="수명 순위" value={`${s.rank}위`} accent />
      </div>
      <p className="mt-1.5 text-center text-[11px] text-ink-soft/80">
        조선 27왕과 견준 순위 · 실제 왕들의 평균 수명은 {KING_AVG_LIFESPAN}세
      </p>

      <div className="mt-5 flex flex-col">
        {s.chapters.map((c, i) => (
          <article key={c.title} className="border-t border-ink/10 py-4 first:border-t-0 first:pt-0">
            <h3 className="font-myeongjo text-sm font-extrabold text-seal">
              제{HANJA_NUM[i]}장 <span className="text-ink">{c.title}</span>
            </h3>
            <p className="mt-1.5 text-[15px] leading-relaxed">{c.text}</p>
          </article>
        ))}
      </div>

      <blockquote className="mt-2 rounded-2xl bg-ink/5 px-4 py-3">
        <p className="text-xs font-extrabold text-ink-soft">사관은 이렇게 적었다</p>
        <p className="mt-1 font-myeongjo text-[15px] leading-relaxed">&ldquo;{s.sagwan}&rdquo;</p>
      </blockquote>

      {!hasCast && (
        <p className="mt-4 rounded-xl border border-dashed border-seal/40 px-4 py-3 text-center text-sm text-seal">
          신하를 부르면 그들의 이름이 실록에 오르옵니다
        </p>
      )}

      <p className="mt-4 text-right font-myeongjo text-sm text-ink-soft">— 관상감 명과학 훈도 정가, 삼가 적음</p>
      <p className="mt-2 text-center text-[11px] text-ink-soft/80">전하의 사주로 지어 올린 가상의 기록이옵니다.</p>
    </section>
  );
}
