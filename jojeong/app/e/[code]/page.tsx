import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HundoFace } from "../../ask/Letter";
import { claimCreditEvent, closedWhy, getCreditEvent } from "@/lib/creditEvents";
import { currentMember, membersEnabled } from "@/lib/members";
import { creditEventClaims } from "@/lib/store";

export const metadata: Metadata = { title: "질문 선물 받기", robots: { index: false } };

// An event's link (lib/creditEvents.ts, made on /admin): sign in with Kakao, then take its questions once.
const SAY = {
  none: "찾을 수 없는 이벤트예요. 링크를 다시 확인해 주세요.",
  off: "지금은 쉬고 있는 이벤트예요.",
  ended: "기간이 끝난 이벤트예요. 다음 이벤트에서 뵈어요.",
  full: "아쉽게도 준비한 선물이 모두 나갔어요.",
  taken: "이미 이 선물을 받으셨어요. 청심당에서 써 보세요.",
  kakao: "이 선물은 카카오로 로그인한 분께 드려요.",
} as const;

async function claim(formData: FormData) {
  "use server";
  const code = String(formData.get("code") ?? "").toUpperCase();
  const member = await currentMember();
  if (!member) redirect(`/login?next=${encodeURIComponent(`/e/${code}`)}`);
  const r = await claimCreditEvent(code, member.id);
  redirect(`/e/${code}?r=${r.ok ? "ok" : r.why}`);
}

export default async function EventPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const code = (await params).code.toUpperCase();
  const r = String((await searchParams).r ?? "");
  if (!membersEnabled()) redirect("/");
  const [event, member] = await Promise.all([getCreditEvent(code), currentMember().catch(() => null)]);
  const [taken] = await creditEventClaims(event ? [event.code] : []);
  const closed = closedWhy(event, taken ?? 0);
  const already = Boolean(event && member?.events?.includes(event.code));
  const done = r === "ok" || already;
  const problem = r in SAY ? SAY[r as keyof typeof SAY] : closed && !done ? SAY[closed] : null;

  return (
    <section className="doc-paper mt-6 px-5 pt-7 pb-6 text-center">
      <div className="flex justify-center">
        <HundoFace size={64} />
      </div>
      <p className="mt-3 font-myeongjo text-[12px] font-bold tracking-[0.3em] text-seal">膳物</p>
      <h1 className="mt-1 font-myeongjo text-xl font-extrabold">{event ? event.name : "질문 선물"}</h1>
      {event && (
        <p className="mt-1.5 text-[14px] leading-relaxed">
          정 훈도에게 묻는 <b className="text-seal">질문 {event.credits}개</b>를 선물로 드려요.
        </p>
      )}

      {done ? (
        <div className="mt-5">
          <p className="rounded-xl bg-seal/10 px-3 py-2.5 text-[14px] font-bold text-seal">
            {r === "ok" ? `질문 ${event?.credits ?? ""}개를 넣어 드렸어요 🎁` : SAY.taken}
          </p>
          <Link href="/ask" className="mt-4 block rounded-2xl bg-ink py-3.5 font-myeongjo text-[16px] font-extrabold text-hanji">
            청심당에서 고민 여쭈기 →
          </Link>
        </div>
      ) : problem ? (
        <div className="mt-5">
          <p className="rounded-xl bg-ink/5 px-3 py-2.5 text-[14px]">{problem}</p>
          <Link href="/ask" className="mt-4 inline-block text-[13px] text-seal underline">
            청심당 둘러보기
          </Link>
        </div>
      ) : member ? (
        <form action={claim} className="mt-5">
          <input type="hidden" name="code" value={code} />
          <button className="block w-full rounded-2xl bg-[#FEE500] py-3.5 font-bold text-[#191919]">질문 {event?.credits}개 받기</button>
          <p className="mt-2 text-[11.5px] text-ink-soft">{member.nick}님 계정으로 받아요 · 한 계정에 한 번</p>
        </form>
      ) : (
        <div className="mt-5">
          <a href={`/login/kakao?next=${encodeURIComponent(`/e/${code}`)}`} className="block rounded-2xl bg-[#FEE500] py-3.5 font-bold text-[#191919]">
            카카오로 로그인하고 받기
          </a>
          <p className="mt-2 text-[11.5px] text-ink-soft">카카오 계정 하나에 한 번 드려요 · 생년월일은 저장하지 않아요</p>
        </div>
      )}
    </section>
  );
}
