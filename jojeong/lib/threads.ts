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
type List = { data: { id: string; text?: string; timestamp: string; permalink?: string }[] };
async function latestPosts(): Promise<{ list: List; access: string }> {
  const listWith = (access: string) => call<List>("/v1.0/me/threads", { fields: "id,text,timestamp,permalink", limit: "40", access_token: access });
  const access = await token();
  try {
    return { list: await listWith(access), access };
  } catch (e) {
    // The stored token died (expired or revoked): start again from the one in Vercel.
    if (!(e instanceof ThreadsError && e.code === 190)) throw e;
    const again = await token(true);
    return { list: await listWith(again), access: again };
  }
}

// A failed replies fetch is kept as the status, so the inbox shows why and when.
async function failedReplies(e: unknown): Promise<RepliesStatus> {
  const status: RepliesStatus = { ok: false, reason: String((e as Error)?.message ?? e).slice(0, 300), at: Date.now(), posts: 0, saved: 0 };
  await setThreadsRaw("replies:status", JSON.stringify(status)).catch(() => {});
  return status;
}

export async function syncThreads(): Promise<{ posts: number; fresh: number; failed: number; reason: string | null; replies: RepliesStatus }> {
  const { list, access } = await latestPosts();
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
  // The replies come last and never break the numbers above: any failure is kept as the status instead.
  const replies = await syncReplies(list.data, access).catch(failedReplies);
  return { posts: list.data.length, fresh, failed: fetched.filter((x) => !x).length, reason, replies };
}

// ── Replies under my own posts (the words, not just the count), for the team's read-only inbox (/api/team/inbox).
// Needs the threads_read_replies permission on the token (with threads_basic). Kept apart from the post records
// under th:replies:<postId>, so the public numbers (/api/threads-stats) never carry anyone's words.
export type ThreadsReply = {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  permalink: string;
  hide_status: string;
  // Whether my account has answered this reply (null: not known, the last check failed).
  has_our_reply: boolean | null;
};
export type ThreadsReplies = { mediaId: string; postText: string; postLink: string; fetchedAt: number; replies: ThreadsReply[] };
export type RepliesStatus = { ok: boolean; reason: string | null; at: number; posts: number; saved: number };

const REPLY_POSTS = 10;
const REPLY_DAYS = 7;
const REPLIES_KEPT = 100;
const REPLY_PAGES = 2;
const CONVERSATION_PAGES = 3;
// How long a post's replies are kept (a default until the owner settles it): each fetch starts the count again.
const REPLIES_TTL = 30 * 86400;
const REPLY_IDS_KEPT = 60;
const REPLY_FIELDS = "id,text,username,timestamp,permalink,hide_status";
// Meta's codes for a missing or refused permission (10, 200-299) and a dead token (190): every post would fail
// the same way, so the rest are not tried.
const refused = (e: unknown) => e instanceof ThreadsError && (e.code === 10 || e.code === 190 || (e.code !== undefined && e.code >= 200 && e.code < 300));

type ReplyPage = { data?: Partial<ThreadsReply>[]; paging?: { next?: string } };
// The next page comes as a whole address from Meta (token included); only one on graph.threads.net is followed.
async function nextPage<T = ReplyPage>(url: string): Promise<T> {
  const u = new URL(url);
  if (u.origin !== API) throw new ThreadsError("Threads replies: unexpected next page address");
  return call<T>(u.pathname, Object.fromEntries(u.searchParams));
}

// Replies under one post, up to REPLY_PAGES pages, without my own (my answers in the chain).
async function repliesOf(id: string, access: string, me: string): Promise<ThreadsReply[]> {
  let page = await call<ReplyPage>(`/v1.0/${id}/replies`, { fields: REPLY_FIELDS, reverse: "true", access_token: access });
  const raw: Partial<ThreadsReply>[] = [...(page.data ?? [])];
  for (let n = 1; n < REPLY_PAGES && page.paging?.next; n++) {
    page = await nextPage(page.paging.next);
    raw.push(...(page.data ?? []));
  }
  return raw.flatMap((x) =>
    x.id && !(me && x.username === me)
      ? [{ id: x.id, text: x.text ?? "", username: x.username ?? "", timestamp: x.timestamp ?? "", permalink: x.permalink ?? "", hide_status: x.hide_status ?? "", has_our_reply: null }]
      : [],
  );
}

// The replies I have answered under one post: the whole conversation (every depth) read once, and the ids my own
// replies point to. Null when it cannot be read, so the earlier answer is kept.
async function answeredOf(id: string, access: string, me: string): Promise<Set<string> | null> {
  if (!me) return null;
  type Conv = { data?: { username?: string; replied_to?: { id?: string } }[]; paging?: { next?: string } };
  try {
    let page = await call<Conv>(`/v1.0/${id}/conversation`, { fields: "id,username,replied_to", reverse: "false", access_token: access });
    const raw = [...(page.data ?? [])];
    for (let n = 1; n < CONVERSATION_PAGES && page.paging?.next; n++) {
      page = await nextPage<Conv>(page.paging.next);
      raw.push(...(page.data ?? []));
    }
    return new Set(raw.flatMap((x) => (x.username === me && x.replied_to?.id ? [x.replied_to.id] : [])));
  } catch {
    return null;
  }
}

