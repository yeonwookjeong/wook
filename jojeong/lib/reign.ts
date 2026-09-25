import type { Pillars } from "./saju";

// Reads the king's pillars for the chronicle's verdicts: how long the king lives, what kind of
// ruler the king was, and how the king fared with the people, the court and enemies.
// Everything is deterministic and comes with a saju reason the page can quote.

// Branch elements: 子水 丑土 寅木 卯木 辰土 巳火 午火 未土 申金 酉金 戌土 亥水 (0 木 1 火 2 土 3 金 4 水)
const BRANCH_EL = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
const stemEl = (stem: number) => Math.floor(stem / 2);

type Rel = "인성" | "비겁" | "식상" | "재성" | "관성";
// Relation of `other` to `self` (the day master).
function rel(self: number, other: number): Rel {
  if (self === other) return "비겁";
  if ((other + 1) % 5 === self) return "인성";
  if ((self + 1) % 5 === other) return "식상";
  if ((self + 2) % 5 === other) return "재성";
  return "관성";
}

export const isClash = (a: number, b: number) => Math.abs(a - b) === 6;
const WONJIN = new Set(["0-7", "1-6", "2-9", "3-8", "4-11", "5-10"]);
export const isWonjin = (a: number, b: number) => WONJIN.has(`${Math.min(a, b)}-${Math.max(a, b)}`);
const isCombine = (a: number, b: number) => (a + b) % 12 === 1 || (a !== b && a % 4 === b % 4);

export function mix(x: number) {
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return (x ^ (x >>> 16)) >>> 0;
}
const hashOf = (p: Pillars, salt: number) =>
  mix(p.dayStem * 1009 + p.dayBranch * 101 + p.yearBranch * 13 + (p.hourBranch ?? 12) + salt * 7919);

type Factor = { weight: number; reason: string };
// Reasons that point the same way as the verdict, strongest first.
function reasonsFor(fs: Factor[], sign: number, fallback: string) {
  const picked = fs
    .filter((f) => Math.sign(f.weight) === sign)
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .map((f) => f.reason);
  return picked.length ? picked.slice(0, 2) : [fallback];
}

// ── Lifespan: the day branch is the king's body, clashes shake it. No smoothing — a short-lived chart dies young.

const LIFE_BY_REL: Record<Rel, Factor> = {
  인성: { weight: 2, reason: "일지(日支)가 일간을 생(生)하여 뿌리가 깊사옵니다" },
  비겁: { weight: 1, reason: "일지가 일간과 같은 기운이라 버티는 힘이 있사옵니다" },
  식상: { weight: -1, reason: "일간의 기운이 일지로 새어 나가옵니다" },
  재성: { weight: -1, reason: "일간이 일지를 다스리느라 기운을 소모하옵니다" },
  관성: { weight: -2, reason: "일지가 일간을 극(剋)하니 몸이 상하기 쉽사옵니다" },
};

export function lifespan(p: Pillars) {
  const factors: Factor[] = [LIFE_BY_REL[rel(stemEl(p.dayStem), BRANCH_EL[p.dayBranch])]];
  if (isClash(p.dayBranch, p.yearBranch)) factors.push({ weight: -2, reason: "일지와 띠가 충(沖)하니 명이 흔들리옵니다" });
  else if (isWonjin(p.dayBranch, p.yearBranch)) factors.push({ weight: -1, reason: "일지와 띠가 원진(怨嗔)이라 속병이 깊사옵니다" });
  else if (isCombine(p.dayBranch, p.yearBranch)) factors.push({ weight: 1, reason: "일지와 띠가 합(合)하여 명을 받쳐 주옵니다" });
  if (p.hourBranch !== null) {
    if (isClash(p.dayBranch, p.hourBranch)) factors.push({ weight: -2, reason: "시지(時支)가 일지를 충하니 말년이 위태롭사옵니다" });
    else if (isCombine(p.dayBranch, p.hourBranch)) factors.push({ weight: 1, reason: "시지가 일지와 합하여 말년이 편안하옵니다" });
  }
  const score = factors.reduce((s, f) => s + f.weight, 0);
  const jitter = (hashOf(p, 1) % 17) - 8;
  const death = Math.max(14, Math.min(90, 47 + score * 7 + jitter));
  const verdict =
    score >= 2 ? "천수를 누릴 사주" : score >= 0 ? "명이 무난한 사주" : score >= -2 ? "명이 짧은 편인 사주" : "명이 매우 짧은 사주";
  const reasons =
    score >= 0
      ? reasonsFor(factors, 1, "명을 해치는 충(沖)이 없어 큰 탈 없이 사옵니다")
      : reasonsFor(factors, -1, "명을 받쳐 줄 기운이 모자라옵니다");
  return { death, verdict, reasons };
}

