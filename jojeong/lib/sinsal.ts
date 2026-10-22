import { isBaekho, isGoegang, salsAt } from "./deep";
import type { Pillars } from "./saju";
import rarity from "./sinsalRarity.json";

// 신살 감정 (free, rule-based): which 신살 a chart holds, and the one that heads the card, with a character for it.
// The head is the rarest thing the chart holds (counted over every birth 1950–2008, scripts/sinsal.mts), so two
// friends rarely get the same card. 현침 and 공망 are left out: most charts hold them.

export type SinsalId =
  | "cheoneul" | "cheoneul2" | "munchang" | "munchang2" | "dohwa" | "dohwa2" | "yeokma" | "yeokma2"
  | "hwagae" | "hwagae2" | "hwagae3" | "yangin" | "yangin2" | "goegang" | "baekho" | "gwimun" | "gwimun2" | "hongyeom" | "hongyeom2"
  | "musal";

// 홍염 by day stem (as lib/intimacy.ts), 귀문관 as pairs of branches.
const HONGYEOM = [6, 6, 2, 7, 4, 4, 10, 9, 0, 8];
const GWIMUN = new Set(["0-9", "1-6", "2-7", "3-8", "4-11", "5-10"]); // 子酉 丑午 寅未 卯申 辰亥 巳戌

export type Card = {
  id: SinsalId;
  no: number; // picture number: /sinsal/M01.webp, F01.webp
  sal: string;
  hanja: string;
  nick: string;
  line: string;
  body: string;
};

