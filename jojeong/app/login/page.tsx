import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentMember, JOIN_GIFT, membersEnabled, VIA_COOKIE, viaEnabled, type Via } from "@/lib/members";
import { HundoFace } from "../ask/Letter";

export const metadata: Metadata = { title: "시작하기", robots: { index: false } };

// The way in: Kakao (with the joining gift), Naver, Google, whichever have their keys. The way this browser last
// used is marked, so someone who joined with one does not make a second account with another.
const WAYS: { via: Via; label: string; className: string; mark: React.ReactNode }[] = [
  {
    via: "kakao",
    label: "카카오로 로그인",
    className: "bg-[#FEE500] text-[#191919]",
    mark: (
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <path
          fill="#191919"
          d="M12 3.5c-5.25 0-9.5 3.3-9.5 7.38 0 2.64 1.77 4.95 4.43 6.26l-.9 3.3c-.08.3.26.53.52.36l3.94-2.6c.5.06 1 .1 1.51.1 5.25 0 9.5-3.3 9.5-7.42S17.25 3.5 12 3.5Z"
        />
      </svg>
    ),
  },
  {
    via: "naver",
    label: "네이버로 로그인",
    className: "bg-[#03C75A] text-white",
    mark: (
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path fill="#fff" d="M15.6 12.8 8.1 2H2v20h6.4V11.2L15.9 22H22V2h-6.4z" />
      </svg>
    ),
  },
  {
    via: "google",
    label: "구글로 로그인",
    className: "border border-ink/15 bg-white text-[#1f1f1f]",
    mark: (
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <path fill="#4285F4" d="M22.5 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.9a5.04 5.04 0 0 1-2.19 3.3v2.77h3.55c2.08-1.92 3.24-4.74 3.24-8.08Z" />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.55-2.76c-.99.66-2.25 1.05-3.73 1.05-2.87 0-5.3-1.94-6.16-4.54H2.18v2.84A11 11 0 0 0 12 23Z"
        />
        <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84Z" />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.07l3.66 2.84C6.7 7.31 9.13 5.38 12 5.38Z"
        />
      </svg>
    ),
  },
];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const q = await searchParams;
  const raw = typeof q.next === "string" ? q.next : "/ask";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw.slice(0, 200) : "/ask";
  if (!membersEnabled()) redirect("/");
  if (await currentMember().catch(() => null)) redirect(next);
  const last = (await cookies()).get(VIA_COOKIE)?.value;
  const ways = WAYS.filter((w) => viaEnabled(w.via));

  return (
    <section className="doc-paper mt-6 px-5 pt-7 pb-6 text-center">
      <div className="flex justify-center">
        <HundoFace size={64} />
      </div>
      <h1 className="mt-3 font-myeongjo text-xl font-extrabold">정 훈도의 사랑방에 드시옵소서</h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">로그인하면 산 보고서와 질문이 계정에 보관돼, 다른 기기에서도 그대로 열려요.</p>
      {(q.login === "fail" || q.login === "again") && (
        <p role="alert" className="mt-4 rounded-xl bg-seal/10 px-3 py-2 text-sm text-seal">
          로그인이 끝나지 않았어요. 다시 시도해 주세요.
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-2.5">
        {ways.map((w) => (
          <li key={w.via} className="relative">
            {last === w.via && (
              <span className="absolute -top-3 left-3 z-10 rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-bold text-hanji">
                최근에 이 방식으로 들어오셨어요
              </span>
            )}
            <a
              href={`/login/${w.via}?next=${encodeURIComponent(next)}`}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-bold ${w.className}`}
            >
              <span className="flex size-6 shrink-0 items-center justify-center">{w.mark}</span>
              <span className="flex-1">{w.label}</span>
              {w.via === "kakao" && <span className="shrink-0 rounded-full bg-[#191919]/10 px-2 py-0.5 text-[11px]">처음이면 질문 {JOIN_GIFT}개</span>}
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col gap-1 text-[11.5px] leading-relaxed text-ink-soft">
        {ways.length > 1 && <p>처음 가입한 방식으로 들어오셔야 질문과 보고서가 그대로 있어요.</p>}
        <p>{ways.length > 1 ? "받는 정보는 회원 번호, 별명, 이메일뿐이에요." : "받는 정보는 회원 번호와 별명뿐이에요."} 생년월일은 저장하지 않아요.</p>
        {ways.length > 1 && <p>질문 선물은 카카오로 처음 로그인하실 때 한 번 드려요.</p>}
      </div>
    </section>
  );
}
