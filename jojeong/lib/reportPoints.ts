import "server-only";
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
