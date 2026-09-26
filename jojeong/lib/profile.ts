import { astro } from "iztro";
import { Lunar, Solar } from "lunar-javascript";
import { BRANCHES, STEMS, type BirthInput } from "./saju";

// What a reading needs beyond the eight characters, worked out once from the birth date and kept instead of
// it (the date itself is never stored):
// - 대운: the ten-year luck pillars and the calendar years they cover (needs gender for their direction)
// - 명반: the twelve life palaces and the stars in each (needs the birth hour). Used quietly to sharpen the
//   reading of each area of life; the page never names the method.

export type Gender = "m" | "f";

export type Daeun = { stem: number; branch: number; from: number; to: number };

export type Palace = { name: string; stars: string[] };

export type Profile = {
  gender?: Gender;
  daeun?: Daeun[];
  palaces?: Palace[]; // 명궁 first, then 형제 부처 자녀 재백 질액 천이 노복 관록 전택 복덕 부모
  natal?: Record<string, "록" | "권" | "과" | "기">; // the birth year's four transformations, by star
};

function solarOf(input: BirthInput) {
  const { year, month, day, calendar } = input;
  return calendar === "solar"
    ? Solar.fromYmdHms(year, month, day, 12, 0, 0)
    : Lunar.fromYmdHms(year, calendar === "lunar-leap" ? -month : month, day, 12, 0, 0).getSolar();
}

export function computeProfile(input: BirthInput, gender: Gender | null): Profile {
  const solar = solarOf(input);
  const profile: Profile = {};
  if (gender) {
    profile.gender = gender;
    const hour = input.hourBranch === null ? 12 : input.hourBranch * 2;
    const ec = Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), hour, 30, 0).getLunar().getEightChar();
    profile.daeun = ec
      .getYun(gender === "m" ? 1 : 0)
      .getDaYun()
      .slice(1, 10)
      .map((d) => {
        const gz = d.getGanZhi();
        return {
          stem: STEMS.indexOf(gz[0] as (typeof STEMS)[number]),
          branch: BRANCHES.indexOf(gz[1] as (typeof BRANCHES)[number]),
          from: d.getStartYear(),
          to: d.getEndYear(),
        };
      });
  }
  if (input.hourBranch !== null) {
    const date = `${solar.getYear()}-${solar.getMonth()}-${solar.getDay()}`;
    // Gender only turns the palace chart's own decade cycle, which is not used; the palaces and stars are the same.
    const chart = astro.bySolar(date, input.hourBranch, gender === "f" ? "female" : "male", true, "ko-KR");
    const order = ["명궁", "형제", "부처", "자녀", "재백", "질액", "천이", "노복", "관록", "전택", "복덕", "부모"];
    profile.palaces = order.map((name) => {
      const p = chart.palaces.find((x) => x.name === name)!;
      return { name, stars: [...p.majorStars, ...p.minorStars].map((s) => s.name) };
    });
    profile.natal = {};
    for (const p of chart.palaces)
      for (const s of [...p.majorStars, ...p.minorStars]) if (s.mutagen) profile.natal[s.name] = s.mutagen as "록";
  }
  return profile;
}

export const MAJOR_STARS = ["자미", "천기", "태양", "무곡", "천동", "염정", "천부", "태음", "탐랑", "거문", "천상", "천량", "칠살", "파군"];

// The main stars of the self palace; an empty self palace borrows from the palace opposite (천이).
export function selfStars(palaces: Palace[]): string[] {
  const own = palaces[0].stars.filter((s) => MAJOR_STARS.includes(s));
  return own.length ? own : palaces[6].stars.filter((s) => MAJOR_STARS.includes(s));
}

export const palaceOf = (palaces: Palace[], star: string) => palaces.find((p) => p.stars.includes(star))?.name ?? null;
