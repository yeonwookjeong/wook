import Link from "next/link";
import { askShown, currentMember, JOIN_GIFT, membersEnabled } from "@/lib/members";
import type { Order } from "@/lib/pay";

// Under a bought report: the questions that came with it (A안), and, for a buyer not signed in, why to sign in —
// the report is kept on this browser only until then.
export default async function KeepNote({ order, back }: { order: Order; back: string }) {
  // With 청심당's opening (until then, the owner's 시안 모드 only).
  if (!membersEnabled() || !(await askShown())) return null;
  const member = await currentMember().catch(() => null);
  const login = `/login?next=${encodeURIComponent(back)}`;
  if (member)
    return order.bonus && order.bonusGiven ? (
      <p className="mt-4 rounded-xl border border-[#d4af5f]/50 bg-[#fbf6ea] px-4 py-3 text-center text-[13.5px] leading-relaxed">
        이 보고서와 함께 <b>정 훈도 질문 {order.bonus}개</b>를 넣어 드렸어요.{" "}
        <Link href="/ask" className="font-bold text-seal underline">
          청심당에서 여쭙기 →
        </Link>
      </p>
    ) : null;
  return (
    <section className="mt-4 rounded-2xl border border-[#d4af5f]/50 bg-[#fbf6ea] px-4 py-4 text-center">
      {order.bonus ? (
        <>
          <p className="font-myeongjo text-[16px] font-extrabold">정 훈도 질문 {order.bonus}개가 함께 들어 있어요</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
            카카오로 로그인하면 바로 넣어 드리고, 이 보고서도 계정에 보관돼 다른 기기에서 다시 열 수 있어요.
          </p>
        </>
      ) : (
        <>
          <p className="font-myeongjo text-[16px] font-extrabold">이 보고서, 다른 기기에서도 보시려면</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
            지금은 이 휴대폰 브라우저에만 저장돼 있어요. 카카오로 로그인하면 계정에 보관돼서, 어느 기기에서든 다시 열 수 있어요.
          </p>
        </>
      )}
      <Link href={login} className="mt-3 block rounded-2xl bg-[#FEE500] py-3 font-bold text-[#191919]">
        {order.bonus ? `카카오로 로그인하고 질문 ${order.bonus}개 받기` : "카카오로 로그인하고 보관하기"}
      </Link>
      {!order.bonus && <p className="mt-2 text-[11.5px] text-ink-soft">처음 로그인하면 정 훈도에게 묻는 질문 {JOIN_GIFT}개를 드려요</p>}
    </section>
  );
}

// At the top of a bought report: a buyer not signed in whose questions are still waiting.
// The report is long, so the note at the bottom is easy to miss.
export async function BonusTop({ order, back }: { order: Order; back: string }) {
  if (!order.bonus || order.bonusGiven || !membersEnabled() || !(await askShown())) return null;
  if (await currentMember().catch(() => null)) return null;
  return (
    <Link
      href={`/login?next=${encodeURIComponent(back)}`}
      className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-[#FEE500] px-4 py-3 text-[14px] font-bold text-[#191919]"
    >
      <span>정 훈도 질문 {order.bonus}개가 기다리고 있어요</span>
      <span className="shrink-0">카카오로 받기 →</span>
    </Link>
  );
}
