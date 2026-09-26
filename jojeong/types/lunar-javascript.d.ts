declare module "lunar-javascript" {
  interface EightChar {
    getYearGan(): string;
    getYearZhi(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getDayGan(): string;
    getDayZhi(): string;
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
  }
  export const Solar: {
    fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): SolarDate;
  };
  export const Lunar: {
    fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): LunarDate;
  };
}
