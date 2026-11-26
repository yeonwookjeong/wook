import type { Metadata } from "next";
import AdSlot from "@/components/AdSlot";
import FreeSeen from "@/components/FreeSeen";
import MeForm from "@/components/MeForm";
import Myeongdang from "@/components/Myeongdang";
import NextStep from "@/components/NextStep";
import { readMe } from "@/lib/me";
import { STEPS } from "@/lib/nextStep";

export const metadata: Metadata = {
  title: "내 사주 명당, 나와 맞는 동네 찾기",
  description: "내 사주에 모자란 기운을 채워 주는 동네는 어디일까. 사는 지역 안 1위 동네와 그 안의 동, 전국 순위와 지도, 주말 나들이, 친구들과 만나기 공평한 약속 장소까지 무료로 봐요.",
};

// Free, rule-based (lib/place.ts, the same engine as the Apps in Toss mini app): the land of all 256 시군구 and
// 3,559 행정동 read as five elements (forest and hills, warmth and town, farmland, rock and factories, water), set
// against what the chart lacks. The reader picks where they live; the local ranking comes first, the country after.
export default async function MyeongdangPage() {
  const me = await readMe();
  return (
    <>
      <section className="mt-6 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">明 堂</p>
        <h1 className="mt-2 font-myeongjo text-3xl font-extrabold">내 사주 명당</h1>
        <p className="mt-2 text-[15px] leading-relaxed">내 사주에 모자란 기운을 채워 주는 동네는 어디일까</p>
        <p className="mt-1 text-xs text-ink-soft">무료, 생년월일은 저장하지 않아요</p>
      </section>
      {me ? (
        <>
          <FreeSeen k="myeongdang" />
          <Myeongdang person={me.person} />
        </>
      ) : (
        <>
          <section className="card mt-4 px-5 py-5 text-[14px] leading-relaxed">
            <p>전국 256개 시군구와 3,559개 동의 산, 숲, 강, 바다, 논밭, 날씨를 다섯 가지 기운으로 읽었어요.</p>
            <p className="mt-2">생일을 넣고 사는 곳을 고르면, 우리 지역에서 나와 가장 잘 맞는 동네부터 보여 드려요.</p>
          </section>
          <section className="card mt-4 px-5 pt-5 pb-6">
            <MeForm next="/myeongdang" submit="내 명당 찾기" />
          </section>
        </>
      )}
      <NextStep from="myeongdang" steps={STEPS.myeongdang()} />
      <AdSlot />
    </>
  );
}
