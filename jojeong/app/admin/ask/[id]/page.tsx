import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { costKrw, type Usage } from "@/lib/aiCost";
import { iljuOf, loadRoom, otherOfRoom, personOfRoom } from "@/lib/ask";
import { deleteRoomAction, detachOtherAction, saveMemoAction } from "../actions";
import { AskForm, AttachOtherForm, ChooseForm } from "../AskForms";

export const metadata: Metadata = { title: "상담방 · 관리자", robots: { index: false } };
// An answer is written by the model inside the action: give it the same room as a report.
export const maxDuration = 300;

const when = (t: number) => new Date(t + 9 * 3600000).toISOString().slice(5, 16).replace("T", " ");
const n = (v: number) => v.toLocaleString("ko-KR");
// "입력 8,120 · 출력 940 토큰 · 약 95원": what one answer cost to write.
function costLine(u: Usage) {
  const won = costKrw(u);
  return `입력 ${n(u.input + u.cacheRead + u.cacheWrite)} · 출력 ${n(u.output)} 토큰${won === null ? "" : ` · 약 ${n(Math.round(won))}원`} · ${u.model}`;
}

export default async function AskRoomPage({ params }: PageProps<"/admin/ask/[id]">) {
  if (!(await isAdmin()))
    return (
      <p className="doc-paper mt-6 px-5 py-6 text-sm">
        <Link href="/admin" className="underline">
          관리자로 로그인
        </Link>
        한 뒤에 열 수 있어요.
      </p>
    );
  const { id } = await params;
  const room = await loadRoom(id);
  if (!room) notFound();
  const me = personOfRoom(room);
  const other = otherOfRoom(room);
  const last = room.messages.at(-1);
  const lastGuest = [...room.messages].reverse().find((m) => m.role === "guest");
  // The cost of the answers so far, for pricing a question.
  const costs = room.messages.flatMap((m) => (m.usage ? [costKrw(m.usage)] : [])).filter((c): c is number => c !== null);
  const avg = costs.length ? Math.round(costs.reduce((a, c) => a + c, 0) / costs.length) : null;

  return (
    <>
      <p className="mt-4 text-sm">
        <Link href="/admin/ask" className="text-ink-soft underline">
          ← 상담방 목록
        </Link>
      </p>

      <section className="doc-paper mt-3 px-5 py-4">
        <p className="text-xs font-bold tracking-[0.2em] text-seal">정 훈도에게 묻기</p>
        <h1 className="mt-1 font-myeongjo text-xl font-extrabold">
          {me?.name ?? "?"}님의 상담방 <span className="text-base font-normal text-ink-soft">{me ? iljuOf(me) : ""}</span>
        </h1>
        <p className="mt-1 text-xs text-ink-soft">
          답한 질문 {room.used}개{other ? ` · 함께 보는 사람: ${room.otherLabel}(${other.name}, ${iljuOf(other)})` : ""}
        </p>
        {avg !== null && (
          <p className="mt-1 text-xs font-bold text-seal">
            답변 원가 평균 약 {n(avg)}원 · {costs.length}개 기준 · 합계 약 {n(Math.round(costs.reduce((a, c) => a + c, 0)))}원
          </p>
        )}
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
              {m.choices && m === last && lastGuest && (
                <ChooseForm room={room.id} question={lastGuest.text} topic={lastGuest.topic ?? "기타"} choices={m.choices} />
              )}
              {m.usage && <span className="mt-1 block text-[10px] text-ink-soft">{costLine(m.usage)}</span>}
              <span className="mt-1 block text-right text-[10px] text-ink-soft">{when(m.at)}</span>
            </div>
          ),
        )}
      </section>

      <section className="doc-paper mt-3 px-4 py-3">
        <AskForm room={room.id} />
      </section>

      <details className="doc-paper mt-4 px-5 py-4">
        <summary className="cursor-pointer text-sm font-bold">정 훈도의 상담 메모 (손님에게도 보일 기록)</summary>
        <form action={saveMemoAction} className="mt-2 flex flex-col gap-2">
          <input type="hidden" name="room" value={room.id} />
          <textarea name="memo" defaultValue={room.memo} rows={8} className="rounded-xl border border-ink/15 bg-white/70 px-3 py-2 text-[13px] leading-relaxed" />
          <button type="submit" className="self-end rounded-lg border border-ink/20 px-4 py-1.5 text-xs font-bold">
            메모 저장
          </button>
        </form>
      </details>

      <details className="doc-paper mt-3 px-5 py-4">
        <summary className="cursor-pointer text-sm font-bold">{other ? `함께 보는 사람: ${room.otherLabel}` : "상대 사주 붙이기"}</summary>
        {other ? (
          <form action={detachOtherAction} className="mt-2">
            <input type="hidden" name="room" value={room.id} />
            <p className="text-sm">
              {other.name} · {iljuOf(other)}
            </p>
            <button type="submit" className="mt-2 rounded-lg border border-ink/20 px-4 py-1.5 text-xs font-bold">
              떼어 내기
            </button>
          </form>
        ) : (
          <AttachOtherForm room={room.id} />
        )}
      </details>

      <form action={deleteRoomAction} className="mt-4 mb-10 text-center">
        <input type="hidden" name="room" value={room.id} />
        <button type="submit" className="text-xs text-ink-soft underline">
          이 방 통째로 지우기
        </button>
      </form>
    </>
  );
}
