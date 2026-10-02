import type { Domain, DomainCard as Card } from "@/lib/domains";

const HEAD: Record<Domain, { hanja: string; title: string }> = {
  jaemul: { hanja: "財 物", title: "돈을 대하는 사주" },
  yeonae: { hanja: "緣 分", title: "사랑을 하는 사주" },
  jikup: { hanja: "適 性", title: "일을 하는 사주" },
};

// The top of a deep report: its own verdict and findings (lib/domains.ts), before anything shared with the
// life report.
export default function DomainCard({ name, domain, card }: { name: string; domain: Domain; card: Card }) {
  return (
    <section className="doc-paper mt-4 px-5 py-5">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">{HEAD[domain].hanja}</p>
      <h2 className="mt-1 text-center font-myeongjo text-lg font-extrabold">
        {name}님의 {HEAD[domain].title}
      </h2>
      <p className="mt-3 text-center font-myeongjo text-2xl font-extrabold text-seal">{card.type}</p>
      <p className="mt-2 text-center text-[14px] leading-relaxed">{card.line}</p>
      <ul className="mt-4 flex flex-col gap-2">
        {card.facts.map((f) => (
          <li key={f.label} className="flex items-baseline gap-3 border-b border-seal/10 pb-2 text-[14px] last:border-b-0">
            <span className="w-20 shrink-0 text-[12px] text-ink-soft">{f.label}</span>
            <b className="shrink-0">{f.value}</b>
            {f.note && <span className="min-w-0 text-[12px] leading-snug text-ink/80">{f.note}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
