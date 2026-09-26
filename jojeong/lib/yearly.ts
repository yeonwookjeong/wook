import { gongmang, isBaekho, isGoegang, meetings, salsAt, stageOf, stemClash, stemCombine, type Meeting } from "./deep";
import { josa } from "./josa";
import { BRANCH_EL, chartOf, ELEMENT_HANJA, ELEMENT_KO, GOD_GLOSS, GROUP_OF, GYEOK_NAME, readChart, stemEl, tenGod, type GodGroup, type Reading, type Slot } from "./myeongri";
import { palaceOf, selfStars, type Profile } from "./profile";
import { BRANCHES, STEMS, type FullPillars, type Pillars } from "./saju";
import {
  BALANCED_IMAGE,
  DAEUN_FIT,
  DAEUN_GROUP,
  DAY_IMAGE,
  ELEMENT_HEALTH,
  EXCESS_IMAGE,
  GYEOK_TEXT,
  JOHU_IMAGE,
  JOHU_NEED,
  LUCKY,
  MEET_TEXT,
  MONTH_LINE,
  NATAL_SAL,
  NATAL_SELF,
  palaceLine,
  POS_TEXT,
  SAL_YEAR,
  STAGE_TEXT,
  STAR_TEMPER,
  STEM_MEET,
  STEM_YEAR,
  YEAR_MUTAGEN,
} from "./yearText";
import { Solar } from "lunar-javascript";

// The 2026 (丙午) reading: the chart itself (물상, 격국, 신강약, 용신 by 억부 and 조후, 12운성, 신살), the year
// against it (ten gods, 합·충·형·파·해·원진 with every natal branch, 신살 the year brings), the ten-year luck it
// falls in (대운), each area of life (sharpened by the palace chart where the birth hour is known), the twelve
// months, and what to lean on (개운).

export const YEAR = { stem: 2, branch: 6, label: "병오년" };
const FIRE = 1;

