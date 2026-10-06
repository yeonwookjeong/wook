import { meetings, salsAt, stageOf, stemClash, stemCombine } from "./deep";
import { HIDDEN, tenGod, type TenGod } from "./myeongri";
import { BRANCHES, BRANCHES_KO, STEMS, STEMS_KO, type Pillars } from "./saju";
import { Solar } from "lunar-javascript";
import { monthsOf } from "./yeonun";

// The sixty day pillars ranked for a month: how the month's own pillar (the 절기 month, 寒露 to 立冬 for
// October) meets each pillar. Only the two characters of the day pillar are read, so this is the "일주로 본
// 간이 운세" the cards and /ranking show, not a personal reading.

// One line for each pillar, made from the day stem's image and the day branch's season (60일주 도감).
export const ILJU_IMAGE: Record<string, string> = {
  甲子: "한겨울 깊은 물가에 선 큰 나무", 乙丑: "언 땅을 뚫고 나온 꽃", 丙寅: "이른 봄 숲을 깨우는 아침 해", 丁卯: "봄 풀밭을 비추는 등불",
  戊辰: "봄비를 머금은 큰 산", 己巳: "초여름 볕에 데워진 논밭", 庚午: "한여름 불볕에 달궈지는 무쇠", 辛未: "메마른 흙 속에 묻힌 보석",
  壬申: "바위 사이에서 솟아 흐르는 큰 강", 癸酉: "가을 바위틈에서 솟는 맑은 샘", 甲戌: "늦가을 마른 산에 선 큰 나무", 乙亥: "초겨울 물가에 핀 꽃",
  丙子: "한겨울 호수를 비추는 해", 丁丑: "눈 덮인 밤을 밝히는 등불", 戊寅: "봄 숲이 우거진 큰 산", 己卯: "봄풀이 돋는 들판",
  庚辰: "봄 흙 속에 단단히 박힌 바위", 辛巳: "초여름 불씨로 다듬는 보석", 壬午: "한여름 햇살에 반짝이는 큰 강", 癸未: "메마른 여름 땅에 내리는 단비",
  甲申: "초가을 바위산에 선 큰 나무", 乙酉: "가을 서리를 견디는 꽃", 丙戌: "늦가을 산 너머로 지는 해", 丁亥: "초겨울 물가의 등불",
  戊子: "한겨울 깊은 물을 품은 산", 己丑: "겨울잠 든 논밭", 庚寅: "봄 숲을 가르는 도끼", 辛卯: "봄 풀밭에 떨어진 보석",
  壬辰: "봄비를 모아 흐르는 큰 강", 癸巳: "초여름 햇볕에 반짝이는 이슬", 甲午: "한여름 햇살 아래 무성한 큰 나무", 乙未: "여름 들판에 뻗은 덩굴",
  丙申: "초가을 바위를 비추는 해", 丁酉: "가을밤 보석을 비추는 등불", 戊戌: "늦가을 겹겹이 쌓인 큰 산", 己亥: "초겨울 물이 스민 논밭",
  庚子: "한겨울 찬물에 담긴 무쇠", 辛丑: "언 땅 속에 숨은 보석", 壬寅: "봄 숲을 적시며 흐르는 큰 강", 癸卯: "봄 풀잎에 맺힌 이슬",
  甲辰: "봄비 머금은 땅에 뿌리내린 큰 나무", 乙巳: "초여름 볕에 활짝 핀 꽃", 丙午: "한여름 한낮의 태양", 丁未: "여름밤 들판의 모닥불",
  戊申: "초가을 바위가 드러난 큰 산", 己酉: "가을걷이를 앞둔 논밭", 庚戌: "늦가을 마른 산의 바위", 辛亥: "초겨울 맑은 물에 씻긴 보석",
  壬子: "한겨울 끝없이 깊은 큰 물", 癸丑: "언 땅을 적시는 겨울비", 甲寅: "이른 봄 숲의 가장 큰 나무", 乙卯: "봄 들판에 흐드러진 꽃",
  丙辰: "봄비 갠 뒤 떠오른 해", 丁巳: "초여름 밤을 밝히는 등불", 戊午: "한여름 불볕 아래 우뚝 선 산", 己未: "늦여름 메마른 들판",
  庚申: "초가을 서늘한 바위", 辛酉: "가을 서리 맞은 보석", 壬戌: "늦가을 산을 감돌아 흐르는 큰 강", 癸亥: "초겨울 큰 물 위에 내리는 비",
};

