"use server";

import { isPreview } from "@/lib/admin";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { ask, createRoom, loadRoom, MAX_QUESTION, saveRoom, TOPICS, type AskRoom, type Topic } from "@/lib/ask";
import { addRoomToMember, changeCredits, currentMember, type Member } from "@/lib/members";
import { encodePerson } from "@/lib/pairToken";
import { personOf } from "@/lib/personForm";
import { readMe } from "@/lib/me";
import { BirthInputError } from "@/lib/saju";

// 정 훈도에게 묻기 for members: open a room on their own chart, ask (one question used for each answer; offering
// choices costs nothing), attach the other person. Every action checks the room is the member's own.

export type FormState = { error: string | null };

const topicOf = (v: FormDataEntryValue | null): Topic => ((TOPICS as readonly string[]).includes(String(v)) ? (String(v) as Topic) : "기타");

async function ownRoom(formData: FormData): Promise<{ member: Member; room: AskRoom } | { error: string }> {
  const member = await currentMember();
  if (!member) return { error: "다시 로그인해 주세요." };
  const room = await loadRoom(String(formData.get("room") ?? ""));
  if (!room || room.member !== member.id) return { error: "방을 찾지 못했어요." };
  return { member, room };
}

export async function openRoomAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const member = await currentMember();
  if (!member) return { error: "다시 로그인해 주세요." };
  if (member.rooms.length >= 20) return { error: "사랑방은 20개까지 열 수 있어요." };
  let roomId: string;
  try {
    const person = await personOf(formData, "", "손님");
    if (!person.gender) return { error: "성별을 골라 주세요. 배우자의 별과 10년 흐름을 볼 때 꼭 필요해요." };
    const room = await createRoom(encodePerson(person), member.id);
    roomId = room.id;
    await addRoomToMember(member.id, roomId);
  } catch (e) {
    if (e instanceof BirthInputError) return { error: e.message };
    throw e;
  }
  redirect(`/ask/${roomId}`);
}

// The chart this browser already keeps (the free reading): a room on it in one tap, or back to the one opened before.
export async function openMyRoomAction(): Promise<void> {
  const member = await currentMember();
  if (!member) redirect("/ask");
  const me = await readMe();
  if (!me?.person.gender) redirect("/ask");
  const rooms = await Promise.all(member.rooms.map(loadRoom));
  const mine = rooms.find((r) => r && r.member === member.id && r.me === me.token);
  if (mine) redirect(`/ask/${mine.id}`);
  if (member.rooms.length >= 20) redirect("/ask");
  const room = await createRoom(me.token, member.id);
  await addRoomToMember(member.id, room.id);
  redirect(`/ask/${room.id}`);
}

export async function askAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const own = await ownRoom(formData);
  if ("error" in own) return own;
  const { member, room } = own;
  if (member.credits < 1) return { error: "남은 질문이 없사옵니다. 질문을 채우신 뒤 여쭈시옵소서." };
  const question = String(formData.get("question") ?? "");
  if ([...question.trim()].length > MAX_QUESTION) return { error: `질문은 ${MAX_QUESTION}자 안으로 적어 주시옵소서.` };
  const before = room.used;
  const chosen = String(formData.get("chosen") ?? "") || undefined;
  const result = await ask(room, question, topicOf(formData.get("topic")), chosen, await isPreview());
  if (!result.ok) return { error: result.error };
  // An answer given uses one question; choices offered (nothing answered yet) use none.
  if (room.used > before) await changeCredits(member.id, -1, `질문 ${room.id}`);
  refresh();
  return { error: null };
}

export async function attachOtherAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const own = await ownRoom(formData);
  if ("error" in own) return own;
  const { room } = own;
  try {
    const other = await personOf(formData, "b_", "상대");
    if (!other.gender) return { error: "상대의 성별을 골라 주세요." };
    room.other = encodePerson(other);
    room.otherLabel = String(formData.get("label") ?? "").trim().slice(0, 12) || "그 사람";
  } catch (e) {
    if (e instanceof BirthInputError) return { error: e.message };
    throw e;
  }
  await saveRoom(room);
  refresh();
  return { error: null };
}
