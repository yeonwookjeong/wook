import "server-only";
import { SUMMARY_STYLE } from "./reportPrompts";
import type { ReportJob } from "./reportWriter";

// The point box (lib/reportPrompts.ts POINT_LINES) for a report written before v9 asked for it: bought in the
// opened shop, so it gets the second pass too (lib/open.ts RENEW2), but its text is kept as it was first read.
// The two lines per chapter are asked once from that text, kept beside it, and put under each headline.

export const hasPoints = (text: string) => /^이유\s*[:：]/m.test(text);

// The chapters of a written report ("## [question] headline"), the 한눈에 card left out.
const chaptersOf = (text: string) => text.split(/^(?=## )/m).filter((c) => c.startsWith("## ") && !c.startsWith("## [한눈에]"));

export function pointsJob(text: string, key: string, modern: boolean): ReportJob {
  const chapters = chaptersOf(text);
  return {
    key: `${key}:pts`,
    title: "요점",
    modern,
    system: `너는 사주 보고서의 편집자다. 이미 쓰인 보고서의 각 장에서, 그 장 본문에 이미 있는 내용만 근거로 요점 두 줄을 뽑는다. 새 주장이나 새 시기를 만들지 않는다. ${modern ? "해요체로" : "사극풍 존대(~하옵니다)로"}, 각 줄 30자 안팎, 사주 용어 없이 쓴다.`,
    prompt: `[요점 보충]
아래 보고서의 장마다, 장 번호 순서대로 이 형식 그대로만 쓴다(다른 말은 쓰지 않는다):
## 장 번호
이유: 왜 그런지 한 문장
할 일: 이 장을 읽고 바로 해 볼 것 한 문장

${chapters.map((c, i) => c.replace(/^## /, `## ${i + 1} `)).join("\n")}`,
  };
}

// The written report with each chapter's two lines put right under its headline.
export function mergePoints(text: string, points: string): string {
  const lines = new Map<number, string>();
  for (const block of points.split(/^## /m).slice(1)) {
    const n = Number(/^\s*(\d+)/.exec(block)?.[1]);
    const why = /^이유\s*[:：]\s*(.+)$/m.exec(block)?.[1];
    const todo = /^할 일\s*[:：]\s*(.+)$/m.exec(block)?.[1];
    if (n && why && todo) lines.set(n, `이유: ${why.trim()}\n할 일: ${todo.trim()}`);
  }
  let i = 0;
  return text.replace(/^## (?!\[한눈에\]).*$/gm, (head) => {
    i += 1;
    const add = lines.get(i);
    return add ? `${head}\n${add}` : head;
  });
}

// The 한눈에 card of a report written before v9 asked for a plain one (riddle headlines, rows ending on a noun,
// "가장 소름 돋는 포인트"): rewritten once from the report itself, kept beside it, and shown in its place. Its
// chapters keep their words.
const CARD = /^## \[한눈에\][\s\S]*$/m;
// Written before v9 (no point box), or by v9 before its card was made plain (still "가장 소름 돋는 포인트").
export const oldCard = (text: string) => CARD.test(text) && (!hasPoints(text) || /^\[가장 소름 돋는 포인트\]/m.test(text));

export function cardJob(text: string, key: string, modern: boolean): ReportJob {
  const card = CARD.exec(text)![0].trim();
  const pair = /두 사람에게만|둘만/.test(card) || /^\[한 줄 판정\]/m.test(card);
  return {
    key: `${key}:card`,
    title: "한눈에",
    modern,
    system: `너는 사주 보고서의 편집자다. 이미 쓰인 보고서 끝의 '한눈에' 카드만 다시 쓴다. 보고서 본문에 이미 있는 내용만 근거로 하고, 새 주장이나 새 시기를 만들지 않는다. ${modern ? "해요체로" : "사극풍 존대(~하옵니다)로"} 쓴다.
${SUMMARY_STYLE}`,
    prompt: `[한눈에 다시]
아래 '지금 카드'와 같은 줄 이름, 같은 순서로 다시 쓴다. [가장 소름 돋는 포인트] 줄이 있으면 ${pair ? "[둘만 가진 한 가지] (이 두 사람에게만 있는 조합 하나와, 그래서 둘 사이에 어떻게 드러나는지)" : "[나만 가진 한 가지] (본문에 나온 이 사람만의 드문 특징 하나를, 본문에 숫자가 있으면 '100명 중 n명'과 함께, 그래서 삶에서 어떻게 드러나는지까지)"}로 바꾼다.
첫 줄은 '## [한눈에] 헤드라인', 그 아래는 '[줄 이름] 한 문장'만 쓴다. 다른 말은 쓰지 않는다.

[지금 카드]
${card}

[보고서 본문]
${text.replace(CARD, "").trim()}`,
  };
}

// The written report with its card swapped for the rewritten one (kept as it was if the rewrite is malformed).
export function mergeCard(text: string, card: string): string {
  const c = card.trim();
  if (!c.startsWith("## [한눈에]") || !/^\[[^\]]+\] .+/m.test(c)) return text;
  return text.replace(CARD, `${c}\n`);
}
