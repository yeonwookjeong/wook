// The way from a chapter of a bought report into 정 훈도에게 묻기 (2026-10-25 대표님 지시), kept in this browser only:
// `FROM_CHAPTER` marks a visit that began at a chapter's button (for a day), with the steps already counted, so each
// step (newly joined, asked, bought) is counted once (lib/stats.ts askflow_*); `PENDING` holds the room whose question
// was sent with no questions left, so a purchase within half an hour sends it by itself (app/ask/AskForms.tsx,
// app/ask/DraftReturn.tsx).
export const FROM_CHAPTER = "jj_ask_from_chapter";
export const PENDING = "jj_ask_pending";
// The report's chart carried through signing in (app/ask/go/route.ts): a short-lived cookie, since the way back
// after signing in keeps only 200 characters. Name and eight characters only, never a birth date.
export const CARRY_CHART = "jj_ask_c";

type Step = "joined" | "sent" | "bought";
type Flow = { at: number } & Partial<Record<Step, true>>;
const DAY = 86400000;
const HALF_HOUR = 30 * 60000;

export function startFlow() {
  try {
    localStorage.setItem(FROM_CHAPTER, JSON.stringify({ at: Date.now() } satisfies Flow));
  } catch {}
}
// True once per step of a flow begun within a day; marks it counted.
export function stepOnce(step: Step): boolean {
  try {
    const f = JSON.parse(localStorage.getItem(FROM_CHAPTER) ?? "null") as Flow | null;
    if (!f || typeof f.at !== "number" || Date.now() - f.at > DAY || f[step]) return false;
    localStorage.setItem(FROM_CHAPTER, JSON.stringify({ ...f, [step]: true }));
    return true;
  } catch {
    return false;
  }
}

export function setPending(room: string) {
  try {
    localStorage.setItem(PENDING, JSON.stringify({ room, at: Date.now() }));
  } catch {}
}
// The room waiting to send, if 묻기 was pressed there within half an hour.
export function pendingRoom(): string | null {
  try {
    const p = JSON.parse(localStorage.getItem(PENDING) ?? "null") as { room?: string; at?: number } | null;
    return p?.room && typeof p.at === "number" && Date.now() - p.at < HALF_HOUR ? p.room : null;
  } catch {
    return null;
  }
}
export function clearPending() {
  try {
    localStorage.removeItem(PENDING);
  } catch {}
}
