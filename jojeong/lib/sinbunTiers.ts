// 양반 split by the 그릇 score (lib/sinbun.ts vessel), so every 호패 the 『속대전』 names turns up (2026-11-19 대표님:
// "박물관에 5종이면 그대로 콘텐츠화"). 6.5 and up: rose to 2품 or higher, 아패. 5.5 to 6: an official of 3품 and
// below, 각패 (the base lives as written). 5: passed the 생원·진사 exam without office, 황양목패. The 무관 line has
// no 생원 rung (a 무관's road was the 무과), so its 5 stays an official. Shares (1950–2008 births × 12 hours):
// 6.5+ 6.8%, 5.5–6 11.5%, 5 14.7%.
import type { TagKind } from "./hopae";

export type Tier = "top" | "mid" | "saeng";
export const tierOf = (score: number, group: string): Tier => (score >= 6.5 ? "top" : score >= 5.5 || group === "비겁" ? "mid" : "saeng");
export const TIER_TAG: Record<Exclude<Tier, "mid">, TagKind> = { top: "아패", saeng: "황양목패" };

type Over = { job: string; line: string; office: string; rise: number; riseText: string; day?: [string, string, string] };

// 2품 and up: the base office word in the job and line becomes the high office.
export const TOP: Record<string, Over & { from: string; to: string }> = {
  인성: { from: "교리", to: "대제학", job: "홍문관 대제학", line: "나라의 글을 맡은 문장의 으뜸", office: "弘文", rise: 5, riseText: "교리에서 시작해 마침내 정2품 대제학에 올랐다. 선비들이 가장 부러워한 자리였다." },
  관성: { from: "감찰", to: "대사헌", job: "사헌부 대사헌", line: "관리들의 잘못을 따지던 사헌부의 우두머리", office: "憲府", rise: 5, riseText: "감찰에서 시작해 종2품 대사헌에 올랐다. 그가 조정에 들어서면 모두가 옷깃을 여몄다." },
  재성: { from: "정랑", to: "판서", job: "호조 판서", line: "나라 곳간을 통째로 맡은 살림의 으뜸", office: "戶曹", rise: 5, riseText: "정랑에서 시작해 마침내 정2품 호조 판서에 올랐다. 돈을 다루는 자리였지만 장부는 늘 맞았다." },
  식상: { from: "사관", to: "제학", job: "예문관 제학", line: "임금의 교서를 짓던 문장가", office: "藝文", rise: 5, riseText: "사관으로 시작해 종2품 제학에 올라 임금의 글을 지었다." },
  비겁: { from: "무관", to: "대장", job: "훈련대장", line: "도성의 군사를 이끈 무관의 으뜸", office: "訓局", rise: 5, riseText: "무관으로 시작해 종2품 훈련대장에 올라 도성의 군사를 맡았다." },
  고른: { from: "현감", to: "관찰사", job: "관찰사", line: "한 도를 다스린 지방의 으뜸", office: "監營", rise: 5, riseText: "현감으로 시작해 가는 고을마다 선정비가 섰고, 마침내 종2품 관찰사에 올랐다." },
};