export const CARDS: Card[] = [
  { id: "cheoneul", no: 1, sal: "천을귀인", hanja: "天乙貴人", nick: "귀인 자석", line: "막히는 순간마다 누군가 손을 내미는 사람", body: "힘든 고비에 뜻밖의 사람이 나타나 길을 터 주는 복이에요. 옛 책 『삼명통회』는 천을귀인을 하늘의 신 가운데 가장 존귀한 자리라 적었어요. 혼자 버티기보다 도움을 청할 때 일이 풀리는 사주예요." },
  { id: "cheoneul2", no: 2, sal: "천을귀인 둘", hanja: "天乙貴人", nick: "귀인 부자", line: "어딜 가나 좋은 사람이 따르는 사람", body: "귀인 글자가 두 칸 이상에 있어요. 집안, 일터, 가까운 사이 어디서든 도와주는 사람이 생기는 사주예요. 받은 만큼 베풀 때 이 복이 오래 가요." },
  { id: "munchang", no: 3, sal: "문창귀인", hanja: "文昌貴人", nick: "글솜씨 선비", line: "배운 것을 말과 글로 잘 풀어내는 사람", body: "머리가 맑고 배운 것을 정리하는 힘이 있어요. 시험운만이 아니라 가르치고 쓰고 설명하는 일에서 빛나는 사주예요." },
  { id: "munchang2", no: 4, sal: "문창귀인 둘", hanja: "文昌貴人", nick: "타고난 문장가", line: "글 한 줄로 사람을 움직이는 사람", body: "문창 글자가 두 칸 이상이에요. 말과 글이 곧 무기가 되는 사주라, 기록하고 남기는 일을 꾸준히 할수록 이름이 나요." },
  { id: "dohwa", no: 5, sal: "도화", hanja: "桃花", nick: "눈길 끄는 꽃", line: "애쓰지 않아도 눈길이 가는 사람", body: "복숭아꽃처럼 사람을 끄는 기운이에요. 요즘은 매력, 인기, 사람을 상대하는 일에서 힘이 되는 칸으로 읽어요." },
  { id: "dohwa2", no: 6, sal: "도화 둘", hanja: "桃花", nick: "꽃밭의 주인공", line: "가만히 있어도 시선이 모이는 사람", body: "도화 글자가 두 칸 이상이에요. 어디서든 주목받는 사주라, 사람 앞에 서는 일에서 크게 쓰여요. 인연이 많은 만큼 사람을 고르는 눈이 중요해요." },
  { id: "yeokma", no: 7, sal: "역마", hanja: "驛馬", nick: "길 위의 나그네", line: "움직일수록 일이 풀리는 사람", body: "한곳에 오래 머물기보다 옮겨 다니며 기회를 만나는 기운이에요. 옛날엔 고생으로 봤지만 지금은 이동, 출장, 해외 일에서 힘이 돼요." },
  { id: "yeokma2", no: 8, sal: "역마 둘", hanja: "驛馬", nick: "바람 같은 방랑객", line: "한곳에 오래 있으면 답답한 사람", body: "역마 글자가 두 칸 이상이에요. 새로운 곳, 새로운 일에서 살아나는 사주라 변화를 두려워하지 않을수록 길이 넓어져요." },
  { id: "hwagae", no: 9, sal: "화개", hanja: "華蓋", nick: "혼자가 편한 예술가", line: "혼자 있을 때 충전되는 사람", body: "꽃 덮개라는 이름처럼 안으로 깊어지는 기운이에요. 예술, 학문, 종교처럼 혼자 파고드는 일에서 재능이 피어나요." },
  { id: "hwagae2", no: 10, sal: "화개 둘", hanja: "華蓋", nick: "깊은 산 수행자", line: "말없이 깊이 파고드는 사람", body: "화개 글자가 두 칸이에요. 남들이 쉽게 닿지 못하는 깊이까지 들어가는 사주라, 한 분야를 오래 붙들수록 빛나요." },
  { id: "hwagae3", no: 11, sal: "화개 셋", hanja: "華蓋", nick: "구름 위 은둔 고수", line: "멀리 내다보는 사람", body: "화개 글자가 세 칸 이상인 드문 사주예요. 세상과 한 걸음 떨어져 볼 줄 알아서, 남들이 못 보는 것을 먼저 알아채요." },
  { id: "yangin", no: 12, sal: "양인", hanja: "羊刃", nick: "칼 쥔 승부사", line: "지는 걸 못 참는 사람", body: "칼을 쥐고 태어났다는 기운이에요. 휘두르면 상처가 되고, 쥐고 다루면 실력이 돼요. 승부가 걸린 자리에서 힘이 나는 사주예요." },
  { id: "yangin2", no: 13, sal: "양인 둘", hanja: "羊刃", nick: "양손 장수", line: "위기에 가장 빨리 결단하는 사람", body: "양인 글자가 두 칸이에요. 결단과 추진력이 아주 센 사주라, 힘을 어디에 쓰느냐가 인생을 가르는 열쇠예요." },
  { id: "goegang", no: 14, sal: "괴강", hanja: "魁罡", nick: "판을 이끄는 우두머리", line: "앞장서서 판을 이끄는 사람", body: "태어난 날이 괴강 넷(경진·경술·임진·무술) 중 하나예요. 하괴(河魁)·천강(天罡) 두 별 이름에서 온 말로, 무리 앞에 서는 기운이라, 세다는 말은 흠이 아니라 그 힘의 다른 이름이에요." },
  { id: "baekho", no: 15, sal: "백호", hanja: "白虎", nick: "흰 범의 기세", line: "위기 때 몸이 먼저 나가는 사람", body: "태어난 날이 백호 일곱 중 하나예요. 흰 범처럼 기세가 센 칸이라 예전엔 겁을 줬지만, 지금은 몸과 손을 쓰는 일, 위기를 해결하는 일로 읽어요." },
  { id: "gwimun", no: 16, sal: "귀문관", hanja: "鬼門關", nick: "예민한 촉의 천재", line: "남들이 놓치는 걸 먼저 느끼는 사람", body: "감각이 예민하게 열려 있는 기운이에요. 직감과 영감이 뛰어난 대신 쉽게 지칠 수 있어서, 혼자 쉬는 시간을 꼭 챙겨야 하는 사주예요." },
  { id: "gwimun2", no: 17, sal: "귀문관 둘", hanja: "鬼門關", nick: "꿈과 현실 사이 몽상가", line: "상상력이 현실보다 큰 사람", body: "귀문관이 두 번 이상 짝을 이뤄요. 상상하는 힘이 아주 커서 창작에서 빛나는 사주예요. 생각을 글이나 그림으로 꺼내 둘수록 마음이 편해져요." },
  { id: "hongyeom", no: 18, sal: "홍염", hanja: "紅艶", nick: "은근한 매력꾼", line: "볼수록 끌리는 사람", body: "붉은 고움이라는 이름의 기운이에요. 첫눈보다 오래 볼수록 끌리는 매력이라, 깊은 인연을 만드는 힘이 있어요." },
  { id: "hongyeom2", no: 19, sal: "홍염 둘", hanja: "紅艶", nick: "치명적 매력의 소유자", line: "품위 있게 사람을 끄는 사람", body: "홍염 글자가 두 칸 이상이에요. 은근한 매력이 겹쳐 사람을 오래 붙드는 사주예요. 그 매력을 어디에 쓰느냐가 중요해요." },
];
// The chart that holds none of them.
export const MUSAL: Card = { id: "musal", no: 20, sal: "무살", hanja: "無煞", nick: "맑은 그릇", line: "아무 살에도 휘둘리지 않는 사람", body: "살은 여덟 글자 위에 얹힌 양념인데, 그대의 사주에는 양념이 없어요. 그만큼 타고난 여덟 글자 그대로의 맛이 나는 사주라, 남의 기운에 쉽게 흔들리지 않아요. 무엇을 담느냐에 따라 무엇이든 될 수 있는 맑은 그릇이에요." };
const BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c])) as Record<SinsalId, Card>;

