import "server-only";
import { createHash } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { chartBrief, pairBrief } from "./brief";
import { productById, type ProductId } from "./products";
import { REPORT_SPECS, SYSTEM_PROMPT, userPrompt } from "./reportPrompts";
import type { Pillars } from "./saju";
import { getProfile } from "./store";
import { courtOfReader, subjectFor } from "./subject";

// Written reports: the engine's chart brief goes to Claude, which writes the reading in 정 훈도's voice.
// Each report is written once per unique input and cached.

export const REPORT_MODEL = process.env.REPORT_MODEL ?? "claude-opus-5";
const PROMPT_VERSION = "v2";
export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY) || process.env.REPORT_MOCK === "1";

export type ReportJob = { key: string; system: string; prompt: string; title: string };
export type JobRequest = { product: string; court?: string; m?: string; t?: string };

export async function jobFor(req: JobRequest): Promise<ReportJob | { error: string; status: number }> {
  const product = productById(req.product);
  const spec = product && REPORT_SPECS[product.id as ProductId];
  if (!product || !spec) return { error: "없는 보고서이옵니다.", status: 404 };

  let subjectLine = "";
  let briefs = "";
  if (product.id === "gwangye" || product.id === "dwitjosa" || product.id === "insa") {
    if (!req.court) return { error: "조정을 찾을 수 없사옵니다.", status: 400 };
    const room = await courtOfReader(req.court);
    if (!room) return { error: "이 조정의 전하나 신하만 볼 수 있사옵니다.", status: 403 };
    const { court, ministers, isKing, me } = room;
    if (product.id === "gwangye") {
      const people: { name: string; pillars: Pillars }[] = [{ name: `${court.kingName}(왕)`, pillars: court.king }, ...ministers.slice(0, 11).map((m) => ({ name: m.name, pillars: m.pillars }))];
      if (people.length < 3) return { error: "모임 관계도는 신하가 두 명 이상 모이면 열리옵니다.", status: 400 };
      subjectLine = `[대상] ${court.kingName} 전하의 조정, ${people.length}명의 모임`;
      const pairs: string[] = [];
      for (let i = 0; i < people.length; i++)
        for (let j = i + 1; j < people.length; j++) pairs.push(pairBrief(people[i].name, people[i].pillars, people[j].name, people[j].pillars));
      briefs = [...people.map((x) => chartBrief(x.name, x.pillars, null)), ...pairs].join("\n\n");
    } else if (product.id === "dwitjosa") {
      if (!isKing) return { error: "전하만 신하를 뒷조사하실 수 있사옵니다.", status: 403 };
      const target = ministers.find((m) => m.id === req.t);
      if (!target) return { error: "뒷조사할 신하를 골라 주시옵소서.", status: 400 };
      subjectLine = `[대상] 읽는 사람: ${court.kingName} 전하 / 뒷조사 대상: ${target.name}`;
      const kp = await getProfile(court.id, "king");
      briefs = [chartBrief(`${court.kingName}(전하)`, court.king, kp), chartBrief(target.name, target.pillars, null), pairBrief(court.kingName, court.king, target.name, target.pillars)].join("\n\n");
    } else {
      const mine = ministers.find((m) => m.id === me);
      if (!mine) return { error: "입궐한 신하 본인만 볼 수 있사옵니다.", status: 403 };
      subjectLine = `[대상] 읽는 사람: 신하 ${mine.name} / 그 조정의 왕: ${court.kingName}`;
      const mp = await getProfile(court.id, mine.id);
      briefs = [chartBrief(mine.name, mine.pillars, mp), chartBrief(`${court.kingName}(왕)`, court.king, null), pairBrief(court.kingName, court.king, mine.name, mine.pillars)].join("\n\n");
    }
  } else {
    const subject = await subjectFor(product, req.court, req.m);
    if (!subject || !subject.self) return { error: "본인의 사주로만 보실 수 있사옵니다. 먼저 즉위하거나 입궐해 주시옵소서.", status: 403 };
    const profile = await getProfile(subject.courtId, subject.who);
    subjectLine = `[대상] ${subject.name}${subject.king ? " (조정의 왕이므로 '전하'라 부를 것)" : " ('그대'라 부를 것)"}`;
    briefs = chartBrief(subject.name, subject.pillars, profile);
  }

  const prompt = userPrompt(spec, subjectLine, briefs);
  const key = createHash("sha256").update([PROMPT_VERSION, REPORT_MODEL, product.id, SYSTEM_PROMPT, prompt].join("\n")).digest("base64url");
  return { key, system: SYSTEM_PROMPT, prompt, title: product.title };
}

let client: Anthropic | null = null;
export function anthropic() {
  client ??= new Anthropic();
  return client;
}

// Streams the report text as it is written; resolves with the full text (or null when it did not finish).
export async function writeReport(job: ReportJob, onText: (t: string) => void): Promise<string | null> {
  // Local UI testing without an API key: stream a canned report.
  if (process.env.REPORT_MOCK === "1" && !process.env.ANTHROPIC_API_KEY) {
    const { MOCK_REPORT } = await import("./reportMock");
    for (const piece of MOCK_REPORT.match(/[\s\S]{1,40}/g) ?? []) {
      onText(piece);
      await new Promise((r) => setTimeout(r, 15));
    }
    return MOCK_REPORT;
  }
  const stream = anthropic().beta.messages.stream({
    model: REPORT_MODEL,
    max_tokens: 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    system: job.system,
    messages: [{ role: "user", content: job.prompt }],
  });
  let text = "";
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      text += event.delta.text;
      onText(event.delta.text);
    }
  }
  const final = await stream.finalMessage();
  if (final.stop_reason !== "end_turn") return null;
  return text;
}
