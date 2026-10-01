import { Solar } from "lunar-javascript";
import { ILJU_IMAGE } from "./iljuRank";
import { josa } from "./josa";
import { ANIMALS, BRANCHES, BRANCHES_KO, STEMS, STEMS_KO } from "./saju";
import { dayPillar } from "./today";

// The night Threads post: one fact the calendar itself gives about tonight or tomorrow, in 정 훈도's voice.
// Not a question by rule, never a reading of anyone's chart, never a rating of the day. Picked in order:
// a 절기 tomorrow (and whether the saju month turns with it), 손 없는 날 tomorrow, 보름 or 초하루 tonight,
// and otherwise the hour the saju day turns over (자시, 23:30, as the site counts it) from today's pillar to
// tomorrow's.
const TERMS: Record<string, [ko: string, hanja: string, meaning: string]> = {
  立春: ["입춘", "立春", "봄이 들어선다는 날"],
  雨水: ["우수", "雨水", "눈이 비로 바뀌고 얼음이 녹기 시작한다는 때"],
  惊蛰: ["경칩", "驚蟄", "겨울잠 자던 벌레가 깨어난다는 때"],
  驚蟄: ["경칩", "驚蟄", "겨울잠 자던 벌레가 깨어난다는 때"],
  春分: ["춘분", "春分", "낮과 밤의 길이가 같아지는 날"],
  清明: ["청명", "淸明", "하늘이 맑고 밝아진다는 때"],
  淸明: ["청명", "淸明", "하늘이 맑고 밝아진다는 때"],
  谷雨: ["곡우", "穀雨", "곡식을 깨우는 비가 내린다는 때"],
  穀雨: ["곡우", "穀雨", "곡식을 깨우는 비가 내린다는 때"],
  立夏: ["입하", "立夏", "여름이 들어선다는 날"],
  小满: ["소만", "小滿", "만물이 조금씩 차오른다는 때"],
  小滿: ["소만", "小滿", "만물이 조금씩 차오른다는 때"],
  芒种: ["망종", "芒種", "보리는 거두고 벼는 심는 때"],
  芒種: ["망종", "芒種", "보리는 거두고 벼는 심는 때"],
  夏至: ["하지", "夏至", "낮이 한 해 가운데 가장 긴 날"],
  小暑: ["소서", "小暑", "작은 더위가 시작된다는 때"],
  大暑: ["대서", "大暑", "큰 더위가 온다는 때"],
  立秋: ["입추", "立秋", "가을이 들어선다는 날"],
  处暑: ["처서", "處暑", "더위가 그친다는 때"],
  處暑: ["처서", "處暑", "더위가 그친다는 때"],
  白露: ["백로", "白露", "풀잎에 흰 이슬이 맺힌다는 때"],
  秋分: ["추분", "秋分", "낮과 밤의 길이가 다시 같아지는 날"],
  寒露: ["한로", "寒露", "찬 이슬이 맺히기 시작한다는 때"],
  霜降: ["상강", "霜降", "첫서리가 내린다는 때"],
  立冬: ["입동", "立冬", "겨울이 들어선다는 날"],
  小雪: ["소설", "小雪", "첫눈이 내린다는 때"],
  大雪: ["대설", "大雪", "눈이 크게 온다는 때"],
  冬至: ["동지", "冬至", "밤이 한 해 가운데 가장 긴 날"],
  小寒: ["소한", "小寒", "작은 추위가 온다는 때"],
  大寒: ["대한", "大寒", "큰 추위가 온다는 때"],
};

const DAY = 86400000;
const ymd = (date: string) => date.split("-").map(Number) as [number, number, number];
const next = (date: string) => new Date(Date.parse(`${date}T12:00:00Z`) + DAY).toISOString().slice(0, 10);
const lunarOf = (date: string) => Solar.fromYmd(...ymd(date)).getLunar();
// 윤달 comes back negative.
const lunarMonth = (m: number) => (m < 0 ? `윤${-m}` : `${m}`);
const pillar = (stem: number, branch: number) => {
  const hanja = `${STEMS[stem]}${BRANCHES[branch]}`;
  return { hanja, ko: `${STEMS_KO[stem]}${BRANCHES_KO[branch]}`, image: ILJU_IMAGE[hanja] };
};
const fromHanja = (hanja: string) => pillar(STEMS.indexOf(hanja[0] as (typeof STEMS)[number]), BRANCHES.indexOf(hanja[1] as (typeof BRANCHES)[number]));

