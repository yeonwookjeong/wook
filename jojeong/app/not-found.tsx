import Link from "next/link";
import Hundo from "@/components/Hundo";

export default function NotFound() {
  return (
    <section className="flex flex-1 flex-col justify-center gap-4">
      <Hundo mood="shock">찾으시는 페이지가 없어요. 링크가 잘못됐거나 사라진 페이지예요.</Hundo>
      <Link
        href="/"
        className="mt-2 w-full rounded-2xl bg-seal py-4 text-center font-myeongjo text-lg font-extrabold text-hanji shadow-[0_6px_0_#7d1a14]"
      >
        훈도사주 처음으로
      </Link>
      <Link href="/king" className="w-full rounded-2xl border-2 border-ink/30 py-3.5 text-center font-myeongjo font-extrabold text-ink-soft">
        왕이 될 사주 하러 가기
      </Link>
    </section>
  );
}
