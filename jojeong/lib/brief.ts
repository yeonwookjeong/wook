import { gongmang, isBaekho, isGoegang, meetings, salsAt, stageOf, stemClash, stemCombine } from "./deep";
import { chartOf, ELEMENT_HANJA, ELEMENT_KO, GYEOK_NAME, HIDDEN, readChart, stemEl, tenGod } from "./myeongri";
import { selfStars, type Profile } from "./profile";
import { distinctOf, perHundred } from "./rarity";
import { BRANCHES, isFull, matchPillars, STEMS, type Pillars } from "./saju";
import { MONTHS, YEAR, yearReading } from "./yearly";

// A plain-text "chart brief": everything the engine worked out about one person, laid out for the writer of
// the reports (lib/reportWriter.ts). The writer interprets; it never calculates.

const EL = (e: number) => `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`;
const GZ = (s: number, b: number) => `${STEMS[s]}${BRANCHES[b]}`;
const POS_NAME = { 연: "연주(뿌리·집안·어린 시절)", 월: "월주(부모·사회·일터)", 일: "일주(나 자신·배우자 자리)", 시: "시주(자녀·말년·계획)" };

// 60-year cycle position → the most likely birth year for someone alive now (1936–2025).
function guessYear(p: Pillars): number | null {
  if (p.yearStem === undefined) return null;
  for (let y = 2025; y >= 1936; y--) if ((y - 4) % 10 === p.yearStem && (y - 4) % 12 === p.yearBranch) return y;
  return null;
}

export function birthYearOf(p: Pillars, profile: Profile | null): { year: number; certain: boolean } | null {
  if (profile?.birthYear) return { year: profile.birthYear, certain: true };
  const y = guessYear(p);
  return y ? { year: y, certain: false } : null;
}

