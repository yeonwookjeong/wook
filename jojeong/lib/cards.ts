import { Solar } from "lunar-javascript";
import { isBaekho, isGoegang, stageOf } from "./deep";
import { BRANCH_EL, ELEMENT_HANJA, ELEMENT_KO, stemEl } from "./myeongri";
import { BRANCHES, BRANCHES_KO, STEMS, STEMS_KO, type Pillars } from "./saju";
import { DAY_IMAGE, STAGE_TEXT } from "./yearText";

// Social cards (/admin/cards): the facts each series shows, computed from the same tables the site reads with,
// so a card never says what a reading would not.

// ① 10일간 도감: each day stem as a person.
export const ILGAN: { traits: string[]; angry: string; love: string }[] = [
  {
    traits: ["한번 정하면 곧게 밀고 나가요", "남에게 기대기보다 기댈 곳이 되어 줘요", "시작하는 힘은 열 일간 중 으뜸", "꺾이면 부러질 만큼 고집이 세요"],
    angry: "말수가 줄고, 혼자 결론을 내려요",
    love: "한 사람을 오래, 곧게 봐요",
  },
  {
    traits: ["어디서든 틈을 찾아 뻗어요. 적응력 1등", "부드러워 보여도 속은 누구보다 질겨요", "사람을 엮고 이어 주는 재주가 있어요", "기댈 곳이 있을 때 가장 빛나요"],
    angry: "웃으면서 조용히 거리를 둬요",
    love: "다정하지만, 서운한 건 오래 기억해요",
  },
  {
    traits: ["들어오면 방이 밝아지는 사람", "숨기는 게 제일 어려워요. 표정에 다 나와요", "칭찬 한마디로 사흘을 버텨요", "모두를 비추다 정작 자기는 지쳐요"],
    angry: "크게 타오르고, 금방 꺼져요",
    love: "좋으면 온 동네가 알아요",
  },
  {
    traits: ["조용하지만 따뜻해요. 가까울수록 진가가 보여요", "한 가지에 오래 불을 밝히는 집중력", "남의 길을 비춰 주는 선생님 기질", "섬세해서 작은 말에도 흔들려요"],
    angry: "겉은 잔잔한데 속으로 오래 타요",
    love: "챙겨 주는 걸로 사랑을 말해요",
  },
  {
    traits: ["쉽게 흔들리지 않는 믿음직한 사람", "말보다 행동. 한 약속은 지켜요", "사람들이 기대러 모여들어요", "변화가 느려 답답해 보일 때가 있어요"],
    angry: "참고 참다가, 한 번에 무너져요",
    love: "표현은 서툴러도 끝까지 곁에 있어요",
  },
  {
    traits: ["사람을 키우고 챙기는 데 재능이 있어요", "현실 감각이 좋아 살림 1등", "누구와도 잘 섞이는 포용력", "생각이 많아 걱정을 달고 살아요"],
    angry: "서운함을 쌓아 두다 한 번에 말해요",
    love: "상대를 키워 주는 연애를 해요",
  },
  {
    traits: ["결단이 빠르고 뒤끝이 없어요", "내 사람은 끝까지 지키는 의리", "단련될수록 빛나는 사람", "말이 직설적이라 오해를 사기도 해요"],
    angry: "그 자리에서 말하고, 바로 잊어요",
    love: "밀당 없이 직진해요",
  },
  {
    traits: ["섬세하고 기준이 높아요", "자존심이 곧 에너지예요", "예쁜 것, 정확한 것을 좋아해요", "상처를 오래 기억해요"],
    angry: "차갑게 선을 그어요",
    love: "나를 알아봐 주는 사람에게 약해요",
  },
  {
    traits: ["생각의 스케일이 크고 자유로워요", "사람과 정보를 잇는 흐름의 사람", "지혜롭지만 속을 다 보이진 않아요", "한곳에 묶이면 답답해해요"],
    angry: "말 대신 멀리 떠나 버려요",
    love: "자유를 존중해 주는 사람과 오래가요",
  },
  {
    traits: ["조용히 스며들어 마음을 적셔요", "직감이 좋고 눈치가 빨라요", "보이지 않는 곳에서 큰일을 해요", "감수성이 풍부해 쉽게 지쳐요"],
    angry: "혼자 울고, 혼자 풀어요",
    love: "말하지 않아도 알아주길 바라요",
  },
];

export const stemName = (s: number) => `${STEMS_KO[s]}${ELEMENT_KO[stemEl(s)]}(${STEMS[s]}${ELEMENT_HANJA[stemEl(s)]})`;
export const stemThing = (s: number) => DAY_IMAGE[s].thing;
export const stemCure = (s: number) => DAY_IMAGE[s].cureText;

// ⑤ 일간 궁합: the stem it combines with (천간합), the element that feeds it (인성), the element that
// restrains it (관성: friction that makes one grow).
export function stemMatches(s: number) {
  const el = stemEl(s);
  const pair = (e: number) => [e * 2, e * 2 + 1];
  return {
    bond: (s + 5) % 10,
    feeds: pair((el + 4) % 5),
    tests: pair((el + 3) % 5),
  };
}

// ② 60일주 도감: what the day pillar is, from the tables.
const ZODIAC = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];
export function iljuFacts(stem: number, branch: number) {
  const day = { dayStem: stem, dayBranch: branch } as Pillars;
  const stage = stageOf(stem, branch);
  const tags = [
    ...(isGoegang(day) ? ["괴강"] : []),
    ...(isBaekho(day) ? ["백호"] : []),
    ...(stemEl(stem) === BRANCH_EL[branch] ? ["간여지동"] : []),
    // 양인: a yang stem at its peak (제왕) seat, the blade of the chart.
    ...(stem % 2 === 0 && stage === "제왕" ? ["양인"] : []),
  ];
  return {
    name: `${STEMS_KO[stem]}${BRANCHES_KO[branch]}일주`,
    hanja: `${STEMS[stem]}${BRANCHES[branch]}`,
    image: `${DAY_IMAGE[stem].thing} 위의 ${ZODIAC[branch]}`,
    stage,
    stageText: STAGE_TEXT[stage],
    tags,
  };
}
export const ILJU_TAG_TEXT: Record<string, string> = {
  괴강: "괴강 일주: 판이 크고 기복도 커요. 잘될 땐 크게 잘되는 우두머리 기질",
  백호: "백호 일주: 밀어붙이는 힘이 세요. 급한 일과 부상만 조심하면 큰 추진력",
  간여지동: "간여지동: 천간과 지지가 같은 기운. 속과 겉이 같아 주관이 뚜렷해요",
  양인: "양인 일주: 칼을 쥔 듯한 결단력. 욱하는 순간만 다스리면 큰 무기예요",
};

// A day pillar's place in the sixty (1 = 갑자 … 60 = 계해), and the next day it comes round (Korean calendar),
// so the 60일주 도감 can post each pillar on its own day.
export const jiaziNo = (stem: number, branch: number) => Array.from({ length: 60 }, (_, i) => i).findIndex((i) => i % 10 === stem && i % 12 === branch) + 1;
export function nextDayOf(stem: number, branch: number, from = Date.now()) {
  const hanja = `${STEMS[stem]}${BRANCHES[branch]}`;
  for (let i = 0; i < 60; i++) {
    const d = new Date(from + 9 * 3600000 + i * 86400000);
    const solar = Solar.fromYmd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    const l = solar.getLunar();
    if (l.getDayGan() + l.getDayZhi() === hanja)
      return { m: d.getUTCMonth() + 1, d: d.getUTCDate(), weekday: "일월화수목금토"[d.getUTCDay()] };
  }
  return null;
}
