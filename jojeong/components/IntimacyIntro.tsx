import { TEMPERS, type Intimacy, type Signs } from "@/lib/intimacy";
import type { Person } from "@/lib/pairToken";
import { MiniChart } from "./PairIntro";

function Bar({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      <span className="w-[3.75rem] shrink-0 whitespace-nowrap text-ink-soft">{label}</span>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink/8">
        <span className={`block h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, value)}%` }} />
      </span>
      <span className="w-8 shrink-0 text-right tabular-nums">{value}%</span>
    </div>
  );
}

function Temper({ name, s }: { name: string; s: Signs }) {
  const t = TEMPERS[s.temper];
  return (
    <div className="min-w-0 flex-1 rounded-2xl border border-seal/15 bg-white/60 px-3 py-3">
      <p className="truncate text-center text-xs text-ink-soft">{name}님</p>
      <p className="text-center font-myeongjo text-lg font-extrabold text-seal">{t.name}</p>
      <p className="mt-1 text-[12px] leading-snug">{t.line}</p>
      <div className="mt-2 flex flex-col gap-1">
        <Bar label="열기(火)" value={s.fire} tone="bg-seal/70" />
        <Bar label="촉촉함(水)" value={s.water} tone="bg-[#2f5d8a]/70" />
        <Bar label="표현" value={s.express} tone="bg-gold/80" />
        <Bar label="절제" value={s.restrain} tone="bg-ink/40" />
      </div>
    </div>
  );
}

// Before the written 속궁합: each one's temperature, the gap between them, and what draws them together or
// makes them miss each other (lib/intimacy.ts). Its own reading, not the 궁합 score.
export default function IntimacyIntro({ a, b, x }: { a: Person; b: Person; x: Intimacy }) {
  const gapLine =
    x.gap === "비슷함"
      ? "두 사람의 온도가 비슷해요. 따로 맞추지 않아도 같은 속도로 데워지는 사이예요."
      : `${x.warmer}님이 더 뜨거워요. ${x.gap === "많이 다름" ? "온도 차가 커서, 속도를 맞추는 게 이 관계의 숙제예요." : "조금의 차이가 오히려 설렘이 되는 사이예요."}`;
  return (
    <section className="doc-paper mt-4 px-4 py-5">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">合 歡</p>
      <h2 className="mt-1 text-center font-myeongjo text-lg font-extrabold">두 사람의 온도를 재 봤어요</h2>

      <div className="mt-4 flex gap-3">
        <MiniChart person={a} />
        <MiniChart person={b} />
      </div>

      <div className="mt-4 flex gap-2">
        <Temper name={a.name} s={x.a} />
        <Temper name={b.name} s={x.b} />
      </div>

      <ul className="mt-4 flex flex-col gap-2 text-[14px] leading-snug">
        <li className="border-b border-seal/10 pb-2">
          <b>온도 차 · {x.gap}</b> {gapLine}
        </li>
        <li className="border-b border-seal/10 pb-2">
          <b>먼저 다가가는 쪽</b> {x.faster}님이 먼저 표현하는 편이에요.
        </li>
        {x.pulls.map((p) => (
          <li key={p} className="border-b border-seal/10 pb-2">
            <span className="text-seal">♥</span> {p}
          </li>
        ))}
        {x.pulls.length === 0 && (
          <li className="border-b border-seal/10 pb-2">
            <span className="text-seal">♥</span> 첫눈에 튀는 끌림의 표시는 뚜렷하지 않아요. 불꽃보다 함께 쌓아 가는 친밀감이 큰 사이예요.
          </li>
        )}
        {x.snags.slice(0, 2).map((p) => (
          <li key={p} className="border-b border-seal/10 pb-2 text-ink/85">
            <span className="text-ink-soft">△</span> {p}
          </li>
        ))}
      </ul>

      {x.months.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-ink-soft">가까워지는 달</span>
          <span className="rounded-full bg-seal px-2.5 py-0.5 font-bold text-hanji">
            {x.months[0].label} {x.months[0].why}
          </span>
          {x.months.length > 1 && <span className="text-ink-soft">외 {x.months.length - 1}번은 보고서에서</span>}
        </p>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
        열기와 촉촉함은 사주의 불(火)과 물(水) 기운, 표현과 절제는 마음을 드러내는 기운과 다스리는 기운의 비율이에요. 궁합 점수와는 다른, 친밀감만 따로 본
        풀이예요.
      </p>
    </section>
  );
}
