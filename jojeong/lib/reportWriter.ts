import "server-only";
import { createHash } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { chartBrief, pairBrief } from "./brief";
import { coupleBrief } from "./couple";
import { decodePerson, profileOf, RELATIONS, relationOf } from "./pairToken";
import { ADULT_ONLY, FIXED_RELATION, isAdult, isPair, productById, YEONUN_PAST_TOC, type ProductId } from "./products";
import { intimacyBrief } from "./intimacy";
import { reunionBrief } from "./reunion";
import { freeBrief } from "./freeReading";
import { decadeBrief, decadeOf, domainBrief, isDomain } from "./domains";
import { thisYear, yearOf, yearName, yeonunBrief } from "./yeonun";
import { REPORT_SPECS, systemPromptFor, userPrompt } from "./reportPrompts";
import { dayStart, KINDS, parseSearch, pickDays, searchDay, taekilBrief } from "./taekil";
import type { Gender } from "./profile";
import type { Pillars } from "./saju";
import { getProfile } from "./store";
import { courtOfReader, subjectFor } from "./subject";

// Written reports: the engine's chart brief goes to a language model, which writes the reading in 정 훈도's
// voice. Each report is written once per unique input and cached.
//
// The model is picked by REPORT_MODEL: "claude-…" (ANTHROPIC_API_KEY) or "gemini-…" (GEMINI_API_KEY). Unset,
// it follows whichever key is present, Claude first.
export const REPORT_MODEL =
  process.env.REPORT_MODEL ?? (process.env.ANTHROPIC_API_KEY || !process.env.GEMINI_API_KEY ? "claude-opus-5" : "gemini-3.8-flash");
const isGemini = REPORT_MODEL.startsWith("gemini");
const PROMPT_VERSION = "v5";
export const aiEnabled = () =>
  Boolean(isGemini ? process.env.GEMINI_API_KEY : process.env.ANTHROPIC_API_KEY) || process.env.REPORT_MOCK === "1";

export type ReportJob = { key: string; system: string; prompt: string; title: string; modern: boolean };
export type JobRequest = { product: string; court?: string; m?: string; t?: string; a?: string; b?: string; rel?: string; p?: string; kind?: string; from?: string; n?: string; d?: string; y?: string };