// Month pillars of 2026 and the solar date each starts (the 절기), read from the calendar itself.
export const MONTHS: { stem: number; branch: number; from: string }[] = (() => {
  const out: { stem: number; branch: number; from: string }[] = [];
  let prev = "";
  for (let t = Date.UTC(2026, 1, 1); t <= Date.UTC(2027, 0, 10); t += 86400000) {
    const d = new Date(t);
    const ec = Solar.fromYmdHms(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), 12, 0, 0).getLunar().getEightChar();
    const gz = ec.getMonthGan() + ec.getMonthZhi();
    if (gz !== prev) {
      prev = gz;
      out.push({
        stem: STEMS.indexOf(ec.getMonthGan() as (typeof STEMS)[number]),
        branch: BRANCHES.indexOf(ec.getMonthZhi() as (typeof BRANCHES)[number]),
        from: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`,
      });
    }
  }
  return out.filter((m) => m.branch !== 1 || out.indexOf(m) > 0).slice(0, 12); // 寅月 → 丑月
})();

export type Verdict = "대길" | "길" | "평" | "조심" | "인내";
export type YearSection = { id: string; hanja: string; label: string; headline: string; paras: string[]; basis: string[] };
export type MonthRow = { from: string; gz: string; rating: 0 | 1 | 2 | 3; line: string; tags: string[] };
export type YearReading = {
  verdict: Verdict;
  headline: string;
  keywords: string[];
  sections: YearSection[];
  months: MonthRow[];
  best: number[];
  worst: number[];
  lucky: (typeof LUCKY)[number] & { avoid: string; element: number };
  advice: string[];
  missing: { daeun: boolean; palaces: boolean };
  chart: { slots: Slot[]; elements: number[]; strength: string; yong: number; missing: number[]; gyeok: string };
};

const EL = (e: number) => `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`;
const pct = (w: number[], i: number) => Math.round((100 * w[i]) / w.reduce((a, b) => a + b, 0));

// How welcome an element is to this chart: 용신 +2, 희신 +1, 기신 −2, 구신 (feeds the 기신) −1.
function elScore(r: Reading, e: number) {
  if (e === r.yong) return 2;
  if (e === r.hee) return 1;
  if (e === r.gi) return -2;
  if (e === (r.gi + 4) % 5) return -1;
  return 0;
}

function natalBranches(p: FullPillars) {
  return chartOf(p)
    .filter((s) => s.branch !== null)
    .map((s) => ({ pos: s.pos, branch: s.branch! }));
}

export function yearReading(p: Pillars, profile: Profile | null): YearReading | null {
  const r = readChart(p);
  if (!r) return null;
  const full = p as FullPillars;
  const dayEl = stemEl(p.dayStem);
  const sy = STEM_YEAR[p.dayStem];
  const yearGods = [tenGod(p.dayStem, YEAR.stem), tenGod(p.dayStem, 3)] as const; // 午's 본기 is 丁
  const yearGroup = GROUP_OF[yearGods[0]];
  const strong = r.strength === "신강" || r.strength === "극신강";

  // ── The year against the chart.
  let score = elScore(r, FIRE) * 1.5;
  const why: string[] = [];
  why.push(
    FIRE === r.yong
      ? `병오년의 불(火)이 그대의 용신이옵니다`
      : FIRE === r.hee
        ? `병오년의 불(火)이 용신을 돕는 희신이옵니다`
        : FIRE === r.gi
          ? `병오년의 불(火)이 용신 ${EL(r.yong)}을 누르는 기신이옵니다`
          : FIRE === (r.gi + 4) % 5
            ? `병오년의 불(火)이 기신을 부추기는 기운이옵니다`
            : `병오년의 불(火)은 그대의 용신과 크게 얽히지 않사옵니다`,
  );

  const meetLines: string[] = [];
  const meetTags = new Set<Meeting>();
  const byMeeting = new Map<Meeting, string[]>();
  for (const { pos, branch } of natalBranches(full)) {
    // The strongest meeting of the year's 午 with this branch decides how it reads.
    const main = meetings(YEAR.branch, branch)[0];
    if (!main) continue;
    meetTags.add(main);
    byMeeting.set(main, [...(byMeeting.get(main) ?? []), `${BRANCHES[branch]}(${POS_TEXT[pos]})`]);
    const w = pos === "일" ? 1.5 : pos === "월" ? 1 : 0.5;
    score += w * ({ 육합: 1, 삼합: 0.8, 방합: 0.5, 충: -1.5, 형: -0.7, 원진: -0.7, 해: -0.5, 파: -0.5 } as Record<string, number>)[main];
  }
  // Several meetings in a row read better with the subject varied after the first.
  const lead = ["올해의 午火가", "또 午火가", "한편 午火가", "그리고 午火가"];
  [...byMeeting].forEach(([m, places], i) =>
    meetLines.push(MEET_TEXT[m](`사주의 ${places.join(", ")}`).replace("올해의 午火가", lead[Math.min(i, lead.length - 1)])),
  );
  for (const s of chartOf(full)) {
    if (s.stem === null || s.pos === "일") continue;
    const pos = POS_TEXT[s.pos];
    if (stemCombine(YEAR.stem, s.stem)) {
      meetLines.push(STEM_MEET.합(pos));
      score += 0.5;
    } else if (stemClash(YEAR.stem, s.stem)) {
      meetLines.push(STEM_MEET.충(pos));
      score -= 0.5;
    }
  }
  if (stemCombine(YEAR.stem, p.dayStem)) score += 1;
  if (stemClash(YEAR.stem, p.dayStem)) score -= 1;
  const yearSals = salsAt(p, YEAR.branch).filter((s) => s in SAL_YEAR);
  if (yearSals.includes("천을귀인")) score += 1;
  if (yearSals.includes("공망")) score -= 0.5;

  // ── 대운 around 2026.
  const daeun = profile?.daeun;
  const now = daeun?.find((d) => d.from <= 2026 && 2026 <= d.to);
  const next = daeun?.find((d) => d.from === (now?.to ?? 0) + 1);
  if (now) score += (elScore(r, stemEl(now.stem)) + elScore(r, BRANCH_EL[now.branch])) * 0.35;

  const verdict: Verdict = score >= 3.5 ? "대길" : score >= 1 ? "길" : score > -1 ? "평" : score > -3 ? "조심" : "인내";
  const stage = stageOf(p.dayStem, YEAR.branch);

  // ── 타고난 그릇 (the chart itself)
  // The image comes from what tips the chart: for a strong day master the heavier of its backers, for a
  // weak one the heaviest of what drains it.
  const groups: GodGroup[] = ["비겁", "식상", "재성", "관성", "인성"];
  const side: GodGroup[] = strong ? ["비겁", "인성"] : ["식상", "재성", "관성"];
  const heavy = side.reduce((a, b) => (r.godWeights[b] > r.godWeights[a] ? b : a));
  const heavyShare = r.godWeights[heavy] / Object.values(r.godWeights).reduce((a, b) => a + b, 0);
  const tipped = heavyShare > 0.25;
  const img = DAY_IMAGE[p.dayStem];
  const excess = tipped ? EXCESS_IMAGE[p.dayStem][groups.indexOf(heavy)] : BALANCED_IMAGE[p.dayStem];
  const johu = r.johu !== null ? JOHU_IMAGE[r.johu] : "";
  const natalStems = chartOf(full).flatMap((s) => (s.stem === null || s.pos === "일" ? [] : [s.stem]));
  const cureHave = img.cure.filter((c) => natalStems.includes(c));
  const cureEl = stemEl(img.cure[0]);
  const coreHeadline =
    r.johu !== null
      ? `${johu}의 ${img.thing}, ${JOHU_NEED[r.johu]} 사주`
      : tipped
        ? `${excess}, ${EL(r.yong)} 기운을 만나야 빛이 나는 사주`
        : `${excess}처럼 제 모양을 지킨 사주, ${EL(r.yong)} 기운이 들면 더 빛나옵니다`;
  const palaces = profile?.palaces;
  const stars = palaces ? selfStars(palaces) : [];
  const temper = stars.map((s) => STAR_TEMPER[s]).filter(Boolean);
  const selfNatal = palaces?.[0].stars.map((s) => profile?.natal?.[s]).find(Boolean);
  const natalSals = [
    ...new Set(natalBranches(full).flatMap(({ branch }) => salsAt(p, branch).filter((s) => s !== "공망"))),
    ...(isGoegang(p) ? ["괴강"] : []),
    ...(isBaekho(p) ? ["백호"] : []),
  ].filter((s) => s in NATAL_SAL);

  const core: YearSection = {
    id: "core",
    hanja: "命",
    label: "타고난 그릇",
    headline: coreHeadline,
    paras: [
      `그대는 ${img.thing}의 기운(${STEMS[p.dayStem]}${ELEMENT_HANJA[dayEl]})을 타고났사옵니다. ${
        tipped
          ? `그런데 사주에 ${GOD_GLOSS[r.godList.find((g) => GROUP_OF[g] === heavy) ?? "비견"].replace(/\(.*\)/, "")}의 기운(${heavy})이 유난히 두터워, ${josa(excess, "과/와")} 같은 형국이옵니다.`
          : "사주의 기운이 어느 한쪽으로 크게 쏠리지 않아 제 모양을 잘 지키고 있사옵니다."
      }`,
      `${img.cureText}. ${cureHave.length ? `다행히 그대의 사주에는 ${cureHave.map((c) => STEMS[c]).join("·")}의 기운이 이미 있어 제 빛을 낼 재료를 갖추었사옵니다.` : "그대의 사주에는 이 재료가 드러나 있지 않아, 운에서 들어올 때 비로소 크게 빛나옵니다."}`,
      r.johu !== null
        ? `${r.season}에 태어나 ${r.johu === 4 ? "사주가 메마르고 뜨거우니" : "사주가 차고 습하니"}, 무엇보다 ${EL(r.johu)} 기운이 들어와야 숨통이 트이옵니다. 그래서 그대의 용신은 ${EL(r.yong)}이옵니다.`
        : `${r.balanced ? "기운이 중화에 가까운 " : ""}${r.strength}한 사주라, ${EL(r.yong)} 기운이 들어올 때 일이 풀리고, ${EL(r.gi)} 기운이 몰릴 때 막히옵니다.${
            // The classical image (물상) can call for a different element than 억부; say so rather than hide it.
            cureEl !== r.yong && cureEl !== r.gi
              ? ` 다만 ${josa(img.thing, "이/가")} 제 빛을 내려면 ${EL(cureEl)} 기운도 함께 들어와야 하니, 두 기운이 겹치는 때가 그대의 가장 좋은 때이옵니다.`
              : ""
          }`,
      `${GYEOK_NAME[r.gyeok]}의 사주이옵니다. ${GYEOK_TEXT[r.gyeok]}`,
      `일주 ${STEMS[p.dayStem]}${BRANCHES[p.dayBranch]}는 ${stageOf(p.dayStem, p.dayBranch)}의 자리에 앉아 있사옵니다. ${STAGE_TEXT[stageOf(p.dayStem, p.dayBranch)]}`,
      ...(temper.length ? [`타고난 기질을 보면, ${temper[0]}${selfNatal ? ` ${NATAL_SELF[selfNatal]}` : ""}`] : []),
      ...natalSals.slice(0, 2).map((s) => NATAL_SAL[s]),
    ],
    basis: [
      `궁성·조후 보정 오행 비율 · ${[0, 1, 2, 3, 4].map((e) => `${ELEMENT_KO[e]} ${pct(r.weights, e)}%`).join(" · ")}`,
      `일간을 돕는 기운 ${Math.round(r.support * 100)}% → ${r.balanced ? "중화에 가까운 " : ""}${r.strength}`,
      `용신 ${EL(r.yong)} (${r.method === "조후" ? `조후 우선, 억부로는 ${EL(r.eokbu)}` : "억부"}) · 희신 ${EL(r.hee)} · 기신 ${EL(r.gi)}`,
      `물상으로 빛을 내는 기운 · ${img.cure.map((c) => `${STEMS[c]}${ELEMENT_HANJA[stemEl(c)]}`).join(" · ")}`,
      `격국 ${GYEOK_NAME[r.gyeok]} · 일지 12운성 ${stageOf(p.dayStem, p.dayBranch)} · 공망 ${gongmang(p).map((b) => BRANCHES[b]).join("")}`,
    ],
  };

  // ── 병오년 총운
  const overall: YearSection = {
    id: "year",
    hanja: "歲",
    label: "병오년 총운",
    headline: sy.headline,
    paras: [
      sy.gods,
      strong ? sy.strong : sy.weak,
      `${why[0]}. ${
        verdict === "대길" || verdict === "길"
          ? "올해의 흐름이 그대 편이니, 미뤄 둔 일을 올해 시작하시옵소서."
          : verdict === "평"
            ? "하늘이 크게 밀어주지도 막지도 않는 해이니, 그대의 준비가 곧 결과가 되옵니다."
            : "올해는 넓히기보다 지키는 해이옵니다. 무리한 확장보다 내실을 다지면, 다음 해에 크게 돌려받사옵니다."
      }`,
      ...meetLines,
      ...yearSals.map((s) => SAL_YEAR[s]),
    ],
    basis: [
      `세운 丙午 · 천간 丙 = ${yearGods[0]}, 지지 午 = ${yearGods[1]}`,
      `일간 ${STEMS[p.dayStem]}의 午 자리 12운성: ${stage}`,
      ...(yearSals.length ? [`올해의 신살: ${yearSals.join(", ")}`] : []),
    ],
  };

  const sections: YearSection[] = [core, overall];

  // ── 대운
  if (now) {
    const g = GROUP_OF[tenGod(p.dayStem, now.stem)];
    const fit = elScore(r, stemEl(now.stem)) + elScore(r, BRANCH_EL[now.branch]);
    const turning = now.to === 2026 || now.from === 2026;
    sections.push({
      id: "daeun",
      hanja: "運",
      label: "10년 대운",
      headline: turning
        ? now.to === 2026
          ? "10년 대운이 바뀌는 문턱의 해, 올해의 선택이 다음 10년을 정하옵니다"
          : "새 10년 대운이 막 열린 해, 판이 바뀌는 첫걸음이옵니다"
        : `${now.from}년부터 이어진 ${g}의 10년, 그 한가운데를 지나고 있사옵니다`,
      paras: [
        `지금의 대운은 ${STEMS[now.stem]}${BRANCHES[now.branch]}(${now.from}~${now.to}년)이옵니다. ${DAEUN_GROUP[g]}`,
        fit >= 2 ? DAEUN_FIT.good : fit <= -2 ? DAEUN_FIT.bad : DAEUN_FIT.mid,
        ...(turning && next
          ? [
              `${next.from}년부터는 ${STEMS[next.stem]}${BRANCHES[next.branch]} 대운으로 넘어가옵니다. ${DAEUN_GROUP[GROUP_OF[tenGod(p.dayStem, next.stem)]].replace("지금 그대는", "앞으로 그대는").replace("지나고 있사옵니다", "맞게 되옵니다")} 대운이 바뀌는 해 앞뒤로는 이사, 이직, 관계처럼 삶의 판이 흔들리기 쉬우니, 버릴 것과 가져갈 것을 올해 가려 두시옵소서.`,
            ]
          : []),
      ],
      basis: [`대운 ${STEMS[now.stem]}${BRANCHES[now.branch]} · 천간 ${tenGod(p.dayStem, now.stem)} · ${now.from}~${now.to}년`],
    });
  }

  // ── Areas of life, each sharpened by where the year's four transformations land in the palace chart.
  const kinds: Record<string, string[]> = {};
  if (palaces)
    for (const [star, kind] of YEAR_MUTAGEN) {
      const at = palaceOf(palaces, star);
      if (at) (kinds[at] ??= []).push(kind);
    }
  const hits: Record<string, string> = Object.fromEntries(Object.entries(kinds).map(([at, k]) => [at, palaceLine(at, k)]));
  const hitsFor = (...names: string[]) => names.flatMap((n) => (hits[n] ? [hits[n]] : []));

  const wealthNatal = r.gods.재성 === 0 ? "그대의 원국에는 재성이 드러나 있지 않사옵니다. 돈을 좇기보다 실력과 이름을 쌓을 때 재물이 뒤따라오는 팔자이옵니다." : r.gods.재성 >= 3 ? "원국에 재성이 두터워 돈 냄새를 잘 맡는 사람이옵니다. 문제는 버는 것이 아니라 지키는 것이옵니다." : "";
  sections.push({
    id: "money",
    hanja: "財",
    label: "재물운",
    headline: sy.money.h,
    paras: [sy.money.t, ...(wealthNatal ? [wealthNatal] : []), ...hitsFor("재백", "전택")],
    basis: [`원국 재성 ${r.gods.재성}자 · 올해 ${yearGroup === "재성" ? "재성이 직접 드는 해" : `${yearGroup}이 드는 해`}`],
  });
  sections.push({
    id: "work",
    hanja: "官",
    label: "일과 명예",
    headline: sy.work.h,
    paras: [sy.work.t, ...hitsFor("관록", "명궁")],
    basis: [`격국 ${GYEOK_NAME[r.gyeok]} · 원국 관성 ${r.gods.관성}자`],
  });

  const dayMeet = meetings(YEAR.branch, p.dayBranch)[0];
  const spouseGroup: GodGroup | null = profile?.gender === "m" ? "재성" : profile?.gender === "f" ? "관성" : null;
  const loveExtra = [
    ...(dayMeet === "육합" || dayMeet === "삼합" || dayMeet === "방합"
      ? ["올해의 기운이 그대의 배우자 자리와 손을 잡으니, 짝을 만나거나 관계가 한층 깊어지기 좋은 해이옵니다."]
      : dayMeet === "충"
        ? ["올해의 기운이 그대의 배우자 자리를 흔드니, 관계가 크게 바뀌는 해이옵니다. 오래 묵은 문제는 올해 터지기 쉬우니 미리 풀어 두시옵소서."]
        : []),
    ...(spouseGroup && (yearGroup === spouseGroup || GROUP_OF[yearGods[1]] === spouseGroup)
      ? [`그대에게 인연의 별(${spouseGroup})이 올해 직접 들어오니, 새 인연이든 결혼이든 짝의 일이 움직이는 해이옵니다.`]
      : []),
    ...(yearSals.includes("도화") ? ["게다가 올해는 도화까지 들어 인기가 오르니, 좋은 사람을 고르는 눈만 있으면 되옵니다."] : []),
  ];
  sections.push({
    id: "love",
    hanja: "緣",
    label: "연애와 인연",
    headline: sy.love.h,
    paras: [sy.love.t, ...loveExtra, ...hitsFor("부처")],
    basis: [`배우자 자리(일지) ${BRANCHES[p.dayBranch]} · 올해 午와 ${dayMeet ?? "특별한 작용 없음"}`],
  });
  sections.push({
    id: "people",
    hanja: "人",
    label: "사람과 관계",
    headline: sy.people.h,
    paras: [sy.people.t, ...hitsFor("노복", "형제", "부모")],
    basis: [`원국 비겁 ${r.gods.비겁}자 · 인성 ${r.gods.인성}자`],
  });

  const weakest = [0, 1, 2, 3, 4].reduce((a, b) => (r.weights[b] < r.weights[a] ? b : a));
  const hot = r.weights[FIRE] / r.weights.reduce((a, b) => a + b, 0) > 0.25;
  sections.push({
    id: "health",
    hanja: "身",
    label: "건강",
    headline: sy.health.h,
    paras: [
      sy.health.t,
      `사주 전체로 보면 ${EL(weakest)} 기운이 가장 여리니, ${ELEMENT_HEALTH[weakest]}이 평생의 약한 고리이옵니다.${hot ? " 원국에 이미 불이 많은데 불의 해가 겹치니, 올해는 특히 열과 염증을 다스리셔야 하옵니다." : ""}`,
      ...hitsFor("질액", "복덕"),
    ],
    basis: [`가장 약한 오행 ${EL(weakest)} · 원국 화(火) 비율 ${pct(r.weights, FIRE)}%`],
  });

  const moveLines = [
    ...(meetTags.has("충") ? ["올해는 원국과 부딪치는 기운이 있어, 한자리에 머물기보다 움직이며 길을 찾게 되옵니다."] : []),
    ...(natalSals.includes("역마") ? ["사주에 역마가 있으니, 올해의 변동을 두려워 말고 먼 곳, 새 무대로 나서 보시옵소서."] : []),
    ...hitsFor("천이"),
  ];
  if (moveLines.length)
    sections.push({ id: "move", hanja: "驛", label: "이동과 변화", headline: "자리를 옮겨야 운이 트이는 해", paras: moveLines, basis: [] });

  // ── Months
  const seen: Record<string, number> = {};
  const months: MonthRow[] = MONTHS.map((m) => {
    const s = elScore(r, stemEl(m.stem)) + elScore(r, BRANCH_EL[m.branch]) * 1.2;
    const ms = meetings(m.branch, p.dayBranch);
    const tags: string[] = [];
    let adj = 0;
    const mark = (tag: string, delta: number) => {
      tags.push(tag);
      adj += delta;
    };
    if (ms.includes("충")) mark("변동", -1.2);
    if (ms.includes("육합") || ms.includes("삼합")) mark("인연·약속", 0.8);
    if (salsAt(p, m.branch).includes("천을귀인")) mark("귀인", 1);
    if (stemCombine(m.stem, p.dayStem)) mark("합", 0.5);
    const total = s + adj;
    const rating = (total >= 2 ? 3 : total >= 0 ? 2 : total > -2.5 ? 1 : 0) as MonthRow["rating"];
    const g = GROUP_OF[tenGod(p.dayStem, m.stem)];
    // The second month of the same kind gets the other wording.
    const tone = rating >= 2 ? "good" : "bad";
    const n = (seen[g + tone] = (seen[g + tone] ?? -1) + 1);
    return { from: m.from, gz: `${STEMS[m.stem]}${BRANCHES[m.branch]}`, rating, line: MONTH_LINE[g][tone][n % 2], tags, score: total } as MonthRow & { score: number };
  });
  const order = months.map((m, i) => ({ i, s: (m as MonthRow & { score: number }).score })).sort((a, b) => b.s - a.s);
  const best = order.slice(0, 2).map((o) => o.i).sort((a, b) => a - b);
  const worst = order.slice(-2).map((o) => o.i).sort((a, b) => a - b);

  const lucky = { ...LUCKY[r.yong], avoid: LUCKY[r.gi].color, element: r.yong };
  const monthName = (i: number) => `${MONTHS[i].from.split("/")[0]}월`;
  // The one warning worth repeating: where the year's 忌 lands, if the palace chart is known.
  const warn = Object.entries(kinds).find(([, k]) => k.includes("기"));
  const advice = [
    `승부는 ${best.map(monthName).join("과 ")}에 거시옵소서. 기운이 가장 그대 편인 달이옵니다.`,
    `${worst.map(monthName).join("과 ")}에는 큰 결정을 미루고 숨을 고르시옵소서.`,
    warn ? hits[warn[0]].replace(/^다만 /, "") : `${lucky.color}을 가까이하고 ${lucky.act}에 힘쓰시면 올해의 기운이 그대 쪽으로 기우옵니다.`,
  ];

  const keywords = [
    `#${{ 비겁: "독립과경쟁", 식상: "재능발산", 재성: "재물운", 관성: "승진과책임", 인성: "문서와계약" }[yearGroup]}`,
    ...(yearSals.includes("천을귀인") ? ["#귀인"] : []),
    ...(meetTags.has("충") ? ["#변동"] : meetTags.has("육합") || meetTags.has("삼합") ? ["#인연"] : []),
    ...(now && (now.to === 2026 || now.from === 2026) ? ["#전환점"] : []),
    ...(yearSals.includes("도화") ? ["#인기"] : []),
    ...(verdict === "대길" || verdict === "길" ? [`#${verdict}`] : []),
  ].slice(0, 4);

  return {
    verdict,
    headline: sy.headline,
    keywords,
    sections,
    months: months.map(({ from, gz, rating, line, tags }) => ({ from, gz, rating, line, tags })),
    best,
    worst,
    lucky,
    advice,
    missing: { daeun: !daeun, palaces: !palaces },
    chart: { slots: chartOf(full), elements: r.elements, strength: r.strength, yong: r.yong, missing: r.missing, gyeok: GYEOK_NAME[r.gyeok] },
  };
}

// Just the verdict, for the report shelf teaser.
export function yearPreview(p: Pillars) {
  return { verdict: yearReading(p, null)?.verdict ?? "평" };
}

