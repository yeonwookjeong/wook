import type { Domain, DomainCard as Card } from "@/lib/domains";

const HEAD: Record<Domain, { hanja: string; title: string }> = {
  jaemul: { hanja: "財 物", title: "돈을 대하는 사주" },
  yeonae: { hanja: "緣 分", title: "사랑을 하는 사주" },
  jikup: { hanja: "適 性", title: "일을 하는 사주" },
};

// The top of a deep report: its own verdict and findings (lib/domains.ts), before anything shared with the
// life report.
// `ranked` (the second pass, lib/open.ts RENEW2): each number with where it stands among everyone and what it is made of.
export default function DomainCard({ name, domain, card, ranked = false }: { name: string; domain: Domain; card: Card; ranked?: boolean }) {
  return (
    <section className="doc-paper mt-4 px-5 py-5">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">{HEAD[domain].hanja}</p>
      <h2 className="mt-1 text-center font-myeongjo text-lg font-extrabold">
        {name}님의 {HEAD[domain].title}
      </h2>
      <p className="mt-3 text-center font-myeongjo text-2xl font-extrabold text-seal">{card.type}</p>
      <p className="mt-2 text-center text-[14px] leading-relaxed">{card.line}</p>
      <ul className="mt-4 flex flex-col gap-2">
        {card.facts.map((f) =>
          ranked && (f.rank || f.why) ? (
            <li key={f.label} className="border-b border-seal/10 pb-2 text-[14px] last:border-b-0">
              <span className="flex items-baseline gap-3">
                <span className="w-20 shrink-0 text-[12px] text-ink-soft">{f.label}</span>
                <b className="shrink-0">{f.value}</b>
                {f.rank && <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11.5px] font-bold ${f.rank === "보통 수준" ? "bg-ink/5 text-ink-soft" : "bg-seal/10 text-seal"}`}>{f.rank}</span>}
              </span>
              {f.note && <span className="mt-0.5 block pl-[5.75rem] text-[12px] leading-snug text-ink/80">{f.note}</span>}
              {f.why && <span className="mt-0.5 block pl-[5.75rem] text-[11px] leading-snug text-ink-soft">{f.why}</span>}
            </li>
          ) : (
            <li key={f.label} className="flex items-baseline gap-3 border-b border-seal/10 pb-2 text-[14px] last:border-b-0">
              <span className="w-20 shrink-0 text-[12px] text-ink-soft">{f.label}</span>
              <b className="shrink-0">{f.value}</b>
              {f.note && <span className="min-w-0 text-[12px] leading-snug text-ink/80">{f.note}</span>}
            </li>
          ),
        )}
      </ul>
      {ranked && <p className="mt-2 text-[11px] text-ink-soft">상위·하위와 &lsquo;100명 중&rsquo;은 1950~2008년에 태어날 수 있는 모든 날·시의 사주와 견준 값이에요.</p>}
    </section>
  );
}
