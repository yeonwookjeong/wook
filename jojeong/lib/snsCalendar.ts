// What goes up on Instagram and Threads each day, for the admin SNS page (/admin/sns). The plan itself and
// its rules live in docs/content-calendar.md; this is the ready-to-post part. Each day: the card set (one
// /admin/cards query per slide, in order), the Instagram caption, the noon Threads chain (one string per
// post, no numbers) and, only when a day needs its own, the night post. The morning and night posts are otherwise written per day by lib/snsMorning.ts and lib/snsNight.ts.
export type SnsDay = {
  title: string;
  cards?: string[];
  // Reels: one dense 1080×1920 picture each (lib/../app/admin/cards ReelFrame), music and a sticker added in Instagram.
  reels?: string[];
  caption?: string;
  threads?: string[];
  night?: string;
  // The 18:30 Threads chain (a season or an everyday habit, or a one-post question).
  eveningThreads?: string[];
  // The night Threads chain (one string per post), when the day has its own instead of lib/snsNight.ts.
  nightThreads?: string[];
  // Anything to remember when posting (a holiday, a regular slot).
  note?: string;
};

const CLOSING = "c=cta&who=saju";
// The fixed last lines of every Threads chain (the profile link holds the rest), for the chains to come:
// "나머지 이야기는 그대 사주에 있사옵니다 / 프로필 링크로 오시옵소서".

