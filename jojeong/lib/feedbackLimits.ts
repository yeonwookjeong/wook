// Shared with the client box (components/FeedbackText.tsx), which cannot import the server-only lib/feedback.ts.
export const FEEDBACK_MAX = 300;
// The openers the box offers to start a line with; they do not count toward the question.
export const OPENERS = ["소름 돋게 맞은 부분", "가장 와닿은 장", "다시 읽고 싶은 문장"];
// Letters that count: no opener, no spaces, and a run of one letter counts once (ㅋㅋㅋㅋ, ....).
export const rewardLength = (text: string) =>
  OPENERS.reduce((t, o) => t.replace(new RegExp(`^\\s*${o}\\s*:?`), ""), text)
    .replace(/\s+/g, "")
    .replace(/(.)\1+/g, "$1").length;
