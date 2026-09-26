import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import AiReport from "@/components/AiReport";
import DeepenForm from "@/components/DeepenForm";
import Keep from "@/components/Keep";
import RoyalDoc from "@/components/RoyalDoc";
import SajuChart from "@/components/SajuChart";
import SinbunReport from "@/components/SinbunReport";
import YearReport from "@/components/YearReport";
import { josa } from "@/lib/josa";
import { PURCHASES_COOKIE } from "@/lib/cookies";
import { ownedCourts } from "@/lib/load";
import { isOpen, OPEN_ALL, PRICE_STEPS, priceFor, productById, type Product, type ProductId } from "@/lib/products";
import { REPORT_SPECS } from "@/lib/reportPrompts";
import { courtOfReader, subjectFor } from "@/lib/subject";
import { getProfile } from "@/lib/store";
import { yearReading } from "@/lib/yearly";

export async function generateMetadata({ params }: PageProps<"/reports/[id]">): Promise<Metadata> {
  const product = productById((await params).id);
  return product ? { title: product.title, description: product.tagline } : {};
}

function Header({ product, subjectName }: { product: Product; subjectName?: string }) {
  return (
    <RoyalDoc className="mt-3" paperClassName="px-5">
      <p className="text-center font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">{product.hanja}</p>
      <h1 className="mt-2 text-center font-myeongjo text-2xl font-extrabold">{product.title}</h1>
      <p className="mt-2 text-center text-sm leading-snug text-ink-soft">
        <Keep clauses>{product.tagline}</Keep>
      </p>
      {subjectName && <p className="mt-3 text-center text-xs font-bold text-gold">{subjectName}의 사주로 지어 올리옵니다</p>}
    </RoyalDoc>
  );
}

function Notice({ children, href, cta }: { children: React.ReactNode; href?: string; cta?: string }) {
  return (
    <div className="doc-paper mt-4 px-5 py-6 text-center text-sm leading-relaxed">
      <p>{children}</p>
      {href && (
        <Link href={href} className="mt-4 block bg-seal py-3 font-myeongjo font-extrabold text-hanji">
          {cta}
        </Link>
      )}
    </div>
  );
}

const chaptersOf = (id: ProductId) => REPORT_SPECS[id]?.chapters ?? [];

