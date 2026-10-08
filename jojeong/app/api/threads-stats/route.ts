import { threadsPosts } from "@/lib/threads";

export const dynamic = "force-dynamic";

// The Threads numbers as JSON, for planning the next posts. Only what Threads already shows under each post
// (views, likes, replies, reposts, quotes, shares) and the post's first lines; nothing about readers.
export async function GET() {
  const { posts, synced } = await threadsPosts().catch(() => ({ posts: [], synced: null }));
  return Response.json(
    {
      synced: synced ? new Date(synced).toISOString() : null,
      posts: posts.map((p) => ({ at: new Date(p.ts).toISOString(), text: p.text.slice(0, 120), link: p.link, day: p.day, latest: p.latest })),
    },
    { headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } },
  );
}
