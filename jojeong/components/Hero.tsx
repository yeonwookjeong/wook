import { CHARACTER_NAME, SERVICE_NAME } from "@/lib/brand";

// Landing hero: 정 훈도 reading a star-chart scroll in front of an 일월오봉도, the screen that stood behind every
// Joseon throne. The painting is drawn inline so it stays sharp at any width and costs no extra request.
function Irworobongdo() {
  return (
    <svg
      viewBox="0 0 390 400"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-0 size-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#17304a" />
          <stop offset="1" stopColor="#2c5a6a" />
        </linearGradient>
        <linearGradient id="peak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6fae8a" />
          <stop offset="0.45" stopColor="#2f7560" />
          <stop offset="1" stopColor="#1d4d43" />
        </linearGradient>
        <linearGradient id="peakFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4f8f7a" />
          <stop offset="1" stopColor="#1f4a44" />
        </linearGradient>
        <radialGradient id="sunGlow">
          <stop offset="0.55" stopColor="#e0523c" stopOpacity="0.45" />
          <stop offset="1" stopColor="#e0523c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonGlow">
          <stop offset="0.55" stopColor="#f6edd2" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f6edd2" stopOpacity="0" />
        </radialGradient>
        <pattern id="waves" width="28" height="14" patternUnits="userSpaceOnUse">
          <path d="M0 14 Q7 1 14 14 Q21 1 28 14" fill="none" stroke="#e8f0ee" strokeWidth="1.6" opacity="0.85" />
          <path d="M3 14 Q7 6 11 14 M17 14 Q21 6 25 14" fill="none" stroke="#e8f0ee" strokeWidth="1" opacity="0.5" />
        </pattern>
      </defs>

      <rect width="390" height="400" fill="url(#sky)" />

      {/* 달(왼쪽)과 해(오른쪽) */}
      <circle cx="58" cy="150" r="46" fill="url(#moonGlow)" />
      <circle cx="58" cy="150" r="24" fill="#f3ead0" />
      <circle cx="332" cy="150" r="46" fill="url(#sunGlow)" />
      <circle cx="332" cy="150" r="24" fill="#d2402e" />

      {/* 다섯 봉우리 */}
      <path d="M-30 330 C-5 262 18 238 34 236 C54 242 72 272 92 330 Z" fill="url(#peakFar)" />
      <path d="M298 330 C318 272 336 242 356 236 C372 238 395 262 420 330 Z" fill="url(#peakFar)" />
      <path d="M112 330 C146 214 172 168 195 160 C218 168 244 214 278 330 Z" fill="url(#peak)" stroke="#173f37" strokeWidth="1.2" />
      <path d="M18 330 C48 256 76 214 98 208 C122 216 146 262 172 330 Z" fill="url(#peak)" stroke="#173f37" strokeWidth="1.2" />
      <path d="M218 330 C244 262 268 216 292 208 C314 214 342 256 372 330 Z" fill="url(#peak)" stroke="#173f37" strokeWidth="1.2" />
      {/* 능선 결 */}
      <g fill="none" stroke="#9fd0b0" strokeWidth="1" opacity="0.45">
        <path d="M195 168 C186 200 178 236 170 280" />
        <path d="M195 168 C204 200 212 236 220 280" />
        <path d="M98 216 C92 240 86 266 80 300" />
        <path d="M292 216 C298 240 304 266 310 300" />
      </g>

      {/* 폭포 */}
      <g stroke="#e6f1f0" strokeLinecap="round" opacity="0.75">
        <path d="M160 262 V318" strokeWidth="3" />
        <path d="M166 272 V318" strokeWidth="1.5" />
        <path d="M230 262 V318" strokeWidth="3" />
        <path d="M224 272 V318" strokeWidth="1.5" />
      </g>

      {/* 소나무 */}
      {[
        { x: 22, flip: 1 },
        { x: 368, flip: -1 },
      ].map(({ x, flip }) => (
        <g key={x} transform={`translate(${x} 0) scale(${flip} 1)`}>
          <path d="M0 340 C6 300 -2 262 8 226 C14 204 10 188 18 170" fill="none" stroke="#8b3a26" strokeWidth="7" strokeLinecap="round" />
          <path d="M6 250 C18 244 30 240 42 242" fill="none" stroke="#8b3a26" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M14 196 C24 190 34 188 46 190" fill="none" stroke="#8b3a26" strokeWidth="3" strokeLinecap="round" />
          <g fill="#1f4a33" stroke="#2f6b49" strokeWidth="1">
            <ellipse cx="18" cy="168" rx="30" ry="10" />
            <ellipse cx="40" cy="188" rx="22" ry="8" />
            <ellipse cx="42" cy="240" rx="24" ry="8" />
            <ellipse cx="2" cy="222" rx="20" ry="7" />
          </g>
        </g>
      ))}

      {/* 물결 */}
      <rect y="318" width="390" height="82" fill="#244f73" />
      <rect y="318" width="390" height="82" fill="url(#waves)" />
    </svg>
  );
}

export default function Hero() {
  return (
    <header className="animate-rise relative mt-4 overflow-hidden rounded-3xl border-2 border-gold/60 shadow-[0_10px_30px_rgb(33_27_23/0.25)]">
      <div className="relative h-[400px]">
        <Irworobongdo />
        <div className="absolute inset-x-0 top-0 flex flex-col items-center pt-7 text-center">
          <p className="rounded-full border border-[#f3ead0]/50 bg-black/15 px-3 py-1 text-[11px] font-bold tracking-widest text-[#f3ead0]">
            조선 왕실도 사주를 봤다
          </p>
          <h1 className="mt-3 font-myeongjo text-[34px] font-extrabold tracking-tight text-[#f7efd9] drop-shadow-[0_2px_6px_rgb(0_0_0/0.45)]">
            {SERVICE_NAME}
          </h1>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hundo-hero.png"
          alt={`${CHARACTER_NAME}이 사주 두루마리를 들고 있는 모습`}
          width={512}
          height={556}
          className="absolute bottom-0 left-1/2 w-[64%] max-w-[270px] -translate-x-1/2 drop-shadow-[0_8px_16px_rgb(0_0_0/0.35)]"
        />
      </div>
    </header>
  );
}
