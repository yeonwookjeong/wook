import type { Metadata } from "next";
import Link from "next/link";
import Hundo from "@/components/Hundo";
import { SITE_NAME, SITE_SUMMARY } from "@/lib/brand";

export const metadata: Metadata = {
  title: { absolute: "훈도사주 소개 · 나한테만 맞는 사주 풀이" },
  description: SITE_SUMMARY,
};

const FREE = [
  { href: "/reports/pyeongsaeng", title: "무료 사주 분석", line: "여덟 글자의 무게, 다섯 가지 힘, 10년 흐름" },
  { href: "/reports/gukjeong", title: "2026 신년 운세", line: "한 해의 흐름과 달마다 좋은 때" },
  { href: "/ranking", title: "이달의 일주 랭킹", line: "60일주 가운데 내 일주는 이번 달 몇 위" },
  { href: "/chaek", title: "정 훈도의 책력", line: "달마다 손 없는 날, 음력 날짜와 절기" },
  { href: "/samjae", title: "삼재 띠 확인", line: "올해와 내년 삼재 띠" },
  { href: "/king", title: "왕이 될 사주", line: "친구들과 하는 조선 조정 놀이" },
];

// What the site is, in plain words: the page search engines and AI summaries read for "훈도사주".
export default function AboutPage() {
  return (
    <>
      <section className="mt-6 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">訓 導</p>
        <h1 className="mt-2 font-myeongjo text-3xl font-extrabold">{SITE_NAME} 소개</h1>
      </section>

      <section className="doc-paper mt-5 px-5 py-5 text-[15px] leading-relaxed">
        <p>{SITE_SUMMARY}</p>
      </section>

      <section className="doc-paper mt-4 px-5 py-5">
        <h2 className="font-myeongjo text-lg font-extrabold">무료로 볼 수 있는 것</h2>
        <ul className="mt-3 flex flex-col divide-y divide-seal/10">
          {FREE.map((f) => (
            <li key={f.href}>
              <Link href={f.href} className="flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <b className="block font-myeongjo">{f.title}</b>
                  <span className="block text-[12.5px] text-ink-soft">{f.line}</span>
                </span>
                <span className="shrink-0 text-xs font-bold text-seal">보기 →</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
          더 깊이 알고 싶은 주제는{" "}
          <Link href="/reports" className="font-bold text-seal underline">
            보고서
          </Link>
          로 길게 풀어 드려요. 평생 사주, 궁합, 연애, 재물, 직업, 연운, 택일이 있어요.
        </p>
      </section>

      <section className="doc-paper mt-4 px-5 py-5 text-[14.5px] leading-relaxed">
        <h2 className="font-myeongjo text-lg font-extrabold">정 훈도는 누구인가요</h2>
        <p className="mt-2">
          조선의 관상감에는 하늘을 살피는 천문학, 땅을 살피는 지리학, 그리고 사람의 명(命)과 좋은 날을 살피는 <b>명과학(命課學)</b>이
          있었어요. 명과학 관원들은 왕실의 궁합과 길일을 맡았고, 오늘날의 사주와 같은 자평명리로 시험을 치렀어요.
        </p>
        <p className="mt-2">
          정 훈도는 그 명과학의 막내 관원 <b>훈도(訓導)</b>라는 설정의 캐릭터예요. 어려운 한자말 대신 쉬운 말로, 누구에게나 맞는 말 말고
          그 사람에게만 맞는 말을 하려고 해요.
        </p>
      </section>

      <section className="doc-paper mt-4 px-5 py-5 text-[14.5px] leading-relaxed">
        <h2 className="font-myeongjo text-lg font-extrabold">이렇게 풀어요</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>무료 풀이는 정해진 계산으로 바로 보여 드려요.</li>
          <li>보고서는 내 여덟 글자를 근거로, 같은 일주라도 사람마다 다르게 써요.</li>
          <li>생년월일은 사주 계산에만 쓰고 저장하지 않아요.</li>
          <li>로그인 없이 쓰고, 결제한 보고서는 고유 링크로 언제든 다시 열 수 있어요.</li>
        </ul>
      </section>

      <section className="mt-5">
        <Hundo>그대에게만 맞는 말을 찾아 올리겠사옵니다.</Hundo>
      </section>
    </>
  );
}