export type Held = Record<"cheoneul" | "munchang" | "dohwa" | "yeokma" | "hwagae" | "yangin" | "gwimun" | "hongyeom", number> & { goegang: boolean; baekho: boolean };

// How many of the chart's branches carry each 신살 (an unknown hour leaves that branch out).
export function heldOf(p: Pillars): Held {
  const branches = [p.yearBranch, p.monthBranch, p.dayBranch, p.hourBranch].filter((b): b is number => b !== null && b !== undefined);
  const count = (s: string) => branches.filter((b) => (salsAt(p, b) as string[]).includes(s)).length;
  let gwimun = 0;
  for (let i = 0; i < branches.length; i++)
    for (let j = i + 1; j < branches.length; j++) {
      const [a, b] = [branches[i], branches[j]].sort((x, y) => x - y);
      if (GWIMUN.has(`${a}-${b}`)) gwimun++;
    }
  return {
    cheoneul: count("천을귀인"),
    munchang: count("문창귀인"),
    dohwa: count("도화"),
    yeokma: count("역마"),
    hwagae: count("화개"),
    yangin: count("양인"),
    gwimun,
    hongyeom: branches.filter((b) => b === HONGYEOM[p.dayStem]).length,
    goegang: isGoegang(p),
    baekho: isBaekho(p),
  };
}

// Every card this chart qualifies for (the higher tier of a 신살 replaces the lower one).
export function cardsOf(h: Held): SinsalId[] {
  const out: SinsalId[] = [];
  const tier = (n: number, ids: SinsalId[]) => {
    if (n > 0) out.push(ids[Math.min(n, ids.length) - 1]);
  };
  tier(h.cheoneul, ["cheoneul", "cheoneul2"]);
  tier(h.munchang, ["munchang", "munchang2"]);
  tier(h.dohwa, ["dohwa", "dohwa2"]);
  tier(h.yeokma, ["yeokma", "yeokma2"]);
  tier(h.hwagae, ["hwagae", "hwagae2", "hwagae3"]);
  tier(h.yangin, ["yangin", "yangin2"]);
  if (h.goegang) out.push("goegang");
  if (h.baekho) out.push("baekho");
  tier(h.gwimun, ["gwimun", "gwimun2"]);
  tier(h.hongyeom, ["hongyeom", "hongyeom2"]);
  return out;
}

