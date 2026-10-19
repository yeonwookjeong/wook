import "server-only";
import { readChart } from "@/lib/myeongri";
import type { Pillars } from "@/lib/saju";
import pool from "./pool.json";
import { GIVEN, PURE, ROMAN_AVOID, SURNAMES, type Era, type Feel, type GivenName, type PureName, type Surname } from "./names";

// A Korean name from a birth chart (docs/naming.md, the theory in docs/naming-study.md):
// 1. the chart's 용신 (the element it needs) and 희신 (what feeds it); its 기신 and burden are left out
// 2. a real, common Korean name (lib/naming/names.ts), never a made-up pairing of syllables
// 3. for each syllable, a familiar 인명용 한자 of the needed element with a good meaning (lib/naming/pool.json)
// 4. 81수리: the 원격 and 정격 must be lucky numbers; 획수 음양 must not be all odd or all even
// 5. ranked by: element fit, sound flow (발음오행), all four 격 lucky, closeness to the person's own name,
//    an English-friendly romanization, an era that fits the person's age

export const ELEMENTS = ["Wood", "Fire", "Earth", "Metal", "Water"] as const;

type Char = { ch: string; ko: string[]; won: number; el: number; sure: boolean; pool: number; def: string };
const CHARS: Char[] = (pool as [string, string, number, number, number, number, string][]).map(([ch, ko, won, el, sure, p, def]) => ({
  ch,
  ko: ko.split("/"),
  won,
  el,
  sure: sure === 1,
  pool: p,
  def,
}));

// A meaning worth carrying in a name: the first English sense must say something good (the hanja table's
// negative filter only removes the bad, this keeps the plain or odd out: "lukewarm", "reed of a loom").
const GOOD =
  /\b(bright|brilliant|shine|shining|light|sun|star|virtue|virtuous|kind|benevolent|wise|wisdom|clever|intelligent|talent|talented|beautiful|beauty|elegant|fine|grace|graceful|jade|gem|treasure|precious|pearl|gold|auspicious|lucky|fortune|blessing|happy|happiness|joy|joyful|peace|peaceful|calm|harmony|harmonious|great|grand|lofty|high|noble|eminent|excellent|superior|lead|first|origin|spring|summer|autumn|forest|woods|tree|pine|bamboo|flower|flowers|blossom|bloom|orchid|lotus|river|sea|ocean|stream|rain|dew|clear|pure|clean|mountain|peak|hill|field|capital|literature|literary|writing|study|learn|art|music|song|poem|truth|true|sincere|sincerity|faithful|loyal|honest|upright|correct|right|just|righteous|filial|respect|gentle|warm|tender|love|generous|abundant|prosper|prosperous|flourish|flourishing|rich|wealth|achieve|success|accomplish|complete|perfect|strong|firm|brave|heroic|hero|courage|eternal|long|vast|wide|broad|deep|open|new|fresh|rise|rising|dawn|morning|dragon|phoenix|crane|tiger|excel|rule|standard|model|pattern|gather|fragrant|fragrance|virtuous|hope|grow|cultivate)\b/i;

// Never: a place or a person's name ("a river in Hebei"), a plain object that reads oddly in a name, or a rare
// character outside the basic CJK block (U+4E00–9FFF) that phones may not even draw.
const NOT = /\b(province|county|district|prefecture|surname|name of|a river in|river in|mountain in|state of|ditch|furrow|lead|islet|indeed|lump|decline|setting|dusk|dim)\b/i;
// The wider pool (not 교육용 한자) is used only for characters Korean parents actually choose for names.
// Draft from naming practice; to be checked against registered names and by Korean reviewers.
const NAME_HANJA = new Set([
  ..."俊峻埈晙浚駿準瑞叙敍舒緖允潤胤玧昀鈗恩殷誾垠娟妍姸淵衍熙姬嬉憙禧僖彬斌琳霖珠宙柱秀洙修智志祉芝址沚宇祐佑禹玗度濤",
  ..."賢鉉炫玄顯絢晛浩昊皓晧澔灝晟聖盛誠旼珉敏玟旻炅暻璟瓊赫爀煥奐燦璨瑛暎榮泳娥雅媛瑗源婷廷姝慧蕙夏廈潾璘律栗璿瑄昭炤紹",
  ..."渼澈哲喆勳薰訓載宰瑾槿玹泫晳碩奭炯亨泓鎬煐暉輝瑜侑裕柔鈺頌昇丞承謹炳昞昺秉玥洸杰傑采彩綵昕欣炘熏勛楨禎晶婧汀叡睿銳豫芮",
  // Earth and Metal, the elements with the fewest familiar name characters
  ..."圭坤均培基堅城垣埰堯坪垠埈岷岫峻嵐鉉鈺銀錫鍾鎭釗銘鈞錦鏞珍珠玲瑛琳現理瑞璟琪琦璇瑢珖",
]);
const usable = (h: Char) => GOOD.test(h.def) && !NOT.test(h.def) && /^[\u4e00-\u9fff]$/.test(h.ch);

