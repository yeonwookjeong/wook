import type { Metadata } from "next";
import Link from "next/link";
import RoyalDoc from "@/components/RoyalDoc";
import { BUSINESS } from "@/lib/business";
import ContactForm from "./ContactForm";
import { INQUIRY_TOPICS } from "./topics";

export const metadata: Metadata = { title: "문의하기" };

// No phone support. A question is written and sent right on this page (kept for the owner's inbox at /admin);
// one that needs a screenshot can still go by mail, with a subject and the useful lines filled in.
const mailto = (topic: (typeof INQUIRY_TOPICS)[number]) =>
  `mailto:${BUSINESS.email}?subject=${encodeURIComponent(`[훈도사주] ${topic.key} 문의`)}&body=${encodeURIComponent(
    [...topic.body, "화면 캡처가 있으면 첨부해 주세요."].join("\n") + "\n",
  )}`;

// ?topic= opens the form on that topic (the home page's "공부 중" tile asks for 보고 싶은 풀이).
export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const { topic } = await searchParams;
  return (
    <RoyalDoc paperClassName="px-5">
      <p className="text-center font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">上 疏</p>
      <h1 className="mt-2 text-center font-myeongjo text-2xl font-extrabold">문의하기</h1>
      <p className="mt-2 text-center text-sm leading-relaxed text-ink-soft">
        전화 상담은 하지 않아요. 여기서 바로 적어 보내 주세요.
        <br />
        영업일 1~2일 안에 확인해요.
      </p>

      <div className="mt-5">
        <ContactForm initial={typeof topic === "string" ? topic : undefined} />
      </div>

      <details className="group mt-6 border-t border-seal/20 pt-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold [&::-webkit-details-marker]:hidden">
          화면 캡처를 보내야 하면 메일로 보내기
          <span className="text-ink-soft transition group-open:rotate-180" aria-hidden="true">
            ▾
          </span>
        </summary>
        <ul className="mt-3 flex flex-col gap-2">
          {INQUIRY_TOPICS.map((t) => (
            <li key={t.key}>
              <a href={mailto(t)} className="flex items-center gap-3 border border-seal/30 bg-white/60 px-4 py-3">
                <span className="flex-1 font-myeongjo font-extrabold">{t.key}</span>
                <span className="font-myeongjo text-sm font-extrabold text-seal">메일 쓰기 →</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-relaxed">
          메일 앱이 열리지 않으면 <b className="select-all">{BUSINESS.email}</b>으로 직접 보내 주세요.
        </p>
      </details>

      <p className="mt-5 text-xs text-ink-soft">
        환불 기준은{" "}
        <Link href="/refund" className="underline">
          환불 규정
        </Link>
        에 적어 두었어요.
      </p>
    </RoyalDoc>
  );
}
