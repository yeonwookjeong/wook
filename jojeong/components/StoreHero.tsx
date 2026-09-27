import { CHARACTER, CHARACTER_NAME } from "@/lib/brand";

// Main-page hero: a night sky with a round star chart in gold, the way 관상감 mapped the heavens (the circles
// and the 28 lunar mansions of 天象列次分野之圖), and the Big Dipper, the stars folk belief gave charge of fate.
// 정 훈도 appears in a medallion with his line; the character art has a white ground, hence the frame.

// A fixed scatter of stars (seeded, so every render matches).
function stars(n: number, seed: number) {
  let x = seed;
  const rnd = () => ((x = (x * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: n }, () => ({ cx: rnd() * 390, cy: rnd() * 380, r: 0.4 + rnd() * 1.3, o: 0.35 + rnd() * 0.55 }));
}
const STARS = stars(70, 20260927);
// 북두칠성: the handle and the bowl.
const DIPPER = [
  [34, 92],
  [58, 80],
  [80, 84],
  [100, 100],
  [130, 92],
  [140, 120],
  [108, 128],
] as const;

export default function StoreHero() {
  const cx = 300;
  const cy = 118;
  return (
    <header className="animate-rise relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-b from-[#0f2236] via-[#17304a] to-[#1f3d5c] shadow-[0_10px_30px_rgb(33_27_23/0.25)]">
      <svg viewBox="0 0 390 380" className="absolute inset-0 size-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
        {STARS.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#f3ead0" opacity={s.o} />
        ))}
        {/* 원형 천문도: rings and the 28 mansions */}
        <g stroke="#d9ad52" fill="none" opacity="0.32">
          {[48, 92, 136, 180].map((r) => (
            <circle key={r} cx={cx} cy={cy} r={r} strokeWidth={r === 136 ? 1.2 : 0.7} />
          ))}
          <ellipse cx={cx - 14} cy={cy + 10} rx={150} ry={118} strokeWidth="0.8" strokeDasharray="3 4" transform={`rotate(-18 ${cx} ${cy})`} />
          {Array.from({ length: 28 }, (_, i) => {
            const a = (i / 28) * Math.PI * 2;
            return <line key={i} x1={cx + Math.cos(a) * 48} y1={cy + Math.sin(a) * 48} x2={cx + Math.cos(a) * 180} y2={cy + Math.sin(a) * 180} strokeWidth="0.5" />;
          })}
        </g>
        {/* 북두칠성 */}
        <g opacity="0.85">
          <polyline points={[...DIPPER, DIPPER[3]].map((p) => p.join(",")).join(" ")} fill="none" stroke="#e2bc68" strokeWidth="0.9" strokeOpacity="0.55" />
          {DIPPER.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === 0 ? 2.4 : 2} fill="#f7e2a8" />
          ))}
        </g>
      </svg>

      <div className="relative flex flex-col items-center px-6 pt-10 pb-6 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.5em] text-[#e2bc68]">觀 象 監</p>
        <h1 className="mt-3 font-myeongjo text-[34px] leading-tight font-extrabold text-[#f7efd9] drop-shadow-[0_2px_6px_rgb(0_0_0/0.4)]">
          정 훈도의 사주
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[#f3ead0]/80">
          생년월일 하나로
          <br />
          <b className="text-[#f7efd9]">나도 몰랐던 나</b>를 읽어 드려요
        </p>

        <div className="mt-8 flex w-full items-end gap-3 text-left">
          <div className="size-20 shrink-0 overflow-hidden rounded-full border-[3px] border-[#d9ad52] bg-[#f7efd9] shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={CHARACTER.bust} alt={`별자리 두루마리를 든 ${CHARACTER_NAME}`} width={80} height={80} className="size-full object-cover" />
          </div>
          <p className="relative mb-2 flex-1 rounded-2xl rounded-bl-sm bg-[#f7efd9]/95 px-4 py-3 text-[13px] leading-relaxed text-ink">
            <span className="block text-[11px] font-extrabold text-seal">관상감 막내 · 정 훈도</span>
            소신, 관상감에서 왕실의 사주를 보던 몸이옵니다. 그대의 여덟 글자, 한 글자도 허투루 읽지 않겠사옵니다.
          </p>
        </div>
      </div>
    </header>
  );
}
