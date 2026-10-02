import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import Hundo from "@/components/Hundo";
import MeForm from "@/components/MeForm";
import { ReadingCard, SinbunCard } from "@/components/ResultCards";
import { iljuFacts } from "@/lib/cards";
import { josa } from "@/lib/josa";
import { readMe } from "@/lib/me";
import { isShareKind, openShare, type ReadingShare, type SinbunShare } from "@/lib/shareToken";
import { track } from "@/lib/stats";

// What a friend opens from "친구에게 보내기": the sender's card (their result, from the signed address), then the
// form for their own, which leads to the same free page the sender saw. Nothing is stored; the address holds the
// result only (lib/shareToken.ts).
const NEXT = { reading: "/reports/gukjeong", sinbun: "/reports/sinbun" } as const;

async function load(params: PageProps<"/s/[kind]/[token]">["params"]) {
  const { kind, token } = await params;
  if (!isShareKind(kind)) return null;
  const data = openShare(kind, token);
  return data ? { kind, data } : null;
}

export async function generateMetadata({ params }: PageProps<"/s/[kind]/[token]">): Promise<Metadata> {
  const got = await load(params);
  if (!got) return {};
  const title = got.kind === "reading" ? `${got.data.n}님의 사주 한 장` : `${josa(got.data.n, "이/가")} 조선에 태어났다면`;
  const description = got.kind === "reading" ? "그대의 사주는 어떠하옵니까? 생년월일만 넣으면 무료로 바로 보여 드려요." : "그대는 조선에서 무엇이었을까요? 생년월일만 넣으면 무료로 바로 감정해 드려요.";
  return { title, description, robots: { index: false }, openGraph: { title, description } };
}

export default async function SharedPage({ params }: PageProps<"/s/[kind]/[token]">) {
  const got = await load(params);
  if (!got) notFound();
  const { kind, data } = got;
  const me = await readMe();
  // A friend's link opened: how many arrive this way (the owner's table).
  await track(`sl:${kind}`).catch(() => {});

  const card =
    kind === "sinbun" ? (
      (() => {
        const d = data as SinbunShare;
        return <SinbunCard who={`${josa(d.n, "이/가")} 조선에 태어났다면`} rank={d.r} job={d.j} line={d.l} rise={d.w} yong={d.y} />;
      })()
    ) : (
      (() => {
        const d = data as ReadingShare;
        const f = iljuFacts(d.s, d.b);
        return (
          <ReadingCard
            who={`${d.n}님의 사주`}
            ilju={{ hanja: f.hanja, name: f.name.replace("일주", "") }}
            image={f.image ?? null}
            powers={d.p.map(([group, name, pct]) => ({ group: group as never, name, pct, rank: null }))}
            kinds={d.k.map(([label, type]) => ({ label, type }))}
            same={d.r || null}
          />
        );
      })()
    );
  const name = (data as { n: string }).n;

  return (
    <>
      <style>{`@font-face{font-family:"GanzhiBrush";src:url(/fonts/ganzhi-syuku.woff2) format("woff2");font-display:block}`}</style>
      <section className="mt-6 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">{kind === "sinbun" ? "身 分 鑑 定" : "四 柱 一 張"}</p>
        <h1 className="mt-2 font-myeongjo text-2xl font-extrabold">{josa(name, "이/가")} 보내왔어요</h1>
        <p className="mt-1 text-xs text-ink-soft">{kind === "sinbun" ? "조선에 태어났다면 무엇이었을까" : "사주 한 장"} · 무료</p>
      </section>

      <section className="mt-4">{card}</section>

      <section className="mt-6">
        <Hundo>
          {kind === "sinbun" ? "그대는 조선에서 무엇이었사옵니까? 소신이 감정해 드리겠사옵니다." : "그대의 사주는 어떠하옵니까? 소신이 한 장으로 풀어 드리겠사옵니다."}
        </Hundo>
      </section>

      <section className="doc-paper mt-4 px-5 pt-6 pb-6">
        <h2 className="text-center font-myeongjo text-lg font-extrabold">{kind === "sinbun" ? "나는 조선에서 뭐였을까?" : "내 사주 한 장도 받아 보기"}</h2>
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

      <AdSlot />
    </>
  );
}
