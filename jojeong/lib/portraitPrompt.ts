// What the 도화서 painter is told: a Joseon portrait, flattering the way court painters were, true to the
// sitter's proportions. In "record" mode the painter never sees a photo, only the 관상 measures and a line
// sketch of the face's proportions; in "photo" mode it sees the face the viewer chose to send.

import { band, BANDS, type BandKey, type Metrics } from "./gwansang";

export type Dress = "gwanbok" | "seonbi" | "yeoin";
export type Look = { gender: "man" | "woman" | "unsaid"; hair: "short" | "long" | "tied" };
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
    prompt: "a Joseon noblewoman's dress: hair parted in the middle and gathered into a low chignon held by a gold binyeo hairpin, a jade-green dangui jacket with gold-stamped patterns over a deep red skirt",
  },
};

const PHRASES: Record<BandKey, [string, string, string]> = {
  ratio: ["a broad, wide face", "a balanced oval face", "a long oval face"],
  jaw: ["a tapered, pointed chin", "a rounded jaw", "a square, strong jaw"],
  tilt: ["gently downturned outer eye corners", "level eyes", "upturned outer eye corners"],
  open: ["narrow, elongated eyes", "medium-sized eyes", "large, clear eyes"],
  gap: ["close-set eyes", "eyes about one eye-width apart", "wide-set eyes"],
  nose: ["a slender nose", "a straight nose", "broad nostrils"],
  mouth: ["a small mouth", "a medium mouth", "a wide mouth"],
  lip: ["thin lips", "medium lips", "full lips"],
  brow: ["brows sitting low and close to the eyes", "brows at a medium height", "brows set high above the eyes"],
  philtrum: ["a short philtrum", "a medium philtrum", "a long philtrum"],
};

export function featureLine(m: Metrics): string {
  const third = m.upper >= m.middle && m.upper >= m.lower ? "a high forehead" : m.middle >= m.lower ? "a long midface" : "a long lower face";
  const parts = (Object.keys(BANDS) as BandKey[]).map((k) => PHRASES[k][band(k, m[k]).step]);
  return [third, ...parts].join(", ");
}

export function portraitPrompt(mode: "record" | "photo", dress: Dress, m: Metrics, look: Look): string {
  const style = [
    "You are a court painter of the Joseon dynasty's Dohwaseo, the royal painting bureau.",
    "Paint an original Joseon portrait painting (chosang-hwa), not a photo and not a photo filter:",
    "mineral pigments on aged beige silk, fine brown ink outlines, delicate brushwork on the skin, soft back-colouring (baechae),",
    "a half-length bust facing straight ahead, the face large (about 40% of the picture's height), a plain silk background.",
    "Flatter the sitter the way court painters did: healthy even skin, a calm, dignified, quietly confident expression, a gentle warmth in the eyes,",
    "while keeping their real facial proportions so friends would recognise them at once.",
    `Clothing: ${DRESSES[dress].prompt}.`,
    "Do not write any text, letters, characters, seal, signature or watermark. No frame, no border.",
  ];
  if (mode === "photo")
    return [
      ...style,
      "The attached photo shows the sitter. Keep their identity: face shape, hairline, eyes, nose, mouth and skin tone.",
      "Change only the clothing and headwear to the dress above; leave out the photo's background, glasses, earphones and modern clothes.",
    ].join(" ");
  const who = look.gender === "man" ? "a man" : look.gender === "woman" ? "a woman" : "an adult";
  const hair = { short: "short hair", long: "long hair", tied: "hair tied back" }[look.hair];
  return [
    ...style,
    "You cannot see the sitter. Paint from the bureau's measurement record and the attached line sketch,",
    "which traces only the face's outline and features: follow its proportions, not its style.",
    `The sitter is ${who} with ${hair} (under the headwear if any). Record of the face: ${featureLine(m)}.`,
  ].join(" ");
}
