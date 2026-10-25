// The way from a chapter of a bought report into 정 훈도에게 묻기 (2026-10-25 대표님 지시), kept in this browser only:
// `FROM_CHAPTER` marks a visit that began at a chapter's button, so its steps (signed up, asked, bought) are counted
// once each (lib/stats.ts askflow_*); `PENDING` holds the room whose question was sent with no questions left, so
// after buying it is sent by itself (app/ask/AskForms.tsx, app/ask/DraftReturn.tsx).
export const FROM_CHAPTER = "jj_ask_from_chapter";
export const PENDING = "jj_ask_pending";