// ── Reign verdict: the zodiac (year branch) stands for the people, the day stem for the king.

export type Tier = "seong" | "myeong" | "pyeong" | "am" | "pok";
export const TIERS: Record<Tier, { label: string; hanja: string; line: string; dark: boolean }> = {
  seong: { label: "성군", hanja: "聖君", line: "조선 역사에 길이 남을 성군", dark: false },
  myeong: { label: "명군", hanja: "明君", line: "나라를 잘 다스린 명군", dark: false },
  pyeong: { label: "무난한 임금", hanja: "守成", line: "큰 공도 큰 허물도 없이 나라를 지킨 임금", dark: false },
  am: { label: "암군", hanja: "暗君", line: "나라를 기울게 한 어두운 임금", dark: true },
  pok: { label: "폭군", hanja: "暴君", line: "반정으로 왕위에서 쫓겨난 폭군", dark: true },
};

const PEOPLE_BY_REL: Record<Rel, Factor> = {
  인성: { weight: 2, reason: "띠(백성)가 일간(왕)을 생하니 민심이 왕을 받드옵니다" },
  비겁: { weight: 1, reason: "띠와 일간이 같은 기운이라 왕과 백성의 뜻이 통하옵니다" },
  식상: { weight: 1, reason: "일간이 띠를 생하니 왕이 백성을 먹여 살리는 형국이옵니다" },
  재성: { weight: -1, reason: "일간이 띠를 극하니 왕이 백성을 누르는 형국이옵니다" },
  관성: { weight: -2, reason: "띠가 일간을 극하니 백성이 왕을 뒤엎을 기운이 있사옵니다" },
};

export function reignTier(p: Pillars) {
  const factors: Factor[] = [PEOPLE_BY_REL[rel(stemEl(p.dayStem), BRANCH_EL[p.yearBranch])]];
  if (isClash(p.dayBranch, p.yearBranch)) factors.push({ weight: -2, reason: "궁궐(일지)과 백성(띠)이 충하니 조정이 늘 시끄럽사옵니다" });
  else if (isWonjin(p.dayBranch, p.yearBranch)) factors.push({ weight: -1, reason: "궁궐과 백성이 원진이라 서로를 미워하옵니다" });
  else if (isCombine(p.dayBranch, p.yearBranch)) factors.push({ weight: 1, reason: "궁궐과 백성이 합하니 위아래가 화목하옵니다" });
  const score = factors.reduce((s, f) => s + f.weight, 0) + (hashOf(p, 2) % 3) - 1;
  const tier: Tier = score >= 3 ? "seong" : score >= 1 ? "myeong" : score === 0 ? "pyeong" : score >= -2 ? "am" : "pok";
  const dark = tier === "am" || tier === "pok";
  const reasons = dark
    ? reasonsFor(factors, -1, "기운은 고르나 때를 잘못 만난 임금이옵니다")
    : tier === "pyeong"
      ? ["백성과 왕의 기운이 크게 돕지도 해치지도 않사옵니다"]
      : reasonsFor(factors, 1, "기운이 고르고 때를 잘 만난 임금이옵니다");
  return { tier, reasons };
}

// ── Ratings: each king type has a natural profile, the verdict tilts it, a little noise keeps charts apart.

