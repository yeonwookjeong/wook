import { josa } from "./josa";
import { meetings, stemClash, stemCombine, type Meeting } from "./deep";
import { ELEMENT_HANJA, ELEMENT_KO, GROUP_OF, readChart, stemEl, tenGod, type GodGroup } from "./myeongri";
import type { Person } from "./pairToken";
import { BRANCHES, STEMS } from "./saju";
import { monthMarks, monthsOf } from "./yeonun";

// Two people in a 사랑방 (lib/ask.ts RoomPerson), read for what they are to each other: a lover, family, someone
// at work, a friend. Everything here is worked out from the two charts, so the verdict card, the pictures and
// what 정 훈도 is told agree. The other person is only ever called by the name the guest gave them.

import { halfCombine, RELS, REL_LABEL, SEAT_NAME, seatOf, type Rel } from "./rels";
export { RELS, REL_LABEL, type Rel };

// Rooms from before the choice: read from what the guest calls them.
export function relOf(rel: string | undefined, label: string): Rel {
  if (rel && (RELS as readonly string[]).includes(rel)) return rel as Rel;
  if (/팀장|상사|부장|과장|대리|사장|대표|동업|동료|직원|거래|파트너|선배|후배|회사|클라이언트/.test(label)) return "일";
  if (/엄마|아빠|어머니|아버지|부모|형|누나|언니|오빠|동생|아들|딸|가족|시어|장모|장인|할머니|할아버지/.test(label)) return "가족";
  if (/친구|동창|베프/.test(label)) return "친구";
  return "연인";
}

// Which seat of the chart each relation lives in.
const SEAT: Record<Rel, { pos: "dayBranch" | "monthBranch" | "yearBranch"; name: string }> = {
  연인: { pos: "dayBranch", name: "배우자 자리" },
  일: { pos: "monthBranch", name: "일터 자리" },
  가족: { pos: "yearBranch", name: "집안 자리" },
  친구: { pos: "monthBranch", name: "바깥 자리" },
};

const MEET_LINE: Partial<Record<Meeting, [string, boolean]>> = {
  육합: ["합: 함께 있으면 편하고 정이 깊어져요", true],
  삼합: ["반합: 같은 곳을 바라봐요", true],
  충: ["충: 끌림만큼 부딪힘도 커요", false],
  형: ["형: 가까울수록 날이 서요", false],
  원진: ["원진: 이유 없이 서운함이 쌓여요", false],
};
// The bought 궁합 (plain): outside lovers, no 끌림·정 (2026-10-25 강 어사 기준), and only a 반합 with its 왕지.
const PLAIN_MEET: Partial<Record<Meeting, [string, boolean]>> = {
  육합: ["합: 같이 있을 때 편하고 손발이 잘 맞아요", true],
  삼합: ["반합: 같은 쪽을 보며 일하기 쉬워요", true],
  충: ["충: 가까이 붙어 지낼수록 생활 방식이 부딪히기 쉬워요", false],
  형: ["형: 가까울수록 날이 서기 쉬워요", false],
  원진: ["원진: 서운함이 쌓이기 쉬워요", false],
};

// What each ten-god group is to the other, by relation (what they are to me).
export const ROLE: Record<Rel, Record<GodGroup, string>> = {
  연인: {
    비겁: "친구처럼 대등하게 맞서는 사람",
    식상: "내가 챙기고 표현하게 되는 사람",
    재성: "내가 이끌고 곁에 두고 싶은 사람",
    관성: "나를 긴장시키고 바로잡아 주는 사람",
    인성: "나를 품어 주고 기대게 되는 사람",
  },
  일: {
    비겁: "같은 결로 경쟁하며 함께 뛰는 사람",
    식상: "내가 가르치고 키워 주게 되는 사람",
    재성: "내가 부리고 맡기게 되는 사람",
    관성: "나를 관리하고 평가하는 사람",
    인성: "나를 밀어주고 뒷받침하는 사람",
  },
  가족: {
    비겁: "형제처럼 맞서고 기대는 사람",
    식상: "내가 돌보고 베풀게 되는 사람",
    재성: "내가 책임지고 챙겨야 하는 사람",
    관성: "나를 붙잡고 잔소리하는 사람",
    인성: "나를 감싸 주는 사람",
  },
  친구: {
    비겁: "어깨를 나란히 하는 동무",
    식상: "내가 웃게 하고 챙기는 사람",
    재성: "함께 일을 벌이기 좋은 사람",
    관성: "나를 정신 차리게 해 주는 사람",
    인성: "고민을 털어놓게 되는 사람",
  },
};

