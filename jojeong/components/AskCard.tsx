import { HundoFace } from "@/app/ask/Letter";
import { askShown, JOIN_GIFT } from "@/lib/members";
import type { AskFrom } from "@/lib/stats";
import AskLink from "./AskLink";

// The way into 정 훈도에게 묻기 from a page: the home, the end of the free reading, the end of a bought report.
// Shown once 정 훈도에게 묻기 is open (lib/members.ts ASK_OPEN), or in the owner's 시안 모드.
export default async function AskCard({ from, lead }: { from: AskFrom; lead?: string }) {
  if (!(await askShown())) return null;
  return (
    <AskLink from={from} className="jjok-box mt-4 flex items-center gap-3 px-4 py-4">
      <HundoFace size={46} />
      <span className="min-w-0 flex-1">
        <span className="block font-myeongjo text-[11px] font-bold tracking-[0.2em] text-[#d4af5f]">問訓導 · 맞춤 상담</span>
        <b className="mt-0.5 block font-myeongjo text-[17px] leading-snug">{lead ?? "내 고민 하나, 정 훈도에게 묻기"}</b>
        <span className="mt-0.5 block text-[12px] opacity-75">그대 사주로 답서를 써 드려요 · 카카오로 시작하면 첫 질문 {JOIN_GIFT}개 선물</span>
      </span>
      <span className="shrink-0 font-myeongjo text-sm font-extrabold text-[#d4af5f]">→</span>
    </AskLink>
  );
}