export function chartBrief(name: string, p: Pillars, profile: Profile | null): string {
  const r = readChart(p);
  if (!r || !isFull(p)) return `${name}: 여덟 글자가 온전하지 않은 옛 기록(일주 ${GZ(p.dayStem, p.dayBranch)}, 띠 ${BRANCHES[p.yearBranch]})`;
  const lines: string[] = [];
  const by = birthYearOf(p, profile);
  lines.push(`■ ${name}`);
  lines.push(
    `- 기본: ${profile?.gender === "m" ? "남성" : profile?.gender === "f" ? "여성" : "성별 미상"}, ${
      by ? `${by.year}년생${by.certain ? "" : "(추정)"}, 2026년 만 ${2026 - by.year - 1}~${2026 - by.year}세` : "나이 미상"
    }, 태어난 시각 ${p.hourBranch === null ? "모름(시주 없음)" : "앎"}`,
  );
  lines.push(...distinctLines(p, profile));
  const slots = chartOf(p);
  lines.push("- 원국 (시·일·월·연):");
  for (const s of slots) {
    if (s.stem === null || s.branch === null) {
      lines.push(`  · ${POS_NAME[s.pos]}: 모름`);
      continue;
    }
    const stemGod = s.pos === "일" ? "일간(나)" : tenGod(p.dayStem, s.stem);
    const hidden = HIDDEN[s.branch].map(([h]) => `${STEMS[h]}(${tenGod(p.dayStem, h)})`).join(" ");
    lines.push(
      `  · ${POS_NAME[s.pos]}: ${GZ(s.stem, s.branch)} — 천간 ${STEMS[s.stem]}=${stemGod}, 지지 ${BRANCHES[s.branch]}=${tenGod(p.dayStem, HIDDEN[s.branch].at(-1)![0])}, 지장간 ${hidden}, 12운성 ${stageOf(p.dayStem, s.branch)}`,
    );
  }
  const sum = r.weights.reduce((a, b) => a + b, 0);
  lines.push(`- 오행 비율(궁성·조후 보정): ${[0, 1, 2, 3, 4].map((e) => `${EL(e)} ${Math.round((100 * r.weights[e]) / sum)}%`).join(", ")}${r.weights.some((w) => w === 0) ? ` / 없는 오행: ${[0, 1, 2, 3, 4].filter((e) => r.weights[e] === 0).map(EL).join(", ")}` : ""}`);
  const gsum = Object.values(r.godWeights).reduce((a, b) => a + b, 0);
  lines.push(`- 십신 비중: ${Object.entries(r.godWeights).map(([g, w]) => `${g} ${Math.round((100 * w) / gsum)}%`).join(", ")}`);
  lines.push(`- 일간: ${STEMS[p.dayStem]}${ELEMENT_HANJA[stemEl(p.dayStem)]} / 태어난 계절: ${r.season}`);
  lines.push(`- 신강약: ${r.balanced ? "중화에 가까운 " : ""}${r.strength} (일간을 돕는 기운 ${Math.round(r.support * 100)}%)`);
  lines.push(
    `- 용신 ${EL(r.yong)} (${
      r.method === "종격"
        ? `${r.outer}: 일간이 뿌리 없이 한 기운에 압도되어 그 흐름을 따르는 외격. 억부로는 ${EL(r.eokbu)}였으나 종격으로 봄`
        : r.method === "조후"
          ? `조후 우선, 억부로는 ${EL(r.eokbu)}`
          : "억부"
    }), 희신 ${EL(r.hee)}, 기신 ${EL(r.gi)}${r.burden !== null ? `, 병을 키우는 부담 ${EL(r.burden)}` : ""}`,
  );
  lines.push(`- 합(오행 계산에 반영됨): ${r.bonds.length ? r.bonds.join("; ") : "없음"}`);
  lines.push(`- 격국: ${GYEOK_NAME[r.gyeok]}`);
  const sals = [
    ...new Set(slots.flatMap((s) => (s.branch === null ? [] : salsAt(p, s.branch).map((x) => `${x}(${s.pos}지)`)))),
    ...(isGoegang(p) ? ["괴강(일주)"] : []),
    ...(isBaekho(p) ? ["백호(일주)"] : []),
  ];
  lines.push(`- 신살: ${sals.length ? sals.join(", ") : "두드러진 것 없음"} / 공망 ${gongmang(p).map((b) => BRANCHES[b]).join("")}`);
  // Relations inside the chart.
  const inner: string[] = [];
  const br = slots.filter((s) => s.branch !== null);
  for (let i = 0; i < br.length; i++)
    for (let j = i + 1; j < br.length; j++) {
      const m = meetings(br[i].branch!, br[j].branch!);
      if (m.length) inner.push(`${br[i].pos}지${BRANCHES[br[i].branch!]}-${br[j].pos}지${BRANCHES[br[j].branch!]} ${m.join("·")}`);
    }
  const st = slots.filter((s) => s.stem !== null);
  for (let i = 0; i < st.length; i++)
    for (let j = i + 1; j < st.length; j++) {
      if (stemCombine(st[i].stem!, st[j].stem!)) inner.push(`${st[i].pos}간${STEMS[st[i].stem!]}-${st[j].pos}간${STEMS[st[j].stem!]} 천간합`);
      if (stemClash(st[i].stem!, st[j].stem!)) inner.push(`${st[i].pos}간${STEMS[st[i].stem!]}-${st[j].pos}간${STEMS[st[j].stem!]} 천간충`);
    }
  lines.push(`- 원국 안의 합충: ${inner.length ? inner.join(", ") : "없음"}`);

  // 대운
  if (profile?.daeun?.length) {
    const cur = profile.daeun.find((d) => d.from <= 2026 && 2026 <= d.to);
    lines.push(
      `- 대운: ${profile.daeun
        .map((d) => `${GZ(d.stem, d.branch)}(${d.from}~${d.to}, ${tenGod(p.dayStem, d.stem)}/${tenGod(p.dayStem, HIDDEN[d.branch].at(-1)![0])})${d === cur ? "←현재" : ""}`)
        .join(" → ")}`,
    );
  } else lines.push("- 대운: 성별을 몰라 계산하지 않음");

  // 2026
  const y = yearReading(p, profile);
  const yearMeet = br.flatMap((s) => {
    const m = meetings(YEAR.branch, s.branch!);
    return m.length ? [`${s.pos}지${BRANCHES[s.branch!]}와 ${m.join("·")}`] : [];
  });
  lines.push(
    `- 2026 병오(丙午)년: 丙=${tenGod(p.dayStem, 2)}, 午=${tenGod(p.dayStem, 3)}; 午 자리 12운성 ${stageOf(p.dayStem, 6)}; 원국과 ${yearMeet.length ? yearMeet.join(", ") : "특별한 합충 없음"}${
      stemCombine(2, p.dayStem) ? "; 丙과 일간 천간합" : stemClash(2, p.dayStem) ? "; 丙과 일간 천간충" : ""
    }; 올해 신살 ${salsAt(p, 6).join(", ") || "없음"}; 엔진 판정 ${y?.verdict ?? "-"}`,
  );
  if (y)
    lines.push(
      `- 2026 월운(절기 기준, ◎좋음 ○무난 △조심 ✕고비): ${y.months
        .map((m, i) => `${MONTHS[i].from.split("/")[0]}월 ${m.gz} ${"✕△○◎"[m.rating]}${m.tags.length ? `(${m.tags.join(",")})` : ""}`)
        .join(", ")}`,
    );

  // 명반 (interpretive aid only)
  if (profile?.palaces) {
    const self = selfStars(profile.palaces);
    const pal = profile.palaces.map((x) => `${x.name}:${x.stars.join("·") || "공궁"}`).join(" / ");
    const natal = Object.entries(profile.natal ?? {})
      .map(([s, k]) => `${s}화${k}`)
      .join(", ");
    lines.push(`- [참고 전용 · 본문에 용어 언급 금지] 명반: 명궁 주성 ${self.join("·") || "없음"}; ${pal}; 생년사화 ${natal}; 2026 丙년 사화 천동록·천기권·문창과·염정기`);
  }
  // Element flow of the year for balance
  lines.push(`- 참고: 2026년 화(火) 기운은 이 사람에게 ${FIRE_ROLE(r.yong, r.hee, r.gi)}`);
  return lines.join("\n");
}

