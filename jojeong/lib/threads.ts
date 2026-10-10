import "server-only";
import { getThreadsRaw, getThreadsRawMany, setThreadsRaw } from "./store";

// How the Threads posts did, fetched from the Threads API once a day (app/api/cron/threads) so nobody has to
// copy numbers by hand. Each post keeps its latest numbers and, once, the numbers about a day after it went up
// (the first fetch at 24 hours or later), so posts can be compared fairly. Everything here is what Threads already
// shows in public under each post.
//
// The token: THREADS_TOKEN (Vercel) is the user token made in the Meta app; with THREADS_APP_SECRET it is first
// traded for a 60-day one. The token in use is kept in the store and refreshed every few weeks, so it never lapses.

const API = "https://graph.threads.net";
const METRICS = ["views", "likes", "replies", "reposts", "quotes", "shares"] as const;
export type Numbers = Record<(typeof METRICS)[number], number> & { at: number; hours: number };
export type ThreadsPost = { id: string; text: string; ts: number; link: string; latest: Numbers | null; day: Numbers | null };

// `long`: traded for (or refreshed into) a 60-day token. A token whose trade failed is kept for an hour at most,
// since a short one dies within the hour and would otherwise be reused, dead, for weeks.
type Token = { token: string; at: number; from: string; long?: boolean };
const SHORT_FOR = 3600000;

// A Threads API error, with Meta's code kept (190: the token expired or was revoked).
class ThreadsError extends Error {
  constructor(
    message: string,
    readonly code?: number,
  ) {
    super(message);
  }
}
const REFRESH_AFTER = 20 * 86400000;

async function call<T>(path: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(`${API}${path}?${new URLSearchParams(params)}`, { cache: "no-store" });
  const body = (await res.json().catch(() => ({}))) as T & {
    error?: { message?: string; type?: string; code?: number; error_subcode?: number; fbtrace_id?: string };
  };
  if (!res.ok || body.error) {
    // The code, subcode and trace id are what tell one Meta block from another (an expired token, a test-user
    // invite, a restricted app), so they go into the message the admin page shows.
    const e = body.error;
    const detail = e ? [e.type, e.code && `code ${e.code}`, e.error_subcode && `sub ${e.error_subcode}`, e.fbtrace_id && `trace ${e.fbtrace_id}`].filter(Boolean).join(", ") : "";
    throw new ThreadsError(`Threads ${path}: ${e?.message ?? "HTTP"} (HTTP ${res.status}${detail ? `, ${detail}` : ""})`, e?.code);
  }
  return body;
}

// The token to use: the stored one (refreshed when it is three weeks old), or the one in Vercel when that changed.
async function token(fresh = false): Promise<string> {
  const env = process.env.THREADS_TOKEN ?? "";
  const saved = fresh ? null : (JSON.parse((await getThreadsRaw("token")) ?? "null") as Token | null);
  // Tokens stored before `long` was recorded were all kept as long ones.
  if (saved && saved.from === env.slice(-12) && (saved.long !== false || Date.now() - saved.at < SHORT_FOR)) {
    if (saved.long === false || Date.now() - saved.at < REFRESH_AFTER) return saved.token;
    const r = await call<{ access_token: string }>("/refresh_access_token", { grant_type: "th_refresh_token", access_token: saved.token });
    await setThreadsRaw("token", JSON.stringify({ token: r.access_token, at: Date.now(), from: saved.from, long: true }));
    return r.access_token;
  }
  if (!env) throw new Error("THREADS_TOKEN 환경변수가 없어요.");
  // A short token is traded for a 60-day one. A token that is already long cannot be traded (the call fails) and
  // is refreshed instead; failing both, the token is used as it is, for the hour a short one lasts.
  const secret = process.env.THREADS_APP_SECRET;
  const traded = secret
    ? await call<{ access_token: string }>("/access_token", { grant_type: "th_exchange_token", client_secret: secret, access_token: env })
        .then((r) => r.access_token)
        .catch(() => null)
    : null;
  const refreshed =
    traded ??
    (await call<{ access_token: string }>("/refresh_access_token", { grant_type: "th_refresh_token", access_token: env })
      .then((r) => r.access_token)
      .catch(() => null));
  const use = refreshed ?? env;
  await setThreadsRaw("token", JSON.stringify({ token: use, at: Date.now(), from: env.slice(-12), long: Boolean(refreshed) }));
  return use;
}

