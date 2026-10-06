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
    const top = workTypes(share).map((w) => [`${w.name}(${w.basis})`, w.score]);
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
  const card = domainCard(domain, pillars, gender);
  if (card) lines.push(`- 무료 화면에서 읽는 사람이 이미 본 판정: '${card.type}' — ${card.line} (이 판정과 같은 방향으로, 되풀이하지 말고 장면과 근거로 넓혀 쓸 것)`);
  return lines.join("\n");
}

// The free card at the top of a deep report: the subject's own verdict and three findings in plain words,
// none of which the life report shows. The written report builds on the same evidence (domainBrief).
export type DomainCard = { type: string; line: string; facts: { label: string; value: string; note: string }[] };

const WORK_SAL: Record<string, string> = {
  역마: "움직이는 일, 출장·해외·이동이 잦은 일과 인연이 있어요",
  문창귀인: "글·공부·기획처럼 머리로 하는 일에서 빛나요",
  화개: "연구·예술·전문 분야처럼 깊이 파고드는 일이 맞아요",
  양인: "승부가 나는 일, 전문 기술로 버티는 일에 강해요",
  천을귀인: "일이 막힐 때 도와주는 윗사람 복이 있어요",
};

// How one works best, by which force leads the chart. Each type rests on its own group, helped by the one that
// feeds it; an organisation needs the officer itself (a chart with no 관성 is not an 조직형, however much 인성).
function workTypes(share: (g: GodGroup) => number) {
  const types = [
    { name: "조직형", basis: "관성", score: share("관성") + Math.round(share("재성") / 3), where: "조직 안에서 자리와 책임을 맡아 올라가는 일" },
    { name: "전문·자격형", basis: "인성", score: share("인성") + Math.round(share("관성") / 3), where: "공부와 자격으로 인정받는 전문 분야" },
    { name: "창작·기술형", basis: "식상", score: share("식상") + Math.round(share("비겁") / 3), where: "내 손과 머리로 만들어 내는 일" },
    { name: "사업형", basis: "재성", score: share("재성") + Math.round(share("식상") / 3), where: "판을 벌이고 사람과 돈을 굴리는 일" },
    { name: "독립형", basis: "비겁", score: share("비겁") + Math.round(share("인성") / 3), where: "내 이름으로 혼자 서는 일, 프리랜서나 자영업" },
  ];
  return types.sort((a, b) => b.score - a.score).slice(0, 3);
}