const GOOD81 = new Set([1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 17, 18, 21, 23, 24, 25, 29, 31, 32, 33, 35, 37, 38, 39, 41, 45, 47, 48, 52, 57, 61, 63, 65, 67, 68, 81]);
const n81 = (n: number) => ((n - 1) % 81) + 1;

// Hangul, 국어의 로마자 표기법 (2000). A name keeps each syllable's own spelling: no sound changes across syllables.
const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
const RR_CHO = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"];
const RR_JUNG = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"];
const RR_JONG = ["", "k", "k", "k", "n", "n", "n", "t", "l", "k", "m", "l", "l", "l", "p", "l", "m", "p", "p", "t", "t", "ng", "t", "t", "k", "t", "p", "t"];
const jamo = (s: string) => {
  const i = s.charCodeAt(0) - 0xac00;
  return { c: Math.floor(i / 588), v: Math.floor((i % 588) / 28), f: i % 28 };
};
const rrSyllable = (s: string) => {
  const { c, v, f } = jamo(s);
  return RR_CHO[c] + RR_JUNG[v] + RR_JONG[f];
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "서윤" → "Seo-yun" */
export const romanize = (given: string) => cap([...given].map(rrSyllable).join("-"));

// 발음오행 (운해본, the common practice): ㄱㅋ木 ㄴㄷㄹㅌ火 ㅇㅎ土 ㅅㅈㅊ金 ㅁㅂㅍ水
const SOUND_EL: Record<string, number> = { ㄱ: 0, ㄲ: 0, ㅋ: 0, ㄴ: 1, ㄷ: 1, ㄸ: 1, ㄹ: 1, ㅌ: 1, ㅇ: 2, ㅎ: 2, ㅅ: 3, ㅆ: 3, ㅈ: 3, ㅉ: 3, ㅊ: 3, ㅁ: 4, ㅂ: 4, ㅃ: 4, ㅍ: 4 };
const soundEl = (s: string) => SOUND_EL[CHO[jamo(s).c]];
const feeds = (a: number, b: number) => (a + 1) % 5 === b;
const checks = (a: number, b: number) => (a + 2) % 5 === b;
const flows = (a: number, b: number) => a === b || feeds(a, b);

// How an English name sounds, roughly: its first consonant group and first vowel.
type Sound = { k: string; v: string };
function englishSound(name: string): Sound {
  const s = name.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
  let k = "ㅇ";
  if (/^(ch|j|g[eiy])/.test(s)) k = "ㅈ";
  else if (/^(sh|s|z|c[eiy]|x)/.test(s)) k = "ㅅ";
  else if (/^(k|c|g|q)/.test(s)) k = "ㄱ";
  else if (/^(th|t|d)/.test(s)) k = "ㄷ";
  else if (/^n/.test(s)) k = "ㄴ";
  else if (/^(l|r)/.test(s)) k = "ㄹ";
  else if (/^m/.test(s)) k = "ㅁ";
  else if (/^(b|p|v|f|ph|w)/.test(s)) k = /^w/.test(s) ? "ㅇ" : "ㅂ";
  else if (/^h/.test(s)) k = "ㅎ";
  return { k, v: (s.match(/[aeiouy]/) ?? ["a"])[0] };
}
const GROUP: Record<string, string[]> = { ㄱ: ["ㄱ", "ㅋ"], ㅈ: ["ㅈ", "ㅊ"], ㅅ: ["ㅅ"], ㄷ: ["ㄷ", "ㅌ"], ㄴ: ["ㄴ"], ㄹ: ["ㄹ", "ㄴ", "ㅇ"], ㅁ: ["ㅁ"], ㅂ: ["ㅂ", "ㅍ"], ㅎ: ["ㅎ"], ㅇ: ["ㅇ"] };
const VOWEL: Record<string, string[]> = { a: ["ㅏ", "ㅐ"], e: ["ㅔ", "ㅓ", "ㅐ", "ㅕ", "ㅖ"], i: ["ㅣ", "ㅢ"], o: ["ㅗ", "ㅓ"], u: ["ㅜ", "ㅓ", "ㅠ"], y: ["ㅣ", "ㅠ"] };
const consonantLike = (kor: string, en: Sound) => GROUP[en.k].includes(CHO[jamo(kor).c]);
const vowelLike = (kor: string, en: Sound) => VOWEL[en.v]?.includes(JUNG[jamo(kor).v]) ?? false;

/** The Korean surname that sounds closest to an English one (the first consonant counts most), common ones first. */
export function surnameFor(last: string): Surname {
  const en = englishSound(last);
  let best = SURNAMES[0];
  let top = -1;
  for (const s of SURNAMES) {
    const score = (consonantLike(s.ko, en) ? 2 : 0) + (vowelLike(s.ko, en) ? 1 : 0);
    if (score > top) [best, top] = [s, score];
  }
  return best;
}

/** The era a name should feel like for someone born in a given year. */
const eraFor = (year: number): Era => (year >= 1995 ? "new" : year >= 1975 ? "mid" : "old");

export type Kind = "hanja" | "pure";
export type NameRequest = { first: string; last: string; birthYear: number; pillars: Pillars; feel: Feel; kind: Kind; surname?: string };
export type PickedChar = { ch: string; ko: string; meaning: string; el: number; sure: boolean };
export type NamePick = {
  ko: string; // given name in Hangul
  roman: string;
  feel: Feel;
  era: Era;
  chars: PickedChar[] | null; // null for a pure Korean name
  pure: PureName | null;
  elements: number[]; // what each part brings
  suri: { won: number; hyeong: number; i: number; jeong: number; allLucky: boolean } | null;
  soundFlow: boolean;
  soundsLike: boolean; // close to the person's own first name
  hard: boolean; // a syllable English speakers find hard
  score: number;
};
export type NameResult = {
  surname: Surname;
  chart: { strength: string; yong: number; hee: number; avoid: number[] };
  picks: NamePick[];
};

export function suggestNames(req: NameRequest): NameResult | null {
  const chart = readChart(req.pillars);
  if (!chart) return null;
  const { yong, hee } = chart;
  const avoid = [...new Set([chart.gi, ...(chart.burden != null ? [chart.burden] : [])])].filter((e) => e !== yong && e !== hee);
  const surname = SURNAMES.find((s) => s.ko === req.surname) ?? surnameFor(req.last);
  const enFirst = englishSound(req.first);
  const era = eraFor(req.birthYear);
  const feelOk = (f: Feel) => req.feel === "n" || f === "n" || f === req.feel;
  const base = { strength: chart.strength, yong, hee, avoid };

  const common = (ko: string, feel: Feel, nameEra: Era) => {
    const [s1, s2] = [...ko];
    const se = [soundEl(surname.ko), soundEl(s1), soundEl(s2)];
    const soundFlow = flows(se[0], se[1]) && flows(se[1], se[2]);
    const soundClash = checks(se[0], se[1]) || checks(se[1], se[2]);
    const soundsLike = consonantLike(s1, enFirst) && vowelLike(s1, enFirst);
    const marks = [s1, s2].map((s) => ROMAN_AVOID[s]);
    const hard = marks.includes("hard");
    let score = 0;
    if (soundFlow) score += 1.5;
    else if (soundClash) score -= 1;
    if (soundsLike) score += 2;
    else if (consonantLike(s1, enFirst)) score += 0.8;
    score -= marks.filter((m) => m === "warn").length * 1.5 + marks.filter((m) => m === "hard").length;
    // A name should feel like the person's own generation (a 40-year-old with a toddler's name reads oddly).
    const gap = Math.abs(["old", "mid", "new"].indexOf(nameEra) - ["old", "mid", "new"].indexOf(era));
    score += gap === 0 ? 2 : gap === 1 ? 0.3 : -1.5;
    if (jamo(s1).f && jamo(s2).c === 11) score -= 0.5; // 받침 then ㅇ: the sound slides (연음), harder to spell out
    return { ko, roman: romanize(ko), feel, era: nameEra, soundFlow, soundsLike, hard, score, blocked: marks.includes("avoid") || s1 === surname.ko };
  };

  const picks: NamePick[] = [];
  if (req.kind === "pure") {
    for (const p of PURE) {
      if (!feelOk(p.feel) || avoid.includes(p.el)) continue;
      const c = common(p.ko.length === 2 ? p.ko : p.ko + p.ko, p.feel, p.era);
      if (c.blocked) continue;
      const fit = p.el === yong ? 3 : p.el === hee ? 2 : 0;
      picks.push({ ...c, ko: p.ko, roman: romanize(p.ko), chars: null, pure: p, elements: [p.el], suri: null, score: c.score + fit });
    }
  } else {
    // Familiar characters first; then the wider pool of name characters; and only if still short of three
    // names, one character of the needed element beside a neutral one (neither needed nor to avoid).
    const neutral = [0, 1, 2, 3, 4].filter((e) => e !== yong && e !== hee && !avoid.includes(e));
    for (const level of [0, 1, 2]) {
      const wide = level > 0;
      const pairs: [number, number, number][] = [[yong, hee, 3], [hee, yong, 3], [yong, yong, 2]];
      if (level === 2) for (const n of neutral) pairs.push([yong, n, 1], [n, yong, 1], [hee, n, 0.5], [n, hee, 0.5]);
      for (const g of GIVEN) {
        if (!feelOk(g.feel)) continue;
        const c = common(g.ko, g.feel, g.era);
        if (c.blocked) continue;
        const [s1, s2] = [...g.ko];
        for (const [e1, e2, fit] of pairs) {
          const pick = (syl: string, el: number) =>
            CHARS.filter((h) => h.el === el && h.ko.includes(syl) && (h.pool === 1 || (wide && h.pool === 2 && NAME_HANJA.has(h.ch))) && usable(h)).sort(
              (a, b) => a.pool - b.pool || Number(b.sure) - Number(a.sure) || a.won - b.won,
            );
          for (const c1 of pick(s1, e1).slice(0, 3))
            for (const c2 of pick(s2, e2).slice(0, 3)) {
              if (c1.ch === c2.ch) continue;
              const won = [surname.won, c1.won, c2.won];
              const suri = { won: n81(won[1] + won[2]), hyeong: n81(won[0] + won[1]), i: n81(won[0] + won[2]), jeong: n81(won[0] + won[1] + won[2]), allLucky: false };
              if (!GOOD81.has(suri.won) || !GOOD81.has(suri.jeong)) continue;
              const odd = won.map((w) => w % 2);
              if (odd.every((o) => o === odd[0])) continue;
              suri.allLucky = GOOD81.has(suri.hyeong) && GOOD81.has(suri.i);
              let score = c.score + fit + (suri.allLucky ? 1 : 0) + (c1.sure && c2.sure ? 0.5 : 0) - (c1.pool + c2.pool - 2) * 0.7;
              score = Math.round(score * 10) / 10;
              picks.push({
                ...c,
                chars: [
                  { ch: c1.ch, ko: s1, meaning: c1.def, el: c1.el, sure: c1.sure },
                  { ch: c2.ch, ko: s2, meaning: c2.def, el: c2.el, sure: c2.sure },
                ],
                pure: null,
                elements: [c1.el, c2.el],
                suri,
                score,
              });
            }
        }
      }
      if (new Set(picks.map((p) => p.ko[0])).size >= 3) break;
    }
  }

  // Best first, one spelling of each name, and no two names starting with the same syllable among the first three.
  picks.sort((a, b) => b.score - a.score);
  const out: NamePick[] = [];
  for (const p of picks) {
    if (out.some((o) => o.ko === p.ko || o.ko[0] === p.ko[0])) continue;
    out.push(p);
    if (out.length === 3) break;
  }
  return { surname, chart: base, picks: out };
}

export type { GivenName };
