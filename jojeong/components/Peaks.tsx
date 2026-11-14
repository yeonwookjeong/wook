// 일월오봉도, the screen behind every Joseon throne: the sun, the moon and five peaks over the waves. Drawn here as
// flat lines in the brand colors (no copy of any painting), for the 왕이 될 사주 notice and the 조정도 throne.
export default function Peaks({ className = "absolute inset-0 size-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 390 130" preserveAspectRatio="xMidYMid slice" aria-hidden className={className}>
      <circle cx="300" cy="32" r="15" fill="#b3261e" />
      <circle cx="90" cy="32" r="15" fill="#f4ecdb" opacity=".9" />
      <g fill="#22324a" stroke="#d9b465" strokeWidth="1.2" strokeOpacity=".7">
        <path d="M0 106 L48 62 L88 94 Z" />
        <path d="M58 106 L118 50 L170 98 Z" />
        <path d="M140 106 L195 22 L250 106 Z" />
        <path d="M220 98 L272 50 L332 106 Z" />
        <path d="M302 94 L342 62 L390 106 Z" />
      </g>
      <g fill="none" stroke="#d9b465" strokeOpacity=".45" strokeWidth="1.2">
        <path d="M0 114 q12 -8 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" />
        <path d="M0 126 q12 -8 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" />
      </g>
    </svg>
  );
}
