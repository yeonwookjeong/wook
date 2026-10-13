import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { iljuOf, loadRoom, MAX_PEOPLE, personOfRoom, roomPerson } from "@/lib/ask";
import { decodePerson } from "@/lib/pairToken";
import { RELS, REL_LABEL, relOf } from "@/lib/bond";
import { currentMember } from "@/lib/members";
import { AskForm, AttachOtherForm, ChooseForm, RemovePersonButton } from "../AskForms";
import { renamePersonAction } from "../actions";
import { AnswerLetter, HundoFace, Question, RoomHead } from "../Letter";
import SaveLetter from "../SaveLetter";
import CreditSlips from "../CreditSlips";
import { Plaque, Room } from "../Hall";
import { FigureOf, VerdictCard } from "../Figures";
import { isPreview } from "@/lib/admin";
import { defaultFigures, figureKit } from "@/lib/askFigures";
import { withFigures } from "@/lib/askText";

export const metadata: Metadata = { title: "사랑방 · 정 훈도에게 묻기", robots: { index: false } };
// An answer is written by the model inside the action: give it the same room as a report.
export const maxDuration = 300;

// A member's own room: the eight characters on top, the talk so far as questions and letters, the question bar
// fixed to the bottom (with none left, sending opens the packs right here and keeps what was written), and the other person.
export default async function MemberRoomPage({ params }: PageProps<"/ask/[id]">) {
  const member = await currentMember();
  if (!member) redirect("/ask");
  const { id } = await params;
  const room = await loadRoom(id);
  if (!room || room.member !== member.id) notFound();
  const me = personOfRoom(room);
  if (!me) notFound();
  const people = (room.people ?? []).map((x) => ({ ...x, p: decodePerson(x.token) }));
  // The question box starts on whoever the last question was about, while they are still on the list.
  const lastWith = room.messages.findLast((m) => m.role === "guest")?.with;
  const last = room.messages.at(-1);
  const lastGuest = [...room.messages].reverse().find((m) => m.role === "guest");
  const lastAnswer = room.messages.findLastIndex((m) => m.role === "hundo" && !m.choices);
  // 시안 모드: the pictures each letter marks ([[圖|…]]), drawn from the chart; letters from before the marks get
  // two by their topic.
  const pictures = await isPreview();
  const letterOf = (i: number) => {
    const text = room.messages[i].text;
    if (!pictures) return { text };
    const q = room.messages.slice(0, i).findLast((g) => g.role === "guest");
    const w = roomPerson(room, q?.with);
    const kit = figureKit(me, w ? decodePerson(w.token) : null, w?.label ?? q?.withLabel ?? "", w?.rel, q?.topic ?? "기타", q?.text ?? "", room.messages[i].at);
    if (!kit) return { text };
    return {
      text: withFigures(text, defaultFigures(kit)),
      figure: (k: string) => <FigureOf kit={kit} k={k} name={me.name} />,
      top: <VerdictCard v={kit.verdict} />,
    };
  };

  return (
    <>
      <Room>
        <p className="text-sm">
          <Link href="/ask" className="text-hanji/65 underline">
            ← 청심당
          </Link>
        </p>
        <Plaque caption={`${me.name}님의 사랑방`} />
        <RoomHead
          bare
          person={me}
          ilju={iljuOf(me)}
          credits={member.credits}
          extra={people.length ? `함께: ${people.map((x) => x.label).join(", ")}` : undefined}
        />

        <section className="mt-5 flex flex-col gap-3 text-ink">
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
              <Question key={i} slip text={m.text} topic={[m.topic, m.withLabel && `${m.withLabel} 이야기`].filter(Boolean).join(" · ")} at={m.at} />
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
                <AnswerLetter id={`letter-${i}`} name={me.name} at={m.at} {...letterOf(i)} />
                <SaveLetter
                  target={`letter-${i}`}
                  file={`정훈도-답서-${i + 1}`}
                  question={room.messages.slice(0, i).findLast((g) => g.role === "guest")?.text}
                />
              </div>
            ),
          )}
        </section>

        {/* The box is there either way; with no questions left, sending opens the packs and keeps what was written. */}
        <AskForm
          room={room.id}
          people={people.map((x) => ({ id: x.id, label: x.label }))}
          defaultWith={people.some((x) => x.id === lastWith) ? lastWith : undefined}
          canAdd={people.length < MAX_PEOPLE}
          credits={member.credits}
        >
          <div className="mt-4">
            <CreditSlips />
          </div>
        </AskForm>
      </Room>

      {/* The people seen together: up to five, each renamed, entered again or taken off (still remembered). */}
      <details id="people" open={people.length === 0 ? undefined : true} className="doc-paper mt-5 mb-10 scroll-mt-4 px-5 py-4">
        <summary className="cursor-pointer text-sm font-bold">
          {people.length ? `함께 보는 사람 (${people.length}/${MAX_PEOPLE})` : "그 사람의 사주도 함께 보기 (연애·궁합·관계 질문에)"}
        </summary>
        {people.length > 0 && (
          <ul className="mt-3 flex flex-col divide-y divide-seal/10">
            {people.map((x) => (
              <li key={x.id} className="py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 text-sm">
                    <b>{x.label}</b>{" "}
                    <span className="text-ink-soft">
                      · {REL_LABEL[relOf(x.rel, x.label)].split(" ")[0]} · {x.p ? `${x.p.name} · ${iljuOf(x.p)}` : "?"}
                    </span>
                  </p>
                  <RemovePersonButton room={room.id} person={x.id} label={x.label} />
                </div>
                <details className="mt-1">
                  <summary className="cursor-pointer text-[12px] text-ink-soft underline">고치기</summary>
                  <form action={renamePersonAction} className="mt-2 flex gap-1.5">
                    <input type="hidden" name="room" value={room.id} />
                    <input type="hidden" name="person" value={x.id} />
                    <input
                      name="label"
                      defaultValue={x.label}
                      maxLength={12}
                      aria-label="부르는 이름"
                      className="min-w-0 flex-1 rounded-lg border border-ink/15 bg-white/70 px-3 py-1.5 text-sm"
                    />
                    <select
                      name="rel"
                      defaultValue={relOf(x.rel, x.label)}
                      aria-label="사이"
                      className="shrink-0 rounded-lg border border-ink/15 bg-white/70 px-1.5 text-sm"
                    >
                      {RELS.map((r) => (
                        <option key={r} value={r}>
                          {REL_LABEL[r].split(" ")[0]}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="shrink-0 rounded-lg border border-ink/25 px-3 text-xs font-bold">
                      바꾸기
                    </button>
                  </form>
                  <p className="mt-3 text-[12px] font-bold">생년월일을 다시 넣기</p>
                  <AttachOtherForm room={room.id} person={x.id} />
                </details>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11.5px] leading-relaxed text-ink-soft">
          지우거나 이름을 바꿔도 정 훈도는 그 사람과 나눈 이야기를 기억해요. 생년월일은 사주 글자로만 바꿔 두고 저장하지 않아요.
        </p>
        {people.length < MAX_PEOPLE ? (
          <details className="mt-3" open={people.length === 0 ? true : undefined}>
            <summary className="cursor-pointer text-sm font-bold text-seal">＋ 사람 더하기</summary>
            <AttachOtherForm room={room.id} />
          </details>
        ) : (
          <p className="mt-3 text-[12px] text-ink-soft">{MAX_PEOPLE}명까지 함께 볼 수 있어요. 한 명을 지우거나 고쳐서 바꿔 주세요.</p>
        )}
      </details>
    </>
  );
}
