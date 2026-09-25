import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Naegwan from "@/components/Naegwan";
import { SaveImageButton, ShareLinkButton } from "@/components/ShareButtons";
import { bragLine, decreeLine } from "@/lib/decree";
import { loadCourt, viewerOf } from "@/lib/load";
import { ROLES } from "@/lib/roles";
import { factLines, relationSentence } from "@/lib/saju";

async function loadSeat(id: string, mid: string) {
  const { court, seats } = await loadCourt(id);
  const seat = seats.find((s) => s.minister.id === mid);
  if (!seat) notFound();
  return { court, seat };
}

export async function generateMetadata({ params }: PageProps<"/court/[id]/m/[mid]">): Promise<Metadata> {
  const { id, mid } = await params;
  const { court, seat } = await loadSeat(id, mid);
  const title = `${seat.minister.name}, ${court.kingName} 전하의 ${ROLES[seat.role].title}`;
  const description = `${decreeLine(seat.minister.name, seat.role)}. 그대의 관직도 사주로 받아보시옵소서.`;
  return { title, description, openGraph: { title, description }, twitter: { card: "summary_large_image" } };
}

export default async function MinisterPage({ params }: PageProps<"/court/[id]/m/[mid]">) {
  const { id, mid } = await params;
  const { court, seat } = await loadSeat(id, mid);
  const { isOwner, myMinisterId } = await viewerOf(court.id, court.ownerToken);
  const isSelf = myMinisterId === seat.minister.id;
  const role = ROLES[seat.role];
  const danger = role.tone === "red" || role.tone === "gray";
  const facts = factLines(court.king, seat.minister.pillars, seat.match.facts);

  return (
    <>
      <nav className="flex justify-between pt-5 text-sm">
        <Link href={`/court/${court.id}`} className="font-bold text-ink-soft">
          ← {court.kingName} 전하의 조정
        </Link>
        <Link href="/" className="font-bold text-seal">
          나의 조정
        </Link>
      </nav>

      <section
        className={`animate-rise relative mt-5 overflow-hidden rounded-3xl border-4 border-double bg-white/75 px-6 pt-8 pb-10 text-center ${danger ? "border-seal/70" : "border-gold/70"}`}
      >
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.3em] text-seal">敎 旨</p>
        <p className="mt-5 text-sm text-ink-soft">{court.kingName} 전하께서</p>
        <p className="mt-1 font-myeongjo text-xl font-extrabold">{decreeLine(seat.minister.name, seat.role)}</p>

        <p className={`mt-6 font-myeongjo text-6xl font-extrabold ${danger ? "text-seal" : "text-ink"}`}>
          {role.title}
        </p>
        <p className="mt-2 text-sm font-bold text-gold">{role.rank}</p>
        <p className="mt-3 text-[15px]">&ldquo;{role.tagline}&rdquo;</p>

        <div className="mx-auto mt-6 w-fit rounded-full bg-hanji-deep px-4 py-1.5 text-sm">
          궁합 <b className="font-myeongjo text-lg">{seat.match.score}</b>점
        </div>

        <span className="animate-stamp absolute right-5 bottom-5 flex size-16 items-center justify-center rounded-lg border-[3px] border-seal font-myeongjo text-sm font-extrabold leading-tight text-seal">
          御
          <br />寶
        </span>
      </section>

      <section className="mt-6">
        <Naegwan>{role.report}</Naegwan>
      </section>

      <section className="mt-5 rounded-3xl border border-ink/10 bg-hanji-deep/60 p-5">
        <h2 className="font-myeongjo text-lg font-extrabold">밀지(密旨) · 사주 풀이</h2>
        <p className="mt-3 text-[15px] leading-relaxed">
          {relationSentence(court.king, seat.minister.pillars, seat.match.facts, seat.minister.name)}
        </p>
        {facts.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5 text-sm leading-relaxed">
            {facts.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-seal">◆</span>
                {line}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 rounded-xl bg-white/70 px-4 py-3 text-sm leading-relaxed">
          <b className="text-gold">복길의 진언</b> · {role.advice}
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-3">
        {isSelf && (
          <>
            <SaveImageButton
              src={`/court/${court.id}/m/${seat.minister.id}/card`}
              filename={`${seat.minister.name}-${role.title}.png`}
              label="내 교지 저장 (스토리용)"
            />
            <ShareLinkButton
              path={`/court/${court.id}/m/${seat.minister.id}`}
              text={bragLine(court.kingName, seat.role)}
              label="결과 자랑하기"
              primary={false}
            />
            <Link
              href="/"
              className="mt-2 w-full rounded-2xl bg-seal py-4 text-center font-myeongjo text-lg font-extrabold text-hanji shadow-[0_6px_0_#7d1a14]"
            >
              나도 즉위해서 신하 부르기
            </Link>
          </>
        )}
        {isOwner && (
          <SaveImageButton
            src={`/court/${court.id}/m/${seat.minister.id}/card`}
            filename={`${seat.minister.name}-${role.title}.png`}
            label="이 교지 저장"
          />
        )}
        {!isSelf && !isOwner && (
          <>
            {!myMinisterId && (
              <Link
                href={`/court/${court.id}`}
                className="w-full rounded-2xl border-2 border-ink py-3.5 text-center font-myeongjo font-extrabold"
              >
                나도 {court.kingName} 전하의 조정에 입궐하기
              </Link>
            )}
            <Link
              href="/"
              className="w-full rounded-2xl bg-seal py-4 text-center font-myeongjo text-lg font-extrabold text-hanji shadow-[0_6px_0_#7d1a14]"
            >
              나도 즉위하기
            </Link>
          </>
        )}
      </section>
    </>
  );
}