// The sixty in order (1 = 갑자 … 60 = 계해).
export const SIXTY = Array.from({ length: 60 }, (_, i) => ({ no: i + 1, stem: i % 10, branch: i % 12 }));

// The 길신 lift a month, the 흉신 ask for care (자평 tradition); the month's stem counts in full, its branch's
// main hidden stem at 0.6.
const GOD_WEIGHT: Record<TenGod, number> = { 정인: 2, 정재: 2, 식신: 2, 정관: 1.5, 편재: 1, 비견: 0, 편인: -0.5, 겁재: -1, 상관: -1, 편관: -1.5 };
const GOD_LINE: Record<TenGod, string> = {
  정재: "돈이 차곡차곡 쌓이는 달이에요",
  편재: "뜻밖의 돈과 기회가 들어오는 달이에요",
  식신: "재주가 빛나고 먹을 복이 따르는 달이에요",
  상관: "말이 앞서기 쉬운 달이에요. 표현은 부드럽게 하세요",
  정관: "인정받고 자리가 잡히는 달이에요",
  편관: "어깨가 무거워지는 달이에요. 무리하지 마세요",
  정인: "배우고 도움받기 좋은 달이에요",
  편인: "혼자 파고드는 공부와 기획이 잘 되는 달이에요",
  비견: "동료와 나란히 걷는 달이에요",
  겁재: "지출과 경쟁을 조심할 달이에요",
};

const GOD_SHORT: Record<TenGod, string> = {
  정재: "돈이 차곡차곡 쌓이고",
  편재: "뜻밖의 기회가 들어오고",
  식신: "재주가 빛나고",
  상관: "말이 앞서기 쉽고",
  정관: "인정받기 좋고",
  편관: "어깨가 무거워지고",
  정인: "배움과 도움이 따르고",
  편인: "혼자 파고드는 일이 잘 되고",
  비견: "동료와 나란히 걷고",
  겁재: "지출과 경쟁이 늘고",
};

export type IljuMonth = {
  no: number;
  stem: number;
  branch: number;
  hanja: string;
  name: string; // 갑자일주
  image: string;
  score: number;
  rank: number;
  line: string; // the month in a sentence
  short: string; // the month in a few words, for the full list
  tips: string[]; // what to make of a good month
  avoid: string; // for a hard month: what to steer clear of,
  prep: string; // what to do instead,
  bright: string; // and what still goes well
  tags: string[];
  // A week's ranking only: the pillar's hardest day in a few words, for the five at the foot.
  hard?: string;
  // and the day(s) the reel's table marks next to it ("수", "화·목"), a 고비 (hard) or the week's good day (good).
  mark?: string;
  kind?: "hard" | "good";
};

export type MonthPillar = { stem: number; branch: number; from: string; to: string; label: string; term: string; nextTerm: string };

// The 절기 that opens each month branch (子 대설 … 亥 입동).
const TERM = ["대설", "소한", "입춘", "경칩", "청명", "입하", "망종", "소서", "입추", "백로", "한로", "입동"];

// The day a month pillar begins: the 절기 day itself, even when the 절기 falls late in the day (monthsOf samples
// noon, so it can land a day later).
function startDay(y: number, from: string, stem: number, branch: number): Date {
  const [m, d] = from.split("/").map(Number);
  const noon = Date.UTC(y, m - 1, d);
  for (let t = noon - 2 * 86400000; t <= noon; t += 86400000) {
    const x = new Date(t);
    const ec = Solar.fromYmdHms(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate(), 23, 59, 0).getLunar().getEightChar();
    if (ec.getMonthGan() === STEMS[stem] && ec.getMonthZhi() === BRANCHES[branch]) return x;
  }
  return new Date(noon);
}

