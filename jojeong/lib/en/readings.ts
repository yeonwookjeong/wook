// The English shop: four products, each the Korean report of the same id written in English (lib/reportWriter.ts
// jobFor with lang "en"). The engine, the brief and the chapter order are the Korean ones; only the language,
// the voice and the chapter titles change. The Korean name report lives apart (app/en/name).

import type { ProductId } from "@/lib/products";

export type EnReadingId = "life" | "year" | "love";
export type EnReading = {
  id: EnReadingId;
  product: ProductId; // the Korean report it is written from
  title: string;
  hanja: string;
  price: number; // USD, proposed
  people: 1 | 2;
  tagline: string;
  teaser: string;
  chapters: string[]; // English titles, same order and count as the Korean toc
  glance: string[]; // the closing "At a glance" rows, same order as the Korean ones
};

export const EN_READINGS: EnReading[] = [
  {
    id: "life",
    product: "pyeongsaeng",
    title: "Life Reading",
    hanja: "命書",
    price: 9.99,
    people: 1,
    tagline: "Who you are and how your life unfolds: character, money, work, love, family and health, in one book.",
    teaser: "Your whole chart read from start to finish, the way a Joseon court astrologer would write it for you.",
    chapters: [
      "Who am I, really?",
      "How others see me, and who I am inside",
      "My chart's strengths and weak spots",
      "How much wealth is in my chart?",
      "What kind of work lets me thrive?",
      "My love life and marriage",
      "Parents, siblings and children",
      "People who help me, people to watch",
      "The body I need to look after",
      "The four seasons of my life: youth, early adulthood, midlife, later years",
      "Where am I in my life right now?",
      "The next ten years: chances I must not miss",
      "Hundo's prescriptions for a lifetime",
    ],
    glance: ["In one line", "Money", "Work", "Love", "Watch out for", "The one thing that is only yours"],
  },
  {
    id: "year",
    product: "yeonun",
    title: "2027 Year Ahead",
    hanja: "年運",
    price: 6.99,
    people: 1,
    tagline: "What 2027, the year of the Red Sheep, brings you: money, work, love, people, and month by month.",
    teaser: "The year that begins at Ipchun (4 February 2027) read against your own chart, with the best and hardest months marked.",
    chapters: [
      "The year in one line, and why",
      "This year inside your ten-year cycle",
      "Money: coming in, or slipping out?",
      "Work and position: rising, or moving?",
      "Love and romance",
      "People: who helps you, who to watch",
      "Family and home",
      "Body and mind",
      "Moves to make and papers to sign",
      "Month by month: February to July",
      "Month by month: August to January",
      "Three decisive moments, and how to make them yours",
    ],
    glance: ["In one line", "Money", "Work", "Love and people", "Best month"],
  },
  {
    id: "love",
    product: "gunghap",
    title: "Love Compatibility",
    hanja: "宮合",
    price: 7.99,
    people: 2,
    tagline: "Do we really fit? Why you are drawn to each other, where you clash, and what keeps you together.",
    teaser: "Two charts side by side: the pull between you, the friction, and your good and hard years together.",
    chapters: [
      "The two of us: first impressions and what draws us",
      "Is there a place for this person in my chart?",
      "What we give each other, and where we clash",
      "What happens when we fight",
      "Money and daily life together",
      "What we should agree on early",
      "What we must keep to last",
      "Our ten years: good years together, years out of step",
      "Coming soon: our good months and careful months",
    ],
    glance: ["In one line", "To each other", "Where you clash", "How to last", "Good times", "The one thing only you two have"],
  },
];

export const enReadingById = (id: string) => EN_READINGS.find((r) => r.id === id) ?? null;
export const enReadingOfProduct = (p: string) => EN_READINGS.find((r) => r.product === p) ?? null;
export const EN_NAME_PRICE = 3.99;
export const usd = (n: number) => `$${n.toFixed(2)}`;

// Appended to the Korean system prompt when the report is written in English. Everything above it (the evidence
// rules, the honesty rules, the format) still holds; what it overrides is said plainly.
export function englishOverride(r: EnReading): string {
  return `

[OUTPUT LANGUAGE: ENGLISH — this overrides every rule above about Korean speech style]
- Write the entire report in natural, warm, modern English for a reader who is not Korean and knows nothing about saju. Never write Korean or Chinese characters, except a hanja shown once in parentheses after a term you are explaining.
- Ignore the Korean style rules above (해요체, 님, 사극 말투, Korean examples). Address the reader by their first name now and then, and as "you" otherwise. Do not call them "Your Majesty" or use archaic English.
- Saju terms: use at most one or two per chapter, and explain each in plain English the first time (for example "your Day Master, the element you were born as"). Prefer the meaning over the term. Five elements are Wood, Fire, Earth, Metal, Water.
- Make the life scenes fit an international reader: no Korean-only customs, holidays, school or army years. Ages, jobs and family stages stay general.
- Hundo is a scholar of fate from Joseon's royal observatory; one light touch of that voice in the first chapter is enough.
- Be honest and never absolute: write "tends to", "is likely to", not "will". No health diagnoses, no investment promises.
- Chapter headings: use these English questions, in this order, exactly as written, in the "## [question] headline" format: ${r.chapters.map((c, i) => `${i + 1}. ${c}`).join(" / ")}. Headlines are one short English sentence (under 12 words).
- The closing summary block: write its heading as "## [At a glance] headline", and its rows with these English labels in this order: ${r.glance.map((g) => `[${g}]`).join(" ")}. One short sentence per row.`;
}
