import { CHARACTER, CHARACTER_NAME, SERVICE_NAME } from "@/lib/brand";

// Landing hero: the 일월오봉도 that stood behind every Joseon throne, painted as a four-panel folding screen, with
// the title hung on a palace signboard (현판). 정 훈도 only bows from the corner. The painting lives in
// public/irworobongdo.svg so the landing link preview (app/opengraph-image.tsx) can reuse it.
export default function Hero() {
  return (
    <header className="animate-rise relative mt-4 overflow-hidden rounded-3xl shadow-[0_10px_30px_rgb(33_27_23/0.25)]">
      <div className="relative h-[420px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/irworobongdo.svg" alt="" width={390} height={420} className="absolute inset-0 size-full object-cover object-bottom" />
        <div className="absolute inset-x-0 top-0 flex flex-col items-center pt-6 text-center">
          <p className="text-[11px] font-bold tracking-[0.25em] text-[#f3ead0]/85">조선 왕실도 사주를 봤다</p>
          {/* 현판: black lacquer board, gold rim and gilded letters */}
          <div className="mt-2 rounded-[6px] border-[3px] border-[#b8862f] bg-[#1c1712] p-[3px] shadow-[0_6px_14px_rgb(0_0_0/0.45)]">
            <div className="rounded-[3px] border border-[#e2bc68]/70 px-6 py-2">
              <h1 className="font-myeongjo text-[30px] leading-tight font-extrabold tracking-[0.12em] text-[#f1cf7a]">
                {SERVICE_NAME}
              </h1>
            </div>
          </div>
          <p className="mt-2 font-myeongjo text-sm font-bold text-[#f3ead0] drop-shadow-[0_1px_3px_rgb(0_0_0/0.6)]">
            옥좌의 주인을 찾사옵니다
          </p>
        </div>

        <a
          href="#enthrone"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border-2 border-[#e2bc68] bg-seal px-5 py-2.5 font-myeongjo text-base font-extrabold whitespace-nowrap text-hanji shadow-[0_4px_0_#7d1a14]"
        >
          사주로 즉위하기 ↓
        </a>

        {/* 정 훈도: 구석에서 허리 숙인 신하 */}
        <div className="absolute right-3 bottom-16 size-14 overflow-hidden rounded-full border-2 border-[#d9ad52] bg-[#f7efd9] shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={CHARACTER.bow}
            alt={`허리 숙여 인사하는 ${CHARACTER_NAME}`}
            width={56}
            height={56}
            className="size-full origin-bottom scale-[1.18] object-cover"
          />
        </div>
      </div>
    </header>
  );
}
