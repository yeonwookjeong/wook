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
  line: string; // the month in one line
  tags: string[];
};

export type MonthPillar = { stem: number; branch: number; from: string; to: string; label: string; term: string };

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
  return { stem: cur.stem, branch: cur.branch, from: md(start), to: md(end), label: `${STEMS_KO[cur.stem]}${BRANCHES_KO[cur.branch]}월`, term: TERM[cur.branch] };
}

// How a month (or any pillar) meets one day pillar.
export function meet(stem: number, branch: number, ms: number, mb: number): { score: number; line: string; tags: string[] } {
  const p = { dayStem: stem, dayBranch: branch, yearBranch: branch } as Pillars;
  const god = tenGod(stem, ms);
  const branchGod = tenGod(stem, HIDDEN[mb].at(-1)![0]);
  let score = GOD_WEIGHT[god] + GOD_WEIGHT[branchGod] * 0.6;
  const tags: string[] = [];
  // The meeting that most shapes the month becomes the second half of the line.
  let tail: string | null = null;
  const m = meetings(branch, mb);
  const sals = salsAt(p, mb);
  if (m.includes("충")) {
    score -= 2.5;
    tags.push("충");
    tail = "흔들림이 있는 달이에요. 큰 결정은 한 박자 쉬고 하세요";
  }
  if (m.includes("육합") || m.includes("삼합")) {
    score += m.includes("육합") ? 2 : 1.5;
    tags.push("합");
    tail ??= "사람과 손발이 맞는 달이에요";
  } else if (m.includes("방합")) score += 0.5;
  if (m.includes("형")) {
    score -= 1;
    tags.push("형");
    tail ??= "사소한 마찰을 조심할 달이에요";
  }
  if (m.includes("원진")) score -= 0.7;
  if (m.includes("해") || m.includes("파")) score -= 0.5;
  if (stemCombine(stem, ms)) {
    score += 1.5;
    tags.push("천간합");
    tail ??= "반가운 제안과 인연이 닿는 달이에요";
  }
  if (stemClash(stem, ms)) {
    score -= 1.5;
    tags.push("천간충");
  }
  if (sals.includes("천을귀인")) {
    score += 1.5;
    tags.push("귀인");
    if (!m.includes("충")) tail = "귀인이 돕는 달이에요";
  }
  if (sals.includes("문창귀인")) score += 0.5;
  const stage = stageOf(stem, mb);
  if (stage === "건록" || stage === "제왕") score += 0.7;
  else if (stage === "장생" || stage === "관대") score += 0.5;
  else if (stage === "사" || stage === "묘" || stage === "절") score -= 0.5;
  const extra = sals.includes("도화") ? " 인연운도 들어와요." : sals.includes("역마") ? " 이동과 출장이 잦아요." : "";
  const line = tail ? `${GOD_SHORT[god]}, ${tail}.` : `${GOD_LINE[god]}.`;
  return { score: Math.round(score * 10) / 10, line: line + extra, tags };
}

// All sixty for one month pillar, best first.
export function rankMonth(ms: number, mb: number): IljuMonth[] {
  const rows = SIXTY.map(({ no, stem, branch }) => {
    const hanja = `${STEMS[stem]}${BRANCHES[branch]}`;
    const m = meet(stem, branch, ms, mb);
    return { no, stem, branch, hanja, name: `${STEMS_KO[stem]}${BRANCHES_KO[branch]}일주`, image: ILJU_IMAGE[hanja], score: m.score, rank: 0, line: m.line, tags: m.tags };
  });
  rows.sort((a, b) => b.score - a.score || a.no - b.no);
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}