// The 절기 month that begins in a calendar month (its first day, 小寒 … 大雪), and when it ends.
export function monthPillarOf(y: number, m: number): MonthPillar | null {
  // monthsOf(y) runs from 寅월 (early Feb of y) to 丑월 (early Jan of y+1), so January's is last year's twelfth.
  const list = m === 1 ? monthsOf(y - 1) : monthsOf(y);
  const i = m === 1 ? list.length - 1 : list.findIndex((x, k) => k < 11 && Number(x.from.split("/")[0]) === m);
  if (i < 0) return null;
  const cur = list[i];
  const next = m === 1 ? monthsOf(y)[0] : list[i + 1];
  const start = startDay(y, cur.from, cur.stem, cur.branch);
  const nextStart = startDay(Number(next.from.split("/")[0]) < m ? y + 1 : y, next.from, next.stem, next.branch);
  const end = new Date(nextStart.getTime() - 86400000);
  const md = (d: Date) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  return { stem: cur.stem, branch: cur.branch, from: md(start), to: md(end), label: `${STEMS_KO[cur.stem]}${BRANCHES_KO[cur.branch]}월`, term: TERM[cur.branch], nextTerm: TERM[(cur.branch + 1) % 12] };
}

// How a month (or any pillar) meets one day pillar.
const GOD_KEY: Record<TenGod, string> = {
  정재: "돈이 모이고", 편재: "기회가 들고", 식신: "재주가 빛나고", 상관: "말이 앞서고", 정관: "인정받고",
  편관: "부담이 크고", 정인: "도움이 따르고", 편인: "공부가 잘 되고", 비견: "동료와 함께하고", 겁재: "지출이 늘고",
};
const GOD_ALONE: Record<TenGod, string> = {
  정재: "돈이 모이는 달", 편재: "기회가 드는 달", 식신: "재주가 빛나는 달", 상관: "말을 아낄 달", 정관: "인정받는 달",
  편관: "무리하지 말 달", 정인: "도움받는 달", 편인: "공부가 잘 되는 달", 비견: "동료와 함께할 달", 겁재: "지출을 조심할 달",
};
const GOD_DO: Record<TenGod, string> = {
  정재: "저축과 계약에 좋아요",
  편재: "새 거래나 부업 기회를 살펴보세요",
  식신: "미뤄 둔 취미나 창작을 시작해 보세요",
  상관: "아이디어를 글이나 작품으로 풀어 보세요",
  정관: "면접·승진처럼 공식적인 자리에 나서 보세요",
  편관: "맡은 책임을 차근차근 해내면 인정받아요",
  정인: "공부·자격증, 선배의 조언을 구해 보세요",
  편인: "기획이나 공부를 혼자 깊게 파 보세요",
  비견: "동료와 함께하는 일을 벌여 보세요",
  겁재: "경쟁하는 자리라면 실력을 보여 줄 기회예요",
};
// For a hard month: the one thing to steer clear of and what to do instead, from its sharpest cause.
const WATCH: Record<string, [avoid: string, prep: string]> = {
  충: ["이사·퇴사 같은 큰 결정을 서두르기", "일정은 여유 있게, 중요한 일은 두 번 확인하기"],
  천간충: ["고집으로 밀어붙이기", "한발 물러서서 상대 말을 먼저 듣기"],
  형: ["감정 섞인 말과 서류 실수", "계약서와 약속은 꼼꼼히 확인하기"],
  편관: ["무리한 야근과 과로", "몸을 먼저 챙기고 일을 나누기"],
  겁재: ["돈 빌려주기와 충동구매", "이달 지출 한도를 미리 정해 두기"],
  상관: ["윗사람과의 말다툼", "하고 싶은 말은 글로 한 번 정리하기"],
  편인: ["혼자 끙끙 끌어안기", "주변에 먼저 도움 청하기"],
};

