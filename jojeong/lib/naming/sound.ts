// "Sounds like my name": an English name in Korean sounds (외래어 표기, the way Koreans write it), and how close
// a Korean given name comes to it, syllable by syllable.

// Common English (and Spanish, German…) first names as Koreans write them. Anything else is spelled out by rule.
const KNOWN: Record<string, string> = {
  emily: "에밀리", olivia: "올리비아", emma: "엠마", ava: "에이바", sophia: "소피아", sofia: "소피아", isabella: "이사벨라", mia: "미아",
  charlotte: "샬럿", amelia: "아멜리아", harper: "하퍼", evelyn: "에벌린", abigail: "애비게일", ella: "엘라", grace: "그레이스", chloe: "클로이",
  lily: "릴리", hannah: "한나", anna: "안나", ana: "아나", sarah: "세라", sara: "사라", jessica: "제시카", jennifer: "제니퍼", jenny: "제니",
  ashley: "애슐리", lauren: "로런", rachel: "레이철", rebecca: "레베카", laura: "로라", maria: "마리아", natalie: "나탈리", zoe: "조이",
  nora: "노라", luna: "루나", leah: "리아", lucy: "루시", sophie: "소피", julia: "줄리아", alice: "앨리스", clara: "클라라", elena: "엘레나",
  isla: "아일라", ruby: "루비", hazel: "헤이즐", victoria: "빅토리아", madison: "매디슨", kate: "케이트", katie: "케이티", megan: "메건",
  amy: "에이미", linda: "린다", susan: "수전", karen: "캐런", lisa: "리사", nancy: "낸시", michelle: "미셸", elizabeth: "엘리자베스",
  mary: "메리", helen: "헬렌", nina: "니나", daniela: "다니엘라", camila: "카밀라", valentina: "발렌티나", gabriela: "가브리엘라",
  lucia: "루시아", yuna: "유나", jina: "지나", hana: "하나", erin: "에린", irene: "아이린", diana: "다이애나", eva: "에바", lena: "레나",
  liam: "리엄", noah: "노아", oliver: "올리버", james: "제임스", elijah: "일라이자", william: "윌리엄", henry: "헨리", lucas: "루카스",
  benjamin: "벤저민", theodore: "시어도어", mateo: "마테오", leo: "레오", jack: "잭", daniel: "대니얼", michael: "마이클", david: "데이비드",
  john: "존", joseph: "조지프", samuel: "새뮤얼", matthew: "매슈", andrew: "앤드루", ryan: "라이언", ethan: "이선", aiden: "에이든",
  jacob: "제이컵", logan: "로건", owen: "오언", ian: "이언", adam: "애덤", alex: "알렉스", alexander: "알렉산더", chris: "크리스",
  christopher: "크리스토퍼", kevin: "케빈", brian: "브라이언", jason: "제이슨", justin: "저스틴", eric: "에릭", thomas: "토머스",
  robert: "로버트", richard: "리처드", mark: "마크", paul: "폴", peter: "피터", simon: "사이먼", sean: "숀", nathan: "네이선",
  isaac: "아이작", gabriel: "가브리엘", diego: "디에고", carlos: "카를로스", juan: "후안", luis: "루이스", jose: "호세", miguel: "미겔",
  marco: "마르코", max: "맥스", tom: "톰", sam: "샘", ben: "벤", jake: "제이크", kyle: "카일", tyler: "타일러", dylan: "딜런", evan: "에번",
  jordan: "조던", taylor: "테일러", jamie: "제이미", charlie: "찰리", harry: "해리", george: "조지", arthur: "아서", felix: "펠릭스",
  hugo: "휴고", kai: "카이", luca: "루카", elias: "엘리아스", jonas: "요나스", noel: "노엘", julian: "줄리언", jun: "준", minho: "민호",
};

