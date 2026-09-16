/** Meta Graph API 공통 호출부. Instagram / Threads 가 함께 쓴다. */

export const GRAPH_VERSION = process.env.GRAPH_API_VERSION ?? 'v25.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const THREADS_BASE = `https://graph.threads.net/${process.env.THREADS_API_VERSION ?? 'v1.0'}`;

export type Host = 'graph' | 'threads';

function baseUrl(host: Host): string {
  return host === 'threads' ? THREADS_BASE : GRAPH_BASE;
}

export class GraphError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = 'GraphError';
  }
}

async function call<T>(
  host: Host,
  method: 'GET' | 'POST',
  endpoint: string,
  params: Record<string, string | undefined>,
  token: string,
): Promise<T> {
  const url = new URL(`${baseUrl(host)}/${endpoint.replace(/^\//, '')}`);
  const payload = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    if (method === 'GET') url.searchParams.set(k, v);
    else payload.set(k, v);
  }
  if (method === 'GET') url.searchParams.set('access_token', token);
  else payload.set('access_token', token);

  const res = await fetch(url, {
    method,
    ...(method === 'POST'
      ? { body: payload, headers: { 'content-type': 'application/x-www-form-urlencoded' } }
      : {}),
  });

  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  if (!res.ok) {
    const detail =
      typeof body === 'object' && body && 'error' in body
        ? JSON.stringify((body as { error: unknown }).error)
        : text.slice(0, 400);
    throw new GraphError(`${method} ${endpoint} 실패 (${res.status}): ${detail}`, res.status, body);
  }
  return body as T;
}

export const graphGet = <T>(h: Host, e: string, p: Record<string, string | undefined>, t: string) =>
  call<T>(h, 'GET', e, p, t);
export const graphPost = <T>(h: Host, e: string, p: Record<string, string | undefined>, t: string) =>
  call<T>(h, 'POST', e, p, t);

/** 미디어 컨테이너가 처리될 때까지 기다린다. 이미지는 보통 즉시, 영상은 수십 초. */
export async function waitForContainer(
  host: Host,
  containerId: string,
  token: string,
  opts: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<void> {
  const timeout = opts.timeoutMs ?? 5 * 60_000;
  const interval = opts.intervalMs ?? 5_000;
  const field = host === 'threads' ? 'status' : 'status_code';
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const res = await graphGet<Record<string, string>>(
      host,
      containerId,
      { fields: `${field},error_message` },
      token,
    );
    const status = res[field];
    if (status === 'FINISHED' || status === 'PUBLISHED') return;
    if (status === 'ERROR' || status === 'EXPIRED') {
      throw new GraphError(
        `컨테이너 ${containerId} 처리 실패: ${status} ${res.error_message ?? ''}`,
        0,
        res,
      );
    }
    await sleep(interval);
  }
  throw new GraphError(`컨테이너 ${containerId} 처리 시간 초과`, 0, null);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** 채널별 토큰/계정 ID. 예: IG_TOKEN_TORYVEL, IG_USER_ID_TORYVEL */
export function credential(prefix: string, channel: string): string {
  const key = `${prefix}_${channel.toUpperCase().replace(/-/g, '_')}`;
  const value = process.env[key];
  if (!value) throw new Error(`환경변수 ${key} 가 없습니다. .env 또는 GitHub Secrets 에 넣으세요.`);
  return value;
}
