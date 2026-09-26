import type { Metadata } from "next";
import Link from "next/link";
import BirthForm from "@/components/BirthForm";
import Hundo from "@/components/Hundo";
import ReportShelf from "@/components/ReportShelf";
import RoyalDoc from "@/components/RoyalDoc";
import KingCard from "@/components/KingCard";
import Sillok from "@/components/Sillok";
import PairHighlights from "@/components/PairHighlights";
import SeatRow from "@/components/SeatRow";
import { SaveImageButton, ShareLinkButton } from "@/components/ShareButtons";
import { loadCourt, viewerOf } from "@/lib/load";
import { KING_TYPES } from "@/lib/kingTypes";
import { reignTier, TIERS } from "@/lib/reign";
import { castOf } from "@/lib/sillok";
import { sinbunOf } from "@/lib/sinbun";
import { yearPreview } from "@/lib/yearly";
import { EMPTY_SEATS, ROLES } from "@/lib/roles";

export async function generateMetadata({ params }: PageProps<"/court/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { court } = await loadCourt(id);
  const title = `${court.kingName} 전하의 조정`;
  const description = `${KING_TYPES[court.king.dayStem].title} ${court.kingName} 전하께서 그대를 조정에 부르셨사옵니다. 사주로 관직을 받아보시옵소서.`;
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
  const kingType = KING_TYPES[court.king.dayStem];
  const tier = TIERS[reignTier(court.king).tier];
  const cast = castOf(seats);
  const inviteText = `${kingType.title} ${court.kingName} 전하께서 그대를 조정에 부르셨사옵니다. 입궐하시겠사옵니까?`;

  return (
    <>
      <header className="animate-rise pt-6 text-center">
        <p className="text-sm font-bold text-gold">
          {kingType.title} · <span className={tier.dark ? "text-seal" : ""}>{tier.label}</span>
        </p>
        <h1 className="mt-0.5 font-myeongjo text-3xl font-extrabold">{court.kingName} 전하의 조정</h1>
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
        <Invitation
          courtId={court.id}
          kingName={court.kingName}
          kingTitle={kingType.title}
          vacantYeong={!filled.has("yeong")}
        />
      ) : (
        <>
          {isOwner && seats.length === 0 ? (
            <>
              <section className="mt-6">
                <Hundo mood="bow">전하, 즉위를 경하드리옵니다. 소신이 전하의 사주로 실록과 즉위 교서를 지어 올리옵니다.</Hundo>
              </section>
              <Sillok kingName={court.kingName} pillars={court.king} cast={cast} />
              <KingCard kingName={court.kingName} pillars={court.king} />
              <section className="mt-6">
                <Hundo mood="face">
                  이제 조정을 채우실 차례이옵니다. 벗들을 부르시면 소신이 그들의 사주를 살펴, 누가 영의정감이고 누가 간신인지
                  가려 천거하겠사옵니다. 그들의 이름은 실록에도 오르옵니다.
                </Hundo>
              </section>
            </>
          ) : (
            <section className="mt-6">
              <Hundo mood={isOwner && gansinCount > 0 ? "fan" : "face"}>
                {isOwner ? (
                  gansinCount > 0 ? (
                    <>
                      전하… 조정에 간신이 <b className="text-seal">{gansinCount}명</b> 숨어 있사옵니다. 누구인지 확인해
                      보시옵소서.
                    </>
                  ) : (
                    <>아직 간신은 드러나지 않았사옵니다. 신하가 늘어나면 정체를 드러낼 것이옵니다.</>
                  )
                ) : (
                  <>그대도 입궐을 마쳤사옵니다. 다른 신하들의 관직과 전하의 실록도 살펴보시옵소서.</>
                )}
              </Hundo>
            </section>
          )}

          {seats.length > 0 && (
            <p className="mt-6 text-right text-[11px] text-ink-soft">오른쪽 숫자는 전하와의 궁합 점수 · 평균 68점</p>
          )}
          {seats.length > 0 && (
            <ol className="mt-1.5 flex flex-col gap-2">
              {seats.map((seat) => (
                <SeatRow
                  key={seat.minister.id}
                  courtId={court.id}
                  seat={seat}
                  mine={seat.minister.id === myMinisterId}
                  canDismiss={isOwner}
                />
              ))}
            </ol>
          )}

          {isOwner && (
            <details className="group mt-3 rounded-2xl border-2 border-dashed border-ink/25 bg-white/40">
              <summary className="cursor-pointer list-none py-3 text-center text-sm font-bold text-ink [&::-webkit-details-marker]:hidden">
                생년월일을 아는 신하 직접 등용하기
                <span className="ml-1 inline-block transition group-open:rotate-180">▾</span>
              </summary>
              <div className="border-t border-ink/10 p-5">
                <BirthForm mode="appoint" courtId={court.id} />
              </div>
            </details>
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

          <PairHighlights ministers={seats.map((s) => s.minister)} />

          {seats.length > 0 && (
            <>
              <Sillok kingName={court.kingName} pillars={court.king} cast={cast} />
              {isOwner && (
                <details className="group mt-3 rounded-2xl border border-ink/15 bg-white/40">
                  <summary className="cursor-pointer list-none py-3 text-center text-sm font-bold text-ink-soft [&::-webkit-details-marker]:hidden">
                    즉위 교서 다시 보기
                    <span className="ml-1 inline-block transition group-open:rotate-180">▾</span>
                  </summary>
                  <div className="px-1 pb-3">
                    <KingCard kingName={court.kingName} pillars={court.king} />
                  </div>
                </details>
              )}
            </>
          )}

          {isOwner && (
            <section className="mt-6">
              <p className="mb-2 text-center text-xs font-bold text-ink-soft">스토리에 올릴 이미지 저장</p>
              <div className="grid grid-cols-3 gap-2">
                <SaveImageButton compact src={`/court/${court.id}/sillok`} filename={`${court.kingName}-실록.png`} label="실록 카드" />
                <SaveImageButton compact src={`/court/${court.id}/king`} filename={`${court.kingName}-즉위교서.png`} label="즉위 교서" />
                {seats.length > 0 ? (
                  <SaveImageButton compact src={`/court/${court.id}/gyoji`} filename={`${court.kingName}-조정.png`} label="조정도" />
                ) : (
                  <span className="flex items-center justify-center rounded-xl border border-dashed border-ink/20 px-1 text-center text-[11px] text-ink-soft">
                    조정도는 신하가 오면
                  </span>
                )}
              </div>
            </section>
          )}

          {isOwner && (
            <ReportShelf
              ids={["sinbun", "gukjeong", "yeonae", "jaemul", "dwitjosa"]}
              query={`court=${court.id}`}
              highlights={{
                sinbun: `왕이 아니었다면 ‘${sinbunOf(court.king).job}’`,
                gukjeong: `병오년 운세 ‘${yearPreview(court.king).verdict}’ · 첫 장 무료`,
              }}
            />
          )}

          {isOwner && (
            <div className="sticky bottom-4 z-10 mt-6">
              <ShareLinkButton path={`/court/${court.id}`} text={inviteText} label={seats.length > 0 ? "신하 더 부르기" : "신하 부르기"} />
            </div>
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
                나는 어떤 왕일까? 즉위하기
              </Link>
            </section>
          )}
        </>
      )}
    </>
  );
}

function Invitation({
  courtId,
  kingName,
  kingTitle,
  vacantYeong,
}: {
  courtId: string;
  kingName: string;
  kingTitle: string;
  vacantYeong: boolean;
}) {
  return (
    <>
      <RoyalDoc paperClassName="pb-24 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.3em] text-seal">敎 旨</p>
        <p className="mt-4 text-sm font-bold text-gold">{kingTitle}</p>
        <p className="mt-1 font-myeongjo text-2xl font-extrabold leading-snug">
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
      </RoyalDoc>

      <section className="mt-6">
        <Hundo mood="decree">
          관상감 명과학 훈도 정가이옵니다. 입궐하시면 소신이 그대의 사주를 전하의 사주와 맞춰보고 관직을 천거하겠사옵니다.
          혹 간신으로 몰려도 소신을 너무 서운해 마시옵소서.
        </Hundo>
      </section>

      <section className="doc-paper mt-5 px-6 pt-8 pb-7">
        <p className="text-center font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">入 闕</p>
        <p className="mt-1 mb-4 text-center font-myeongjo font-extrabold">그대의 사주를 올리시옵소서</p>
        <BirthForm mode="minister" courtId={courtId} />
      </section>
    </>
  );
}
