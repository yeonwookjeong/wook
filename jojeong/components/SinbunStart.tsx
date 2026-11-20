import HopaeFace from "@/components/HopaeFace";
import MeForm from "@/components/MeForm";
import { MATERIAL, TAG_ORDER, type TagKind } from "@/lib/hopae";

// The 신분 감정 before a chart is entered, in the same shape as the 신살 test's first screen (SinsalStart): a dark
// night of its own (lamp-lit wood rather than the 신살 sky), the question as the title, the five 호패 of 『속대전』
// (대표님 11/20: 결과 전에는 비율 없이), then the form. Each tag is carved with a life that carried it.
const SAMPLE: Record<TagKind, string> = { 아패: "대제학", 각패: "교리", 황양목패: "생원", 소목방패: "훈장", 대목방패: "관노" };
const GOLD = "text-[#e0b866]";

export default function SinbunStart({ next }: { next: string }) {
  return (
    <div className="-mx-4 mt-2 rounded-[28px] bg-[radial-gradient(circle_at_50%_8%,#6b3a1c,transparent_55%),linear-gradient(180deg,#1c120c,#2a1a10_45%,#1a110b)] px-4 pt-2 pb-8 text-hanji">
      <section className="pt-6 text-center">
        <p className={`font-myeongjo text-sm font-extrabold tracking-[0.3em] ${GOLD}`}>身 分, 조선 신분 감정</p>
        <h1 className="mt-2 font-myeongjo text-[27px] leading-tight font-extrabold">
          조선에 태어났다면
          <br />
          나는 어떤 호패를 찼을까
        </h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-hanji/85">신분, 하던 일, 한평생까지 사주로 봐요</p>
        <p className="mt-1 text-xs text-hanji/55">무료, 생년월일은 저장하지 않아요</p>
      </section>

      <a href="#me-form" aria-label="내 호패 보러 가기" className="mt-5 block rounded-2xl border border-[#e0b866]/30 bg-white/[0.04] px-2 pt-5 pb-4">
        <div className="grid grid-cols-5 items-start gap-1">
          {TAG_ORDER.map((k, i) => (
            <div key={k} className="flex flex-col items-center">
              <div className="w-full drop-shadow-[0_0_14px_rgb(224_184_102/0.18)]">
                <HopaeFace tag={{ kind: k, job: SAMPLE[k], born: "甲子生", issued: "丙午" }} id={`start-${i}`} />
              </div>
              <p className="mt-1.5 text-[12.5px] font-bold">{MATERIAL[k].what}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[13px] leading-relaxed text-hanji/85">
          『속대전』은 신분마다 호패의 재질을 정했어요.
          <br />
          <b className={GOLD}>상아는 2품 이상</b>, 나무는 백성과 노비의 것이었지요.
        </p>
      </a>

      <section id="me-form" className="card mt-4 scroll-mt-4 px-5 pt-5 pb-6 text-ink">
        <MeForm next={next} noGender submit="내 호패 보기" />
        <p className="mt-3 text-center text-[12px] leading-relaxed text-ink-soft">
          호패는 조선의 사내만 찼어요. 그래서 남녀 모두 같은 사주로 사내로 났다면 살았을 삶과 찼을 호패로 감정해요.
        </p>
      </section>
    </div>
  );
}
