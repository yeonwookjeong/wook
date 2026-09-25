import { badReason, goodReason, pairHighlights, type Pair } from "@/lib/pairs";
import type { Minister } from "@/lib/store";

function PairCard({ label, pair, reason, tone }: { label: string; pair: Pair; reason: string; tone: "gold" | "seal" }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3.5 ${tone === "gold" ? "border-gold/40 bg-gold/5" : "border-seal/30 bg-seal/5"}`}
    >
      <div className="flex items-baseline justify-between">
        <p className={`text-xs font-extrabold ${tone === "gold" ? "text-gold" : "text-seal"}`}>{label}</p>
        <p className="font-myeongjo text-xl font-extrabold">
          {pair.score}
          <span className="ml-0.5 text-xs font-normal text-ink-soft">점</span>
        </p>
      </div>
      <p className="mt-1 font-myeongjo text-lg font-extrabold">
        {pair.a.name} <span className="text-ink-soft">×</span> {pair.b.name}
      </p>
      <p className="mt-0.5 text-sm text-ink-soft">{reason}</p>
    </div>
  );
}

export default function PairHighlights({ ministers }: { ministers: Minister[] }) {
  const h = pairHighlights(ministers);
  if (!h) return null;
  return (
    <section className="mt-6">
      <p className="mb-2 text-center text-xs font-bold text-ink-soft">정 훈도가 살핀 신하들끼리의 궁합</p>
      <div className="flex flex-col gap-2">
        {h.worst ? (
          <>
            <PairCard label="천생연분" pair={h.best} reason={goodReason(h.best.facts)} tone="gold" />
            <PairCard label="앙숙" pair={h.worst} reason={badReason(h.worst.facts)} tone="seal" />
          </>
        ) : (
          <PairCard
            label={h.best.score >= 60 ? "두 신하의 궁합" : "두 신하의 궁합 · 앙숙 주의"}
            pair={h.best}
            reason={h.best.score >= 60 ? goodReason(h.best.facts) : badReason(h.best.facts)}
            tone={h.best.score >= 60 ? "gold" : "seal"}
          />
        )}
      </div>
    </section>
  );
}
