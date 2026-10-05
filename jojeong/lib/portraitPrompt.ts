// The 관상 result's portrait: the viewer's own face repainted by an image model in one shared style, the same for
// everyone: black ink brushwork on white hanji, like the face plates of an old 관상 book, close on the face. It
// may look painted, never like someone else:
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
    "Redraw the person in the attached photo as a Korean ink-brush portrait: black ink on white hanji paper, like the illustrated face plates of an old Korean physiognomy (gwansang) book.",
    KEEP,
    ...(strict
      ? ["A first attempt drifted from their real face. This time trace their features from the photo as faithfully as a tracing, and only restyle the surface."]
      : []),
    "Style only: black ink alone, no colour at all; confident brush lines of varying thickness for the contours, eyes, brows, nose and lips,",
    "light grey ink washes for soft shading, hair in rich black ink with a few dry-brush strokes, the paper's fibres faintly visible.",
    "Keep it clean and dignified: calm, bright eyes and a composed expression close to the photo's. No anime, no cartoon, no doll face.",
    "Framing: a close-up of the head and the top of the shoulders, facing the viewer, the face filling about 60% of the picture's height, centred.",
    "A white hanbok collar (dongjeong) drawn in a few ink lines, nothing on the head. The background is plain white hanji, left empty.",
    "Leave out the photo's background, glasses and modern clothes. Do not write any text, letters, characters, seal, signature or watermark. No frame.",
  ].join(" ");
}
