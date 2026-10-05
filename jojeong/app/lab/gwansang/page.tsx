import type { Metadata } from "next";
import GwansangLab from "@/components/GwansangLab";

export const metadata: Metadata = { title: "관상 촬영 시험", robots: { index: false, follow: false } };

// Hidden test page for the 관상 capture: not linked anywhere, kept out of search.
export default function GwansangLabPage() {
  return (
    <>
      <section className="mt-6 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">觀 相</p>
        <h1 className="mt-2 font-myeongjo text-3xl font-extrabold">관상 촬영 시험</h1>
        <p className="mt-2 text-[13px] text-ink-soft">시험용 숨은 페이지예요 · 결과는 이 브라우저에만 남아요</p>
      </section>
      <GwansangLab />
    </>
  );
}
