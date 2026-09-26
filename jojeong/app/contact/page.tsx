import type { Metadata } from "next";
import Link from "next/link";
import RoyalDoc from "@/components/RoyalDoc";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = { title: "문의하기" };

// No phone support: every question goes to one inbox. Each topic opens the visitor's mail app with a subject and a
// form already filled in, so replies can be sorted and refunds have what they need. Nothing is stored on our side.
const TOPICS = [
  {
    key: "결제·환불",
    desc: "결제가 됐는데 보고서가 안 열리거나, 환불을 원하실 때",
    body: ["결제일:", "결제 금액:", "보고서 이름:", "결제 수단(카드사 등):", "요청 내용:"],
  },
  {
    key: "보고서 링크 분실",
    desc: "보고서 링크를 잃어버렸거나 다른 기기에서 보고 싶을 때",
    body: ["결제일:", "결제 금액:", "보고서 이름:", "받는 분 이름(보고서에 적힌 이름):"],
  },
  {
    key: "오류 신고",
    desc: "화면이 이상하거나 결과가 나오지 않을 때",
    body: ["어느 화면에서:", "무엇을 눌렀을 때:", "휴대폰/브라우저 종류:", "화면 캡처가 있으면 첨부해 주세요."],
  },
  {
    key: "기타·제휴",
    desc: "그 밖의 문의, 제안, 제휴",
    body: ["문의 내용:"],
  },
];

const mailto = (topic: (typeof TOPICS)[number]) =>
  `mailto:${BUSINESS.email}?subject=${encodeURIComponent(`[왕이 될 사주] ${topic.key} 문의`)}&body=${encodeURIComponent(
    topic.body.join("\n") + "\n",
  )}`;

export default function ContactPage() {
  return (
    <RoyalDoc paperClassName="px-5">
      <p className="text-center font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">上 疏</p>
      <h1 className="mt-2 text-center font-myeongjo text-2xl font-extrabold">문의하기</h1>
      <p className="mt-2 text-center text-sm leading-relaxed text-ink-soft">
        전화 상담은 하지 않사옵니다. 아래에서 문의 종류를 고르시면 양식이 채워진 메일이 열리옵니다.
        <br />
        영업일 1~2일 안에 답을 올리겠사옵니다.
      </p>

      <ul className="mt-5 flex flex-col gap-2">
        {TOPICS.map((t) => (
          <li key={t.key}>
            <a href={mailto(t)} className="flex items-center gap-3 border border-seal/30 bg-white/60 px-4 py-3">
              <span className="flex-1">
                <span className="block font-myeongjo font-extrabold">{t.key}</span>
                <span className="mt-0.5 block text-xs leading-snug text-ink-soft">{t.desc}</span>
              </span>
              <span className="font-myeongjo text-sm font-extrabold text-seal">메일 쓰기 →</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-5 bg-seal/5 px-4 py-3 text-sm leading-relaxed">
        <p>
          메일 앱이 열리지 않으면 <b className="select-all">{BUSINESS.email}</b>으로 직접 보내 주시옵소서.
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          환불 기준은{" "}
          <Link href="/refund" className="underline">
            환불 규정
          </Link>
          에 적어 두었사옵니다.
        </p>
      </div>
    </RoyalDoc>
  );
}
