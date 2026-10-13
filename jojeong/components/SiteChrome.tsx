import { openNow } from "@/lib/launch";
import Link from "next/link";
import SnsLinks from "./SnsLinks";
import FooterAd from "./FooterAd";
import { BUSINESS, ftcLookupUrl, hasBusinessInfo } from "@/lib/business";
import { ownedOrderIds } from "@/lib/pay";
import { askShown, currentMember, memberNo, membersEnabled, VIA_LABEL, viaOf } from "@/lib/members";
import AskLink from "./AskLink";

// The brand mark: a red 訓導 seal beside the character's name. Used at the top and bottom of every page.
function Seal({ size = 30 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 -rotate-6 flex-col items-center justify-center rounded-[5px] border-2 border-seal font-myeongjo leading-none font-extrabold text-seal"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      aria-hidden="true"
    >
      <span>訓</span>
      <span>導</span>
    </span>
  );
}

// 내 보고서 sits at the top of every page, with how many this browser bought: a buyer must find them again.
// 묻기 leads to 정 훈도에게 묻기, with the questions left once signed in.
export async function SiteHeader() {
  const bought = (await ownedOrderIds().catch(() => [])).length;
  const member = membersEnabled() ? await currentMember().catch(() => null) : null;
  const ask = membersEnabled() && (await askShown());
  // The new header (from the opening, with the new home): the name alone, 묻기 as one pill, the rest in a menu.
  if (await openNow())
    return (
      <header className="flex items-center justify-between pt-4">
        <Link href="/" className="flex items-center gap-2">
          <Seal />
          <span className="font-myeongjo text-[16px] font-extrabold">훈도사주</span>
        </Link>
        <nav className="flex items-center gap-2">
          {ask && (
            <AskLink from="header" className="flex items-center gap-1.5 rounded-full bg-jjok px-3 py-1.5 font-myeongjo text-[12.5px] font-extrabold text-hanji">
              묻기
              {member && member.credits > 0 && <span className="rounded-full bg-[#d4af5f] px-1.5 text-[10.5px] leading-4 text-jjok">{member.credits}</span>}
            </AskLink>
          )}
          <details className="group relative">
            <summary aria-label="메뉴" className="flex size-9 cursor-pointer list-none items-center justify-center rounded-xl border border-ink/15 text-[17px]">
              <span className="group-open:hidden">≡</span>
              <span className="hidden group-open:inline">✕</span>
              {bought > 0 && <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-seal" />}
            </summary>
            <div className="card absolute top-11 right-0 z-30 flex w-56 flex-col py-1.5 text-[14px] font-bold">
              {/* Who is signed in (or the way to sign in), so the reader always knows. */}
              {membersEnabled() &&
                (member ? (
                  <div className="mx-2 mb-1 rounded-lg bg-ink/5 px-3 py-2.5 font-normal">
                    <span className="block text-[13.5px] font-bold">
                      {member.nick}님 <span className="text-[11px] font-normal text-ink-soft">· {VIA_LABEL[viaOf(member.id)]} 로그인 중</span>
                    </span>
                    <span className="block text-[11.5px] text-ink-soft">
                      회원 번호 {memberNo(member.id)} · 남은 질문 {member.credits}개
                    </span>
                  </div>
                ) : (
                  <Link href="/login" className="mx-2 mb-1 rounded-lg bg-jjok px-3 py-2.5 text-center text-[13.5px] text-hanji">
                    로그인 · 가입
                    <span className="block text-[11px] font-normal opacity-75">산 보고서를 계정에 보관해요</span>
                  </Link>
                ))}
              {[
                ["/my", `내 보고서${bought ? ` · ${bought}` : ""}`],
                ["/reports", "전체 보고서"],
                ...(ask ? [["/ask", member ? `정 훈도에게 묻기 · 남은 ${member.credits}` : "정 훈도에게 묻기"]] : []),
                ["/news", "새 소식"],
                ["/contact", "문의하기"],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="px-4 py-2.5 hover:bg-ink/5">
                  {label}
                </Link>
              ))}
              {member && (
                <a href="/logout" className="mt-1 border-t border-ink/10 px-4 pt-2.5 pb-1.5 text-[13px] font-normal text-ink-soft">
                  로그아웃
                </a>
              )}
            </div>
          </details>
        </nav>
      </header>
    );
  return (
    <header className="flex items-center justify-between pt-4">
      <Link href="/" className="flex items-center gap-2">
        <Seal />
        <span className="flex flex-col">
          <span className="font-myeongjo text-[15px] leading-tight font-extrabold">훈도사주</span>
          <span className="text-[10px] leading-tight text-ink-soft">관상감 명과학 훈도 정가</span>
        </span>
      </Link>
      <nav className="flex items-center gap-1.5">
        {ask && (
          <AskLink from="header" className="flex items-center gap-1 bg-jjok px-2.5 py-1 font-myeongjo text-xs font-extrabold text-hanji">
            묻기
            {member && member.credits > 0 && <span className="rounded-full bg-[#d4af5f] px-1.5 text-[10px] leading-4 text-jjok">{member.credits}</span>}
          </AskLink>
        )}
        <Link
          href="/my"
          className={`flex items-center gap-1 px-2.5 py-1 font-myeongjo text-xs font-extrabold ${bought ? "bg-seal text-hanji" : "border border-ink/20 text-ink-soft"}`}
        >
          내 보고서
          {bought > 0 && <span className="rounded-full bg-hanji px-1.5 text-[10px] leading-4 text-seal">{bought}</span>}
        </Link>
        <Link href="/reports" className="border border-seal/40 px-2.5 py-1 font-myeongjo text-xs font-extrabold text-seal">
          전체 보고서
        </Link>
      </nav>
    </header>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="flex gap-2">
      <span className="shrink-0 text-ink-soft/70">{label}</span>
      <span className="min-w-0">{children}</span>
    </p>
  );
}

