import { CHARACTER, CHARACTER_NAME, SERVICE_NAME } from "@/lib/brand";

// Landing hero: an empty throne in front of an 일월오봉도, the screen that stood behind every Joseon throne.
// The visitor is the one who takes the seat; 정 훈도 only bows from the corner. The scene lives in
// public/throne.svg so the landing link preview (app/opengraph-image.tsx) can reuse it.
export default function Hero() {
  return (
    <header className="animate-rise relative mt-4 overflow-hidden rounded-3xl border-2 border-gold/60 shadow-[0_10px_30px_rgb(33_27_23/0.25)]">
      <div className="relative h-[420px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/throne.svg" alt="" width={390} height={420} className="absolute inset-0 size-full object-cover object-bottom" />
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
