import { isBaekho, isGoegang, meetings, salsAt, stageOf, type Sal } from "./deep";
import { chartOf, ELEMENT_HANJA, ELEMENT_KO, GROUP_OF, HIDDEN, readChart, stemEl, tenGod, type GodGroup, type Reading, type TenGod } from "./myeongri";
import type { Gender } from "./profile";
import { isFull, type FullPillars, type Pillars } from "./saju";

// Classical patterns (격국·십신·합충·신살) that make one chart unlike another with the same day pillar. The
// engine finds them so the writer does not have to, and lib/rarity.json says how rare each one is.

export type Area = "성격" | "연애" | "돈" | "일" | "가족" | "건강" | "사람";

type Ctx = {
  p: FullPillars;
  r: Reading;
  gender: Gender | null;
  share: Record<GodGroup, number>; // weighted share of each ten-god group (day master excluded)
  el: number[]; // weighted share of each element
  stemGods: TenGod[]; // ten gods showing on the heavenly stems (day master excluded)
  shownGods: TenGod[]; // …and the branches' main stems
  sals: Sal[];
  clashWithDay: boolean;
};

type Spec = {
  id: string;
  term: string; // the classical name, for the brief and the small print
  plain: (c: Ctx) => string; // what it is, in plain words
  area: Area;
  meaning: (c: Ctx) => string; // what it means in a life, in plain words
  test: (c: Ctx) => boolean;
};

export type Pattern = { id: string; term: string; plain: string; area: Area; meaning: string };

const txt = (s: string) => () => s;
const weak = (c: Ctx) => c.r.strength === "신약" || c.r.strength === "극신약";
const shows = (c: Ctx, ...gods: TenGod[]) => gods.some((g) => c.stemGods.includes(g));
const has = (c: Ctx, ...gods: TenGod[]) => gods.some((g) => c.shownGods.includes(g));
const pairClash = (a: number | null, b: number | null) => a !== null && b !== null && meetings(a, b).includes("충");
const ELEMENT_TRAIT = [
  "끝없이 뻗어 가려는 성장욕과 고집",
  "열정과 조급함, 뜨거운 감정",
  "버티는 힘과 걱정, 쉽게 안 움직이는 고집",
  "냉정한 판단과 날카로운 말",
  "깊은 생각과 속을 잘 안 보이는 성향",
];

