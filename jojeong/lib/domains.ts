import { meetings, salsAt, stageOf } from "./deep";
import { BRANCH_EL, chartOf, ELEMENT_HANJA, ELEMENT_KO, GROUP_OF, GYEOK_NAME, HIDDEN, readChart, stemEl, tenGod, type GodGroup, type Reading } from "./myeongri";
import type { Gender } from "./profile";
import { BRANCHES, isFull, STEMS, type FullPillars, type Pillars } from "./saju";

// The deep reports (재물·연애·직업): evidence found only for that subject, and a ten-year calendar computed
// year by year, so each reads further than the life report (평생 사주) can. Both go to the writer; the
// calendar is also shown as a table. Rule-based.

export type Domain = "jaemul" | "yeonae" | "jikup";
export const DOMAINS: Domain[] = ["jaemul", "yeonae", "jikup"];
export const isDomain = (id: string): id is Domain => (DOMAINS as string[]).includes(id);

export const DECADE_FROM = 2026;
const YEARS = 10;

const EL = (e: number) => `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`;
const mainQi = (branch: number) => HIDDEN[branch].at(-1)![0];
const yearStem = (y: number) => (((y - 4) % 10) + 10) % 10;
const yearBranch = (y: number) => (((y - 4) % 12) + 12) % 12;
// The branch where each element is stored (墓/庫): 木→未, 火→戌, 土→辰, 金→丑, 水→辰.
const STORE = [7, 10, 4, 1, 4];

type Ctx = { p: FullPillars; r: Reading; gender: Gender | null; share: (g: GodGroup) => number };

function ctxOf(pillars: Pillars, gender: Gender | null): Ctx | null {
  if (!isFull(pillars)) return null;
  const r = readChart(pillars);
  if (!r) return null;
  const total = Object.values(r.godWeights).reduce((a, b) => a + b, 0) || 1;
  return { p: pillars, r, gender, share: (g) => Math.round((r.godWeights[g] / total) * 100) };
}

// Where a ten-god group shows in the chart: visible stems and branch main qi.
function placesOf(c: Ctx, group: GodGroup): string[] {
  const out: string[] = [];
  for (const s of chartOf(c.p)) {
    if (s.stem !== null && s.pos !== "일" && GROUP_OF[tenGod(c.p.dayStem, s.stem)] === group) out.push(`${s.pos}간 ${STEMS[s.stem]}`);
    if (s.branch !== null && GROUP_OF[tenGod(c.p.dayStem, mainQi(s.branch))] === group) out.push(`${s.pos}지 ${BRANCHES[s.branch]}`);
  }
  return out;
}

// The spouse star: 재성 for men, 관성 for women; both when the gender is not known.
const spouseGroups = (g: Gender | null): GodGroup[] => (g === "m" ? ["재성"] : g === "f" ? ["관성"] : ["재성", "관성"]);