// 생원·진사: passed the small exam, went to 성균관 or home, no office. One life per line (the variants are offices).
export const SAENG: Record<string, Over> = {
  인성: { job: "글 잘 짓는 진사", line: "진사시에 붙어 성균관에서 글을 닦던 선비", office: "成均", rise: 3, riseText: "진사시에는 단번에 붙었으나 대과의 문은 좁았다. 벼슬 대신 글로 이름을 남겼다.", day: ["새벽에 성균관 명륜당에서 경전을 외었다.", "낮에는 동재 유생들과 시를 지어 겨루었다.", "밤에는 대과에 낼 글을 고쳐 쓰고 또 고쳐 썼다."] },
  식상: { job: "시 잘 짓는 진사", line: "진사시에 붙어 시 한 수로 이름난 선비", office: "成均", rise: 3, riseText: "진사로 이름은 났으나 벼슬보다 시가 좋았다. 그의 시는 고을 아이들까지 외웠다.", day: ["새벽 안개를 보며 시 한 수를 먼저 지었다.", "낮에는 벗들과 정자에 올라 시회를 열었다.", "밤에는 지은 시를 골라 문집에 옮겨 적었다."] },
  관성: { job: "예법 밝은 생원", line: "생원시에 붙어 고을의 예법을 바로 세운 선비", office: "成均", rise: 3, riseText: "생원으로 향교와 향약을 이끌며 고을의 어른이 되었다. 대과보다 고을이 그를 더 찾았다.", day: ["새벽에 사당에 절하고 하루를 열었다.", "낮에는 향교에서 유생들에게 예법을 가르쳤다.", "밤에는 고을 향약의 조목을 손보았다."] },
  재성: { job: "셈 밝은 생원", line: "생원시에 붙고 집안과 고을 곳간을 일으킨 선비", office: "成均", rise: 3, riseText: "생원으로 벼슬은 없었으나 집안과 고을의 곳간을 든든히 했다.", day: ["새벽에 소작 장부와 곡식 섬을 맞춰 보았다.", "낮에는 고을 사창의 곡식 출납을 살폈다.", "밤에는 흉년에 대비할 셈을 거듭했다."] },
  고른: { job: "고을 어른 생원", line: "생원시에 붙어 고을의 다툼을 풀던 선비", office: "成均", rise: 3, riseText: "생원으로 머물렀지만, 사또보다 그를 먼저 찾는 이가 많았다.", day: ["아침에 사랑방에서 고을 사람들의 하소연을 들었다.", "낮에는 논둑을 돌며 농사 형편을 살폈다.", "밤에는 향교 일과 집안 일을 번갈아 챙겼다."] },
};

// How many of the 258,600 births land on each 양반 life by rung (scripts/sinbunTiers.mts).
export const TIER_N: Record<string, number> = {
  "고른-양반|saeng": 7875,
  "고른-양반|용신0|mid": 1610,
  "고른-양반|용신0|top": 1139,
  "고른-양반|용신1|mid": 1733,
  "고른-양반|용신1|top": 944,
  "고른-양반|용신2|mid": 1638,
  "고른-양반|용신2|top": 1151,
  "고른-양반|용신3|mid": 1429,
  "고른-양반|용신3|top": 1013,
  "고른-양반|용신4|mid": 2102,
  "고른-양반|용신4|top": 1368,
  "관성-양반|saeng": 7918,
  "관성-양반|비겁|mid": 1358,
  "관성-양반|비겁|top": 602,
  "관성-양반|식상|mid": 551,
  "관성-양반|식상|top": 108,
  "관성-양반|인성|mid": 2037,
  "관성-양반|인성|top": 735,
  "관성-양반|재성|mid": 593,
  "관성-양반|재성|top": 224,
  "비겁-양반|관성|mid": 2416,
  "비겁-양반|관성|top": 667,
  "비겁-양반|식상|mid": 2834,
  "비겁-양반|식상|top": 914,
  "비겁-양반|인성|mid": 249,
  "비겁-양반|인성|top": 320,
  "비겁-양반|재성|mid": 3187,
  "비겁-양반|재성|top": 1009,
  "식상-양반|saeng": 7623,
  "식상-양반|관성|mid": 591,
  "식상-양반|관성|top": 267,
  "식상-양반|비겁|mid": 1149,
  "식상-양반|비겁|top": 617,
  "식상-양반|인성|mid": 1706,
  "식상-양반|인성|top": 830,
  "식상-양반|재성|mid": 494,
  "식상-양반|재성|top": 469,
  "인성-양반|saeng": 3929,
  "인성-양반|관성|mid": 762,
  "인성-양반|관성|top": 621,
  "인성-양반|비겁|mid": 400,
  "인성-양반|비겁|top": 107,
  "인성-양반|식상|mid": 1240,
  "인성-양반|식상|top": 847,
  "인성-양반|재성|mid": 1396,
  "인성-양반|재성|top": 832,
  "재성-양반|saeng": 5976,
  "재성-양반|관성|mid": 622,
  "재성-양반|관성|top": 348,
  "재성-양반|비겁|mid": 2243,
  "재성-양반|비겁|top": 1185,
  "재성-양반|식상|mid": 618,
  "재성-양반|식상|top": 510,
  "재성-양반|인성|mid": 1336,
  "재성-양반|인성|top": 696,
};
