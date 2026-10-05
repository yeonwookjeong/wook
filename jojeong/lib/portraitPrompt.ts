// What the 도화서 painter is told. Both styles restyle the viewer's own photo (sent only after they agree), and
// keep the person: an image model told to "paint a portrait" invents a stranger, one told to restyle this photo
// keeps the face. "eojin" is a faithful court portrait with no more than a court painter's tidying;
// "pungsok" is a 김홍도-style genre caricature that plays up the features the 관상 measures found striking.

import { band, BANDS, type BandKey, type Metrics } from "./gwansang";

export type Dress = "gwanbok" | "seonbi" | "yeoin";
export type Style = "eojin" | "pungsok";
export const DRESSES: Record<Dress, { label: string; prompt: string }> = {
  gwanbok: {
    label: "관복",
    prompt: "a Joseon official's court dress: black gauze samo hat with two side wings, a deep red round-collared danryeong robe with an embroidered square rank badge (two cranes in clouds) on the chest",
  },
  seonbi: {
    label: "선비",
    prompt: "a Joseon scholar's dress: a fine black horsehair gat hat with a wide brim and a bead strap, a white dopo overcoat with a black collar band",
  },
  yeoin: {
    label: "여인",
    prompt: "a Joseon noblewoman's dress: hair parted in the middle and gathered into a low chignon held by a gold binyeo hairpin, a jade-green dangui jacket with gold-stamped patterns",
  },
};
export const STYLES: Record<Style, { label: string; note: string }> = {
  eojin: { label: "어진처럼 · 닮게", note: "궁중 초상화 그림체로, 얼굴은 그대로" },
  pungsok: { label: "풍속화처럼 · 웃기게", note: "김홍도풍 캐리커처, 내 관상 특징을 과장" },
};

// The features to play up in a caricature: the measures that fell outside 보통, in plain words.
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
  "This is the same person, restyled, not a new person: keep exactly their face shape and width, eye shape, eye size and spacing, " +
  "eyelids, eyebrows, nose, lips, ears, hairline, skin tone, age and gender presentation. Someone who knows them must recognise them at a glance.";
const NO_TEXT = "Do not write any text, letters, characters, seal, signature or watermark. No frame, no border.";

export function portraitPrompt(style: Style, dress: Dress, m: Metrics): string {
  if (style === "eojin")
    return [
      "Restyle the person in the attached photo as a Joseon dynasty court portrait painting (chosang-hwa) by a Dohwaseo painter.",
      KEEP,
      "The only touch-ups allowed are a court painter's: an even skin tone, tidy hair, a calm composed expression close to the photo's.",
      "Style: mineral pigments on aged beige silk, fine brown ink outlines, soft back-colouring on the skin, a plain silk background,",
      "a half-length bust facing the viewer, the face large (about 40% of the picture's height).",
      `Clothing: ${DRESSES[dress].prompt}; the headwear sits on their real hairline. Leave out the photo's background, glasses and modern clothes.`,
      NO_TEXT,
    ].join(" ");
  const play = striking(m);
  return [
    "Turn the person in the attached photo into a humorous Joseon genre-painting caricature in the style of Kim Hong-do (18th century pungsokhwa):",
    "loose, confident ink brush lines with light colour washes on hanji paper, a big head on a small body, warm and playful, never mean.",
    KEEP.replace("keep exactly", "keep recognisable"),
    play.length
      ? `Exaggerate these features of theirs by about a third, the way a caricaturist would: ${play.join(", ")}.`
      : "Exaggerate their most distinctive feature a little, the way a caricaturist would.",
    "Give them a cheeky, good-natured grin and a lively pose (fanning themselves with a folding fan, or mid-laugh), plain paper background.",
    `Clothing: ${DRESSES[dress].prompt}.`,
    NO_TEXT,
  ].join(" ");
}
