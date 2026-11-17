import type { TenGod } from "./myeongri";
import type { Board, Post, Trial } from "./byeoseul";

// 벼슬길 일대기 (2026-11-17, 대표님 "한 사람의 인생인데 최대한 다르게, 같은 선택이어도 사주에 따라 다르게"). Every
// scene is picked by one part of the chart and says which part under it, so two people who open the same doors
// still live different lives: 어린 시절 by the birth season and 신강/신약, 공부 by the 일간, 첫 해 by the post and
// the 일간's element, 인연 by the 일지 (the spouse's seat), 시련's ending by 신강/신약, 사관의 평 by the 격국.

const STEM = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCH = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const STEM_IMAGE = ["큰 나무", "풀과 덩굴", "한낮의 해", "등잔불", "큰 산", "기름진 밭", "무쇠", "보석", "큰 강", "이슬비"];

export type Scene = { lines: string[]; why: string };

const CHILD: Record<Board["story"]["season"], [string[], string[]]> = {
  봄: [
    ["봄에 태어나 들판을 뛰어다니며 자랐사옵니다.", "넘어져도 먼저 일어나는 아이였지요."],
    ["봄에 태어나 사랑방 어른들 곁에서 자랐사옵니다.", "어른 말씀을 귀담아듣는 아이였지요."],
  ],
  여름: [
    ["한여름에 태어나 목소리 큰 아이로 자랐사옵니다.", "동네 아이들이 늘 그 뒤를 따랐지요."],
    ["한여름에 태어나 그늘에서 책을 펴는 아이로 자랐사옵니다.", "더위보다 글이 좋았지요."],
  ],
  가을: [
    ["가을에 태어나 셈이 밝고 고집 센 아이로 자랐사옵니다.", "한 번 정한 일은 끝을 보았지요."],
    ["가을에 태어나 말수 적고 눈이 깊은 아이로 자랐사옵니다.", "남이 놓친 것을 먼저 보았지요."],
  ],
  겨울: [
    ["겨울에 태어나 추운 새벽에도 글을 읽는 아이로 자랐사옵니다.", "버티는 힘이 남달랐지요."],
    ["겨울에 태어나 화롯가에서 옛이야기를 들으며 자랐사옵니다.", "생각이 깊은 아이였지요."],
  ],
};

const STUDY = [
  "큰 나무처럼 곧게, 경전 한 권을 처음부터 끝까지 파고들었사옵니다.",
  "덩굴처럼 유연하게, 스승 여럿을 찾아다니며 배웠사옵니다.",
  "해처럼 환하게, 벗들 앞에서 소리 내어 읽으며 익혔사옵니다.",
  "등잔불처럼 조용히, 밤마다 홀로 등잔 아래 앉았사옵니다.",
  "큰 산처럼 묵묵히, 하루도 거르지 않고 같은 자리에 앉았사옵니다.",
  "밭을 일구듯 차근차근, 배운 것을 빠짐없이 옮겨 적었사옵니다.",
  "쇠를 벼리듯 매섭게, 틀린 답은 백 번이라도 다시 썼사옵니다.",
  "보석을 다듬듯 꼼꼼히, 글자 하나도 허투루 넘기지 않았사옵니다.",
  "큰 강처럼 넓게, 경전 밖의 책까지 두루 읽었사옵니다.",
  "이슬비가 스미듯, 외운 글을 꿈속에서도 되뇌었사옵니다.",
];

const FIRST_YEAR: Record<Post, string> = {
  hongmun: "첫해에 임금께 올릴 글을 짓는 일을 맡았사옵니다.",
  saheon: "첫해부터 높은 대감의 잘못을 따지는 상소를 올렸사옵니다.",
  seungjeong: "첫해부터 새벽마다 임금의 명을 받아 적었사옵니다.",
  suryeong: "첫 부임지는 흉년 든 작은 고을이었사옵니다.",
  seonjeon: "첫해부터 임금의 행차를 맨 앞에서 지켰사옵니다.",
  hullyeon: "첫해에 신병 백 명을 맡아 활쏘기를 가르쳤사옵니다.",
  byeonbang: "첫 부임지는 눈보라 치는 북쪽 국경이었사옵니다.",
  podo: "첫해에 한양을 떠들썩하게 한 도적 떼를 쫓았사옵니다.",
  yeokgwan: "첫해에 사신단을 따라 북경까지 걸어갔사옵니다.",
  naeui: "첫해에 열병 도는 마을로 약을 지고 나갔사옵니다.",
  gwansang: "첫해에 일식 날짜를 셈하는 일을 맡았사옵니다.",
  yulgwan: "첫해에 십 년 묵은 땅 송사를 맡았사옵니다.",
};

