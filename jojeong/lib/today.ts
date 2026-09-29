import { Solar } from "lunar-javascript";
import { meetings, salsAt, stemClash, stemCombine } from "./deep";
import { ILJU_IMAGE, meet, rankMonth } from "./iljuRank";
import { ELEMENT_HANJA, ELEMENT_KO, BRANCH_EL, GROUP_OF, HIDDEN, elScore, readChart, stemEl, tenGod, type Reading, type TenGod } from "./myeongri";
import type { Person } from "./pairToken";
import { BRANCHES, BRANCHES_KO, hourStemOf, STEMS, STEMS_KO, type Pillars } from "./saju";

// 오늘의 운세 for the main page. Rule-based, no writer involved: the same pieces the paid reports stand on
// (용신·기신, 십신, 합·충, 신살), read for one day. Today's day pillar (Korean date) as an image and a line of
// advice for everyone; with the reader's chart, a score, their day pillar's place among the sixty, four
// areas in stars, the day's best hours, the week at a glance and a word from 정 훈도.

// How the day's stem stands to its branch.
function advice(s: number, b: number): string {
  if (s === b) return "같은 기운이 겹친 날이에요. 밀어붙이는 힘이 세니, 미뤄 둔 일을 시작하기 좋아요.";
  if ((s + 1) % 5 === b) return "기운이 밖으로 흘러나가는 날이에요. 표현하고 베풀수록 돌아와요.";
  if ((b + 1) % 5 === s) return "받쳐 주는 기운이 드는 날이에요. 도움을 청하거나 배우기 좋아요.";
  if ((s + 2) % 5 === b) return "손에 쥐고 정리하는 날이에요. 돈 관리와 결정을 하기 좋아요.";
  return "누르는 기운이 있는 날이에요. 무리하지 말고 하던 대로 가면 탈이 없어요.";
}

// What an element looks like in a day: its color and its direction.
const EL_COLOR = ["초록", "빨강", "노랑·베이지", "흰색·은색", "검정·남색"];
const EL_DIRECTION = ["동쪽", "남쪽", "가운데(집 근처)", "서쪽", "북쪽"];
// Waking 시진, 辰 to 戌.
const HOUR_LABEL: Record<number, string> = {
  4: "아침 7~9시",
  5: "오전 9~11시",
  6: "오전 11시~오후 1시",
  7: "오후 1~3시",
  8: "오후 3~5시",
  9: "오후 5~7시",
  10: "저녁 7~9시",
};

// 정 훈도's word for the day, from what the day's stem is to the reader's day master. Two each, taken in turn.
const HUNDO: Record<TenGod, [string, string]> = {
  정재: ["곳간을 살피시옵소서. 들어온 것을 지키는 날이옵니다.", "작은 돈도 셈을 바로 하시면 복이 되옵니다."],
  편재: ["장터에 바람이 부는 날이옵니다. 눈을 크게 뜨시옵소서.", "뜻밖의 기회가 문을 두드리옵니다. 흘려보내지 마시옵소서."],
  식신: ["손끝에 재주가 오른 날이옵니다. 무엇이든 지어 보시옵소서.", "맛난 것을 드시고 여유를 누리셔도 좋은 날이옵니다."],
  상관: ["혀끝을 조심하시옵소서. 옳은 말도 때를 가리는 법이옵니다.", "하고픈 말은 붓으로 먼저 적어 보시옵소서."],
  정관: ["의관을 바로 하시옵소서. 사람들 눈에 드는 날이옵니다.", "약속을 지키시면 윗전의 신임을 얻는 날이옵니다."],
  편관: ["짐이 무거운 날이옵니다. 한 번에 다 지려 마시옵소서.", "몸을 먼저 살피시옵소서. 무리는 탈이 되옵니다."],
  정인: ["어른의 말씀에 길이 있는 날이옵니다.", "도움을 청하시면 손이 닿는 날이옵니다. 혼자 애쓰지 마시옵소서."],
  편인: ["책을 펴기 좋은 날이옵니다. 생각이 깊어지옵니다.", "홀로 궁리하는 시간이 답을 주는 날이옵니다."],
  비견: ["벗과 어깨를 나란히 하면 일이 가벼워지옵니다.", "내 뜻을 세우기 좋은 날이옵니다. 줏대를 지키시옵소서."],
  겁재: ["주머니 끈을 여미시옵소서. 나가는 돈이 많은 날이옵니다.", "다투어 얻기보다 나누어 지키는 날이옵니다."],
};

