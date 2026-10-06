// The English free reading (/en): the same chart and the same verdicts as the Korean site (lib/saju.ts,
// lib/myeongri.ts, lib/freeReading.ts), told for readers who meet saju for the first time. Korean terms stay,
// each with a short gloss; nothing here costs a writer call.

import { freeReadingOf, type Mood } from "../freeReading";
import { GROUP_OF, groupElement, HIDDEN, luckFit, readChart, tenGod, type GodGroup, type Strength } from "../myeongri";
import type { Profile } from "../profile";
import { isFull, type Pillars } from "../saju";

export const STEM_RO = ["Gap", "Eul", "Byeong", "Jeong", "Mu", "Gi", "Gyeong", "Sin", "Im", "Gye"] as const;
export const BRANCH_RO = ["Ja", "Chuk", "In", "Myo", "Jin", "Sa", "O", "Mi", "Sin", "Yu", "Sul", "Hae"] as const;
export const ANIMAL_EN = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"] as const;

export const ELEMENT_EN = [
  { name: "Wood", hanja: "木", color: "#3f7a4f" },
  { name: "Fire", hanja: "火", color: "#b3261e" },
  { name: "Earth", hanja: "土", color: "#a07a2c" },
  { name: "Metal", hanja: "金", color: "#6b6f76" },
  { name: "Water", hanja: "水", color: "#24476b" },
] as const;

// What each element can be used as in daily life, the way Koreans pick a lucky colour or direction.
const LUCK_OF = [
  { colors: "green and teal", direction: "east", season: "spring", numbers: "3 and 8", use: "plants, wood, mornings, learning something new, starting fresh" },
  { colors: "red, pink and purple", direction: "south", season: "summer", numbers: "2 and 7", use: "sunlight, candles, being seen, speaking up, warm company" },
  { colors: "yellow, beige and brown", direction: "the centre, home", season: "the turn of each season", numbers: "5 and 10", use: "routines, cooking, pottery, a steady base, keeping promises" },
  { colors: "white, silver and gold", direction: "west", season: "autumn", numbers: "4 and 9", use: "tidying, clear rules, metal jewellery, finishing what you started" },
  { colors: "black and navy", direction: "north", season: "winter", numbers: "1 and 6", use: "rest, water, night walks, reading, time alone to think" },
] as const;

// The five powers (ten-god groups), in English: what each element is to *you*, given your Day Master.
export const POWER_EN: Record<GodGroup, { name: string; korean: string; is: string; high: string; low: string }> = {
  비겁: {
    name: "Self",
    korean: "비겁 · peers",
    is: "you, your friends, siblings and rivals",
    high: "You go your own way whatever people say. Asking for help is the hard part.",
    low: "You fit yourself around others easily. Practise claiming your share.",
  },
  식상: {
    name: "Expression",
    korean: "식상 · output",
    is: "your talents, words, creativity and what you make",
    high: "Ideas turn straight into words and work. Many talents; patience is the one you lack.",
    low: "You keep a lot inside. Getting your good ideas out into the world is your task.",
  },
  재성: {
    name: "Wealth",
    korean: "재성 · wealth",
    is: "money, results and the practical world",
    high: "You weigh gains and losses fast and read reality well. Without visible results you lose interest.",
    low: "You chase meaning over money. Let fixed rules, not mood, run your finances.",
  },
  관성: {
    name: "Authority",
    korean: "관성 · power",
    is: "work, status, rules and responsibility",
    high: "You see things through to the end. You can push yourself too hard.",
    low: "Rigid frames don't suit you. You shine where you are free to set your own rules.",
  },
  인성: {
    name: "Support",
    korean: "인성 · resource",
    is: "learning, mothers, mentors and the care you receive",
    high: "You think deeply and prepare thoroughly. Starting is what takes you long.",
    low: "You learn by doing, not by studying first. Quick to decide, sometimes underprepared.",
  },
};
const GROUPS: GodGroup[] = ["비겁", "식상", "재성", "관성", "인성"];

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

