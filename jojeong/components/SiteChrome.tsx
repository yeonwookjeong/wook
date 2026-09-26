import Link from "next/link";
import { BUSINESS, ftcLookupUrl, hasBusinessInfo } from "@/lib/business";

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

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between pt-4">
      <Link href="/" className="flex items-center gap-2">
        <Seal />
        <span className="flex flex-col">
          <span className="font-myeongjo text-[15px] leading-tight font-extrabold">관상감 정 훈도</span>
          <span className="text-[10px] leading-tight text-ink-soft">조선 최고의 사주쟁이</span>
        </span>
      </Link>
      <Link href="/reports" className="border border-seal/40 px-2.5 py-1 font-myeongjo text-xs font-extrabold text-seal">
        비밀 보고서
      </Link>
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
  { href: "/reports", label: "비밀 보고서" },
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
          <span className="font-myeongjo text-base font-extrabold">관상감 정 훈도</span>
        </Link>
        <Link href="/" className="mt-4 rounded-full bg-seal px-5 py-2.5 font-myeongjo text-sm font-extrabold text-hanji">
          왕이 될 사주 처음으로
        </Link>
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
              전화 상담은 하지 않사옵니다.{" "}
              <Link href="/contact" className="underline">
                문의하기
              </Link>
              로 남겨 주시옵소서.
            </p>
          </section>
        </div>
      ) : (
        <p className="mt-8 text-center text-xs text-ink-soft/80">사업자 정보는 유료 보고서 판매를 시작할 때 이곳에 표시되옵니다.</p>
      )}

      <nav className="mt-7 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-ink/10 pt-5 text-[13px] text-ink-soft">
        {FOOTER_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={l.strong ? "font-bold text-ink" : undefined}>
            {l.label}
          </Link>
        ))}
      </nav>
      <p className="mt-5 text-center text-[11px] leading-relaxed text-ink-soft/70">
        재미로 보는 사주 콘텐츠이옵니다. 진짜 간신은 행동으로 가려내시옵소서.
        <br />© {new Date().getFullYear()} {BUSINESS.name || "관상감 정 훈도"}. All rights reserved.
      </p>
    </footer>
  );
}
