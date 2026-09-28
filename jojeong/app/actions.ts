"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { computeProfile, type Gender } from "@/lib/profile";
import { cityById, parseClock } from "@/lib/birthtime";
import { BirthInputError, computePillars, LATE_ZI, resolveBirthTime, resolveLateZi, type BirthInput, type Pillars } from "@/lib/saju";
import { addMinister, createCourt, CourtFullError, getCourt, getProfile, listMinisters, MAX_MINISTERS, noteReading, removeMinister, setProfile } from "@/lib/store";
import { OWNER_COOKIE, MINISTER_COOKIE } from "@/lib/cookies";
import { encodePerson, relationOf, type Person } from "@/lib/pairToken";
import { forgetMe, readMe, rememberMe } from "@/lib/me";
import { ADULT_ONLY, FIXED_RELATION, isAdult, isPair, productById, type ProductId } from "@/lib/products";
import { CHOOSABLE } from "@/lib/relations";
import { KINDS, parseSearch } from "@/lib/taekil";
import { subjectFor } from "@/lib/subject";

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

  // The clock time as typed ("0930", "오후 9시 30분"…), or nothing when unknown. An hour slot ("hour") is still
  // accepted from older pages.
  const timeRaw = String(formData.get("time") ?? "").trim();
  const clock = timeRaw ? parseClock(timeRaw) : null;
  if (timeRaw && !clock) throw new BirthInputError("태어난 시각을 알아보지 못했사옵니다. (예: 0930, 오후 9시 30분)");
  const hourRaw = String(formData.get("hour") ?? "");
  const hour = clock || hourRaw === "" ? null : Number(hourRaw);
  if (hour !== null && !(Number.isInteger(hour) && hour >= 0 && hour <= LATE_ZI))
    throw new BirthInputError("태어난 시간을 다시 골라주시옵소서.");
  const city = cityById(String(formData.get("city") ?? ""));

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
  // Validate the date as entered first; only then correct the time (which can move the day).
  computePillars({ ...raw, hourBranch: null });
  // 야자시 is asked for only for a birth in the last hour of the day (components/BirthTimeFields.tsx).
  const yaja = formData.get("yaja") === "1";
  const input = clock
    ? resolveBirthTime(raw, clock, city, yaja).input
    : resolveLateZi(raw);
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
    if (!court) return { error: "이미 사라진 조정이에요." };
    const jar = await cookies();
    let stored: Pillars | undefined;
    if (who === "king") {
      if (jar.get(OWNER_COOKIE(court.id))?.value !== court.ownerToken) return { error: "왕 본인만 보강할 수 있어요." };
      stored = court.king;
    } else {
      if (jar.get(MINISTER_COOKIE(court.id))?.value !== who) return { error: "본인만 보강할 수 있어요." };
      stored = (await listMinisters(court.id)).find((m) => m.id === who)?.pillars;
    }
    if (!stored) return { error: "사주를 찾을 수 없어요." };
    const parsed = parseBirth(formData);
    const same =
      parsed.pillars.dayStem === stored.dayStem &&
      parsed.pillars.dayBranch === stored.dayBranch &&
      parsed.pillars.yearBranch === stored.yearBranch &&
      (stored.monthBranch === undefined || parsed.pillars.monthBranch === stored.monthBranch);
    // Charts saved before the time correction may sit one 시 off at a boundary; that still counts as the same.
    const hourDiffers =
      stored.hourBranch !== null &&
      parsed.input.hourBranch !== null &&
      ![0, 1, 11].includes((parsed.input.hourBranch - stored.hourBranch + 12) % 12);
    if (!same || hourDiffers) return { error: "처음 올리신 생년월일시와 사주가 달라요. 다시 확인해 주세요." };
    if (!parsed.gender && parsed.input.hourBranch === null) return { error: "성별이나 태어난 시간 중 하나는 알려 주세요." };
    await setProfile(court.id, who, computeProfile(parsed.input, parsed.gender));
  } catch (e) {
    if (e instanceof BirthInputError) return { error: e.message };
    console.error(e);
    return { error: "보강 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요." };
  }
  refresh();
  return { error: null };
}

// ── 궁합: two people in one form (fields prefixed a_ and b_). The first may be the reader's own saved chart.
// Nothing is stored; both charts travel in the report link (lib/pairToken.ts).
function fieldsOf(formData: FormData, prefix: string): FormData {
  const out = new FormData();
  for (const [k, v] of formData) if (k.startsWith(prefix)) out.set(k.slice(prefix.length), v);
  return out;
}

