import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentMember } from "@/lib/members";
import { leaveAction } from "./actions";

export const metadata: Metadata = { title: "회원 탈퇴", robots: { index: false } };

// Leaving, as easy as joining: what goes, what stays, one button.
export default async function LeavePage() {
  const member = await currentMember();
  if (!member) redirect("/ask");
  return (
    <section className="doc-paper mt-6 px-5 py-6">
      <h1 className="font-myeongjo text-xl font-extrabold">회원 탈퇴</h1>
      <p className="mt-2 text-[14px] leading-relaxed">{member.nick}님, 탈퇴하면 아래 정보가 바로 지워져요. 되돌릴 수 없어요.</p>
      <ul className="mt-3 flex flex-col gap-1.5 text-[14px]">
        <li>· 회원 번호와 닉네임</li>
        <li>· 사랑방(상담방) {member.rooms.length}개와 그 안의 상담 기록</li>
        <li>
          · 남은 질문 <b className="text-seal">{member.credits}개</b>
        </li>
      </ul>
      {member.credits > 0 && (
        <p className="mt-3 rounded-xl bg-seal/10 px-3 py-2 text-[13px] leading-relaxed text-seal">
          결제한 질문이 남아 있다면 탈퇴 전에{" "}
          <Link href="/contact" className="underline">
            문의하기
          </Link>
          로 환불을 먼저 요청해 주세요. 탈퇴 뒤에는 남은 질문을 확인할 수 없어요.
        </p>
      )}
      <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">
        결제 기록은 전자상거래법에 따라 5년간 보관해요. 이 브라우저에서 산 보고서는 탈퇴해도 이 브라우저에서 계속 열려요. 카카오 연결도 함께 끊어요. 네이버·구글로 가입하셨다면 탈퇴 뒤 그 계정 설정의 연결된 서비스에서 훈도사주를 지워 주세요.
      </p>
      <form action={leaveAction} className="mt-5 flex flex-col gap-2">
        <button type="submit" className="rounded-xl border-2 border-seal py-3 text-sm font-extrabold text-seal">
          탈퇴하기
        </button>
        <Link href="/ask" className="py-2 text-center text-sm text-ink-soft underline">
          그만두기
        </Link>
      </form>
    </section>
  );
}
