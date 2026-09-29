declare module "lunar-javascript" {
  interface EightChar {
    getYearGan(): string;
    getYearZhi(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getTimeGan(): string;
    getTimeZhi(): string;
    getYun(gender: 0 | 1): Yun;
  }
  interface Yun {
    getDaYun(): DaYun[];
  }
  interface DaYun {
    getGanZhi(): string;
    getStartYear(): number;
    getEndYear(): number;
    getStartAge(): number;
    getEndAge(): number;
  }
  interface LunarTime {
    getZhi(): string;
    getTianShen(): string;
    getTianShenType(): "黄道" | "黑道";
    getMinHm(): string;
    getMaxHm(): string;
  }
  interface LunarDate {
    getEightChar(): EightChar;
    getSolar(): SolarDate;
    // The almanac (通書) for the day, used by lib/taekil.ts.
    getMonth(): number; // negative for a leap month
    getDay(): number;
    getDayGan(): string;
    getDayZhi(): string;
    getDayYi(): string[];
    getDayJi(): string[];
    getDayTianShen(): string;
    getDayTianShenType(): "黄道" | "黑道";
    getZhiXing(): string;
    getXiu(): string;
    getXiuLuck(): "吉" | "凶";
    getTimes(): LunarTime[];
    getYearZhiByLiChun(): string;
    getYearGanByLiChun(): string;
  }
  interface SolarDate {
    getLunar(): LunarDate;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    next(days: number): SolarDate;
    getWeek(): number; // 0 = Sunday
    isBefore(other: SolarDate): boolean;
  }
  export const Solar: {
    fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): SolarDate;
    fromYmd(y: number, m: number, d: number): SolarDate;
  };
  export const Lunar: {
    fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): LunarDate;
  };
}
