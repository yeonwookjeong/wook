import type { Metadata } from "next";
import ByeoseulGame from "@/components/ByeoseulGame";
import FreeSeen from "@/components/FreeSeen";
import MeForm from "@/components/MeForm";
import { readMe } from "@/lib/me";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "벼슬길, 내 사주로 조선에서 벼슬을 산다면 어디까지 오를까",
  description: "갈림길 아홉 번, 문은 매번 넷. 같은 선택도 사주에 따라 결과가 달라져요. 종9품 참봉부터 정1품 영의정까지, 진짜 조선 관직으로 보는 내 사주 벼슬 시뮬레이션.",
  alternates: { canonical: "/byeoseul" },
  // 대표님 시험 기간 (11/17): 메뉴와 사이트맵에 없고 검색에도 안 나오게. 공개할 때 지운다.
  robots: { index: false, follow: false },
};

// 벼슬길: the birth date once (remembered in this browser, as for every free page), then the game.
export default async function ByeoseulPage() {
  const me = await readMe();
  return (
    <>
      <header className="pt-6 text-center">
        <p className="font-myeongjo text-[12px] font-extrabold tracking-[0.4em] text-seal">官 路</p>
        <h1 className="mt-1 font-myeongjo text-3xl font-extrabold">벼슬길</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          내 사주로 조선 관리의 일생을 살아 보는 시뮬레이션.
          <br />
          고를 때마다 사주가 결과를 바꾸옵니다.
        </p>
      </header>
      {me ? (
        <>
          <FreeSeen k="byeoseul" />
          <ByeoseulGame pillars={me.person.pillars} name={me.person.name} />
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
