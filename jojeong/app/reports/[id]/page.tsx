import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import AiReport from "@/components/AiReport";
import ChartIntro from "@/components/ChartIntro";
import GunghapForm from "@/components/GunghapForm";
import MeForm from "@/components/MeForm";
import PairIntro from "@/components/PairIntro";
import TaekilForm from "@/components/TaekilForm";
import TaekilResult from "@/components/TaekilResult";
import Paywall from "@/components/Paywall";
import OrderLink from "@/components/OrderLink";
import DecadeTable from "@/components/DecadeTable";
import DeepenForm from "@/components/DeepenForm";
import Keep from "@/components/Keep";
import RoyalDoc from "@/components/RoyalDoc";
import SajuChart from "@/components/SajuChart";
import SinbunReport from "@/components/SinbunReport";
import YearReport from "@/components/YearReport";
import { josa } from "@/lib/josa";
import { ownedCourts } from "@/lib/load";
import { ADULT_ONLY, FIXED_RELATION, isAdult, isOpen, isPair, OPEN_ALL, PRICE, productById, saleLabel, saleNow, type Product, type ProductId } from "@/lib/products";
import { REPORT_SPECS } from "@/lib/reportPrompts";
import { coupleOf } from "@/lib/couple";
import { forgetMeAction } from "@/app/actions";
import { readMe } from "@/lib/me";
import { decodePerson, profileOf, relationOf } from "@/lib/pairToken";
import { decadeOf, isDomain } from "@/lib/domains";
import { distinctOf } from "@/lib/rarity";
import { courtOfReader, subjectFor } from "@/lib/subject";
import { getProfile } from "@/lib/store";
import { covers, getOrder, ownedOrderFor, type Order } from "@/lib/pay";
import { isAdmin } from "@/lib/admin";
import { KINDS, parseSearch, pickDays, startMonths } from "@/lib/taekil";
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
      {subjectName && (
        <p className="mt-3 text-center text-xs font-bold text-gold">
          {product.modern ? `${subjectName}의 사주로 풀었어요` : `${subjectName}의 사주로 지어 올리옵니다`}
        </p>
      )}
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

// Every report, open in full (무료 공개 기간, a free report, or a bought one). A present-day report on sale
// (`locked`) shows everything computed for free and puts the payment where the written report would start;
// a paid order (`paid`, from its link) or one this browser bought for the same chart opens it.
type Pair = { a?: string; b?: string; rel?: string };
type Search = { kind?: string; from?: string; n?: string };

