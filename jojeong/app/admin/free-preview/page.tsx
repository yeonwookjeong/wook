import type { Metadata } from "next";
import Link from "next/link";
import ChartIntro from "@/components/ChartIntro";
import FreeReading from "@/components/FreeReading";
import YearReport from "@/components/YearReport";
import { isAdmin } from "@/lib/admin";
import { freeReadingOf } from "@/lib/freeReading";
import { decadeTags, manseOf, salSeats, yearPreviewOf, type AreaGrade, type YearPreview } from "@/lib/freePreview";
import { chartOf } from "@/lib/myeongri";
import { parseBirth } from "@/lib/personForm";
import { computeProfile } from "@/lib/profile";
import { distinctOf } from "@/lib/rarity";
import { BirthInputError, isFull } from "@/lib/saju";
import { yearReading } from "@/lib/yearly";
import { yearDetail, yearNickname, type YearDetail } from "@/lib/yeonun";

export const metadata: Metadata = { title: "무료 화면 시안 · 관리자", robots: { index: false } };

// The year the new block reads (the 2027 신년운세 being readied).
const YEAR = 2027;

// The owner's look at the leaner free screen (docs/product-plan-2027.md "무료 화면 원칙") before it replaces the
// public one: the same components as /reports/[id], everything they say kept, with the 만세력 rows, 신살 seats, decade tags and the 2027 block added. The chart comes
// from the query (?birth=19960522&time=1430&g=f&name=수빈) and is never stored. Links here go nowhere yet.
export default async function FreePreviewPage({ searchParams }: PageProps<"/admin/free-preview">) {
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
  const name = (one("name") || "수빈").replace(/[\p{C}]/gu, "").trim().slice(0, 10) || "수빈";

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
    error = e instanceof BirthInputError ? e.message : "사주를 계산하지 못했어요.";
  }

  const pillars = parsed?.pillars;
  const profile = parsed ? computeProfile(parsed.input, parsed.gender) : null;
  const distinct = pillars ? distinctOf(pillars, parsed!.gender) : null;
  const free = pillars ? freeReadingOf(pillars, profile) : null;
  const year = pillars ? yearPreviewOf(pillars, profile, YEAR) : null;
  const detail = pillars ? yearDetail(pillars, profile, YEAR, 2026) : null;
  // The 2026 reading the free screen shows today, all of it.
  const reading = pillars ? yearReading(pillars, profile) : null;
  const ask = (topic: string) => <Ask key={topic} />;

  return (
    <>
      <p className="mt-4 text-sm">
        <Link href="/admin" className="text-ink-soft underline">
          ← 관리자
        </Link>
      </p>
      <section className="doc-paper mt-3 px-5 py-4">
        <h1 className="font-myeongjo text-lg font-extrabold">무료 화면 시안 · 관리자 전용</h1>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
          지금 무료 화면의 글은 모두 그대로 두고, 만세력·별 위치·대운 글자 관계·2027 정미년을 더한 모습이에요. 공개 화면은 그대로예요. 생년월일은 저장하지 않아요.
        </p>
        <form className="mt-3 grid grid-cols-[1fr_4.5rem] gap-1.5 text-[13px]">
          <input name="birth" defaultValue={birth} inputMode="numeric" placeholder="생년월일 8자리" className="rounded-lg border border-seal/30 bg-white/60 px-2 py-1.5" />
          <input name="time" defaultValue={time} inputMode="numeric" placeholder="시각" className="rounded-lg border border-seal/30 bg-white/60 px-2 py-1.5" />
          <input name="name" defaultValue={name} placeholder="이름" className="rounded-lg border border-seal/30 bg-white/60 px-2 py-1.5" />
          <select name="g" defaultValue={g} className="rounded-lg border border-seal/30 bg-white/60 px-1 py-1.5">
            <option value="">성별</option>
            <option value="f">여</option>
            <option value="m">남</option>
          </select>
          <button className="col-span-2 rounded-full bg-seal py-1.5 font-bold text-hanji">이 사주로 보기</button>
        </form>
        {error && <p className="mt-2 text-sm font-bold text-seal">{error}</p>}
      </section>

      {pillars && reading && (
        <YearReport
          reading={reading}
          heading={`${name}님의 2026년 운세`}
          deepen={null}
          query=""
          intro={
            <>
              {isFull(pillars) && distinct && (
                <ChartIntro name={name} d={distinct} slots={chartOf(pillars)} chips={false} manse={manseOf(pillars)} ask={ask} />
              )}
              {free && (
                <FreeReading
                  name={name}
                  r={free}
                  query=""
                  addGender="/admin/free-preview"
                  seats={salSeats(pillars)}
                  tags={Object.fromEntries((profile?.daeun ?? []).map((d) => [d.from, decadeTags(pillars, d)]))}
                  ask={ask}
                />
              )}
            </>
          }
          after={year && detail && <YearBlock name={name} y={year} d={detail} />}
          ending={<Ending />}
        />
      )}
    </>
  );
}

// "이게 무슨 뜻이옵니까?" under each block. In the preview it goes nowhere.
function Ask() {
  return <p className="mt-3 text-right text-[12px] font-bold text-seal">이게 무슨 뜻이옵니까? 훈도에게 묻기 →</p>;
}

