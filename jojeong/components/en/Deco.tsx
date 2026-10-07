// Joseon touches for the English pages, drawn in code (no image files):
// - Obang: the five cardinal colours (오방색) as a thin band, blue · red · yellow · white · black
// - SealHead: a section title with its Hanja in a red seal, the way scholars stamped their names
// - Cloud: an auspicious cloud (구름문) to divide sections

export const OBANG = ["#1f4e8c", "#b3261e", "#d9a521", "#f4ecdb", "#1d211f"];

export function Obang({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-1.5 w-full overflow-hidden rounded-full ${className}`} aria-hidden>
      {OBANG.map((c) => (
        <span key={c} className="flex-1" style={{ background: c, boxShadow: c === "#f4ecdb" ? "inset 0 0 0 1px rgba(0,0,0,0.08)" : undefined }} />
      ))}
    </div>
  );
}

export function SealHead({ hanja, title, sub }: { hanja: string; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="grid h-9 min-w-9 shrink-0 -rotate-3 place-items-center rounded-[4px] border-2 border-seal px-1 font-myeongjo text-[15px] leading-none font-extrabold text-seal"
        aria-hidden
      >
        {hanja}
      </span>
      <div className="min-w-0">
        <p className="font-myeongjo text-[17px] leading-tight font-extrabold">{title}</p>
        {sub && <p className="text-[11.5px] text-ink-soft">{sub}</p>}
      </div>
    </div>
  );
}

export function Cloud({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 24" className={`mx-auto block h-5 w-28 text-seal/60 ${className}`} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M10 16 q-6 -8 2 -11 q4 -6 11 -1 q7 -4 10 3 q6 0 5 6" />
        <path d="M20 16 q2 -4 6 -2" />
        <path d="M38 13 H82" />
        <path d="M110 16 q6 -8 -2 -11 q-4 -6 -11 -1 q-7 -4 -10 3 q-6 0 -5 6" />
        <path d="M100 16 q-2 -4 -6 -2" />
        <circle cx="60" cy="13" r="3" />
      </g>
    </svg>
  );
}