async function OpenReport({
  product,
  courtId,
  ministerId,
  targetId,
  pair,
  locked = false,
  paid,
  search = {},
}: {
  product: Product;
  courtId?: string;
  ministerId?: string;
  targetId?: string;
  pair: Pair;
  locked?: boolean;
  paid?: Order;
  search?: Search;
}) {
  const query = new URLSearchParams({ ...(courtId && { court: courtId }), ...(ministerId && { m: ministerId }) }).toString();

  // 택일: the search and chart(s) in the link (or the order), the three best days free, the rest when bought.
  if (product.id === "taekil") {
    const src = paid ? paid.req : { ...search, a: pair.a, b: pair.b };
    const found = parseSearch(src.kind, src.from, src.n, !paid);
    const a = decodePerson(src.a);
    const b = found && KINDS[found.kind].people === 2 ? decodePerson(src.b) : null;
    if (!found || !a || (KINDS[found.kind].people === 2 && !b)) {
      const saved = (await readMe())?.person.name ?? null;
      return (
        <>
          <Header product={product} />
          <section className="doc-paper mt-4 px-5 pt-6 pb-6">
            <p className="mb-4 text-center text-sm leading-relaxed text-ink-soft">{product.teaser}</p>
            <TaekilForm savedName={saved} months={startMonths()} />
          </section>
        </>
      );
    }
    const req = { product: product.id, kind: found.kind, from: src.from!, n: String(found.n), a: src.a!, ...(b && { b: src.b! }) };
    const unlock = paid ?? (locked ? await ownedOrderFor(product.id, req) : null);
    const days = pickDays(found.kind, b ? [a, b] : [a], found.from, found.n);
    return (
      <>
        <Header product={product} subjectName={b ? `${a.name}님과 ${b.name}님` : `${a.name}님`} />
        {unlock && <OrderLink id={unlock.id} />}
        <TaekilResult kind={found.kind} days={days} label={found.label} full={!locked || Boolean(unlock)} />
        {locked && !unlock && (
          <Paywall
            product={product}
            request={req}
            chapters={["기간 전체 택일 달력 (◎ ○ △)", "써도 좋은 날 모두와 날짜별 이유", "날마다 좋은 시간대", "사주와 부딪히는 날 표시"]}
            heading="기간 전체 택일 달력"
            sub="좋은 날 세 개 말고도, 기간 안의 모든 날을 풀어 드려요"
          />
        )}
        <Link href="/reports/taekil" className="mt-6 block border border-seal/40 py-3 text-center text-sm font-bold text-seal">
          다른 날짜로 다시 찾기 →
        </Link>
      </>
    );
  }

  // 궁합·속궁합·재회운: two people typed in (or the reader's own saved chart and one typed in), carried in the link.
  if (isPair(product)) {
    if (paid) pair = { a: paid.req.a, b: paid.req.b, rel: paid.req.rel };
    const a = decodePerson(pair.a);
    const b = decodePerson(pair.b);
    if (!a || !b || !pair.a || !pair.b) {
      const saved = (await readMe())?.person.name ?? (await subjectFor(product))?.name ?? null;
      return (
        <>
          <Header product={product} />
          <section className="doc-paper mt-4 px-5 pt-6 pb-6">
            <p className="mb-4 text-center text-sm leading-relaxed text-ink-soft">{product.teaser}</p>
            <GunghapForm savedName={saved} product={product.id} />
          </section>
        </>
      );
    }
    if (ADULT_ONLY.includes(product.id) && !(isAdult(a.birthYear) && isAdult(b.birthYear)))
      return (<><Header product={product} /><Notice href={`/reports/${product.id}`} cta="다시 입력하기">만 19세 이상 두 사람만 볼 수 있는 보고서예요.</Notice></>);
    const couple = coupleOf(a, b);
    const req = { product: product.id, a: pair.a, b: pair.b, rel: FIXED_RELATION[product.id] ?? relationOf(pair.rel) };
    const unlock = paid ?? (locked ? await ownedOrderFor(product.id, req) : null);
    return (
      <>
        <Header product={product} subjectName={`${a.name}님과 ${b.name}님`} />
        {couple && <PairIntro a={a} b={b} c={couple} />}
        {locked && !unlock ? (
          <Paywall
            product={product}
            request={req}
            chapters={product.toc}
            note="두 사람의 태어난 시각을 알면 먼저 넣어 주세요. 결제한 뒤 입력을 바꾸면 다른 보고서로 봐요."
          />
        ) : (
          <>
            {unlock && <OrderLink id={unlock.id} />}
            <AiReport request={unlock ? { product: product.id, order: unlock.id } : req} chapters={chaptersOf(product.id)} modern />
          </>
        )}
        <Link href={`/reports/${product.id}`} className="mt-6 block border border-seal/40 py-3 text-center text-sm font-bold text-seal">
          {product.id === "jaehoe" ? "다른 사람으로 재회운 보기" : `다른 사람과 ${product.title} 보기`} →
        </Link>
      </>
    );
  }

  // Reports about the people of one court.
  if (product.id === "dwitjosa" || product.id === "gwangye" || product.id === "insa") {
    const cid = courtId ?? (await ownedCourts(1))[0]?.id;
    const room = cid ? await courtOfReader(cid) : null;
    if (!room)
      return (
        <>
          <Header product={product} />
          <Notice href="/king#enthrone" cta="즉위하러 가기 →">
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

  // Whose chart: a court's person named in the link; else the chart remembered in this browser (lib/me.ts);
  // else a court this browser enthroned. With none, the reader enters one right here.
  const fromOrder = paid?.req.p ? decodePerson(paid.req.p) : null;
  const me = fromOrder ? { person: fromOrder, token: paid!.req.p! } : courtId ? null : await readMe();
  // A report on sale is bought for the chart remembered here (the order carries it), not a court's.
  const subject = me || locked ? null : await subjectFor(product, courtId, ministerId);
  const next = `/reports/${product.id}`;
  if (!me && !subject)
    return (
      <>
        <Header product={product} />
        <section className="doc-paper mt-4 px-5 pt-6 pb-6">
          <p className="text-center text-sm leading-relaxed text-ink-soft">{product.teaser}</p>
          {!isOpen(product) && (
            <p className="mt-2 rounded-xl bg-gold/10 px-3 py-2 text-center text-[13px] leading-relaxed">
              입력하면 <b>내 사주 분석</b>(여덟 글자의 무게, 같은 일주 속 비율, 드문 특징)은 <b>무료</b>로 바로 보여 드려요
            </p>
          )}
          <div className="mt-4">
            <MeForm next={next} />
          </div>
        </section>
      </>
    );
  const name = me ? me.person.name : subject!.name;
  const pillars = me ? me.person.pillars : subject!.pillars;
  const self = me ? true : subject!.self;
  // Someone else's chart can be entered instead; the remembered one is then replaced.
  const other = me && !paid && (
    <form action={forgetMeAction} className="mt-2 text-center">
      <input type="hidden" name="next" value={next} />
      <button type="submit" className="text-xs text-ink-soft underline">
        다른 사람 사주로 보기
      </button>
    </form>
  );

  if (product.id === "sinbun")
    return (
      <>
        <SinbunReport
          pillars={pillars}
          heading={subject?.king ? `${name} 전하가 왕이 아니었다면` : `${josa(name, "이/가")} 조선에 태어났다면`}
          query={query}
        />
        {other}
        <AdSlot />
      </>
    );

  const profile = me ? profileOf(me.person) : subject!.self ? await getProfile(subject!.courtId, subject!.who) : null;
  const reading = yearReading(pillars, profile);
  if (!reading)
    return (
      <>
        <Header product={product} />
        <section className="doc-paper mt-4 px-5 pt-6 pb-6">
          <p className="mb-4 text-center text-sm leading-relaxed text-ink-soft">
            예전 방식으로 올리신 사주라 여덟 글자가 다 갖춰지지 않았어요. 한 번만 다시 넣어 주시면 온전히 풀어 드려요.
          </p>
          <MeForm next={next} />
        </section>
      </>
    );
  const request: Record<string, string> = me
    ? { product: product.id, p: me.token }
    : { product: product.id, ...(courtId && { court: subject!.courtId }), ...(ministerId && { m: ministerId }) };
  const distinct = self ? distinctOf(pillars, profile?.gender ?? null) : null;
  const intro = distinct && <ChartIntro name={name} d={distinct} slots={reading.chart.slots} />;
  // Without gender or the hour, the remembered chart is simply entered again with them.
  // Folded: one line to add what was left blank. The birth date is asked again because it is never stored.
  // What the remembered chart lacks: gender (for 대운) and the birth hour. The palace chart is not kept in
  // the cookie, so the hour is read from the chart itself.
  const noGender = reading.missing.daeun;
  const noHour = me ? me.person.pillars.hourBranch === null : reading.missing.palaces;
  const meDeepen = me && !paid && (noGender || noHour) && (
    <details className="group doc-paper mt-4 px-5 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span>
          <b className="block font-myeongjo">
            {noGender && noHour ? "성별·태어난 시각" : noGender ? "성별" : "태어난 시각"} 추가하기
          </b>
          <span className="text-[12px] text-ink-soft">
            {locked ? "결제 전에 넣으면 10년 대운까지 넣어 써 드려요" : "넣으면 10년 대운까지 넣어 다시 써 드려요"}
          </span>
        </span>
        <span className="shrink-0 text-ink-soft transition group-open:rotate-180" aria-hidden="true">
          ▾
        </span>
      </summary>
      <p className="mt-4 mb-4 rounded-xl bg-gold/10 px-3 py-2 text-[12px] leading-relaxed">
        생년월일은 개인정보라 저장하지 않고 사주 글자만 기억해 둬요. 그래서 한 번만 다시 넣어 주세요.
      </p>
      <MeForm next={next} submit="넣고 다시 보기" defaultName={me.person.name} />
    </details>
  );
  if (product.id === "gukjeong")
    return (
      <>
        <YearReport
          reading={reading}
          heading={`${name}님의 2026년 운세`}
          deepen={!me && subject!.self ? { courtId: subject!.courtId, who: subject!.who } : null}
          query={query}
          ai={self ? { request, chapters: chaptersOf(product.id), intro } : undefined}
        />
        {meDeepen}
        {other}
      </>
    );
  if (!self)
    return (<><Header product={product} /><Notice>본인의 사주로만 열 수 있는 보고서예요.</Notice></>);
  const unlock = paid ?? (locked ? await ownedOrderFor(product.id, { product: product.id, p: me?.token }) : null);
  return (
    <>
      <Header product={product} subjectName={`${name}님`} />
      {other}
      {intro}
      <details className="group doc-paper mt-4 px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
          <span className="font-myeongjo font-extrabold">사주 원국 · 여덟 글자 보기</span>
          <span className="text-ink-soft transition group-open:rotate-180" aria-hidden="true">
            ▾
          </span>
        </summary>
        <SajuChart {...reading.chart} kingdom={false} />
      </details>
      {isDomain(product.id) && (
        <DecadeTable
          name={name}
          domain={product.id}
          years={decadeOf(product.id, pillars, me ? me.person.gender : (profile?.gender ?? null))}
          locked={locked && !unlock}
        />
      )}
      {locked && !unlock ? (
        // A bought report is written for exactly this chart, so the missing details come before the payment.
        <>
          {meDeepen}
          <Paywall product={product} request={request} chapters={product.toc} />
        </>
      ) : (
        <>
          {unlock && (
            <OrderLink
              id={unlock.id}
              others={(unlock.bundle ?? [])
                .filter((id) => id !== product.id)
                .map((id) => ({ href: `/reports/${id}?order=${unlock.id}`, title: productById(id)!.title }))}
            />
          )}
          <AiReport request={unlock ? { product: product.id, order: unlock.id } : request} chapters={chaptersOf(product.id)} modern />
          {!unlock && meDeepen}
        </>
      )}
      {!me && subject!.self && (reading.missing.daeun || reading.missing.palaces) && (
        <section className="doc-paper mt-6 px-6 pt-7 pb-6">
          <h2 className="text-center font-myeongjo text-lg font-extrabold">더 깊이 봐 드릴 수 있어요</h2>
          <p className="mt-2 mb-4 text-center text-sm leading-relaxed text-ink-soft">
            성별과 태어난 시각을 알려 주시면 10년 대운과 영역별 흐름까지 넣어 다시 써 드려요.
          </p>
          <DeepenForm courtId={subject!.courtId} who={subject!.who} />
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

  const orderId = typeof search.order === "string" ? search.order : undefined;
  const order = orderId ? await getOrder(orderId) : null;
  const paid = order && covers(order, product.id) ? order : undefined;
  if (isOpen(product) || product.modern || paid)
    return (
      <>
        <nav className="pt-4 text-sm">
          <Link href="/reports" className="font-bold text-ink-soft">
            ← 전체 보고서
          </Link>
        </nav>
        {OPEN_ALL && !product.free && (
          <p className="mt-3 rounded-full bg-gold/15 px-4 py-2 text-center text-xs font-bold text-gold">{product.modern ? "무료 공개 기간 · 지금은 모든 보고서를 무료로 보실 수 있어요" : "무료 공개 기간 · 지금은 모든 보고서를 그냥 보실 수 있사옵니다"}</p>
        )}
        <OpenReport
          product={product}
          courtId={courtId}
          ministerId={ministerId}
          targetId={typeof search.t === "string" ? search.t : undefined}
          pair={{
            a: typeof search.a === "string" ? search.a : undefined,
            b: typeof search.b === "string" ? search.b : undefined,
            rel: typeof search.rel === "string" ? search.rel : undefined,
          }}
          locked={!isOpen(product) && !paid && !(await isAdmin())}
          paid={paid}
          search={{
            kind: typeof search.kind === "string" ? search.kind : undefined,
            from: typeof search.from === "string" ? search.from : undefined,
            n: typeof search.n === "string" ? search.n : undefined,
          }}
        />
      </>
    );

  // Left here: the Joseon reports of a court, on sale. They are not sold yet, so this is the preview.
  const subject = await subjectFor(product, courtId, ministerId);
  const sale = saleNow();

  return (
    <>
      <nav className="pt-4 text-sm">
        <Link href="/reports" className="font-bold text-ink-soft">
          ← 전체 보고서
        </Link>
      </nav>

      <RoyalDoc className="mt-3" paperClassName="px-5">
        <p className="text-center font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">{product.hanja}</p>
        <h1 className="mt-2 text-center font-myeongjo text-2xl font-extrabold">{product.title}</h1>
        <p className="mt-2 text-center text-sm leading-snug text-ink-soft">
          <Keep clauses>{product.tagline}</Keep>
        </p>
        {subject && (
          <p className="mt-3 text-center text-xs font-bold text-gold">
            {subject.name} 님의 사주로 지어 올리옵니다
          </p>
        )}

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
                <Link href="/king#enthrone" className="mt-2 block font-myeongjo font-extrabold text-seal">
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
          {sale ? (
            <>
              <p className="text-xs font-extrabold text-seal">{saleLabel(sale)}</p>
              <p className="mt-1 flex items-baseline justify-center gap-2">
                <s className="text-base text-ink-soft">{PRICE.toLocaleString("ko-KR")}원</s>
                <span className="font-myeongjo text-3xl font-extrabold text-seal">{sale.price.toLocaleString("ko-KR")}원</span>
              </p>
            </>
          ) : (
            <p className="font-myeongjo text-3xl font-extrabold text-seal">{PRICE.toLocaleString("ko-KR")}원</p>
          )}
          <button
            type="button"
            disabled
            className="mt-4 w-full rounded-2xl bg-seal/60 py-4 font-myeongjo text-lg font-extrabold text-hanji"
          >
            결제 준비 중이에요
          </button>
          <p className="mt-3 text-left text-[11px] leading-relaxed text-ink-soft">
            보고서는 결제 즉시 열리는 디지털 콘텐츠라, 열람을 시작한 뒤에는 전자상거래법에 따라 청약철회가 제한돼요. 결제 전에
            위의 목차와 맛보기로 내용을 확인해 주세요. 보고서가 안내한 내용과 다르게 제공된 경우에는 받은 날부터 3개월 이내에
            환불을 요청할 수 있어요. 자세한 내용은{" "}
            <Link href="/refund" className="whitespace-nowrap underline">
              환불 규정
            </Link>
            을 확인해 주세요.
          </p>
        </div>
      </RoyalDoc>
    </>
  );
}