// A metric comes as values[0].value (lifetime) or total_value.value.
type Insight = { name: string; values?: { value: number }[]; total_value?: { value: number } };
async function numbersOf(id: string, ts: number, access: string): Promise<Numbers> {
  const r = await call<{ data: Insight[] }>(`/v1.0/${id}/insights`, { metric: METRICS.join(","), access_token: access });
  const out = { at: Date.now(), hours: Math.round((Date.now() - ts) / 3600000) } as Numbers;
  for (const m of METRICS) {
    const x = r.data.find((d) => d.name === m);
    out[m] = x?.total_value?.value ?? x?.values?.[0]?.value ?? 0;
  }
  return out;
}

// Fetch the latest posts (the first post of each chain; its replies are the chain's other parts) and their numbers.
// `failed`: posts whose numbers could not be read this time, with the first reason (a missing insights permission
// shows up only here, since the list itself still comes).
export async function syncThreads(): Promise<{ posts: number; fresh: number; failed: number; reason: string | null }> {
  type List = { data: { id: string; text?: string; timestamp: string; permalink?: string }[] };
  const listWith = (access: string) => call<List>("/v1.0/me/threads", { fields: "id,text,timestamp,permalink", limit: "40", access_token: access });
  let access = await token();
  let list: List;
  try {
    list = await listWith(access);
  } catch (e) {
    // The stored token died (expired or revoked): start again from the one in Vercel.
    if (!(e instanceof ThreadsError && e.code === 190)) throw e;
    access = await token(true);
    list = await listWith(access);
  }
  const ids = JSON.parse((await getThreadsRaw("ids")) ?? "[]") as string[];
  const known = new Map((await postsOf(ids)).map((p) => [p.id, p]));
  let fresh = 0;
  // Older than two weeks: the numbers have settled, so they stay as they were last fetched.
  const due = list.data.filter((item) => !(Date.now() - Date.parse(item.timestamp) > 14 * 86400000 && known.has(item.id)));
  let reason: string | null = null;
  const fetched = await Promise.all(
    due.map((item) =>
      numbersOf(item.id, Date.parse(item.timestamp), access).catch((e: Error) => {
        reason ??= e.message;
        return null;
      }),
    ),
  );
  for (const [i, item] of due.entries()) {
    const latest = fetched[i];
    const before = known.get(item.id);
    const post: ThreadsPost = {
      id: item.id,
      text: (item.text ?? "").slice(0, 300),
      ts: Date.parse(item.timestamp),
      link: item.permalink ?? "",
      latest: latest ?? before?.latest ?? null,
      day: before?.day ?? (latest && latest.hours >= 24 ? latest : null),
    };
    if (!before) fresh++;
    known.set(item.id, post);
    await setThreadsRaw(`post:${item.id}`, JSON.stringify(post));
  }
  const all = [...known.keys()];
  await setThreadsRaw("ids", JSON.stringify(all));
  await setThreadsRaw("synced", String(Date.now()));
  return { posts: list.data.length, fresh, failed: fetched.filter((x) => !x).length, reason };
}

async function postsOf(ids: string[]): Promise<ThreadsPost[]> {
  if (!ids.length) return [];
  const raws = await getThreadsRawMany(ids.map((id) => `post:${id}`));
  return raws.flatMap((r) => (r ? [JSON.parse(r) as ThreadsPost] : []));
}

// Every post kept, newest first, and when they were last fetched.
export async function threadsPosts(): Promise<{ posts: ThreadsPost[]; synced: number | null }> {
  const ids = JSON.parse((await getThreadsRaw("ids")) ?? "[]") as string[];
  const posts = (await postsOf(ids)).sort((a, b) => b.ts - a.ts);
  const synced = Number((await getThreadsRaw("synced")) ?? 0) || null;
  return { posts, synced };
}