const GRADE: Record<AreaGrade, { mark: string; cls: string }> = {
  좋음: { mark: "◎ 좋음", cls: "bg-seal text-hanji" },
  보통: { mark: "○ 보통", cls: "bg-gold/25 text-ink" },
  조심: { mark: "△ 조심", cls: "bg-ink/15 text-ink" },
};
// A month's grade (lib/yeonun.ts monthMarks: ◎ 3 · ○ 2 · △ 1 · ✕ 0) as a bar.
const MONTH = [
  { mark: "✕", h: 22, bar: "#4d5966" },
  { mark: "△", h: 45, bar: "#8b95a1" },
  { mark: "○", h: 70, bar: "#c9a13b" },
  { mark: "◎", h: 100, bar: "#b3261e" },
] as const;

// ⑨ The coming year: its verdict, five areas as chips, and its twelve months as bars (grades only).
function YearBlock({ name, y, d }: { name: string; y: YearPreview; d: YearDetail }) {
  const at = (i: number) => d.months[i]?.from;
  return (
    <section className="doc-paper mt-4 px-5 pt-5 pb-5">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">{y.hanja.split("").join(" ")}</p>
      <h2 className="mt-1 text-center font-myeongjo text-lg font-extrabold">
        {name}님의 {y.year} {y.ko}
      </h2>
      <p className="mt-1 text-center text-[12px] text-ink-soft">
        {yearNickname(y.year)} · 천간 {y.gods[0]} · 지지 {y.gods[1]} · 한 해 <b className="text-ink">{y.verdict}</b>
      </p>
      <div className="mt-4 rounded-2xl border-l-[3px] border-seal bg-seal/5 px-4 py-3">
        <p className="font-myeongjo text-[16px] font-extrabold">{d.theme}</p>
        <p className="mt-1 text-[14px] leading-relaxed">{d.themeLine}</p>
        <p className="mt-1.5 text-[13px] font-bold text-seal">{d.line}</p>
      </div>
      <ul className="mt-4 grid grid-cols-5 gap-1.5 text-center">
        {y.areas.map((a) => (
          <li key={a.area} className="flex flex-col gap-1">
            <span className="font-myeongjo text-[15px] font-extrabold">{a.area}</span>
            <span className={`rounded-md py-0.5 text-[11px] font-bold ${GRADE[a.grade].cls}`}>{GRADE[a.grade].mark}</span>
          </li>
        ))}
      </ul>
      <h3 className="mt-5 text-sm font-extrabold">12달 흐름</h3>
      <div className="mt-2 flex h-28 items-end gap-1" role="img" aria-label={y.months.map((m) => `${m.from} ${MONTH[m.rating].mark}`).join(", ")}>
        {y.months.map((m) => (
          <div key={m.from} className="flex h-full flex-1 flex-col justify-end">
            <span className="text-center text-[10px] font-bold" style={{ color: MONTH[m.rating].bar }}>
              {MONTH[m.rating].mark}
            </span>
            <span className="block rounded-t-sm" style={{ height: `${MONTH[m.rating].h}%`, background: MONTH[m.rating].bar }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1 text-center text-[9.5px] leading-tight text-ink-soft">
        {y.months.map((m) => (
          <span key={m.from} className="flex-1">
            {m.from}
            <span className="block font-myeongjo text-[10px] text-ink">{m.gz}</span>
          </span>
        ))}
      </div>
      <p className="mt-3 text-[13px]">
        <b className="text-seal">힘이 붙는 달</b> {d.best.map(at).join(" · ")}부터 <span className="mx-1 text-ink-soft">|</span>
        <b>조심할 달</b> {d.worst.map(at).join(" · ")}부터
      </p>
      <h3 className="mt-5 text-sm font-extrabold">{y.year}년이 {name}님 사주와 만나는 자리</h3>
      <ul className="mt-2 flex flex-col gap-2 text-[14px] leading-relaxed">
        {d.points.map((p) => (
          <li key={p} className="border-b border-seal/10 pb-2 last:border-b-0">
            {p}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-ink-soft">달은 절기로 바뀌어요(날짜는 그 달이 시작하는 날). ◎ ○ △ ✕ 네 단계.</p>
      <Ask />
    </section>
  );
}

// ⑩ The three ways on, at the very end. Not wired in the preview.
function Ending() {
  return (
    <section className="mt-6 flex flex-col gap-2">
      <span className="block rounded-2xl bg-seal px-4 py-3 text-center font-bold text-hanji">
        💬 정 훈도에게 내 고민 물어보기
        <span className="block text-[12px] font-normal opacity-90">카카오로 가입하면 첫 질문 1개 무료</span>
      </span>
      <span className="block rounded-2xl border-2 border-seal px-4 py-2.5 text-center font-bold text-seal">2027 총운 전체 보기 · 1,900원</span>
      <span className="block rounded-2xl border-2 border-seal px-4 py-2.5 text-center font-bold text-seal">다 보기 · 4,900원</span>
      <p className="text-center text-[11px] text-ink-soft">미리보기라 버튼은 아직 연결하지 않았어요.</p>
    </section>
  );
}