const FOOTER_LINKS: { href: string; label: string; strong?: boolean }[] = [
  { href: "/reports", label: "전체 보고서" },
  { href: "/my", label: "내 보고서" },
  { href: "/terms", label: "이용약관" },
  { href: "/refund", label: "환불 규정" },
  { href: "/contact", label: "문의하기" },
  { href: "/privacy", label: "개인정보처리방침", strong: true },
];

export function SiteFooter() {
  return (
    <footer className="mt-14 border-t border-seal/20 pt-7 pb-4">
      <div className="flex flex-col items-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <Seal size={34} />
          <span className="font-myeongjo text-base font-extrabold">훈도사주</span>
        </Link>
        {/* The site is 훈도사주; 정 훈도 is the reader who writes the readings. Said once, so the two never blur. */}
        <p className="mt-1.5 text-center text-[11px] text-ink-soft">풀이는 조선 관상감의 명과학 훈도, 정 훈도가 맡아요</p>
        <SnsLinks />
        <Link href="/" className="mt-4 rounded-full bg-seal px-5 py-2.5 font-myeongjo text-sm font-extrabold text-hanji">
          훈도사주 처음으로
        </Link>
        <FooterAd />
      </div>

      {hasBusinessInfo() ? (
        <div className="mt-8 flex flex-col gap-6 px-1 text-[13px] leading-relaxed text-ink-soft">
          <section>
            <h2 className="mb-2 text-[15px] font-bold text-ink">{BUSINESS.name}</h2>
            <Row label="대표">{BUSINESS.ceo}</Row>
            <Row label="사업자등록번호">{BUSINESS.regNo}</Row>
            <Row label="통신판매업">
              {BUSINESS.mailOrderNo}{" "}
              <a href={ftcLookupUrl()} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap underline">
                사업자정보 확인
              </a>
            </Row>
            <Row label="주소">{BUSINESS.address}</Row>
            <Row label="호스팅">{BUSINESS.hosting}</Row>
          </section>
          <section>
            <h2 className="mb-2 text-[15px] font-bold text-ink">고객센터</h2>
            <p>
              <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
            </p>
            <p>{BUSINESS.phone}</p>
            <p className="mt-1 text-xs text-ink-soft/70">
              전화 상담은 하지 않아요.{" "}
              <Link href="/contact" className="underline">
                문의하기
              </Link>
              로 남겨 주세요.
            </p>
          </section>
        </div>
      ) : (
        <p className="mt-8 text-center text-xs text-ink-soft/80">사업자 정보는 유료 보고서 판매를 시작할 때 이곳에 표시돼요.</p>
      )}

      <nav className="mt-7 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-ink/10 pt-5 text-[13px] text-ink-soft">
        {FOOTER_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={l.strong ? "font-bold text-ink" : undefined}>
            {l.label}
          </Link>
        ))}
      </nav>
      <p className="mt-5 text-center text-[11px] leading-relaxed text-ink-soft/70">
        사주 풀이는 나를 돌아보는 참고용이에요. 중요한 결정은 스스로 내려 주세요.
        <br />© {new Date().getFullYear()} {BUSINESS.name || "훈도사주"}. All rights reserved.
      </p>
    </footer>
  );
}