export function domainCard(domain: Domain, pillars: Pillars, gender: Gender | null): DomainCard | null {
  const c = ctxOf(pillars, gender);
  if (!c) return null;
  const { p, r, share } = c;
  if (domain === "jaemul") {
    const wealthEl = (stemEl(p.dayStem) + 2) % 5;
    const craft = share("식상");
    const money = share("재성");
    const store = chartOf(p).some((s) => s.branch === STORE[wealthEl]);
    const rival = share("비겁") >= 30 && money < 20;
    const weak = (r.strength === "신약" || r.strength === "극신약") && money >= 30;
    const [type, line] =
      craft >= 10 && money >= 10
        ? ["재주로 버는 사람", "잘하는 것이 그대로 돈이 되는 흐름이 살아 있어요. 내 이름을 걸고 파는 일에서 돈이 붙어요."]
        : money >= 10
          ? ["기회를 잡아 버는 사람", "돈의 흐름을 읽는 눈은 있는데, 스스로 만들어 내는 재주가 약해요. 좋은 판과 사람을 고르는 게 돈이에요."]
          : craft >= 10
            ? ["재주가 먼저인 사람", "재주는 넉넉한데 돈으로 잇는 고리가 약해요. 값을 매기고 파는 연습이 돈을 불러요."]
            : ["차곡차곡 쌓는 사람", "돈 기운이 크게 드러나지 않아 한 방보다 꾸준함이 맞아요. 월급과 저축이 가장 큰 무기예요."];
    return {
      type,
      line,
      facts: [
        { label: "돈 기운", value: `${money}%`, note: money >= 30 ? "돈 기운이 많은 편이에요" : money >= 10 ? "보통이에요" : "적은 편이에요" },
        { label: "재물 창고", value: store ? "있음" : "없음", note: store ? "들어온 돈을 모아 두는 힘이 있어요" : "들어와도 머물게 하는 장치(자동이체·적금)가 필요해요" },
        {
          label: "새는 구멍",
          value: rival ? "있음" : weak ? "주의" : "작음",
          note: rival ? "나눠 가져가는 기운이 강해요. 동업·보증·돈 빌려주기에서 새요" : weak ? "돈이 몸보다 커요. 큰돈보다 꾸준한 돈이 맞아요" : "크게 새는 구조는 아니에요",
        },
      ],
    };
  }
  if (domain === "yeonae") {
    const groups = spouseGroups(c.gender);
    const spouse = groups.reduce((a, g) => a + share(g), 0) / groups.length;
    const seat = p.dayBranch;
    const shaken = chartOf(p).some((s) => s.branch !== null && s.pos !== "일" && meetings(seat, s.branch).some((m) => m === "충" || m === "형" || m === "원진"));
    const bound = chartOf(p).some((s) => s.branch !== null && s.pos !== "일" && meetings(seat, s.branch).includes("육합"));
    const dohwa = chartOf(p).some((s) => s.branch !== null && salsAt(p, s.branch).includes("도화"));
    // The seat's 합 is also one of the rare findings shown above this card ("한번 정을 준 사람과 오래 가요"):
    // the verdict says the same thing in the same words, never "안정" for a seat that is bound.
    const [type, line] = shaken
      ? bound
        ? ["늦게 피는 인연", "배우자 자리가 합으로 묶여 정은 깊은데, 부딪히는 글자도 함께 있어요. 서두른 인연보다, 한 번 겪고 난 뒤 만나는 사람이 오래가요."]
        : ["늦게 피는 인연", "배우자 자리가 흔들리는 구조예요. 일찍 만난 인연보다, 한 번 겪고 난 뒤 만나는 사람이 오래가요."]
      : spouse >= 25
        ? bound
          ? ["인연이 많은 사람", "배우자 기운이 넉넉해 사람이 자주 들어와요. 그런데 배우자 자리가 합으로 묶여 한번 정을 주면 오래 가니, 고르는 눈이 연애의 전부예요."]
          : ["인연이 많은 사람", "배우자 기운이 넉넉해 사람이 자주 들어와요. 고르는 눈이 연애의 전부예요."]
        : spouse < 8
          ? ["스스로 찾아가야 하는 사람", "배우자 기운이 적어 기다리면 늦어져요. 내가 먼저 움직일 때 인연이 와요."]
          : bound
            ? ["한 사람과 깊어지는 사람", "배우자 자리가 합으로 묶여 있어요. 한번 정을 준 사람과 오래, 깊게 가는 연애가 맞아요."]
            : ["한 사람과 깊어지는 사람", "배우자 자리가 안정돼 있어요. 넓게보다 한 사람과 깊게 가는 연애가 맞아요."];
    return {
      type,
      line,
      facts: [
        { label: "배우자 기운", value: `${Math.round(spouse)}%`, note: spouse >= 25 ? "사람이 잘 들어오는 편이에요" : spouse >= 8 ? "보통이에요" : "적은 편이라 먼저 움직여야 해요" },
        { label: "배우자 자리", value: shaken ? (bound ? "묶임·흔들림" : "흔들림") : bound ? "묶임" : "안정", note: shaken ? (bound ? "정은 깊은데 부딪히는 글자도 있어 시기를 고르는 게 중요해요" : "부딪히는 글자가 있어 시기를 고르는 게 중요해요") : bound ? "합으로 묶여 정이 깊은 대신 쉽게 못 놓아요" : "큰 흔들림 없이 안정적이에요" },
        { label: "도화", value: dohwa ? "있음" : "없음", note: dohwa ? "사람을 끄는 매력이 있어 먼저 다가오는 사람이 많아요" : "첫눈보다 알수록 끌리는 매력이에요" },
      ],
    };
  }
  const scores = workTypes(share).map((w) => [w.name, w.score, w.where] as [string, number, string]);
  const sals = [...new Set(chartOf(p).flatMap((s) => (s.branch === null ? [] : salsAt(p, s.branch).filter((x) => x in WORK_SAL))))];
  return {
    type: `${scores[0][0]} 인재`,
    line: `${scores[0][2]}에서 가장 빛나요. 두 번째는 ${scores[1][0]}이라, 둘을 섞은 자리가 가장 오래 가요.`,
    facts: [
      ...scores.map(([k, v]) => ({ label: k, value: `${v}점`, note: "" })),
      ...(sals.length ? [{ label: "일복 신호", value: sals[0], note: WORK_SAL[sals[0]] }] : []),
    ],
  };
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
