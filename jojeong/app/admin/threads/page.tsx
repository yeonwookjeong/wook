import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { threadsPosts, type Numbers } from "@/lib/threads";
import SyncButton from "./SyncButton";

export const metadata: Metadata = { title: "스레드 성적표 · 관리자", robots: { index: false } };

const when = (t: number) => new Date(t + 9 * 3600000).toISOString().slice(5, 16).replace("T", " ");
const n = (x: number | undefined) => (x ?? 0).toLocaleString("ko-KR");

// The Threads posts and how they did (lib/threads.ts), fetched once a day: the numbers about a day after posting,
// for comparing, and the latest. Sorted by the day-after views, so the formats that work show at the top.
export default async function ThreadsPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  if (!(await isAdmin()))
    return (
      <p className="doc-paper mt-6 px-5 py-6 text-sm">
        <Link href="/admin" className="underline">
          관리자로 로그인
        </Link>
        한 뒤에 열 수 있어요.
      </p>
    );
  const { sort } = await searchParams;
  const { posts, synced } = await threadsPosts().catch(() => ({ posts: [], synced: null }));
  const key = (p: (typeof posts)[number]) => (p.day ?? p.latest)?.views ?? 0;
  const rows = sort === "new" ? posts : [...posts].sort((a, b) => key(b) - key(a));
  const configured = Boolean(process.env.THREADS_TOKEN);
  const cell = (x: Numbers | null) =>
    x ? (
      <>
        <b className="tabular-nums">{n(x.views)}</b>
        <span className="block text-[11px] text-ink-soft tabular-nums">
          ♥{n(x.likes)} 💬{n(x.replies)} ↻{n(x.reposts + x.quotes)} ↗{n(x.shares)} · {x.hours}시간
        </span>
      </>
    ) : (
      <span className="text-[11px] text-ink-soft">아직</span>
    );
  return (
    <>
      <p className="mt-4 text-sm">
        <Link href="/admin" className="text-ink-soft underline">
          ← 관리자
        </Link>
      </p>
      <section className="doc-paper mt-3 px-5 py-5">
        <h1 className="font-myeongjo text-xl font-extrabold">스레드 성적표</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          매일 아침 자동으로 가져와요. &lsquo;하루 뒤&rsquo;는 올리고 24시간이 지나 처음 잰 숫자라 글끼리 비교할 때 쓰고, &lsquo;지금&rsquo;은 가장 최근 숫자예요.
          {synced ? ` 마지막으로 가져온 때: ${when(synced)}` : ""}
        </p>
        {configured ? (
          <SyncButton />
        ) : (
          <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-[13px]">Vercel 환경변수에 THREADS_TOKEN을 넣으면 시작돼요.</p>
        )}
      </section>
      <section className="doc-paper mt-4 px-4 py-4">
        <p className="mb-2 flex gap-3 text-[12px] font-bold">
          <Link href="/admin/threads" className={sort === "new" ? "text-ink-soft underline" : "text-seal"}>
            하루 뒤 조회순
          </Link>
          <Link href="/admin/threads?sort=new" className={sort === "new" ? "text-seal" : "text-ink-soft underline"}>
            최신순
          </Link>
        </p>
        {rows.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-soft">아직 가져온 글이 없어요.</p>
        ) : (
          <ol className="flex flex-col divide-y divide-ink/10">
            {rows.map((p, i) => (
              <li key={p.id} className="grid grid-cols-[1.6rem_1fr_6.2rem_6.2rem] items-start gap-2 py-2.5 text-[13px]">
                <span className="font-bold text-seal tabular-nums">{i + 1}</span>
                <a href={p.link} target="_blank" rel="noreferrer" className="min-w-0">
                  <span className="line-clamp-2 leading-snug">{p.text || "(사진만)"}</span>
                  <span className="text-[11px] text-ink-soft">{when(p.ts)}</span>
                </a>
                <span>
                  <span className="block text-[10px] text-ink-soft">하루 뒤</span>
                  {cell(p.day)}
                </span>
                <span>
                  <span className="block text-[10px] text-ink-soft">지금</span>
                  {cell(p.latest)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
