// 벼슬길 관직표 (2026-11-17, 대표님 "정1품부터 종9품까지 벼슬들 싹 다 데이터 모아서, 어디를 가면 어디까지 올라갈 수
// 있는지"). The real offices of Joseon as the 경국대전 sets them, grouped into the roads a career actually walked.
// Each road is a ladder from its entry office to the highest it leads to; a road's top is where that road ends
// (a 기술관 road stops at 정3품 당하, as it did). Rank index 0 = 종9품 … 17 = 정1품.

export const RANK_NAME = [
  "종9품", "정9품", "종8품", "정8품", "종7품", "정7품", "종6품", "정6품", "종5품",
  "정5품", "종4품", "정4품", "종3품", "정3품", "종2품", "정2품", "종1품", "정1품",
] as const;

// 정3품 당상 (통정대부) sits above 정3품 당하 within the same rank; it is written as its own step in the ladders.
export type Office = { rank: number; name: string; dangsang?: true };

export type Track =
  | "jo" // 의정부와 육조 (나라 살림의 큰길)
  | "eon" // 사헌부, 사간원 (언관)
  | "hong" // 홍문관 (임금의 학문)
  | "seong" // 성균관 (나라의 학교)
  | "suryeong" // 지방관 (수령에서 관찰사)
  | "hun" // 훈련도감 (군영)
  | "byeon" // 변방 병마, 수군
  | "podo" // 포도청
  | "gwansang" // 관상감
  | "naeui" // 내의원
  | "yeok"; // 사역원

// 육조 가운데 어느 조로 가는지는 사주로: 관성 이조, 재성 호조, 인성 예조, 편관 병조, 상관 형조, 식신 공조.
export type Jo = "이조" | "호조" | "예조" | "병조" | "형조" | "공조";

