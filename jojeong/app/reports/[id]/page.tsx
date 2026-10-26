import KeepNote, { BonusTop } from "@/components/KeepNote";
import ReportFeedback from "@/components/ReportFeedback";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import AiReport from "@/components/AiReport";
import ChartIntro from "@/components/ChartIntro";
import GunghapForm from "@/components/GunghapForm";
import MeForm from "@/components/MeForm";
import IntimacyIntro from "@/components/IntimacyIntro";
import PairIntro, { MiniChart } from "@/components/PairIntro";
import ReunionIntro from "@/components/ReunionIntro";
import TaekilForm from "@/components/TaekilForm";
import TaekilResult from "@/components/TaekilResult";
import Paywall from "@/components/Paywall";
import OrderLink from "@/components/OrderLink";
import DecadeTable from "@/components/DecadeTable";
import DomainCard from "@/components/DomainCard";
import FreeReading from "@/components/FreeReading";
import ShareResult from "@/components/ShareResult";
import AskCard from "@/components/AskCard";
import ChannelCard from "@/components/ChannelCard";
import { ReadingCard, SinbunCard } from "@/components/ResultCards";
import { iljuFacts } from "@/lib/cards";
import { sinbunStory } from "@/lib/sinbun";
import { sealCard, sealPerson } from "@/lib/shareToken";
import NextStep from "@/components/NextStep";
import TrackLink from "@/components/TrackLink";
import { STEPS } from "@/lib/nextStep";
import { freeReadingOf } from "@/lib/freeReading";
import DeepenForm from "@/components/DeepenForm";
import Keep from "@/components/Keep";
import RoyalDoc from "@/components/RoyalDoc";
import SajuChart from "@/components/SajuChart";
import SinbunReport from "@/components/SinbunReport";
import YearReport from "@/components/YearReport";
import { YearList, YearTop } from "@/components/Yeonun";
import YearGlance from "@/components/YearGlance";
import { newYearOf, newYearProduct, sajuYear, thisYear, yearDetail, yearOf, yearRange, yearRows } from "@/lib/yeonun";
import { josa } from "@/lib/josa";
import { hanjaKo } from "@/lib/saju";
import { ownedCourts } from "@/lib/load";
import { ADULT_ONLY, FIXED_RELATION, FREE_LOCK, isAdult, isOpen, isPair, PRICE, productById, saleLabel, saleNow, YEONUN_PAST_TOC, type Product, type ProductId } from "@/lib/products";
import { chaptersFor, isV8, REPORT_SPECS, yearChaptersFor } from "@/lib/reportPrompts";
import { pricingNow } from "@/lib/pricing";
import CalendarButton from "@/components/CalendarButton";
import { PairYearsFigure, YearsAheadFigure } from "@/components/PaidFigures";
import { BondFigure, BondMonthsFigure } from "@/app/ask/Figures";
import { bondOf } from "@/lib/bond";
import { isGunghapV2, pairYearsAt, REL_OF } from "@/lib/pairYears";
import { isEngine2, isEngine3 } from "@/lib/patterns";
import { askShown } from "@/lib/members";
import { coupleOf, type Couple } from "@/lib/couple";
import { intimacyOf } from "@/lib/intimacy";
import { reunionOf } from "@/lib/reunion";
import { readMe } from "@/lib/me";
import { decodePerson, profileOf, relationOf, type Person } from "@/lib/pairToken";
import type { Relation } from "@/lib/relations";
import { decadeOf, domainCard, isDomain } from "@/lib/domains";
import { distinctOf } from "@/lib/rarity";
import { courtOfReader, subjectFor } from "@/lib/subject";
import { getProfile } from "@/lib/store";
import { covers, getOrder, ownedOrderFor, ownedOrders, readAtOf, type Order } from "@/lib/pay";
import { isAdmin, isPreview } from "@/lib/admin";
import { renewNow } from "@/lib/launch";
import { ActionsFigure, AreaFigure, WhenFigure, SieveFigure, ChartTop, DecadeLayerFigure, ElementsFigure, FamilyFigure, FlowFigure, LendsFigure, MomentsFigure, MonthsStrip, NowFigure, PairCharts, PowersFigure, RareFigure } from "@/components/ReportFigures";
import { readChart } from "@/lib/myeongri";
import { YearTeaser } from "@/components/YearAhead";
import { decadeTags, layersOf, manseOf, salSeats, yearPreviewOf } from "@/lib/freePreview";
import TrackView from "@/components/TrackView";
import { saleKey } from "@/lib/sales";
import { bestDays, KINDS, OFFERED, parseSearch, pickDays, searchDay, startMonths } from "@/lib/taekil";
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
// A bought two-person report; 궁합 from v8 on with its pictures (the two people, their ten years, their six months).
async function PairReport({ order, product, a, b, rel, couple, request }: { order: Order; product: Product; a: Person; b: Person; rel: Relation; couple?: Couple | null; request: Record<string, string> }) {
  const at = paidAtOf(order);
  let figures: Record<number, React.ReactNode> | undefined;
  if (product.id === "gunghap" && isV8(order)) {
    // Bought before 궁합 1단계 (and not written again since): the pictures as its pinned text knew them.
    const readAt = readAtOf(order, product.id);
    const years = pairYearsAt(a, b, rel, thisYear(new Date(at)), 10, readAt);
    const bond = bondOf(a, b, b.name, REL_OF[rel], at, isGunghapV2(readAt));
    figures = {
      ...(bond && { 1: <BondFigure b={bond} name={a.name} />, 8: <BondMonthsFigure b={bond} name={a.name} /> }),
      ...(years && { 7: <PairYearsFigure x={years} a={a.name} b={b.name} /> }),
      // The second pass (lib/open.ts RENEW2): the element each needs, held by the other (chapter 2 lists the rest).
      ...(couple &&
        figuresFor(chaptersFor(product.id, true), [
          ["채워 주는 것", <LendsFigure key="l" c={couple} a={a.name} b={b.name} />],
        ])),
    };
  }
  return <AiReport request={request} modern {...(await extrasOf(order, product))} figures={figures} plain={Boolean(couple)} />;
}

// What a report bought in the opened shop adds (lib/reportPrompts.ts isV8): its chapters as bought, the 한눈에 card
// to keep and "이 장, 정 훈도에게 더 묻기". Orders from before the opening open as they did.
const paidAtOf = (o: Order) => o.paidAt ?? o.createdAt;
// The owner's stand-in order is "bought" as the page is read.
const stampNow = () => Date.now();

