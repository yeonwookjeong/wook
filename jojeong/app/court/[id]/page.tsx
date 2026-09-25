import type { Metadata } from "next";
import Link from "next/link";
import BirthForm from "@/components/BirthForm";
import Naegwan from "@/components/Naegwan";
import SeatRow from "@/components/SeatRow";
import { SaveImageButton, ShareLinkButton } from "@/components/ShareButtons";
import { loadCourt, viewerOf } from "@/lib/load";
import { EMPTY_SEATS, ROLES } from "@/lib/roles";

export async function generateMetadata({ params }: PageProps<"/court/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { court } = await loadCourt(id);
  const title = `${court.kingName} 전하의 조정`;
  const description = `${court.kingName} 전하께서 그대를 조정에 부르셨사옵니다. 사주로 관직을 받아보시옵소서.`;
  return { title, description, openGraph: { title, description }, twitter: { card: "summary_large_image" } };
}

export default async function CourtPage({ params }: PageProps<"/court/[id]">) {
  const { id } = await params;
  const { court, seats } = await loadCourt(id);
  const { isOwner, myMinisterId } = await viewerOf(court.id, court.ownerToken);
  const joined = !!myMinisterId && seats.some((s) => s.minister.id === myMinisterId);

  const gansinCount = seats.filter((s) => s.role === "gansin").length;
  const filled = new Set(seats.map((s) => s.role));
  const emptySeats = EMPTY_SEATS.filter((k) => !filled.has(k));
  const inviteText = `${court.kingName} 전하께서 그대를 조정에 부르셨사옵니다. 입궐하시겠사옵니까?`;

  return (
    <>
      <header className="animate-rise pt-8 text-center">
        <Link href="/" className="text-xs font-bold tracking-widest text-seal">
          나의 조정
        </Link>
        <h1 className="mt-2 font-myeongjo text-3xl font-extrabold">{court.kingName} 전하의 조정</h1>
        <p className="mt-2 text-sm text-ink-soft">
          신하 <b className="text-ink">{seats.length}</b>명
          {seats.length > 0 && (
            <>
              {" · "}간신 <b className="text-seal">{gansinCount}</b>명 적발
            </>
          )}
        </p>
      </header>

      {!isOwner && !joined ? (
        <Invitation courtId={court.id} kingName={court.kingName} vacantYeong={!filled.has("yeong")} />
      ) : (
        <>
          <section className="mt-6">
            <Naegwan>
              {isOwner ? (
                seats.length === 0 ? (
                  <>즉위를 경하드리옵니다, 전하! 허나 조정이 텅 비었사옵니다. 아래 버튼으로 벗들을 부르시옵소서.</>
                ) : gansinCount > 0 ? (
                  <>
                    전하… 조정에 간신이 <b className="text-seal">{gansinCount}명</b> 숨어 있사옵니다. 누구인지 확인해
                    보시옵소서.
                  </>
                ) : (
                  <>아직 간신은 드러나지 않았사옵니다. 신하가 늘어나면 정체를 드러낼 것이옵니다.</>
                )
              ) : (
                <>그대도 입궐을 마쳤사옵니다. 다른 신하들의 관직도 살펴보시옵소서.</>
              )}
            </Naegwan>
          </section>

          {isOwner && (
            <section className="mt-5 flex flex-col gap-3">
              <ShareLinkButton path={`/court/${court.id}`} text={inviteText} label="신하 부르기" />
              {seats.length > 0 && (
                <SaveImageButton
                  src={`/court/${court.id}/gyoji`}
                  filename={`${court.kingName}-조정.png`}
                  label="조정 교지 저장 (스토리용)"
                />
              )}
            </section>
          )}

          {seats.length > 0 && (
            <ol className="mt-6 flex flex-col gap-2">
              {seats.map((seat) => (
                <SeatRow key={seat.minister.id} courtId={court.id} seat={seat} mine={seat.minister.id === myMinisterId} />
              ))}
            </ol>
          )}

          {emptySeats.length > 0 && (
            <section className="mt-6">
              <p className="mb-2 text-center text-xs font-bold text-ink-soft">아직 비어 있는 자리</p>
              <ul className="flex flex-wrap justify-center gap-2">
                {emptySeats.map((k) => (
                  <li
                    key={k}
                    className="rounded-full border border-dashed border-ink/25 px-3 py-1.5 font-myeongjo text-sm text-ink-soft"
                  >
                    {ROLES[k].title}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!isOwner && (
            <section className="mt-8 flex flex-col gap-3">
              <Link
                href={`/court/${court.id}/m/${myMinisterId}`}
                className="w-full rounded-2xl border-2 border-ink py-3.5 text-center font-myeongjo font-extrabold"
              >
                내 관직 다시 보기
              </Link>
              <Link
                href="/"
                className="w-full rounded-2xl bg-seal py-4 text-center font-myeongjo text-lg font-extrabold text-hanji shadow-[0_6px_0_#7d1a14]"
              >
                나도 즉위하기
              </Link>
            </section>
          )}
        </>
      )}
    </>
  );
}

function Invitation({ courtId, kingName, vacantYeong }: { courtId: string; kingName: string; vacantYeong: boolean }) {
  return (
    <>
      <section className="relative mt-6 overflow-hidden rounded-3xl border-4 border-double border-seal/60 bg-white/70 px-6 pt-8 pb-24 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.3em] text-seal">敎 旨</p>
        <p className="mt-4 font-myeongjo text-2xl font-extrabold leading-snug">
          {kingName} 전하께서
          <br />
          그대를 부르셨사옵니다
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          {vacantYeong ? "영의정 자리가 아직 비어 있사옵니다." : "이미 영의정이 정해졌사오나, 자리는 언제든 바뀌옵니다."}
        </p>
        <span className="animate-stamp absolute right-5 bottom-4 flex size-14 items-center justify-center rounded-lg border-2 border-seal font-myeongjo text-xs font-extrabold leading-tight text-seal">
          御
          <br />寶
        </span>
      </section>

      <section className="mt-6">
        <Naegwan>
          입궐하시면 소신이 그대의 사주를 전하의 사주와 맞춰보고 관직을 내리겠사옵니다. 혹 간신으로 몰려도 소신을 원망
          마시옵소서.
        </Naegwan>
      </section>

      <section className="mt-5 rounded-3xl border border-ink/10 bg-hanji-deep/60 p-5">
        <BirthForm mode="minister" courtId={courtId} />
      </section>
    </>
  );
}