export const TRACK: Record<Track, { name: string; line: string; ladder: Office[] }> = {
  jo: {
    name: "의정부와 육조",
    line: "나라 살림을 맡는 큰길. 정승까지 이어지는 유일한 길이옵니다",
    ladder: [
      { rank: 0, name: "승문원 부정자" },
      { rank: 1, name: "승문원 정자" },
      { rank: 3, name: "승문원 저작" },
      { rank: 5, name: "승문원 박사" },
      { rank: 7, name: "{조} 좌랑" },
      { rank: 9, name: "{조} 정랑" },
      { rank: 11, name: "의정부 사인" },
      { rank: 13, name: "승정원 동부승지", dangsang: true },
      { rank: 13, name: "승정원 도승지", dangsang: true },
      { rank: 14, name: "{조} 참판" },
      { rank: 15, name: "{조} 판서" },
      { rank: 16, name: "의정부 좌찬성" },
      { rank: 17, name: "우의정" },
      { rank: 17, name: "좌의정" },
      { rank: 17, name: "영의정" },
    ],
  },
  eon: {
    name: "사헌부와 사간원",
    line: "임금과 대신의 잘못을 따지는 언관의 길",
    ladder: [
      { rank: 1, name: "예문관 검열" },
      { rank: 3, name: "예문관 대교" },
      { rank: 5, name: "예문관 봉교" },
      { rank: 7, name: "사간원 정언" },
      { rank: 9, name: "사간원 헌납" },
      { rank: 9, name: "사헌부 지평" },
      { rank: 11, name: "사헌부 장령" },
      { rank: 12, name: "사헌부 집의" },
      { rank: 13, name: "사간원 대사간", dangsang: true },
      { rank: 14, name: "사헌부 대사헌" },
    ],
  },
  hong: {
    name: "홍문관",
    line: "임금의 학문을 돕는 옥당. 글로 이름을 남기는 길",
    ladder: [
      { rank: 1, name: "홍문관 정자" },
      { rank: 3, name: "홍문관 저작" },
      { rank: 5, name: "홍문관 박사" },
      { rank: 6, name: "홍문관 부수찬" },
      { rank: 7, name: "홍문관 수찬" },
      { rank: 8, name: "홍문관 부교리" },
      { rank: 9, name: "홍문관 교리" },
      { rank: 10, name: "홍문관 부응교" },
      { rank: 11, name: "홍문관 응교" },
      { rank: 12, name: "홍문관 전한" },
      { rank: 13, name: "홍문관 직제학" },
      { rank: 13, name: "홍문관 부제학", dangsang: true },
      { rank: 14, name: "홍문관 제학" },
      { rank: 15, name: "홍문관 대제학" },
    ],
  },
  seong: {
    name: "성균관",
    line: "나라의 인재를 기르는 학교, 스승의 길",
    ladder: [
      { rank: 0, name: "성균관 학유" },
      { rank: 1, name: "성균관 학록" },
      { rank: 3, name: "성균관 학정" },
      { rank: 5, name: "성균관 박사" },
      { rank: 7, name: "성균관 전적" },
      { rank: 9, name: "성균관 직강" },
      { rank: 11, name: "성균관 사예" },
      { rank: 12, name: "성균관 사성" },
      { rank: 13, name: "성균관 대사성", dangsang: true },
    ],
  },
  suryeong: {
    name: "지방관",
    line: "고을을 맡아 백성을 직접 다스리는 길",
    ladder: [
      { rank: 0, name: "능참봉" },
      { rank: 6, name: "찰방" },
      { rank: 6, name: "현감" },
      { rank: 8, name: "현령" },
      { rank: 10, name: "군수" },
      { rank: 12, name: "도호부사" },
      { rank: 13, name: "목사", dangsang: true },
      { rank: 14, name: "관찰사" },
      { rank: 15, name: "한성부 판윤" },
    ],
  },
  hun: {
    name: "훈련도감",
    line: "한양을 지키는 군영, 군사를 길러 내는 길",
    ladder: [
      { rank: 0, name: "훈련도감 초관" },
      { rank: 6, name: "훈련도감 종사관" },
      { rank: 10, name: "훈련도감 파총" },
      { rank: 13, name: "훈련도감 천총", dangsang: true },
      { rank: 14, name: "훈련도감 중군" },
      { rank: 14, name: "훈련대장" },
      { rank: 15, name: "오위도총부 도총관" },
    ],
  },
  byeon: {
    name: "변방의 병마와 수군",
    line: "국경과 바다를 지키는 장수의 길",
    ladder: [
      { rank: 0, name: "권관" },
      { rank: 6, name: "병마절제도위" },
      { rank: 10, name: "수군만호" },
      { rank: 12, name: "병마첨절제사" },
      { rank: 13, name: "수군절도사", dangsang: true },
      { rank: 14, name: "병마절도사" },
    ],
  },
  podo: {
    name: "포도청",
    line: "한양의 도적을 잡는 길",
    ladder: [
      { rank: 0, name: "포도청 부장" },
      { rank: 6, name: "포도청 종사관" },
      { rank: 14, name: "포도대장" },
    ],
  },
  gwansang: {
    name: "관상감",
    line: "하늘을 살피고 날을 고르는 기술관의 길. 정 훈도도 이곳 사람이옵니다",
    ladder: [
      { rank: 0, name: "관상감 참봉" },
      { rank: 1, name: "관상감 명과학 훈도" },
      { rank: 2, name: "관상감 봉사" },
      { rank: 4, name: "관상감 직장" },
      { rank: 6, name: "관상감 주부" },
      { rank: 8, name: "관상감 판관" },
      { rank: 10, name: "관상감 첨정" },
      { rank: 12, name: "관상감 부정" },
      { rank: 13, name: "관상감 정" },
    ],
  },
  naeui: {
    name: "내의원",
    line: "임금의 몸을 돌보는 의관의 길",
    ladder: [
      { rank: 0, name: "내의원 참봉" },
      { rank: 1, name: "내의원 부봉사" },
      { rank: 2, name: "내의원 봉사" },
      { rank: 4, name: "내의원 직장" },
      { rank: 6, name: "내의원 주부" },
      { rank: 8, name: "내의원 판관" },
      { rank: 10, name: "내의원 첨정" },
      { rank: 13, name: "내의원 정" },
    ],
  },
  yeok: {
    name: "사역원",
    line: "외국 말을 맡아 사신을 따르는 역관의 길",
    ladder: [
      { rank: 0, name: "사역원 참봉" },
      { rank: 1, name: "사역원 훈도" },
      { rank: 2, name: "사역원 봉사" },
      { rank: 4, name: "사역원 직장" },
      { rank: 6, name: "사역원 주부" },
      { rank: 8, name: "사역원 판관" },
      { rank: 10, name: "사역원 첨정" },
      { rank: 12, name: "사역원 부정" },
      { rank: 13, name: "사역원 정" },
    ],
  },
};

export const TRACKS = Object.keys(TRACK) as Track[];

export const officeName = (o: Office, jo: Jo) => o.name.replace("{조}", jo);
export const rankLabel = (o: Office) => `${RANK_NAME[o.rank]}${o.dangsang ? " 당상" : ""}`;

// Moving to another road keeps the rank: the highest step of the new ladder not above the rank now held.
export function sameRankIndex(to: Track, rank: number): number {
  const l = TRACK[to].ladder;
  let i = 0;
  for (let k = 0; k < l.length; k++) if (l[k].rank <= rank) i = k;
  return i;
}
