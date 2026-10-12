import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "새 소식",
  description: "훈도사주에 새로 생긴 것과 바뀐 것을 날짜별로 알려 드려요.",
};

// What changed on the site, newest first. The one-line note for returning visitors (components/RenewalNote.tsx)
// leads here.
const NEWS: { date: string; title: string; items: string[] }[] = [
  {
    date: "2026년 10월 13일",
    title: "무료 사주가 새로워졌어요",
    items: [
      "사주표 아래 만세력 줄(십성·지장간·12운성·신살)을 더했어요. 여덟 글자를 더 자세히 볼 수 있어요.",
      "2027년 정미년이 내 사주와 어떻게 만나는지, 열두 달 흐름까지 무료로 보여 드려요.",
      "인생 흐름 막대에 10년마다 바뀌는 글자 관계를 표시했어요.",
      "판정은 그대로 무료로 보고, 이유와 시기는 평생 사주에서 13장에 걸쳐 자세히 풀어 드려요.",
    ],
  },
];

export default function NewsPage() {
  return (
    <>
      <section className="mt-6 text-center">
        <p className="font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">新 消 息</p>
        <h1 className="mt-1 font-myeongjo text-2xl font-extrabold">새 소식</h1>
        <p className="mt-1 text-sm text-ink-soft">훈도사주에 새로 생긴 것과 바뀐 것</p>
      </section>
      {NEWS.map((n) => (
        <article key={n.date} className="doc-paper mt-4 px-5 py-5">
          <p className="text-[12px] font-bold text-seal">{n.date}</p>
          <h2 className="mt-1 font-myeongjo text-lg font-extrabold">{n.title}</h2>
          <ul className="mt-3 flex flex-col gap-2 text-[14px] leading-relaxed">
            {n.items.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="text-seal">·</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
      <Link href="/reports/gukjeong?new=1" className="mt-5 block rounded-full bg-seal py-3 text-center font-bold text-hanji">
        새로워진 내 사주 무료로 보기
      </Link>
    </>
  );
}
