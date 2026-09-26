import Link from "next/link";
import { BUSINESS, hasBusinessInfo } from "@/lib/business";

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

export function SiteFooter() {
  return (
    <footer className="mt-14 border-t border-seal/20 pt-6 pb-4 text-center">
      <Link href="/" className="inline-flex items-center gap-2">
        <Seal size={34} />
        <span className="font-myeongjo text-base font-extrabold">관상감 정 훈도</span>
      </Link>
      <Link
        href="/"
        className="mx-auto mt-4 block w-fit rounded-full bg-seal px-5 py-2.5 font-myeongjo text-sm font-extrabold text-hanji"
      >
        왕이 될 사주 처음으로
      </Link>
      <nav className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-ink-soft">
        <Link href="/reports">비밀 보고서</Link>
        <span aria-hidden="true">·</span>
        <Link href="/terms">이용약관</Link>
        <span aria-hidden="true">·</span>
        <Link href="/refund">환불 규정</Link>
        <span aria-hidden="true">·</span>
        <Link href="/privacy" className="font-bold">
          개인정보처리방침
        </Link>
      </nav>
      <div className="mt-4 text-[11px] leading-relaxed text-ink-soft/80">
        {hasBusinessInfo() ? (
          <>
            <p>
              상호 {BUSINESS.name} · 대표 {BUSINESS.ceo} · 사업자등록번호 {BUSINESS.regNo}
            </p>
            <p>
              통신판매업 신고 {BUSINESS.mailOrderNo} · {BUSINESS.address}
            </p>
            <p>
              고객문의 {BUSINESS.phone} · {BUSINESS.email} · 호스팅 {BUSINESS.hosting}
            </p>
          </>
        ) : (
          <p>사업자 정보는 유료 보고서 판매를 시작할 때 이곳에 표시되옵니다.</p>
        )}
        <p className="mt-2">재미로 보는 사주 콘텐츠이옵니다. 진짜 간신은 행동으로 가려내시옵소서.</p>
      </div>
    </footer>
  );
}
