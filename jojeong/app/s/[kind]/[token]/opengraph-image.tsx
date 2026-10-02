import { iljuFacts } from "@/lib/cards";
import { freeReadingOf } from "@/lib/freeReading";
import { josa } from "@/lib/josa";
import { shareImage } from "@/lib/og";
import { profileOf } from "@/lib/pairToken";
import { distinctOf } from "@/lib/rarity";
import { isShareKind, openPerson } from "@/lib/shareToken";
import { sinbunStory } from "@/lib/sinbun";

export const alt = "친구가 보내온 훈도사주 결과";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The link's preview (KakaoTalk, messages): the sender's result in a line or two, computed from the signed address.
export default async function Image({ params }: { params: Promise<{ kind: string; token: string }> }) {
  const { kind, token } = await params;
  const person = isShareKind(kind) ? openPerson(kind, token) : null;
  if (!person) return shareImage({ top: "훈도사주", big: "나한테만 맞는 말", small: "생년월일만 넣으면 무료로 바로" });
  if (kind === "sinbun") {
    const s = sinbunStory(person.pillars);
    return shareImage({ top: `${josa(person.name, "이/가")} 조선에 태어났다면`, badge: s.rank, big: s.job, small: s.line });
  }
  const f = iljuFacts(person.pillars.dayStem, person.pillars.dayBranch);
  const free = freeReadingOf(person.pillars, profileOf(person));
  const top = free ? [...free.powers].sort((a, b) => b.pct - a.pct)[0] : null;
  const same = distinctOf(person.pillars, person.gender)?.ilju;
  return shareImage({
    top: `${person.name}님의 사주 풀이`,
    badge: f.hanja,
    big: `${f.name}${f.image ? ` · ${f.image}` : ""}`,
    small: [top && `가장 큰 힘 ${top.name} ${top.pct}%`, same && `같은 ${same.name}일주 중 약 ${Math.max(1, Math.round(same.rate * 100))}%만 이 구조`].filter(Boolean).join(" · "),
  });
}