// Rough spelling-out for names not in the list: a vowel-led chunk becomes one syllable. Good enough for the
// first one or two syllables, which is all the matching needs.
const ONSET: [RegExp, number][] = [
  [/^(ch|tch)/, 14], [/^(sh|sch)/, 9], [/^th/, 3], [/^ph/, 17], [/^(k|c(?![eiy])|q|ck)/, 15], [/^c/, 9], [/^g(?=[eiy])/, 12], [/^g/, 0],
  [/^j/, 12], [/^n/, 2], [/^d/, 3], [/^(l|r)/, 5], [/^m/, 6], [/^(b|v)/, 7], [/^(s|z|x)/, 9], [/^t/, 16], [/^(p|f)/, 17], [/^h/, 18], [/^(w|y)/, 11],
];
const NUCLEUS: [RegExp, number][] = [
  [/^(ai|ay|ei|ey)/, 5], [/^(ee|ea|ie|i|y)/, 20], [/^(oo|u)/, 13], [/^(ou|ow|au|aw)/, 8], [/^(oa|o)/, 8], [/^e/, 5], [/^a/, 0],
];
function spellOut(name: string): string {
  let s = name.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
  let out = "";
  while (s && out.length < 4) {
    let c = 11;
    for (const [re, idx] of ONSET) {
      const m = re.exec(s);
      if (m) {
        c = idx;
        s = s.slice(m[0].length);
        break;
      }
    }
    let v = 18; // ㅡ when no vowel follows
    for (const [re, idx] of NUCLEUS) {
      const m = re.exec(s);
      if (m) {
        v = idx;
        s = s.slice(m[0].length);
        break;
      }
    }
    // A consonant right before another consonant or the end closes the syllable (ㄴ, ㄹ, ㅁ, ㅇ, ㄱ).
    let f = 0;
    const coda = /^(ng|n|l|r|m|k|c|g)(?![aeiouy])/.exec(s);
    if (coda) {
      f = { ng: 21, n: 4, l: 8, r: 8, m: 16, k: 1, c: 1, g: 1 }[coda[1]] ?? 0;
      s = s.slice(coda[1].length);
    }
    out += String.fromCharCode(0xac00 + c * 588 + v * 28 + f);
  }
  return out;
}

/** "Ryan" → "라이언" */
export const koreanSound = (first: string) => KNOWN[first.trim().toLowerCase().split(/\s+/)[0]] ?? spellOut(first);

const parts = (s: string) => {
  const i = s.charCodeAt(0) - 0xac00;
  return { c: Math.floor(i / 588), v: Math.floor((i % 588) / 28), f: i % 28 };
};
// Initials Koreans hear as alike (ㄹ at the start of a name is said ㅇ or ㄴ: 리아 → 이아, 루카 → 유카)
const C_GROUP = [0, 0, 2, 3, 3, 5, 6, 7, 7, 9, 9, 11, 12, 12, 12, 0, 3, 7, 18];
const V_GROUP = [0, 0, 0, 0, 4, 4, 4, 4, 8, 9, 9, 9, 8, 13, 9, 9, 20, 13, 18, 20, 20];
function syllableLike(a: string, b: string): number {
  const x = parts(a), y = parts(b);
  const cx = C_GROUP[x.c], cy = C_GROUP[y.c];
  const onset = cx === cy ? 1 : (cx === 5 && (cy === 11 || cy === 2)) || (cy === 5 && (cx === 11 || cx === 2)) ? 0.5 : 0;
  const vowel = V_GROUP[x.v] === V_GROUP[y.v] ? 1 : 0;
  const coda = x.f === y.f ? 0.5 : x.f && y.f ? 0.2 : 0;
  return onset + vowel + coda;
}

/** How close a Korean given name sounds to someone's own name, 0..1 (1: the same sounds in the same order). */
export function soundCloseness(given: string, theirs: string): number {
  const g = [...given], t = [...theirs];
  let best = 0;
  for (let i = 0; i < t.length; i++) {
    const first = syllableLike(g[0], t[i]) - (i > 0 ? 0.6 : 0); // starting later in their name counts less
    if (g.length === 1) {
      best = Math.max(best, first * 2);
      continue;
    }
    for (let j = i + 1; j < t.length; j++) best = Math.max(best, first + syllableLike(g[1], t[j]) - (j > i + 1 ? 0.3 : 0));
  }
  return Math.max(0, Math.min(1, best / 5));
}