function parseReplies(raw: string | null): ThreadsReplies | null {
  if (!raw) return null;
  try {
    const rec = JSON.parse(raw) as ThreadsReplies;
    return Array.isArray(rec?.replies) ? rec : null;
  } catch {
    return null;
  }
}

type ListItem = { id: string; text?: string; timestamp: string; permalink?: string };
async function syncReplies(items: ListItem[], access: string): Promise<RepliesStatus> {
  const recent = items.filter((i) => Date.now() - Date.parse(i.timestamp) <= REPLY_DAYS * 86400000).slice(0, REPLY_POSTS);
  let reason: string | null = null;
  let saved = 0;
  let posts = 0;
  // My own username, to leave my answers out. Without it nothing is left out (the call needs only threads_basic).
  const me = recent.length
    ? await call<{ username?: string }>("/v1.0/me", { fields: "username", access_token: access })
        .then((r) => r.username ?? "")
        .catch(() => "")
    : "";
  for (const item of recent) {
    let got: ThreadsReply[];
    try {
      got = await repliesOf(item.id, access, me);
    } catch (e) {
      reason ??= String((e as Error)?.message ?? e).slice(0, 300);
      if (refused(e)) break;
      continue;
    }
    // A broken record is dropped and started again, not carried.
    const before = parseReplies(await getThreadsRaw(`replies:${item.id}`));
    const answered = await answeredOf(item.id, access, me);
    // Newer fetch wins for the same reply (an edit or a hide); the newest REPLIES_KEPT are kept, mine never.
    // Whether I answered is read again for every reply kept; when that read failed, the earlier answer stays.
    const byId = new Map((before?.replies ?? []).filter((x) => !(me && x.username === me)).map((x) => [x.id, x]));
    for (const x of got) byId.set(x.id, { ...x, has_our_reply: byId.get(x.id)?.has_our_reply ?? null });
    const replies = [...byId.values()]
      .map((x) => ({ ...x, has_our_reply: answered ? answered.has(x.id) : (x.has_our_reply ?? null) }))
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .slice(0, REPLIES_KEPT);
    const record: ThreadsReplies = { mediaId: item.id, postText: (item.text ?? "").slice(0, 120), postLink: item.permalink ?? "", fetchedAt: Date.now(), replies };
    await setThreadsRaw(`replies:${item.id}`, JSON.stringify(record), REPLIES_TTL);
    saved += got.length;
    posts++;
  }
  if (posts) {
    let ids: string[] = [];
    try {
      const parsed = JSON.parse((await getThreadsRaw("replies:ids")) || "[]") as unknown;
      ids = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
    } catch {}
    const all = [...new Set([...recent.map((i) => i.id), ...ids])];
    // Posts falling off the list take their replies with them.
    await Promise.all(all.slice(REPLY_IDS_KEPT).map((id) => setThreadsRaw(`replies:${id}`, "", 60)));
    await setThreadsRaw("replies:ids", JSON.stringify(all.slice(0, REPLY_IDS_KEPT)));
  }
  const status: RepliesStatus = { ok: reason === null, reason, at: Date.now(), posts, saved };
  await setThreadsRaw("replies:status", JSON.stringify(status));
  return status;
}

// The replies alone, read again now (the team inbox calls this when the last fetch is old; the once-a-day cron
// still does the numbers). A failure is kept as the status, never thrown.
export async function refreshReplies(): Promise<RepliesStatus> {
  try {
    const { list, access } = await latestPosts();
    return await syncReplies(list.data, access);
  } catch (e) {
    return failedReplies(e);
  }
}

// Every reply kept, newest first, and how the last fetch went.
export async function threadsReplies(): Promise<{ replies: (ThreadsReply & { mediaId: string; postText: string; postLink: string })[]; status: RepliesStatus | null }> {
  const ids = JSON.parse((await getThreadsRaw("replies:ids")) || "[]") as string[];
  const raws = ids.length ? await getThreadsRawMany(ids.map((id) => `replies:${id}`)) : [];
  const replies = raws
    .flatMap((r) => {
      const rec = parseReplies(r);
      return rec ? rec.replies.map((x) => ({ ...x, mediaId: rec.mediaId, postText: rec.postText, postLink: rec.postLink })) : [];
    })
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const status = JSON.parse((await getThreadsRaw("replies:status")) || "null") as RepliesStatus | null;
  return { replies, status };
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
