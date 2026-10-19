import { Plaque } from "./ask/Hall";
import Image from "next/image";
import Link from "next/link";
import { forgetMeAction } from "@/app/actions";
import { HundoFace } from "@/app/ask/Letter";
import AskLink from "@/components/AskLink";
import ColumnTitle from "@/components/ColumnTitle";
import Keep from "@/components/Keep";
import NoticeBar, { type Notice } from "@/components/NoticeBar";
import TodayCard from "@/components/TodayCard";
import { StarChart } from "@/components/StoreHero";
import { publishedColumns } from "@/lib/columns";
import { hanjaNum } from "@/lib/hanjaNum";
import { monthPillarNow, rankMonth } from "@/lib/iljuRank";
import { readMe } from "@/lib/me";
import { askShown, CHANNEL_GIFT, CHANNEL_GIFT_ON, currentMember, JOIN_GIFT } from "@/lib/members";
import { STEMS, BRANCHES, STEMS_KO, BRANCHES_KO } from "@/lib/saju";
import type { Today } from "@/lib/today";
import { profileOf } from "@/lib/pairToken";
import { ownedByProduct, ownedOrders } from "@/lib/pay";
import { productById, SETS, type ProductId } from "@/lib/products";
import { readingCount } from "@/lib/store";
import { todayFor } from "@/lib/today";
import { isPreview, newYearOf, newYearProduct, thisYear, yearDetail, yearName, yearNickname } from "@/lib/yeonun";

// The new home (시안: the owner's 시안 모드 only, until it replaces app/page.tsx). The same things as now, set in
// one plain card style (globals .card) and in the order a visitor uses them: the free reading and 정 훈도에게
// 묻기 at the top; the free extras as one row of chips; today and the month together; next year's 신년운세 with
// its contents folded; the reports on sale, with 묻기 in the eighth place; the stories as a short list. No price
// here: each report's page says its own (they differ), so one number on the home would mislead.

const TOPICS: { id: ProductId; name: string; ask: string }[] = [
  { id: "pyeongsaeng", name: "평생 사주", ask: "나는 어떤 사람이고 어떻게 살아갈까?" },
  { id: "yeonun", name: "연운", ask: "그해 나한테 무슨 일이? 지난해도, 앞으로의 해도" },
  { id: "jaemul", name: "재물운", ask: "돈이 왜 안 모일까, 언제 트일까?" },
  { id: "yeonae", name: "연애·결혼", ask: "나랑 맞는 사람은 언제 올까?" },
  { id: "jikup", name: "직업·적성", ask: "지금 일, 나랑 맞을까?" },
  { id: "gunghap", name: "궁합", ask: "우리, 진짜 잘 맞을까?" },
  { id: "taekil", name: "택일", ask: "결혼·이사·계약·면접, 언제 할까?" },
];

const CHIPS: { href: string; hanja: string; label: string }[] = [
  { href: "/reports/gukjeong", hanja: "命", label: "내 사주 · 2027" },
  { href: "/#today", hanja: "日", label: "오늘의 운세" },
  { href: "/ranking", hanja: "月", label: "이달 일주 랭킹" },
  { href: "/samjae", hanja: "三災", label: "2026·27 삼재" },
  { href: "/king", hanja: "王", label: "왕이 될 사주" },
  { href: "/reports/sinbun", hanja: "身分", label: "조선 신분 감정" },
];

const SHOW_COUNT_FROM = 100;

// The notices taking turns at the top (components/NoticeBar.tsx): each one a thing on the site now, nothing promised
// that is not there.
function notices(ask: boolean): Notice[] {
  return [
    { text: "2027 정미년, 내 사주엔 무슨 바람이?", href: "/reports/gukjeong" },
    ...(ask && CHANNEL_GIFT_ON ? [{ text: `카카오 채널 추가하면 정 훈도 질문 ${CHANNEL_GIFT}개 선물`, href: "/ask#channel" }] : []),
    { text: "이달의 일주 랭킹, 내 일주는 몇 위일까", href: "/ranking" },
  ];
}