// What sets this chart apart from others with the same day pillar, rarest first, and past years worth naming.
function distinctLines(p: Pillars, profile: Profile | null): string[] {
  const d = distinctOf(p, profile?.gender ?? null);
  if (!d) return [];
  const lines = ["- ★ 이 사람만의 특징 (드문 순. 보고서는 이것부터 풀 것. '가이드'는 방향일 뿐, 이 사람의 다른 글자와 엮어 구체적으로 쓸 것):"];
  d.patterns.forEach((x, i) =>
    lines.push(`  ${i + 1}. [${x.term}] ${x.plain} — ${perHundred(x.rate)} · 영역 ${x.area} · 가이드: ${x.meaning}`),
  );
  if (d.extremes.length)
    lines.push(
      `- ★ 극단값: ${d.extremes
        .map((x) => `${x.label} ${Math.round(x.value * 100)}% (${x.side === "high" ? "상위" : "하위"} ${Math.max(1, Math.round(x.rate * 100))}%)`)
        .join(", ")}`,
    );
  if (d.ilju)
    lines.push(`- ★ 같은 일주 안에서: ${d.ilju.build} ${d.ilju.name}일주는 ${d.ilju.name}일주 가운데 약 ${Math.max(1, Math.round(d.ilju.rate * 100))}%`);
  const past = pastYears(p, profile);
  if (past.length) lines.push(`- ★ 과거 확인용 연도 (이 가운데 2~3개를 골라 '이 무렵 이런 일이 있었을 가능성이 커요'로 짚을 것):\n${past.map((x) => `  · ${x}`).join("\n")}`);
  return lines;
}

// Years since the late teens when the chart was shaken: a new decade (대운), the spouse seat or the
// month seat clashed, the spouse seat combined.
function pastYears(p: Pillars, profile: Profile | null): string[] {
  const by = birthYearOf(p, profile);
  if (!by) return [];
  const from = by.year + 16;
  const to = 2025;
  const gz = (y: number) => `${STEMS[(y - 4) % 10]}${BRANCHES[(y - 4) % 12]}`;
  const years = (branch: number) => {
    const out: number[] = [];
    for (let y = from; y <= to; y++) if ((y - 4) % 12 === branch) out.push(y);
    return out;
  };
  const marks: [number, string][] = [];
  for (const d of profile?.daeun ?? [])
    if (d.from >= from && d.from <= to)
      marks.push([d.from, `${d.from}년: 10년 대운이 ${GZ(d.stem, d.branch)}(${tenGod(p.dayStem, d.stem)}/${tenGod(p.dayStem, HIDDEN[d.branch].at(-1)![0])})로 바뀜. 일·관계·사는 곳 같은 삶의 판이 바뀌기 쉬운 해`]);
  for (const y of years((p.dayBranch + 6) % 12).slice(-2)) marks.push([y, `${y}년 ${gz(y)}: 배우자 자리(일지)를 충. 연애·결혼·가까운 관계에 큰 변화`]);
  for (const y of years((13 - p.dayBranch) % 12).slice(-1)) marks.push([y, `${y}년 ${gz(y)}: 배우자 자리와 육합. 인연이 들어오거나 관계가 깊어지기 쉬운 해`]);
  if (p.monthBranch !== undefined)
    for (const y of years((p.monthBranch + 6) % 12).slice(-1)) marks.push([y, `${y}년 ${gz(y)}: 일터·집 자리(월지)를 충. 이직·이사·환경 변화`]);
  return marks.sort((a, b) => a[0] - b[0]).map(([, t]) => t + (by.certain ? "" : " (출생년 추정)"));
}

function FIRE_ROLE(yong: number, hee: number, gi: number) {
  if (yong === 1) return "용신";
  if (hee === 1) return "희신";
  if (gi === 1) return "기신";
  if ((gi + 4) % 5 === 1) return "구신(기신을 돕는 기운)";
  return "한신(크게 관여하지 않음)";
}

// Two people side by side (for 궁합-type reports).
export function pairBrief(aName: string, a: Pillars, bName: string, b: Pillars): string {
  const m = matchPillars(a, b);
  const f = m.facts;
  const facts = [
    `관계: ${bName}의 일간은 ${aName}에게 ${f.group}`,
    f.stemCombine && "일간 천간합",
    f.daySix && "일지 육합",
    f.dayThree && "일지 삼합(반합)",
    f.dayClash && "일지 충",
    f.dayWonjin && "일지 원진",
    f.yearSix && "띠 육합",
    f.yearThree && "띠 삼합",
    f.yearClash && "띠 충",
    f.hourSix && "시지 육합",
    f.hourClash && "시지 충",
    f.yong && `${bName}이 ${aName}의 용신 ${EL(f.yong.el)}을 ${f.yong.count}개, 기신을 ${f.yong.giCount}개 지님`,
  ].filter(Boolean);
  const rb = readChart(b);
  const ra = readChart(a);
  if (ra && rb) facts.push(`${aName}의 용신 ${EL(ra.yong)} / ${bName}의 용신 ${EL(rb.yong)}`);
  return `■ ${aName}–${bName} 궁합 (엔진 점수 ${m.score}점, 평균 69)\n- ${facts.join("\n- ")}`;
}
