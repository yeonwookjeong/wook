// Joseon touches for the English pages, drawn in code (no image files):
// - IlwolBanner: the Sun, Moon and Five Peaks (일월오봉도), the screen that stood behind every Joseon king's throne
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

export function IlwolBanner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 170" className={`block w-full ${className}`} role="img" aria-label="The Sun, Moon and Five Peaks, a Joseon royal screen">
      <defs>
        <linearGradient id="iw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c3a63" />
          <stop offset="1" stopColor="#2f5d8a" />
        </linearGradient>
      </defs>
      <rect width="400" height="170" fill="url(#iw-sky)" />
      {/* the moon (left) and the sun (right), as on the screen */}
      <circle cx="78" cy="42" r="17" fill="#f4ecdb" />
      <circle cx="322" cy="42" r="17" fill="#c8321f" />
      {/* five peaks */}
      <g stroke="#13233b" strokeWidth="1.5">
        <path d="M-10 150 L45 78 L100 150 Z" fill="#2f6b4f" />
        <path d="M300 150 L355 78 L410 150 Z" fill="#2f6b4f" />
        <path d="M60 150 L120 62 L180 150 Z" fill="#3d7d5c" />
        <path d="M220 150 L280 62 L340 150 Z" fill="#3d7d5c" />
        <path d="M130 150 L200 40 L270 150 Z" fill="#4a8d68" />
      </g>
      {/* snow caps */}
      <g fill="#e9e2cf">
        <path d="M190 56 L200 40 L210 56 Q200 52 190 56 Z" />
        <path d="M112 74 L120 62 L128 74 Q120 71 112 74 Z" />
        <path d="M272 74 L280 62 L288 74 Q280 71 272 74 Z" />
      </g>
      {/* pines */}
      <g fill="#7a3b26">
        <rect x="16" y="112" width="4" height="40" />
        <rect x="380" y="112" width="4" height="40" />
      </g>
      <g fill="#1f4a32">
        <ellipse cx="18" cy="110" rx="16" ry="6" />
        <ellipse cx="18" cy="100" rx="12" ry="5" />
        <ellipse cx="382" cy="110" rx="16" ry="6" />
        <ellipse cx="382" cy="100" rx="12" ry="5" />
      </g>
      {/* waves */}
      <rect y="146" width="400" height="24" fill="#1f4e8c" />
      <g fill="none" stroke="#e9e2cf" strokeWidth="1.6" strokeLinecap="round">
        {Array.from({ length: 11 }, (_, i) => (
          <path key={i} d={`M${i * 40 - 10} 162 q10 -12 20 0 q10 12 20 0`} />
        ))}
      </g>
    </svg>
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
