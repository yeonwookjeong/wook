import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { iljuOf, loadRoom, otherOfRoom, personOfRoom } from "@/lib/ask";
import { currentMember } from "@/lib/members";
import { AskForm, AttachOtherForm, ChooseForm } from "../AskForms";

export const metadata: Metadata = { title: "상담방 · 정 훈도에게 묻기", robots: { index: false } };
// An answer is written by the model inside the action: give it the same room as a report.
export const maxDuration = 300;

const when = (t: number) => new Date(t + 9 * 3600000).toISOString().slice(5, 16).replace("T", " ");

// A member's own room: the talk so far, the question box (while questions are left), and the other person.
export default async function MemberRoomPage({ params }: PageProps<"/ask/[id]">) {
  const member = await currentMember();
  if (!member) redirect("/ask");
  const { id } = await params;
  const room = await loadRoom(id);
  if (!room || room.member !== member.id) notFound();
  const me = personOfRoom(room);
  const other = otherOfRoom(room);
  const last = room.messages.at(-1);
  const lastGuest = [...room.messages].reverse().find((m) => m.role === "guest");

  return (
    <>
      <p className="mt-4 text-sm">
        <Link href="/ask" className="text-ink-soft underline">
          ← 내 상담방
        </Link>
      </p>
      <section className="doc-paper mt-3 px-5 py-4">
        <p className="text-xs font-bold tracking-[0.2em] text-seal">정 훈도에게 묻기</p>
        <h1 className="mt-1 font-myeongjo text-xl font-extrabold">
          {me?.name ?? "?"}님의 상담방 <span className="text-base font-normal text-ink-soft">{me ? iljuOf(me) : ""}</span>
        </h1>
        <p className="mt-1 text-xs text-ink-soft">
          남은 질문 <b className="text-seal">{member.credits}</b>개{other ? ` · 함께 보는 사람: ${room.otherLabel}(${other.name})` : ""}
        </p>
      </section>

      <section className="mt-3 flex flex-col gap-2.5">
        {room.messages.length === 0 && (
          <p className="doc-paper px-4 py-4 text-[15px] leading-relaxed">
            어서 오시옵소서. 소신이 {me?.name}님의 여덟 글자를 펼쳐 두었사옵니다. 무엇이 궁금하시옵니까?
          </p>
        )}
        {room.messages.map((m, i) =>
          m.role === "guest" ? (
            <div key={i} className="ml-8 rounded-2xl rounded-br-sm bg-ink px-4 py-3 text-[15px] leading-relaxed text-hanji">
              {m.topic && <span className="mb-1 block text-[11px] font-bold opacity-70">{m.topic}</span>}
              <p className="whitespace-pre-wrap">{m.text}</p>
              <span className="mt-1 block text-right text-[10px] opacity-60">{when(m.at)}</span>
            </div>
          ) : (
            <div key={i} className="doc-paper mr-4 rounded-2xl rounded-bl-sm px-4 py-3 text-[15px] leading-relaxed">
              <span className="mb-1 block text-[11px] font-bold text-seal">정 훈도</span>
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.choices && m === last && lastGuest && member.credits > 0 && (
                <ChooseForm room={room.id} question={lastGuest.text} topic={lastGuest.topic ?? "기타"} choices={m.choices} />
              )}
              <span className="mt-1 block text-right text-[10px] text-ink-soft">{when(m.at)}</span>
            </div>
          ),
        )}
      </section>

      {member.credits > 0 ? (
        <section className="doc-paper mt-3 px-4 py-3">
          <AskForm room={room.id} />
        </section>
      ) : (
        <Link href="/ask" className="doc-paper mt-3 block px-4 py-4 text-center text-[14px] font-bold text-seal">
          남은 질문이 없어요 · 질문 채우러 가기 →
        </Link>
      )}

      <details className="doc-paper mt-4 mb-10 px-5 py-4">
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