// Share of births (out of 100) holding each card, from scripts/sinsal.mts.
export const per100 = (id: SinsalId) => (id === "musal" ? rarity.head.none : (rarity.held as Record<string, number>)[id]) / (rarity.total / 100);

export type Reading = { head: Card; rest: Card[]; held: Held; kinds: number; cells: number; summary: string };

// How many kinds and how many branches, against the usual 3–4 kinds (scripts: 1.5% none, 30% two or fewer, 19% five or more).
function summaryOf(kinds: number, deepest: number): string {
  if (kinds === 0) return "100명 중 1.5명뿐인, 살이 하나도 없는 사주예요.";
  if (kinds <= 2) return deepest >= 2 ? "보통은 3~4가지예요. 적은 대신 한 살이 짙게 겹친 사주예요." : "보통은 3~4가지예요. 살이 적어 여덟 글자 그대로의 힘이 큰 사주예요.";
  if (kinds <= 4) return "보통 사람들처럼 여러 살이 고르게 섞인 사주예요.";
  return "보통은 3~4가지예요. 살이 많아 재주와 굴곡이 함께 큰 사주예요.";
}

export function sinsalOf(p: Pillars): Reading {
  const held = heldOf(p);
  const ids = cardsOf(held).sort((a, b) => per100(a) - per100(b));
  const counts = [held.cheoneul, held.munchang, held.dohwa, held.yeokma, held.hwagae, held.yangin, held.gwimun, held.hongyeom, held.goegang ? 1 : 0, held.baekho ? 1 : 0];
  const cells = counts.reduce((a, b) => a + b, 0);
  return { head: ids.length ? BY_ID[ids[0]] : MUSAL, rest: ids.slice(1).map((id) => BY_ID[id]), held, kinds: ids.length, cells, summary: summaryOf(ids.length, Math.max(...counts)) };
}

// "100명 중 약 4명": whole numbers from 3 up, one decimal below (무살 1.5, 양인 둘 2.0 → 2).
export function rareText(c: Card): string {
  const n = per100(c.id);
  if (n >= 3) return `100명 중 약 ${Math.round(n)}명`;
  if (n >= 1) return `100명 중 약 ${n.toFixed(1).replace(/\.0$/, "")}명`;
  return `1,000명 중 약 ${Math.max(1, Math.round(n * 10))}명`;
}

// Every card in the book, the empty chart's last.
export const BOOK: Card[] = [...CARDS, MUSAL];

// Which of the four pillars (0 해, 1 달, 2 날, 3 시) carry a card: the branches for most, the day for 괴강·백호,
// both ends of each pair for 귀문관.
export function placesOf(p: Pillars, id: SinsalId): number[] {
  const branches = [p.yearBranch, p.monthBranch, p.dayBranch, p.hourBranch];
  const at = (test: (b: number) => boolean) => branches.flatMap((b, i) => (b !== null && b !== undefined && test(b) ? [i] : []));
  const base = id.replace(/\d$/, "");
  const NAME: Record<string, string> = { cheoneul: "천을귀인", munchang: "문창귀인", dohwa: "도화", yeokma: "역마", hwagae: "화개", yangin: "양인" };
  if (NAME[base]) return at((b) => (salsAt(p, b) as string[]).includes(NAME[base]));
  if (base === "hongyeom") return at((b) => b === HONGYEOM[p.dayStem]);
  if (base === "goegang" || base === "baekho") return [2];
  if (base === "gwimun") {
    const out = new Set<number>();
    for (let i = 0; i < 4; i++)
      for (let j = i + 1; j < 4; j++) {
        const [a, b] = [branches[i], branches[j]];
        if (a === null || a === undefined || b === null || b === undefined) continue;
        if (GWIMUN.has(`${Math.min(a, b)}-${Math.max(a, b)}`)) [i, j].forEach((k) => out.add(k));
      }
    return [...out].sort();
  }
  return [];
}

export const imageOf = (c: Card, gender: "m" | "f" | null) => `/sinsal/${gender === "f" ? "F" : "M"}${String(c.no).padStart(2, "0")}.webp`;