const STRENGTH_EN: Record<Strength, { label: string; line: string }> = {
  극신강: { label: "Very strong", line: "Most of your chart backs you up. You have power to spare; what you need is somewhere to spend it." },
  신강: { label: "Strong", line: "More of your chart backs you than tests you. You can carry a lot; give your energy an outlet." },
  신약: { label: "Gentle", line: "More of your chart tests you than backs you. You do best with allies, rest and the right support." },
  극신약: { label: "Very gentle", line: "Your chart pulls you in many directions. Choose your battles and lean on what feeds you." },
};

// A classic picture of the chart (the 母多子病 family and its kin): when one force overwhelms the Day Master,
// saju gives the scene a name. [element of the Day Master] → the scene for each overwhelming power.
const SCENE: Partial<Record<GodGroup, { hanja: string; en: string; line: string }[]>> = {
  인성: [
    { hanja: "水多木浮", en: "a tree floating in a flood", line: "So much care and learning pours in that your roots can't hold. Wood needs firm ground: decide, then act." },
    { hanja: "木多火熄", en: "a fire smothered by too much wood", line: "So much support piles on that your flame can't breathe. Clear some space and let yourself burn bright." },
    { hanja: "火多土焦", en: "earth scorched by too much fire", line: "Warmth and protection in excess dry you out. Moisture, rest and calm let you grow things again." },
    { hanja: "土多金埋", en: "a jewel buried in earth", line: "A gem lies under too much soil: care, worry and preparation pile up until your shine can't show. Wood breaks up the earth, so action, new starts and getting your hands busy dig you out." },
    { hanja: "金多水濁", en: "water muddied by too much metal", line: "Too many rules and doubts cloud your clear water. Let it flow: move, share, express." },
  ],
  식상: [
    { hanja: "火多木焚", en: "a tree burned by its own fire", line: "You pour yourself into what you make until you burn out. Guard your energy as fiercely as your work." },
    { hanja: "土多火晦", en: "a fire dimmed under earth", line: "Your light spreads into too many outputs and grows faint. Pick fewer things and shine on them." },
    { hanja: "金多土虛", en: "earth hollowed out by metal", line: "Giving and producing leave you empty. Refill before you give again." },
    { hanja: "水多金沈", en: "metal sinking in deep water", line: "Words and ideas overflow and pull you under. Finish one thing before opening the next." },
    { hanja: "木多水縮", en: "water drunk dry by trees", line: "You feed everyone's growth and run dry yourself. Your own rest comes first." },
  ],
  재성: [
    { hanja: "土重木折", en: "a tree snapping under heavy earth", line: "Money and duties weigh more than you can carry alone. Partners and support make the load light." },
    { hanja: "金多火熄", en: "a fire spent on too much metal", line: "Chasing results drains your flame. Win fewer, bigger things." },
    { hanja: "水多土流", en: "earth washed away by water", line: "Opportunities flow past faster than you can hold them. Build banks: savings, rules, one goal at a time." },
    { hanja: "木多金缺", en: "a blade chipped on too much wood", line: "Too many targets dull your edge. Choose what is worth cutting." },
    { hanja: "火多水沸", en: "water boiled away by fire", line: "Hot pursuit of gains leaves you depleted. Cool down; slow money stays." },
  ],
  관성: [
    { hanja: "金多木折", en: "a tree felled by the axe", line: "Pressure, rules and other people's expectations cut into you. Find where you are free to grow." },
    { hanja: "水多火滅", en: "a fire put out by water", line: "Duty and pressure douse your spark. Protect what lights you up." },
    { hanja: "木多土崩", en: "earth broken by roots", line: "Demands dig into you from every side. Set limits; you don't have to hold everyone." },
    { hanja: "火多金熔", en: "metal melting in the furnace", line: "Heat from above reshapes you faster than you can bear. Choose the fires that forge you, avoid the ones that melt you." },
    { hanja: "土多水塞", en: "a stream blocked by earth", line: "Rules and walls stop your flow. Look for the channel where you can run free." },
  ],
};
const BALANCED = { hanja: "中和", en: "a chart in balance", line: "No single force takes over. Balance is rare in saju; your task is to keep it as life changes." };

