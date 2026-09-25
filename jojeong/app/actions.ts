"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { BirthInputError, computePillars, type BirthInput, type Pillars } from "@/lib/saju";
import { addMinister, createCourt, CourtFullError, getCourt, MAX_MINISTERS, removeMinister } from "@/lib/store";
import { OWNER_COOKIE, MINISTER_COOKIE } from "@/lib/cookies";

export type FormState = { error: string | null };

const COOKIE_OPTS = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 365 };

function parseForm(formData: FormData): { name: string; pillars: Pillars } {
  const name = String(formData.get("name") ?? "")
    .replace(/[\p{C}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!name) throw new BirthInputError("이름이나 별명을 알려주시옵소서.");
  if ([...name].length > 10) throw new BirthInputError("이름은 10자 이내로 해주시옵소서.");

  const birth = String(formData.get("birth") ?? "").replace(/\D/g, "");
  if (birth.length !== 8) throw new BirthInputError("생년월일 8자리를 입력해 주시옵소서. (예: 19950312)");

  const calendar = String(formData.get("calendar") ?? "solar");
  if (calendar !== "solar" && calendar !== "lunar" && calendar !== "lunar-leap")
    throw new BirthInputError("양력·음력을 골라주시옵소서.");

  const hourRaw = String(formData.get("hour") ?? "");
  const hour = hourRaw === "" ? null : Number(hourRaw);
  if (hour !== null && !(Number.isInteger(hour) && hour >= 0 && hour <= 11))
    throw new BirthInputError("태어난 시간을 다시 골라주시옵소서.");

  const input: BirthInput = {
    year: Number(birth.slice(0, 4)),
    month: Number(birth.slice(4, 6)),
    day: Number(birth.slice(6, 8)),
    calendar,
    hourBranch: hour,
  };
  if (input.month < 1 || input.month > 12 || input.day < 1 || input.day > 31)
    throw new BirthInputError("존재하지 않는 날짜이옵니다.");

  return { name, pillars: computePillars(input) };
}

export async function enthroneAction(_prev: FormState, formData: FormData): Promise<FormState> {
  let courtId: string;
  try {
    const { name, pillars } = parseForm(formData);
    const court = await createCourt(name, pillars);
    (await cookies()).set(OWNER_COOKIE(court.id), court.ownerToken, COOKIE_OPTS);
    courtId = court.id;
  } catch (e) {
    if (e instanceof BirthInputError) return { error: e.message };
    console.error(e);
    return { error: "즉위식 준비 중 문제가 생겼사옵니다. 잠시 후 다시 시도해 주시옵소서." };
  }
  redirect(`/court/${courtId}`);
}

export async function joinCourtAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const courtId = String(formData.get("courtId") ?? "");
  let ministerId: string;
  try {
    const court = await getCourt(courtId);
    if (!court) return { error: "이미 사라진 조정이옵니다." };
    const { name, pillars } = parseForm(formData);
    const minister = await addMinister(court.id, name, pillars);
    (await cookies()).set(MINISTER_COOKIE(court.id), minister.id, COOKIE_OPTS);
    ministerId = minister.id;
  } catch (e) {
    if (e instanceof BirthInputError) return { error: e.message };
    if (e instanceof CourtFullError) return { error: `조정이 가득 찼사옵니다. (최대 ${MAX_MINISTERS}명)` };
    console.error(e);
    return { error: "입궐 중 문제가 생겼사옵니다. 잠시 후 다시 시도해 주시옵소서." };
  }
  redirect(`/court/${courtId}/m/${ministerId}`);
}

export async function dismissMinisterAction(formData: FormData) {
  const courtId = String(formData.get("courtId") ?? "");
  const ministerId = String(formData.get("ministerId") ?? "");
  const court = await getCourt(courtId);
  if (!court) return;
  const token = (await cookies()).get(OWNER_COOKIE(court.id))?.value;
  if (token !== court.ownerToken) return;
  await removeMinister(court.id, ministerId);
  refresh();
}
