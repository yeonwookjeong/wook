// The 관상 result's portrait: the viewer's own face repainted by an image model in one shared style, the same for
// everyone: a warm Korean colour painting, close on the face. It may look painted, never like someone else:
// the face's geometry is held fixed and only the surface is restyled (the page also measures the painting and
// asks once more with `strict` when it drifted).

// Identity comes first, in the model's own terms: the geometry of the face is fixed, only the rendering changes.
const KEEP = [
  "IDENTITY IS THE TOP PRIORITY. This is a style change of this exact photo, not a new portrait.",
  "Keep the face geometry exactly as in the photo: the outline of the face and jaw, the width of the face, the distance between the eyes,",
  "the shape and size of each eye and eyelid, the eyebrows, the length and width of the nose and nostrils, the width and thickness of the lips,",
  "the length of the philtrum, the hairline and hairstyle, skin tone and apparent age. Do not beautify, slim, enlarge, straighten or reshape any feature.",
  "Someone who knows them must recognise them instantly; if in doubt, stay closer to the photo.",
].join(" ");

export function portraitPrompt(strict = false): string {
  return [
    "Repaint the person in the attached photo in a refined Korean traditional colour-painting style.",
    KEEP,
    ...(strict
      ? ["A first attempt drifted from their real face. This time trace their features from the photo as faithfully as a tracing, and only restyle the surface."]
      : []),
    "Style only: visible soft brush texture, gentle mineral-pigment colours, a fine ink line on the contours, warm glowing light, luminous eyes with catchlights.",
    "The only flattery allowed is on the surface: an even, healthy skin tone and soft flattering light. No anime, no doll face, no plastic skin.",
    "Framing: a close-up of the head and the top of the shoulders, facing the viewer, the face filling about 60% of the picture's height, centred.",
    "They wear a plain white hanbok collar (dongjeong), nothing on the head. A soft plain background of warm aged silk.",
    "Leave out the photo's background, glasses and modern clothes. Do not write any text, letters, characters, seal, signature or watermark. No frame.",
  ].join(" ");
}