const SPECS: Spec[] = [
  {
    id: "jonggyeok",
    term: "종격",
    plain: (c) => `한 기운을 따르는 특별한 구조(${c.r.outer})`,
    area: "성격",
    meaning: txt("사주가 한 기운으로 가득 차서, 균형을 맞추기보다 그 흐름을 탈 때 풀려요. '적당히 균형 잡으라'는 흔한 조언이 오히려 안 맞는 사람이에요."),
    test: (c) => c.r.outer !== null,
  },
  {
    id: "junghwa",
    term: "중화",
    plain: txt("나를 받쳐 주는 힘과 빼 가는 힘이 반반"),
    area: "성격",
    meaning: txt("버티는 힘과 쓰는 힘이 거의 같아서 어디서든 적응이 빨라요. 대신 '이거다' 싶은 한 방이 늦게 오고, 스스로 뭘 원하는지 헷갈리는 시기가 길 수 있어요."),
    test: (c) => c.r.balanced && !c.r.outer,
  },
  {
    id: "johu-hot",
    term: "조열 (조후)",
    plain: txt("물이 바싹 마른 한여름 사주"),
    area: "건강",
    meaning: txt("속에 열이 많아 급하고 뜨거워요. 결정이 빠른 대신 번아웃·불면·감정 폭발을 조심해야 하고, 차분한 물 같은 사람이 곁에 있어야 안정돼요."),
    test: (c) => c.r.johu === 4,
  },
  {
    id: "johu-cold",
    term: "한습 (조후)",
    plain: txt("불씨가 꺼진 한겨울 사주"),
    area: "건강",
    meaning: txt("생각이 깊고 신중하지만 시작이 느려요. 무기력이나 우울감에 빠지기 쉬워서, 햇볕·운동·사람의 온기가 운을 틔워 줘요."),
    test: (c) => c.r.johu === 1,
  },
  {
    id: "gwansal-honjap",
    term: "관살혼잡",
    plain: (c) => (c.gender === "f" ? "성격이 다른 두 남자 기운이 함께 있음" : "방향이 다른 두 윗사람 기운이 함께 있음"),
    area: "연애",
    meaning: (c) =>
      c.gender === "f"
        ? "안정적인 사람과 강하게 끌리는 사람 사이를 오가기 쉬워요. 연애가 복잡해지거나, 한 사람에게 정착하기까지 시간이 걸리는 구조예요."
        : "지시가 엇갈리거나 책임이 겹치는 자리에 놓이기 쉬워요. 누구 말을 따라야 할지 몰라 지치는 일이 많았을 거예요.",
    test: (c) => has(c, "정관") && has(c, "편관") && c.share.관성 >= 0.2,
  },
  {
    id: "gwan-heavy",
    term: "관살태과",
    plain: txt("책임과 압박의 기운이 사주를 누름"),
    area: "성격",
    meaning: txt("늘 누군가의 기대와 규칙 속에서 살아온 느낌이 있어요. 책임감은 누구보다 강하지만 스스로를 몰아붙여 지치기 쉬워요."),
    test: (c) => c.share.관성 >= 0.4 && !c.r.outer,
  },
  {
    id: "no-gwan",
    term: "무관",
    plain: txt("규칙·조직의 기운이 거의 없음"),
    area: "일",
    meaning: (c) =>
      `누가 시키는 일에는 힘이 안 나고, 스스로 정한 일에 몰입해요. 조직에 맞추기보다 자기 판을 만드는 쪽이에요.${
        c.gender === "f" ? " 남자 인연은 늦게 오거나, 친구 같은 사람과 잘 맞아요." : ""
      }`,
    test: (c) => c.share.관성 < 0.04,
  },
  {
    id: "jaeda-sinyak",
    term: "재다신약",
    plain: txt("돈은 보이는데 쥘 힘이 모자람"),
    area: "돈",
    meaning: txt("돈 얘기와 기회는 많이 들어오는데 정작 손에 남는 게 적어요. 혼자 다 쥐려 하기보다 믿을 사람과 나눠 쥘 때 커지는 구조예요."),
    test: (c) => c.share.재성 >= 0.35 && weak(c) && !c.r.outer,
  },
  {
    id: "no-jae",
    term: "무재",
    plain: txt("재물의 기운이 드러나지 않음"),
    area: "돈",
    meaning: (c) =>
      `돈 자체를 좇으면 잘 안 풀리고, 실력과 이름을 쌓으면 돈이 뒤따라오는 구조예요. 돈 계산에 무심해 손해 보는 일이 잦아요.${
        c.gender === "m" ? " 연애·결혼 인연도 늦게 무르익는 편이에요." : ""
      }`,
    test: (c) => c.share.재성 < 0.04,
  },
  {
    id: "siksang-saengjae",
    term: "식상생재",
    plain: txt("재주가 돈으로 이어지는 흐름"),
    area: "돈",
    meaning: txt("좋아하는 걸 하다 보면 돈이 되는 구조예요. 월급 외에 부업·콘텐츠·판매처럼 내 손과 입에서 나온 것이 수입이 돼요."),
    test: (c) => c.share.식상 >= 0.15 && c.share.재성 >= 0.15 && !(c.share.재성 >= 0.35 && weak(c)),
  },
  {
    id: "siksang-heavy",
    term: "식상과다",
    plain: txt("표현과 재주의 기운이 넘침"),
    area: "성격",
    meaning: txt("말과 아이디어가 넘쳐 벌이는 일은 많은데 마무리가 약해요. 하고 싶은 말을 참기 어려워 구설이 생기기 쉬워요."),
    test: (c) => c.share.식상 >= 0.4,
  },
  {
    id: "sanggwan-gyeongwan",
    term: "상관견관",
    plain: txt("틀을 깨는 기운이 규칙과 부딪힘"),
    area: "일",
    meaning: (c) =>
      `윗사람이나 조직의 불합리를 못 참고 들이받는 편이에요. 옳은 말을 하고도 손해 본 경험이 있을 거예요.${
        c.gender === "f" ? " 연인에게도 지적과 잔소리가 늘어 다툼이 생기기 쉬워요." : ""
      }`,
    test: (c) => shows(c, "상관") && has(c, "정관"),
  },
  {
    id: "gwanin-sangsaeng",
    term: "관인상생",
    plain: txt("조직의 인정이 실력으로 이어짐"),
    area: "일",
    meaning: txt("시험·자격·승진 운이 좋아요. 윗사람이 끌어 주고, 조직 안에서 차근차근 올라가는 길이 잘 맞아요."),
    test: (c) => shows(c, "정관", "편관") && shows(c, "정인", "편인") && c.share.관성 >= 0.12 && c.share.인성 >= 0.12,
  },
  {
    id: "salin-sangsaeng",
    term: "살인상생",
    plain: txt("압박을 배움으로 바꾸는 힘"),
    area: "일",
    meaning: txt("힘든 환경에 놓일수록 배워서 버티고 결국 한 단계 올라서요. 위기 때마다 공부와 자격이 무기가 돼요."),
    test: (c) => shows(c, "편관") && shows(c, "정인", "편인") && weak(c),
  },
  {
    id: "siksin-jesal",
    term: "식신제살",
    plain: txt("재주로 거친 상황을 제압함"),
    area: "일",
    meaning: txt("위기나 강한 상대 앞에서 오히려 실력으로 판을 뒤집어요. 갈등 조정이나 어려운 문제 해결 역할에서 빛나요."),
    test: (c) => shows(c, "식신") && shows(c, "편관"),
  },
  {
    id: "inseong-heavy",
    term: "인성과다",
    plain: txt("생각과 보살핌의 기운이 넘침"),
    area: "가족",
    meaning: txt("생각이 많고 준비는 완벽한데 실행이 늦어요. 부모, 특히 어머니의 영향이나 간섭이 컸을 가능성이 커요."),
    test: (c) => c.share.인성 >= 0.4,
  },
  {
    id: "no-inseong",
    term: "무인성",
    plain: txt("기댈 곳의 기운이 없음"),
    area: "가족",
    meaning: txt("어릴 때부터 스스로 알아서 해 온 사람이에요. 도움받는 걸 어색해하고, 공부도 책보다 실전으로 배우는 스타일이에요."),
    test: (c) => c.share.인성 < 0.04,
  },
  {
    id: "pyeonin-dosik",
    term: "편인도식",
    plain: txt("직감과 재능이 서로 발목을 잡음"),
    area: "성격",
    meaning: txt("하고 싶은 걸 하려 할 때마다 걱정이나 주변의 반대가 발목을 잡아요. 먹고사는 문제에 예민하고, 입맛이 까다로운 편이에요."),
    test: (c) => shows(c, "편인") && has(c, "식신"),
  },
  {
    id: "jae-geuk-in",
    term: "재극인",
    plain: txt("돈과 공부가 부딪히는 흐름"),
    area: "가족",
    meaning: txt("공부를 오래 붙들기보다 현실(돈)을 먼저 택하게 되는 흐름이에요. 어머니와 가치관이 달라 부딪히기 쉬워요."),
    test: (c) => c.share.재성 >= 0.25 && c.share.인성 >= 0.1 && has(c, "편재", "정재") && has(c, "정인", "편인"),
  },
  {
    id: "bigup-heavy",
    term: "비겁과다",
    plain: txt("나와 같은 기운이 많음"),
    area: "사람",
    meaning: (c) =>
      `고집과 자존심이 세고 경쟁심이 강해요.${
        c.share.재성 >= 0.1 ? " 형제·친구와 돈이 얽히면 손해 보기 쉬우니 동업과 보증은 피해야 해요." : " 사람은 많아도 속을 다 보여 주는 사람은 적어요."
      }`,
    test: (c) => c.share.비겁 >= 0.35,
  },
  {
    id: "no-bigup",
    term: "무비겁",
    plain: txt("내 편이 되어 줄 기운이 없음"),
    area: "사람",
    meaning: txt("혼자 결정하고 혼자 책임지는 게 익숙해요. 기댈 사람을 일부러 만들어 두어야 힘들 때 버틸 수 있어요."),
    test: (c) => c.share.비겁 < 0.04 && !c.r.outer,
  },
  {
    id: "spouse-clash",
    term: "일지 충",
    plain: txt("배우자 자리가 흔들리는 구조"),
    area: "연애",
    meaning: txt("가까운 관계에서 크게 부딪히는 시기가 한두 번 오기 쉬워요. 결혼은 서두를수록 흔들리고, 늦을수록 안정적이에요."),
    test: (c) => c.clashWithDay,
  },
  {
    id: "spouse-hap",
    term: "일지 합",
    plain: txt("배우자 자리가 합으로 묶임"),
    area: "연애",
    meaning: txt("한번 정을 준 사람과 오래 가요. 관계가 끈끈한 대신, 정리해야 할 관계도 쉽게 못 끊는 게 약점이에요."),
    test: (c) =>
      [c.p.monthBranch, c.p.hourBranch].some((b) => b !== null && meetings(c.p.dayBranch, b).includes("육합")) && !c.clashWithDay,
  },
  {
    id: "spouse-mixed",
    term: "정편재 혼잡",
    plain: txt("성격이 다른 두 여자 기운이 함께 있음"),
    area: "연애",
    meaning: txt("안정적인 사람과 자유로운 사람 사이에서 마음이 오가기 쉬워요. 연애 상대의 유형이 시기마다 크게 달라지는 편이에요."),
    test: (c) => c.gender === "m" && has(c, "정재") && has(c, "편재") && c.share.재성 >= 0.2,
  },
  {
    id: "month-clash",
    term: "월지 충",
    plain: txt("부모·일터 자리가 흔들리는 구조"),
    area: "가족",
    meaning: txt("부모·집안·직장 환경에 변동이 많았거나, 한곳에 오래 머물기 어려운 흐름이에요."),
    test: (c) => pairClash(c.p.monthBranch, c.p.yearBranch) || pairClash(c.p.monthBranch, c.p.hourBranch),
  },
  {
    id: "early-move",
    term: "연월 충",
    plain: txt("어린 시절 자리가 흔들림"),
    area: "가족",
    meaning: txt("어린 시절 이사·전학·집안 사정의 변화가 있었을 가능성이 커요. 일찍 철든 사람이 많아요."),
    test: (c) => pairClash(c.p.yearBranch, c.p.monthBranch),
  },
  {
    id: "late-clash",
    term: "일시 충",
    plain: txt("나와 자녀·말년 자리가 부딪힘"),
    area: "가족",
    meaning: txt("자녀와 생각 차이가 크거나, 중년 이후 계획이 크게 바뀌기 쉬워요."),
    test: (c) => pairClash(c.p.dayBranch, c.p.hourBranch),
  },
  {
    id: "dohwa",
    term: "도화",
    plain: txt("사람을 끄는 매력"),
    area: "연애",
    meaning: txt("가만히 있어도 눈길을 끌어요. 인기와 이성 인연이 많고, 외모·센스·표현력이 무기가 되는 일이 잘 맞아요."),
    test: (c) => c.sals.includes("도화"),
  },
  {
    id: "yeokma",
    term: "역마",
    plain: txt("움직여야 풀리는 기운"),
    area: "일",
    meaning: txt("한곳에 오래 있으면 답답해요. 이사·출장·해외·이직이 잦고, 움직이는 일이 운을 틔워요."),
    test: (c) => c.sals.includes("역마"),
  },
  {
    id: "hwagae",
    term: "화개 중첩",
    plain: txt("혼자만의 깊은 세계"),
    area: "성격",
    meaning: txt("사람 속에 있어도 문득 외로움을 느껴요. 예술·종교·철학·연구처럼 깊이 파고드는 일에 인연이 있어요."),
    test: (c) => c.sals.filter((s) => s === "화개").length >= 2,
  },
  {
    id: "cheoneul",
    term: "천을귀인",
    plain: txt("위기 때 돕는 사람이 나타남"),
    area: "사람",
    meaning: txt("막다른 길에서 꼭 누군가 손을 내밀어요. 평소 쌓아 둔 인연이 결정적인 순간에 도와줘요."),
    test: (c) => c.sals.includes("천을귀인"),
  },
  {
    id: "yangin",
    term: "양인",
    plain: txt("칼 같은 결단력"),
    area: "성격",
    meaning: txt("한번 정하면 밀어붙이는 힘이 대단해요. 대신 욱하는 성미와 다툼, 부상을 조심해야 해요."),
    test: (c) => c.sals.includes("양인"),
  },
  {
    id: "goegang",
    term: "괴강",
    plain: txt("우두머리 기질"),
    area: "성격",
    meaning: txt("극과 극을 오가는 삶이에요. 판이 크고, 남 밑에 오래 있기 힘들며, 잘될 땐 크게 잘돼요."),
    test: (c) => isGoegang(c.p),
  },
  {
    id: "baekho",
    term: "백호",
    plain: txt("사나운 기세"),
    area: "건강",
    meaning: txt("추진력이 강한 만큼 사고·수술·다툼 같은 급한 일을 한 번쯤 겪기 쉬워요. 운전과 몸 쓰는 일에서 조심성이 필요해요."),
    test: (c) => isBaekho(c.p),
  },
  {
    id: "el-extreme",
    term: "오행 편중",
    plain: (c) => {
      const e = c.el.indexOf(Math.max(...c.el));
      return `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]}) 기운이 사주의 ${Math.round(c.el[e] * 100)}%`;
    },
    area: "성격",
    meaning: (c) => `${ELEMENT_TRAIT[c.el.indexOf(Math.max(...c.el))]}이 삶 전체를 끌고 가요. 장점도 약점도 이 한 기운에서 나와요.`,
    test: (c) => Math.max(...c.el) >= 0.55,
  },
  {
    id: "missing-two",
    term: "오행 결핍",
    plain: (c) => `${c.r.missing.map((e) => `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`).join("·")} 기운이 비어 있음`,
    area: "성격",
    meaning: txt("빈 기운이 필요한 순간에 늘 한 박자 늦어요. 그 기운을 가진 사람이나 환경을 곁에 두면 운이 채워져요."),
    test: (c) => c.r.missing.length >= 2,
  },
  {
    id: "rootless",
    term: "일간 무근",
    plain: txt("나를 받쳐 줄 뿌리가 없음"),
    area: "성격",
    meaning: txt("겉보기보다 속이 불안하고 주변 영향을 많이 받아요. 확실한 내 편과 내 공간이 있을 때 힘이 나요."),
    test: (c) => !c.r.outer && ![c.p.yearBranch, c.p.monthBranch, c.p.dayBranch, c.p.hourBranch].some((b) => b !== null && HIDDEN[b].some(([h]) => stemEl(h) === stemEl(c.p.dayStem))),
  },
  {
    id: "self-seat",
    term: "일지 건록·제왕",
    plain: txt("자기 자리에 단단히 선 일주"),
    area: "연애",
    meaning: txt("주관이 뚜렷하고 자립심이 강해요. 연인·배우자와도 주도권을 두고 부딪히기 쉬워서, 각자의 영역을 존중하는 관계가 맞아요."),
    test: (c) => ["건록", "제왕"].includes(stageOf(c.p.dayStem, c.p.dayBranch)),
  },
  {
    id: "guk",
    term: "삼합·방합 국",
    plain: (c) => c.r.bonds.find((b) => b.includes("국"))!.split(":")[0],
    area: "일",
    meaning: txt("세 글자가 한 방향으로 뭉쳐 강한 흐름을 만들어요. 그 기운 쪽 분야에서 크게 쓰이거나, 한번 방향을 정하면 끝까지 가는 사람이에요."),
    test: (c) => c.r.bonds.some((b) => b.includes("국")),
  },
  {
    id: "day-hap",
    term: "일간합 (유정)",
    plain: (c) => `나(일간)와 ${dayPartner(c)} 기운이 정으로 묶임`,
    area: "연애",
    meaning: (c) => `${dayPartner(c)} 기운(${PARTNER_MEANS[GROUP_OF[dayPartnerGod(c)!]]})에 마음을 많이 쓰고, 한번 잡으면 쉽게 놓지 못해요.`,
    test: (c) => dayPartnerGod(c) !== null,
  },
];

