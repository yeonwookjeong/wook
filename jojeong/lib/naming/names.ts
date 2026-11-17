// The given names the engine may give in Hanja: real, common Korean names only (pure Korean names are below) (an unusual pairing of syllables is the
// fastest way to lose a Korean reader's trust), with how they feel to a Korean ear.
// feel: m masculine · f feminine · n either. era: when the name was most heard (a feeling, not a statistic —
// to be checked against the Supreme Court's birth registration figures, docs/naming-study.md).
//   new 2000s on · mid 1980s–90s · old 1960s–70s
// Draft: to be reviewed by Korean readers of several ages before launch.

export type Feel = "m" | "f" | "n";
export type Era = "new" | "mid" | "old";
export type GivenName = { ko: string; feel: Feel; era: Era };

const rows = (feel: Feel, era: Era, list: string) => list.split(" ").map((ko): GivenName => ({ ko, feel, era }));

export const GIVEN: GivenName[] = [
  ...rows("m", "new", "서준 하준 도윤 시우 은우 지호 예준 유준 수호 주원 이준 건우 우진 선우 연우 민준 준서 도현 지환 태윤 시윤 은호 승우 지후 준우 유찬 이현 태오"),
  ...rows("m", "mid", "지훈 현우 동현 정우 승현 민재 준호 성민 태현 재원 준영 민수 현준 상우 재현 성훈 진우 준혁 영훈 승민 민석 우현"),
  ...rows("m", "old", "상훈 정훈 현석 성호 영호 동욱 재훈 경민 종현 상민"),
  ...rows("f", "new", "서윤 서연 하윤 하은 민서 지유 윤서 채원 수아 지아 서아 예은 다은 예린 소윤 유나 하린 지윤 서현 은서 가은 예원 채은 나연 아린 소율 다인 시아 하율 연서"),
  ...rows("f", "mid", "민지 유진 수민 혜원 지은 수진 혜진 소연 지현 은지 유리 수빈 지원 혜인 예진 다현 서영 지혜"),
  ...rows("f", "old", "은영 미정 지영 현정 미영 은정 선영 혜정 미경 정은"),
  ...rows("n", "new", "지우 서진 시온 유빈 지안 현서 이안 주아"),
  ...rows("n", "mid", "지민 수현 민혁 은수 정민 현진"),
  // Korean names that also sound like common foreign ones (Hannah, Mia, Leah, Sarah, Noah, Juan…)
  ...rows("f", "new", "한나 미아 리아 세라 지나 하나 나리"),
  ...rows("f", "mid", "수지"),
  ...rows("m", "new", "노아 주안"),
];

// 순우리말 (pure Korean) names: no Hanja, the word itself is the meaning. el links the meaning to an element by our
// own rule (docs/naming-study.md 9장): the thing itself (river → Water), a virtue by the five constants
// (benevolence 仁 Wood · courtesy 禮 Fire · trust 信 Earth · righteousness 義 Metal · wisdom 智 Water), a season.
export type PureName = { ko: string; en: string; el: number; feel: Feel; era: Era };
export const PURE: PureName[] = [
  { ko: "하늘", en: "sky", el: 3, feel: "n", era: "mid" },
  { ko: "가람", en: "river (old Korean)", el: 4, feel: "m", era: "mid" },
  { ko: "바다", en: "sea", el: 4, feel: "f", era: "mid" },
  { ko: "아라", en: "sea (old Korean)", el: 4, feel: "f", era: "new" },
  { ko: "이슬", en: "dew", el: 4, feel: "f", era: "mid" },
  { ko: "단비", en: "rain that comes just when it is needed", el: 4, feel: "f", era: "mid" },
  { ko: "슬기", en: "wisdom", el: 4, feel: "f", era: "mid" },
  { ko: "솔", en: "pine tree", el: 0, feel: "n", era: "new" },
  { ko: "새봄", en: "a new spring", el: 0, feel: "f", era: "new" },
  { ko: "다솜", en: "love (old Korean)", el: 0, feel: "f", era: "mid" },
  { ko: "나래", en: "wings", el: 0, feel: "f", era: "mid" },
  { ko: "한결", en: "steadfast, always the same", el: 2, feel: "m", era: "new" },
  { ko: "누리", en: "the whole world", el: 2, feel: "n", era: "mid" },
  { ko: "마루", en: "ridge, summit", el: 2, feel: "m", era: "new" },
  { ko: "소담", en: "plentiful and lovely", el: 2, feel: "f", era: "new" },
  { ko: "빛나", en: "to shine", el: 1, feel: "f", era: "mid" },
  { ko: "노을", en: "the glow of sunset", el: 1, feel: "f", era: "new" },
  { ko: "한별", en: "a great star", el: 1, feel: "n", era: "mid" },
  { ko: "보람", en: "the reward of a thing well done", el: 2, feel: "n", era: "mid" },
  { ko: "가을", en: "autumn", el: 3, feel: "f", era: "new" },
];