// "결제한 보고서 바로 읽기": what was paid for, one tap from the top (to #report-start).
function Jump({ gift, title, chapters }: { gift?: boolean; title: string; chapters: number }) {
  return (
    <a href="#report-start" className="mt-4 flex items-center justify-between rounded-2xl bg-seal px-5 py-4 font-myeongjo text-hanji shadow-[0_5px_0_#7d1a14]">
      <span>
        <b className="block text-[17px]">{gift ? "받은" : "결제한"} 보고서 바로 읽기</b>
        <span className="text-[12px] font-normal opacity-80">
          {title} · {chapters}장
        </span>
      </span>
      <span className="text-xl" aria-hidden>
        ↓
      </span>
    </a>
  );
}

// The pictures of the second pass (lib/open.ts RENEW2), put on the chapter whose question holds `kw`.
function figuresFor(chapters: string[], items: [string, React.ReactNode][]): Record<number, React.ReactNode> {
  const out: Record<number, React.ReactNode> = {};
  for (const [kw, node] of items) {
    const i = chapters.findIndex((c) => c.includes(kw));
    if (i >= 0 && node) out[i] = node;
  }
  return out;
}
const AREA_WHAT: Record<string, string> = { 돈: "돈과 재물", 일: "일과 자리", 사랑: "사랑과 인연", 사람: "사람과 귀인", 몸: "몸과 마음" };
async function extrasOf(o: Order, product: Product) {
  const v8 = isV8(o);
  return {
    chapters: chaptersFor(product.id, v8),
    ask: v8 && (await askShown()) ? product.title : undefined,
    // The chart the report reads (one person's, or the reader's of two): the chapter's question opens a room on it.
    askChart: o.req.p ?? o.req.a,
    save: v8 ? `hundo-${product.id}` : undefined,
  };
}

// What a two-person report shows free, before the written part.
const PAIR_FREE: Partial<Record<ProductId, string>> = {
  gunghap: "궁합 점수와 서로에게 어떤 사람인지는 무료로 바로 보여 드려요",
  sokgunghap: "두 사람의 애정 온도 유형과 끌림의 표시는 무료로 바로 보여 드려요",
  jaehoe: "두 사람 사이에 남은 끈과 다시 닿기 좋은 해는 무료로 바로 보여 드려요",
};

// Every report, open in full (a free report, or a bought one). A present-day report on sale
// (`locked`) shows everything computed for free and puts the payment where the written report would start;
// a paid order (`paid`, from its link) or one this browser bought for the same chart opens it.
type Pair = { a?: string; b?: string; rel?: string };
type Search = { kind?: string; from?: string; n?: string; y?: string };

