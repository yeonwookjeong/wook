import type { ProductId } from "@/lib/products";

// The English shelf (2026-11-15, 대표님 "한국거랑 같고, 외국인용 친절 설명이랑 디테일만 다르게"): the same readings as
// the Korean site, each chapter list translated from lib/products.ts, with the extra a newcomer to saju needs
// (what it is, what we ask for, what happens if the birth hour is unknown). 속궁합, 재회운 and the shelved free
// games stay off here as they are off the Korean shelf.

export type EnReading = {
  id: ProductId;
  title: string;
  // Small line above the title: the Korean name, so the reading keeps its roots.
  korean: string;
  tagline: string;
  // One or two sentences on who it is for, written for someone who has never had a saju reading.
  forWhom: string;
  toc: string[];
  free?: boolean;
  // Two people are read together.
  pair?: boolean;
};

// Price for every paid reading until checkout opens (assumed, 2026-11-15: PayPal and card fees make the Korean
// ₩990 too small to sell abroad; one place to change it).
export const EN_PRICE_USD = 4.99;
export const priceLabel = (free?: boolean) => (free ? "Free" : `US$${EN_PRICE_USD.toFixed(2)}`);
// Checkout for overseas cards and PayPal waits on the Toss Payments contract.
export const EN_CHECKOUT_OPEN = false;

export const EN_READINGS: EnReading[] = [
  {
    id: "sinbun",
    title: "Your Life in Joseon",
    korean: "조선 신분 감정 · 身分",
    tagline: "If you had been born in Joseon Korea, who would you have been? Your rank, your work and your whole life, read from your birth chart.",
    forWhom: "The easiest way to meet saju. If you love Korean historical dramas, start here.",
    toc: ["The house you were born into", "A day in that life", "How people saw you", "The hardest years", "Helpers and rivals", "Rising in the world", "Old age"],
    free: true,
  },
  {
    id: "pyeongsaeng",
    title: "Lifetime Reading",
    korean: "평생 사주 · 命書",
    tagline: "Who am I, and how will my life unfold? Personality, money, work, love, family, health and the whole arc of your life in one book.",
    forWhom: "For your first full reading. It reads your chart from beginning to end, like a book about you.",
    toc: [
      "What kind of person am I",
      "The me others see, and the real me",
      "The strengths and weak spots in my chart",
      "How much wealth my chart holds",
      "The work that lets me thrive",
      "My love and marriage",
      "Parents, siblings and children",
      "People: who helps me, who to watch",
      "The body to look after for life",
      "The four seasons of my life",
      "Where I stand in my life right now",
      "The chances to catch in the next ten years",
      "Hundo's lifelong advice",
    ],
  },
  {
    id: "gunghap",
    title: "Couple Compatibility",
    korean: "궁합 · 宮合",
    tagline: "Are we really a good match? Why you are drawn to each other, where you clash, and what keeps you together.",
    forWhom: "For couples, or anyone curious about one person. Both birth dates go side by side.",
    toc: [
      "Our first impression and what draws us",
      "Is there a place for this person in my chart",
      "What we give each other, and where we clash",
      "How we fight",
      "Money and daily life together",
      "What we should agree on early",
      "What keeps us going for the long run",
      "Our next ten years: good years together, years apart",
      "The months ahead: good months and careful months",
    ],
    pair: true,
  },
  {
    id: "yeonun",
    title: "Year Ahead",
    korean: "연운 · 年運",
    tagline: "What will this year bring? One year read in depth, month by month: money, work, love, people, health.",
    forWhom: "For planning a year, or looking back at one. Pick any year from your birth to ten years ahead.",
    toc: [
      "The year in one line, and why",
      "This year inside your ten-year cycle",
      "Money: coming in or slipping out",
      "Work and position: rising or moving",
      "Love and dating",
      "People: helpers and those to watch",
      "Family and home",
      "Body and mind",
      "When to move, when to sign",
      "Month by month: February to July",
      "Month by month: August to January",
      "The three key moments, and how to use them",
    ],
  },
  {
    id: "yeonae",
    title: "Love and Marriage",
    korean: "연애, 결혼운 · 戀愛",
    tagline: "Why do I keep falling for the same type? Who really suits me, and when and with whom marriage comes.",
    forWhom: "For anyone single, dating or wondering. It reads the spouse seat in your chart and the flow of your relationships.",
    toc: [
      "Who I am when I am in love",
      "Why I keep falling for the same type",
      "The person who truly suits me",
      "Why my relationships keep tangling",
      "Marriage: when, and with whom",
      "This year's love luck and the months love may come",
      "If you are seeing someone now",
    ],
  },
  {
    id: "jaemul",
    title: "Wealth",
    korean: "재물운 · 財物",
    tagline: "Why doesn't money stay with me? Salary or business, whether to invest, and when money opens up.",
    forWhom: "For anyone thinking about money and career moves. It reads the shape wealth takes in your chart.",
    toc: [
      "How I make money",
      "The real reason money does not stay",
      "A salary, or my own work",
      "Am I someone who should invest",
      "When money opens up",
      "Habits that fill the wallet",
    ],
  },
  {
    id: "jikup",
    title: "Career and Calling",
    korean: "직업, 적성 · 適性",
    tagline: "Is my work right for me? Three kinds of work that suit you, employee or independent, and when to move.",
    forWhom: "For anyone choosing, changing or questioning their work.",
    toc: [
      "The work where I shine",
      "If work feels heavy right now",
      "Three kinds of work that suit me",
      "Company type or independent type",
      "Changing jobs or starting out: when",
      "Habits that make work flow",
    ],
  },
  {
    id: "taekil",
    title: "Choosing a Good Day",
    korean: "택일 · 擇日",
    tagline: "A wedding, a move, an opening, a contract, a trip. Good days picked from the traditional almanac and your own chart.",
    forWhom: "For anyone with a big day to plan. This was Hundo's real job at the royal observatory.",
    toc: ["The days Hundo picked", "Why these days", "On the day: what time, and what to do", "How this differs from a common lucky-day list", "When the dates do not fit your plans"],
  },
];

