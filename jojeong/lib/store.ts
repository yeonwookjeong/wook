import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Profile } from "./profile";
import type { Pillars } from "./saju";

export type Court = { id: string; kingName: string; king: Pillars; ownerToken: string; createdAt: number };
export type Minister = {
  id: string;
  name: string;
  pillars: Pillars;
  joinedAt: number;
  // Absent on records created before direct appointment existed; treat as "joined".
  source?: "joined" | "appointed";
};

export const MAX_MINISTERS = 60;

export class CourtFullError extends Error {}

type Backend = {
  get(key: string): Promise<string | null>;
  // `ttl`: seconds after which the key goes away (the file backend, for local work, keeps it).
  set(key: string, value: string, ttl?: number): Promise<void>;
  push(key: string, value: string): Promise<number>;
  list(key: string): Promise<string[]>;
  remove(key: string, value: string): Promise<void>;
  incr(key: string): Promise<number>;
  mget(keys: string[]): Promise<(string | null)[]>;
};

function redisBackend(url: string, token: string): Backend {
  async function call<T>(command: (string | number)[]): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(command),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Redis ${command[0]} failed: ${res.status}`);
    const body = (await res.json()) as { result?: T; error?: string };
    if (body.error) throw new Error(`Redis ${command[0]} failed: ${body.error}`);
    return body.result as T;
  }
  return {
    get: (key) => call<string | null>(["GET", key]),
    set: async (key, value, ttl) => void (await call(ttl ? ["SET", key, value, "EX", ttl] : ["SET", key, value])),
    push: (key, value) => call<number>(["RPUSH", key, value]),
    list: (key) => call<string[]>(["LRANGE", key, 0, -1]),
    remove: async (key, value) => void (await call(["LREM", key, 1, value])),
    incr: (key) => call<number>(["INCR", key]),
    mget: (keys) => (keys.length ? call<(string | null)[]>(["MGET", ...keys]) : Promise.resolve([])),
  };
}

function fileBackend(): Backend {
  const file = join(process.cwd(), ".data", "db.json");
  type Db = { kv: Record<string, string>; lists: Record<string, string[]> };
  // One queue per process (not per module copy): route handlers and server actions are bundled separately in
  // dev, and two copies writing the same file at once would drop each other's changes.
  const g = globalThis as { __dbQueue?: Promise<unknown> };

  async function load(): Promise<Db> {
    try {
      return JSON.parse(await readFile(file, "utf8")) as Db;
    } catch {
      return { kv: {}, lists: {} };
    }
  }
  function mutate<T>(fn: (db: Db) => T): Promise<T> {
    const next = (g.__dbQueue ?? Promise.resolve()).then(async () => {
      const db = await load();
      const result = fn(db);
      await mkdir(join(process.cwd(), ".data"), { recursive: true });
      await writeFile(file, JSON.stringify(db));
      return result;
    });
    g.__dbQueue = next.catch(() => {});
    return next;
  }
  return {
    get: async (key) => (await load()).kv[key] ?? null,
    set: (key, value) => mutate((db) => void (db.kv[key] = value)),
    push: (key, value) => mutate((db) => (db.lists[key] ??= []).push(value)),
    list: async (key) => (await load()).lists[key] ?? [],
    remove: (key, value) =>
      mutate((db) => {
        const list = db.lists[key] ?? [];
        const i = list.indexOf(value);
        if (i >= 0) list.splice(i, 1);
      }),
    incr: (key) =>
      mutate((db) => {
        const next = Number(db.kv[key] ?? 0) + 1;
        db.kv[key] = String(next);
        return next;
      }),
    mget: async (keys) => {
      const db = await load();
      return keys.map((k) => db.kv[k] ?? null);
    },
  };
}

function backend(): Backend {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) return redisBackend(url, token);
  if (process.env.VERCEL) throw new Error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 환경변수가 필요합니다.");
  return fileBackend();
}

const id = (bytes: number) => randomBytes(bytes).toString("base64url");

// Short links for "친구에게 보내기": the long signed address (lib/shareToken.ts) kept under an eight-character id, made
// when the reader taps send, for a little over a year. The id comes from the address itself, so sending the same
// result again gives the same link and stores nothing new.
const SHARE_DAYS = 400;
export async function putShare(path: string): Promise<string> {
  const code = createHash("sha256").update(path).digest("base64url").slice(0, 8);
  await backend().set(`share:${code}`, path, SHARE_DAYS * 86400);
  return code;
}
export async function getShare(code: string): Promise<string | null> {
  if (!/^[\w-]{8}$/.test(code)) return null;
  return backend().get(`share:${code}`);
}

export async function createCourt(kingName: string, king: Pillars): Promise<Court> {
  const court: Court = { id: id(6), kingName, king, ownerToken: id(18), createdAt: Date.now() };
  await backend().set(`court:${court.id}`, JSON.stringify(court));
  // Real count of enthronements, shown on the landing page as social proof. A failed count never blocks a court.
  await backend()
    .incr("stats:courts")
    .catch(() => {});
  return court;
}

export async function getCourt(courtId: string): Promise<Court | null> {
  if (!/^[\w-]{8}$/.test(courtId)) return null;
  const raw = await backend().get(`court:${courtId}`);
  return raw ? (JSON.parse(raw) as Court) : null;
}

export async function listMinisters(courtId: string): Promise<Minister[]> {
  return (await backend().list(`court:${courtId}:m`)).map((raw) => JSON.parse(raw) as Minister);
}

export async function addMinister(
  courtId: string,
  name: string,
  pillars: Pillars,
  source: "joined" | "appointed",
): Promise<Minister> {
  const db = backend();
  const existing = await db.list(`court:${courtId}:m`);
  if (existing.length >= MAX_MINISTERS) throw new CourtFullError();
  const minister: Minister = { id: id(6), name, pillars, joinedAt: Date.now(), source };
  await db.push(`court:${courtId}:m`, JSON.stringify(minister));
  return minister;
}

export async function removeMinister(courtId: string, ministerId: string) {
  const db = backend();
  const raw = (await db.list(`court:${courtId}:m`)).find((r) => (JSON.parse(r) as Minister).id === ministerId);
  if (raw) await db.remove(`court:${courtId}:m`, raw);
}

// Extra reading data for a king ("king") or a minister (their id): 대운 and the palace chart, derived from the
// birth date at entry. Kept apart from the court so it can be added later without rewriting the minister list.
export async function getProfile(courtId: string, who: string): Promise<Profile | null> {
  const raw = await backend().get(`profile:${courtId}:${who}`);
  return raw ? (JSON.parse(raw) as Profile) : null;
}

export async function setProfile(courtId: string, who: string, profile: Profile) {
  await backend().set(`profile:${courtId}:${who}`, JSON.stringify(profile));
}

// Real count of free readings (a chart entered for the first time in a browser, or changed), kept from launch
// so the number exists by the time it is worth showing. Nothing about the person is stored.
export async function noteReading(): Promise<void> {
  const { track } = await import("./stats");
  await Promise.all([
    backend()
      .incr("stats:readings")
      .catch(() => {}),
    track("reading"),
  ]);
}

// Every chart read so far: free readings and enthronements (/king). Counts readings, not distinct people.
export async function readingCount(): Promise<number> {
  try {
    const [r, c] = await Promise.all([backend().get("stats:readings"), backend().get("stats:courts")]);
    return Number(r ?? 0) + Number(c ?? 0);
  } catch {
    return 0;
  }
}

// The free readings up to the opening night (10/13), for the opening note: the total less what the dashboard
// counted from the next day on (lib/stats.ts "reading" and "king" by day), worked out once and then kept, so the
// thanks no longer grows with every visitor.
const COUNTED_AFTER_OPEN = "2026-10-14";
export async function openReadingCount(): Promise<number> {
  try {
    const kept = await backend().get("stats:readings-at-open");
    if (kept) return Number(kept);
    const total = await readingCount();
    if (!total) return 0;
    const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
    const days: string[] = [];
    for (let t = Date.parse(COUNTED_AFTER_OPEN); new Date(t).toISOString().slice(0, 10) <= today; t += 86400000) days.push(new Date(t).toISOString().slice(0, 10));
    const since = await readCounters(days.flatMap((d) => [`st:reading:d:${d}`, `st:king:d:${d}`]));
    const n = Math.max(0, total - since.reduce((a, b) => a + b, 0));
    await backend().set("stats:readings-at-open", String(n));
    return n;
  } catch {
    return 0;
  }
}

export async function courtCount(): Promise<number> {
  try {
    return Number((await backend().get("stats:courts")) ?? 0);
  } catch {
    return 0;
  }
}

// Written reports, keyed by a hash of everything that went into them.
export async function getReportText(key: string): Promise<string | null> {
  return backend().get(`report:${key}`);
}
export async function setReportText(key: string, text: string) {
  await backend().set(`report:${key}`, text);
}
// A report being written: when its writing began, so a second visit (a refresh, the tab reopened) waits for that
// one instead of paying for another. "0" once the writing failed, so the next visit starts over.
export async function getReportWriting(key: string): Promise<number> {
  return Number((await backend().get(`writing:${key}`)) ?? 0);
}
export async function setReportWriting(key: string, at: number) {
  await backend().set(`writing:${key}`, String(at));
}
// The last time a report could not be written, and why (the model's own error), for the owner's page.
export async function noteReportError(message: string) {
  await backend().set("report:lastError", JSON.stringify({ at: Date.now(), message: message.slice(0, 500) }));
}
// Only one from the last two days.
export async function lastReportError(): Promise<{ at: number; message: string } | null> {
  const raw = await backend().get("report:lastError").catch(() => null);
  const e = raw ? (JSON.parse(raw) as { at: number; message: string }) : null;
  return e && Date.now() - e.at < 2 * 86400000 ? e : null;
}
// A per-day counter of freshly written reports (a spending guard).
export async function countReportToday(): Promise<number> {
  return backend().incr(`stats:reports:${new Date().toISOString().slice(0, 10)}`);
}

// Report orders (lib/pay.ts), kept for good: the order id is the buyer's permanent link to the report.
export async function getOrderRaw(orderId: string): Promise<string | null> {
  if (!/^[\w-]{6,64}$/.test(orderId)) return null;
  return backend().get(`order:${orderId}`);
}
export async function setOrderRaw(orderId: string, raw: string) {
  await backend().set(`order:${orderId}`, raw);
}
// Paid order ids, newest last, for the owner's dashboard.
export async function notePaidOrder(orderId: string) {
  await backend()
    .push("orders:paid", orderId)
    .catch(() => {});
}
// Reports the owner gave away from /admin: their own list, apart from the paid ones, so they never count as sales.
export async function noteGiftOrder(orderId: string) {
  await backend().push("orders:gift", orderId);
}
export async function giftOrderIds(): Promise<string[]> {
  return backend().list("orders:gift");
}
// Many orders in one round trip (the owner's sales table).
export async function getOrdersRaw(ids: string[]): Promise<(string | null)[]> {
  return ids.length ? backend().mget(ids.map((id) => `order:${id}`)) : [];
}
export async function paidOrderIds(): Promise<string[]> {
  return backend().list("orders:paid");
}

// Orders paid in the Apps in Toss mini app (lib/tossApps.ts): which site order each Toss order became, so granting
// the same Toss order again (a retry, a restore) gives back the same report; a short claim so two grants of one
// order at once make one site order; and each Toss account's orders (by its anonymous key) for "내 보고서".
export async function getTossGrant(tossOrderId: string): Promise<string | null> {
  return backend().get(`toss:grant:${tossOrderId}`);
}
export async function setTossGrant(tossOrderId: string, orderId: string) {
  await backend().set(`toss:grant:${tossOrderId}`, orderId);
}
export async function claimTossGrant(tossOrderId: string): Promise<boolean> {
  const b = backend();
  const n = await b.incr(`toss:claim:${tossOrderId}`);
  if (n === 1) await b.set(`toss:claim:${tossOrderId}`, "1", 60).catch(() => {});
  return n === 1;
}
export async function releaseTossGrant(tossOrderId: string) {
  await backend()
    .set(`toss:claim:${tossOrderId}`, "0", 1)
    .catch(() => {});
}
export async function noteTossOrder(userKey: string, orderId: string) {
  await backend().push(`toss:user:${userKey}`, orderId);
}
export async function tossOrderIds(userKey: string): Promise<string[]> {
  return backend().list(`toss:user:${userKey}`);
}

// Questions sent from the contact page, kept for the owner's inbox (/admin): what it is about, what was
// written, and an optional email to answer to. Newest last in the list.
export type Inquiry = { id: string; topic: string; body: string; email: string; at: number; done: boolean };
const INQUIRY_DAILY_CAP = 300;

export async function addInquiry(topic: string, body: string, email: string): Promise<"ok" | "busy"> {
  const day = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  // A plain cap on how many a day are kept, so a flood of junk cannot fill the store.
  if ((await backend().incr(`inquiries:day:${day}`)) > INQUIRY_DAILY_CAP) return "busy";
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const inquiry: Inquiry = { id, topic, body, email, at: Date.now(), done: false };
  await backend().set(`inquiry:${id}`, JSON.stringify(inquiry));
  await backend().push("inquiries", id);
  return "ok";
}

export async function listInquiries(limit = 100): Promise<Inquiry[]> {
  const ids = (await backend().list("inquiries")).slice(-limit).reverse();
  const raws = await Promise.all(ids.map((id) => backend().get(`inquiry:${id}`)));
  return raws.flatMap((r) => {
    if (!r) return [];
    try {
      return [JSON.parse(r) as Inquiry];
    } catch {
      return [];
    }
  });
}

export async function setInquiryDone(id: string, done: boolean) {
  const raw = await backend().get(`inquiry:${id}`);
  if (!raw) return;
  await backend().set(`inquiry:${id}`, JSON.stringify({ ...(JSON.parse(raw) as Inquiry), done }));
}

// Deleted on request (or when no longer needed): the entry and its place in the list.
export async function deleteInquiry(id: string) {
  await backend().set(`inquiry:${id}`, "");
  await backend().remove("inquiries", id);
}

// Plain counters for the owner's dashboard (lib/stats.ts): bumped in parallel, read many at once.
export async function bumpCounters(keys: string[]) {
  const b = backend();
  await Promise.all(keys.map((k) => b.incr(k))).catch(() => {});
}
export async function readCounters(keys: string[]): Promise<number[]> {
  try {
    return (await backend().mget(keys)).map((v) => Number(v ?? 0));
  } catch {
    return keys.map(() => 0);
  }
}

// ── 정 훈도에게 묻기 (lib/ask.ts): one room per chart, kept whole under its id, and the list of rooms for the
// owner's page. The id is long and random: the link to the room is its key.
export async function getAskRoomRaw(roomId: string): Promise<string | null> {
  if (!/^[\w-]{16,64}$/.test(roomId)) return null;
  return backend().get(`ask:room:${roomId}`);
}
export async function setAskRoomRaw(roomId: string, raw: string) {
  await backend().set(`ask:room:${roomId}`, raw);
}
export async function newAskRoomId(): Promise<string> {
  const roomId = id(18);
  await backend().push("ask:rooms", roomId);
  return roomId;
}
export async function askRoomIds(): Promise<string[]> {
  return backend().list("ask:rooms");
}
export async function deleteAskRoom(roomId: string) {
  await backend().set(`ask:room:${roomId}`, "");
  await backend().remove("ask:rooms", roomId);
}

// Threads numbers (lib/threads.ts): the access token, the list of post ids and one record per post, as JSON.
export async function getThreadsRaw(key: string): Promise<string | null> {
  return backend().get(`th:${key}`);
}
export async function getThreadsRawMany(keys: string[]): Promise<(string | null)[]> {
  return backend().mget(keys.map((k) => `th:${k}`));
}
// `ttl`: seconds to keep it (the replies under a post); without it, kept for good.
export async function setThreadsRaw(key: string, raw: string, ttl?: number) {
  await backend().set(`th:${key}`, raw, ttl);
}

// Members (lib/members.ts): one record each, by their account id ("k"/"n"/"g" + the Kakao, Naver or Google id).
// `members` lists them for the owner.
const MEMBER_ID = /^(k\d{1,20}|[ng][\w-]{1,64})$/;
export async function getMemberRaw(id: string): Promise<string | null> {
  if (!MEMBER_ID.test(id)) return null;
  return backend().get(`member:${id}`);
}
// Many at once, 500 keys a round trip (the owner's lists and CSVs), in the order asked.
export async function getMembersRaw(ids: string[]): Promise<(string | null)[]> {
  const ok = ids.filter((id) => MEMBER_ID.test(id));
  const out: (string | null)[] = [];
  for (let i = 0; i < ok.length; i += 500) out.push(...(await backend().mget(ok.slice(i, i + 500).map((id) => `member:${id}`))));
  return out;
}
export async function setMemberRaw(id: string, raw: string) {
  await backend().set(`member:${id}`, raw);
}
export async function noteMember(id: string) {
  await backend().push("members", id);
}
export async function memberIds(): Promise<string[]> {
  return backend().list("members");
}
// Who has had the joining gift, by a keyed hash of the Kakao id (lib/members.ts), kept a year past leaving.
export async function giftGiven(hash: string): Promise<boolean> {
  return Boolean(await backend().get(`gifted:${hash}`));
}
export async function noteGiftGiven(hash: string) {
  await backend().set(`gifted:${hash}`, "1", 60 * 60 * 24 * 366);
}
// Joining gifts given today (KST), counting this one: the daily cap in lib/members.ts.
export async function countGiftToday(): Promise<number> {
  const day = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  return backend().incr(`gifts:${day}`);
}
// Leaving (lib/members.ts deleteMember): the record emptied and the id off the owner's list.
export async function deleteMemberRaw(id: string) {
  if (!MEMBER_ID.test(id)) return;
  await backend().set(`member:${id}`, "");
  await backend().remove("members", id);
}

// What a signed-in member looked at: one counter per report page (lib/sales.ts key), for the owner's member card.
// Counters of their own, so a view never rewrites the member record (and its questions) at the same time.
const viewKey = (id: string, key: string) => `mv:${id}:${key}`;
export async function noteMemberView(id: string, key: string) {
  if (MEMBER_ID.test(id)) await backend().incr(viewKey(id, key)).catch(() => {});
}
export async function memberViews(id: string, keys: string[]): Promise<number[]> {
  return readCounters(keys.map((k) => viewKey(id, k)));
}
export async function clearMemberViews(id: string, keys: string[]) {
  if (MEMBER_ID.test(id)) await Promise.all(keys.map((k) => backend().set(viewKey(id, k), ""))).catch(() => {});
}

// How a bought report was liked (components/ReportFeedback.tsx): one record per order and report, newest last
// in `feedbacks`. A second answer replaces the first.
export async function getFeedbackRaw(key: string): Promise<string | null> {
  return backend().get(`fb:${key}`);
}
export async function setFeedbackRaw(key: string, raw: string, isNew: boolean) {
  await backend().set(`fb:${key}`, raw);
  if (isNew) await backend().push("feedbacks", key);
}
export async function feedbackKeys(): Promise<string[]> {
  return backend().list("feedbacks");
}
export async function getFeedbacksRaw(keys: string[]): Promise<(string | null)[]> {
  return keys.length ? backend().mget(keys.map((k) => `fb:${k}`)) : [];
}

// 질문권 events (lib/creditEvents.ts): one record each by its code, `cevents` lists them for the owner, and a
// counter of how many have taken it.
export async function getCreditEventRaw(code: string): Promise<string | null> {
  return /^[A-Z0-9]{4,12}$/.test(code) ? backend().get(`cevent:${code}`) : null;
}
export async function setCreditEventRaw(code: string, raw: string) {
  await backend().set(`cevent:${code}`, raw);
}
export async function noteCreditEvent(code: string) {
  await backend().push("cevents", code);
}
export async function creditEventCodes(): Promise<string[]> {
  return backend().list("cevents");
}
export async function countCreditEventClaim(code: string): Promise<number> {
  return backend().incr(`cevent-n:${code}`);
}
export async function creditEventClaims(codes: string[]): Promise<number[]> {
  if (!codes.length) return [];
  return (await backend().mget(codes.map((c) => `cevent-n:${c}`))).map((v) => Number(v ?? 0));
}
