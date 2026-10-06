// The English free reading (/en): the same chart as the Korean site (lib/saju.ts), told for readers who meet
// saju for the first time. Korean terms stay, each with a short gloss; nothing here costs a writer call.

import { elementCount } from "../myeongri";
import type { Pillars } from "../saju";

export const STEM_RO = ["Gap", "Eul", "Byeong", "Jeong", "Mu", "Gi", "Gyeong", "Sin", "Im", "Gye"] as const;
export const BRANCH_RO = ["Ja", "Chuk", "In", "Myo", "Jin", "Sa", "O", "Mi", "Sin", "Yu", "Sul", "Hae"] as const;
export const ANIMAL_EN = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"] as const;

export const ELEMENT_EN = [
  { name: "Wood", hanja: "木", color: "#3f7a4f", gives: "growth, ideas and kindness" },
  { name: "Fire", hanja: "火", color: "#b3261e", gives: "warmth, expression and passion" },
  { name: "Earth", hanja: "土", color: "#a07a2c", gives: "stability, trust and patience" },
  { name: "Metal", hanja: "金", color: "#6b6f76", gives: "clarity, decisions and standards" },
  { name: "Water", hanja: "水", color: "#24476b", gives: "wisdom, intuition and flow" },
] as const;

// The ten day masters (일간): who you are at the core, in one image, with its light and its shadow.
export const DAY_MASTER = [
  { image: "The Tall Tree", light: "Upright and principled, you grow steadily toward what you believe in, and others lean on your sense of direction.", shadow: "You hate to bend. When the wind changes you may hold your ground a little too long." },
  { image: "The Climbing Vine", light: "Gentle and resourceful, you find a way around any wall and are a natural at bringing people together.", shadow: "You can lean on others' choices and hesitate when it is your turn to decide." },
  { image: "The Sun", light: "Warm, generous and hard to ignore, you light up a room and lift the people around you.", shadow: "You shine at full power, then burn out. Promises made in the moment can outgrow your days." },
  { image: "The Candle", light: "Thoughtful and caring, you see what others miss and give steady light to the few you love.", shadow: "You feel everything. Hurt turns inward, or out as a sharp word you later regret." },
  { image: "The Mountain", light: "Steady and dependable, you are the one people come to when the ground shakes.", shadow: "Change comes slowly to a mountain. You may keep your feelings, and your mind, closed for too long." },
  { image: "The Garden", light: "Nurturing and practical, you grow people and plans with patient, careful hands.", shadow: "You worry for everyone. Overthinking can keep the seeds in the packet." },
  { image: "The Sword", light: "Decisive and loyal, you cut through confusion and stand up for what is fair.", shadow: "Blunt honesty can wound. Not every battle needs your blade." },
  { image: "The Jewel", light: "Refined and perceptive, you have taste, standards and a quiet brilliance.", shadow: "Perfectionism and pride can make you hard on yourself, and on others." },
  { image: "The Ocean", light: "Big-hearted and free, you think in horizons and carry others along with your energy.", shadow: "Restless currents: you can be hard to pin down, even for yourself." },
  { image: "The Rain", light: "Intuitive and empathetic, you understand people without being told, and your wisdom works quietly.", shadow: "Moods drift in like weather. You may keep too much to yourself." },
] as const;

const ELEMENT_LOW = [
  "Little Wood: plans can stall at the idea stage. New beginnings and learning feed you.",
  "Little Fire: you may hold back your spark. Showing yourself, and letting yourself be seen, opens doors.",
  "Little Earth: life can feel unanchored. Routines, a home base and savings ground you.",
  "Little Metal: decisions drag and boundaries blur. Clear rules and saying no protect you.",
  "Little Water: rest and reflection run short. Slowing down lets your wisdom catch up.",
];
const ELEMENT_HIGH = [
  "Much Wood: endless growth and new starts, sometimes too many at once.",
  "Much Fire: passion and charisma in plenty; watch for burnout and quick temper.",
  "Much Earth: solid and loyal, though change can feel like a landslide.",
  "Much Metal: sharp judgment and high standards; soften the edges with people.",
  "Much Water: deep feelings and imagination; give the currents a direction.",
];

export type EnReading = {
  pillars: { label: string; stem: number | null; branch: number | null }[];
  dayMaster: { stem: number; element: number; yang: boolean; image: string; light: string; shadow: string };
  animal: string;
  elements: { name: string; hanja: string; color: string; count: number }[];
  strong: string;
  weak: string;
  hourKnown: boolean;
};

export function enReading(p: Pillars): EnReading {
  const hourStem = p.hourBranch === null ? null : (p.hourStem ?? ((p.dayStem % 5) * 2 + p.hourBranch) % 10);
  const counts = ELEMENT_EN.map((e, i) => ({ name: e.name, hanja: e.hanja, color: e.color, count: elementCount(p, i) }));
  // Only a clear excess or lack is named: a tie for most says the chart is even, and a lack is a missing element
  // or, failing that, a single weakest one.
  const max = Math.max(...counts.map((c) => c.count));
  const min = Math.min(...counts.map((c) => c.count));
  const tops = counts.map((c, i) => (c.count === max ? i : -1)).filter((i) => i >= 0);
  const lows = counts.map((c, i) => (c.count === min ? i : -1)).filter((i) => i >= 0);
  const strong = max >= 3 && tops.length === 1 ? ELEMENT_HIGH[tops[0]] : "No single element takes over: your chart spreads its strength fairly evenly.";
  const weak =
    min === 0
      ? lows.map((i) => ELEMENT_LOW[i].replace(/^Little /, "No ")).join(" ")
      : lows.length === 1
        ? ELEMENT_LOW[lows[0]]
        : "Every element is present: a rare, well-rounded chart.";
  const dm = DAY_MASTER[p.dayStem];
  return {
    pillars: [
      { label: "Hour", stem: hourStem, branch: p.hourBranch },
      { label: "Day", stem: p.dayStem, branch: p.dayBranch },
      { label: "Month", stem: p.monthStem ?? null, branch: p.monthBranch ?? null },
      { label: "Year", stem: p.yearStem ?? null, branch: p.yearBranch },
    ],
    dayMaster: { stem: p.dayStem, element: Math.floor(p.dayStem / 2), yang: p.dayStem % 2 === 0, ...dm },
    animal: ANIMAL_EN[p.yearBranch],
    elements: counts,
    strong,
    weak,
    hourKnown: p.hourBranch !== null,
  };
}
