declare module "lunar-javascript" {
  interface EightChar {
    getYearGan(): string;
    getYearZhi(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getYun(gender: 0 | 1): Yun;
  }
  interface Yun {
    getDaYun(): DaYun[];
  }
  interface DaYun {
    getGanZhi(): string;
    getStartYear(): number;
    getEndYear(): number;
  }
  interface LunarDate {
    getEightChar(): EightChar;
    getSolar(): SolarDate;
  }
  interface SolarDate {
    getLunar(): LunarDate;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    next(days: number): SolarDate;
  }
  export const Solar: {
    fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): SolarDate;
  };
  export const Lunar: {
    fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): LunarDate;
  };
}
