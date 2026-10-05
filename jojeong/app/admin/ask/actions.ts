"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { ask, createRoom, loadRoom, MAX_QUESTION, saveRoom, TOPICS, type Topic } from "@/lib/ask";
import { encodePerson } from "@/lib/pairToken";
import { personOf } from "@/lib/personForm";
import { BirthInputError } from "@/lib/saju";
import { deleteAskRoom } from "@/lib/store";

// 정 훈도에게 묻기, the owner's trial rooms: open one for a chart, ask, pick among offered topics, attach the other
// person, fix the memo, or delete the room. Owner only until sales open.

export type FormState = { error: string | null };

const topicOf = (v: FormDataEntryValue | null): Topic => (TOPICS as readonly string[]).includes(String(v)) ? (String(v) as Topic) : "기타";

export async function openRoomAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { error: "관리자로 다시 로그인해 주세요." };
  let roomId: string;
  try {
    const person = await personOf(formData, "", "손님");
    roomId = (await createRoom(encodePerson(person))).id;
  } catch (e) {
    if (e instanceof BirthInputError) return { error: e.message };
    throw e;
  }
  redirect(`/admin/ask/${roomId}`);
}

export async function askAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { error: "관리자로 다시 로그인해 주세요." };
  const room = await loadRoom(String(formData.get("room") ?? ""));
  if (!room) return { error: "방을 찾지 못했어요." };
  const question = String(formData.get("question") ?? "");
  if ([...question.trim()].length > MAX_QUESTION) return { error: `질문은 ${MAX_QUESTION}자 안으로 적어 주시옵소서.` };
  const chosen = String(formData.get("chosen") ?? "") || undefined;
  const result = await ask(room, question, topicOf(formData.get("topic")), chosen);
  if (!result.ok) return { error: result.error };
  refresh();
  return { error: null };
}

export async function attachOtherAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { error: "관리자로 다시 로그인해 주세요." };
  const room = await loadRoom(String(formData.get("room") ?? ""));
  if (!room) return { error: "방을 찾지 못했어요." };
  try {
    const other = await personOf(formData, "b_", "상대");
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

export async function detachOtherAction(formData: FormData) {
  if (!(await isAdmin())) return;
  const room = await loadRoom(String(formData.get("room") ?? ""));
  if (!room) return;
  delete room.other;
  delete room.otherLabel;
  await saveRoom(room);
  refresh();
}

export async function saveMemoAction(formData: FormData) {
  if (!(await isAdmin())) return;
  const room = await loadRoom(String(formData.get("room") ?? ""));
  if (!room) return;
  room.memo = String(formData.get("memo") ?? "").slice(0, 1500);
  await saveRoom(room);
  refresh();
}

export async function deleteRoomAction(formData: FormData) {
  if (!(await isAdmin())) return;
  await deleteAskRoom(String(formData.get("room") ?? ""));
  redirect("/admin/ask");
}
