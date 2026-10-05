// The 관상 result's portrait: the viewer's own face (sent only after they agree) restyled by an image model in one
// shared Joseon style, so every reading looks alike and anyone fits it: a half-length bust in plain white hanbok
// on silk. Told to restyle this photo, the model keeps the person; told to paint a portrait, it invents one.

const KEEP =
  "This is the same person, not a new one: keep their bone structure, face shape, eye shape and spacing, eyelids, eyebrows, nose, lips, ears, " +
  "hairstyle, skin tone and apparent age. Someone who knows them must recognise them at a glance.";

export function portraitPrompt(): string {
  return [
    "Restyle the person in the attached photo as a true-to-life Joseon dynasty portrait painting, with the realism of Yun Du-seo's self-portrait.",
    KEEP,
    "Realism first: real facial proportions, natural three-dimensional shading, real skin texture, their actual eye and lip shapes;",
    "not anime, not a cartoon, not a webtoon, not doll-like, not over-smoothed, no enlarged eyes, no slimmed face.",
    "Flattery only as a careful court painter would allow: an even skin tone, neat hair, a calm and quietly confident expression close to the photo's.",
    "Clothing: a plain white hanbok with a white collar band (dongjeong), nothing on the head. Leave out the photo's background, glasses and modern clothes.",
    "Technique: mineral pigments on aged beige silk, fine brown ink outlines, delicate brushwork on the skin, soft back-colouring;",
    "a plain silk background, a half-length bust facing the viewer, the face large (about 40% of the picture's height).",
    "Do not write any text, letters, characters, seal, signature or watermark. No frame, no border.",
  ].join(" ");
}
