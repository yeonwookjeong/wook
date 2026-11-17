import type { Metadata } from "next";
import ByeoseulGame from "@/components/ByeoseulGame";
import FreeSeen from "@/components/FreeSeen";
import MeForm from "@/components/MeForm";
import { boardOf } from "@/lib/byeoseul";
import { readMe } from "@/lib/me";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "벼슬길, 내 사주로 조선 과거를 본다면",
  description: "문과, 무과, 잡과 중 내 사주가 가리키는 과거와 첫 벼슬, 시련, 마지막 벼슬까지. 사주대로 걸을지 내 선택대로 걸을지, 두 인생을 나란히 보여 드려요.",
  alternates: { canonical: "/byeoseul" },
  // 대표님 시험 기간 (11/17): 메뉴와 사이트맵에 없고 검색에도 안 나오게. 공개할 때 지운다.
  robots: { index: false, follow: false },
};

// 벼슬길: the birth date once (remembered in this browser, as for every free page), then the game.
export default async function ByeoseulPage() {
  const me = await readMe();
  const board = me ? boardOf(me.person.pillars, me.person.daeun, me.person.birthYear ?? new Date().getFullYear() - 30) : null;
  return (
    <>
      <header className="pt-6 text-center">
        <p className="font-myeongjo text-[12px] font-extrabold tracking-[0.4em] text-seal">官 路</p>
        <h1 className="mt-1 font-myeongjo text-3xl font-extrabold">벼슬길</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          조선에서 과거를 봤다면, 그대는 어떤 벼슬을 지냈을까요.
          <br />
          사주대로 걸을지, 내 선택대로 걸을지 골라 보시옵소서.
        </p>
      </header>
      {board && me ? (
        <>
          <FreeSeen k="byeoseul" />
          <ByeoseulGame board={board} name={me.person.name} />
        </>
      ) : (
        <section className="doc-paper mt-6 px-5 py-5">
          <p className="mb-4 text-center text-[14px] text-ink-soft">생일을 넣으면 과거장 문이 열리옵니다</p>
          <MeForm next="/byeoseul" submit="과거 보러 가기" />
        </section>
      )}
    </>
  );
}