export function domainBrief(domain: Domain, pillars: Pillars, gender: Gender | null): string {
  const c = ctxOf(pillars, gender);
  if (!c) return "";
  const { p, r, share } = c;
  const dayEl = stemEl(p.dayStem);
  const lines: string[] = [];
  if (domain === "jaemul") {
    const wealthEl = (dayEl + 2) % 5;
    const places = placesOf(c, "재성");
    const store = chartOf(p).some((s) => s.branch === STORE[wealthEl]);
    lines.push(
      "■ ★ 재물 심화 근거 (평생 사주에는 없는 계산. 이 보고서의 뼈대)",
      `- 재성(돈 기운, ${EL(wealthEl)}): 비중 ${share("재성")}% · 자리 ${places.length ? places.join(", ") : "드러난 곳 없음(지장간에만 있거나 없음)"}`,
      `- 식상(재주) ${share("식상")}% → 재성 ${share("재성")}%: ${share("식상") >= 10 && share("재성") >= 10 ? "재주가 돈으로 이어지는 흐름(식상생재)이 살아 있음" : share("식상") >= 10 ? "재주는 있으나 돈으로 잇는 고리가 약함" : share("재성") >= 10 ? "돈 기운은 있으나 스스로 만들어 내는 재주가 약함" : "둘 다 약함"}`,
      `- 비겁(나눠 가져가는 기운) ${share("비겁")}%${placesOf(c, "비겁").some((x) => x.includes("지")) ? `, 자리 ${placesOf(c, "비겁").join(", ")}` : ""}: ${share("비겁") >= 30 && share("재성") < 20 ? "돈을 두고 다투는 구조(군비쟁재) — 동업·보증·더치페이 안 하는 자리에서 새기 쉬움" : "크게 새는 구조는 아님"}`,
      `- 재물 창고(${BRANCHES[STORE[wealthEl]]}): ${store ? "원국에 있음 — 모아 두는 힘" : "원국에 없음 — 들어와도 머물게 하는 장치가 필요"}`,
      `- 감당할 힘: ${r.strength}${(r.strength === "신약" || r.strength === "극신약") && share("재성") >= 30 ? " — 재다신약: 큰돈보다 꾸준한 돈이 맞음" : ""}`,
    );
  } else if (domain === "yeonae") {
    const groups = spouseGroups(c.gender);
    const seat = p.dayBranch;
    const seatGod = tenGod(p.dayStem, mainQi(seat));
    const natal = chartOf(p).filter((s) => s.branch !== null && s.pos !== "일");
    const seatMeet = natal.flatMap((s) => {
      const m = meetings(seat, s.branch!);
      return m.length ? [`${s.pos}지 ${BRANCHES[s.branch!]}와 ${m.join("·")}`] : [];
    });
    const dohwa = chartOf(p).flatMap((s) => (s.branch !== null && salsAt(p, s.branch).includes("도화") ? [`${s.pos}지`] : []));
    const mixed =
      c.gender === "f" && placesOf(c, "관성").length >= 2 && chartOf(p).some((s) => s.stem !== null && tenGod(p.dayStem, s.stem) === "정관") && chartOf(p).some((s) => s.stem !== null && tenGod(p.dayStem, s.stem) === "편관");
    lines.push(
      "■ ★ 연애·결혼 심화 근거 (평생 사주에는 없는 계산. 이 보고서의 뼈대)",
      `- 배우자 기운(${groups.join("·")}${c.gender ? "" : ", 성별을 몰라 둘 다"}): 비중 ${groups.map((g) => `${g} ${share(g)}%`).join(", ")} · 자리 ${groups.flatMap((g) => placesOf(c, g)).join(", ") || "드러난 곳 없음"}`,
      `- 배우자 자리(일지 ${BRANCHES[seat]}): ${seatGod}(${GROUP_OF[seatGod]}) · 12운성 ${stageOf(p.dayStem, seat)} · 원국과 ${seatMeet.length ? seatMeet.join(", ") : "합충 없음(안정)"}`,
      `- 도화: ${dohwa.length ? dohwa.join(", ") : "없음"}`,
      `- 표현하는 힘(식상) ${share("식상")}% · 받아들이는 힘(인성) ${share("인성")}%${c.gender === "f" && share("식상") >= 30 ? " · 식상이 관(배우자성)을 누르는 구조(상관견관) — 상대에게 기대치가 높고 말로 부딪히기 쉬움" : ""}${c.gender === "m" && share("비겁") >= 30 ? " · 비겁이 재(배우자성)를 다투는 구조 — 연인에게 친구·형제 문제가 끼기 쉬움" : ""}`,
      ...(mixed ? ["- 관살혼잡: 정관과 편관이 함께 — 끌리는 사람이 두 부류로 갈림"] : []),
    );
  } else {
    const officer = share("관성") + share("인성");
    const creator = share("식상");
    const business = share("재성") + Math.round(share("식상") / 2);
    const top = [
      ["조직형(관·인)", officer],
      ["창작·기술형(식상)", creator],
      ["사업형(재·식상)", business],
    ].sort((a, b) => Number(b[1]) - Number(a[1]));
    const sals = [...new Set(chartOf(p).flatMap((s) => (s.branch === null ? [] : salsAt(p, s.branch).filter((x) => ["역마", "문창귀인", "화개", "양인", "천을귀인"].includes(x)).map((x) => `${x}(${s.pos}지)`))))];
    const month = chartOf(p).filter((s) => s.branch !== null && s.pos !== "월").flatMap((s) => {
      const m = meetings(p.monthBranch, s.branch!);
      return m.length ? [`${s.pos}지와 ${m.join("·")}`] : [];
    });
    lines.push(
      "■ ★ 직업 심화 근거 (평생 사주에는 없는 계산. 이 보고서의 뼈대)",
      `- 격국 ${GYEOK_NAME[r.gyeok]} · 월간 투출 ${chartOf(p).find((s) => s.pos === "월")!.stem !== null && GROUP_OF[tenGod(p.dayStem, p.monthStem)] === GROUP_OF[r.gyeok] ? "있음(격이 드러나 뚜렷함)" : "없음(격이 속에 숨음)"}`,
      `- 일하는 방식 점수: ${top.map(([k, v]) => `${k} ${v}`).join(" > ")}`,
      `- 관성(자리·책임) ${share("관성")}% · 인성(자격·학습) ${share("인성")}%${share("관성") >= 10 && share("인성") >= 10 ? " — 관인상생: 조직에서 인정받아 올라가는 구조" : ""}`,
      `- 일 관련 신살: ${sals.length ? sals.join(", ") : "두드러진 것 없음"}`,
      `- 일터 자리(월지 ${BRANCHES[p.monthBranch]}): 원국과 ${month.length ? month.join(", ") : "합충 없음"}`,
    );
  }
  return lines.join("\n");
}

export type DecadeYear = { year: number; gz: string; grade: 2 | 1 | 0 | -1; tag: string; why: string[] };

// Tags by grade (◎ ○ △ ✕), and for a year of upheaval that is not clearly good.
const TAGS: Record<Domain, { grade: [string, string, string, string]; move: string }> = {
  jaemul: { grade: ["지키는 해", "잔잔한 해", "무난한 해", "돈이 트이는 해"], move: "들고 나는 해" },
  yeonae: { grade: ["조심하는 해", "잔잔한 해", "무난한 해", "인연의 해"], move: "큰 변화의 해" },
  jikup: { grade: ["버티는 해", "잔잔한 해", "무난한 해", "올라가는 해"], move: "갈림길의 해" },
};