const PARTNER_MEANS: Record<GodGroup, string> = { 비겁: "동료·형제", 식상: "재주·자녀", 재성: "돈·이성", 관성: "일·남자·명예", 인성: "공부·어머니" };
function dayPartnerGod(c: Ctx): TenGod | null {
  const hourStem = chartOf(c.p)[0].stem;
  const partner = [c.p.monthStem, hourStem].find((s) => s !== null && Math.abs(s - c.p.dayStem) === 5);
  return partner === undefined || partner === null ? null : tenGod(c.p.dayStem, partner);
}
const dayPartner = (c: Ctx) => dayPartnerGod(c) ?? "";

function contextOf(p: Pillars, gender: Gender | null): Ctx | null {
  const r = readChart(p);
  if (!r || !isFull(p)) return null;
  const gsum = Object.values(r.godWeights).reduce((a, b) => a + b, 0) || 1;
  const esum = r.weights.reduce((a, b) => a + b, 0) || 1;
  const slots = chartOf(p);
  const stemGods = slots.filter((s) => s.pos !== "일" && s.stem !== null).map((s) => tenGod(p.dayStem, s.stem!));
  const branchGods = slots.filter((s) => s.branch !== null).map((s) => tenGod(p.dayStem, HIDDEN[s.branch!].at(-1)![0]));
  const branches = slots.flatMap((s) => (s.branch === null ? [] : [s.branch]));
  return {
    p,
    r,
    gender,
    share: Object.fromEntries(Object.entries(r.godWeights).map(([g, w]) => [g, w / gsum])) as Record<GodGroup, number>,
    el: r.weights.map((w) => w / esum),
    stemGods,
    shownGods: [...stemGods, ...branchGods],
    sals: branches.flatMap((b) => salsAt(p, b)),
    clashWithDay: [p.yearBranch, p.monthBranch, p.hourBranch].some((b) => pairClash(p.dayBranch, b)),
  };
}

// Every pattern the chart shows.
export function patternsOf(p: Pillars, gender: Gender | null): Pattern[] {
  const c = contextOf(p, gender);
  if (!c) return [];
  return SPECS.filter((s) => s.test(c)).map((s) => ({ id: s.id, term: s.term, plain: s.plain(c), area: s.area, meaning: s.meaning(c) }));
}

export const PATTERN_IDS = SPECS.map((s) => s.id);