type Area = {
  key: "money" | "work" | "love" | "health";
  label: string;
  stars: number;
  line: string;
  href: string | null;
  more: string | null;
};
const AREA_LINE: Record<Area["key"], string[]> = {
  // Index = stars − 1.
  money: ["지갑을 닫아 둘 날", "지출이 새기 쉬운 날", "쓰고 모으기 평소대로", "돈 셈이 잘 맞는 날", "들어오는 돈이 보이는 날"],
  work: ["무리하지 말고 버틸 날", "말실수와 마찰을 조심", "하던 일을 이어 가면 되는 날", "일이 순서대로 풀리는 날", "인정받는 날, 나서 보세요"],
  love: ["말 한마디를 고를 날", "서운함이 생기기 쉬운 날", "잔잔하게 흘러가는 날", "만남에 좋은 기운", "마음이 통하는 날, 먼저 연락해 보세요"],
  health: ["쉬어 가야 할 날", "피로가 쌓이기 쉬운 날", "평소처럼 챙기면 되는 날", "컨디션이 무난한 날", "몸이 가벼운 날"],
};

export type Ilju = { hanja: string; name: string };
export type Today = {
  date: string;
  gz: string;
  image: string;
  advice: string;
  // The sixty day pillars on this day, best first: the top three for everyone.
  top: Ilju[];
  personal: string | null;
  rating: 0 | 1 | 2 | null;
  score: number | null; // 0–100
  rank: number | null; // the reader's day pillar among the sixty today (the card shows it in the top 20 only)
  best: { label: string; stars: number } | null; // the day's strongest area: something good on every day
  ilju: string | null; // 갑자일주
  areas: Area[] | null;
  hour: { label: string; why: string } | null;
  lucky: { color: string; direction: string } | null;
  week: { day: string; date: number; mark: "◎" | "○" | "△"; today: boolean }[] | null;
  // A hard day (△): what to avoid, what to do instead, what still goes well, and the next good day.
  watch: { avoid: string; prep: string; bright: string; next: string | null } | null;
  hundo: string | null;
};

