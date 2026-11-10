import { hourStemFor, type Pillars } from "@/lib/saju";

// What the English free previews show, computed from the chart only (no AI): the Day Master, the five elements
// counted over the visible characters, and for two people how their day pillars meet.

export const ELEMENTS_EN = ["Wood", "Fire", "Earth", "Metal", "Water"] as const;
export const STEMS_EN = ["Gap", "Eul", "Byeong", "Jeong", "Mu", "Gi", "Gyeong", "Sin", "Im", "Gye"] as const;
const STEM_HANJA = "甲乙丙丁戊己庚辛壬癸";
// Each animal's main element: 子 Water, 丑 Earth, 寅 卯 Wood, 辰 Earth, 巳 午 Fire, 未 Earth, 申 酉 Metal, 戌 Earth, 亥 Water.
const BRANCH_EL = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
export const ANIMALS_EN = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"] as const;

export const DAY_MASTER: string[] = [
  "a tall tree: upright, steady, always growing toward something",
  "a vine in flower: flexible, sociable, finds a way around any wall",
  "the sun: warm, open, happiest lighting up a room",
  "a candle flame: focused warmth and quiet insight",
  "a mountain: dependable, unhurried, holds its ground",
  "a garden field: nurturing, practical, makes things grow",
  "raw ore and the sword it becomes: decisive and principled",
  "a cut jewel: refined, precise, quietly sensitive",
  "a great river: bold, restless, sees the big picture",
  "rain and mist: perceptive, gentle, reads what is unsaid",
];

export function dayMaster(p: Pillars) {
  const s = p.dayStem;
  return {
    name: `${STEMS_EN[s]} ${ELEMENTS_EN[Math.floor(s / 2)]}`,
    hanja: STEM_HANJA[s],
    yin: s % 2 === 1,
    image: DAY_MASTER[s],
    element: Math.floor(s / 2),
  };
}

export function elementCounts(p: Pillars): { counts: number[]; known: number } {
  const stems = [p.yearStem, p.monthStem, p.dayStem, hourStemFor(p)].filter((x): x is number => x !== undefined && x !== null);
  const branches = [p.yearBranch, p.monthBranch, p.dayBranch, p.hourBranch].filter((x): x is number => x !== undefined && x !== null);
  const counts = [0, 0, 0, 0, 0];
  for (const s of stems) counts[Math.floor(s / 2)]++;
  for (const b of branches) counts[BRANCH_EL[b]]++;
  return { counts, known: stems.length + branches.length };
}

const SIX = [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]; // 子丑 寅亥 卯戌 辰酉 巳申 午未
export function dayMeeting(a: Pillars, b: Pillars): { title: string; line: string } {
  const x = a.dayBranch, y = b.dayBranch;
  const stemsBond = Math.abs(a.dayStem - b.dayStem) === 5;
  const bond = stemsBond ? " Your Day Masters also form a pair that pulls together, a rarer bond." : "";
  if (x === y) return { title: "Mirror", line: `You were both born on a ${ANIMALS_EN[x]} day: you recognise each other quickly, and can be stubborn in the same places.${bond}` };
  if (SIX[x] === y) return { title: "Pulled together", line: `Your day animals, ${ANIMALS_EN[x]} and ${ANIMALS_EN[y]}, are one of the six natural pairs: an easy, warm pull.${bond}` };
  if ((x + 6) % 12 === y) return { title: "Face to face", line: `Your day animals, ${ANIMALS_EN[x]} and ${ANIMALS_EN[y]}, stand opposite each other: strong attraction, and strong friction.${bond}` };
  if ((x - y + 12) % 4 === 0) return { title: "Same direction", line: `Your day animals, ${ANIMALS_EN[x]} and ${ANIMALS_EN[y]}, belong to one group of three: you tend to want the same things.${bond}` };
  return { title: "Room to grow", line: `Your day animals, ${ANIMALS_EN[x]} and ${ANIMALS_EN[y]}, have no fixed bond: what you build is up to the rest of your charts.${bond}` };
}