// First visit (A): 정 훈도 standing on the night stage, one button, 묻기 as a gold line under it.
function HeroStage({ ask }: { ask: boolean }) {
  return (
    <header className="animate-rise relative mt-3 h-[480px] overflow-hidden rounded-3xl bg-[#0f2236] text-[#f7efd9] shadow-[0_10px_30px_rgb(33_27_23/0.22),inset_0_0_0_1px_rgb(212_175_95/0.35)]">
      {/* 관상감 under the night sky, the star chart drawn over it, and 정 훈도 in front. */}
      <Image src="/cards/gwansanggam.webp" alt="" fill priority sizes="440px" className="object-cover object-bottom opacity-80" />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-[#0f2236] via-[#0f2236]/70 to-[#0f2236]/10" />
      <StarChart opacity={0.75} />
      <Image
        src="/cards/hundo-scroll.webp"
        alt="별자리 두루마리를 든 정 훈도"
        width={561}
        height={701}
        priority
        className="absolute -right-9 -bottom-7 w-[232px] drop-shadow-[0_8px_18px_rgb(0_0_0/0.35)]"
      />
      <div className="relative px-6 pt-9">
        <p className="font-myeongjo text-[12px] font-extrabold tracking-[0.35em] text-[#e2bc68]">命課學 訓導</p>
        <h1 className="mt-2.5 font-myeongjo text-[40px] leading-[1.1] font-extrabold drop-shadow-[0_2px_6px_rgb(0_0_0/0.35)]">훈도사주</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#f3ead0]/85">
          누구에게나 맞는 말 말고,
          <br />
          <b className="text-[#f7efd9]">나한테만 맞는 말</b>
        </p>
        <Link
          href="/reports/gukjeong?new=1"
          className="mt-6 block w-[205px] rounded-2xl bg-[#e2bc68] py-3.5 text-center font-myeongjo text-[16px] font-extrabold text-[#17304a] shadow-[0_5px_0_#9c7a2e]"
        >
          내 사주 무료로 보기
        </Link>
        <p className="mt-2 w-[205px] text-center text-[11px] text-[#f3ead0]/70">생년월일만 넣으면 바로</p>
        {ask && (
          <AskLink from="home" className="mt-4 block w-[205px] text-center text-[13px] leading-snug font-bold text-[#e2bc68]">
            정 훈도에게 묻기 →
            <span className="block text-[11px] font-normal text-[#f3ead0]/70">카카오로 로그인하면 첫 질문 {JOIN_GIFT}개</span>
          </AskLink>
        )}
      </div>
    </header>
  );
}

// Back with a chart (C): the visitor's own day, then where they left off.
// `ny`: the coming year while it is sold as 신년운세 (lib/yeonun.ts newYearOf), the main way on from here then.
function HeroMe({
  name,
  stem,
  branch,
  today,
  ask,
  credits,
  ny,
}: {
  name: string;
  stem: number;
  branch: number;
  today: Today;
  ask: boolean;
  credits: number | null;
  ny: number | null;
}) {
  return (
    <header className="animate-rise relative mt-3 overflow-hidden rounded-3xl bg-[#0f2236] px-5 pt-5 pb-4 text-[#f7efd9] shadow-[0_10px_30px_rgb(33_27_23/0.22),inset_0_0_0_1px_rgb(212_175_95/0.35)]">
      <Image src="/cards/gwansanggam.webp" alt="" fill sizes="440px" className="object-cover object-bottom opacity-45" />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-[#0f2236]/95 via-[#0f2236]/80 to-[#0f2236]/55" />
      <StarChart opacity={0.6} />
      <div className="relative flex items-center gap-3">
        <HundoFace size={52} />
        <p className="font-myeongjo text-[19px] leading-snug font-extrabold">
          <span className="block font-sans text-[12px] font-bold tracking-wide text-[#e2bc68]">
            {STEMS[stem]}
            {BRANCHES[branch]} · {STEMS_KO[stem]}
            {BRANCHES_KO[branch]}일주
          </span>
          {name}님, 다시 오셨사옵니까
        </p>
      </div>
      {today.score !== null && (
        <Link href="#today" className="relative mt-4 flex items-center gap-3.5 rounded-2xl border border-[#e2bc68]/35 bg-[#f7efd9]/[0.07] px-4 py-3">
          <span className="shrink-0 font-myeongjo text-[40px] leading-none font-extrabold whitespace-nowrap text-[#e2bc68]">{today.score}</span>
          <span className="min-w-0 text-[13px] leading-snug">
            <span className="block text-[11px] opacity-70">오늘의 점수 · {today.date}</span>
            {today.best && (
              <>
                오늘 가장 좋은 것 <b>{today.best.label}</b>
              </>
            )}
            {today.hour && <span className="block opacity-80">좋은 시간 {today.hour.label}</span>}
          </span>
          <span className="ml-auto shrink-0 text-[12px] font-bold text-[#e2bc68]">자세히</span>
        </Link>
      )}
      <Link
        href={ny ? `/reports/yeonun?y=${ny}` : "/reports/gukjeong"}
        className="relative mt-3 block rounded-2xl bg-[#e2bc68] py-3.5 text-center font-myeongjo text-[16px] font-extrabold text-[#17304a] shadow-[0_5px_0_#9c7a2e]"
      >
        {ny ? `내 ${ny}년 신년운세 미리 보기` : "내 사주 풀이 다시 보기"}
      </Link>
      {ny && (
        <Link href="/reports/gukjeong" className="relative mt-2 block text-center text-[12.5px] text-[#f3ead0]/75 underline underline-offset-4">
          내 사주 풀이 다시 보기 (성향·인생 흐름)
        </Link>
      )}
      {ask && (
        <AskLink from="home" className="relative mt-2.5 flex items-center gap-2 rounded-2xl border border-[#e2bc68]/60 px-4 py-3 text-[13.5px]">
          <b className="shrink-0 font-myeongjo whitespace-nowrap">정 훈도에게 묻기</b>
          <span className="min-w-0 text-[12.5px] leading-snug opacity-80">{credits !== null ? `남은 질문 ${credits}개` : `카카오로 로그인하면 첫 질문 ${JOIN_GIFT}개`}</span>
          <span className="ml-auto font-extrabold text-[#e2bc68]">→</span>
        </AskLink>
      )}
      <p className="relative mt-3 text-center text-[11px] opacity-55">命課學 訓導 · 훈도사주 · 나한테만 맞는 말</p>
    </header>
  );
}




// 정 훈도에게 묻기 as the new thing on the home: his 사랑방, the room in the 기와집 where guests talk, with a
// 현판 over the door and the lattice of a paper window behind. What a question brings is said as promises, and how
// to ask so the letter goes deep.
const PROMISES: [string, React.ReactNode][] = [
  ["直答", <><b>돌려 말하지 않아요.</b> 된다, 안 된다부터</>],
  ["時勢", <><b>왜 하필 지금</b>, 그 고민이 생겼는지</>],
  ["性情", <><b>&ldquo;어, 이거 내 얘긴데?&rdquo;</b> 싶은 한 장면</>],
  ["時運", <><b>다가올 석 달</b>, 언제 움직이고 언제 쉴지</>],
  ["一事", <><b>오늘 바로</b> 해 볼 한 가지</>],
  ["記憶", <>다음에 오면 <b>지난 이야기부터</b> 기억해요</>],
];

function Sangdam({ credits }: { credits: number | null }) {
  return (
    <section className="mt-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#222d3b] to-[#1a232f] px-5 pt-5 pb-5 text-hanji shadow-[0_8px_22px_rgb(33_27_23/0.18),inset_0_0_0_1px_rgb(212_175_95/0.35)]">
        {/* 문살: the lattice of a paper window, faint */}
        <span
          aria-hidden
          className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#e2bc68_1px,transparent_1px),linear-gradient(90deg,#e2bc68_1px,transparent_1px)] [background-size:28px_28px]"
        />
        <span aria-hidden className="absolute -top-12 -right-12 size-44 rounded-full bg-[radial-gradient(circle,rgb(226_188_104/0.25),transparent_65%)]" />
        <Plaque />
        <div className="relative mt-5 flex items-center gap-3 border-t border-[#e2bc68]/15 pt-4">
          <HundoFace size={52} />
          <h2 className="font-myeongjo text-[19px] leading-snug font-extrabold">
            보고서는 내 사주를 읽고,
            <br />
            <span className="text-[#e2bc68]">사랑방은 내 고민을 읽어요</span>
          </h2>
        </div>
        <ul className="relative mt-4 flex flex-col divide-y divide-[#e2bc68]/15 border-y border-[#e2bc68]/20 text-[13.5px] leading-snug">
          {PROMISES.map(([h, t]) => (
            <li key={h} className="flex items-center gap-3 py-2">
              <span className="w-8 shrink-0 font-myeongjo text-[13px] text-[#e2bc68]">{h}</span>
              <span className="text-hanji/85 [&_b]:font-bold [&_b]:text-hanji">{t}</span>
            </li>
          ))}
        </ul>
        {/* How to ask well: the more of the situation, the deeper the letter. */}
        <div className="relative mt-4 rounded-xl border border-[#e2bc68]/30 bg-[#f7efd9]/[0.06] px-3.5 py-3">
          <p className="font-myeongjo text-[14px] font-extrabold text-[#e2bc68]">자세히 들려주실수록 답이 깊어져요</p>
          <p className="mt-2 flex gap-2 text-[12.5px] text-hanji/45 line-through decoration-hanji/30">
            <span className="no-underline">✕</span>이직해도 될까요?
          </p>
          <p className="mt-1 flex gap-2 text-[12.5px] leading-relaxed text-hanji/90">
            <span className="text-[#e2bc68]">◯</span>3년 다닌 회사에서 연봉이 오르는 제안을 받았어요. 이번 달 안에 답해야 하는데, 가도 될까요?
          </p>
          <p className="mt-2 text-[11.5px] text-hanji/55">무슨 일인지 · 누구와 얽혀 있는지 · 언제까지 정해야 하는지</p>
        </div>
        <AskLink
          from="home"
          className="relative mt-4 block rounded-2xl bg-[#e2bc68] py-3.5 text-center font-myeongjo text-[16px] font-extrabold text-[#17304a] shadow-[0_5px_0_#9c7a2e]"
        >
          {credits !== null ? `정 훈도에게 여쭈러 가기 · 남은 질문 ${credits}개` : "카카오로 로그인하고 첫 질문 받기"}
        </AskLink>
        {credits === null && <p className="relative mt-2 text-center text-[11.5px] text-hanji/60">카카오로 로그인하면 첫 질문 {JOIN_GIFT}개를 선물로 드려요</p>}
      </div>
    </section>
  );
}

const SectionTitle = ({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) => (
  <div className="mt-9 mb-3 px-1">
    <h2 className="font-myeongjo text-[19px] font-extrabold">{children}</h2>
    {sub && <p className="mt-0.5 text-[12px] text-ink-soft">{sub}</p>}
  </div>
);

export default async function HomeV2() {
  const [me, count, orders, ask, member] = await Promise.all([readMe(), readingCount(), ownedOrders().catch(() => []), askShown(), currentMember().catch(() => null)]);
  const today = todayFor(me?.person ?? null);
  const owned = ownedByProduct(orders);
  const ny = newYearOf();
  const nyProduct = ny ? newYearProduct(productById("yeonun")!, ny) : null;
  const nyTheme = ny && me ? yearDetail(me.person.pillars, profileOf(me.person), ny, thisYear())?.theme : null;
  const nyOwned = ny && me ? orders.find((o) => (o.bundle ?? [o.product]).includes("yeonun") && o.req.y === String(ny) && o.req.p === me.token) : undefined;
  const mp = monthPillarNow();
  const ranks = rankMonth(mp.stem, mp.branch);
  const myRank = me ? ranks.find((r) => r.stem === me.person.pillars.dayStem && r.branch === me.person.pillars.dayBranch) : undefined;

  return (
    <div className="tone-night flex flex-col">
      <NoticeBar notices={notices(ask)} />
      {me ? (
        <HeroMe
          name={me.person.name}
          stem={me.person.pillars.dayStem}
          branch={me.person.pillars.dayBranch}
          today={today}
          ask={ask}
          credits={member ? member.credits : null}
          ny={ny}
        />
      ) : (
        <HeroStage ask={ask} />
      )}

      {/* How many charts he has read, under the first screen where it can be seen (it was lost on the picture). */}
      {count >= SHOW_COUNT_FROM && (
        <p className="mt-3 flex items-center justify-center gap-2 text-[13px] text-ink-soft">
          <span aria-hidden className="h-px w-6 bg-gold/40" />
          지금까지 <b className="font-myeongjo text-[17px] text-gold">{count.toLocaleString("ko-KR")}</b>건의 사주를 풀어 드렸어요
          <span aria-hidden className="h-px w-6 bg-gold/40" />
        </p>
      )}

      {/* The free extras, two to a row (a swiped row hid the last one half off the edge). */}
      <nav aria-label="무료로 보기" className="mt-4 grid grid-cols-2 gap-2">
        {CHIPS.filter((c) => !me || (c.href !== "/reports/gukjeong" && c.href !== "/#today")).map((c) => (
          <Link key={c.href} href={c.href} className="card flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[13px] font-bold">
            <span className="font-myeongjo text-[13px] text-gold">{c.hanja}</span>
            <span className="min-w-0 flex-1 truncate">{c.label}</span>
            <span className="text-[11px] text-ink-soft">›</span>
          </Link>
        ))}
      </nav>

      {/* Today and this month, one card: the day's reading, then the month's ranking joined below. */}
      <TodayCard today={today} name={me?.person.name ?? null} frame="card mt-4" revealed={Boolean(me)} quiet>
        <Link href="/ranking" className="mt-4 flex items-center gap-3 border-t border-ink/10 pt-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff3c4,#e2bc68_50%,#a87a22)] font-myeongjo text-sm font-extrabold text-[#6b4a0e]">
            1
          </span>
          <span className="min-w-0 flex-1 text-[13px] leading-snug">
            <span className="block text-[11px] text-ink-soft">
              이달의 일주 랭킹 · {mp.label} {mp.term} {mp.from}~
            </span>
            <b className="font-myeongjo">
              1위 {ranks[0].name} <span className="text-seal">{ranks[0].hanja}</span>
            </b>
            {myRank && (
              <span className="text-ink-soft">
                {" "}
                · {me!.person.name}님 {myRank.rank > 50 ? "대비하면 되는 달" : `${myRank.rank}위`}
              </span>
            )}
          </span>
          <span className="shrink-0 text-[12px] font-bold text-seal">순위 →</span>
        </Link>
      </TodayCard>

      {orders.length > 0 && (
        <section className="card mt-4 px-5 py-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-myeongjo font-extrabold">내가 산 보고서</h2>
            <Link href="/my" className="text-xs font-bold text-seal">
              모두 보기 →
            </Link>
          </div>
          <ul className="mt-2 flex flex-col divide-y divide-ink/10">
            {orders.slice(0, 3).map((o) => (
              <li key={o.id}>
                <Link href={`/r/${o.id}`} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <b className="block truncate font-myeongjo">{o.set ? SETS[o.set].title : productById(o.product)?.title}</b>
                    <span className="block truncate text-xs text-ink-soft">{o.who}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-seal px-3 py-1 text-xs font-bold text-hanji">열기</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {me && (
        <form action={forgetMeAction} className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-gold/15 px-4 py-2 text-xs">
          <span className="font-bold text-gold">{me.person.name}님 사주로 보는 중</span>
          <button type="submit" className="text-ink-soft underline">
            다른 사람 보기
          </button>
        </form>
      )}

      {/* In season: next year's 신년운세, the contents folded after three lines. */}
      {ny && nyProduct && (
        <section className="card mt-6 overflow-hidden">
          <div className="bg-jjok px-5 py-2 text-center text-[12px] font-extrabold tracking-wide text-[#e2bc68]">
            {ny} {yearName(ny).ko.replace("년", "")}년({yearName(ny).hanja}年) · <span className="text-[#f0a39a]">{yearNickname(ny)}</span>
          </div>
          <div className="px-5 pt-4 pb-5">
            <div className="flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-gold/70 font-myeongjo text-sm font-extrabold text-gold">
                {nyProduct.hanja}
              </span>
              <h2 className="font-myeongjo leading-tight font-extrabold">
                <span className="block text-[12px] font-bold tracking-wide text-gold">{ny} 신년운세</span>
                <span className="text-[21px]">{me ? `${me.person.name}님의 ${ny}년, 무슨 일이 올까?` : `${ny}년, 나한테 무슨 일이 올까?`}</span>
              </h2>
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
              <Keep clauses>{nyProduct.tagline}</Keep>
            </p>
            {nyTheme && (
              <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-[13px]">
                {me!.person.name}님의 {ny}년은 <b className="text-seal">{nyTheme}</b>
              </p>
            )}
            <ol className="mt-3 flex flex-col divide-y divide-ink/10 text-[14px]">
              {nyProduct.toc.slice(0, 3).map((item, i) => (
                <li key={item} className="flex gap-2 py-1.5">
                  <span className="w-7 shrink-0 font-myeongjo font-extrabold text-gold">{hanjaNum(i + 1)}</span>
                  {item}
                </li>
              ))}
            </ol>
            <details className="group">
              <summary className="cursor-pointer list-none py-1.5 text-[13px] font-bold text-ink-soft">
                <span className="group-open:hidden">목차 {nyProduct.toc.length}장 모두 보기 ▾</span>
                <span className="hidden group-open:inline">접기 ▴</span>
              </summary>
              <ol className="flex flex-col divide-y divide-ink/10 text-[14px]">
                {nyProduct.toc.slice(3).map((item, i) => (
                  <li key={item} className="flex gap-2 py-1.5">
                    <span className="w-7 shrink-0 font-myeongjo font-extrabold text-gold">{hanjaNum(i + 4)}</span>
                    {item}
                  </li>
                ))}
              </ol>
            </details>
            <p className="mt-2 text-[12px] text-ink-soft">
              {ny}년 판정과 달마다 흐름은 무료로 먼저 보고, 한 해 전체 풀이는 이어서 볼 수 있어요
            </p>
            <Link
              href={nyOwned ? `/reports/yeonun?order=${nyOwned.id}` : `/reports/yeonun?y=${ny}`}
              className="mt-3 block rounded-2xl bg-jjok py-3.5 text-center font-myeongjo text-[17px] font-extrabold text-[#e2bc68] shadow-[0_4px_0_#131a23,inset_0_0_0_1px_rgb(212_175_95/0.45)]"
            >
              {nyOwned ? "결제한 신년운세 바로 보기" : me ? `${me.person.name}님의 ${ny}년 ${isPreview(ny) ? "미리 보기" : "보기"}` : `내 ${ny}년 운세 ${isPreview(ny) ? "미리 보기" : "보기"}`}
            </Link>
          </div>
        </section>
      )}

      {ask && <Sangdam credits={member ? member.credits : null} />}

      <SectionTitle sub="무료로 먼저 보고, 더 깊은 풀이는 주제마다 보고서로">무엇이 궁금하세요?</SectionTitle>
      <ul className="grid grid-cols-2 gap-2">
        {TOPICS.map((t) => {
          const mine = owned[t.id];
          const href = t.id === "yeonun" ? "/reports/yeonun" : (mine?.href ?? `/reports/${t.id}`);
          return (
            <li key={t.id}>
              <Link href={href} className="jjok-box flex h-full flex-col px-4 pt-4 pb-3.5">
                <span className="font-myeongjo text-xl text-gold">{productById(t.id)!.hanja}</span>
                <span className="mt-1.5 font-myeongjo text-[18px] leading-tight font-extrabold">{t.name}</span>
                <span className="mt-1 flex-1 text-[12px] leading-snug text-hanji/75">{t.ask}</span>
                <span className="mt-2.5 flex items-center justify-between border-t border-gold/30 pt-2 text-[12px] font-bold">
                  <span className="text-hanji/60">{mine ? "결제함" : ""}</span>
                  <span className="text-gold">{mine ? "바로 보기 →" : "보기 →"}</span>
                </span>
              </Link>
            </li>
          );
        })}
        {/* The eighth place: 정 훈도에게 묻기 once it is open; before that, what he studies next. */}
        <li>
          {ask ? (
            <AskLink from="home" className="flex h-full flex-col rounded-2xl bg-gradient-to-br from-[#2c3848] to-[#1a232f] px-4 pt-4 pb-3.5 text-hanji shadow-[0_4px_0_#131a23,inset_0_0_0_1.5px_#d4af5f]">
              <span className="flex items-center justify-between">
                <span className="font-myeongjo text-xl text-gold">問</span>
                <HundoFace size={30} />
              </span>
              <span className="mt-1.5 font-myeongjo text-[18px] leading-tight font-extrabold">정 훈도에게 묻기</span>
              <span className="mt-1 flex-1 text-[12px] leading-snug text-hanji/75">내 고민 하나, 내 사주로 답서 받기</span>
              <span className="mt-2.5 flex items-center justify-between border-t border-gold/30 pt-2 text-[12px] font-bold">
                <span className="text-hanji/60">가입 선물 {JOIN_GIFT}개</span>
                <span className="text-gold">묻기 →</span>
              </span>
            </AskLink>
          ) : (
            <Link
              href={`/contact?topic=${encodeURIComponent("보고 싶은 풀이")}`}
              className="flex h-full flex-col rounded-2xl border-2 border-dashed border-jjok/30 bg-jjok/5 px-4 pt-4 pb-3.5"
            >
              <span className="font-myeongjo text-xl text-jjok/45">硏究</span>
              <span className="mt-1.5 font-myeongjo text-[18px] leading-tight font-extrabold text-jjok/80">공부 중</span>
              <span className="mt-1 flex-1 text-[12px] leading-snug text-ink-soft">정 훈도가 새 보고서를 준비하고 있어요</span>
            </Link>
          )}
        </li>
      </ul>

      <SectionTitle>훈도의 사주 이야기</SectionTitle>
      <ul className="card flex flex-col divide-y divide-ink/10 px-4">
        {publishedColumns()
          .slice(0, 3)
          .map((c) => (
            <li key={c.slug}>
              <Link href={`/column/${c.slug}`} className="flex items-center gap-2 py-3">
                <span className="min-w-0 flex-1 text-[14px] leading-snug font-bold">
                  <ColumnTitle title={c.title} />
                </span>
                <span className="shrink-0 text-ink-soft">›</span>
              </Link>
            </li>
          ))}
      </ul>
      <Link href="/column" className="mt-2 block text-center text-[13px] font-bold text-seal">
        이야기 전체 보기 →
      </Link>
    </div>
  );
}
