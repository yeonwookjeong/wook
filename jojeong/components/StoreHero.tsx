import Link from "next/link";
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

// `cta`: the first thing to do here — the free reading of one's own chart.
export default function StoreHero({ cta }: { cta?: { href: string; label: string; sub: string } }) {
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
        {/* Few visitors know what a 훈도 was: say it first, then the name built on it. */}
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-[#e2bc68]">命課學 訓導</p>
        <p className="mt-2 max-w-[17rem] text-[12px] leading-relaxed text-[#f3ead0]/85">
          <b className="text-[#f7efd9]">명과학 훈도</b>는 조선 관상감에서
          <br />
          사주와 길일을 가르치던 관원이에요
        </p>
        <h1 className="mt-4 font-myeongjo text-[38px] leading-tight font-extrabold text-[#f7efd9] drop-shadow-[0_2px_6px_rgb(0_0_0/0.4)]">
          훈도사주
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[#f3ead0]/80">
          누구에게나 맞는 말 말고,
          <br />
          <b className="text-[#f7efd9]">나한테만 맞는 말</b>
        </p>
        {cta && (
          <>
            <Link
              href={cta.href}
              className="mt-6 block w-full max-w-[18rem] rounded-2xl bg-[#e2bc68] py-3.5 font-myeongjo text-[17px] font-extrabold text-[#17304a] shadow-[0_5px_0_#9c7a2e]"
            >
              {cta.label}
            </Link>
            <p className="mt-2 text-[11px] text-[#f3ead0]/75">{cta.sub}</p>
          </>
        )}

        <div className="mt-8 flex w-full items-end gap-3 text-left">
          <div className="size-20 shrink-0 overflow-hidden rounded-full border-[3px] border-[#d9ad52] bg-[#f7efd9] shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={CHARACTER.bust} alt={`별자리 두루마리를 든 ${CHARACTER_NAME}`} width={80} height={80} className="size-full object-cover" />
          </div>
          <p className="relative mb-2 flex-1 rounded-2xl rounded-bl-sm bg-[#f7efd9]/95 px-4 py-3 text-[13px] leading-relaxed text-ink">
            <span className="block text-[11px] font-extrabold text-seal">관상감 명과학 훈도 · 정가</span>
            소신이 그 훈도, 정가이옵니다. 왕실의 사주와 궁합을 보던 눈으로, 이제 그대의 여덟 글자를 보겠사옵니다.
          </p>
        </div>
      </div>
    </header>
  );
}
