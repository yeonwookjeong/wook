import { computeProfile, type Gender } from "@/lib/profile";
import { cityById, parseClock } from "@/lib/birthtime";
import { BirthInputError, computePillars, LATE_ZI, resolveBirthTime, resolveLateZi, type BirthInput, type Pillars } from "@/lib/saju";
import type { Person } from "@/lib/pairToken";

// One person's birth form, read into a chart: shared by the server actions of the site (app/actions.ts) and the
// owner's page (app/admin/actions.ts). Nothing here stores anything.

export type Parsed = { name: string; pillars: Pillars; input: BirthInput; gender: Gender | null };

export function parseForm(formData: FormData): Parsed {
  const name = String(formData.get("name") ?? "")
    .replace(/[\p{C}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!name) throw new BirthInputError("이름이나 별명을 알려주시옵소서.");
  if ([...name].length > 10) throw new BirthInputError("이름은 10자 이내로 해주시옵소서.");
  return { name, ...parseBirth(formData) };
}

export function parseBirth(formData: FormData): Omit<Parsed, "name"> {
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


export function fieldsOf(formData: FormData, prefix: string): FormData {
  const out = new FormData();
  for (const [k, v] of formData) if (k.startsWith(prefix)) out.set(k.slice(prefix.length), v);
  return out;
}

export async function personOf(formData: FormData, prefix: string, label: string): Promise<Person> {
  try {
    const p = parseForm(fieldsOf(formData, prefix));
    const profile = computeProfile(p.input, p.gender);
    return { name: p.name, pillars: p.pillars, gender: p.gender, birthYear: profile.birthYear ?? null, daeun: profile.daeun ?? [] };
  } catch (e) {
    if (e instanceof BirthInputError) throw new BirthInputError(`${label}: ${e.message}`);
    throw e;
  }
}
