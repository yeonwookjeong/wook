import { KING_AVG_LIFESPAN, sillok, type Cast } from "@/lib/sillok";
import type { Pillars } from "@/lib/saju";

const HANJA_NUM = "一二三四五六";

const TIER_STYLE = {
  seong: "border-gold bg-gold/10 text-gold",
  myeong: "border-gold/70 bg-gold/5 text-gold",
  pyeong: "border-ink/30 bg-white/50 text-ink",
  am: "border-ink/60 bg-ink/5 text-ink",
  pok: "border-seal bg-seal/10 text-seal",
} as const;

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-white/60 px-1 py-2.5">
      <span className="text-[11px] text-ink-soft">{label}</span>
      <span className={`mt-0.5 font-myeongjo text-lg font-extrabold ${accent ? "text-seal" : ""}`}>{value}</span>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="shrink-0 tracking-tight" aria-label={`5점 만점에 ${value}점`}>
      <span className="text-gold">{"★".repeat(value)}</span>
      <span className="text-ink/15">{"★".repeat(5 - value)}</span>
    </span>
  );
}

export default function Sillok({ kingName, pillars, cast = {} }: { kingName: string; pillars: Pillars; cast?: Cast }) {
  const s = sillok(pillars, { cast, kingName });
  const hasCast = Boolean(cast.yeong || cast.gansin || cast.yubae || cast.witness);

  return (
    <section className="mt-6 rounded-3xl border border-ink/15 bg-[#fbf6ea] px-5 pt-6 pb-5 shadow-sm">
      <p className="text-center font-myeongjo text-sm font-extrabold tracking-[0.3em] text-seal">假 想 實 錄</p>
      <h2 className="mt-2 text-center font-myeongjo text-2xl font-extrabold">{kingName} 전하의 가상 실록</h2>

      {/* 한눈에 보기 */}
      <div className="mt-5 flex flex-col items-center text-center">
        <div className={`rounded-2xl border-2 px-5 py-2 ${TIER_STYLE[s.tier]}`}>
          <span className="font-myeongjo text-sm font-bold opacity-70">{s.tierHanja}</span>{" "}
          <span className="font-myeongjo text-2xl font-extrabold">{s.tierLabel}</span>
        </div>
        <p className="mt-2 text-xs text-ink-soft">{s.tierLine}</p>
        <p className="mt-3 font-myeongjo text-lg leading-snug font-extrabold break-keep">&ldquo;{s.headline}&rdquo;</p>
        <p className="mt-1.5 text-sm text-ink-soft">
          {s.deposed ? (
            <>
              폐위 · <b className="text-seal">{s.epithet}</b>으로 강등
            </>
          ) : (
            <>
              존호 <b className="text-gold">{s.epithet}</b>
            </>
          )}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-1.5">
        <Stat label="즉위" value={`${s.accession}세`} />
        <Stat label="재위" value={`${s.reign}년`} />
        <Stat label="향년" value={`${s.death}세`} />
        <Stat label="수명 순위" value={`${s.rank}위`} accent />
      </div>
      <p className="mt-1.5 text-center text-[11px] text-ink-soft/80">
        조선 27왕과 견준 순위 · 실제 왕들의 평균 수명은 {KING_AVG_LIFESPAN}세
      </p>

      <ul className="mt-4 flex flex-col divide-y divide-ink/10 rounded-2xl bg-white/60 px-4">
        {s.ratings.map((r) => (
          <li key={r.key} className="flex items-center gap-3 py-2.5">
            <span className="w-16 shrink-0 text-xs font-extrabold text-ink-soft">{r.label}</span>
            <Stars value={r.value} />
            <span className="min-w-0 text-[13px] leading-snug break-keep">{r.line}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-3 grid grid-cols-2 gap-1.5 text-center">
        <div className="rounded-xl bg-white/60 px-2 py-2.5">
          <dt className="text-[11px] text-ink-soft">신하들이 몰래 부른 이름</dt>
          <dd className="mt-0.5 font-myeongjo font-extrabold">{s.nickname}</dd>
        </div>
        <div className="rounded-xl bg-white/60 px-2 py-2.5">
          <dt className="text-[11px] text-ink-soft">백성들이 부른 이름</dt>
          <dd className="mt-0.5 font-myeongjo font-extrabold">{s.peopleName}</dd>
        </div>
      </dl>

      <div className="mt-3 rounded-2xl border border-ink/10 px-4 py-3">
        <p className="text-xs font-extrabold text-seal">정 훈도의 소견</p>
        <ul className="mt-1.5 flex flex-col gap-1 text-[13px] leading-snug text-ink-soft">
          {s.reasons.map((r) => (
            <li key={r}>· {r}</li>
          ))}
          <li className="font-bold text-ink">· 하여 {s.tierLabel}의 사주이며, {s.lifeVerdict}이옵니다.</li>
        </ul>
      </div>

      {/* 실록 본문: folded so the verdict above stays the first thing people see */}
      <details className="group mt-6">
        <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
          <span className="h-px flex-1 bg-ink/15" />
          <span className="rounded-full border border-seal/40 bg-white/70 px-4 py-2 font-myeongjo text-sm font-extrabold text-seal">
            <span className="group-open:hidden">실록 본문 펼쳐 보기 · 6장</span>
            <span className="hidden group-open:inline">실록 본문 접기</span>
          </span>
          <span className="h-px flex-1 bg-ink/15" />
        </summary>
        <div className="mt-4 flex flex-col">
          {s.chapters.map((c, i) => (
            <article key={c.title} className="border-t border-ink/10 py-4 first:border-t-0 first:pt-0">
              <h3 className="font-myeongjo text-sm font-extrabold text-seal">
                제{HANJA_NUM[i]}장 <span className="text-ink">{c.title}</span>
              </h3>
              {c.paras.map((t) => (
                <p key={t} className="mt-1.5 text-[15px] leading-relaxed">
                  {t}
                </p>
              ))}
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
      </details>
    </section>
  );
}