// When the sharpest cause is a clash (충·형), every pillar sharing that branch would get the same line; what to
// do instead then follows the month's ten god, so the advice fits the pillar and not only the branch.
const PREP: Record<TenGod, string> = {
  비견: "혼자 떠안지 말고 동료와 일을 나누기",
  겁재: "지출 한도를 미리 정해 두기",
  식신: "벌인 일을 줄이고 하던 것 하나에 집중하기",
  상관: "하고 싶은 말은 글로 한 번 정리하기",
  편재: "새 투자·거래는 한 박자 늦추기",
  정재: "계약서와 금액은 두 번 확인하기",
  편관: "맡은 일을 줄이고, 일정에 빈칸을 남겨 두기",
  정관: "규칙과 마감부터 챙기기",
  편인: "혼자 끙끙대지 말고 먼저 도움 청하기",
  정인: "조언은 듣되 결정은 천천히 하기",
};
// What still goes well in a hard month or day, from the same ten god (words that sit with the advice above).
export const BRIGHT: Record<TenGod, string> = {
  비견: "함께하는 동료가 힘이 돼요",
  겁재: "경쟁하는 자리에서는 실력을 보여 줄 수 있어요",
  식신: "취미나 창작으로 숨을 돌리기 좋아요",
  상관: "아이디어는 반짝여요",
  편재: "눈여겨볼 기회는 들어와요",
  정재: "들어온 돈을 차곡차곡 챙기기 좋아요",
  편관: "버텨 낸 만큼 실력이 늘어요",
  정관: "성실함은 눈에 띄어요",
  편인: "혼자 공부하고 파고들기엔 좋아요",
  정인: "도와주는 사람이 곁에 있어요",
};

export function meet(stem: number, branch: number, ms: number, mb: number) {
  const p = { dayStem: stem, dayBranch: branch, yearBranch: branch } as Pillars;
  const god = tenGod(stem, ms);
  const branchGod = tenGod(stem, HIDDEN[mb].at(-1)![0]);
  let score = GOD_WEIGHT[god] + GOD_WEIGHT[branchGod] * 0.6;
  const tags: string[] = [];
  // The meeting that most shapes the month becomes the second half of the line.
  let tail: string | null = null;
  let key: string | null = null;
  const tips: string[] = [];
  const m = meetings(branch, mb);
  const sals = salsAt(p, mb);
  if (m.includes("충")) {
    score -= 2.5;
    tags.push("충");
    tail = "흔들림이 있는 달이에요. 큰 결정은 한 박자 쉬고 하세요";
    key = "흔들림에 대비할 달";
  }
  if (m.includes("육합") || m.includes("삼합")) {
    score += m.includes("육합") ? 2 : 1.5;
    tags.push("합");
    tail ??= "사람과 손발이 맞는 달이에요";
    key ??= "손발이 맞는 달";
    tips.push("협업·모임·소개 자리에 나가 보세요");
  } else if (m.includes("방합")) score += 0.5;
  if (m.includes("형")) {
    score -= 1;
    tags.push("형");
    tail ??= "사소한 마찰을 조심할 달이에요";
    key ??= "마찰을 조심할 달";
  }
  if (m.includes("원진")) score -= 0.7;
  if (m.includes("해") || m.includes("파")) score -= 0.5;
  if (stemCombine(stem, ms)) {
    score += 1.5;
    tags.push("천간합");
    tail ??= "반가운 제안과 인연이 닿는 달이에요";
    key ??= "반가운 제안이 오는 달";
    tips.push("들어온 제안은 한번 받아 보세요");
  }
  if (stemClash(stem, ms)) {
    score -= 1.5;
    tags.push("천간충");
  }
  if (sals.includes("천을귀인")) {
    score += 1.5;
    tags.push("귀인");
    if (!m.includes("충")) {
      tail = "귀인이 돕는 달이에요";
      key = "귀인이 돕는 달";
    }
    tips.push("막힌 일은 도움을 청하면 풀려요");
  }
  if (sals.includes("문창귀인")) score += 0.5;
  const stage = stageOf(stem, mb);
  if (stage === "건록" || stage === "제왕") score += 0.7;
  else if (stage === "장생" || stage === "관대") score += 0.5;
  else if (stage === "사" || stage === "묘" || stage === "절") score -= 0.5;
  const extra = sals.includes("도화") ? " 인연운도 들어와요." : sals.includes("역마") ? " 이동과 출장이 잦아요." : "";
  const line = (tail ? `${GOD_SHORT[god]}, ${tail}.` : `${GOD_LINE[god]}.`) + extra;
  const short = key ? `${GOD_KEY[god]}, ${key}` : GOD_ALONE[god];
  const cause = ["충", "천간충", "형"].find((t) => tags.includes(t)) ?? (WATCH[god] ? god : WATCH[branchGod] ? branchGod : null);
  const [avoid, byCause] = cause ? WATCH[cause] : ["무리한 욕심", "평소 페이스를 지키기"];
  const prep = cause && ["충", "천간충", "형"].includes(cause) ? PREP[god] : byCause;
  return { score: Math.round(score * 10) / 10, line, short, tips: [GOD_DO[god], ...tips].slice(0, 3), avoid, prep, bright: BRIGHT[god], tags };
}