export const SNS: Record<string, SnsDay> = {
  "2026-10-01": {
    title: "그대는 나무? 촛불? (일주 앞 글자 10가지)",
    cards: ["c=gan-cover", "c=gan-where", "c=gan-list1", "c=gan-list2", "c=gan-same", CLOSING],
    caption: `"그대는 무슨 띠이옵니까?"
이 질문은 다들 대답하시지요.
그렇다면 이건 어떠하옵니까.
"그대는 나무이옵니까, 촛불이옵니까?"

태어난 날의 두 글자, 일주.
그 가운데 위 글자가 사주에서 '나'를 뜻하옵니다.
하늘 글자는 모두 열 가지.
큰 나무와 꽃, 태양과 촛불, 큰 산과 논밭,
바위와 보석, 큰 강과 이슬비.

띠는 태어난 해에서, 나의 모습은 태어난 날에서 나오니
같은 띠 친구라도 앞 글자는 다를 수 있사옵니다.

그대의 앞 글자는 무엇이옵니까?
댓글로 남겨 주시면 정 훈도가 한 줄 붙여 드리겠사옵니다 🙇

#일주 #사주 #나의일주 #천간 #명리학 #사주공부 #훈도사주`,
    threads: [
      `"무슨 띠예요?"에는 다들 바로 답하시는데
"무슨 일주예요?"에는 대부분 멈칫하시옵니다.`,
      `일주는 태어난 날의 두 글자이옵니다.
그중 위 글자가 사주에서 '나'를 뜻하지요.
丁未일에 태어났다면, 그대는 丁. 촛불이옵니다.`,
      `위 글자는 모두 열 가지이옵니다.
甲 큰 나무 · 乙 꽃 · 丙 태양 · 丁 촛불 · 戊 큰 산
己 논밭 · 庚 바위 · 辛 보석 · 壬 큰 강 · 癸 이슬비`,
      `띠는 태어난 해에서, 나의 모습은 태어난 날에서 나오니
같은 띠 친구라도 한 사람은 큰 산, 한 사람은 촛불일 수 있사옵니다.`,
      `그대는 열 가지 가운데 무엇이옵니까?
앞 글자를 남겨 주시면 한 줄 붙여 드리겠사옵니다.`,
    ],
  },
  "2026-10-02": {
    title: "손 없는 날, 그 ‘손’이 뭐길래?",
    cards: ["c=son-cover", "c=son-who", "c=son-nine", "c=son-diff", "c=son-me", CLOSING],
    reels: ["c=son-reel&y=2026&m=10"],
    caption: `이사 날짜 고르실 때, 달력에 빨간 동그라미부터 치시옵니까?
손 없는 날 말이옵니다.

'손'은 날마다 동서남북을 옮겨 다니며
그쪽에서 벌이는 일을 방해한다고 믿은 귀신이옵니다.
음력 1·2일엔 동쪽, 3·4일엔 남쪽, 5·6일엔 서쪽, 7·8일엔 북쪽.
그리고 끝자리가 9와 0인 날엔 하늘로 올라가 어디에도 없지요.
그래서 손 없는 날이옵니다.

한 달에 딱 여섯 날뿐이라
모두가 그날로 몰리는 것이옵니다.

다만 소신이 한 말씀 올리자면,
손 없는 날은 누구에게나 같은 날이옵니다.
사주로 보는 좋은 날은 사람마다 다르지요.
모두에게 좋다는 날이 그대에게는 부딪히는 날일 수도 있사옵니다.

그대는 이사 날짜, 어찌 고르시옵니까? 🙇

#손없는날 #이사날짜 #이사 #택일 #길일 #사주 #명리학 #훈도사주`,
    threads: [
      `이사 날짜는 다들 '손 없는 날'로 잡으시지요.
그런데 그 '손'이 무엇인지 아시옵니까?`,
      `손은 날마다 방향을 옮겨 다니며
그쪽 일을 방해한다고 믿은 귀신이옵니다.
음력 1·2일 동쪽, 3·4일 남쪽, 5·6일 서쪽, 7·8일 북쪽.`,
      `끝자리가 9와 0인 날엔 하늘로 올라가 어디에도 없사옵니다.
그래서 손 없는 날. 한 달에 여섯 날뿐이라 이삿짐 예약이 몰리지요.`,
      `그런데 손 없는 날은 사주와는 뿌리가 다른 풍속이옵니다.
음력 날짜만 보니, 누구에게나 같은 날이지요.`,
      `사주로 보면 좋은 날은 사람마다 다르옵니다.
손 없는 날이 子의 날이면, 午의 날에 태어난 이에게는 부딪히는 날이지요.
그대에게 좋은 날은 따로 있사옵니다.`,
    ],
  },
  "2026-10-03": {
    title: "그대의 일주에도 동물이 숨어 있사옵니다 (뒤 글자 12동물)",
    note: "개천절",
    cards: ["c=ji-cover", "c=ji-where", "c=ji-list1", "c=ji-list2", "c=ji-diff", CLOSING],
    reels: ["c=tti-reel"],
    caption: `"무슨 띠이옵니까?" 하면 다들 바로 답하시지요.
그런데 그대에게는 동물이 하나 더 있사옵니다.

태어난 날의 두 글자, 일주.
위 글자가 나의 모습이라면,
아래 글자에는 동물이 숨어 있사옵니다.
쥐, 소, 호랑이, 토끼, 용, 뱀,
말, 양, 원숭이, 닭, 개, 돼지.
띠와 같은 열두 동물이지요.

다만 띠는 태어난 해에서,
날의 동물은 태어난 날에서 나오옵니다.
띠는 열두 해마다, 날의 동물은 열이틀마다 바뀌지요.
그래서 같은 띠 친구라도 날의 동물은 제각각이옵니다.

그대의 띠와 날의 동물, 같사옵니까 다르옵니까? 🙇

#일주 #띠 #십이지 #12간지 #사주 #명리학 #사주공부 #훈도사주`,
    threads: [
      `다들 띠는 하나라고 아시지요.
그런데 사주에는 동물이 넷이옵니다.
태어난 해, 달, 날, 시에 하나씩.`,
      `그중 띠는 태어난 해의 동물이옵니다.
그해에 태어난 이는 모두 같은 동물이지요.`,
      `사주에서 '나'를 뜻하는 기둥은 태어난 날이옵니다.
그 아래 글자가 날의 동물이지요.
丁未일에 태어났다면 未, 양이옵니다.`,
      `날의 동물은 열이틀마다 바뀌옵니다.
그래서 같은 개띠 친구 셋도
날의 동물은 쥐, 말, 닭으로 다를 수 있사옵니다.`,
      `그대의 날의 동물은 무엇이옵니까?
띠와 같은 분도 계시옵니까?`,
    ],
  },
  "2026-10-04": {
    title: "같은 날 태어난 쌍둥이, 사주도 같을까요? (12시진)",
  },
  "2026-10-05": {
    title: "이번 주 가장 운 좋은 일주는? · 주간 운세 #1",
    note: "월요일 정례",
  },
  "2026-10-06": {
    title: "1월에 태어나셨다면, 띠가 다를 수 있사옵니다 (사주의 새해는 입춘)",
  },
  "2026-10-07": {
    title: "절기 24개는 어떻게 정해질까? 한로·상강은 무슨 뜻? (내일부터 무술월)",
  },
  "2026-10-08": {
    title: "이번 달 1위 일주는? 무술월 60일주 랭킹",
    note: "한로 · 정례", reels: ["c=rank-reel&y=2026&m=10"],
  },
  "2026-10-09": {
    title: "삼재가 들었다는 말, 들어 보셨사옵니까? (2026·2027 삼재 띠)",
    note: "한글날",
  },
  "2026-10-10": {
    title: "도화살이 있다는 말, 칭찬이옵니까 욕이옵니까? (도화·역마)",
  },
  "2026-10-11": { title: "태어난 시간 몰라도 사주 볼 수 있나요? (시간 모름·음력 양력·밤 11시 출생)" },
  "2026-10-12": { title: "주간 운세 #2", note: "월요일 정례" },
  "2026-10-13": { title: "그대의 동물과 찰떡인 짝꿍은? (찰떡 동물 6쌍)" },
  "2026-10-14": { title: "만나면 부딪히는 동물이 있사옵니다 (부딪히는 6쌍)" },
  "2026-10-15": { title: "행운의 색은 누가 정하옵니까? (오행을 색으로)" },
  "2026-10-16": { title: "사주는 정해진 운명이옵니까? (사주는 날씨 예보)" },
  "2026-10-17": { title: "60일주 도감 No.01 갑자" },
  "2026-10-18": { title: "60일주 도감 No.02 을축" },
  "2026-10-19": { title: "60일주 도감 No.03 병인", note: "주간 운세 #3 함께" },
  "2026-10-20": { title: "60일주 도감 No.04 정묘" },
  "2026-10-21": { title: "60일주 도감 No.05 무진" },
  "2026-10-22": { title: "60일주 도감 No.06 기사" },
  "2026-10-23": { title: "60일주 도감 No.07 경오", note: "상강" },
  "2026-10-24": { title: "60일주 도감 No.08 신미" },
  "2026-10-25": { title: "60일주 도감 No.09 임신" },
  "2026-10-26": { title: "60일주 도감 No.10 계유", note: "주간 운세 #4 함께" },
  "2026-10-27": { title: "60일주 도감 No.11 갑술" },
  "2026-10-28": { title: "60일주 도감 No.12 을해", note: "조선 인물 생일 편: 정조 · 박문수" },
  "2026-10-29": { title: "60일주 도감 No.13 병자" },
  "2026-10-30": { title: "60일주 도감 No.14 정축" },
  "2026-10-31": { title: "60일주 도감 No.15 무인", note: "조선 인물 생일 편: 영조" },
};