// The five grades of a luck period (lib/freeReading.ts MOODS), in English.
export const MOOD_EN: Record<Mood, { name: string; line: string }> = {
  활짝: { name: "In full bloom", line: "The element you need arrives in force" },
  기회: { name: "Opportunity", line: "What you need comes in; momentum builds" },
  무난: { name: "Steady", line: "Good and hard mixed; an even stretch" },
  다지기: { name: "Building", line: "Heavier energies; lay foundations rather than expand" },
  버티기: { name: "Holding on", line: "Friction runs high; don't overreach, tidy up and endure" },
};
const DECADE_EN: Record<GodGroup, [young: string, adult: string, late: string]> = {
  비겁: ["growing up among friends and siblings", "standing on your own feet", "living life your own way"],
  식상: ["talents and spirit showing early", "making things and getting results", "sharing what you've built"],
  재성: ["shaped by family circumstances", "seizing money and chances", "keeping and growing what you have"],
  관성: ["raised amid rules and expectations", "rising in status and responsibility", "holding your name and place"],
  인성: ["growing up studying and cared for", "learning and earning credentials", "a mind at ease"],
};

const yearPillar = (y: number) => ({ stem: (((y - 4) % 10) + 10) % 10, branch: (((y - 4) % 12) + 12) % 12 });

export type EnReading = {
  pillars: { label: string; stem: number | null; branch: number | null }[];
  dayMaster: { stem: number; element: number; yang: boolean; image: string; light: string; shadow: string };
  strength: { label: string; line: string; support: number };
  lucky: { element: number; helper: number; colors: string; direction: string; season: string; numbers: string; use: string };
  scene: { hanja: string; en: string; line: string };
  elements: { el: number; name: string; hanja: string; color: string; count: number; power: GodGroup; powerName: string; is: string }[];
  missing: { el: number; line: string }[];
  powers: { group: GodGroup; name: string; korean: string; pct: number; rank: string | null }[];
  strongest: { name: string; line: string };
  weakest: { name: string; line: string };
  year: { year: number; stem: number; branch: number; mood: Mood; brings: string };
  flow: { from: number; to: number; age: string; mood: Mood; theme: string; now: boolean; young: boolean }[] | null;
  animal: string;
  hourKnown: boolean;
};

