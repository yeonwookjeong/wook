import { Solar } from "lunar-javascript";
import { meetings } from "./deep";
import { ELEMENT_HANJA, ELEMENT_KO, BRANCH_EL, readChart, stemEl } from "./myeongri";
import type { Person } from "./pairToken";
import { BRANCHES, STEMS } from "./saju";

// 오늘의 일진 for the main page: today's day pillar (Korean date) as an image and a line of advice, and, with
// the reader's chart, what the day's elements are to them. Rule-based, no writer involved.

const STEM_IMAGE = ["큰 나무", "꽃과 덩굴", "한낮의 태양", "밤의 등불", "큰 산", "기름진 논밭", "단단한 무쇠", "빛나는 보석", "큰 강", "단비"];
const BRANCH_SCENE = ["한겨울 밤", "언 땅", "이른 봄 숲", "봄 들판", "봄비 내린 땅", "초여름 볕", "한여름 한낮", "늦여름 들판", "초가을 바위", "가을 서리", "늦가을 산", "초겨울 물가"];

// How the day's stem stands to its branch.
function advice(s: number, b: number): string {
  if (s === b) return "같은 기운이 겹친 날이에요. 밀어붙이는 힘이 세니, 미뤄 둔 일을 시작하기 좋아요.";
  if ((s + 1) % 5 === b) return "기운이 밖으로 흘러나가는 날이에요. 표현하고 베풀수록 돌아와요.";
  if ((b + 1) % 5 === s) return "받쳐 주는 기운이 드는 날이에요. 도움을 청하거나 배우기 좋아요.";
  if ((s + 2) % 5 === b) return "손에 쥐고 정리하는 날이에요. 돈 관리와 결정을 하기 좋아요.";
  return "누르는 기운이 있는 날이에요. 무리하지 말고 하던 대로 가면 탈이 없어요.";
}

// `personal` reads after "{name}님에게는". `rating` (0 조심 · 1 무난 · 2 좋음) and `lucky` come with the chart.
export type Today = {
  date: string;
  gz: string;
  image: string;
  advice: string;
  personal: string | null;
  rating: 0 | 1 | 2 | null;
  lucky: { color: string; direction: string; time: string } | null;
};

// What the needed element (용신) looks like in a day: its color, its direction, its hours (시진).
const LUCKY = [
  { color: "초록", direction: "동쪽", time: "새벽 3시~아침 7시" },
  { color: "빨강", direction: "남쪽", time: "오전 9시~오후 1시" },
  { color: "노랑·베이지", direction: "가운데(집 근처)", time: "오전 7~9시, 오후 1~3시" },
  { color: "흰색·은색", direction: "서쪽", time: "오후 3~7시" },
  { color: "검정·남색", direction: "북쪽", time: "밤 9시~새벽 1시" },
];

export function todayFor(me: Person | null, now = new Date()): Today {
  const kst = new Date(now.getTime() + 9 * 3600000);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth() + 1;
  const d = kst.getUTCDate();
  const ec = Solar.fromYmdHms(y, m, d, 12, 0, 0).getLunar().getEightChar();
  const stem = STEMS.indexOf(ec.getDayGan() as (typeof STEMS)[number]);
  const branch = BRANCHES.indexOf(ec.getDayZhi() as (typeof BRANCHES)[number]);
  const s = stemEl(stem);
  const b = BRANCH_EL[branch];
  const EL = (e: number) => `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`;

  let personal: string | null = null;
  let rating: Today["rating"] = null;
  const r = me ? readChart(me.pillars) : null;
  if (me && r) {
    const hit = [s, b].find((e) => e === r.yong);
    const bad = [s, b].find((e) => e === r.gi);
    personal =
      hit !== undefined
        ? `꼭 필요한 ${EL(hit)} 기운이 들어오는 날이에요. 중요한 일은 오늘 하세요.`
        : bad !== undefined
          ? `버거운 ${EL(bad)} 기운의 날이에요. 큰 결정은 하루 미루세요.`
          : "기운이 어느 한쪽으로 크게 치우치지 않는 날이에요.";
    const meet = meetings(branch, me.pillars.dayBranch);
    let score = hit !== undefined ? 2 : bad !== undefined ? 0 : 1;
    if (meet.includes("충")) {
      personal += " 가까운 사람과 부딪히기 쉬우니 말은 한 번 더 고르세요.";
      score -= 1;
    } else if (meet.includes("육합")) {
      personal += " 가까운 사람과 마음이 잘 통하는 날이에요.";
      score += 1;
    }
    rating = Math.max(0, Math.min(2, score)) as 0 | 1 | 2;
  }
  return {
    date: `${m}월 ${d}일 ${"일월화수목금토"[kst.getUTCDay()]}요일`,
    gz: `${STEMS[stem]}${BRANCHES[branch]}일`,
    image: `${BRANCH_SCENE[branch]}의 ${STEM_IMAGE[stem]}`,
    advice: advice(s, b),
    personal,
    rating,
    lucky: r ? LUCKY[r.yong] : null,
  };
}
