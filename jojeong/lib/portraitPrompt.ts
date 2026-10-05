// The 관상 result's portrait: the viewer's own face restyled by an image model in one shared style, the same for
// everyone: a warm, semi-realistic Korean colour painting, close on the face. Real enough to be unmistakably them,
// painted enough to feel like art, and flattering the way a good portrait painter is. Told to restyle this
// photo, the model keeps the person; told to paint a portrait, it invents one.

const KEEP =
  "This is the same person, not a new one: keep their bone structure, face shape, eye shape and spacing, eyelids, eyebrows, nose, lips, " +
  "hairstyle, skin tone and apparent age. Someone who knows them must recognise them instantly.";

export function portraitPrompt(): string {
  return [
    "Repaint the person in the attached photo as a beautiful semi-realistic portrait painting in a refined Korean traditional colour style.",
    KEEP,
    "The feel: realistic likeness, but clearly a painting, with visible soft brush texture, gentle mineral-pigment colours and a fine ink line on the contours;",
    "warm, glowing light from the front-left, a healthy natural flush, luminous eyes with catchlights, softly defined lips.",
    "Make it the most flattering, feel-good version of them, as on their very best day: clear radiant skin, a warm, calm, quietly confident look, neat glossy hair.",
    "Never change their features into someone else's; no anime, no doll-like face, no enlarged eyes, no slimmed jaw, no plastic skin.",
    "Framing: a close-up of the head and the top of the shoulders, facing the viewer, the face filling about 60% of the picture's height, centred.",
    "They wear a plain white hanbok collar (dongjeong), nothing on the head. A soft plain background of warm aged silk, slightly lighter around the head.",
    "Leave out the photo's background, glasses and modern clothes. Do not write any text, letters, characters, seal, signature or watermark. No frame.",
  ].join(" ");
}