async function OpenReport({
  product,
  courtId,
  ministerId,
  targetId,
  pair,
  locked = false,
  paid,
  search = {},
  fresh = false,
  preview = false,
}: {
  product: Product;
  courtId?: string;
  ministerId?: string;
  targetId?: string;
  pair: Pair;
  locked?: boolean;
  paid?: Order;
  search?: Search;
  fresh?: boolean;
  // 시안 모드 (lib/admin.ts isPreview): the free screen being readied, on the life report, for the owner only.
  preview?: boolean;
}) {
  const query = new URLSearchParams({ ...(courtId && { court: courtId }), ...(ministerId && { m: ministerId }) }).toString();
  // The second pass on bought reports (lib/open.ts RENEW2; 시안 모드 before it is on): only for what was bought
  // in the opened shop, never for a report bought before the opening.
  const renew = await renewNow();
  // The owner's quick look (/admin "보고서 바로 확인", no order): the report as one bought now would open, with the
  // second pass, so it can be checked before RENEW2 is on. A stand-in order with no id; its writing asks v9.
  const ownerView = !locked && !paid && (await isAdmin());
  const asOwner = (req: Record<string, string | undefined>): Order | null =>
    ownerView ? ({ id: "", product: product.id, req, who: "관리자", amount: 0, status: "paid", shop: "a", createdAt: stampNow() } as unknown as Order) : null;
  const r2 = (o: Order | null | undefined) => Boolean(o && isV8(o) && (renew || o.id === ""));
  // What the written report is asked with: the order, or for the owner's look the request itself (as v9).
  const reqOf = (o: Order, base: Record<string, string | undefined>): Record<string, string> =>
    o.id ? { product: product.id, order: o.id } : (Object.fromEntries(Object.entries({ ...base, product: product.id, v: "9" }).filter(([, v]) => v !== undefined)) as Record<string, string>);

  // 택일: the search and chart(s) in the link (or the order); how many good days there are is free, the days themselves when bought.
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
            <p className="text-center text-sm leading-relaxed text-ink-soft">{product.teaser}</p>
            {locked ? <p className="mt-2 mb-4 text-center text-[13px] font-bold text-seal">조건에 맞는 길일이 몇 날인지는 무료로 먼저 보여 드려요</p> : <div className="mb-4" />}
            <TaekilForm savedName={saved} months={startMonths()} initial={OFFERED.find((k) => k === search.kind)} />
          </section>
        </>
      );
    }
    const req = { product: product.id, kind: found.kind, from: src.from!, n: String(found.n), a: src.a!, ...(b && { b: src.b! }), d: searchDay(paid?.req.d) };
    const unlock = paid ?? (locked ? await ownedOrderFor(product.id, req) : asOwner(req));
    const days = pickDays(found.kind, b ? [a, b] : [a], found.from, found.n);
    const full = !locked || Boolean(unlock);
    return (
      <>
        <Header product={product} subjectName={b ? `${a.name}님과 ${b.name}님` : `${a.name}님`} />
        {unlock?.id && <OrderLink id={unlock.id} />}
        {r2(unlock) && (
          <>
            <Jump gift={unlock!.gift} title={`택일 · ${KINDS[found.kind].title}`} chapters={chaptersFor(product.id, true).length} />
            <PairCharts a={<MiniChart person={a} blank="모름" />} b={b ? <MiniChart person={b} blank="모름" /> : null} />
          </>
        )}
        <TaekilResult kind={found.kind} days={days} label={found.label} names={b ? `${a.name}님과 ${b.name}님` : `${a.name}님`} full={full} once={r2(unlock)} />
        {unlock && isV8(unlock) && (
          <CalendarButton
            name={`정 훈도 택일 · ${KINDS[found.kind].title}`}
            file={`hundo-taekil-${found.kind}`}
            events={bestDays(days, found.kind).map((d, i) => ({
              date: d.date,
              title: `${i === 0 ? "◎ " : ""}${KINDS[found.kind].title} 좋은 날 (정 훈도 택일 ${i + 1}순위)`,
              note: [d.hours.length ? `좋은 시간 ${d.hours.join(", ")}` : "", d.ceremony ? `예식 시간 ${d.ceremony}` : "", `${d.lunar} ${d.gz}`].filter(Boolean).join("\n"),
            }))}
          />
        )}
        {full ? (
          <>
            <h2 id="report-start" className="mt-8 scroll-mt-4 text-center font-myeongjo text-lg font-extrabold">정 훈도의 택일 소견서</h2>
            <p className="mt-1 text-center text-xs text-ink-soft">위의 날짜를 두고, 왜 이 날인지와 그날 할 일을 직접 풀어 드려요</p>
            {unlock ? (
              <AiReport
                request={reqOf(unlock, req)}
                modern
                {...(await extrasOf(unlock, product))}
                figures={
                  r2(unlock)
                    ? figuresFor(chaptersFor(product.id, true), [
                        // The chosen days, their reasons and hours are open above: here, how they were sieved.
                        ["흔한 길일표", <SieveFigure key="s" days={days} names={(b ? [a, b] : [a]).map((x) => `${x.name}님`).join("·")} />],
                      ])
                    : undefined
                }
              />
            ) : (
              <AiReport request={req} chapters={chaptersOf(product.id)} modern />
            )}
          </>
        ) : (
          <Paywall
            product={product}
            request={req}
            chapters={[
              "가장 좋은 날 세 개와 한눈에 고르기 (가장 빠른 날·주말·평일)",
              "날짜마다 좋은 이유를 쉬운 말로",
              KINDS[found.kind].hours,
              "기간 전체 택일 달력과 써도 좋은 날 모두",
              "책력에는 좋다는데 사주와 부딪혀 빼 둔 날",
              "정 훈도의 택일 소견서 (왜 이 날인지, 그날 할 일)",
            ]}
            heading="택일 보고서"
            sub="날짜만이 아니라, 왜 그 날이고 그날 무엇을 할지까지 풀어 드려요"
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
            <p className="text-center text-sm leading-relaxed text-ink-soft">{product.teaser}</p>
            {locked ? <p className="mt-2 mb-4 text-center text-[13px] font-bold text-seal">{PAIR_FREE[product.id]}</p> : <div className="mb-4" />}
            <GunghapForm savedName={saved} product={product.id} />
          </section>
        </>
      );
    }
    if (ADULT_ONLY.includes(product.id) && !(isAdult(a.birthYear) && isAdult(b.birthYear)))
      return (<><Header product={product} /><Notice href={`/reports/${product.id}`} cta="다시 입력하기">만 19세 이상 두 사람만 볼 수 있는 보고서예요.</Notice></>);
    const req = { product: product.id, a: pair.a, b: pair.b, rel: FIXED_RELATION[product.id] ?? relationOf(pair.rel) };
    const unlock = paid ?? (locked ? await ownedOrderFor(product.id, req) : asOwner(req));
    // A bought 궁합·재회운 shows the years as of its order (opened by its link or found as this buyer's), the same
    // ones its pinned text was written with.
    const boughtAt = unlock?.id ? (unlock.paidAt ?? unlock.createdAt) : undefined;
    const readAt = unlock?.id ? readAtOf(unlock, product.id) : undefined;
    const couple = product.id === "gunghap" ? coupleOf(a, b, boughtAt ? sajuYear(new Date(boughtAt)) : undefined, REL_OF[relationOf(pair.rel)], isEngine2(readAt), isEngine3(readAt)) : null;
    // The free card's years are the first five rows of the bought report's ten-year table, so the two never disagree.
    const coupleYears = couple ? (pairYearsAt(a, b, relationOf(pair.rel), thisYear(boughtAt ? new Date(boughtAt) : undefined), 5, readAt)?.rows ?? []) : [];
    const closeness = product.id === "sokgunghap" ? intimacyOf(a, b) : null;
    const reunion = product.id === "jaehoe" ? reunionOf(a, b, boughtAt ? sajuYear(new Date(boughtAt)) : undefined, undefined, isEngine3(readAt)) : null;
    return (
      <>
        <Header product={product} subjectName={`${a.name}님과 ${b.name}님`} />
        {couple && <PairIntro a={a} b={b} c={couple} years={coupleYears} blank={renew ? "모름" : undefined} bare={r2(unlock)} />}
        {closeness && <IntimacyIntro a={a} b={b} x={closeness} />}
        {reunion && <ReunionIntro a={a} b={b} r={reunion} />}
        {locked && !unlock ? (
          <Paywall
            product={product}
            request={req}
            chapters={chaptersFor(product.id, (await pricingNow()) === "a")}
            note="두 사람의 태어난 시각을 알면 먼저 넣어 주세요. 결제한 뒤 입력을 바꾸면 다른 보고서로 봐요."
          />
        ) : (
          <>
            {unlock?.id && <OrderLink id={unlock.id} />}
            {r2(unlock) && <Jump gift={unlock!.gift} title={product.title} chapters={chaptersFor(product.id, true).length} />}
            {unlock ? (
              <div id="report-start" className="scroll-mt-4">
                <PairReport order={unlock} product={product} a={a} b={b} rel={req.rel} couple={r2(unlock) ? couple : null} request={reqOf(unlock, req)} />
              </div>
            ) : (
              <AiReport request={req} chapters={chaptersOf(product.id)} modern />
            )}
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
  // `fresh` (?new=1, "다른 사람 사주로 보기"): skip the remembered chart and the enthroned court, and ask.
  const me = fromOrder ? { person: fromOrder, token: paid!.req.p! } : courtId || fresh ? null : await readMe();
  // A report on sale is bought for the chart remembered here (the order carries it), not a court's.
  const subject = me || locked || fresh ? null : await subjectFor(product, courtId, ministerId);
  // 연운 opened on one year (the 신년운세 link) comes back to that year once the chart is entered.
  const base = `/reports/${product.id}`;
  const next = product.id === "yeonun" && /^\d{4}$/.test(search.y ?? "") ? `${base}?y=${search.y}` : base;
  const newYear = product.id === "yeonun" ? newYearOf() : null;
  if (!me && !subject)
    return (
      <>
        <Header product={newYear !== null && search.y === String(newYear) ? newYearProduct(product, newYear) : product} />
        <section className="doc-paper mt-4 px-5 pt-6 pb-6">
          <p className="text-center text-sm leading-relaxed text-ink-soft">{product.teaser}</p>
          {isOpen(product) ? (
            <p className="mt-2 rounded-xl bg-gold/10 px-3 py-2 text-center text-[13px] leading-relaxed">
              <b>결제 없이 무료</b>로 바로 보여 드려요
            </p>
          ) : (
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
  // Someone else's chart can be entered instead, from a remembered chart or a court's; saving it replaces the
  // remembered one.
  const other = !paid && (
    <p className="mt-2 text-center">
      <Link href={`${next}${next.includes("?") ? "&" : "?"}new=1`} className="text-xs text-ink-soft underline">
        다른 사람 사주로 보기
      </Link>
    </p>
  );

  if (product.id === "sinbun") {
    const gender = me ? me.person.gender : null;
    const sinbun = sinbunStory(pillars, gender);
    return (
      <>
        <SinbunReport
          pillars={pillars}
          gender={gender}
          heading={subject?.king ? `${name} 전하가 왕이 아니었다면` : `${josa(name, "이/가")} 조선에 태어났다면`}
          query={query}
        />
        {self && me && (
          <ShareResult
            name={name}
            file="hundosaju-sinbun"
            from="sinbun"
            paths={{
              summary: `/s/sinbun/${sealCard("sinbun", { n: name.slice(0, 12), r: sinbun.rank, j: sinbun.job, l: sinbun.line, w: sinbun.rise, y: sinbun.yong })}`,
              full: `/s/sinbun/${sealPerson("sinbun", me.person)}`,
            }}
            texts={{
              // The result itself goes with the link: a friend opens a line about someone, not an ad.
              summary: `조선에 태어났다면 나는 '${sinbun.job}' · 너는 뭐였을지 봐 봐 (훈도사주)`,
              full: `조선에 태어났다면 나는 '${sinbun.job}' · 너는 뭐였을지 봐 봐 (훈도사주)`,
            }}
            card={<SinbunCard who={`${josa(name, "이/가")} 조선에 태어났다면`} rank={sinbun.rank} job={sinbun.job} line={sinbun.line} rise={sinbun.rise} yong={sinbun.yong} />}
          />
        )}
        {self && <NextStep from="sinbun" steps={STEPS.sinbun(query)} />}
        {other}
        <AdSlot />
      </>
    );
  }

  const profile = me ? profileOf(me.person) : subject!.self ? await getProfile(subject!.courtId, subject!.who) : null;
  const request: Record<string, string> = me
    ? { product: product.id, p: me.token }
    : { product: product.id, ...(courtId && { court: subject!.courtId }), ...(ministerId && { m: ministerId }) };
  // A report bought before ENGINE2_SINCE shows the features its pinned text was written with.
  // The order it opens with: by its link, or this buyer's own for the same chart.
  const owned = paid ?? (self ? await ownedOrderFor(product.id, { ...request, product: product.id }).catch(() => null) : null);
  // Its year verdicts as of that order too (ENGINE3_SINCE: the 용신 floor).
  const ownedV3 = isEngine3(owned ? readAtOf(owned, product.id) : undefined);
  const reading = yearReading(pillars, profile, ownedV3);
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
  const distinct = self ? distinctOf(pillars, profile?.gender ?? null, isEngine2(owned ? readAtOf(owned, product.id) : undefined)) : null;
  const free = self ? freeReadingOf(pillars, profile) : null;
  // The free reading: the chart analysis, then the four computed blocks (powers, 신살, money·love·work, the
  // flow of life). Shown on the free year reading and on the life report before purchase.
  // Until the life report is owned, the free reading tells what each thing is and keeps why and when for it
  // (components/LockedLine.tsx); bought (or given), everything opens.
  // The lock waits for the card company's review (FREE_LOCK, lib/products.ts); 시안 모드 shows it already.
  const lifeOwned =
    !(FREE_LOCK || preview) ||
    (product.id === "pyeongsaeng" && Boolean(paid)) ||
    // A bought report (any topic) never shows a lock inside it; the owner's quick view reads as bought.
    (renew && (Boolean(paid) || ownerView)) ||
    (self && me ? Boolean(await ownedOrderFor("pyeongsaeng", { product: "pyeongsaeng", p: me.token })) : false);
  const lifeHref = product.id === "pyeongsaeng" ? "#report-start" : `/reports/pyeongsaeng${query ? `?${query}` : ""}`;
  const intro = distinct && <ChartIntro name={name} d={distinct} slots={reading.chart.slots} lockHref={lifeOwned ? null : lifeHref} />;
  // The card of this reading, for a story (the day pillar, the five powers, money·love·work, how rare the build is).
  const ilju = free ? iljuFacts(pillars.dayStem, pillars.dayBranch) : null;
  const topPower = free?.powers.reduce((a, b) => (b.pct > a.pct ? b : a));
  const shareLine = ilju && topPower ? `내 사주는 ${ilju.name} · 가장 큰 힘은 ${topPower.name} ${topPower.pct}% · 너는 뭐야? (훈도사주)` : "훈도사주 · 조선 관상감 훈도가 풀어 주는 사주";
  const sameLine = distinct?.ilju ? `같은 ${hanjaKo(distinct.ilju.name)}일주 중 약 ${Math.max(1, Math.round(distinct.ilju.rate * 100))}%만 이 구조` : "";
  const kindsOf = free ? free.domains.map((d) => [d.domain === "jaemul" ? "돈" : d.domain === "yeonae" ? "사랑" : "일", d.card.type] as [string, string]) : [];
  // At the very end, once the reader has been through all of it: send it to a friend, or keep the card.
  const shareEnd =
    free && ilju && me ? (
      <>
        <style>{`@font-face{font-family:"GanzhiBrush";src:url(/fonts/ganzhi-syuku.woff2) format("woff2");font-display:block}`}</style>
        <ShareResult
          name={name}
          file="hundosaju-saju"
          from="reading"
          paths={{
            summary: `/s/reading/${sealCard("reading", { n: name.slice(0, 12), s: pillars.dayStem, b: pillars.dayBranch, p: free.powers.map((x) => [x.group, x.name, x.pct]), k: kindsOf, r: sameLine })}`,
            full: `/s/reading/${sealPerson("reading", me.person)}`,
          }}
          texts={{
            // The result itself goes with the link: the day pillar and the strongest of the five powers.
            summary: shareLine,
            full: shareLine,
          }}
          card={
            <ReadingCard
              who={`${name}님의 사주`}
              ilju={{ hanja: ilju.hanja, name: ilju.name.replace("일주", "") }}
              image={ilju.image ?? null}
              powers={free.powers}
              kinds={kindsOf.map(([label, type]) => ({ label, type }))}
              same={sameLine || null}
            />
          }
        />
      </>
    ) : null;
  // 시안: the 만세력 rows, where each 신살 sits, the decades' characters, and 2027 after the flow of life.
  // The renewed free screen (2026-10-13): the 만세력 rows, where each 신살 sits, the decades' characters, and 2027.
  const draft = product.id === "pyeongsaeng" || product.id === "gukjeong";
  const ahead = draft
    ? { y: yearPreviewOf(pillars, profile, 2027), d: yearDetail(pillars, profile, 2027, 2026), layers: layersOf(pillars, profile, 2027) }
    : null;
  const fullIntro = intro && (
    <>
      <ChartIntro
        name={name}
        d={distinct}
        slots={reading.chart.slots}
        chips={!free}
        lockHref={lifeOwned ? null : lifeHref}
        manse={draft ? manseOf(pillars) : null}
      />
      {free && (
        <FreeReading
          name={name}
          r={free}
          query={query}
          addGender={`${next}?new=1`}
          onLifeReport={product.id === "pyeongsaeng"}
          locked={!lifeOwned}
          seats={draft ? salSeats(pillars) : undefined}
          near={renew}
          tags={draft ? Object.fromEntries((profile?.daeun ?? []).map((d) => [d.from, decadeTags(pillars, d)])) : undefined}
        />
      )}
      {ahead?.y && ahead.d && ahead.layers && (
        <YearTeaser name={name} y={ahead.y} d={ahead.d} href={`/reports/yeonun?${new URLSearchParams({ ...(query && Object.fromEntries(new URLSearchParams(query))), y: String(ahead.y.year) })}`} />
      )}
    </>
  );
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
  // Renewed: the free screen is the chart, its locks and 2027 (the 2026 year reading goes), closed by the life report.
  if (product.id === "gukjeong" && draft && self && fullIntro)
    return (
      <>
        <RoyalDoc className="mt-3" paperClassName="px-5">
          <p className="text-center font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">命 盤</p>
          <h1 className="mt-2 text-center font-myeongjo text-2xl font-extrabold">{name}님의 사주</h1>
          <p className="mt-2 text-center text-sm leading-snug text-ink-soft">여덟 글자와 만세력, 100명 중 몇 명인지, 그리고 2027년까지 · 무료</p>
        </RoyalDoc>
        {fullIntro}
        <Link href={`/reports/pyeongsaeng${query ? `?${query}` : ""}`} className="doc-paper mt-4 block px-5 py-4">
          <span className="block text-[12px] font-bold text-seal">命 書 · 평생 사주</span>
          <b className="mt-1 block font-myeongjo text-lg">잠긴 이유와 시기, 이 사주로 13장에 걸쳐 풀어 드려요</b>
          <span className="mt-1 block text-[13px] text-ink-soft">나는 어떤 사람인지부터 앞으로 10년, 꼭 잡아야 할 기회까지 →</span>
        </Link>
        {self && <AskCard from="free" lead="풀이를 보고 생긴 고민, 정 훈도에게 묻기" />}
        {self && <ChannelCard from="free" />}
        {shareEnd}
        {meDeepen}
        {other}
        <AdSlot />
      </>
    );
  if (product.id === "gukjeong")
    return (
      <>
        <YearReport
          reading={reading}
          heading={`${name}님의 2026년 운세`}
          deepen={!me && subject!.self ? { courtId: subject!.courtId, who: subject!.who } : null}
          query={query}
          intro={self ? fullIntro : undefined}
        />
        {shareEnd}
        {meDeepen}
        {other}
        <AdSlot />
      </>
    );
  if (!self)
    return (<><Header product={product} /><Notice>본인의 사주로만 열 수 있는 보고서예요.</Notice></>);

  // 연운: the list of years (free), then one year (its verdict, what moves it and its months free; the written
  // report bought for that chart and that year).
  if (product.id === "yeonun") {
    const now = thisYear();
    const y = yearOf(paid ? paid.req.y : search.y, profile, now);
    const token = me?.token;
    const link = (year?: number) =>
      `${base}?${new URLSearchParams({ ...(courtId && { court: courtId }), ...(ministerId && { m: ministerId }), ...(year && { y: String(year) }) })}`;
    if (y === null) {
      const { from, to } = yearRange(profile, now);
      const bought = (await ownedOrders().catch(() => [])).filter((o) => covers(o, product.id) && o.req.p === token && o.req.y);
      const owned = bought.map((o) => Number(o.req.y));
      // A year already bought shows the verdict its report was written with (bought before ENGINE3_SINCE: old).
      const rows = yearRows(pillars, profile, from, to, now)?.map((row) => {
        const o = bought.find((x) => Number(x.req.y) === row.year);
        return o && !isEngine3(readAtOf(o, product.id)) ? (yearRows(pillars, profile, row.year, row.year, now, false)?.[0] ?? row) : row;
      }) ?? null;
      return (
        <>
          <Header product={product} subjectName={`${name}님`} />
          {other}
          {noGender && (
            <p className="doc-paper mt-4 px-5 py-3 text-center text-[12px] leading-relaxed">
              성별을 넣으면 해마다의 판정에 10년 대운까지 반영해 드려요.
            </p>
          )}
          {rows && <YearList name={name} rows={rows} decades={freeReadingOf(pillars, profile)?.flow ?? null} hrefOf={(year) => link(year)} owned={owned} near={renew} />}
          {meDeepen}
        </>
      );
    }
    const yreq = { product: product.id, p: token ?? "", y: String(y) };
    const unlock = paid ?? (locked && token ? await ownedOrderFor(product.id, yreq) : asOwner(yreq));
    // The year as of the order it opens with (bought before ENGINE3_SINCE: without the 용신 floor).
    const yV3 = isEngine3(unlock?.id ? readAtOf(unlock, product.id) : undefined);
    const d = yearDetail(pillars, profile, y, now, yV3);
    if (!d) return (<><Header product={product} /><Notice>이 사주로는 연운을 풀 수 없어요. 다시 넣어 주세요.</Notice></>);
    const { from, to } = yearRange(profile, now);

    // A 연운 is found by its year too: its features as of the order it opens with (bought before ENGINE2_SINCE: old).
    const yearDistinct = unlock?.id && self ? distinctOf(pillars, profile?.gender ?? null, isEngine2(readAtOf(unlock, product.id))) : distinct;
    const preview = yearPreviewOf(pillars, profile, y, yV3);
    const flowNow = freeReadingOf(pillars, profile)?.flow?.find((f) => f.from <= y && y <= f.to);
    const decadeNow = flowNow ? { from: flowNow.from, to: flowNow.to, mood: flowNow.young ? "성장기" : flowNow.mood, theme: flowNow.theme } : null;
    const nearRows = yearRows(pillars, profile, Math.max(from, y - 1), Math.min(to, y + 1), now, yV3) ?? [];
    // The area the glance marks 조심, said under "이 해를 움직이는 것" too, so the two never read against each other.
    const careArea = renew ? preview?.areas.filter((a) => a.grade === "조심").sort((p, q) => p.score - q.score)[0] : undefined;
    const care = careArea ? `다만 ${AREA_WHAT[careArea.area]} 쪽은 이 해에 아껴 써야 하는 곳이에요. 한눈에 칸에서 함께 보세요.` : null;
    const yearTop = (
      <YearTop d={d} name={name} prev={!paid && y > from ? link(y - 1) : null} next={!paid && y < to ? link(y + 1) : null} list={link()} care={care} listLabel={renew ? "다른 해 고르기" : undefined} />
    );
    const glance = <YearGlance name={name} y={y} rows={nearRows} preview={preview} decade={decadeNow} five={renew || r2(unlock)} />;
    // The second pass: the coming year's report has one more chapter (lib/reportPrompts.ts NEW_YEAR_CHAPTER).
    const yearChapters = unlock && r2(unlock) ? yearChaptersFor(y === newYear) : chaptersFor(product.id, true);
    const half = (a: number, b: number) => d.months.map((_, i) => i).filter((i) => i >= a && i < b);
    // One picture per chapter, each from what that chapter is about: the area's own grade, reasons and months; the
    // decade under the year; the family seats the year meets; which months for which move; the decisive months.
    const layers = layersOf(pillars, profile, y);
    const yearFigures =
      unlock && r2(unlock)
        ? figuresFor(yearChapters, [
            ["한 줄로", glance],
            ["10년 대운", layers && <DecadeLayerFigure key="p" layers={layers} decade={decadeNow} />],
            ...(preview
              ? (["돈", "일과 자리", "사랑", "사람", "몸"] as const).map((kw, i): [string, React.ReactNode] => [
                  kw === "돈" ? "돈:" : kw,
                  <AreaFigure key={kw} area={["돈", "일", "사랑", "사람", "몸"][i]} preview={preview} months={d.months} y={y} />,
                ])
              : []),
            ["가족", <FamilyFigure key="f" slots={reading.chart.slots} gender={profile?.gender ?? null} meets={preview?.meets ?? []} y={y} yearGods={preview?.gods} />],
            ["움직일 일", <ActionsFigure key="m" months={d.months} y={y} />],
            ["상반기", <MonthsStrip key="h1" title="상반기 여섯 달" months={d.months} y={y} pick={half(0, 6)} />],
            ["하반기", <MonthsStrip key="h2" title="하반기 여섯 달" months={d.months} y={y} pick={half(6, 12)} />],
            ["세 번의 때", <MomentsFigure key="b" months={d.months} best={d.best} worst={d.worst} y={y} />],
          ])
        : undefined;
    return (
      <>
        <Header product={y === newYear ? newYearProduct(product, y) : product} subjectName={`${name}님`} />
        {unlock?.id && <OrderLink id={unlock.id} />}
        {r2(unlock) && (
          <>
            <Jump gift={unlock!.gift} title={y === newYear ? `${y} 신년운세` : `${y}년 운세`} chapters={yearChapters.length} />
            <ChartTop name={name} chart={reading.chart} weights={readChart(pillars)?.weights} distinct={yearDistinct} year={{ y, hanja: d.hanja, gods: d.gods }} />
          </>
        )}
        {r2(unlock) ? (
          // Bought: what was read before paying, folded, so the written report comes first.
          <details className="group mt-4">
            <summary className="doc-paper flex cursor-pointer list-none items-center justify-between px-5 py-4 [&::-webkit-details-marker]:hidden">
              <span>
                <b className="block font-myeongjo">결제 전에 본 {y}년 무료 화면</b>
                <span className="text-[12px] text-ink-soft">판정 · 이 해를 움직이는 것 · 달마다 흐름 (한눈에 칸은 1장에)</span>
              </span>
              <span className="text-ink-soft transition group-open:rotate-180" aria-hidden="true">
                ▾
              </span>
            </summary>
            {yearTop}
          </details>
        ) : (
          <>
            {yearTop}
            {/* The year at a glance, free (bought before the opening: the page as it was then). */}
            {(!unlock || isV8(unlock)) && glance}
          </>
        )}
        {unlock ? (
          <>
            <div id="report-start" className="scroll-mt-4">
              <AiReport
                request={reqOf(unlock, yreq)}
                modern
                {...(await extrasOf(unlock, product))}
                {...(r2(unlock) && { chapters: yearChapters, figures: yearFigures, plain: true })}
              />
            </div>
            {isV8(unlock) && d.when !== "past" && (
              <CalendarButton
                name={`정 훈도 ${y}년 운세`}
                file={`hundo-${y}`}
                label={`${y}년 좋은 달·조심할 달 달력에 넣기`}
                events={[...d.best.map((i) => ({ i, good: true })), ...d.worst.map((i) => ({ i, good: false }))]
                  .sort((p, q) => p.i - q.i)
                  .map(({ i, good }) => {
                    const m = d.months[i];
                    const [mm, dd] = m.from.split("/").map(Number);
                    const year = mm === 1 && i > 0 ? y + 1 : y;
                    return {
                      date: `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`,
                      title: good ? `◎ ${mm}월, 좋은 달 시작 (정 훈도)` : `△ ${mm}월, 조심할 달 시작 (정 훈도)`,
                      note: `${y}년 운세 보고서의 ${mm}월 풀이를 다시 읽어 보세요. 절기로 이날부터 한 달이에요.`,
                    };
                  })}
              />
            )}
          </>
        ) : locked ? (
          <>
            {meDeepen}
            <Paywall
              product={product}
              request={yreq}
              chapters={d.when === "past" ? YEONUN_PAST_TOC : renew && y === newYear ? yearChaptersFor(true) : product.toc}
              heading={renew && y === newYear ? `${y} 신년운세 보고서` : `${y}년 운세 보고서`}
              sub={
                renew && y === newYear
                  ? `한 해 흐름에 신년운세만의 '새해 첫 석 달'까지 ${yearChaptersFor(true).length}장 · 정 훈도에게 묻는 질문 1개가 함께 와요`
                  : `${d.when === "past" ? "그해 있었을 일과 그 이유" : "이 해에 벌어질 일과 할 일"}를 돈·일·사랑·몸, 달마다 흐름까지 ${product.toc.length}장에 풀어 드려요`
              }
            />
          </>
        ) : (
          <AiReport request={yreq} chapters={chaptersOf(product.id)} modern />
        )}
        {other}
      </>
    );
  }
  const unlock = paid ?? (locked ? await ownedOrderFor(product.id, { product: product.id, p: me?.token }) : asOwner(request));
  const freeYear = newYearOf() ?? thisYear();
  const domain = isDomain(product.id) ? product.id : null;
  const gender = me ? me.person.gender : (profile?.gender ?? null);
  const card = domain && domainCard(domain, pillars, gender);
  const chartFold = (
    <details className="group doc-paper mt-4 px-5 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
        <span className="font-myeongjo font-extrabold">사주 원국 · 여덟 글자 보기</span>
        <span className="text-ink-soft transition group-open:rotate-180" aria-hidden="true">
          ▾
        </span>
      </summary>
      <SajuChart {...reading.chart} kingdom={false} />
    </details>
  );
  // The free analysis, as it is shown before paying: the whole chart for the life report, the topic's verdict and
  // calendar (with the whole-chart analysis folded) for the topic reports.
  const analysis = (unlocked: boolean) =>
    domain && card ? (
      <>
        <DomainCard name={name} domain={domain} card={card} ranked={renew} />
        <DecadeTable name={name} domain={domain} years={decadeOf(domain, pillars, gender)} locked={!unlocked && locked} plain={renew} />
        {intro && (
          <details className="group mt-4">
            <summary className="doc-paper flex cursor-pointer list-none items-center justify-between px-5 py-4 [&::-webkit-details-marker]:hidden">
              <span>
                <b className="block font-myeongjo">내 사주 전체 분석 보기</b>
                <span className="text-[12px] text-ink-soft">여덟 글자의 무게, 드문 특징 · 평생 사주와 같은 무료 분석</span>
              </span>
              <span className="text-ink-soft transition group-open:rotate-180" aria-hidden="true">
                ▾
              </span>
            </summary>
            {intro}
          </details>
        )}
      </>
    ) : (
      fullIntro
    );
  // A bought (or gifted) report reads like the page before paying, with the written report where the payment was.
  // What was paid for is one tap from the top; the life report's long free analysis (already read before paying)
  // is folded. One who was given it never saw that analysis, so it stays open for them.
  if (unlock) {
    const chapters = chaptersOf(product.id).length;
    // v8 on, the life report's chapters carry their pictures: money, work and love over ten years, and the years ahead.
    const lifeFigures = (o: Order): Record<number, React.ReactNode> | undefined => {
      if (product.id !== "pyeongsaeng" || !isV8(o)) return undefined;
      const from = thisYear(new Date(paidAtOf(o)));
      const ahead = yearRows(pillars, profile, from, from + 9, from, isEngine3(readAtOf(o, product.id)));
      return {
        3: <DecadeTable inline name={name} domain="jaemul" years={decadeOf("jaemul", pillars, gender)} locked={false} plain={r2(o)} />,
        4: <DecadeTable inline name={name} domain="jikup" years={decadeOf("jikup", pillars, gender)} locked={false} plain={r2(o)} />,
        5: <DecadeTable inline name={name} domain="yeonae" years={decadeOf("yeonae", pillars, gender)} locked={false} plain={r2(o)} />,
        ...(ahead && { 11: <YearsAheadFigure rows={ahead} name={name} /> }),
      };
    };
    // The second pass (lib/open.ts RENEW2): a picture for the chapters that were words only, from what the free
    // screen already computed (the rare traits, the five powers, the seats, the elements, the decades, the year).
    const moreFigures = (o: Order): Record<number, React.ReactNode> => {
      const y0 = thisYear(new Date(paidAtOf(o)));
      const chs = chaptersFor(product.id, true);
      // The rare traits go to the chapter they speak to (성격, 돈, 일, 연애, 사람), never one list twice.
      const rare = (areas: string[]) => distinct && <RareFigure key={areas.join()} name={name} d={distinct} areas={areas} skipTop />;
      const powers = free && <PowersFigure name={name} powers={free.powers} strong={free.strong} weak={free.weak} />;
      if (product.id === "pyeongsaeng")
        return figuresFor(chs, [
          ["어떤 사람", rare(["성격"])],
          ["무기와 약점", powers],
          ["부모님", <FamilyFigure key="s" slots={reading.chart.slots} gods={readChart(pillars)?.gods} gender={gender} />],
          ["사람 복", rare(["사람"])],
          ["몸", <ElementsFigure key="e" name={name} elements={reading.chart.elements} weights={distinct?.weights.weighted} />],
          ["사계절", free?.flow && <FlowFigure key="f" flow={free.flow} />],
          ["어디쯤", free?.flow && <NowFigure key="n" flow={free.flow} y={y0} />],
        ]);
      if (!domain) return {};
      // The ten-year table is open above the report (the free card): the 'when' chapters show only its answer.
      const when = <WhenFigure key="w" years={decadeOf(domain, pillars, gender)} title={domain === "yeonae" ? "인연이 닿기 좋은 해" : domain === "jaemul" ? "돈이 트이는 해" : "움직이기 좋은 해"} />;
      const oV3 = isEngine3(o.id ? readAtOf(o, product.id) : undefined);
      const yd = yearDetail(pillars, profile, y0, y0, oV3);
      const yp = yearPreviewOf(pillars, profile, y0, oV3);
      return figuresFor(chs, [
        ["어떤 사람", rare(["연애"])],
        ["어떻게 버는", rare(["돈"])],
        ["빛날까", rare(["일"])],
        ["월급", powers],
        ["회사형", powers],
        ["결혼은 언제", when],
        ["트이는 때", when],
        ["언제가", when],
        ["인연이 오는 달", yd && yp && <AreaFigure key="m" area="사랑" preview={yp} months={yd.months} y={y0} />],
      ]);
    };
    // Bought before the opening: it opens as it did when it was bought (analysis open, report below).
    if (!isV8(unlock))
      return (
        <>
          <Header product={product} subjectName={`${name}님`} />
          <OrderLink
            id={unlock.id}
            gift={!!unlock.gift}
            others={(unlock.bundle ?? [])
              .filter((id) => id !== product.id)
              .map((id) => ({ href: `/reports/${id}?order=${unlock.id}`, title: productById(id)!.title }))}
          />
          {analysis(true)}
          {!intro && chartFold}
          <div id="report-start" className="scroll-mt-4">
            <AiReport request={{ product: product.id, order: unlock.id }} chapters={chaptersOf(product.id)} modern />
          </div>
          {product.id === "yeonae" && (
            <Link href="/reports/gunghap?from=yeonae" className="doc-paper mt-6 flex items-center gap-3 px-5 py-4">
              <span className="min-w-0 flex-1">
                <b className="block font-myeongjo">마음에 둔 사람이 있다면, 그 사람과는 어떨까요?</b>
                <span className="block text-[12px] text-ink-soft">두 사람이 왜 끌리고 어디서 부딪히는지, 오래 가려면 무엇을 지킬지 봐 드려요</span>
              </span>
              <span className="shrink-0 text-sm font-bold text-seal">궁합 보기 →</span>
            </Link>
          )}
        </>
      );
    return (
      <>
        <Header product={product} subjectName={`${name}님`} />
        {unlock.id && (
          <OrderLink
            id={unlock.id}
            gift={!!unlock.gift}
            others={(unlock.bundle ?? [])
              .filter((id) => id !== product.id)
              .map((id) => ({ href: `/reports/${id}?order=${unlock.id}`, title: productById(id)!.title }))}
          />
        )}
        <Jump gift={unlock.gift} title={product.title} chapters={chapters} />
        {/* The second pass: the eight characters on top, open, the first thing the reader paid to have read. */}
        {r2(unlock) && <ChartTop name={name} chart={reading.chart} weights={readChart(pillars)?.weights} distinct={distinct} />}
        {domain && card ? (
          analysis(true)
        ) : (
          <details className="group mt-4" open={unlock.gift || undefined}>
            <summary className="doc-paper flex cursor-pointer list-none items-center justify-between px-5 py-4 [&::-webkit-details-marker]:hidden">
              <span>
                <b className="block font-myeongjo">{r2(unlock) ? "결제 전에 본 무료 분석" : "내 사주 분석 다시 보기"}</b>
                <span className="text-[12px] text-ink-soft">
                  {r2(unlock) ? "성향 지도 · 사주 속 별 · 인생 흐름 · 2027년 미리 보기" : "사주팔자 · 성향 지도 · 사주 속 별 · 인생 흐름 · 결제 전에 본 무료 분석"}
                </span>
              </span>
              <span className="text-ink-soft transition group-open:rotate-180" aria-hidden="true">
                ▾
              </span>
            </summary>
            {analysis(true)}
          </details>
        )}
        {!r2(unlock) && !intro && chartFold}
        <div id="report-start" className="scroll-mt-4">
          <AiReport
            request={reqOf(unlock, request)}
            modern
            {...(await extrasOf(unlock, product))}
            figures={{ ...lifeFigures(unlock), ...(r2(unlock) ? moreFigures(unlock) : {}) }}
            plain={r2(unlock)}
          />
        </div>
        {/* Who reads about love usually has someone in mind: the two-person reading is the next question. */}
        {product.id === "yeonae" && (
          <Link href="/reports/gunghap?from=yeonae" className="doc-paper mt-6 flex items-center gap-3 px-5 py-4">
            <span className="min-w-0 flex-1">
              <b className="block font-myeongjo">마음에 둔 사람이 있다면, 그 사람과는 어떨까요?</b>
              <span className="block text-[12px] text-ink-soft">두 사람이 왜 끌리고 어디서 부딪히는지, 오래 가려면 무엇을 지킬지 봐 드려요</span>
            </span>
            <span className="shrink-0 text-sm font-bold text-seal">궁합 보기 →</span>
          </Link>
        )}
      </>
    );
  }
  return (
    <>
      <Header product={product} subjectName={`${name}님`} />
      {other}
      {analysis(false)}
      {/* The chart is already on the page in the analysis; the bare table only when that could not be read. */}
      {!intro && chartFold}
      {locked ? (
        // A bought report is written for exactly this chart, so the missing details come before the payment.
        <>
          {meDeepen}
          <Paywall product={product} request={request} chapters={product.toc} />
          {/* Not ready to pay: the coming year's verdict and months are free, one tap away, not a dead end. */}
          <TrackLink
            event="to_saju"
            from="reading"
            href={`/reports/yeonun?y=${freeYear}${query ? `&${query}` : ""}`}
            className="doc-paper mt-4 flex items-center gap-3 px-5 py-4"
          >
            <span className="min-w-0 flex-1">
              <b className="block font-myeongjo">결제 전에, {newYearOf() ? `${freeYear} 신년운세` : `${freeYear}년 운세`} 판정부터</b>
              <span className="block text-[12px] text-ink-soft">
                {name}님의 {freeYear}년 판정과 달마다 흐름을 무료로 먼저 보세요
              </span>
            </span>
            <span className="shrink-0 text-sm font-bold text-seal">무료 →</span>
          </TrackLink>
        </>
      ) : (
        <>
          <div id="report-start" className="scroll-mt-4">
            <AiReport request={request} chapters={chaptersOf(product.id)} modern />
          </div>
          {meDeepen}
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
  const y = typeof search.y === "string" ? search.y : undefined;
  // 시안 모드: the owner sees the shop as a customer does (no free opening of paid reports).
  const owner = await isPreview();
  const preview = owner;
  // A shopper on a paid report's page (연운 counts once a year is chosen), for the owner's sales table.
  const shopping = product.modern && !isOpen(product) && !paid && (product.id !== "yeonun" || y);
  if (isOpen(product) || product.modern || paid)
    return (
      <>
        {shopping && <TrackView sale={saleKey(product.id, undefined, y)} />}
        {owner && (
          <Link href="/admin/free-preview" className="fixed bottom-3 left-3 z-50 rounded-full bg-ink px-3 py-1 text-[11px] font-bold text-hanji opacity-80">
            시안 모드
          </Link>
        )}
        <nav className="pt-4 text-sm">
          <Link href="/reports" className="font-bold text-ink-soft">
            ← 전체 보고서
          </Link>
        </nav>
        {paid && <BonusTop order={paid} back={`/reports/${product.id}?order=${paid.id}`} />}
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
          locked={!isOpen(product) && !paid && (owner || !(await isAdmin()))}
          preview={preview}
          paid={paid}
          fresh={search.new === "1"}
          search={{
            kind: typeof search.kind === "string" ? search.kind : undefined,
            from: typeof search.from === "string" ? search.from : undefined,
            n: typeof search.n === "string" ? search.n : undefined,
            y: typeof search.y === "string" ? search.y : undefined,
          }}
        />
        {paid && <ReportFeedback order={paid.id} product={product.id} />}
        {paid && <KeepNote order={paid} back={`/reports/${product.id}?order=${paid.id}`} />}
        {paid && <AskCard from="report" lead="다 읽고 궁금한 것, 정 훈도에게 묻기" />}
        {paid && <ChannelCard from="report" />}
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
            <li key={item} className="flex items-center gap-2 py-2 text-left text-[15px]">
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