export const STATS = [
  {
    key: "people",
    label: "백성에게",
    lines: ["백성이 이름만 들어도 문을 걸어 잠갔다", "저잣거리에 원망 섞인 노래가 돌았다", "백성들은 그럭저럭 살 만하다 했다", "백성들이 믿고 따랐다", "행차마다 백성이 길을 메웠다"],
    hi: "백성의 사랑을 한 몸에 받았으나",
    lo: "백성의 원성을 샀던",
  },
  {
    key: "court",
    label: "신하에게",
    lines: ["충신은 떠나고 간신만 남았다", "신하들이 늘 눈치만 보았다", "쓸 사람은 썼으나 아끼지는 않았다", "신하들이 앞다투어 충성했다", "인재를 알아보고 끝까지 믿었다"],
    hi: "사람 보는 눈은 조선 제일이었으나",
    lo: "신하 복이 없었던",
  },
  {
    key: "enemy",
    label: "외적에게",
    lines: ["외적 앞에서 도성을 버리고 피란했다", "국경이 자주 뚫렸다", "큰 전쟁 없이 버텼다", "외적이 함부로 넘보지 못했다", "국경을 넘본 적이 모두 돌아갔다"],
    hi: "외적에게는 호랑이였으나",
    lo: "외적 앞에서 무력했던",
  },
  {
    key: "martial",
    label: "무예",
    lines: ["말에 오르면 내관 둘이 붙잡아야 했다", "칼보다 붓이 편했다", "활은 쏠 줄 알았다", "말을 달려 사냥을 즐겼다", "활 한 발로 과녁을 꿰뚫는 무인 군주"],
    hi: "활과 칼은 조선 제일이었으나",
    lo: "말 위에서는 영 어설펐던",
  },
  {
    key: "scholar",
    label: "학문",
    lines: ["상소를 읽다 말고 던졌다", "경연 때마다 졸았다", "경연에 빠지지는 않았다", "책을 손에서 놓지 않았다", "경연에서 오히려 대신들을 가르쳤다"],
    hi: "학문은 대신들을 능가했으나",
    lo: "책과는 담을 쌓은",
  },
  {
    key: "treasury",
    label: "나라 살림",
    lines: ["나라 곳간이 바닥났다", "잔치와 공사로 곳간이 비었다", "적자도 흑자도 없었다", "새는 돈을 잘 막았다", "나라 곳간이 넘쳤다"],
    hi: "나라 살림은 알뜰히 챙겼으나",
    lo: "곳간을 거덜 낸",
  },
] as const;

// [백성, 신하, 외적, 무예, 학문, 살림] by day stem: 甲 乙 丙 丁 戊 己 庚 辛 壬 癸
const PROFILE = [
  [3, 3, 4, 4, 3, 3],
  [4, 5, 3, 2, 3, 3],
  [5, 3, 3, 3, 2, 2],
  [5, 4, 2, 1, 4, 3],
  [3, 4, 5, 3, 2, 4],
  [5, 3, 2, 2, 3, 5],
  [2, 2, 5, 5, 2, 3],
  [3, 2, 3, 2, 5, 4],
  [3, 3, 4, 3, 4, 2],
  [2, 4, 4, 1, 5, 3],
];
const TIER_TILT: Record<Tier, number[]> = {
  seong: [1, 1, 0, 0, 0, 1],
  myeong: [1, 0, 0, 0, 0, 0],
  pyeong: [0, 0, 0, 0, 0, 0],
  am: [-1, -2, -1, 0, 0, -1],
  pok: [-2, -2, 0, 0, 0, -2],
};

export function ratings(p: Pillars, tier: Tier) {
  const values = PROFILE[p.dayStem].map((base, i) => {
    const noise = [-1, 0, 0, 1][hashOf(p, 10 + i) % 4];
    return Math.max(1, Math.min(5, base + TIER_TILT[tier][i] + noise));
  });
  const best = values.indexOf(Math.max(...values));
  const worst = values.lastIndexOf(Math.min(...values));
  const headline = `${STATS[best].hi} ${STATS[worst].lo} 왕`;
  return {
    headline,
    rows: STATS.map((s, i) => ({ key: s.key, label: s.label, value: values[i], line: s.lines[values[i] - 1] })),
  };
}
