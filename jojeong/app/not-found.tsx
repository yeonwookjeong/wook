import Link from "next/link";
import Naegwan from "@/components/Naegwan";

export default function NotFound() {
  return (
    <section className="flex flex-1 flex-col justify-center gap-6">
      <Naegwan>전하, 그런 조정은 찾을 수 없사옵니다. 링크가 잘못되었거나 사라진 조정이옵니다.</Naegwan>
      <Link
        href="/"
        className="w-full rounded-2xl bg-seal py-4 text-center font-myeongjo text-lg font-extrabold text-hanji shadow-[0_6px_0_#7d1a14]"
      >
        새로 즉위하기
      </Link>
    </section>
  );
}