export type Night = { kind: "month" | "term" | "son" | "full" | "new" | "gapja" | "animal" | "jasi"; text: string };

// "2026-10-07" → the night post for that Korean calendar day.
export function nightPost(date: string): Night {
  const tmr = next(date);
  const today = lunarOf(date);
  const tomorrow = lunarOf(tmr);
  const term = TERMS[tomorrow.getJieQi()];

  // A 절 tomorrow: the saju month turns (the month pillar read late that night, after the term has begun).
  if (term && tomorrow.getCurrentJie()) {
    const month = fromHanja(Solar.fromYmdHms(...ymd(tmr), 23, 0, 0).getLunar().getEightChar().getMonth());
    return {
      kind: "month",
      text: [
        `내일은 ${term[0]}(${term[1]})이옵니다. ${term[2]}이지요.`,
        "사주의 달은 1일이 아니라 절기로 바뀌니,",
        `내일부터는 ${month.ko}(${month.hanja})월, ${month.image}의 달이옵니다.`,
      ].join("\n"),
    };
  }
  // A 중기 tomorrow: a season's marker, the month stays.
  if (term) {
    const month = fromHanja(Solar.fromYmdHms(...ymd(tmr), 12, 0, 0).getLunar().getEightChar().getMonth());
    return {
      kind: "term",
      text: [`내일은 ${term[0]}(${term[1]})이옵니다.`, `${term[2]}이지요.`, `사주의 달은 바뀌지 않고, ${month.ko}(${month.hanja})월이 이어지옵니다.`].join("\n"),
    };
  }
  // 손 없는 날: lunar days ending in 9 and 0.
  const td = tomorrow.getDay();
  if (td % 10 === 9 || td % 10 === 0) {
    const again = today.getDay() % 10 === 9;
    return {
      kind: "son",
      text: [
        `내일은 음력 ${lunarMonth(tomorrow.getMonth())}월 ${td}일, ${again ? "이틀째 " : ""}손 없는 날이옵니다.`,
        "손이 하늘로 올라가 어디에도 없다는 날이지요.",
        again ? "음력 날짜만 보는 풍속이라, 누구에게나 같은 날이옵니다." : "이삿짐 예약이 몰리는 날이기도 하옵니다.",
      ].join("\n"),
    };
  }
  if (today.getDay() === 15)
    return {
      kind: "full",
      text: [`오늘 밤은 음력 ${lunarMonth(today.getMonth())}월 보름이옵니다.`, "달이 한 달 가운데 가장 둥글 무렵이지요.", "구름이 없으면 한번 올려다보시옵소서."].join("\n"),
    };
  if (today.getDay() === 1)
    return {
      kind: "new",
      text: [`오늘은 음력 ${lunarMonth(today.getMonth())}월 초하루이옵니다.`, "달이 보이지 않는 밤,", "음력으로는 새 달이 시작되었사옵니다."].join("\n"),
    };

  const a = dayPillar(...ymd(date));
  const b = dayPillar(...ymd(tmr));
  const now = pillar(a.stem, a.branch);
  const then = pillar(b.stem, b.branch);
  // The sixty begin again.
  if (then.hanja === "甲子")
    return {
      kind: "gapja",
      text: ["내일은 갑자(甲子)일이옵니다.", "육십갑자의 첫 자리라, 예순 날 만에 일진이 처음으로 돌아오지요.", `오늘 계해(癸亥)일로 한 바퀴를 마치옵니다.`].join("\n"),
    };
  // On ordinary nights, two facts take turns so the post does not read the same every night.
  if (Math.floor(Date.parse(`${date}T12:00:00Z`) / DAY) % 2 === 1) {
    const animal = ANIMALS[b.branch];
    return {
      kind: "animal",
      text: [
        `내일은 ${then.ko}(${then.hanja})일, ${animal}의 날이옵니다.`,
        "날의 동물은 날마다 바뀌어 열이틀 만에 다시 돌아오지요.",
        `${animal}띠이신 분께는 제 띠를 만나는 날이옵니다.`,
      ].join("\n"),
    };
  }
  return {
    kind: "jasi",
    text: [
      "오늘 밤 11시 반, 자시(子時)가 되면 사주의 하루가 바뀌옵니다.",
      `${now.ko}(${now.hanja}), ${josa(now.image, "이/가")} 물러가고`,
      `${then.ko}(${then.hanja}), ${josa(then.image, "이/가")} 오지요.`,
    ].join("\n"),
  };
}