// This calendar month in Korea, for the monthly ranking.
export function kstMonthNow(t = Date.now()) {
  const d = new Date(t + 9 * 3600000);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
}

// The 절기 month in effect on a day: this calendar month's once its 절기 has come, last month's before.
export function monthPillarNow(t = Date.now()): MonthPillar & { y: number } {
  const { y, m } = kstMonthNow(t);
  const d = new Date(t + 9 * 3600000).getUTCDate();
  const cur = monthPillarOf(y, m)!;
  if (d >= Number(cur.from.split("/")[1])) return { ...cur, y };
  const py = m === 1 ? y - 1 : y;
  return { ...monthPillarOf(py, m === 1 ? 12 : m - 1)!, y: py };
}

// All sixty for one month pillar, best first.
export function rankMonth(ms: number, mb: number): IljuMonth[] {
  const rows = SIXTY.map(({ no, stem, branch }) => {
    const hanja = `${STEMS[stem]}${BRANCHES[branch]}`;
    const m = meet(stem, branch, ms, mb);
    return { no, stem, branch, hanja, name: `${STEMS_KO[stem]}${BRANCHES_KO[branch]}일주`, image: ILJU_IMAGE[hanja], rank: 0, ...m };
  });
  rows.sort((a, b) => b.score - a.score || a.no - b.no);
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

// The sixty for a run of days (a short work week): each day's pillar meets every pillar the way a month does,
// the scores add up, and the words come from the pillar's best day (its hardest day for the five at the foot).
// The month's sentences say "달"; here they say "날".
export type DayIn = { stem: number; branch: number; label: string; short: string; md: string }; // "수요일", "수", "10/7"
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
// "2026-10-07" → that day's pillar (at noon, KST calendar date) and its weekday.
export function daysOf(dates: string[]): DayIn[] {
  return dates.map((iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    const ec = Solar.fromYmdHms(y, m, d, 12, 0, 0).getLunar().getEightChar();
    const wd = WEEKDAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
    return {
      stem: STEMS.indexOf(ec.getDayGan() as (typeof STEMS)[number]),
      branch: BRANCHES.indexOf(ec.getDayZhi() as (typeof BRANCHES)[number]),
      label: `${wd}요일`,
      short: wd,
      md: `${m}/${d}`,
    };
  });
}
const asDay = (t: string) => t.replace(/이달/g, "그날").replace(/ 달(?=이|$|[,. ])/g, " 날");

// For each pillar the work day it meets hardest (its 고비), and one thing to avoid that day.
// What to avoid comes from that day's ten god for the pillar and how the day's branch meets its own; the lists
// run from most to least fitting, and no two pillars of one week get the same line.
type GodGroup = "재" | "관" | "비겁" | "식상" | "인성";
const GROUP: Record<TenGod, GodGroup> = { 정재: "재", 편재: "재", 정관: "관", 편관: "관", 비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상", 정인: "인성", 편인: "인성" };
const AVOID_GOD: Record<TenGod, string[]> = {
  편재: ['"이건 기회야" 하며 지르는 결제 참기', "솔깃한 투자 얘기에 바로 답하지 않기", "기분 내서 한턱 크게 쏘지 않기", "할인한다고 안 살 것까지 담지 않기", "지갑 열기 전에 하루만 미루기", "남의 대박 얘기에 흔들리지 않기"],
  정재: ["계약서·견적서 금액 두 번 보기", "자잘한 구독료·배달비 새는 것 막기", "돈 얘기는 말 말고 글로 남기기", "카드값·이체 날짜 놓치지 않기", "영수증·정산 미루지 않기", "작은 돈 계산 흐리게 넘기지 않기"],
  편관: ["남의 일까지 \"제가 할게요\" 하지 않기", "무리한 야근 떠맡지 않기", "마감 직전까지 미루지 않기", "윗사람 앞에서 억지로 버티지 않기", "퇴근 시간 넘겨 붙잡히지 않기", "책임질 말 함부로 하지 않기", "급한 일부터 받지 말고 순서 정하기", "몸이 보내는 신호 무시하지 않기", "남 눈치에 내 일 밀리지 않기"],
  정관: ["지각·회의 시간 놓치지 않기", "결재 서류 대충 올리지 않기", "규칙 건너뛰는 지름길 타지 않기", "평가 자리에서 남 탓하지 않기", "보고는 미루지 말고 먼저 하기", "약속한 기한 넘기지 않기"],
  상관: ["회의에서 한마디 덧붙이지 않기", "윗사람 말에 말대꾸하지 않기", "메신저에 뒷말 남기지 않기", "할 말은 글로 한 번 정리하고 하기", "농담이 선 넘지 않게 하기", "남의 실수 공개적으로 짚지 않기"],
  식신: ["일 벌이지 말고 하던 것 하나 끝내기", "점심·야식 과식하지 않기", "퇴근 후 약속 두 개 잡지 않기", "\"이따 하지\" 하고 미루지 않기", "늦게까지 놀다 다음 날 버리지 않기"],
  겁재: ["동료에게 돈 빌려주지 않기", "더치페이 미루다 손해 보지 않기", "경쟁자에게 내 계획 먼저 말하지 않기", "남 따라 충동구매하지 않기", "남의 성과에 배 아파하지 않기", "N빵 계산 흐리게 넘기지 않기", "보증·대신 결제 해 주지 않기"],
  비견: ["동료와 공(功) 다투지 않기", "혼자 다 하려 들지 않기", "친구 부탁 덜컥 들어주지 않기", "고집 꺾고 한 번 양보하기", "내 방식만 맞다고 우기지 않기"],
  편인: ["혼자 끙끙 앓지 않기", "읽씹에 괜한 의심 키우지 않기", "새벽까지 검색하다 늦잠 자지 않기", "딴생각에 빠져 일 미루지 않기", "확인 안 된 소문 믿지 않기", "혼자 결론 내리고 서운해하지 않기"],
  정인: ["남에게 결정 미루지 않기", "부탁받은 일 깜빡하지 않기", "편하다고 할 일 미루지 않기", "조언만 듣고 그대로 두지 않기", "도와준 사람에게 고맙다는 말 미루지 않기", "남의 말만 믿고 확인 건너뛰지 않기"],
};
// A clash (충) is the sharpest thing that day: its own lines come first, by what kind of force clashes.
const AVOID_CLASH: Record<GodGroup, string[]> = {
  재: ["기분 따라 장바구니 결제 멈추기", "카드 한도까지 긁지 않기", "돈 문제로 언성 높이지 않기"],
  관: ["상사 지적에 바로 받아치지 않기", "윗사람과 정면으로 부딪히지 않기", "홧김에 퇴사 얘기 꺼내지 않기"],
  비겁: ["친구와 돈 문제로 다투지 않기", "동료와 자존심 싸움하지 않기", "단톡방에서 편 가르지 않기"],
  식상: ["단톡방에 감정 섞인 말 올리지 않기", "연인과 사소한 걸로 다투지 않기", "SNS에 하소연 올리지 않기"],
  인성: ["가족과 아침부터 다투지 않기", "참다가 한꺼번에 터뜨리지 않기", "괜한 서운함 쌓아 두지 않기"],
};
// 寅申·巳亥 are the moving branches (역마): when they clash, the road comes first.
const AVOID_MOVE = ["출퇴근길 서두르지 않기", "운전할 때 휴대폰 보지 않기", "약속 장소·시간 두 번 확인하기"];
const AVOID_REL: Record<string, string[]> = {
  형: ["메일·문서 오타 두 번 확인하기", "감정 섞인 말은 삼키기"],
  원진: ["속으로 꿍한 채 퇴근하지 않기", "괜히 예민해진 말투 조심하기"],
  파: ["잡힌 약속 갑자기 바꾸지 않기"],
  해: ["남의 일에 끼어들지 않기"],
};

const AVOID_ALL = [...new Set([...Object.values(AVOID_GOD).flat(), ...Object.values(AVOID_CLASH).flat(), ...AVOID_MOVE, ...Object.values(AVOID_REL).flat()])];

// What to make of a good work day, by that day's ten god for the pillar; a 합, 귀인 or 천간합 that day comes first.
const TAKE_GOD: Record<TenGod, string[]> = {
  정재: ["밀린 정산·적금 시작하기", "계약·결제 미루지 않기", "가계부 한 번 정리하기", "자동이체·구독 한 번 정리하기", "받을 돈 먼저 챙기기"],
  편재: ["들어온 부업·거래 제안 들어 보기", "미뤄 둔 중고 판매 올리기", "새 사람 소개 자리에 나가기", "미뤄 둔 영업 연락 돌리기", "작은 투자 공부 시작하기"],
  정관: ["보고·결재 먼저 올리기", "발표·면접에 자신 있게 나서기", "윗사람에게 먼저 의견 내기", "평가받을 결과물 먼저 내기", "공식 서류·신청 미루지 않기"],
  편관: ["미뤄 둔 어려운 일 정면으로 끝내기", "맡은 일 하나 확실히 매듭짓기", "버거운 숙제부터 먼저 하기", "운동 강도 한 단계 올리기", "피하던 통화 먼저 걸기"],
  식신: ["미뤄 둔 취미 하나 시작하기", "맛집 점심 약속 잡기", "떠오른 아이디어 바로 적어 두기", "퇴근 후 좋아하는 것 하나 하기", "요리 하나 새로 해 보기"],
  상관: ["기획안 먼저 던져 보기", "하고 싶던 말 글로 정리해 전하기", "내 작업물 밖에 보여 주기", "SNS에 내 이야기 하나 올리기", "새 방식 하나 시도해 보기"],
  정인: ["선배에게 조언 구하기", "자격증·공부 첫 장 펴기", "믿는 사람에게 고민 털어놓기", "부모님께 안부 전화 드리기", "배우고 싶던 강의 신청하기"],
  편인: ["혼자 깊게 파고들 일 하기", "읽고 싶던 책 첫 장 펴기", "조용히 계획 다시 짜기", "혼자 산책하며 생각 정리하기", "다이어리 한 장 채우기"],
  비견: ["동료와 같이 하는 일 벌이기", "같이 운동할 사람 찾기", "오래 못 본 친구에게 연락하기", "팀 점심 먼저 제안하기", "같이 공부할 사람 모으기"],
  겁재: ["경쟁 PT·발표에 먼저 나서기", "실력 보여 줄 자리 잡기", "미뤄 둔 도전 신청하기", "연봉·조건 이야기 꺼내 보기", "승부 보는 일 피하지 않기"],
};
const TAKE_TAG: Record<string, string[]> = {
  귀인: ["막힌 일은 도움 청하기", "어려운 부탁 꺼내 보기"],
  합: ["협업·모임 자리에 나가기", "어색했던 사람과 밥 한 끼 하기"],
  천간합: ["들어온 제안 한 번 받아 보기", "반가운 연락에 먼저 답하기"],
};
const TAKE_ALL = [...new Set([...Object.values(TAKE_TAG).flat(), ...Object.values(TAKE_GOD).flat()])];

// The work days that really clash with a pillar: its day branch met head-on (충), the clash everyone reads. A 형 or
// a 천간충 alone is too mild to call a 고비; a 천간충 on the same day makes it the sharpest kind (천극지충).
function hardDays(stem: number, branch: number, days: DayIn[], work: number[]) {
  return work
    .filter((i) => meetings(branch, days[i].branch).includes("충"))
    .map((i) => ({ i, sev: 3 + (stemClash(stem, days[i].stem) ? 2 : 0) }));
}

// work: indexes of `days` that are work days (all by default). Every pillar gets one short line, no day named,
// whose tone follows the week: a pillar whose day branch is clashed on a work day gets what to avoid then; the
// top forty otherwise get what to make of their best work day; the bottom twenty what to avoid on their hardest.
// No two pillars of a week share a line.
export function rankDays(days: DayIn[], opts: { work?: number[] } = {}): IljuMonth[] {
  const work = opts.work?.length ? opts.work : days.map((_, i) => i);
  const rows = SIXTY.map(({ no, stem, branch }) => {
    const hanja = `${STEMS[stem]}${BRANCHES[branch]}`;
    const per = days.map((d) => meet(stem, branch, d.stem, d.branch));
    const hard = hardDays(stem, branch, days, work);
    const sharp = hard.length ? hard.reduce((a, b) => (b.sev > a.sev || (b.sev === a.sev && per[b.i].score < per[a.i].score) ? b : a)).i : -1;
    const good = work.reduce((b, i) => (per[i].score > per[b].score ? i : b), work[0]);
    const worst = work.reduce((b, i) => (per[i].score < per[b].score ? i : b), work[0]);
    return {
      row: {
        no,
        stem,
        branch,
        hanja,
        name: `${STEMS_KO[stem]}${BRANCHES_KO[branch]}일주`,
        image: ILJU_IMAGE[hanja],
        rank: 0,
        score: Math.round(per.reduce((a, m) => a + m.score, 0) * 10) / 10,
        line: "",
        short: "",
        tips: per[good].tips.map(asDay),
        avoid: "",
        prep: "",
        bright: "",
        tags: per[good].tags,
      } as IljuMonth,
      per,
      sharp,
      sev: hard.reduce((a, x) => a + x.sev, 0),
      good,
      worst,
    };
  });
  rows.sort((a, b) => b.row.score - a.row.score || a.row.no - b.row.no);
  rows.forEach((x, i) => (x.row.rank = i + 1));

  const avoidAt = (stem: number, branch: number, at: number) => {
    const day = days[at];
    const god = tenGod(stem, day.stem);
    const rel = meetings(branch, day.branch);
    const moving = (branch === 2 || branch === 8 || branch === 5 || branch === 11) && rel.includes("충");
    const same = (Object.keys(GROUP) as TenGod[]).filter((g) => g !== god && GROUP[g] === GROUP[god]);
    return [
      ...(moving ? AVOID_MOVE : []),
      ...(rel.includes("충") ? AVOID_CLASH[GROUP[god]] : []),
      ...AVOID_GOD[god],
      ...rel.flatMap((m) => AVOID_REL[m] ?? []),
      ...AVOID_CLASH[GROUP[god]],
      // Still taken: the same kind of force's other lines, then any line left, so no two pillars share one.
      ...same.flatMap((g) => AVOID_GOD[g]),
      ...AVOID_ALL,
    ];
  };
  const plan = rows.map((x) => {
    const { stem, branch } = x.row;
    if (x.sharp >= 0) return { x, kind: "hard" as const, order: -100 - x.sev, candidates: avoidAt(stem, branch, x.sharp) };
    if (x.row.rank > 40) return { x, kind: "care" as const, order: -50 + x.per[x.worst].score, candidates: avoidAt(stem, branch, x.worst) };
    const god = tenGod(stem, days[x.good].stem);
    return {
      x,
      kind: "good" as const,
      order: -x.per[x.good].score,
      candidates: [...x.per[x.good].tags.flatMap((t) => TAKE_TAG[t] ?? []), ...TAKE_GOD[god], ...TAKE_ALL],
    };
  });
  const used = new Set<string>();
  for (const p of [...plan].sort((a, b) => a.order - b.order)) {
    const pick = p.candidates.find((c) => !used.has(c)) ?? p.candidates[0];
    used.add(pick);
    p.x.row.kind = p.kind === "good" ? "good" : "hard";
    p.x.row.avoid = pick;
    p.x.row.short = pick;
    p.x.row.line = `이번 주 한 마디: ${pick}.`;
  }
  return rows.map((x) => x.row);
}