export async function jobFor(req: JobRequest): Promise<ReportJob | { error: string; status: number }> {
  const product = productById(req.product);
  const spec = product && REPORT_SPECS[product.id as ProductId];
  // A free report is never written (no spec either): free means no AI cost.
  if (!product || product.free || !spec) return { error: "없는 보고서예요.", status: 404 };

  let subjectLine = "";
  let briefs = "";
  if (product.id === "taekil") {
    // The computed days and the chart(s): the writer explains the choice, it does not choose.
    const found = parseSearch(req.kind, req.from, req.n, false);
    const a = decodePerson(req.a);
    const b = found && KINDS[found.kind].people === 2 ? decodePerson(req.b) : null;
    if (!found || !a || (KINDS[found.kind].people === 2 && !b)) return { error: "날짜 조건을 다시 골라 주세요.", status: 400 };
    const days = pickDays(found.kind, b ? [a, b] : [a], found.from, found.n, dayStart(searchDay(req.d)));
    subjectLine = `[대상] 읽는 사람: ${a.name} ('${a.name}님'이라 부를 것)${b ? ` / 함께하는 사람: ${b.name}` : ""} / 택일: ${KINDS[found.kind].title}`;
    briefs = [
      chartBrief(a.name, a.pillars, profileOf(a)),
      ...(b ? [chartBrief(b.name, b.pillars, profileOf(b)), coupleBrief(a, b)] : []),
      taekilBrief(found.kind, days, found.label),
    ].join("\n\n");
  } else if (isPair(product)) {
    // Two people carried in the link (lib/pairToken.ts), no court needed.
    const a = decodePerson(req.a);
    const b = decodePerson(req.b);
    if (!a || !b) return { error: "두 사람의 사주를 다시 입력해 주세요.", status: 400 };
    if (ADULT_ONLY.includes(product.id) && !(isAdult(a.birthYear) && isAdult(b.birthYear)))
      return { error: "만 19세 이상 두 사람만 볼 수 있는 보고서예요.", status: 403 };
    const rel = FIXED_RELATION[product.id] ?? relationOf(req.rel);
    subjectLine =
      product.id === "jaehoe"
        ? `[대상] 읽는 사람: ${a.name} ('${a.name}님'이라 부를 것) / 헤어진 상대: ${b.name}`
        : `[대상] 읽는 사람: ${a.name} ('${a.name}님'이라 부를 것) / 상대: ${b.name} / 관계: ${RELATIONS[rel]}`;
    briefs = [
      chartBrief(a.name, a.pillars, profileOf(a)),
      chartBrief(b.name, b.pillars, profileOf(b)),
      pairBrief(a.name, a.pillars, b.name, b.pillars),
      coupleBrief(a, b),
      ...(product.id === "sokgunghap" ? [intimacyBrief(a, b)] : []),
      ...(product.id === "jaehoe" ? [reunionBrief(a, b)] : []),
    ].join("\n\n");
  } else if (product.id === "gwangye" || product.id === "dwitjosa" || product.id === "insa") {
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
  } else if (req.p) {
    // The reader's own chart remembered in the browser (lib/me.ts), carried like one person of a 궁합.
    const me = decodePerson(req.p);
    if (!me) return { error: "사주를 다시 입력해 주세요.", status: 400 };
    subjectLine = product.modern ? `[대상] ${me.name} ('${me.name}님'이라 부를 것)` : `[대상] ${me.name} ('그대'라 부를 것)`;
    // 연운: the year chosen is part of what was bought.
    const y = product.id === "yeonun" ? yearOf(req.y, profileOf(me), thisYear()) : null;
    if (product.id === "yeonun" && y === null) return { error: "볼 해를 다시 골라 주세요.", status: 400 };
    if (y !== null) subjectLine += ` / 연운: ${y}년(${yearName(y).ko})`;
    briefs = [
      chartBrief(me.name, me.pillars, profileOf(me)),
      freeBrief(me.pillars, profileOf(me)),
      ...deep(product.id, me.pillars, me.gender),
      ...(y !== null ? [yeonunBrief(me.pillars, profileOf(me), y, thisYear())] : []),
    ].join("\n\n");
  } else {
    if (product.id === "yeonun") return { error: "볼 사람과 해를 다시 골라 주세요.", status: 400 };
    const subject = await subjectFor(product, req.court, req.m);
    if (!subject || !subject.self) return { error: "본인의 사주로만 보실 수 있어요. 먼저 즉위하거나 입궐해 주세요.", status: 403 };
    const profile = await getProfile(subject.courtId, subject.who);
    subjectLine = product.modern
      ? `[대상] ${subject.name} ('${subject.name}님'이라 부를 것)`
      : `[대상] ${subject.name}${subject.king ? " (조정의 왕이므로 '전하'라 부를 것)" : " ('그대'라 부를 것)"}`;
    briefs = [chartBrief(subject.name, subject.pillars, profile), freeBrief(subject.pillars, profile), ...deep(product.id, subject.pillars, profile?.gender ?? null)].join("\n\n");
  }

  const system = systemPromptFor(product);
  // 연운 for a year already gone asks its twelve questions in the past tense.
  const past = product.id === "yeonun" && req.y !== undefined && Number(req.y) < thisYear();
  const prompt = userPrompt(past ? { ...spec, chapters: YEONUN_PAST_TOC } : spec, subjectLine, briefs);
  const key = createHash("sha256").update([PROMPT_VERSION, REPORT_MODEL, product.id, system, prompt].join("\n")).digest("base64url");
  return { key, system, prompt, title: product.title, modern: Boolean(product.modern) };
}

// The deep reports (재물·연애·직업) get their own evidence and ten-year calendar (lib/domains.ts).
function deep(id: string, pillars: Pillars, gender: Gender | null): string[] {
  if (!isDomain(id)) return [];
  return [domainBrief(id, pillars, gender), decadeBrief(id, decadeOf(id, pillars, gender))].filter(Boolean);
}

let client: Anthropic | null = null;
export function anthropic() {
  client ??= new Anthropic();
  return client;
}

// Streams the report text as it is written; resolves with the full text (or null when it did not finish).
export async function writeReport(job: ReportJob, onText: (t: string) => void): Promise<string | null> {
  // Local UI testing without an API key: stream a canned report.
  if (process.env.REPORT_MOCK === "1" && !(isGemini ? process.env.GEMINI_API_KEY : process.env.ANTHROPIC_API_KEY)) {
    const { MOCK_REPORT } = await import("./reportMock");
    for (const piece of MOCK_REPORT.match(/[\s\S]{1,40}/g) ?? []) {
      onText(piece);
      await new Promise((r) => setTimeout(r, Number(process.env.REPORT_MOCK_MS ?? 15)));
    }
    return MOCK_REPORT;
  }
  if (isGemini) return writeWithGemini(job, onText);
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

let gemini: GoogleGenAI | null = null;

async function writeWithGemini(job: ReportJob, onText: (t: string) => void): Promise<string | null> {
  gemini ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const stream = await gemini.models.generateContentStream({
    model: REPORT_MODEL,
    contents: job.prompt,
    config: {
      systemInstruction: job.system,
      maxOutputTokens: 32000,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });
  let text = "";
  let finish: string | undefined;
  for await (const chunk of stream) {
    const t = chunk.text;
    if (t) {
      text += t;
      onText(t);
    }
    finish = chunk.candidates?.[0]?.finishReason ?? finish;
  }
  return finish === "STOP" && text ? text : null;
}