// Ten years from 2026, one line each: how the year's stem and branch meet this chart for this subject.
export function decadeOf(domain: Domain, pillars: Pillars, gender: Gender | null): DecadeYear[] {
  const c = ctxOf(pillars, gender);
  if (!c) return [];
  const { p, r } = c;
  return Array.from({ length: YEARS }, (_, i) => {
    const y = DECADE_FROM + i;
    const s = yearStem(y);
    const b = yearBranch(y);
    const gs = GROUP_OF[tenGod(p.dayStem, s)];
    const gb = GROUP_OF[tenGod(p.dayStem, mainQi(b))];
    const godS = tenGod(p.dayStem, s);
    const has = (g: GodGroup) => gs === g || gb === g;
    const why: string[] = [];
    let score = 0;
    if (stemEl(s) === r.yong || BRANCH_EL[b] === r.yong) {
      score += 1;
      why.push("필요한 기운(용신)이 드는 해");
    }
    if (stemEl(s) === r.gi && BRANCH_EL[b] === r.gi) {
      score -= 1;
      why.push("버거운 기운(기신)이 겹치는 해");
    }
    let move = false;
    if (domain === "jaemul") {
      if (has("재성")) {
        const weak = (r.strength === "신약" || r.strength === "극신약") && c.share("재성") >= 30;
        score += weak ? 0 : 2;
        why.push(weak ? "돈 기운이 들어오지만 감당이 벅찬 해" : "돈 기운(재성)이 들어오는 해");
      }
      if (has("식상") && c.share("재성") >= 5) {
        score += 1;
        why.push("재주가 돈이 되는 해");
      }
      if (godS === "겁재" || tenGod(p.dayStem, mainQi(b)) === "겁재") {
        score -= 2;
        why.push("돈이 나가기 쉬운 해(겁재)");
      } else if (has("비겁")) {
        score -= 1;
        why.push("나눠 쓸 일이 생기는 해");
      }
    } else if (domain === "yeonae") {
      const spouse = spouseGroups(c.gender);
      if (spouse.includes(gs) || spouse.includes(gb)) {
        score += 2;
        why.push("인연 기운(배우자성)이 드는 해");
      }
      const seat = meetings(b, p.dayBranch);
      if (seat.includes("육합") || seat.includes("삼합")) {
        score += 2;
        why.push("배우자 자리에 합: 인연이 들어오거나 깊어지는 해");
      }
      if (seat.includes("충")) {
        score -= 2;
        move = true;
        why.push("배우자 자리가 움직이는 해(만남·이별·결혼 같은 큰 변화)");
      }
      if (salsAt(p, b).includes("도화")) {
        score += 1;
        why.push("도화: 이성의 눈길이 모이는 해");
      }
      if (c.gender === "f" && godS === "상관") {
        score -= 1;
        why.push("말로 부딪히기 쉬운 해(상관)");
      }
      if (c.gender === "m" && godS === "겁재") {
        score -= 1;
        why.push("관계에 제3자가 끼기 쉬운 해(겁재)");
      }
    } else {
      if (has("관성")) {
        score += 2;
        why.push("자리·책임·승진 기운(관성)이 드는 해");
      }
      if (has("인성")) {
        score += 1;
        why.push("배움·자격·문서의 해");
      }
      if (gs === "관성" && gb === "인성") {
        score += 1;
        why.push("관인상생: 올라가기 좋은 해");
      }
      if (godS === "상관" && c.share("관성") >= 10) {
        score -= 1;
        why.push("윗사람과 부딪히기 쉬운 해(상관견관)");
      } else if (has("식상")) {
        score += 1;
        why.push("재주를 드러내는 해(창작·독립에 유리)");
      }
      if (meetings(b, p.monthBranch).includes("충")) {
        move = true;
        why.push("일터 자리가 흔들리는 해(이직·이동)");
      }
      if (salsAt(p, b).includes("역마")) {
        move = true;
        why.push("역마: 이동·출장·새 판의 기운");
      }
    }
    const grade: DecadeYear["grade"] = score >= 3 ? 2 : score >= 1 ? 1 : score >= 0 ? 0 : -1;
    const tag = move && grade < 2 ? TAGS[domain].move : TAGS[domain].grade[grade + 1];
    return { year: y, gz: `${STEMS[s]}${BRANCHES[b]}`, grade, tag, why };
  });
}

export function decadeBrief(domain: Domain, years: DecadeYear[]): string {
  if (!years.length) return "";
  return [
    `■ ★ 10년 달력 (${DECADE_FROM}~${DECADE_FROM + YEARS - 1}, 엔진 계산. 보고서에 표로 함께 나간다. ◎·✕ 해는 본문에서 구체적으로 짚을 것)`,
    ...years.map((y) => `- ${y.year} ${y.gz} ${"✕△○◎"[y.grade + 1]} ${y.tag}: ${y.why.join(", ") || "특별히 드는 기운 없음"}`),
  ].join("\n");
}
