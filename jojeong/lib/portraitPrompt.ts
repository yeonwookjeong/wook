// What the 도화서 painter is told. Every version restyles the viewer's own photo (sent only after they agree)
// and keeps the person: an image model told to "paint a portrait" invents a stranger, one told to restyle this
// photo keeps the face. The 멋지게/예쁘게 versions are the sitter on their best day in a Joseon role; 풍속화 is
// a 김홍도-style caricature that plays up the features the 관상 measures found striking. Any version is open to
// anyone: nothing here guesses a gender.

import { band, BANDS, type BandKey, type Metrics } from "./gwansang";

export type Group = "멋지게" | "예쁘게" | "재밌게";
type Version = { label: string; group: Group; role: string; costume: string; mood: string; background: string };

export const VERSIONS = {
  king: {
    label: "임금",
    group: "멋지게",
    role: "a Joseon king in his royal portrait (eojin)",
    costume: "a black ikseongwan crown with two small wings rising at the back, a red gonryongpo dragon robe with round gold five-clawed dragon badges on the chest and both shoulders, a jade belt",
    mood: "commanding, regal and calm",
    background: "an Irworobongdo screen (sun, moon and five peaks) behind the throne",
  },
  general: {
    label: "장군",
    group: "멋지게",
    role: "a Joseon general",
    costume: "a black felt jeollip hat with a red tassel and a peacock feather, a dark blue gugunbok military coat over red sleeves, a waist sash, a bow in hand",
    mood: "valiant and steady, a hint of a confident smile",
    background: "plain silk with faint distant mountains",
  },
  scholar: {
    label: "꽃선비",
    group: "멋지게",
    role: "a young Joseon scholar admired by the whole town",
    costume: "a fine black horsehair gat with a bead strap, a white dopo overcoat with a black collar band, a book in hand",
    mood: "gentle, intelligent, a warm small smile",
    background: "a branch of plum blossom",
  },
  hallyang: {
    label: "한량",
    group: "멋지게",
    role: "a charming Joseon gentleman of leisure",
    costume: "a black gat with an amber bead strap, a light indigo cheollik robe, a folding fan",
    mood: "carefree and charming, a playful grin",
    background: "a pavilion by a willow tree",
  },
  queen: {
    label: "중전",
    group: "예쁘게",
    role: "a Joseon queen in full ceremony",
    costume: "a deep blue jeogui ceremonial robe patterned with pheasants, a grand ceremonial hairstyle (keun-meori) with gold tteoljam ornaments",
    mood: "graceful, serene and majestic",
    background: "an Irworobongdo screen (sun, moon and five peaks)",
  },
  princess: {
    label: "공주",
    group: "예쁘게",
    role: "a Joseon princess",
    costume: "a green wonsam robe with rainbow saekdong sleeves, a jewelled hwagwan floral crown",
    mood: "radiant, a bright happy smile",
    background: "blooming peonies",
  },
  agassi: {
    label: "아씨",
    group: "예쁘게",
    role: "a young Joseon noble lady",
    costume: "a pale pink jeogori with a purple collar and a deep indigo chima skirt, hair braided with a red daenggi ribbon",
    mood: "elegant, a soft shy smile",
    background: "a lotus pond",
  },
  damo: {
    label: "다모",
    group: "예쁘게",
    role: "a Joseon damo, a fearless female investigator of the police bureau",
    costume: "practical dark navy jacket and skirt, a black headscarf, a short sword at the side",
    mood: "cool and fearless, eyes sharp",
    background: "tiled rooftops under a night moon",
  },
  pungsok: {
    label: "풍속화",
    group: "재밌게",
    role: "",
    costume: "everyday Joseon commoner's clothes with a gat",
    mood: "",
    background: "plain hanji paper",
  },
} satisfies Record<string, Version>;
export type VersionKey = keyof typeof VERSIONS;
export const GROUPS: { group: Group; note: string }[] = [
  { group: "멋지게", note: "내 얼굴 그대로, 가장 멋진 날" },
  { group: "예쁘게", note: "내 얼굴 그대로, 가장 예쁜 날" },
  { group: "재밌게", note: "김홍도풍 캐리커처 · 내 관상 특징을 과장" },
];

// The features to play up in a caricature: the measures that fell clearly outside 보통.
const STRIKING: Record<BandKey, [string, string]> = {
  ratio: ["a broad, wide face", "a long face"],
  jaw: ["a pointed chin", "a square jaw"],
  tilt: ["droopy outer eye corners", "upturned, cat-like eye corners"],
  open: ["narrow eyes", "big round eyes"],
  gap: ["close-set eyes", "wide-set eyes"],
  nose: ["a slender nose", "broad nostrils"],
  mouth: ["a small mouth", "a wide mouth"],
  lip: ["thin lips", "full lips"],
  brow: ["low brows hugging the eyes", "high, arched brows"],
  philtrum: ["a short philtrum", "a long philtrum"],
};
export function striking(m: Metrics): string[] {
  return (Object.keys(BANDS) as BandKey[]).flatMap((k) => {
    const { step, near } = band(k, m[k]);
    return step === 1 || near ? [] : [STRIKING[k][step === 0 ? 0 : 1]];
  });
}

const KEEP =
  "This is the same person, not a new one: keep their bone structure, face shape, eye shape and spacing, eyelids, eyebrows, nose, lips, ears, " +
  "skin tone and apparent age. Someone who knows them must recognise them at a glance.";
const NO_TEXT = "Do not write any text, letters, characters, seal, signature or watermark. No frame, no border.";

export function portraitPrompt(key: VersionKey, m: Metrics): string {
  const v: Version = VERSIONS[key];
  if (key === "pungsok") {
    const play = striking(m);
    return [
      "Turn the person in the attached photo into a humorous Joseon genre-painting caricature in the style of Kim Hong-do (18th century pungsokhwa):",
      "loose, confident ink brush lines with light colour washes on hanji paper, a big head on a small body, warm and playful, never mean.",
      KEEP,
      play.length
        ? `Exaggerate these features of theirs by about a third, the way a loving caricaturist would: ${play.join(", ")}.`
        : "Exaggerate their most distinctive feature a little, the way a loving caricaturist would.",
      "Give them a cheeky, good-natured grin and a lively pose, fanning themselves or mid-laugh.",
      `Clothing: ${v.costume}. Background: ${v.background}.`,
      NO_TEXT,
    ].join(" ");
  }
  return [
    `Restyle the person in the attached photo as ${v.role}, painted by a master of the Joseon royal painting bureau (Dohwaseo).`,
    KEEP,
    "Make it the most flattering version of them, as they look on their very best day: clear radiant skin, bright confident eyes,",
    "a clean defined jawline, glossy well-kept hair, flattering soft light. Idealise the way a royal court painter would, but never change who they are.",
    "Dress them in the costume below whatever their gender in the photo, and leave out the photo's background, glasses and modern clothes.",
    `Costume: ${v.costume}. Expression and bearing: ${v.mood}. Background: ${v.background}.`,
    "Style: an exquisite Joseon colour painting on silk, mineral pigments, fine ink outlines, rich but harmonious colours;",
    "a half-length portrait facing the viewer, the face large (about 40% of the picture's height).",
    NO_TEXT,
  ].join(" ");
}
