import "server-only";
import { randomBytes } from "node:crypto";
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
  set(key: string, value: string): Promise<void>;
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
    set: async (key, value) => void (await call(["SET", key, value])),
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