// The heaviest group in a chart, read as what that person brings to this kind of bond.
const BRINGS: Record<Rel, Record<GodGroup, string>> = {
  연인: { 비겁: "자기 주관", 식상: "표현과 다정함", 재성: "현실 감각", 관성: "책임감", 인성: "깊은 생각" },
  일: { 비겁: "추진·영업", 식상: "아이디어·말", 재성: "셈·돈 관리", 관성: "관리·규칙", 인성: "기획·공부" },
  가족: { 비겁: "고집", 식상: "살가움", 재성: "살림 감각", 관성: "책임감", 인성: "포용" },
  친구: { 비겁: "의리", 식상: "재미", 재성: "실속", 관성: "믿음직함", 인성: "들어 주는 귀" },
};

const EL = (e: number) => `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`;
export type Grade = 0 | 1 | 2; // △ 조심 · ○ 보통 · ◎ 좋음
export const GRADE_MARK = ["△", "○", "◎"] as const;

export type BondMonth = {
  label: string;
  from: string;
  me: number;
  them: number;
  both: "함께 좋음" | "한쪽 흔들림" | "함께 조심" | "무난";
  meet: string | null;
  now: boolean;
};
export type Bond = {
  rel: Rel;
  label: string;
  me: { ilju: string; el: number; brings: string };
  them: { ilju: string; el: number; brings: string };
  roles: [string, string]; // what they are to me, what I am to them
  seat: { name: string; line: string | null; good: boolean | null };
  lends: string[];
  rows: { label: string; grade: Grade; line: string }[];
  verdict: string;
  months: BondMonth[];
  years: { year: number; gz: string; mark: string; why: string }[];
};

const heavy = (godWeights: Record<GodGroup, number>): GodGroup =>
  (Object.keys(godWeights) as GodGroup[]).reduce((a, b) => (godWeights[b] > godWeights[a] ? b : a));

