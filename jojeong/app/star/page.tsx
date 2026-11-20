import type { Metadata } from "next";
import FreeSeen from "@/components/FreeSeen";
import MeForm from "@/components/MeForm";
import StarBoard from "@/components/StarBoard";
import { CELEB_COUNT, starBoard } from "@/lib/celebs";
import { readMe } from "@/lib/me";
import { BRANCHES, STEMS, STEMS_KO, BRANCHES_KO } from "@/lib/saju";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "나와 같은 일주 유명인, 아이돌 배우 운동선수 가운데 나와 같은 날 기둥",
  description: "생일만 넣으면 나와 같은 일주로 태어난 아이돌, 배우, 가수, 운동선수, 역사 인물을 찾아 드려요. 여섯 글자 가운데 넷 이상 같은 사주 쌍둥이도 보여 드려요.",
  alternates: { canonical: "/star" },
  // 대표님 시험 기간 (11/17): 메뉴와 사이트맵에 없고 검색에도 안 나오게. 공개할 때 지운다.
  robots: { index: false, follow: false },
};

export default async function StarPage() {
  const me = await readMe();
  const p = me?.person.pillars;
  return (
    <>
      <header className="pt-6 text-center">
        <p className="font-myeongjo text-[12px] font-extrabold tracking-[0.4em] text-seal">同 日 柱</p>
        <h1 className="mt-1 font-myeongjo text-3xl font-extrabold">나와 같은 일주 유명인</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          유명인 {CELEB_COUNT.toLocaleString("ko-KR")}명의 사주 가운데
          <br />
          그대와 같은 날 기둥으로 태어난 이를 찾아 드리옵니다
        </p>
      </header>
      {p && p.yearStem !== undefined && p.monthStem !== undefined && p.monthBranch !== undefined ? (
        <>
          <FreeSeen k="star" />
          <StarBoard
            board={starBoard(p)}
            ilju={`${STEMS_KO[p.dayStem]}${BRANCHES_KO[p.dayBranch]}`}
            letters={[
              { label: "해", ch: STEMS[p.yearStem] },
              { label: "해", ch: BRANCHES[p.yearBranch] },
              { label: "달", ch: STEMS[p.monthStem] },
              { label: "달", ch: BRANCHES[p.monthBranch] },
              { label: "날", ch: STEMS[p.dayStem] },
              { label: "날", ch: BRANCHES[p.dayBranch] },
            ]}
          />
        </>
      ) : (
        <section className="doc-paper mt-6 px-5 py-5">
          <p className="mb-4 text-center text-[14px] text-ink-soft">생일을 넣으면 나와 같은 일주 유명인이 보이옵니다</p>
          <MeForm next="/star" noGender submit="유명인 찾아보기" />
        </section>
      )}
      <p className="mt-10 text-center text-[11.5px] leading-relaxed text-ink-soft/80">
        유명인의 생일은 위키데이터 공개 자료이옵니다. 태어난 시가 알려지지 않아 여섯 글자로만 보았고, 재미로 보는 궁합이옵니다.
        <br />
        목록에서 빼 달라는 요청은 문의하기로 주시면 바로 내리옵니다.
      </p>
    </>
  );
}
