// IndexNow: a ping to Naver (and, through it, Bing and the others) when a page is new, so it is crawled the same
// day rather than whenever the robot next reads the sitemap. Google does not take part; it reads the sitemap.
// The key is public by design: it is served at /<key>.txt to prove the ping comes from this site.
export const INDEXNOW_KEY = "1710ebef0e66139e36374b928a92e5df";
const ENDPOINT = "https://searchadvisor.naver.com/indexnow";

export async function pingIndexNow(urls: string[]): Promise<number> {
  if (urls.length === 0) return 0;
  const site = new URL(urls[0]);
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: site.host, key: INDEXNOW_KEY, keyLocation: `${site.origin}/${INDEXNOW_KEY}.txt`, urlList: urls }),
  });
  return res.status;
}