const EL = (e: number) => `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// The day pillar of a Korean calendar day.
function dayPillar(y: number, m: number, d: number) {
  const ec = Solar.fromYmdHms(y, m, d, 12, 0, 0).getLunar().getEightChar();
  return {
    stem: STEMS.indexOf(ec.getDayGan() as (typeof STEMS)[number]),
    branch: BRANCHES.indexOf(ec.getDayZhi() as (typeof BRANCHES)[number]),
  };
}

// The day for this chart, 0–100: how the day pillar meets the reader's day pillar (the ranking's score), and
// whether the day brings the element the chart needs (용신) or the one it can't take (기신).
// The marks (◎○△, 좋음·무난·대비) come from this raw score; what the reader sees is `shown`.
function dayScore(p: Pillars, r: Reading, stem: number, branch: number) {
  const base = meet(p.dayStem, p.dayBranch, stem, branch).score;
  const el = elScore(r, stemEl(stem)) + elScore(r, BRANCH_EL[branch]);
  return clamp(Math.round(55 + (base + el * 0.8) * 4.5), 12, 98);
}
// Shown on screen: the order is kept, the lower half pressed together, so the hardest day reads about 35, not
// 12 (a number in the teens reads as a ruined chart, not a day to be careful).
const shown = (raw: number) => (raw >= 55 ? raw : Math.round(55 - (55 - raw) * 0.5));
const markOf = (raw: number) => (raw >= 70 ? "◎" : raw >= 50 ? "○" : "△") as "◎" | "○" | "△";

// For a hard day: the one thing to steer clear of and what to do instead, from its sharpest cause (the same
// causes as the monthly ranking, worded for a day).
const DAY_WATCH: Record<string, [avoid: string, prep: string]> = {
  충: ["이사·퇴사 같은 큰 결정을 서두르기", "일정은 여유 있게, 중요한 일은 두 번 확인하기"],
  천간충: ["고집으로 밀어붙이기", "한발 물러서서 상대 말을 먼저 듣기"],
  형: ["감정 섞인 말과 서류 실수", "계약서와 약속은 꼼꼼히 확인하기"],
  편관: ["무리한 야근과 과로", "몸을 먼저 챙기고 일을 나누기"],
  겁재: ["돈 빌려주기와 충동구매", "오늘 쓸 돈의 한도를 미리 정해 두기"],
  상관: ["윗사람과의 말다툼", "하고 싶은 말은 글로 한 번 정리하기"],
  편인: ["혼자 끙끙 끌어안기", "주변에 먼저 도움 청하기"],
  기신: ["큰 결정과 큰 지출", "하던 일을 마무리하는 데 하루를 쓰기"],
};
const HUNDO_HARD: [string, string] = ["피할 것만 피하시면 무탈한 날이옵니다.", "오늘은 한 걸음 쉬어 가시옵소서. 좋은 날은 곧 오옵니다."];

// Four areas in one to five stars, from the ten gods the day brings and how its branch meets the chart.
function areasOf(me: Person, r: Reading, stem: number, branch: number): Area[] {
  const p = me.pillars;
  const god = tenGod(p.dayStem, stem);
  const bgod = tenGod(p.dayStem, HIDDEN[branch].at(-1)![0]);
  const g = [GROUP_OF[god], GROUP_OF[bgod]];
  const has = (grp: string) => (g[0] === grp ? 1 : 0) + (g[1] === grp ? 0.6 : 0);
  const m = meetings(branch, p.dayBranch);
  const sals = salsAt(p, branch);
  const clash = m.includes("충") || stemClash(p.dayStem, stem);
  const bond = m.includes("육합") || m.includes("삼합") || stemCombine(p.dayStem, stem);
  const welcome = elScore(r, stemEl(stem)) + elScore(r, BRANCH_EL[branch]);

  let money = 3 + has("재성") * 1.5 + has("식상") * 0.6;
  if (god === "겁재") money -= 1.2;
  else if (bgod === "겁재") money -= 0.6;
  let work = 3 + has("관성") * 1.2 + has("인성") * 0.8;
  if (god === "상관") work -= 1.2;
  if (god === "편관" || bgod === "편관") work -= 0.4;
  if (sals.includes("천을귀인")) work += 0.8;
  // The partner's star: 재성 for a man, 관성 for a woman.
  let love = 3 + (bond ? 1.5 : 0) + (sals.includes("도화") ? 1 : 0);
  if (me.gender === "m") love += has("재성") * 0.6;
  if (me.gender === "f") love += has("관성") * 0.6;
  if (clash) love -= 1.2;
  if (m.includes("원진")) love -= 0.6;
  let health = 3.5 + (welcome > 0 ? 0.6 : welcome < 0 ? -0.6 : 0) + (bond ? 0.5 : 0);
  if (m.includes("충")) health -= 1.5;
  if (m.includes("형")) health -= 1;
  if (god === "편관") health -= 0.5;

  const star = (v: number) => clamp(Math.round(v), 1, 5);
  const area = (key: Area["key"], label: string, v: number, href: string | null, more: string | null): Area => {
    const stars = star(v);
    return { key, label, stars, line: AREA_LINE[key][stars - 1], href, more };
  };
  return [
    area("money", "재물", money, "/reports/jaemul", "재물운"),
    area("work", "일", work, "/reports/jikup", "직업·적성"),
    area("love", "연애", love, "/reports/yeonae", "연애·결혼"),
    area("health", "건강", health, null, null),
  ];
}

// The best waking 시진 of the day for this chart: its stem and branch as welcome elements, and how its branch
// meets the day branch.
function bestHour(p: Pillars, r: Reading, dayStem: number) {
  let best = { hb: 4, v: -99, el: r.yong };
  for (let hb = 4; hb <= 10; hb++) {
    const hs = hourStemOf(dayStem, hb);
    const m = meetings(hb, p.dayBranch);
    const v = elScore(r, stemEl(hs)) + elScore(r, BRANCH_EL[hb]) * 1.5 + (m.includes("육합") ? 1 : 0) - (m.includes("충") ? 2 : 0);
    if (v > best.v)
      best = {
        hb,
        v,
        el: elScore(r, BRANCH_EL[hb]) >= elScore(r, stemEl(hs)) ? BRANCH_EL[hb] : stemEl(hs),
      };
  }
  const el = elScore(r, best.el) > 0 ? best.el : r.yong;
  return {
    label: `${HOUR_LABEL[best.hb]}(${BRANCHES[best.hb]}時)`,
    why: elScore(r, best.el) > 0 ? `필요한 ${EL(best.el)} 기운이 도는 시간` : "부딪히는 기운이 가장 적은 시간",
    el,
  };
}

export function todayFor(me: Person | null, now = new Date()): Today {
  const kst = new Date(now.getTime() + 9 * 3600000);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth() + 1;
  const d = kst.getUTCDate();
  const { stem, branch } = dayPillar(y, m, d);
  const s = stemEl(stem);
  const b = BRANCH_EL[branch];
  const ranks = rankMonth(stem, branch);

  const out: Today = {
    date: `${m}월 ${d}일 ${"일월화수목금토"[kst.getUTCDay()]}요일`,
    gz: `${STEMS[stem]}${BRANCHES[branch]}일`,
    image: ILJU_IMAGE[`${STEMS[stem]}${BRANCHES[branch]}`],
    advice: advice(s, b),
    top: ranks.slice(0, 3).map((x) => ({ hanja: x.hanja, name: x.name })),
    personal: null,
    rating: null,
    score: null,
    rank: null,
    best: null,
    ilju: null,
    areas: null,
    hour: null,
    lucky: null,
    week: null,
    watch: null,
    hundo: null,
  };
  const r = me ? readChart(me.pillars) : null;
  if (!me || !r) return out;

  const p = me.pillars;
  const score = dayScore(p, r, stem, branch);
  const hard = score < 50;
  const hit = [s, b].find((e) => e === r.yong);
  const bad = [s, b].find((e) => e === r.gi);
  let personal =
    hit !== undefined
      ? `꼭 필요한 ${EL(hit)} 기운이 들어오는 날이에요. 중요한 일은 오늘 하세요.`
      : bad !== undefined
        ? `버거운 ${EL(bad)} 기운의 날이에요. 큰 결정은 하루 미루세요.`
        : score >= 70
          ? "오늘의 일진이 내 일주와 잘 맞물리는 날이에요."
          : hard
            ? "오늘의 일진이 내 일주와 삐걱대는 날이에요. 아래 한 가지만 피하면 돼요."
            : "기운이 어느 한쪽으로 크게 치우치지 않는 날이에요.";
  const mt = meetings(branch, p.dayBranch);
  if (mt.includes("충")) personal += " 가까운 사람과 부딪히기 쉬우니 말은 한 번 더 고르세요.";
  else if (mt.includes("육합")) personal += " 가까운 사람과 마음이 잘 통하는 날이에요.";

  const hour = bestHour(p, r, stem);
  // This week, Monday to Sunday.
  const dow = (kst.getUTCDay() + 6) % 7;
  const at = (i: number) => {
    const t = new Date(Date.UTC(y, m - 1, d + i));
    const dp = dayPillar(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
    return { t, mark: markOf(dayScore(p, r, dp.stem, dp.branch)) };
  };
  const week = Array.from({ length: 7 }, (_, i) => {
    const { t, mark } = at(i - dow);
    return { day: "월화수목금토일"[i], date: t.getUTCDate(), mark, today: i === dow };
  });

  const areas = areasOf(me, r, stem, branch);
  const best = areas.reduce((a, x) => (x.stars > a.stars ? x : a));
  let watch: Today["watch"] = null;
  if (hard) {
    const mm = meet(p.dayStem, p.dayBranch, stem, branch);
    const god = tenGod(p.dayStem, stem);
    const bgod = tenGod(p.dayStem, HIDDEN[branch].at(-1)![0]);
    const cause =
      ["충", "천간충", "형"].find((t) => mm.tags.includes(t)) ?? (DAY_WATCH[god] ? god : DAY_WATCH[bgod] ? bgod : bad !== undefined ? "기신" : null);
    const [avoid, prep] = cause ? DAY_WATCH[cause] : ["무리한 욕심", "평소 페이스를 지키기"];
    // The next ◎ day within ten days.
    let next: string | null = null;
    for (let i = 1; i <= 10 && !next; i++) {
      const { t, mark } = at(i);
      if (mark === "◎") next = `${i === 1 ? "내일" : `${"일월화수목금토"[t.getUTCDay()]}요일`}(${t.getUTCMonth() + 1}/${t.getUTCDate()})`;
    }
    watch = { avoid, prep, bright: mm.bright, next };
  }

  return {
    ...out,
    personal,
    rating: score >= 70 ? 2 : score >= 50 ? 1 : 0,
    score: shown(score),
    rank: ranks.find((x) => x.stem === p.dayStem && x.branch === p.dayBranch)!.rank,
    ilju: `${STEMS_KO[p.dayStem]}${BRANCHES_KO[p.dayBranch]}일주`,
    best: best.stars >= 3 ? { label: best.label, stars: best.stars } : null,
    areas,
    hour: { label: hour.label, why: hour.why },
    lucky: { color: EL_COLOR[hour.el], direction: EL_DIRECTION[r.yong] },
    week,
    watch,
    hundo: hard ? HUNDO_HARD[d % 2] : HUNDO[tenGod(p.dayStem, stem)][d % 2],
  };
}