// How the work was done, by the 일간's element (木火土金水).
const STYLE = [
  "남이 마다한 일을 먼저 맡아 길을 냈지요.",
  "앞장서 목소리를 내니 금세 이름이 났지요.",
  "서두르지 않고 다 들어 준 끝에 모두가 따랐지요.",
  "원칙대로 딱 잘라 처리하니 아무도 토를 달지 못했지요.",
  "막힌 곳을 돌아 흐르듯, 남이 못 찾은 길을 찾았지요.",
];
const ELEMENT = ["나무", "불", "흙", "쇠", "물"];

// 인연, by the 일지 (the seat of the spouse).
const BOND = [
  "깊은 밤 책방에서 같은 책을 찾던 이와 연을 맺었사옵니다.",
  "말없이 곁을 지켜 주던 고향 사람과 혼인했사옵니다.",
  "활터에서 만난 기개 있는 이와 연을 맺었사옵니다.",
  "봄날 꽃구경 길에 눈이 마주친 이와 혼인했사옵니다.",
  "중매로 만났으나, 살수록 속 깊은 이였사옵니다.",
  "재치 있는 말로 그대를 웃게 한 이와 연을 맺었사옵니다.",
  "장터 한복판에서 먼저 말을 건 이와 혼인했사옵니다.",
  "음식 솜씨로 집안을 따뜻하게 한 이와 연을 맺었사옵니다.",
  "먼 길 떠난 길목에서 만난 이와 혼인했사옵니다.",
  "단정한 글씨로 편지를 보내 온 이와 연을 맺었사옵니다.",
  "그대 집안을 오래 알던 믿음직한 이와 혼인했사옵니다.",
  "강가 나루터에서 만난 이와 연을 맺었사옵니다.",
];

// How the trial ended, by 신강 (first) or 신약 (second).
const TRIAL_END: Record<Trial, [string, string]> = {
  exile: ["섬에서도 글을 놓지 않아, 풀려나던 날 더 단단해져 돌아왔사옵니다.", "섬의 바람은 매서웠으나, 섬사람들이 그대를 스승으로 모셨사옵니다."],
  war: ["맨 앞에서 성을 지켜 내니 공신 명단에 이름이 올랐사옵니다.", "앞에 서기보다 군량을 챙겨 성 안 사람들을 살렸사옵니다."],
  faction: ["물러서지 않고 맞서다 한때 파직되었으나, 다시 불려 왔사옵니다.", "어느 편에도 서지 않고 버티니, 두 편 모두 그대를 찾았사옵니다."],
  patron: ["발탁된 자리에서 제 몫 이상을 해내 그분의 얼굴을 세웠사옵니다.", "그분의 그늘에서 차분히 배우며 큰일을 맡을 그릇이 되었사옵니다."],
  calm: ["조용히 쌓은 공이 어느 날 한꺼번에 알려졌사옵니다.", "맡은 고을과 관청이 그대 덕에 두루 평안했사옵니다."],
};

// 사관의 평, by the 격국 (the frame the birth month gives).
const VERDICT: Record<TenGod, string> = {
  비견: "제 힘으로 섰고, 벗을 버리지 않았다",
  겁재: "다툼이 많았으나 끝내 지지 않았다",
  식신: "가는 곳마다 사람을 먹이고 살렸다",
  상관: "할 말을 참지 않아 미움도 받았으나 옳았다",
  편재: "재물을 크게 모으고 또 크게 풀었다",
  정재: "맡은 장부에 한 줄도 틀림이 없었다",
  편관: "위기에 강했고 두려움을 몰랐다",
  정관: "법도를 지켜 흠잡을 데가 없었다",
  편인: "남이 보지 못한 것을 먼저 보았다",
  정인: "배움을 놓지 않아 늘 스승이라 불렸다",
};

const s = (b: Board) => b.story;

export const childScene = (b: Board): Scene => ({
  lines: CHILD[s(b).season][s(b).strong ? 0 : 1],
  why: `태어난 계절이 ${s(b).season}이고, 나를 받치는 힘이 ${s(b).strong ? "센" : "여린"} 사주라`,
});

export const studyScene = (b: Board): Scene => ({
  lines: [STUDY[s(b).dayStem]],
  why: `타고난 바탕인 일간이 ${STEM[s(b).dayStem]}, ${STEM_IMAGE[s(b).dayStem]}의 기운이라`,
});

export const workScene = (b: Board, post: Post): Scene => ({
  lines: [FIRST_YEAR[post], STYLE[Math.floor(s(b).dayStem / 2)]],
  why: `일간이 ${ELEMENT[Math.floor(s(b).dayStem / 2)]}의 기운이라 일하는 결이 이렇사옵니다`,
});

export const bondScene = (b: Board): Scene => ({
  lines: [BOND[s(b).dayBranch]],
  why: `배우자 자리인 일지가 ${BRANCH[s(b).dayBranch]}라`,
});

export const trialEnd = (b: Board, trial: Trial) => TRIAL_END[trial][s(b).strong ? 0 : 1];

export const verdict = (b: Board) => VERDICT[s(b).gyeok];
