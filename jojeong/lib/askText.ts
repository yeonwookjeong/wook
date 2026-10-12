// 정 훈도's answers carry one key sentence wrapped in ==…== and a mark heading each paragraph ([[直答]] …), both
// asked for in lib/ask.ts. The letter underlines the one and sets the other as a small heading; the prompt's
// recent talk reads the plain text.

export type Segment = { text: string; key: boolean };

// The five paragraph marks. He writes a short Korean heading of his own beside each ([[時運|11월, 풀리는 달]]);
// these stand in when he leaves it out.
export const PART_LABELS: Record<string, string> = { 直答: "결론부터", 時勢: "왜 지금인가", 性情: "그대라는 사람", 時運: "다가올 때", 一事: "오늘 한 가지" };
const PART = /^\s*\[\[(直答|時勢|性情|時運|一事)(?:\|([^\]\n]{1,24}))?\]\]\s*/;

export const plainAnswer = (text: string) =>
  text
    .replace(/==([^=\n]+)==/g, "$1")
    .replace(/==/g, "")
    .replace(/\[\[(直答|時勢|性情|時運|一事)(?:\|[^\]\n]*)?\]\]\s*/g, "");

// A paragraph split into plain and key runs; a stray marker left open is dropped, not shown.
export function segments(paragraph: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of paragraph.matchAll(/==([^=\n]+)==/g)) {
    if (m.index > last) out.push({ text: paragraph.slice(last, m.index), key: false });
    out.push({ text: m[1], key: true });
    last = m.index + m[0].length;
  }
  if (last < paragraph.length) out.push({ text: paragraph.slice(last), key: false });
  return out.map((s) => ({ ...s, text: s.text.replace(/==/g, "") })).filter((s) => s.text);
}

export type Paragraph = { part?: string; head?: string; text: string };

// Paragraphs, each with its mark when it has one. A mark alone on its line heads the paragraph after it.
export function paragraphs(text: string): Paragraph[] {
  const out: Paragraph[] = [];
  let pending: { part: string; head?: string } | undefined;
  for (const line of text.split("\n")) {
    const m = line.match(PART);
    const mark = m ? { part: m[1], head: m[2]?.trim() || undefined } : pending;
    const body = (m ? line.slice(m[0].length) : line).trim();
    if (!body) {
      if (m) pending = mark;
      continue;
    }
    out.push({ ...mark, text: body });
    pending = undefined;
  }
  return out;
}

const NUM = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const hanjaNum = (n: number) => (n >= 20 ? NUM[Math.floor(n / 10)] : "") + (n >= 10 ? "十" : "") + NUM[n % 10];
const STEM = "甲乙丙丁戊己庚辛壬癸";
const BRANCH = "子丑寅卯辰巳午未申酉戌亥";

// "丙午年 十月 十二日" for a moment, in Korea's day. The year turns at 입춘 (about 2월 4일), as a chart's does.
export function hanjaDate(t: number) {
  const d = new Date(t + 9 * 3600000);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const sy = m < 2 || (m === 2 && day < 4) ? y - 1 : y;
  return `${STEM[(((sy - 4) % 10) + 10) % 10]}${BRANCH[(((sy - 4) % 12) + 12) % 12]}年 ${hanjaNum(m)}月 ${hanjaNum(day)}日`;
}
