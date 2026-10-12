import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PayButton from "@/components/PayButton";
import { iljuOf, loadRoom, otherOfRoom, personOfRoom } from "@/lib/ask";
import { currentMember } from "@/lib/members";
import { CREDIT_PACKS, type CreditPack } from "@/lib/products";
import { AskForm, AttachOtherForm, ChooseForm } from "../AskForms";
import { AnswerLetter, HundoFace, Question, RoomHead } from "../Letter";
import SaveLetter from "../SaveLetter";

export const metadata: Metadata = { title: "사랑방 · 정 훈도에게 묻기", robots: { index: false } };
// An answer is written by the model inside the action: give it the same room as a report.
export const maxDuration = 300;

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

// A member's own room: the eight characters on top, the talk so far as questions and letters, the question bar
// fixed to the bottom while questions are left (buying more right here once they run out), and the other person.
export default async function MemberRoomPage({ params }: PageProps<"/ask/[id]">) {
  const member = await currentMember();
  if (!member) redirect("/ask");
  const { id } = await params;
  const room = await loadRoom(id);
  if (!room || room.member !== member.id) notFound();
  const me = personOfRoom(room);
  if (!me) notFound();
  const other = otherOfRoom(room);
  const last = room.messages.at(-1);
  const lastGuest = [...room.messages].reverse().find((m) => m.role === "guest");
  const lastAnswer = room.messages.findLastIndex((m) => m.role === "hundo" && !m.choices);

  return (
    <>
      <p className="mt-4 text-sm">
        <Link href="/ask" className="text-ink-soft underline">
          ← 내 사랑방
        </Link>
      </p>
      <RoomHead person={me} ilju={iljuOf(me)} credits={member.credits} extra={other ? `함께: ${room.otherLabel}` : undefined} />

      <section className="mt-4 flex flex-col gap-3">
        {room.messages.length === 0 && (
          <div className="doc-paper flex items-start gap-3 rounded-[4px] px-5 py-4">
            <HundoFace size={34} ring="seal" />
            <p className="font-myeongjo text-[15px] leading-relaxed">
              어서 오시옵소서. 소신이 {me.name}님의 여덟 글자를 펼쳐 두었사옵니다. 무엇이 궁금하시옵니까? 한 번에 하나를 여쭈실수록 깊이 답해 드리옵니다.
            </p>
          </div>
        )}
        {room.messages.map((m, i) =>
          m.role === "guest" ? (
            <Question key={i} text={m.text} topic={m.topic} at={m.at} />
          ) : m.choices ? (
            <div key={i} className="doc-paper rounded-[4px] px-5 py-4 text-[15px] leading-relaxed">
              <div className="flex items-start gap-3">
                <HundoFace size={34} ring="seal" />
                <p className="font-myeongjo whitespace-pre-wrap">{m.text}</p>
              </div>
              {m === last && lastGuest && member.credits > 0 && (
                <ChooseForm room={room.id} question={lastGuest.text} topic={lastGuest.topic ?? "기타"} choices={m.choices} />
              )}
            </div>
          ) : (
            <div key={i} id={i === lastAnswer ? "last-answer" : undefined} className="scroll-mt-4">
              <AnswerLetter id={`letter-${i}`} name={me.name} text={m.text} at={m.at} />
              <SaveLetter target={`letter-${i}`} file={`정훈도-답서-${i + 1}`} question={room.messages.slice(0, i).findLast((g) => g.role === "guest")?.text} />
            </div>
          ),
        )}
      </section>

      {member.credits > 0 ? (
        <AskForm room={room.id} other={Boolean(other)} />
      ) : (
        <section className="jjok-box mt-4 px-4 py-4">
          <p className="text-center font-myeongjo text-[15px] font-extrabold">이어서 여쭈시려면 질문을 채워 주세요</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-ink">
            {(Object.keys(CREDIT_PACKS).map(Number) as CreditPack[]).map((n) => (
              <div key={n} className="rounded-xl bg-hanji px-1 pt-2 pb-1">
                <b className="block font-myeongjo">질문 {n}개</b>
                <span className="block text-[12px] text-ink-soft">{won(CREDIT_PACKS[n])}</span>
                <PayButton request={{ credits: String(n) }} label="채우기" secondary />
              </div>
            ))}
          </div>
        </section>
      )}

      <details id="other" className="doc-paper mt-4 mb-10 scroll-mt-4 px-5 py-4">
        <summary className="cursor-pointer text-sm font-bold">{other ? `함께 보는 사람: ${room.otherLabel}` : "그 사람의 사주도 함께 보기 (연애·궁합 질문에)"}</summary>
        {other ? (
          <p className="mt-2 text-sm">
            {other.name} · {iljuOf(other)}
          </p>
        ) : (
          <AttachOtherForm room={room.id} />
        )}
      </details>
    </>
  );
}
