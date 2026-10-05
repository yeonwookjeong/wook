import { GoogleGenAI } from "@google/genai";
import { portraitPrompt } from "@/lib/portraitPrompt";
import { countPortraitToday } from "@/lib/store";

// POST { photo } → { image } — the viewer's face crop (sent only after they agree) restyled by an image model in
// the 관상 result's shared Joseon style (lib/portraitPrompt.ts, /lab/gwansang). Nothing is stored here: the
// picture passes through.
//
// The model is PORTRAIT_MODEL (a comma list, tried in order; a name the API does not know is skipped).

export const maxDuration = 120;

const MODELS = (process.env.PORTRAIT_MODEL ?? "gemini-3.1-flash-image,gemini-3.1-flash-image-preview")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const DAILY_LIMIT = Number(process.env.PORTRAIT_DAILY_LIMIT ?? 40);
const MAX_B64 = 1_500_000;
let localCount = 0; // a fallback cap when the store is out of reach

type Body = { photo?: string };

const b64 = (dataUrl: string | undefined, mime: string) => {
  const m = dataUrl?.match(/^data:([a-z/+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!m || !m[1].startsWith(mime) || m[2].length > MAX_B64) return null;
  return { mimeType: m[1], data: m[2] };
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const photo = b64(body.photo, "image/jpeg");
  if (!photo)
    return Response.json({ error: "그림 주문서가 비었어요. 다시 찍어 주세요." }, { status: 400 });
  if (!process.env.GEMINI_API_KEY)
    return Response.json({ error: "화원이 아직 출근 전이에요. (이 배포에 GEMINI_API_KEY가 없어요)" }, { status: 503 });

  const count = await countPortraitToday().catch(() => ++localCount);
  if (count > DAILY_LIMIT) return Response.json({ error: "오늘 그릴 수 있는 그림이 다 찼어요. 내일 다시 맡겨 주세요." }, { status: 429 });

  // The photo first, then the instruction: an edit of this picture, not a new one.
  const parts = [{ inlineData: photo }, { text: portraitPrompt() }];

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  let lastError = "";
  for (const model of MODELS) {
    const started = Date.now();
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "3:4" } },
      });
      const img = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
      if (!img?.data)
        return Response.json(
          { error: "화원이 이 그림은 그리지 못하겠다고 하네요. 다시 찍어 보세요.", reason: res.candidates?.[0]?.finishReason ?? null },
          { status: 422 },
        );
      const u = res.usageMetadata;
      return Response.json({
        image: `data:${img.mimeType ?? "image/png"};base64,${img.data}`,
        model,
        ms: Date.now() - started,
        usage: { input: u?.promptTokenCount ?? null, output: u?.candidatesTokenCount ?? null },
      });
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      // An unknown model name moves on to the next one; anything else stops here.
      if (!/not.?found|404|not supported/i.test(lastError)) break;
    }
  }
  console.error("portrait failed", lastError);
  return Response.json({ error: "화원이 붓을 놓쳤어요. 잠시 뒤 다시 맡겨 주세요.", detail: lastError.slice(0, 300) }, { status: 502 });
}
