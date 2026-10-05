// The 관상 result's portrait: the viewer's own face repainted by an image model in one shared style, the same for
// everyone: a Joseon genre painting (풍속화) in the manner of Shin Yun-bok, fine ink lines with soft mineral
// colour washes on warm aged hanji, close on the face. It
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
    "Redraw the person in the attached photo as a figure from a late-Joseon Korean genre painting (pungsokhwa) in the manner of Shin Yun-bok (Hyewon):",
    "fine, even ink outlines drawn with a thin brush, filled with soft, flat washes of muted mineral colour on warm aged hanji paper.",
    KEEP,
    ...(strict
      ? ["A first attempt drifted from their real face. This time trace their features from the photo as faithfully as a tracing, and only restyle the surface."]
      : []),
    "Style only: delicate ink line work for the contours, eyes, brows, nose and lips; skin in a pale warm wash with the faintest blush, shaded only lightly;",
    "hair in soft black ink with fine strands. Colours are few and quiet: indigo blue, cinnabar red, ochre and ink, slightly faded like an old painting,",
    "with the paper's fibres and gentle age stains faintly visible. Calm, bright eyes and a composed expression close to the photo's.",
    "It must read as a painting, not a photo filter, and as this person, not a generic Joseon face. No anime, no cartoon, no doll face, no glossy digital look.",
    "Framing: a close-up of the head and the top of the shoulders, facing the viewer, the face filling about 60% of the picture's height, centred.",
    "Dress them in a hanbok jeogori: a white collar (dongjeong) over indigo or cinnabar cloth, with a coloured coat-string (goreum). Keep their own hairstyle; nothing on the head.",
    "The background is plain warm hanji, left empty, so the face stands out.",
    "Leave out the photo's background, glasses and modern clothes. Do not write any text, letters, characters, seal, signature or watermark. No frame.",
  ].join(" ");
}