export function enReading(p: Pillars, profile: Profile | null, now = new Date().getFullYear()): EnReading | null {
  const r = readChart(p);
  const free = freeReadingOf(p, profile, now);
  if (!r || !free || !isFull(p)) return null;
  const dayEl = Math.floor(p.dayStem / 2);
  const groupOfEl = (el: number) => GROUPS.find((g) => groupElement(dayEl, g) === el)!;
  const hourStem = p.hourBranch === null ? null : (p.hourStem ?? ((p.dayStem % 5) * 2 + p.hourBranch) % 10);

  // The scene: the power with the biggest weighted share, when it overwhelms in the direction the strength says.
  const total = GROUPS.reduce((a, g) => a + r.godWeights[g], 0) || 1;
  const top = [...GROUPS].sort((a, b) => r.godWeights[b] - r.godWeights[a])[0];
  const strong = r.strength === "극신강" || r.strength === "신강";
  const fits = strong ? top === "인성" : top === "식상" || top === "재성" || top === "관성";
  const scene = fits && r.godWeights[top] / total >= 0.35 && !r.balanced ? SCENE[top]![dayEl] : BALANCED;

  const luck = LUCK_OF[r.yong];
  const yp = yearPillar(now);
  const yGroup = GROUP_OF[tenGod(p.dayStem, HIDDEN[yp.branch].at(-1)![0])];
  const fit = luckFit(r, p.dayStem, yp.stem, yp.branch);
  const yMood: Mood = fit >= 4 ? "활짝" : fit >= 2 ? "기회" : fit >= -1 ? "무난" : fit >= -3 ? "다지기" : "버티기";
  const yEl = Math.floor(yp.stem / 2);
  const yBrings = r.elements[yEl] === 0
    ? `${ELEMENT_EN[yEl].name}, an element your chart lacks, arrives this year: ${POWER_EN[groupOfEl(yEl)].is}. Expect movement there.`
    : groupOfEl(yEl) === yGroup
      ? `The whole year leans on your ${POWER_EN[yGroup].name} side: ${POWER_EN[yGroup].is}.`
      : `The year's ${ELEMENT_EN[yEl].name} stirs your ${POWER_EN[groupOfEl(yEl)].name} side (${POWER_EN[groupOfEl(yEl)].is}), and underneath it runs ${POWER_EN[yGroup].name} (${POWER_EN[yGroup].is}).`;

  const by = profile?.birthYear;
  return {
    pillars: [
      { label: "Hour", stem: hourStem, branch: p.hourBranch },
      { label: "Day", stem: p.dayStem, branch: p.dayBranch },
      { label: "Month", stem: p.monthStem, branch: p.monthBranch },
      { label: "Year", stem: p.yearStem, branch: p.yearBranch },
    ],
    dayMaster: { stem: p.dayStem, element: dayEl, yang: p.dayStem % 2 === 0, ...DAY_MASTER[p.dayStem] },
    strength: { ...STRENGTH_EN[r.strength], support: Math.round(r.support * 100) },
    lucky: { element: r.yong, helper: r.hee, ...luck },
    scene,
    elements: ELEMENT_EN.map((e, i) => {
      const g = groupOfEl(i);
      return { el: i, ...e, count: r.elements[i], power: g, powerName: POWER_EN[g].name, is: POWER_EN[g].is };
    }),
    // A missing element is missing from the eight visible characters; it may still hide inside a branch.
    missing: r.missing.map((el) => {
      const g = groupOfEl(el);
      const hidden = [p.yearBranch, p.monthBranch, p.dayBranch, p.hourBranch].some(
        (b) => b !== null && HIDDEN[b].some(([s]) => Math.floor(s / 2) === el),
      );
      return {
        el,
        line: `No ${ELEMENT_EN[el].name} shows in your chart${hidden ? " (only a trace hides inside a branch)" : ""}. For you ${ELEMENT_EN[el].name} is ${POWER_EN[g].name}: ${POWER_EN[g].is}. ${POWER_EN[g].low}`,
      };
    }),
    powers: free.powers.map((x) => ({
      group: x.group,
      name: POWER_EN[x.group].name,
      korean: POWER_EN[x.group].korean,
      pct: x.pct,
      rank: x.rank ? x.rank.replace("상위", "top").replace("하위", "bottom") : null,
    })),
    strongest: { name: POWER_EN[[...free.powers].sort((a, b) => b.pct - a.pct)[0].group].name, line: POWER_EN[[...free.powers].sort((a, b) => b.pct - a.pct)[0].group].high },
    weakest: { name: POWER_EN[[...free.powers].sort((a, b) => a.pct - b.pct)[0].group].name, line: POWER_EN[[...free.powers].sort((a, b) => a.pct - b.pct)[0].group].low },
    year: { year: now, ...yp, mood: yMood, brings: yBrings },
    flow: free.flow
      ? free.flow.map((f, i) => {
          const d = profile!.daeun![i];
          const g = GROUP_OF[tenGod(p.dayStem, HIDDEN[d.branch].at(-1)![0])];
          const age = by ? d.from - by : 30;
          return {
            from: f.from,
            to: f.to,
            age: by ? `age ${d.from - by}–${d.to - by}` : "",
            mood: f.mood,
            theme: DECADE_EN[g][age < 18 ? 0 : age < 60 ? 1 : 2],
            now: f.now,
            young: f.young,
          };
        })
      : null,
    animal: ANIMAL_EN[p.yearBranch],
    hourKnown: p.hourBranch !== null,
  };
}
