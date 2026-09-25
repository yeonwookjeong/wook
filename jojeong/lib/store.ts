import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
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
  };
}

function fileBackend(): Backend {
  const file = join(process.cwd(), ".data", "db.json");
  type Db = { kv: Record<string, string>; lists: Record<string, string[]> };
  let queue: Promise<unknown> = Promise.resolve();

  async function load(): Promise<Db> {
    try {
      return JSON.parse(await readFile(file, "utf8")) as Db;
    } catch {
      return { kv: {}, lists: {} };
    }
  }
  function mutate<T>(fn: (db: Db) => T): Promise<T> {
    const next = queue.then(async () => {
      const db = await load();
      const result = fn(db);
      await mkdir(join(process.cwd(), ".data"), { recursive: true });
      await writeFile(file, JSON.stringify(db));
      return result;
    });
    queue = next.catch(() => {});
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
