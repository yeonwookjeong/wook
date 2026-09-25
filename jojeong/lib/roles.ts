import type { RoleKey } from "./saju";

export type Role = {
  title: string;
  rank: string;
  order: number;
  tagline: string;
  report: string;
  advice: string;
  tone: "gold" | "ink" | "red" | "gray";
};

export const ROLES: Record<RoleKey, Role> = {
  yeong: {
    title: "영의정",
    rank: "정1품 · 조정 서열 1위",
    order: 0,
    tagline: "전하의 반쪽, 나라의 기둥",
    report:
      "전하, 조정을 통틀어 이만한 인물이 없사옵니다. 나라가 흔들려도 이 자 하나면 버틸 수 있사옵니다.",
    advice: "영의정 자리는 새 신하가 들어오면 언제든 뺏길 수 있사옵니다. 오늘 밥 한 끼 사시옵소서.",
    tone: "gold",
  },
  jwa: {
    title: "좌의정",
    rank: "정1품",
    order: 1,
    tagline: "급할 때 제일 먼저 떠오르는 조력자",
    report:
      "전하께서 흔들리실 때마다 뒤에서 받쳐줄 인물이옵니다. 새벽 세 시에 전화해도 받을 자가 바로 이 자이옵니다.",
    advice: "고마움은 말로 해야 아는 법이옵니다. 가끔은 표현하시옵소서.",
    tone: "gold",
  },
  daejehak: {
    title: "대제학",
    rank: "정2품 · 홍문관",
    order: 2,
    tagline: "전하의 스승이자 브레인",
    report:
      "이 자의 기운이 전하를 생(生)하니, 곁에 두면 배우는 것이 많사옵니다. 인생 고민은 이 자에게 하문하시옵소서.",
    advice: "받기만 하면 곳간이 마르옵니다. 가끔은 전하께서 먼저 챙기시옵소서.",
    tone: "ink",
  },
  byeongjo: {
    title: "병조판서",
    rank: "정2품 · 병조",
    order: 2,
    tagline: "등을 맡길 수 있는 전우",
    report:
      "전하와 같은 기운을 타고난 자이옵니다. 말하지 않아도 통하고, 싸움이 나면 등을 맡길 수 있사옵니다.",
    advice: "너무 닮아서 부딪칠 때도 있사옵니다. 승부욕은 게임에서만 푸시옵소서.",
    tone: "ink",
  },
  hojo: {
    title: "호조판서",
    rank: "정2품 · 호조",
    order: 2,
    tagline: "같이 있으면 돈이 도는 곳간지기",
    report:
      "전하의 기운이 이 자를 다스리는 형국이라, 함께 일을 도모하면 재물이 도옵니다. 동업이나 사이드 프로젝트 짝으로 제격이옵니다.",
    advice: "돈 이야기는 처음부터 분명히 하시옵소서. 그래야 오래 가옵니다.",
    tone: "ink",
  },
  yejo: {
    title: "예조판서",
    rank: "정2품 · 예조",
    order: 2,
    tagline: "잔치를 여는 흥 담당",
    report:
      "전하의 기운이 이 자에게 흘러가니, 함께 있으면 전하의 끼가 폭발하옵니다. 놀 때는 무조건 이 자를 부르시옵소서.",
    advice: "전하께서 늘 퍼주는 쪽이 되기 쉽사옵니다. 지칠 땐 쉬어 가시옵소서.",
    tone: "ink",
  },
  daesaheon: {
    title: "대사헌",
    rank: "종2품 · 사헌부",
    order: 3,
    tagline: "뼈 때리는 직언 담당",
    report:
      "이 자의 기운이 전하를 누르되 해치지는 않으니, 듣기 싫은 소리를 해주는 귀한 신하이옵니다. 쓴소리가 약이 되는 관계이옵니다.",
    advice: "잔소리로 들려도 끝까지 들으시옵소서. 대개는 맞는 말이옵니다.",
    tone: "ink",
  },
  gansin: {
    title: "간신",
    rank: "품계 박탈",
    order: 4,
    tagline: "웃는 얼굴 뒤에 칼을 품은 자",
    report:
      "전하… 소신 정 훈도, 감히 아뢰옵니다. 이 자의 기운이 전하를 누르거나 전하의 것을 넘보는데, 일주(日柱)에 받쳐주는 합이 없사옵니다. 달콤한 말일수록 한 번 더 살피시옵소서.",
    advice: "진짜 간신인지는 사주가 아니라 행동이 말해주옵니다. 중요한 비밀만 조금 아끼시옵소서.",
    tone: "red",
  },
  yubae: {
    title: "유배",
    rank: "귀양 · 먼 섬",
    order: 5,
    tagline: "거리를 둬야 서로 사는 사이",
    report:
      "두 분의 기운이 정면으로 부딪치옵니다. 가까이 두면 사소한 일로 자꾸 불꽃이 튀옵니다.",
    advice: "서운하셔도 유배는 벌이 아니라 휴식이옵니다. 적당한 거리에서 보면 오히려 좋은 사이이옵니다.",
    tone: "gray",
  },
};

export const EMPTY_SEATS: RoleKey[] = ["yeong", "jwa", "daejehak", "byeongjo", "hojo", "yejo", "daesaheon", "gansin"];
