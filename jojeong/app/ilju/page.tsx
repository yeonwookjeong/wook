import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import Hundo from "@/components/Hundo";
import { ILJU_BOOK, iljuHead } from "@/lib/iljuBook";
import { josa } from "@/lib/josa";
import { STEMS, STEMS_KO } from "@/lib/saju";

export const metadata: Metadata = {
  title: "60일주 도감: 60일주 성격, 연애, 궁합 한눈에",
  description:
    "갑자일주부터 계해일주까지, 60일주마다 한 쪽씩. 이런 말 자주 듣는 사람, 켜질 때와 꺼질 때, 다가가는 법, 연애와 일과 돈, 잘 맞는 일주까지 정리한 60일주 도감이에요.",
  alternates: { canonical: "/ilju" },
};

const EL_COLOR = ["#3d6656", "#b3261e", "#a87a22", "#7d8590", "#1f3d5c"];

// 60일주 도감: the sixty grouped by day stem (ten rows of six), each a door to its own page.
export default function IljuIndex() {
  const byStem = Array.from({ length: 10 }, (_, s) => ILJU_BOOK.filter((e) => e.stem === s));
  return (
    <>
      <style>{`@font-face{font-family:"GanzhiBrush";src:url(/fonts/ganzhi-syuku.woff2) format("woff2");font-display:block}`}</style>
      <header className="pt-6 text-center">
        <p className="text-sm font-bold text-gold">훈도사주</p>
        <h1 className="mt-1 font-myeongjo text-3xl font-extrabold">60일주 도감</h1>
        <p className="mx-auto mt-3 max-w-[34em] text-[15px] leading-relaxed text-ink-soft break-keep">
          일주는 태어난 날의 두 글자예요. 위 글자는 나 자신, 아래 글자는 내가 딛고 선 자리라서 사주에서 그 사람을 가장
          또렷하게 보여 줘요. 하늘의 열 글자와 땅의 열두 글자가 짝을 지어 모두 60가지가 되고, 60일마다 같은 일주의 날이
          돌아와요.
        </p>
      </header>

      <section className="doc-paper mt-5 px-5 py-4 text-[14.5px] leading-relaxed break-keep">
        <h2 className="font-myeongjo text-lg font-extrabold">이 도감에서 볼 수 있는 것</h2>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
          <li>이런 말 자주 듣지 않나요: 그 일주가 흔히 듣는 말 세 가지</li>
          <li>사용설명서: 이런 사람, 켜질 때, 꺼질 때, 다가가는 법, 충전법을 떠올릴 수 있는 장면으로</li>
          <li>연애할 때, 일할 때, 돈 쓸 때, 서운한 순간, 빛나는 순간</li>
          <li>잘 맞는 일주 셋과 부딪히기 쉬운 일주 둘, 이번 달 60일주 가운데 순위</li>
        </ul>
        <p className="mt-3 text-ink-soft">
          내 일주를 모른다면 생년월일을 넣어 사주표를 보면 돼요. 사주표에서 태어난 날 기둥의 두 글자가 일주예요.
        </p>
      </section>

      {byStem.map((row, s) => (
        <section key={s} className="mt-6">
          <h2 className="flex items-baseline gap-2 font-myeongjo text-lg font-extrabold">
            <span style={{ color: EL_COLOR[Math.floor(s / 2)] }}>{STEMS[s]}</span>
            {josa(STEMS_KO[s], "으로/로")} 시작하는 일주
          </h2>
          <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {row.map((e) => {
              const f = iljuHead(e);
              return (
                <li key={e.slug}>
                  <Link href={`/ilju/${e.slug}`} className="doc-paper flex h-full flex-col px-3 py-3">
                    <span className="flex items-baseline justify-between">
                      <span className="text-3xl leading-none text-seal" style={{ fontFamily: '"GanzhiBrush", var(--font-heading)' }}>
                        {f.hanja}
                      </span>
                      <span className="text-[11px] font-bold text-ink-soft">{String(f.no).padStart(2, "0")}</span>
                    </span>
                    <b className="mt-1.5 font-myeongjo text-[15px]">{f.name}</b>
                    <span className="mt-0.5 text-[12.5px] leading-snug text-ink-soft break-keep">{e.hook}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section className="mt-6">
        <Hundo>예순 개의 일주는 저마다 다른 결을 타고나옵니다. 그대의 일주부터 펼쳐 보시옵소서.</Hundo>
      </section>

      <AdSlot />
    </>
  );
}