export const enReading = (id: string) => EN_READINGS.find((r) => r.id === id);

// Questions a newcomer asks before buying, answered once for every reading.
export const EN_FAQ: { q: string; a: string }[] = [
  {
    q: "What is saju?",
    a: "Saju (사주, “four pillars”) is the Korean way of reading a life from the year, month, day and hour of birth. Each of the four is written as two characters, eight in all, and the balance of the five elements (wood, fire, earth, metal, water) among them describes a temperament and the timing of a life. Koreans still look at it before a wedding, a new job or a new year.",
  },
  {
    q: "Who is Hundo?",
    a: "Hundo (훈도) was the title of the fortune scholars at Joseon's royal observatory, who chose auspicious days for the court. Our readings are written in his voice, with modern, plain explanations.",
  },
  {
    q: "What do I need to give you?",
    a: "Your date of birth and, if you know it, the time. If you were born outside Korea, the date and time where you were born are what count; we do not convert them to Korean time.",
  },
  {
    q: "I don't know my birth time.",
    a: "That is common. Without the hour we read the other six characters, which carry most of the chart. Chapters that depend on the hour say so.",
  },
  {
    q: "What language is the reading in?",
    a: "English, written for someone new to saju. Korean terms appear once with a short explanation, never on their own.",
  },
  {
    q: "How do I receive it?",
    a: "It opens on screen right after you pay, and you can come back to it with the same link.",
  },
  {
    q: "Is this a prediction?",
    a: "No. Saju is a tradition for reflection and conversation, not a forecast or professional advice. Please make important decisions yourself.",
  },
  {
    q: "Refunds",
    a: "A reading is a digital item that opens as soon as it is paid for, so once you have started viewing it the order cannot be cancelled. If it does not open because of an error on our side, or you were charged a different amount, you get a full refund. Write to joyhunt.official@gmail.com.",
  },
];
