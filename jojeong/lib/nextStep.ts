// Every free page ends on the question it leaves ("삼재면 올해 어떡해?") and one step that answers it: a free
// page first where there is one, the paid report after (무료 → 무료 → 유료). The pages and their steps live here,
// so a new free page is one more line. Each click is counted as `to:<from>` as well as `to_saju`, for the
// owner's dashboard (which page actually sends people on).
export const STEP_FROM = ["king", "court", "minister", "sinbun", "reading", "gukjeong", "ranking", "samjae", "today", "chaek"] as const;
export type StepFrom = (typeof STEP_FROM)[number];
export const isStepFrom = (v: unknown): v is StepFrom => STEP_FROM.includes(v as StepFrom);

export const STEP_LABEL: Record<StepFrom, string> = {
  king: "왕이 될 사주 첫 화면",
  court: "조정 (전하)",
  minister: "신하 결과",
  sinbun: "조선 신분 감정",
  reading: "무료 사주 분석",
  gukjeong: "2026 신년 운세",
  ranking: "이달의 일주 랭킹",
  samjae: "삼재",
  today: "오늘의 운세",
  chaek: "책력 (손 없는 날)",
};

export type Step = { href: string; title: string; line?: string; seal?: string; kicker?: string; free?: boolean };
export type Steps = { ask?: string; main: Step; more?: Step[] };

const q = (query?: string) => (query ? `?${query}` : "");

// The fixed ones; the court pages build theirs from the chart (lib/gameBridge.ts).
export const STEPS = {
  king: (): Steps => ({
    ask: "명과학 훈도가 지금도 봐 드리는 것",
    main: { href: "/reports/sinbun", seal: "身分", kicker: "무료", title: "조선 신분 감정", line: "조선에 태어났다면 나는 양반? 상민? 그 한평생", free: true },
    more: [
      { href: "/reports/pyeongsaeng", title: "평생 사주" },
      { href: "/reports/gunghap", title: "궁합" },
      { href: "/reports/taekil", title: "택일" },
    ],
  }),
  sinbun: (query?: string): Steps => ({
    ask: "조선의 한평생 말고, 지금의 나는?",
    main: { href: `/reports/pyeongsaeng${q(query)}`, seal: "命", kicker: "무료 사주 분석", title: "같은 여덟 글자로 보는 오늘의 나", line: "여덟 글자의 무게, 다섯 가지 힘, 10년 흐름까지", free: true },
    more: [
      { href: `/reports/gukjeong${q(query)}`, title: "2026 운세 (무료)" },
      { href: "/reports/gunghap", title: "궁합" },
    ],
  }),
  samjae: (year: number): Steps => ({
    ask: "삼재는 띠 한 글자만 보는 풀이예요",
    main: { href: "/reports/gukjeong", seal: "八字", kicker: "무료", title: `여덟 글자로 보는 내 ${year}년 운세`, line: "삼재인지보다, 내 사주에 올해가 어떤 해인지", free: true },
    more: [{ href: `/reports/yeonun?y=${year + 1}`, title: `${year + 1}년 미리 보기` }],
  }),
  ranking: (year: number, known: boolean): Steps =>
    known
      ? {
          ask: "일주는 여덟 글자 중 두 글자예요",
          main: { href: `/reports/yeonun?y=${year}`, seal: "年", kicker: "연운", title: `내 사주 전체로 보는 ${year}년, 달마다`, line: "한 해 판정과 좋은 달·조심할 달은 무료로 먼저", free: true },
          more: [{ href: "/reports/pyeongsaeng", title: "무료 사주 분석" }],
        }
      : {
          ask: "내 일주를 모르겠다면",
          main: { href: "/reports/pyeongsaeng", seal: "日柱", kicker: "무료", title: "생년월일만 넣으면 바로 알려 드려요", line: "내 일주와 이번 달 순위, 사주 분석까지", free: true },
        },
  // The almanac's 손 없는 날 is the same day for everyone; the step is the day that fits the reader (택일, 이사).
  chaek: (known: boolean): Steps => ({
    ask: known ? "손 없는 날 가운데서도, 나와 맞는 날은 따로 있어요" : "손 없는 날은 누구에게나 같은 날이에요",
    main: {
      href: "/reports/taekil?kind=move",
      seal: "擇日",
      kicker: "이사 택일",
      title: known ? "내 사주로 고르는 이사 날짜" : "내 사주에 맞는 이사 날짜 찾기",
      line: "책력과 사주를 함께 따져 고른 날 · 맞는 날이 몇 날인지는 무료로 먼저",
    },
    more: [{ href: "/reports/pyeongsaeng", title: "무료 사주 분석" }],
  }),
};