// Every report, open in full (무료 공개 기간 or a free report).
async function OpenReport({ product, courtId, ministerId, targetId }: { product: Product; courtId?: string; ministerId?: string; targetId?: string }) {
  const query = new URLSearchParams({ ...(courtId && { court: courtId }), ...(ministerId && { m: ministerId }) }).toString();

  // Reports about the people of one court.
  if (product.id === "dwitjosa" || product.id === "gwangye" || product.id === "insa") {
    const cid = courtId ?? (await ownedCourts(1))[0]?.id;
    const room = cid ? await courtOfReader(cid) : null;
    if (!room)
      return (
        <>
          <Header product={product} />
          <Notice href="/#enthrone" cta="즉위하러 가기 →">
            조정에서 여는 보고서이옵니다. 즉위하시거나 받으신 초대 링크로 입궐한 뒤, 조정 화면에서 여시옵소서.
          </Notice>
        </>
      );
    const { court, ministers, isKing, me } = room;
    if (product.id === "dwitjosa") {
      if (!isKing) return (<><Header product={product} /><Notice>전하만 신하를 뒷조사하실 수 있사옵니다.</Notice></>);
      const target = ministers.find((m) => m.id === targetId);
      if (!target)
        return (
          <>
            <Header product={product} subjectName={`${court.kingName} 전하`} />
            <section className="doc-paper mt-4 px-5 py-5">
              <p className="text-center font-myeongjo font-extrabold">누구를 뒷조사하시겠사옵니까?</p>
              {ministers.length ? (
                <ul className="mt-3 grid grid-cols-2 gap-2">
                  {ministers.map((m) => (
                    <li key={m.id}>
                      <Link href={`/reports/dwitjosa?court=${court.id}&t=${m.id}`} className="block border border-seal/30 bg-white/60 py-3 text-center font-bold">
                        {m.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-center text-sm text-ink-soft">아직 입궐한 신하가 없사옵니다. 먼저 신하를 불러 주시옵소서.</p>
              )}
            </section>
          </>
        );
      return (
        <>
          <Header product={product} subjectName={`${court.kingName} 전하와 ${target.name}`} />
          <AiReport request={{ product: product.id, court: court.id, t: target.id }} chapters={chaptersOf(product.id)} />
        </>
      );
    }
    if (product.id === "insa") {
      const mine = ministers.find((m) => m.id === me);
      if (!mine) return (<><Header product={product} /><Notice>입궐한 신하 본인만 여실 수 있사옵니다. 받으신 교지에서 이 보고서를 여시옵소서.</Notice></>);
      return (
        <>
          <Header product={product} subjectName={mine.name} />
          <AiReport request={{ product: product.id, court: court.id }} chapters={chaptersOf(product.id)} />
        </>
      );
    }
    if (ministers.length < 2)
      return (<><Header product={product} /><Notice href={`/court/${court.id}`} cta="조정으로 가기 →">모임 관계도는 신하가 두 명 이상 모이면 열리옵니다.</Notice></>);
    return (
      <>
        <Header product={product} subjectName={`${court.kingName} 전하의 조정 ${ministers.length + 1}명`} />
        <AiReport request={{ product: product.id, court: court.id }} chapters={chaptersOf(product.id)} />
      </>
    );
  }

  const subject = await subjectFor(product, courtId, ministerId);
  if (!subject)
    return (
      <>
        <Header product={product} />
        <Notice href="/#enthrone" cta="즉위하고 무료로 보기 →">
          {product.teaser}
        </Notice>
      </>
    );

  if (product.id === "sinbun")
    return (
      <SinbunReport
        pillars={subject.pillars}
        heading={subject.king ? `${subject.name} 전하가 왕이 아니었다면` : `${josa(subject.name, "이/가")} 조선에 태어났다면`}
        query={query}
      />
    );

  const profile = subject.self ? await getProfile(subject.courtId, subject.who) : null;
  const reading = yearReading(subject.pillars, profile);
  if (!reading)
    return (
      <>
        <Header product={product} />
        <Notice href="/#enthrone" cta="새로 즉위하기 →">
          예전 방식으로 올리신 사주라 여덟 글자가 다 갖춰지지 않았사옵니다. 새로 즉위하시면 온전히 풀어 드리옵니다.
        </Notice>
      </>
    );
  const request = { product: product.id, ...(courtId && { court: subject.courtId }), ...(ministerId && { m: ministerId }) };
  if (product.id === "gukjeong")
    return (
      <YearReport
        reading={reading}
        heading={subject.king ? `${subject.name} 전하의 병오년 운세` : `${subject.name} 님의 병오년 운세`}
        deepen={subject.self ? { courtId: subject.courtId, who: subject.who } : null}
        query={query}
        ai={subject.self ? { request, chapters: chaptersOf(product.id) } : undefined}
      />
    );
  if (!subject.self)
    return (<><Header product={product} /><Notice>본인의 사주로만 여실 수 있는 보고서이옵니다.</Notice></>);
  return (
    <>
      <Header product={product} subjectName={subject.king ? `${subject.name} 전하` : `${subject.name} 님`} />
      <details className="group doc-paper mt-4 px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
          <span className="font-myeongjo font-extrabold">사주 원국 · 여덟 글자 보기</span>
          <span className="text-ink-soft transition group-open:rotate-180" aria-hidden="true">
            ▾
          </span>
        </summary>
        <SajuChart {...reading.chart} kingdom={false} />
      </details>
      <AiReport request={request} chapters={chaptersOf(product.id)} />
      {subject.self && (reading.missing.daeun || reading.missing.palaces) && (
        <section className="doc-paper mt-6 px-6 pt-7 pb-6">
          <h2 className="text-center font-myeongjo text-lg font-extrabold">더 깊이 보아 드릴 수 있사옵니다</h2>
          <p className="mt-2 mb-4 text-center text-sm leading-relaxed text-ink-soft">
            성별과 태어난 시각을 알려 주시면 10년 대운과 영역별 흐름까지 넣어 다시 적어 올리옵니다.
          </p>
          <DeepenForm courtId={subject.courtId} who={subject.who} />
        </section>
      )}
    </>
  );
}

export default async function ReportPage({ params, searchParams }: PageProps<"/reports/[id]">) {
  const product = productById((await params).id);
  if (!product) notFound();
  const search = await searchParams;
  const courtId = typeof search.court === "string" ? search.court : undefined;
  const ministerId = typeof search.m === "string" ? search.m : undefined;

  if (isOpen(product))
    return (
      <>
        <nav className="pt-4 text-sm">
          <Link href="/reports" className="font-bold text-ink-soft">
            ← 보고서 목록
          </Link>
        </nav>
        {OPEN_ALL && !product.free && (
          <p className="mt-3 rounded-full bg-gold/15 px-4 py-2 text-center text-xs font-bold text-gold">무료 공개 기간 · 지금은 모든 보고서를 그냥 보실 수 있사옵니다</p>
        )}
        <OpenReport product={product} courtId={courtId} ministerId={ministerId} targetId={typeof search.t === "string" ? search.t : undefined} />
      </>
    );

  const subject = await subjectFor(product, courtId, ministerId);
  const bought = Number((await cookies()).get(PURCHASES_COOKIE)?.value ?? 0);
  const price = priceFor(bought);

  return (
    <>
      <nav className="pt-4 text-sm">
        <Link href="/reports" className="font-bold text-ink-soft">
          ← 비밀 보고서 목록
        </Link>
      </nav>

      <RoyalDoc className="mt-3" paperClassName="px-5">
        <p className="text-center font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">{product.hanja}</p>
        <h1 className="mt-2 text-center font-myeongjo text-2xl font-extrabold">{product.title}</h1>
        <p className="mt-2 text-center text-sm leading-snug text-ink-soft">
          <Keep clauses>{product.tagline}</Keep>
        </p>
        {subject && <p className="mt-3 text-center text-xs font-bold text-gold">{subject.name} 님의 사주로 지어 올리옵니다</p>}

        <ol className="mt-5 flex flex-col divide-y divide-seal/15 border-y-[3px] border-double border-seal/40 px-1">
          {product.toc.map((item, i) => (
            <li key={item} className="flex items-center gap-2 py-2 text-[15px]">
              <span className="font-myeongjo font-extrabold text-seal">{i < 9 ? "一二三四五六七八九"[i] : i + 1}</span>
              <span className="flex-1">{item}</span>
              <span className="text-xs text-ink-soft">{i === 0 ? "맛보기" : "🔒"}</span>
            </li>
          ))}
        </ol>

        {/* 맛보기: the first chapter, free */}
        <div className="mt-5 border-l-[3px] border-seal/60 py-1 pl-3">
          <p className="text-xs font-extrabold text-seal">제一장 맛보기 · {product.toc[0]}</p>
          <p className="mt-2 text-[15px] leading-relaxed">{product.teaser}</p>
        </div>

        {!subject && (
          <p className="mt-4 bg-seal/5 px-4 py-3 text-center text-sm leading-relaxed">
            {product.for === "minister"
              ? "전하의 조정에 입궐한 신하만 볼 수 있는 보고서이옵니다. 받으신 교지에서 이 보고서를 여시옵소서."
              : "먼저 즉위하시면 전하의 사주로 맛보기를 지어 올리옵니다."}
            {product.for !== "minister" && (
              <Link href="/#enthrone" className="mt-2 block font-myeongjo font-extrabold text-seal">
                즉위하러 가기 →
              </Link>
            )}
          </p>
        )}

        {/* The rest stays locked until payment; placeholder lines only, so nothing paid is in the page source. */}
        <div className="relative mt-5 overflow-hidden" aria-hidden="true">
          <div className="flex flex-col gap-2 blur-[5px] select-none">
            {[92, 80, 88, 70, 85, 60].map((w, i) => (
              <span key={i} className="h-3.5 rounded bg-ink/15" style={{ width: `${w}%` }} />
            ))}
          </div>
          <span className="absolute inset-0 flex items-center justify-center font-myeongjo text-sm font-extrabold text-seal">
            🔒 나머지 {product.toc.length - 1}장은 복채를 주시면 열리옵니다
          </span>
        </div>

        <div className="mt-6 border-t border-seal/20 pt-5 text-center">
          <p className="font-myeongjo text-3xl font-extrabold text-seal">{price.toLocaleString("ko-KR")}원</p>
          <p className="mt-1 text-xs text-ink-soft">
            <span className="inline-block">복채 단골 할인 ·</span>{" "}
            <span className="inline-block">살 때마다 100원씩 내려가 {PRICE_STEPS[PRICE_STEPS.length - 1]}원까지</span>
          </p>
          <button
            type="button"
            disabled
            className="mt-4 w-full rounded-2xl bg-seal/60 py-4 font-myeongjo text-lg font-extrabold text-hanji"
          >
            결제 준비 중 · 곧 열리옵니다
          </button>
          <p className="mt-3 text-left text-[11px] leading-relaxed text-ink-soft">
            보고서는 결제 즉시 열리는 디지털 콘텐츠라, 열람을 시작한 뒤에는 전자상거래법에 따라 청약철회가 제한되옵니다.
            결제 전 위의 목차와 맛보기로 내용을 확인해 주시옵소서. 보고서가 안내한 내용과 다르게 제공된 경우에는 받은 날부터
            3개월 이내에 환불을 요청하실 수 있사옵니다. 자세한 내용은{" "}
            <Link href="/refund" className="whitespace-nowrap underline">
              환불 규정
            </Link>
            을 보시옵소서.
          </p>
        </div>
      </RoyalDoc>
    </>
  );
}
