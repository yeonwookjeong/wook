import { CHARACTER, CHARACTER_NAME, SERVICE_NAME } from "@/lib/brand";

// Landing hero: an empty throne in front of an 일월오봉도, the screen that stood behind every Joseon throne.
// The visitor is the one who takes the seat; 정 훈도 only bows from the corner. Drawn inline so it stays sharp
// at any width and costs no extra request.
function ThroneRoom() {
  return (
    <svg viewBox="0 0 390 420" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full" aria-hidden="true">
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
        <linearGradient id="lacquer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b5301f" />
          <stop offset="1" stopColor="#7e1f16" />
        </linearGradient>
        <radialGradient id="sunGlow">
          <stop offset="0.55" stopColor="#e0523c" stopOpacity="0.45" />
          <stop offset="1" stopColor="#e0523c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonGlow">
          <stop offset="0.55" stopColor="#f6edd2" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f6edd2" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="throneLight" cx="0.5" cy="0.62" r="0.5">
          <stop offset="0" stopColor="#f3d27a" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f3d27a" stopOpacity="0" />
        </radialGradient>
        <pattern id="waves" width="28" height="14" patternUnits="userSpaceOnUse">
          <path d="M0 14 Q7 1 14 14 Q21 1 28 14" fill="none" stroke="#e8f0ee" strokeWidth="1.6" opacity="0.85" />
          <path d="M3 14 Q7 6 11 14 M17 14 Q21 6 25 14" fill="none" stroke="#e8f0ee" strokeWidth="1" opacity="0.5" />
        </pattern>
      </defs>

      <rect width="390" height="420" fill="url(#sky)" />

      {/* 달(왼쪽)과 해(오른쪽) */}
      <circle cx="58" cy="160" r="46" fill="url(#moonGlow)" />
      <circle cx="58" cy="160" r="24" fill="#f3ead0" />
      <circle cx="332" cy="160" r="46" fill="url(#sunGlow)" />
      <circle cx="332" cy="160" r="24" fill="#d2402e" />

      {/* 다섯 봉우리 */}
      <path d="M-30 330 C-5 262 18 238 34 236 C54 242 72 272 92 330 Z" fill="url(#peakFar)" />
      <path d="M298 330 C318 272 336 242 356 236 C372 238 395 262 420 330 Z" fill="url(#peakFar)" />
      <path d="M112 330 C146 214 172 168 195 160 C218 168 244 214 278 330 Z" fill="url(#peak)" stroke="#173f37" strokeWidth="1.2" />
      <path d="M18 330 C48 256 76 214 98 208 C122 216 146 262 172 330 Z" fill="url(#peak)" stroke="#173f37" strokeWidth="1.2" />
      <path d="M218 330 C244 262 268 216 292 208 C314 214 342 256 372 330 Z" fill="url(#peak)" stroke="#173f37" strokeWidth="1.2" />
      <g fill="none" stroke="#9fd0b0" strokeWidth="1" opacity="0.45">
        <path d="M98 216 C92 240 86 266 80 300" />
        <path d="M292 216 C298 240 304 266 310 300" />
      </g>

      {/* 폭포 */}
      <g stroke="#e6f1f0" strokeLinecap="round" opacity="0.75">
        <path d="M150 268 V322" strokeWidth="3" />
        <path d="M240 268 V322" strokeWidth="3" />
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
      <rect y="322" width="390" height="98" fill="#244f73" />
      <rect y="322" width="390" height="98" fill="url(#waves)" />

      {/* 비어 있는 옥좌와 단 */}
      <ellipse cx="195" cy="300" rx="140" ry="110" fill="url(#throneLight)" />
      <g stroke="#d9ad52" strokeWidth="1.6">
        <rect x="46" y="392" width="298" height="28" fill="#5e1d14" />
        <rect x="70" y="374" width="250" height="18" fill="#6c2218" />
        <rect x="94" y="356" width="202" height="18" fill="#7a271b" />
        <g fill="url(#lacquer)">
          {/* 등받이 */}
          <path d="M140 316 V240 Q140 214 164 210 H226 Q250 214 250 240 V316 Z" />
          {/* 팔걸이 */}
          <rect x="122" y="280" width="24" height="44" rx="4" />
          <rect x="244" y="280" width="24" height="44" rx="4" />
          {/* 앉는 자리와 앞판 */}
          <rect x="128" y="312" width="134" height="12" rx="3" />
          <path d="M136 324 H254 L248 356 H142 Z" />
        </g>
        {/* 등받이 윗장식 */}
        <path d="M146 214 Q195 180 244 214" fill="#c23a22" />
      </g>
      <rect x="156" y="224" width="78" height="76" rx="6" fill="#6e1b13" stroke="#d9ad52" strokeWidth="1" />
      <g fill="none" stroke="#d9ad52" strokeWidth="1.2" opacity="0.9">
        <circle cx="195" cy="262" r="16" />
        <circle cx="195" cy="262" r="9" />
        <path d="M195 240 V246 M195 278 V284 M173 262 H179 M211 262 H217" />
        <path d="M150 340 H240" opacity="0.6" />
      </g>
      <circle cx="195" cy="192" r="5" fill="#e9c46a" />
    </svg>
  );
}

export default function Hero() {
  return (
    <header className="animate-rise relative mt-4 overflow-hidden rounded-3xl border-2 border-gold/60 shadow-[0_10px_30px_rgb(33_27_23/0.25)]">
      <div className="relative h-[420px]">
        <ThroneRoom />
        <div className="absolute inset-x-0 top-0 flex flex-col items-center pt-7 text-center">
          <p className="rounded-full border border-[#f3ead0]/50 bg-black/15 px-3 py-1 text-[11px] font-bold tracking-widest text-[#f3ead0]">
            조선 왕실도 사주를 봤다
          </p>
          <h1 className="mt-3 font-myeongjo text-[34px] font-extrabold tracking-tight text-[#f7efd9] drop-shadow-[0_2px_6px_rgb(0_0_0/0.45)]">
            {SERVICE_NAME}
          </h1>
          <p className="mt-1 font-myeongjo text-sm font-bold text-[#e9c46a]">옥좌의 주인을 찾사옵니다</p>
        </div>

        {/* 정 훈도: 구석에서 허리 숙인 신하 */}
        <div className="absolute right-3 bottom-3 flex items-end gap-1.5">
          <p className="mb-2 rounded-xl rounded-br-sm bg-[#f7efd9]/95 px-2.5 py-1.5 text-[11px] font-bold text-ink shadow">
            전하, 납시옵소서
          </p>
          <div className="size-16 overflow-hidden rounded-full border-2 border-[#d9ad52] bg-[#f7efd9] shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={CHARACTER.bow}
              alt={`허리 숙여 인사하는 ${CHARACTER_NAME}`}
              width={64}
              height={64}
              className="size-full origin-bottom scale-[1.18] object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