// Korean surnames to offer, the most common first, with their 원획 (checked against naming practice,
// docs/naming-study.md) and the spelling Koreans use abroad.
export type Surname = { ko: string; hanja: string; won: number; en: string };
export const SURNAMES: Surname[] = [
  { ko: "김", hanja: "金", won: 8, en: "Kim" },
  { ko: "이", hanja: "李", won: 7, en: "Lee" },
  { ko: "박", hanja: "朴", won: 6, en: "Park" },
  { ko: "최", hanja: "崔", won: 11, en: "Choi" },
  { ko: "정", hanja: "鄭", won: 19, en: "Jeong" },
  { ko: "강", hanja: "姜", won: 9, en: "Kang" },
  { ko: "조", hanja: "趙", won: 14, en: "Jo" },
  { ko: "윤", hanja: "尹", won: 4, en: "Yoon" },
  { ko: "장", hanja: "張", won: 11, en: "Jang" },
  { ko: "임", hanja: "林", won: 8, en: "Lim" },
  { ko: "한", hanja: "韓", won: 17, en: "Han" },
  { ko: "오", hanja: "吳", won: 7, en: "Oh" },
  { ko: "서", hanja: "徐", won: 10, en: "Seo" },
  { ko: "신", hanja: "申", won: 5, en: "Shin" },
  { ko: "권", hanja: "權", won: 22, en: "Kwon" },
  { ko: "황", hanja: "黃", won: 12, en: "Hwang" },
  { ko: "안", hanja: "安", won: 6, en: "Ahn" },
  { ko: "송", hanja: "宋", won: 7, en: "Song" },
  { ko: "유", hanja: "柳", won: 9, en: "Yoo" },
  { ko: "홍", hanja: "洪", won: 10, en: "Hong" },
  { ko: "고", hanja: "高", won: 10, en: "Ko" },
  { ko: "문", hanja: "文", won: 4, en: "Moon" },
  { ko: "손", hanja: "孫", won: 10, en: "Son" },
  { ko: "배", hanja: "裵", won: 14, en: "Bae" },
  { ko: "백", hanja: "白", won: 5, en: "Baek" },
  { ko: "허", hanja: "許", won: 11, en: "Heo" },
  { ko: "남", hanja: "南", won: 9, en: "Nam" },
  { ko: "노", hanja: "盧", won: 16, en: "Noh" },
  { ko: "하", hanja: "河", won: 9, en: "Ha" },
  { ko: "민", hanja: "閔", won: 12, en: "Min" },
  { ko: "나", hanja: "羅", won: 20, en: "Na" },
  { ko: "진", hanja: "陳", won: 16, en: "Jin" },
  { ko: "도", hanja: "都", won: 16, en: "Do" },
  { ko: "마", hanja: "馬", won: 10, en: "Ma" },
  { ko: "류", hanja: "劉", won: 15, en: "Ryu" },
];

// Syllables whose romanization reads badly in English, or is hard to say (docs/naming-study.md 8장). Draft.
export const ROMAN_AVOID: Record<string, "avoid" | "warn" | "hard"> = {
  국: "avoid", 숙: "avoid", 동: "warn", 신: "warn", 필: "warn", 강: "warn", 분: "warn", 범: "warn", 석: "warn",
  은: "hard", 의: "hard", 응: "hard", 경: "hard", 화: "hard", 웅: "hard", 렬: "hard", 륜: "hard",
};
