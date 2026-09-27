import { adsAccount } from "@/lib/ads";

// ads.txt at the domain root, declaring the AdSense account that may sell this site's ad space.
export function GET() {
  if (!adsAccount) return new Response("Not found", { status: 404 });
  return new Response(`google.com, ${adsAccount.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
