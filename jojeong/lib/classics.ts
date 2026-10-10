// 원전 근거: one line from the classics behind what a part of the reading looks at, shown under its "정 훈도가 이렇게
// 본 까닭". Only well-known lines, quoted as the texts have them; the plain Korean is a reading, not a translation.
export type Classic = { book: string; chapter: string; text: string; ko: string };

export const CLASSICS = {
  격국: { book: "자평진전", chapter: "論用神", text: "八字用神，專求月令", ko: "사주의 쓰임은 오로지 태어난 달에서 찾는다" },
  쇠왕: { book: "적천수", chapter: "衰旺", text: "能知衰旺之真機，其於三命之奧，思過半矣", ko: "기운이 성하고 쇠하는 참 이치를 알면, 명리의 깊은 뜻을 절반은 안 것이다" },
  한난: { book: "적천수", chapter: "寒暖", text: "天道有寒暖，發育萬物，人道得之，不可過也", ko: "하늘에 춥고 따뜻함이 있어 만물을 기르니, 사람의 명도 이를 얻되 지나쳐서는 안 된다" },
  세운: { book: "적천수", chapter: "歲運", text: "休咎係乎運，尤係乎歲", ko: "길흉은 대운에 달렸고, 더욱이 그해의 운에 달렸다" },
  행운: { book: "자평진전", chapter: "論行運", text: "論運與看命無二法也", ko: "운을 보는 법은 사주를 보는 법과 다르지 않다" },
  부: { book: "적천수", chapter: "富", text: "何知其人富，財氣通門戶", ko: "어찌 부자인 줄 아는가, 재물의 기운이 문으로 통해 있다" },
  귀: { book: "적천수", chapter: "貴", text: "何知其人貴，官星有理會", ko: "어찌 귀하게 될 줄 아는가, 관의 별이 이치에 맞게 모여 있다" },
  부처: { book: "적천수", chapter: "夫妻", text: "夫妻因緣宿世來", ko: "부부의 인연은 전생에서부터 온다" },
  질병: { book: "적천수", chapter: "疾病", text: "五行和者，一世無災", ko: "오행이 고른 사람은 평생 탈이 적다" },
} satisfies Record<string, Classic>;

// Which line goes under which section of the year reading (lib/yearly.ts section ids).
export const SECTION_CLASSIC: Record<string, Classic> = {
  core: CLASSICS.쇠왕,
  year: CLASSICS.세운,
  daeun: CLASSICS.행운,
  money: CLASSICS.부,
  work: CLASSICS.귀,
  love: CLASSICS.부처,
  health: CLASSICS.질병,
};
