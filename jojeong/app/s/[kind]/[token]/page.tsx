import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import ChartIntro from "@/components/ChartIntro";
import FreeReading from "@/components/FreeReading";
import Hundo from "@/components/Hundo";
import MeForm from "@/components/MeForm";
import SinbunReport from "@/components/SinbunReport";
import YearReport from "@/components/YearReport";
import { freeReadingOf } from "@/lib/freeReading";
import { josa } from "@/lib/josa";
import { readMe } from "@/lib/me";
import { profileOf } from "@/lib/pairToken";
import { distinctOf } from "@/lib/rarity";
import { iljuFacts } from "@/lib/cards";
import { ReadingCard, SinbunCard } from "@/components/ResultCards";
import { isShareKind, openCard, openPerson, type ReadingSummary, type SinbunSummary } from "@/lib/shareToken";
import { track } from "@/lib/stats";
import { yearReading } from "@/lib/yearly";

// What a friend opens from "친구에게 보내기". Two kinds of link, both signed (lib/shareToken.ts), nothing stored:
//   the whole free result as the sender saw it, with the form for their own at the top and the foot; or
//   the sender's summary card only (no chart), with the form below it.
// Either leads to the same free page.
const NEXT = { reading: "/reports/gukjeong", sinbun: "/reports/sinbun" } as const;

async function load(params: PageProps<"/s/[kind]/[token]">["params"]) {
  const { kind, token } = await params;
  if (!isShareKind(kind)) return null;
  const person = openPerson(kind, token);
  if (person) return { kind, person, card: null };
  const card = openCard(kind, token);
  return card ? { kind, person: null, card } : null;
}

export async function generateMetadata({ params }: PageProps<"/s/[kind]/[token]">): Promise<Metadata> {
  const got = await load(params);
  if (!got) return {};
  const { kind } = got;
  const who = got.person ? got.person.name : got.card!.n;
  const title = kind === "reading" ? `${who}님의 사주 풀이` : `${josa(who, "이/가")} 조선에 태어났다면`;
  const description = kind === "reading" ? "그대의 사주는 어떠하옵니까? 생년월일만 넣으면 무료로 바로 보여 드려요." : "그대는 조선에서 무엇이었을까요? 생년월일만 넣으면 무료로 바로 감정해 드려요.";
  return { title, description, robots: { index: false }, openGraph: { title, description } };
}

export default async function SharedPage({ params }: PageProps<"/s/[kind]/[token]">) {
  const got = await load(params);
  if (!got) notFound();
  const { kind, person, card } = got;
  const me = await readMe();
  // A friend's link opened: how many arrive this way (the owner's table).
  await track(`sl:${kind}`).catch(() => {});

  const name = person ? person.name : (card as { n: string }).n;
  const profile = person ? profileOf(person) : null;
  const pillars = person?.pillars;
  const reading = person && pillars && kind === "reading" ? yearReading(pillars, profile) : null;
  const distinct = reading && pillars ? distinctOf(pillars, person!.gender) : null;
  const free = reading && pillars ? freeReadingOf(pillars, profile) : null;

  // The friend's own: the form, or (a chart already kept on this device) straight to their result.
  const mine = (
    <section id="mine" className="doc-paper mt-6 scroll-mt-4 px-5 pt-6 pb-6">
      <h2 className="text-center font-myeongjo text-lg font-extrabold">{kind === "sinbun" ? "나는 조선에서 뭐였을까?" : "내 사주도 받아 보기"}</h2>
      {me ? (
        <>
          <p className="mt-2 text-center text-[13px] leading-relaxed text-ink-soft">{me.person.name}님의 사주가 이 기기에 저장돼 있어요.</p>
          <Link href={NEXT[kind]} className="mt-4 block rounded-2xl bg-seal py-4 text-center font-myeongjo text-lg font-extrabold text-hanji shadow-[0_6px_0_#7d1a14]">
            내 결과 바로 보기
          </Link>
        </>
      ) : (
        <>
          <p className="mt-2 rounded-xl bg-gold/10 px-3 py-2 text-center text-[13px] leading-relaxed">
            생년월일만 넣으면 <b>무료</b>로 바로 보여 드려요
          </p>
          <div className="mt-4">
            <MeForm next={NEXT[kind]} submit="내 결과 보기" />
          </div>
        </>
      )}
    </section>
  );

  return (
    <>
      <section className="mt-6 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">傳 達</p>
        <h1 className="mt-2 font-myeongjo text-2xl font-extrabold">{josa(name, "이/가")} 보내왔어요</h1>
        <p className="mt-1 text-xs text-ink-soft">{kind === "sinbun" ? "조선에 태어났다면 무엇이었을까" : "무료 사주 풀이"}</p>
        <a href="#mine" className="mt-3 inline-block rounded-full border-2 border-seal bg-white/70 px-5 py-2 font-myeongjo text-sm font-extrabold text-seal">
          나도 내 결과 보기 ↓
        </a>
      </section>

      {card && (
        <section className="mt-5">
          <style>{`@font-face{font-family:"GanzhiBrush";src:url(/fonts/ganzhi-syuku.woff2) format("woff2");font-display:block}`}</style>
          {kind === "sinbun" ? (
            (() => {
              const d = card as SinbunSummary;
              return <SinbunCard who={`${josa(d.n, "이/가")} 조선에 태어났다면`} rank={d.r} job={d.j} line={d.l} rise={d.w} yong={d.y} />;
            })()
          ) : (
            (() => {
              const d = card as ReadingSummary;
              const f = iljuFacts(d.s, d.b);
              return (
                <ReadingCard
                  who={`${d.n}님의 사주`}
                  ilju={{ hanja: f.hanja, name: f.name.replace("일주", "") }}
                  image={f.image ?? null}
                  powers={d.p.map(([group, n, pct]) => ({ group: group as never, name: n, pct, rank: null }))}
                  kinds={d.k.map(([label, type]) => ({ label, type }))}
                  same={d.r || null}
                />
              );
            })()
          )}
        </section>
      )}

      {person && kind === "sinbun" && pillars ? (
        <SinbunReport pillars={pillars} heading={`${josa(name, "이/가")} 조선에 태어났다면`} query="" />
      ) : reading ? (
        <YearReport
          reading={reading}
          heading={`${name}님의 2026년 운세`}
          deepen={null}
          query=""
          intro={
            distinct && (
              <>
                <ChartIntro name={name} d={distinct} slots={reading.chart.slots} chips={!free} />
                {free && <FreeReading name={name} r={free} query="" addGender="#mine" />}
              </>
            )
          }
        />
      ) : null}

      <section className="mt-6">
        <Hundo>{kind === "sinbun" ? "그대는 조선에서 무엇이었사옵니까? 소신이 감정해 드리겠사옵니다." : "그대의 사주는 어떠하옵니까? 소신이 풀어 드리겠사옵니다."}</Hundo>
      </section>

      {mine}
      <AdSlot />
    </>
  );
}
