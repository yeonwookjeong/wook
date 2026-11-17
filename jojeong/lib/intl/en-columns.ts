import type { IntlColumn } from "./columns";

// English columns (2026-11-16): written for a reader who has never seen a saju chart. Korean terms appear once,
// romanized, with a plain explanation; never a reading of one person's chart, never timing.

export const EN_COLUMNS: IntlColumn[] = [
  {
    slug: "how-to-read-a-saju-chart",
    ko: "eight-cells",
    title: "How to read a saju chart: the four pillars and eight characters, explained",
    summary: "A first guide to the Korean saju chart: what the four pillars are, what each of the eight characters stands for, the five elements, and which character is you.",
    date: "2026-11-16",
    points: ["What the four pillars and eight characters are", "What each of the eight cells looks at", "The five elements, and the one character that is you"],
    body: [
      {
        t: "p",
        text: "Saju (사주, “four pillars”) is the Korean way of reading a life from the moment of birth. Koreans still look at it before a wedding, a new job or a new year. The first thing you meet is a small table of eight Chinese characters. It looks like a code, but the rules behind it are simple, and after this guide you will know where to find yourself in it.",
      },
      { t: "h2", text: "Four moments, written as four pillars" },
      {
        t: "p",
        text: "Your birth is written down as four moments: the year, the month, the day and the hour. Each moment becomes one pillar. The year pillar, the month pillar, the day pillar and the hour pillar stand side by side, read from right to left in the traditional layout, so the year sits on the far right and the hour on the far left.",
      },
      {
        t: "p",
        text: "Every pillar holds two characters, one above the other. Four pillars of two characters make eight in all, which is why saju is also called palja (팔자), “the eight characters”. When Koreans say someone has a “strong palja”, these are the eight characters they mean.",
      },
      { t: "h2", text: "The top row: heavenly stems" },
      {
        t: "p",
        text: "The upper character of each pillar is a heavenly stem (천간, cheongan). There are ten of them, from 甲 (gap) to 癸 (gye). They describe what shows on the outside: how you come across, what other people notice first.",
      },
      { t: "h2", text: "The bottom row: earthly branches" },
      {
        t: "p",
        text: "The lower character is an earthly branch (지지, jiji). There are twelve, and they are the twelve animals of the zodiac: rat, ox, tiger, rabbit, dragon, snake, horse, goat, monkey, rooster, dog and pig. The branch of your year pillar is the animal you were born under. The branches carry what sits underneath: habits, instincts, the inner side.",
      },
      {
        t: "term",
        k: "Day master (일간, ilgan)",
        v: "The upper character of the day pillar. It stands for you. Every other character is read in relation to it.",
      },
      { t: "h2", text: "What each cell looks at" },
      {
        t: "list",
        items: [
          "Year pillar: the family you were born into and your early years. Its lower character is your zodiac animal.",
          "Month pillar: the season you were born in. It sets the climate of the whole chart, and is read for temperament and work.",
          "Day pillar, top: you. This is the day master.",
          "Day pillar, bottom: the seat closest to you, traditionally called the spouse seat.",
          "Hour pillar: plans for the future, children and later life. It needs the birth time.",
        ],
      },
      { t: "h2", text: "The colours: five elements" },
      {
        t: "p",
        text: "Each of the eight characters belongs to one of five elements: wood, fire, earth, metal and water (오행, ohaeng). Charts are often coloured by element, green for wood, red for fire, yellow for earth, white or grey for metal, and black or blue for water. A glance at the colours tells you which elements are plentiful in a chart and which are missing.",
      },
      {
        t: "p",
        text: "The elements feed and check one another. Wood feeds fire, fire makes earth, earth bears metal, metal carries water, and water feeds wood. In the other direction, wood breaks earth, earth dams water, water puts out fire, fire melts metal, and metal cuts wood. A saju reading is, at heart, a careful look at how these five forces sit together around the day master.",
      },
      { t: "h2", text: "Questions people ask first" },
      {
        t: "qa",
        q: "My zodiac animal looks wrong. Why?",
        a: "In saju the year does not turn on January 1 or on the Lunar New Year, but at ipchun, the start of spring, around February 4. If you were born in January or early February, your saju year may be the previous one.",
      },
      {
        t: "qa",
        q: "I don't know my birth time.",
        a: "Then the hour pillar stays empty and six characters are read. They carry most of the chart, including the day master.",
      },
      {
        t: "qa",
        q: "Are two people with the same birthday the same?",
        a: "Two people born on the same day share six characters at most. The hour, and the ten-year cycles that depend on sex, set them apart.",
      },
    ],
  },
  {
    slug: "day-pillar-meaning",
    ko: "ilju",
    title: "Your day pillar in saju: the one pillar that stands for you",
    summary: "Why the day pillar (ilju) is the heart of a saju chart, what its top and bottom characters mean, and why Koreans ask “what’s your ilju?” the way others ask about star signs.",
    date: "2026-11-16",
    points: ["Why the day pillar matters most", "The day master and the spouse seat", "Why there are sixty day pillars, and what they are not"],
    body: [
      {
        t: "p",
        text: "In Korea, people who enjoy saju ask each other “what’s your ilju?” the way others ask about star signs. Ilju (일주) is the day pillar: the two characters of the day you were born. Of the four pillars it is the one read first, because it is the one that stands for you.",
      },
      { t: "h2", text: "The top character: the day master" },
      {
        t: "p",
        text: "The upper character of the day pillar is the day master (일간, ilgan). Everything in a chart is read from its point of view. The ten possible day masters are often described as images from nature: 甲 a tall tree, 乙 a vine or flower, 丙 the sun, 丁 a candle, 戊 a mountain, 己 a field, 庚 a rock or blade, 辛 a jewel, 壬 the sea, 癸 rain.",
      },
      { t: "h2", text: "The bottom character: the spouse seat" },
      {
        t: "p",
        text: "The lower character is the branch closest to you. Tradition calls it the spouse seat, and it is also read for your private, everyday self, the person you are at home rather than at work.",
      },
      { t: "h2", text: "Why there are sixty" },
      {
        t: "p",
        text: "Ten stems and twelve branches pair up in a fixed order, yang with yang and yin with yin, which gives sixty combinations, the sixty-day cycle (육십갑자). Every day of the calendar falls on one of them, and the cycle has run without a break for centuries. So about one person in sixty shares your day pillar.",
      },
      {
        t: "term",
        k: "Sixty-day cycle (육십갑자)",
        v: "The sixty pairs of a stem and a branch, used to count years, months, days and hours.",
      },
      { t: "h2", text: "What a day pillar tells you, and what it does not" },
      {
        t: "p",
        text: "A day pillar gives a first portrait: the basic grain of a person, the way they meet the world, what they look for close by. That is why it makes such good conversation. But it is two characters of eight. The month you were born in, the balance of the five elements and the ten-year cycles all change how that portrait plays out. Two people with the same day pillar can live very different lives, and the rest of the chart is where the difference lies.",
      },
      {
        t: "qa",
        q: "How do I find my day pillar?",
        a: "It is counted from your date of birth on the sixty-day cycle. You do not need your birth time for it, only the date where you were born.",
      },
      {
        t: "qa",
        q: "Does it change if I was born just before midnight?",
        a: "It can. The day turns around the hour of the rat, late at night, and schools differ on exactly when. If you were born between 11 pm and 1 am, it is worth checking both days.",
      },
    ],
  },
  {
    slug: "zodiac-year-starts-at-ipchun",
    ko: "ipchun-tti",
    title: "Your Korean zodiac animal may be wrong: the saju year starts at ipchun, around February 4",
    summary: "In saju the year turns at ipchun, the start of spring, not on January 1 or the Lunar New Year. Who is affected, and why the month changes on solar terms too.",
    date: "2026-11-16",
    points: ["When the saju year really begins", "Who should check their animal again", "Why months change on solar terms, not on the 1st"],
    body: [
      {
        t: "p",
        text: "Many people know their zodiac animal from the year they were born. In saju that is right for most of the year, and wrong for the first five weeks of it. The saju year does not begin on January 1, and not on the Lunar New Year either. It begins at ipchun (입춘), the start of spring, which falls around February 4.",
      },
      { t: "h2", text: "Why spring, and not the new moon" },
      {
        t: "p",
        text: "Saju follows the sun, not the moon. The solar year is divided into twenty-four solar terms (절기, jeolgi), each about fifteen days apart, set by the sun’s position. Ipchun is the first of them. The Lunar New Year moves with the moon and can fall anywhere between late January and mid-February, so it cannot mark a solar year.",
      },
      {
        t: "term",
        k: "Ipchun (입춘)",
        v: "The solar term that opens spring, around February 3 to 5. In saju the year, and its animal, change here, at a set minute.",
      },
      { t: "h2", text: "Who should check again" },
      {
        t: "list",
        items: [
          "Anyone born between January 1 and ipchun belongs to the previous saju year, and to its animal.",
          "Born on ipchun day itself: the exact minute matters, so check the hour of the term for your year.",
          "Born after the Lunar New Year but before ipchun: your lunar year and your saju year differ.",
        ],
      },
      {
        t: "p",
        text: "For example, in 2027 ipchun falls on February 4 at 10:46 in the morning, Korean time. Someone born on February 4, 2027 at 9 am still belongs to the year of the horse; someone born at noon that day belongs to the year of the goat.",
      },
      { t: "h2", text: "The month changes the same way" },
      {
        t: "p",
        text: "The months of saju also follow the solar terms. Each month begins on a term, around the 4th to the 8th of the calendar month. If you were born in the first week of a month, your saju month may be the one before. This matters more than the animal: the month sets the season of the whole chart.",
      },
      {
        t: "qa",
        q: "Which should I use, my birthday in my country or in Korea?",
        a: "The date and time where you were born. A saju chart is not converted to Korean time.",
      },
    ],
  },
  {
    slug: "unknown-birth-time",
    ko: "unknown-hour",
    title: "Don’t know your birth time? What a saju reading can still see",
    summary: "Without the hour, a saju chart keeps six of its eight characters, including the one that stands for you. What is lost, what remains, and how to narrow down the hour.",
    date: "2026-11-16",
    points: ["What the hour pillar adds", "What six characters can still tell", "How to narrow down a birth time"],
    body: [
      {
        t: "p",
        text: "Many people know their birth date but not the hour. It is one of the most common worries about saju, and the answer is reassuring: without the hour you keep six of the eight characters, and the most important one, the day master that stands for you, is among them.",
      },
      { t: "h2", text: "The day in twelve hours" },
      {
        t: "p",
        text: "Saju divides the day into twelve double hours, each named after a zodiac animal, starting with the rat at night. The hour pillar is the pair of characters for the double hour you were born in. Because the day has only twelve of them, knowing the time to within two hours is enough.",
      },
      { t: "h2", text: "What the hour adds" },
      {
        t: "p",
        text: "The hour pillar is read for later life, for children and for the plans you hold for the future. It also adds two characters to the balance of the five elements, so in a chart where the elements are close, the hour can tip the balance.",
      },
      { t: "h2", text: "What six characters still tell" },
      {
        t: "list",
        items: [
          "The day master: who you are, the centre of every reading.",
          "The month pillar: the season you were born in, which sets the climate of the chart.",
          "The year pillar: family background and your zodiac animal.",
          "Most of the balance of the five elements.",
        ],
      },
      {
        t: "term",
        k: "Three pillars (삼주)",
        v: "A chart read without the hour: year, month and day. Readers simply say which parts of the reading depend on the hour.",
      },
      { t: "h2", text: "Narrowing down the hour" },
      {
        t: "p",
        text: "Birth certificates and hospital records often carry the time. Parents may remember whether it was morning or night, before or after a meal. Even “early morning” narrows the twelve hours down to two or three.",
      },
      {
        t: "qa",
        q: "Should I guess the hour?",
        a: "No. A wrong hour adds two wrong characters. It is better to read six true ones.",
      },
    ],
  },
  {
    slug: "korean-compatibility-gunghap",
    ko: "gunghap-basics",
    title: "Gunghap, Korean compatibility reading: how two saju charts are read together",
    summary: "What Koreans mean by gunghap, why couples check it before a wedding, and the main things it compares: the day pillars, the five elements, and the pulls and clashes between characters.",
    date: "2026-11-16",
    points: ["What gunghap is, and why it matters in Korea", "What two charts are compared on", "What a gunghap can and cannot say"],
    body: [
      {
        t: "p",
        text: "Gunghap (궁합) is the Korean reading of two people’s charts side by side. Families once compared the charts of a bride and groom before a match was agreed, and many couples still look at it before a wedding today, half seriously and half for fun. Friends and colleagues read it too.",
      },
      { t: "h2", text: "Not a score, a conversation" },
      {
        t: "p",
        text: "A good gunghap is not two identical charts. It is two charts that fill each other’s gaps: one person brings what the other lacks, and where they rub, they know why. The aim is to understand the shape of the relationship, not to pass or fail it.",
      },
      { t: "h2", text: "What two charts are compared on" },
      {
        t: "list",
        items: [
          "The two day masters, the characters that stand for each person, and how their elements meet.",
          "The spouse seats, the lower characters of the day pillars, and whether they pull together or clash.",
          "The balance of the five elements: whether one person supplies the element the other is missing.",
          "The pulls (합, hap) and clashes (충, chung) between all the characters of the two charts.",
        ],
      },
      {
        t: "term",
        k: "Hap (합) and chung (충)",
        v: "Hap is a pull between two characters that bind together; chung is a clash between two that stand opposite each other, like the rat and the horse.",
      },
      { t: "h2", text: "Why the zodiac animal alone is not enough" },
      {
        t: "p",
        text: "Popular lists match animals: the rat with the ox, the tiger with the horse. These come from the same pulls and clashes, but they look at one character in eight. Two people whose animals clash can have day pillars that bind beautifully, and the other way round.",
      },
      { t: "h2", text: "Timing matters too" },
      {
        t: "p",
        text: "Each person moves through ten-year cycles. A pair can be easy in one decade and harder in the next, simply because their cycles move differently. A full gunghap reading looks at the years ahead together as well as the two charts.",
      },
      {
        t: "qa",
        q: "Can a gunghap say we should break up?",
        a: "No. It describes how two people meet: where it is easy, where it rubs. What you do with that is yours.",
      },
    ],
  },
];
