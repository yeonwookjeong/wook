import type { Metadata } from "next";
import Link from "next/link";
import ChartIntro from "@/components/ChartIntro";
import FreeReading from "@/components/FreeReading";
import YearAhead from "@/components/YearAhead";
import { isAdmin, isPreview } from "@/lib/admin";
import { previewModeAction } from "../actions";
import { freeReadingOf } from "@/lib/freeReading";
import { decadeTags, layersOf, manseOf, salSeats, yearPreviewOf } from "@/lib/freePreview";
import { chartOf } from "@/lib/myeongri";
import { parseBirth } from "@/lib/personForm";
import { computeProfile } from "@/lib/profile";
import { distinctOf } from "@/lib/rarity";
import { BirthInputError, isFull } from "@/lib/saju";
import { yearDetail } from "@/lib/yeonun";

export const metadata: Metadata = {
  title: "무료 화면 시안 · 관리자",
  robots: { index: false },
};

// The year the new block reads (the 2027 신년운세 being readied).
const YEAR = 2027;

// The owner's look at the free screen being readied (docs/product-plan-2027.md "무료 화면 원칙"), in the order a
// customer meets it: the chart with its 만세력 rows, what is rare in it, one verdict per part with the reasons locked,
// then 2027. 시안 모드 shows the same on the public pages, as a customer would walk them (lib/admin.ts isPreview).
// The chart here comes from the query (?birth=19960522&time=1430&g=f&name=수빈) and is never stored.
export default async function FreePreviewPage({
  searchParams,
}: PageProps<"/admin/free-preview">) {
  if (!(await isAdmin()))
    return (
      <p className="doc-paper mt-6 px-5 py-6 text-sm">
        <Link href="/admin" className="underline">
          관리자로 로그인
        </Link>
        한 뒤에 열 수 있어요.
      </p>
    );

  const q = await searchParams;
  const one = (k: string) => (typeof q[k] === "string" ? (q[k] as string) : "");
  const birth = one("birth") || "19960522";
  const time = one("time");
  const g = one("g");
  const cal = one("cal");
  const name =
    (one("name") || "수빈")
      .replace(/[\p{C}]/gu, "")
      .trim()
      .slice(0, 10) || "수빈";

  const form = new FormData();
  form.set("birth", birth);
  form.set("time", time);
  form.set("gender", g);
  if (cal) form.set("calendar", cal);
  let parsed: ReturnType<typeof parseBirth> | null = null;
  let error = "";
  try {
    parsed = parseBirth(form);
  } catch (e) {
    error =
      e instanceof BirthInputError ? e.message : "사주를 계산하지 못했어요.";
  }

  const pillars = parsed?.pillars;
  const profile = parsed ? computeProfile(parsed.input, parsed.gender) : null;
  const distinct = pillars ? distinctOf(pillars, parsed!.gender) : null;
  const free = pillars ? freeReadingOf(pillars, profile) : null;
  const year = pillars ? yearPreviewOf(pillars, profile, YEAR) : null;
  const detail = pillars ? yearDetail(pillars, profile, YEAR, 2026) : null;
  const layers = pillars ? layersOf(pillars, profile, YEAR) : null;
  const on = await isPreview();

  return (
    <>
      <p className="mt-4 text-sm">
        <Link href="/admin" className="text-ink-soft underline">
          ← 관리자
        </Link>
      </p>
      <section className="doc-paper mt-3 px-5 py-4">
        <h1 className="font-myeongjo text-lg font-extrabold">
          무료 화면 시안 · 관리자 전용
        </h1>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
          사주표·만세력 → 100명 중 → 판정(이유는 잠금) → 2027 순서예요. 공개
          화면은 그대로예요. 생년월일은 저장하지 않아요.
        </p>
        <div className="mt-3 rounded-xl border border-seal/30 bg-white/50 px-3 py-3">
          <p className="text-[13px] font-bold">
            시안 모드 · {on ? <span className="text-seal">켜짐</span> : "꺼짐"}
          </p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-soft">
            켜면 이 브라우저에서만 홈부터 손님처럼 시안을 볼 수 있어요. 관리자
            무료 열람도 꺼져서, 결제 전 화면이 손님과 똑같이 잠겨요.
          </p>
          <form action={previewModeAction} className="mt-2">
            <input type="hidden" name="on" value={on ? "0" : "1"} />
            <button className={`w-full rounded-full py-1.5 text-[13px] font-bold ${on ? "border border-seal text-seal" : "bg-seal text-hanji"}`}>
              {on ? "시안 모드 끄기" : "시안 모드 켜기"}
            </button>
          </form>
          {on && (
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-center text-[12.5px] font-bold">
              <Link href="/" className="rounded-full border border-seal/40 py-1.5">
                홈에서 시작 →
              </Link>
              <Link href="/reports/pyeongsaeng?new=1" className="rounded-full border border-seal/40 py-1.5">
                평생 사주 입력 →
              </Link>
            </div>
          )}
        </div>
        <p className="mt-4 text-[12px] font-bold text-ink-soft">여기서 바로 보기</p>
        <form className="mt-3 grid grid-cols-[1fr_4.5rem] gap-1.5 text-[13px]">
          <input
            name="birth"
            defaultValue={birth}
            inputMode="numeric"
            placeholder="생년월일 8자리"
            className="rounded-lg border border-seal/30 bg-white/60 px-2 py-1.5"
          />
          <input
            name="time"
            defaultValue={time}
            inputMode="numeric"
            placeholder="시각"
            className="rounded-lg border border-seal/30 bg-white/60 px-2 py-1.5"
          />
          <input
            name="name"
            defaultValue={name}
            placeholder="이름"
            className="rounded-lg border border-seal/30 bg-white/60 px-2 py-1.5"
          />
          <select
            name="g"
            defaultValue={g}
            className="rounded-lg border border-seal/30 bg-white/60 px-1 py-1.5"
          >
            <option value="">성별</option>
            <option value="f">여</option>
            <option value="m">남</option>
          </select>
          <button className="col-span-2 rounded-full bg-seal py-1.5 font-bold text-hanji">
            이 사주로 보기
          </button>
        </form>
        {error && <p className="mt-2 text-sm font-bold text-seal">{error}</p>}
      </section>

      {pillars && isFull(pillars) && distinct && (
        <ChartIntro
          name={name}
          d={distinct}
          slots={chartOf(pillars)}
          chips={!free}
          manse={manseOf(pillars)}
          lockHref="#"
        />
      )}
      {pillars && free && (
        <FreeReading
          name={name}
          r={free}
          query=""
          addGender="/admin/free-preview"
          locked
          seats={salSeats(pillars)}
          tags={Object.fromEntries((profile?.daeun ?? []).map((d) => [d.from, decadeTags(pillars, d)]))}
        />
      )}
      {year && detail && layers && (
        <YearAhead
          name={name}
          y={year}
          d={detail}
          layers={layers}
          mood={free?.flow?.find((f) => layers.daeun?.from === f.from)?.mood ?? null}
        />
      )}
    </>
  );
}
