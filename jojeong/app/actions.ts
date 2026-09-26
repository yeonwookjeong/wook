"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { computeProfile, type Gender } from "@/lib/profile";
import { BirthInputError, computePillars, LATE_ZI, resolveLateZi, type BirthInput, type Pillars } from "@/lib/saju";
import { addMinister, createCourt, CourtFullError, getCourt, listMinisters, MAX_MINISTERS, removeMinister, setProfile } from "@/lib/store";
import { OWNER_COOKIE, MINISTER_COOKIE } from "@/lib/cookies";

export type FormState = { error: string | null };

const COOKIE_OPTS = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 365 };

type Parsed = { name: string; pillars: Pillars; input: BirthInput; gender: Gender | null };

function parseForm(formData: FormData): Parsed {
  const name = String(formData.get("name") ?? "")
    .replace(/[\p{C}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!name) throw new BirthInputError("이름이나 별명을 알려주시옵소서.");
  if ([...name].length > 10) throw new BirthInputError("이름은 10자 이내로 해주시옵소서.");
  return { name, ...parseBirth(formData) };
}

function parseBirth(formData: FormData): Omit<Parsed, "name"> {
  const birth = String(formData.get("birth") ?? "").replace(/\D/g, "");
  if (birth.length !== 8) throw new BirthInputError("생년월일 8자리를 입력해 주시옵소서. (예: 19950312)");

  const calendar = String(formData.get("calendar") ?? "solar");
  if (calendar !== "solar" && calendar !== "lunar" && calendar !== "lunar-leap")
    throw new BirthInputError("양력·음력을 골라주시옵소서.");

  const hourRaw = String(formData.get("hour") ?? "");
  const hour = hourRaw === "" ? null : Number(hourRaw);
  if (hour !== null && !(Number.isInteger(hour) && hour >= 0 && hour <= LATE_ZI))
    throw new BirthInputError("태어난 시간을 다시 골라주시옵소서.");

  const genderRaw = String(formData.get("gender") ?? "");
  const gender: Gender | null = genderRaw === "m" || genderRaw === "f" ? genderRaw : null;

  const raw: BirthInput = {
    year: Number(birth.slice(0, 4)),
    month: Number(birth.slice(4, 6)),
    day: Number(birth.slice(6, 8)),
    calendar,
    hourBranch: hour,
  };
  if (raw.month < 1 || raw.month > 12 || raw.day < 1 || raw.day > 31) throw new BirthInputError("존재하지 않는 날짜이옵니다.");
  // Validate the date as entered first; only then move a late-자시 birth to the next day.
  computePillars({ ...raw, hourBranch: null });
  const input = resolveLateZi(raw);
  return { pillars: computePillars(input), input, gender };
}

// 대운 and the palace chart are extras: a failure there never blocks entering the court.
async function saveProfile(courtId: string, who: string, { input, gender }: Parsed) {
  try {
    await setProfile(courtId, who, computeProfile(input, gender));
  } catch (e) {
    console.error(e);
  }
}

export async function enthroneAction(_prev: FormState, formData: FormData): Promise<FormState> {
  let courtId: string;
  try {
    const parsed = parseForm(formData);
    const court = await createCourt(parsed.name, parsed.pillars);
    await saveProfile(court.id, "king", parsed);
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
    const parsed = parseForm(formData);
    const minister = await addMinister(court.id, parsed.name, parsed.pillars, "joined");
    await saveProfile(court.id, minister.id, parsed);
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

export async function appointMinisterAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const courtId = String(formData.get("courtId") ?? "");
  let ministerId: string;
  try {
    const court = await getCourt(courtId);
    if (!court) return { error: "이미 사라진 조정이옵니다." };
    if ((await cookies()).get(OWNER_COOKIE(court.id))?.value !== court.ownerToken)
      return { error: "전하만 신하를 등용하실 수 있사옵니다." };
    const parsed = parseForm(formData);
    ministerId = (await addMinister(court.id, parsed.name, parsed.pillars, "appointed")).id;
    await saveProfile(court.id, ministerId, parsed);
  } catch (e) {
    if (e instanceof BirthInputError) return { error: e.message };
    if (e instanceof CourtFullError) return { error: `조정이 가득 찼사옵니다. (최대 ${MAX_MINISTERS}명)` };
    console.error(e);
    return { error: "등용 중 문제가 생겼사옵니다. 잠시 후 다시 시도해 주시옵소서." };
  }
  redirect(`/court/${courtId}/m/${ministerId}`);
}

// Adds 대운 and the palace chart to a reading made without them (no gender or hour at entry, or an older
// record). The birth date must give the same chart that is already stored, so nobody can graft someone else's
// details onto a reading. Only the king (owner cookie) or the minister themself may do it.
export async function deepenAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const courtId = String(formData.get("courtId") ?? "");
  const who = String(formData.get("who") ?? "");
  try {
    const court = await getCourt(courtId);
    if (!court) return { error: "이미 사라진 조정이옵니다." };
    const jar = await cookies();
    let stored: Pillars | undefined;
    if (who === "king") {
      if (jar.get(OWNER_COOKIE(court.id))?.value !== court.ownerToken) return { error: "전하만 보강하실 수 있사옵니다." };
      stored = court.king;
    } else {
      if (jar.get(MINISTER_COOKIE(court.id))?.value !== who) return { error: "본인만 보강하실 수 있사옵니다." };
      stored = (await listMinisters(court.id)).find((m) => m.id === who)?.pillars;
    }
    if (!stored) return { error: "사주를 찾을 수 없사옵니다." };
    const parsed = parseBirth(formData);
    const same =
      parsed.pillars.dayStem === stored.dayStem &&
      parsed.pillars.dayBranch === stored.dayBranch &&
      parsed.pillars.yearBranch === stored.yearBranch &&
      (stored.monthBranch === undefined || parsed.pillars.monthBranch === stored.monthBranch);
    const hourDiffers = stored.hourBranch !== null && parsed.input.hourBranch !== null && stored.hourBranch !== parsed.input.hourBranch;
    if (!same || hourDiffers) return { error: "처음 올리신 생년월일시와 사주가 다르옵니다. 다시 확인해 주시옵소서." };
    if (!parsed.gender && parsed.input.hourBranch === null) return { error: "성별이나 태어난 시간 중 하나는 알려 주시옵소서." };
    await setProfile(court.id, who, computeProfile(parsed.input, parsed.gender));
  } catch (e) {
    if (e instanceof BirthInputError) return { error: e.message };
    console.error(e);
    return { error: "보강 중 문제가 생겼사옵니다. 잠시 후 다시 시도해 주시옵소서." };
  }
  refresh();
  return { error: null };
}
