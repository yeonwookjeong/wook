import { shareImage } from "@/lib/og";
import { iljuFacts } from "@/lib/cards";
import { josa } from "@/lib/josa";
import { isShareKind, openShare, type ReadingShare, type SinbunShare } from "@/lib/shareToken";

export const alt = "친구가 보내온 훈도사주 결과";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The link's preview (KakaoTalk, messages): the sender's result in a line or two, from the signed address.
export default async function Image({ params }: { params: Promise<{ kind: string; token: string }> }) {
  const { kind, token } = await params;
  const data = isShareKind(kind) ? openShare(kind, token) : null;
  if (!data || !isShareKind(kind)) return shareImage({ top: "훈도사주", big: "나한테만 맞는 말", small: "생년월일만 넣으면 무료로 바로" });
  if (kind === "sinbun") {
    const d = data as SinbunShare;
    return shareImage({ top: `${josa(d.n, "이/가")} 조선에 태어났다면`, badge: d.r, big: d.j, small: d.l });
  }
  const d = data as ReadingShare;
  const f = iljuFacts(d.s, d.b);
  const top = [...d.p].sort((a, b) => b[2] - a[2])[0];
  return shareImage({
    top: `${d.n}님의 사주 한 장`,
    badge: f.hanja,
    big: `${f.name} · ${f.image ?? ""}`.replace(/ · $/, ""),
    small: `가장 큰 힘 ${top[1]} ${top[2]}%${d.r ? ` · ${d.r}` : ""}`,
  });
}