async function personOf(formData: FormData, prefix: string, label: string): Promise<Person> {
  try {
    const p = parseForm(fieldsOf(formData, prefix));
    const profile = computeProfile(p.input, p.gender);
    return { name: p.name, pillars: p.pillars, gender: p.gender, birthYear: profile.birthYear ?? null, daeun: profile.daeun ?? [] };
  } catch (e) {
    if (e instanceof BirthInputError) throw new BirthInputError(`${label}: ${e.message}`);
    throw e;
  }
}

export async function gunghapAction(_prev: FormState, formData: FormData): Promise<FormState> {
  let url: string;
  try {
    let a: Person;
    const me = await readMe();
    if (formData.get("a_use") === "saved" && me) a = me.person;
    else if (formData.get("a_use") === "saved") {
      const subject = await subjectFor(productById("gunghap")!);
      if (!subject?.self) throw new BirthInputError("저장된 내 사주를 찾지 못했어요. 직접 입력해 주세요.");
      const profile = await getProfile(subject.courtId, subject.who);
      a = { name: subject.name, pillars: subject.pillars, gender: profile?.gender ?? null, birthYear: profile?.birthYear ?? null, daeun: profile?.daeun ?? [] };
    } else a = await personOf(formData, "a_", "나");
    const product = String(formData.get("product") ?? "gunghap") as ProductId;
    if (!isPair(product)) throw new BirthInputError("보고서를 다시 골라 주세요.");
    const b = await personOf(formData, "b_", product === "jaehoe" ? "그 사람" : "상대");
    if (ADULT_ONLY.includes(product) && !(isAdult(a.birthYear) && isAdult(b.birthYear)))
      throw new BirthInputError("속궁합은 만 19세 이상 두 사람만 볼 수 있어요.");
    const chosen = relationOf(formData.get("rel"));
    const rel = FIXED_RELATION[product] ?? (CHOOSABLE.includes(chosen) ? chosen : "lover");
    url = `/reports/${product}?rel=${rel}&a=${encodePerson(a)}&b=${encodePerson(b)}`;
  } catch (e) {
    if (e instanceof BirthInputError) return { error: e.message };
    console.error(e);
    return { error: "궁합을 준비하다 문제가 생겼어요. 잠시 후 다시 시도해 주세요." };
  }
  redirect(url);
}

// ── 내 사주: entered once on any report page, remembered in this browser (lib/me.ts).
export async function saveMeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const next = String(formData.get("next") ?? "");
  try {
    const before = await readMe();
    const person = await personOf(formData, "", "내 사주");
    await rememberMe(person);
    // Counted once per chart: adding the hour or gender to the same birth date is not a new reading.
    if (!before || before.person.birthYear !== person.birthYear || before.person.pillars.dayStem !== person.pillars.dayStem || before.person.pillars.dayBranch !== person.pillars.dayBranch)
      await noteReading();
  } catch (e) {
    if (e instanceof BirthInputError) return { error: e.message.replace(/^내 사주: /, "") };
    console.error(e);
    return { error: "사주를 준비하다 문제가 생겼어요. 잠시 후 다시 시도해 주세요." };
  }
  redirect(/^\/reports\/[a-z]+$/.test(next) ? next : next === "/#today" ? "/#today" : "/");
}

export async function forgetMeAction(formData: FormData) {
  await forgetMe();
  const next = String(formData.get("next") ?? "");
  redirect(/^\/reports\/[a-z]+$/.test(next) ? next : "/");
}

// ── 택일: what for, when, and whose chart (two for a wedding). Carried in the link like a 궁합.
export async function taekilAction(_prev: FormState, formData: FormData): Promise<FormState> {
  let url: string;
  try {
    const search = parseSearch(formData.get("kind"), formData.get("from"), formData.get("n"));
    if (!search) throw new BirthInputError("무엇을 할지와 기간을 다시 골라 주세요.");
    const me = await readMe();
    const a = formData.get("a_use") === "saved" && me ? me.person : await personOf(formData, "a_", "나");
    const params = new URLSearchParams({ kind: search.kind, from: formData.get("from") as string, n: String(search.n), a: encodePerson(a) });
    if (KINDS[search.kind].people === 2) params.set("b", encodePerson(await personOf(formData, "b_", "상대")));
    url = `/reports/taekil?${params}`;
  } catch (e) {
    if (e instanceof BirthInputError) return { error: e.message };
    console.error(e);
    return { error: "날짜를 고르다 문제가 생겼어요. 잠시 후 다시 시도해 주세요." };
  }
  redirect(url);
}
