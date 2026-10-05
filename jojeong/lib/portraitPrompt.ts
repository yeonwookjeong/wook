// The 관상 result's portrait: the viewer's own face (sent only after they agree) restyled by an image model in one
// shared Joseon style, so every reading looks alike and anyone fits it: a half-length bust in plain white hanbok
// on silk. Told to restyle this photo, the model keeps the person; told to paint a portrait, it invents one.

const KEEP =
  "This is the same person, not a new one: keep their bone structure, face shape, eye shape and spacing, eyelids, eyebrows, nose, lips, ears, " +
  "hairstyle, skin tone and apparent age. Someone who knows them must recognise them at a glance.";

export function portraitPrompt(): string {
  return [
    "Restyle the person in the attached photo as a Joseon dynasty portrait painting by a master of the royal painting bureau (Dohwaseo).",
    KEEP,
    "Make it the most flattering version of them, as they look on their very best day: clear radiant skin, bright calm eyes,",
    "a clean jawline, neat glossy hair, a composed, quietly confident expression. Idealise the way a court painter would, but never change who they are.",
    "Clothing: a plain white hanbok with a white collar band (dongjeong), nothing on the head. Leave out the photo's background, glasses and modern clothes.",
    "Style: an exquisite Joseon colour portrait on aged beige silk, mineral pigments, fine brown ink outlines, soft back-colouring on the skin,",
    "a plain silk background, a half-length bust facing the viewer, the face large (about 40% of the picture's height).",
    "Do not write any text, letters, characters, seal, signature or watermark. No frame, no border.",
  ].join(" ");
}