// plain: the 궁합 report's figures, where the seats go by the letter's place (lib/rels.ts SEAT_NAME), not by role.
export function bondOf(me: Person, them: Person, label: string, relIn: string | undefined, at: number, plain = false): Bond | null {
  const ra = readChart(me.pillars);
  const rb = readChart(them.pillars);
  if (!ra || !rb) return null;
  const rel = relOf(relIn, label);
  const a = me.pillars;
  const b = them.pillars;
  const theyToMe = GROUP_OF[tenGod(a.dayStem, b.dayStem)];
  const meToThem = GROUP_OF[tenGod(b.dayStem, a.dayStem)];
  const ha = heavy(ra.godWeights);
  const hb = heavy(rb.godWeights);
  const seatA = seatOf(a, rel);
  const seatB = seatOf(b, rel);
  const lines = plain && rel !== "연인" ? PLAIN_MEET : MEET_LINE;
  const seatName = plain ? SEAT_NAME[rel] : SEAT[rel].name;
  const meet = meetings(seatA, seatB).find((m) => lines[m] && (!plain || m !== "삼합" || halfCombine(seatA, seatB)));
  const seatLine = meet ? `${seatName}끼리 ${lines[meet]![0]}` : null;
  const seatGood = meet ? lines[meet]![1] : null;

  // Elements one has plenty of and the other lacks.
  const share = (w: number[]) => {
    const s = w.reduce((x, y) => x + y, 0) || 1;
    return w.map((v) => v / s);
  };
  const sa = share(ra.weights);
  const sb = share(rb.weights);
  const lends: string[] = [];
  for (let e = 0; e < 5; e++) {
    if (sa[e] < 0.08 && sb[e] >= 0.2) lends.push(`나에게 모자란 ${EL(e)} 기운을 ${josa(label, "이/가")} ${Math.round(sb[e] * 100)}% 채워 줘요`);
    if (sb[e] < 0.08 && sa[e] >= 0.2) lends.push(`${label}에게 모자란 ${EL(e)} 기운을 내가 ${Math.round(sa[e] * 100)}% 채워 줘요`);
  }
  const stemTie = stemCombine(a.dayStem, b.dayStem);
  const stemFight = stemClash(a.dayStem, b.dayStem);
  const conflict: Grade = seatGood === false || stemFight ? 0 : (ha === "비겁" && hb === "비겁") || (theyToMe === "관성" && !stemTie) ? 1 : 2;
  const conflictLine = [
    seatGood === false && seatLine,
    stemFight && "일간끼리 충: 결정할 때 맞서기 쉬워요",
    conflict === 1 && "둘 다 물러서기 어려운 기운",
  ].filter(Boolean)[0] as string | undefined;

  const rows: Bond["rows"] = [];
  if (rel === "일") {
    const complement = ha !== hb;
    rows.push({
      label: "역할 궁합",
      grade: complement && theyToMe !== "관성" ? 2 : complement ? 1 : 0,
      line: complement ? `나는 ${BRINGS.일[ha]}, ${josa(label, "은/는")} ${BRINGS.일[hb]}` : `둘 다 ${BRINGS.일[ha]} 쪽이라 역할이 겹쳐요`,
    });
    const money: Grade = (ha === "식상" && hb === "재성") || (ha === "재성" && hb === "식상") ? 2 : ha === "비겁" || hb === "비겁" ? 0 : 1;
    rows.push({
      label: "돈 궁합",
      grade: money,
      line: money === 2 ? "한 사람이 벌이고 한 사람이 거두는 짝" : money === 0 ? "몫을 나눌 때 셈법이 달라 부딪혀요" : "돈 이야기는 미리 정해 두면 무난해요",
    });
    rows.push({ label: "갈등 위험", grade: conflict, line: conflict === 2 ? "부딪힐 자리가 적어요" : (conflictLine ?? "주도권을 두고 부딪히기 쉬워요") });
  } else {
    const pull: Grade = stemTie || seatGood === true ? 2 : 1;
    rows.push({
      label: rel === "연인" ? "끌림" : "편안함",
      grade: pull,
      line: stemTie ? "일간끼리 합: 마음이 묶이는 사이" : seatGood === true ? seatLine! : `${josa(label, "은/는")} ${ROLE[rel][theyToMe]}`,
    });
    rows.push({
      label: "서로 채워 줌",
      grade: lends.length ? 2 : ha !== hb ? 1 : 0,
      line:
        lends[0] ??
        (ha !== hb ? `나는 ${BRINGS[rel][ha]}, ${josa(label, "은/는")} ${BRINGS[rel][hb]}` : `둘 다 ${josa(BRINGS[rel][ha], "이/가")} 강해 닮은꼴이에요`),
    });
    rows.push({ label: "갈등 위험", grade: conflict, line: conflict === 2 ? "크게 부딪힐 자리가 적어요" : (conflictLine ?? "자존심이 맞서기 쉬워요") });
  }

  // The months ahead, for both: good for both, one shaken, or both careful; and the month meeting their seats.
  const kst = new Date(at + 9 * 3600000);
  const y = kst.getUTCFullYear();
  const all = [y - 1, y, y + 1].flatMap((yy) => {
    const ma = monthMarks(a, ra, yy);
    const mb = monthMarks(b, rb, yy);
    return monthsOf(yy).map((m, i) => {
      const [mm, dd] = m.from.split("/").map(Number);
      const year = mm === 1 && i > 0 ? yy + 1 : yy;
      return { t: Date.UTC(year, mm - 1, dd), mm, from: m.from, branch: m.branch, me: ma[i].rating, them: mb[i].rating, year };
    });
  });
  const nowT = Date.UTC(y, kst.getUTCMonth(), kst.getUTCDate());
  const start = Math.max(
    0,
    all.findLastIndex((m) => m.t <= nowT),
  );
  const months: BondMonth[] = all.slice(start, start + 6).map((m, i) => {
    const lo = Math.min(m.me, m.them);
    const hi = Math.max(m.me, m.them);
    const ka = meetings(m.branch, seatA);
    const kb = meetings(m.branch, seatB);
    const meetLine =
      ka.includes("충") || kb.includes("충")
        ? "부딪힘"
        : (ka.includes("육합") || ka.includes("삼합")) && (kb.includes("육합") || kb.includes("삼합"))
          ? "가까워짐"
          : null;
    return {
      label: `${m.year !== y ? "내년 " : ""}${m.mm}월`,
      from: m.from,
      me: m.me,
      them: m.them,
      both: lo >= 2 ? "함께 좋음" : lo <= 1 && hi <= 1 ? "함께 조심" : hi >= 2 && lo <= 1 ? "한쪽 흔들림" : "무난",
      meet: meetLine,
      now: i === 0,
    };
  });
  const best = months.find((m) => m.both === "함께 좋음" && m.meet !== "부딪힘") ?? months.find((m) => m.both === "함께 좋음");
  rows.push({
    label: "가까운 때",
    grade: best ? 2 : 0,
    line: best ? `${best.label}(${best.from}~) 두 사람 모두 좋은 달` : "여섯 달 안에 둘 다 좋은 달은 없어요. 서두르지 않기",
  });

  // Years ahead that shake or pull the two seats.
  const years: Bond["years"] = [];
  for (let yy = y; yy <= y + 4; yy++) {
    const yb = (((yy - 4) % 12) + 12) % 12;
    const gz = `${STEMS[(((yy - 4) % 10) + 10) % 10]}${BRANCHES[yb]}`;
    const clashA = meetings(yb, seatA).includes("충");
    const clashB = meetings(yb, seatB).includes("충");
    const joins = (s: number) => meetings(yb, s).some((m) => m === "육합" || m === "삼합");
    if (clashA || clashB)
      years.push({ year: yy, gz, mark: "흔들리기 쉬운 해", why: `${[clashA && "나", clashB && label].filter(Boolean).join("·")}의 ${seatName}를 충` });
    else if (joins(seatA) && joins(seatB)) years.push({ year: yy, gz, mark: "함께 좋은 해", why: `두 사람의 ${seatName}와 모두 합` });
  }

  const good = rows.filter((r) => r.grade === 2).length;
  const bad = rows.filter((r) => r.grade === 0);
  const TIP: Record<string, string> = {
    "역할 궁합": "역할을 먼저 나누면",
    "돈 궁합": "역할과 몫을 문서로 나누면",
    "갈등 위험": "부딪히는 지점을 미리 정해 두면",
    끌림: "천천히 마음을 열면",
    편안함: "자주 얼굴을 보면",
    "서로 채워 줌": "서로 다른 점을 인정하면",
    "가까운 때": "때를 기다리면",
  };
  const kind = rel === "일" ? "동업·협업" : rel === "연인" ? "인연" : rel === "가족" ? "가족 사이" : "벗";
  const verdict =
    bad.length === 0 && good >= 3
      ? `잘 맞는 ${josa(kind, "이에요/예요")}`
      : bad.length >= 2
        ? `${TIP[bad[0].label] ?? "조심하면"} 버틸 수 있는 ${josa(kind, "이에요/예요")}`
        : `${TIP[bad[0]?.label] ?? "서로 맞춰 가면"} 좋은 ${josa(kind, "이에요/예요")}`;

  return {
    rel,
    label,
    me: { ilju: `${STEMS[a.dayStem]}${BRANCHES[a.dayBranch]}`, el: stemEl(a.dayStem), brings: BRINGS[rel][ha] },
    them: { ilju: `${STEMS[b.dayStem]}${BRANCHES[b.dayBranch]}`, el: stemEl(b.dayStem), brings: BRINGS[rel][hb] },
    roles: [ROLE[rel][theyToMe], ROLE[rel][meToThem]],
    seat: { name: seatName, line: seatLine, good: seatGood },
    lends,
    rows,
    verdict,
    months,
    years,
  };
}

// For 정 훈도: the same numbers the card and the pictures show.
export function bondBrief(x: Bond): string {
  return [
    `■ 나와 ${x.label}의 관계 판정 (관계: ${REL_LABEL[x.rel]}) — 답서 맨 위 판정 카드에 그대로 보인다`,
    `- 한 줄 판정: ${x.verdict}`,
    ...x.rows.map((r) => `- ${r.label} ${GRADE_MARK[r.grade]}: ${r.line}`),
    `- ${josa(x.label, "은/는")} 나에게 ${x.roles[0]} / 나는 ${x.label}에게 ${x.roles[1]}`,
    `- 내가 가져오는 것: ${x.me.brings} / ${josa(x.label, "이/가")} 가져오는 것: ${x.them.brings}`,
    x.seat.line ? `- ${x.seat.line}` : `- ${x.seat.name}끼리 특별한 합·충은 없음`,
    ...x.lends.map((l) => `- ${l}`),
    `- 두 사람의 여섯 달: ${x.months.map((m) => `${m.label} ${m.both}${m.meet ? `(${m.meet})` : ""}`).join(", ")}`,
    ...x.years.map((y) => `- ${y.year} ${y.gz}: ${y.mark} (${y.why})`),
  ].join("\n");
}
